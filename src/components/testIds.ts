export const testIds = {
  AppConfig: {
    ignoreSwitch: (step: string) => `data-testid ac-ignore-${step}`,
  },
  CheckDrillDown: {
    hideButton: (item: string) => `data-testid cd-hide-${item}`,
    retryButton: (item: string) => `data-testid cd-retry-${item}`,
    actionLink: (item: string, message: string) =>
      `data-testid cd-action-link-${item}-${message.toLowerCase().replace(/\s+/g, '-')}`,
  },
};
