import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { initPluginTranslations, type ResourceLoader } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from './plugin.json';
import { AppConfig } from './components/AppConfig/AppConfig';
import { useCompletedChecks, useCreateChecks, useRetryCheck } from './api/api';
import { BASE_URL } from './generated/baseAPI';

// backendLoader fetches translations for strings the backend owns (check step
// titles/descriptions/resolutions and failure-link messages). The backend
// serves a flat { key -> string } map at /translations?lang={locale}. Keys
// arrive on step/link objects as titleKey/descriptionKey/resolutionKey/messageKey
// and are resolved via tBackend(key, fallback).
const backendLoader: ResourceLoader = async (locale) => {
  try {
    const response = await getBackendSrv().get<{ translations?: Record<string, string> }>(
      `${BASE_URL}/translations`,
      { lang: locale }
    );
    return response?.translations ?? {};
  } catch (error) {
    console.error('Failed to load advisor backend translations', error);
    return {};
  }
};

await initPluginTranslations(pluginJson.id, [backendLoader]);

const LazyApp = lazy(() => import('./components/App/App'));

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

function useCompletedChecksExposed(context?: { names?: string[]; checkType?: string }) {
  return useCompletedChecks(context?.names, context?.checkType);
}

function useCreateChecksExposed() {
  return useCreateChecks();
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
    targets: ['grafana/advisor/completed-checks/v1'],
    fn: useCompletedChecksExposed,
  })
  .addFunction({
    title: 'useCreateChecks',
    description: 'Hook to create advisor checks',
    targets: ['grafana/advisor/create-checks/v1'],
    fn: useCreateChecksExposed,
  })
  .addFunction({
    title: 'useRetryCheck',
    description: 'Hook to retry a specific advisor check',
    targets: ['grafana/advisor/retry-check/v1'],
    fn: useRetryCheckExposed,
  });
