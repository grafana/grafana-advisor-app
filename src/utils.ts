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

// tBackend resolves a translation key that the backend has assigned to a
// user-facing string it emits (step titles, descriptions, resolutions, and
// failure-link messages). If key is missing (older backend, or the specific
// string is not translated yet), it returns fallback — the backend's English.
//
// i18next's t() extractor only sees static literals, so these dynamic keys
// aren't extracted into locale files. That's intentional: the backend owns
// these strings and ships them via the /translations endpoint at runtime.
export function tBackend(key: string | undefined, fallback: string): string {
  if (!key) {
    return fallback;
  }
  return t(key, fallback);
}
