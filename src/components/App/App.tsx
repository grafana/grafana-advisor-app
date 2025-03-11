import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { config } from '@grafana/runtime';
import FeatureFlagMissing from 'pages/FeatureFlagMissing';
const Home = React.lazy(() => import('../../pages/Home'));

export default function App(props: AppRootProps) {
  // TODO: Remove this once the feature flag is enabled by default
  if (!(config.featureToggles as any)['grafanaAdvisor']) {
    return <FeatureFlagMissing />;
  }
  return (
    <Routes>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
