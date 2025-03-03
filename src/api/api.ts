import { Check as CheckRaw } from 'generated/check/v0alpha1/check_object_gen';
import { ReportFailure } from 'generated/check/v0alpha1/types.status.gen';
import { CheckClient } from 'api/check_client';
import { CheckTypeClient } from 'api/checktype_client';
import { CheckSummaries, Severity } from 'types';
import { Spec as SpecRaw } from 'generated/checktype/v0alpha1/types.spec.gen';

const checkClient = new CheckClient();
const checkTypeClient = new CheckTypeClient();

const UPDATE_TIMESTAMP_ANNOTATION = 'grafana.app/updatedTimestamp';
const STATUS_ANNOTATION = 'advisor.grafana.app/status';
const TYPE_LABEL = 'advisor.grafana.app/type';

// Transforms the data into a structure that is easier to work with on the frontend
export async function getCheckSummaries(): Promise<CheckSummaries> {
  const checks = await getLastChecks();
  const checkSummary = await getEmptyCheckSummary();

  // Loop through checks by type
  for (const check of checks) {
    const checkType = check.metadata.labels?.[TYPE_LABEL];

    if (checkType === undefined) {
      // No type found for check under "check.metadata.labels[advisor.grafana.app/type]", skipping.
      continue;
    }

    checkSummary[Severity.High].checks[checkType].totalCheckCount = check.status.report.count;

    // Last checked time (we take the latest timestamp)
    // This assumes that the checks are created in batches so a batch will have a similar creation time
    const updatedTimestamp = new Date(check.metadata.annotations![UPDATE_TIMESTAMP_ANNOTATION]);
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

export async function getEmptyCheckSummary(): Promise<CheckSummaries> {
  const checkTypes = await getCheckTypes();
  const generateChecks = () =>
    Object.values(checkTypes).reduce(
      (acc, checkType) => ({
        ...acc,
        [checkType.name]: {
          name: checkType.name,
          description: '',
          totalCheckCount: 0,
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
                resolution: step.resolution,
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
      updated: new Date(0),
    },
    low: {
      name: 'Investigation needed',
      description: 'These checks require further investigation.',
      severity: Severity.Low,
      checks: generateChecks(),
      updated: new Date(0),
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
  };
  const checks = await getLastChecks();

  for (const check of checks) {
    const checkType = check.metadata.labels?.[TYPE_LABEL];

    if (checkType === undefined) {
      // No type found for check under "check.metadata.labels[advisor.grafana.app/type]", skipping.
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
    const type = check.metadata.labels?.[TYPE_LABEL];
    const getUpdatedTimestamp = (check: CheckRaw) => check.metadata.annotations?.[UPDATE_TIMESTAMP_ANNOTATION];

    if (!type) {
      // No type found for check under "check.metadata.labels[advisor.grafana.app/type]", skipping.
      continue;
    }

    if (!getUpdatedTimestamp(check)) {
      // Empty updateTimestamp for check at "check.metadata.annotations?.['advisor.grafana.app/updatedTimestamp']", skipping.
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

async function getIncompleteChecks(names?: string[]): Promise<string[]> {
  let checks: CheckRaw[] = [];
  if (!names) {
    checks = await getChecks();
  } else {
    checks = await Promise.all(names.map((name) => getCheck(name)));
  }
  const incompleteChecks = checks.filter((c) => !c.metadata.annotations?.[STATUS_ANNOTATION]);
  return incompleteChecks.map((c) => c.metadata.name);
}

export async function waitForChecks(names?: string[]) {
  return new Promise(async (resolve) => {
    let namesToWaitFor = await getIncompleteChecks(names);
    if (namesToWaitFor.length === 0) {
      resolve(undefined);
      return;
    }
    const interval = setInterval(async () => {
      namesToWaitFor = await getIncompleteChecks(names);
      if (namesToWaitFor.length === 0) {
        clearInterval(interval);
        resolve(undefined);
      }
    }, 2000);
  });
}
