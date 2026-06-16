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
