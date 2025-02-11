import React from 'react';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { useAsync, useAsyncFn } from 'react-use';
import * as api from 'api/api';
import { CheckSummary } from 'components/CheckSummary';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export default function Home() {
  const styles = useStyles2(getStyles);
  const checks = useAsync(api.getChecksBySeverity);
  const [createChecksState, createChecks] = useAsyncFn(async () => {
    const response = await Promise.all([api.createChecks('datasource'), api.createChecks('plugin')]);
    return response;
  }, []);
  const [deleteChecksState, deleteChecks] = useAsyncFn(async () => {
    const response = await api.deleteChecks();
    return response;
const [deleteChecksState, deleteChecks] = useAsyncFn(() => api.deleteChecks(), []);

  return (
    <PluginPage>
      {/* Temporary (=will be here forever) */}
      <Stack>
        <Button onClick={createChecks} disabled={createChecksState.loading}>
          Run checks
        </Button>
        {createChecksState.error && isFetchError(createChecksState.error) && (
          <div>
            Error: {createChecksState.error.status} {createChecksState.error.statusText}
          </div>
        )}
        <Button onClick={deleteChecks} disabled={deleteChecksState.loading} variant="destructive">
          Delete checks
        </Button>
      </Stack>

      {/* Loading */}
      {checks.loading && <div>Loading...</div>}

      {/* Error */}
      {checks.error && isFetchError(checks.error) && (
        <div>
          Error: {checks.error.status} {checks.error.statusText}
        </div>
      )}

      {/* Checks */}
      {!checks.loading && !checks.error && checks.value && (
        <div className={styles.checks}>
          <Stack direction="row">
            <CheckSummary icon="exclamation-circle" title="Action needed" checks={checks.value.high} severity="high" />
            <CheckSummary
              icon="exclamation-triangle"
              title="Investigation needed"
              checks={checks.value.low}
              severity="low"
            />
          </Stack>
        </div>
      )}
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  checks: css({
    marginTop: theme.spacing(2),
  }),
});
