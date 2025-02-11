import { Check as CheckRaw } from 'generated/check/v0alpha1/check_object_gen';
import { ReportFailure } from 'generated/check/v0alpha1/types.status.gen';
import { CheckClient } from 'api/check_client';
import { CheckTypeClient } from 'api/checktype_client';
import { CheckSummary, Severity } from 'types';
import { Spec as SpecRaw } from 'generated/checktype/v0alpha1/types.spec.gen';

const checkClient = new CheckClient();
const checkTypeClient = new CheckTypeClient();

export async function getCheckTypes(): Promise<Record<string, SpecRaw>> {
  const checkTypesRaw = await checkTypeClient.list();

  return checkTypesRaw.data.items.reduce(
    (acc, checkType) => ({
      ...acc,
      [checkType.metadata.name]: {
        name: checkType.spec.name,
        steps: checkType.spec.steps,
      },
    }),
    {}
  );
}

export async function getEmptyCheckSummary(): Promise<Record<Severity, CheckSummary>> {
  const checkTypes = await getCheckTypes();
  const checks = Object.values(checkTypes).reduce(
    (acc, checkType) => ({
      ...acc,
      [checkType.name]: {
        name: checkType.name,
        description: '',
        issueCount: 0,
        steps: checkType.steps.reduce(
          (acc, step) => ({ ...acc, [step.stepID]: { ...step, issueCount: 0, issues: [] } }),
          {}
        ),
      },
    }),
    {}
  );

  return {
    high: {
      name: 'Action needed',
      description: 'These checks require immediate action.',
      severity: 'high',
      checks,
    },
    low: {
      name: 'Investigation needed',
      description: 'These checks require further investigation.',
      severity: 'low',
      checks,
    },
    success: {
      name: 'All is good',
      description: 'No issues found.',
      severity: 'success',
      checks,
    },
  };
}

export async function getCheckSummaries(): Promise<Record<Severity, CheckSummary>> {
  const checks = await getLastChecks();
  const checkSummary = await getEmptyCheckSummary();

  // Loop through checks by type
  for (const check of checks) {
    const checkType = check.metadata.labels!['advisor.grafana.app/type'];

    if (checkType === undefined) {
      console.error(
        'No type found for check under "check.metadata.labels[advisor.grafana.app/type]", skipping.',
        check
      );
      continue;
    }

    // Prefill the successfull count
    // (We will deduct from it the number of issues found in the check)
    checkSummary.success.checks[checkType].issueCount = check.status.report.count;

    // Handle failures
    if (check.status.report.failures) {
      // Loop through each failure
      for (const failure of check.status.report.failures) {
        const severity = failure.severity as Severity;
        const persistedCheck = checkSummary[severity].checks[checkType];
        const persistedStep = checkSummary[severity].checks[checkType].steps[failure.stepID];

        checkSummary.success.checks[checkType].issueCount--;
        checkSummary.success.checks[checkType].steps[failure.stepID].issueCount--;
        persistedCheck.issueCount++;
        persistedStep.issueCount++;
        persistedStep.issues.push({
          severity,
          reason: failure.reason,
          action: failure.action,
          itemID: failure.itemID,
        });
      }
    }
  }

  return checkSummary;
}

// Returns the latest checks grouped by severity ("high", "low")
export async function getChecksBySeverity() {
  const checksBySeverity: Record<Severity, Record<string, { count: number; errors: ReportFailure[] }>> = {
    high: {},
    low: {},
    success: {},
  };
  const checks = await getLastChecks();

  for (const check of checks) {
    const checkType = check.metadata.labels!['advisor.grafana.app/type'];

    if (checkType === undefined) {
      console.error(
        'No type found for check under "check.metadata.labels[advisor.grafana.app/type]", skipping.',
        check
      );
      continue;
    }

    for (const error of check.status.report.failures) {
      const severity = error.severity as Severity;
      if (checksBySeverity[severity][checkType] === undefined) {
        checksBySeverity[error.severity][checkType] = {
          count: check.status.report.count,
          errors: [],
        };
      }

      checksBySeverity[error.severity][checkType].errors.push(error);
    }
  }

  return checksBySeverity;
}

export async function getLastChecks(): Promise<CheckRaw[]> {
  const checkByType: Record<string, CheckRaw> = {};
  const checks = await getChecks();

  for (const check of checks) {
    const type = check.metadata.labels?.['advisor.grafana.app/type'];
    const getUpdatedTimestamp = (check: CheckRaw) => check.metadata.annotations?.['grafana.app/updatedTimestamp'];

    if (!type) {
      console.log('No type found for check, skipping.', check);
      continue;
    }

    if (!getUpdatedTimestamp(check)) {
      console.log(
        'Empty updateTimestamp for check at "check.metadata.annotations?.[\'advisor.grafana.app/updatedTimestamp\']", skipping.',
        check
      );
      continue;
    }

    // If the check is the first one of its type, store it
    if (!checkByType[type]) {
      checkByType[type] = check;
      continue;
    }

    const prevTimestamp = getUpdatedTimestamp(checkByType[type])!;
    const currentTimestamp = getUpdatedTimestamp(check)!;

    if (currentTimestamp > prevTimestamp) {
      checkByType[type] = check;
    }
  }

  return Object.values(checkByType);
}

export async function getChecks(): Promise<CheckRaw[]> {
  const response = await checkClient.list();

  return response.data.items;
}

// Temporary (should be called only from the backend in the future)
export function createChecks(type: 'datasource' | 'plugin') {
  return checkClient.create(type);
}
