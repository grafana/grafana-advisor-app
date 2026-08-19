import { t } from '@grafana/i18n';
import { CheckStatus } from 'types';

export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date).replace(',', ' -');
}

export const isOld = (check: CheckStatus) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return tenMinutesAgo > check.lastUpdate;
};

// tBackend resolves a translation for a user-facing string the backend owns
// (check step titles, descriptions, resolutions, check type names, and
// failure-link messages). Callers construct the key from IDs already present
// in the API response — see the callers in api.ts / CheckTypeItem.tsx /
// IssueDescription.tsx for the specific conventions.
//
// If the key isn't found in the loaded /translations map (e.g. the backend
// hasn't shipped that locale yet), tBackend returns fallback — the backend's
// English rendered by the Go step's Description()/Resolution()/Run() code.
//
// i18next's t() extractor only sees static literals; these dynamic keys are
// intentionally not extracted into the frontend's own locale files. The
// backend owns them and ships them via /translations at runtime.
export function tBackend(key: string, fallback: string): string {
  return t(key, fallback);
}
