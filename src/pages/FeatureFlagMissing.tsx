import { EmptyState, Text, TextLink } from '@grafana/ui';
import { t, Trans } from '@grafana/i18n';
import React from 'react';

export default function FeatureFlagMissing() {
  return (
    <EmptyState variant="call-to-action" message={t('feature-flag-missing.title', 'Missing feature flag.')}>
      <p>
        <Trans i18nKey="feature-flag-missing.description">
          The Grafana Advisor requires the <code>grafanaAdvisor</code> feature toggle to be enabled.
        </Trans>
      </p>
      <p>
        <TextLink
          href="https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/"
          external
        >
          <Trans i18nKey="feature-flag-missing.instructions-link">Instructions to enable the feature toggle:</Trans>
        </TextLink>
      </p>
      <Text textAlignment="left">
        <pre>
          <code>
            [feature_toggles]
            <br />
            grafanaAdvisor = true
          </code>
        </pre>
      </Text>
    </EmptyState>
  );
}
