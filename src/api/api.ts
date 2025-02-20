import { Check as CheckRaw } from 'generated/check/v0alpha1/check_object_gen';
import { ReportFailure } from 'generated/check/v0alpha1/types.status.gen';
import { CheckClient } from 'api/check_client';
import { CheckTypeClient } from 'api/checktype_client';
import { CheckSummaries, Severity } from 'types';
import { Spec as SpecRaw } from 'generated/checktype/v0alpha1/types.spec.gen';
import { getEmptyCheckSummary } from 'utils';

const checkClient = new CheckClient();
const checkTypeClient = new CheckTypeClient();

// Transforms the data into a structure that is easier to work with on the frontend
export async function getCheckSummaries(): Promise<CheckSummaries> {
  const checks = await getLastChecks();
  const checkTypes = await getCheckTypes();
  const checkSummary = getEmptyCheckSummary(checkTypes);

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

    checkSummary[Severity.High].checks[checkType].totalCheckCount = check.status.report.count;

    // Last checked time (we take the latest timestamp)
    // This assumes that the checks are created in batches so a batch will have a similar creation time
    const updatedTimestamp = new Date(check.metadata.annotations!['grafana.app/updatedTimestamp']);
    const prevUpdatedTimestamp = checkSummary[Severity.High].updated;
    if (updatedTimestamp > prevUpdatedTimestamp) {
      checkSummary[Severity.High].updated = updatedTimestamp;
      checkSummary[Severity.Low].updated = updatedTimestamp;
    }

    // Handle failures
    if (check.status.report.failures) {
      // Loop through each failure
      for (const failure of check.status.report.failures) {
        const severity = failure.severity as Severity;
        const persistedCheck = checkSummary[severity].checks[checkType];
        const persistedStep = checkSummary[severity].checks[checkType].steps[failure.stepID];
        persistedCheck.issueCount++;
        persistedStep.issueCount++;
        persistedStep.issues.push(failure);
      }
    }
  }

  return checkSummary;
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

export async function getCheck(name: string): Promise<CheckRaw> {
  const response = await checkClient.get(name);

  return response.data;
}

// Temporary (should be called only from the backend in the future)
export function createChecks(type: 'datasource' | 'plugin') {
  return checkClient.create(type);
}

export function deleteChecks(name?: string) {
  return checkClient.delete(name);
}

export async function waitForChecks(names: string[]) {
  return new Promise((resolve) => {
    let namesToWaitFor = names;
    const interval = setInterval(async () => {
      const checks = await Promise.all(namesToWaitFor.map((name) => getCheck(name)));
      const incompleteChecks = checks.filter((c) => !c.metadata.annotations?.['advisor.grafana.app/status']);
      namesToWaitFor = incompleteChecks.map((c) => c.metadata.name);

      if (namesToWaitFor.length === 0) {
        clearInterval(interval);
        resolve(undefined);
      }
    }, 2000);
  });
}
