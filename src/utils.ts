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

// Translation helpers for backend strings.
// The backend returns English text; the frontend translates it using known IDs as keys.

export function translateStepTitle(stepID: string, fallback: string): string {
  return t(`backend.step.${stepID}.title`, fallback);
}

export function translateStepDescription(stepID: string, fallback: string): string {
  return t(`backend.step.${stepID}.description`, fallback);
}

export function translateStepResolution(stepID: string, fallback: string): string {
  return t(`backend.step.${stepID}.resolution`, fallback);
}

export function translateCheckTypeName(checkTypeID: string, fallback: string): string {
  return t(`backend.check-type.${checkTypeID}.name`, fallback);
}

export function translateLinkMessage(message: string): string {
  const key = `backend.link.${message.toLowerCase().replace(/\s+/g, '-')}`;
  return t(key, message);
}
