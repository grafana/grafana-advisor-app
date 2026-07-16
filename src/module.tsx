import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { initPluginTranslations, type ResourceLoader } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from './plugin.json';
import { AppConfig } from './components/AppConfig/AppConfig';
import { useCompletedChecks, useCreateChecks, useRetryCheck } from './api/api';
import { BASE_URL } from './generated/baseAPI';
import { loadResources } from './i18n/loadResources';

// Two loaders feed the same i18next namespace:
//
//   loadResources     — plugin-owned frontend strings (button labels, section
//                       headers, tooltips). Bundled with the plugin.
//   backendLoader     — backend-owned strings (check step titles, descriptions,
//                       resolutions, failure-link messages) fetched at runtime
//                       from the advisor API's /translations endpoint.
//
// Keys the backendLoader map uses are constructed client-side from IDs already
// present in the API response — see tBackend callers in api.ts,
// CheckTypeItem.tsx, IssueDescription.tsx:
//
//   advisor.{checkTypeID}.name
//   advisor.{checkTypeID}.{stepID}.{title,description,resolution}
//   advisor.link.{slugified-message}
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

await initPluginTranslations(pluginJson.id, [loadResources, backendLoader]);

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
