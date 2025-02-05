import { Check } from 'generated/check/v0alpha1/check_object_gen';
import { CheckClient } from 'api/check_client';
import { ReportError, Severity } from 'types';

const client = new CheckClient();

// Returns the latest checks grouped by severity ("high", "low")
export async function getChecksBySeverity() {
  const checksBySeverity: Record<Severity, Record<string, { count: number; errors: ReportError[] }>> = {
    high: {},
    low: {},
  };
  const checks = await getLastChecks();

  for (const check of checks) {
    const type = check.metadata.labels!['advisor.grafana.app/type'];

    if (type === undefined) {
      console.error(
        'No type found for check under "check.metadata.labels[advisor.grafana.app/type]", skipping.',
        check
      );
      continue;
    }

    for (const error of check.status.report.errors) {
      if (checksBySeverity[error.severity][type] === undefined) {
        checksBySeverity[error.severity][type] = {
          count: check.status.report.count,
          errors: [],
        };
      }

      checksBySeverity[error.severity][type].errors.push(error);
    }
  }

  return checksBySeverity;
}

export async function getLastChecks(): Promise<Check[]> {
  const checkByType: Record<string, Check> = {};
  const checks = await getChecks();

  for (const check of checks) {
    const type = check.metadata.labels?.['advisor.grafana.app/type'];
    const getUpdatedTimestamp = (check: Check) => check.metadata.annotations?.['advisor.grafana.app/updatedTimestamp'];

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

export async function getChecks(): Promise<Check[]> {
  const response = await client.list();

  return response.data.items;
}

// Temporary (should be called only from the backend in the future)
export function createChecks(type: 'datasource' | 'plugin') {
  return client.create(type);
}
