import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { AppConfig } from './components/AppConfig/AppConfig';
import { useCompletedChecks, useRetryCheck } from './api/api';

const LazyApp = lazy(() => import('./components/App/App'));

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

function useCompletedChecksExposed(context?: { names?: string[]; checkType?: string }) {
  return useCompletedChecks(context?.names, context?.checkType);
}

function useRetryCheckExposed() {
  return useRetryCheck();
}

export const plugin = new AppPlugin<{}>()
  .setRootPage(App)
  .addConfigPage({
    title: 'Configuration',
    icon: 'cog',
    body: AppConfig,
    id: 'configuration',
  })
  .addFunction({
    title: 'useCompletedChecks',
    description: 'Hook to check if all advisor checks are completed',
    targets: ['grafana-advisor-app/completed-checks/v1'],
    fn: useCompletedChecksExposed,
  })
  .addFunction({
    title: 'useRetryCheck',
    description: 'Hook to retry a specific advisor check',
    targets: ['grafana-advisor-app/retry-check/v1'],
    fn: useRetryCheckExposed,
  });
