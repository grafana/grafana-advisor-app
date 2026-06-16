import { EmptyState, Text, TextLink } from '@grafana/ui';
import React from 'react';

export default function FeatureFlagMissing() {
  return (
    <EmptyState variant="call-to-action" message="Missing feature flag.">
      <p>
        The Grafana Advisor requires the <code>grafanaAdvisor</code> feature toggle to be enabled.
      </p>
      <p>
        <TextLink
          href="https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/"
          external
        >
          Instructions to enable the feature toggle:
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
