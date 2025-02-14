import { Check as CheckRaw } from 'generated/check/v0alpha1/check_object_gen';
import { ReportFailure } from 'generated/check/v0alpha1/types.status.gen';
import { CheckClient } from 'api/check_client';
import { CheckTypeClient } from 'api/checktype_client';
import { CheckSummary, Severity } from 'types';
import { Spec as SpecRaw } from 'generated/checktype/v0alpha1/types.spec.gen';

const checkClient = new CheckClient();
const checkTypeClient = new CheckTypeClient();

// Transforms the data into a structure that is easier to work with on the frontend
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

    // Successful checks
    // (The concept of a "successful check" only exists on the frontend, so we need to fill them out here.)
    checkSummary.success.checks[checkType].issueCount = check.status.report.count;
    for (const step of Object.keys(checkSummary.success.checks[checkType].steps)) {
      checkSummary.success.checks[checkType].steps[step].issueCount = check.status.report.count;
    }

    // Last checked time (we take the oldest timestamp)
    // TODO - we could do a much more sophisticated way of doing this
    const updatedTimestamp = new Date(check.metadata.annotations!['grafana.app/updatedTimestamp']);
    const prevUpdatedTimestamp = checkSummary[Severity.High].updated;
    if (updatedTimestamp < prevUpdatedTimestamp) {
      checkSummary[Severity.High].updated = updatedTimestamp;
      checkSummary[Severity.High].updated = updatedTimestamp;
      checkSummary[Severity.High].updated = updatedTimestamp;
    }

    // Handle failures
    if (check.status.report.failures) {
      // Loop through each failure
      for (const failure of check.status.report.failures) {
        // Adjust successful counts
        checkSummary.success.checks[checkType].issueCount--;
        checkSummary.success.checks[checkType].steps[failure.stepID].issueCount--;

        const severity = failure.severity as Severity;
        const persistedCheck = checkSummary[severity].checks[checkType];
        const persistedStep = checkSummary[severity].checks[checkType].steps[failure.stepID];
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

export async function getEmptyCheckSummary(): Promise<Record<Severity, CheckSummary>> {
  const checkTypes = await getCheckTypes();
  const generateChecks = () =>
    Object.values(checkTypes).reduce(
      (acc, checkType) => ({
        ...acc,
        [checkType.name]: {
          name: checkType.name,
          description: '',
          issueCount: 0,
          steps: checkType.steps.reduce(
            (acc, step) => ({
              ...acc,
              [step.stepID]: {
                name: step.title,
                description: step.description,
                stepID: step.stepID,
                issueCount: 0,
                issues: [],
              },
            }),
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
      severity: Severity.High,
      checks: generateChecks(),
      updated: new Date(),
    },
    low: {
      name: 'Investigation needed',
      description: 'These checks require further investigation.',
      severity: Severity.Low,
      checks: generateChecks(),
      updated: new Date(),
    },
    success: {
      name: 'All good',
      description: 'No issues found.',
      severity: Severity.Success,
      checks: generateChecks(),
      updated: new Date(),
    },
  };
}

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

export function deleteChecks(name?: string) {
  return checkClient.delete(name);
}
