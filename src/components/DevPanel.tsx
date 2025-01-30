// The dev-panel is mostly only used for the PoC, it should probably go away once we reach a more stable state.
// It's mostly used to interact with the backend easily, and create / delete / refresh checks.
import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { DevPanelSection } from './DevPanelSection';
import { getAvailableVersions, getChecks, getPreferredVersion } from 'api';

interface Props {}

export function DevPanel({}: Props) {
  const styles = useStyles2(getStyles);
  const availableVersions = useAsync(getAvailableVersions);
  const preferredVersion = useAsync(getPreferredVersion);
  const checks = useAsync(getChecks);

  return (
    <div className={styles.content}>
      {/* API versions */}
      <DevPanelSection title="API versions" openByDefault={true}>
        <div>
          <strong>Preferred:</strong> {preferredVersion.value}
        </div>
        <div className={styles.marginTop}>
          <strong>Available:</strong>
          {availableVersions.value && availableVersions.value.map((version) => <div key={version}>- {version}</div>)}
        </div>
      </DevPanelSection>

      {/* Checks */}
      <DevPanelSection title="Checks" openByDefault={true}>
        <div>
          {/* No checks yet */}
          {!checks.error && !checks.loading && checks.value && checks.value.length === 0 && (
            <Button size="sm">Create checks</Button>
          )}

          {/* Recreate existing checks */}
          {!checks.error && !checks.loading && checks.value && checks.value.length > 0 && (
            <Button size="sm">Recreate checks</Button>
          )}
        </div>

        <div>
          <strong>Available checks</strong>
          {checks.error && <div className={styles.error}>Error: {checks.error.message}</div>}
          {checks.loading && <div>Loading...</div>}
          {checks.value && checks.value.map((check) => <div key={check.id}>{check.name}</div>)}
        </div>
      </DevPanelSection>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  error: css({
    color: 'red',
  }),
  marginTop: css({
    marginTop: theme.spacing(1),
  }),
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
});
