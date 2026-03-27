import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { AppConfig } from './components/AppConfig/AppConfig';
import { GenerateReportButton, type GenerateReportButtonProps } from './components/GenerateReportButton';
import pluginJson from './plugin.json';

const LazyApp = lazy(() => import('./components/App/App'));

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

export const plugin = new AppPlugin<{}>()
  .setRootPage(App)
  .addConfigPage({
    title: 'Configuration',
    icon: 'cog',
    body: AppConfig,
    id: 'configuration',
  })
  .exposeComponent<GenerateReportButtonProps>({
    id: `${pluginJson.id}/generate-report-button/v1`,
    title: 'Generate report button',
    description: 'A button that triggers the generation of an Advisor report.',
    component: GenerateReportButton,
  });
