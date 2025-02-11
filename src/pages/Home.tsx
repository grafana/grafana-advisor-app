import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { css } from '@emotion/css';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import * as api from 'api/api';
import { CheckSummary } from 'components/CheckSummary';

export default function Home() {
  const styles = useStyles2(getStyles);
  const checkSummaries = useAsync(api.getCheckSummaries);
  const [createChecksState, createChecks] = useAsyncFn(async () => {
    const response = await Promise.all([api.createChecks('datasource'), api.createChecks('plugin')]);
    return response;
  }, []);

  return (
    <PluginPage
      actions={
        <Button onClick={createChecks} disabled={createChecksState.loading} size="sm">
          Run checks
        </Button>
      }
    >
      <div className={styles.page}>
        {/* Header */}
        <Stack direction="row">
          <div className={styles.headerLeftColumn}>
            Keep Grafana running smoothly and securely.
            {createChecksState.error && isFetchError(createChecksState.error) && (
              <div className={styles.errorMessage}>
                Error while running checks: {createChecksState.error.status} {createChecksState.error.statusText}
              </div>
            )}
          </div>
          <div className={styles.headerRightColumn}>Last checked: ...</div>
        </Stack>

        {/* Loading */}
        {checkSummaries.loading && <div>Loading...</div>}

        {/* Error */}
        {checkSummaries.error && isFetchError(checkSummaries.error) && (
          <div>
            Error: {checkSummaries.error.status} {checkSummaries.error.statusText}
          </div>
        )}

        {/* Checks */}
        {!checkSummaries.loading && !checkSummaries.error && checkSummaries.value && (
          <div className={styles.checks}>
            <Stack direction="row">
              <CheckSummary checkSummary={checkSummaries.value.high} />
              <CheckSummary checkSummary={checkSummaries.value.low} />
              <CheckSummary checkSummary={checkSummaries.value.success} />
            </Stack>
          </div>
        )}
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    maxWidth: theme.breakpoints.values.xxl,
  }),
  checks: css({
    marginTop: theme.spacing(2),
  }),
  errorMessage: css({
    marginTop: theme.spacing(2),
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  headerLeftColumn: css({
    flexGrow: 1,
  }),
  headerRightColumn: css({
    fontSize: theme.typography.bodySmall.fontSize,
    width: '200px',
  }),
});
