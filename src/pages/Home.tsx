import React from 'react';
import { Link, Route, Routes, useMatch } from 'react-router-dom';
import { useAsync, useAsyncFn } from 'react-use';
import { css } from '@emotion/css';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import * as api from 'api/api';
import { CheckSummary } from 'components/CheckSummary';
import CheckDrillDown from 'components/CheckDrillDown';
import { Severity } from 'types';

const BASE_PATH = '/admin/advisor';
const SUB_ROUTES = {
  [Severity.High]: 'action-needed',
  [Severity.Low]: 'investigation-needed',
  [Severity.Success]: 'all-good',
};

const getDrilldownPath = (severity: Severity) => `${BASE_PATH}/${SUB_ROUTES[severity]}`;

export default function Home() {
  const isHighActive = useMatch(getDrilldownPath(Severity.High));
  const isLowActive = useMatch(getDrilldownPath(Severity.Low));
  const isSuccessActive = useMatch(getDrilldownPath(Severity.Success));
  const styles = useStyles2(getStyles);
  const checkSummaries = useAsync(api.getCheckSummaries);
  const [deleteChecksState, deleteChecks] = useAsyncFn(() => api.deleteChecks(), []);
  const [createChecksState, createChecks] = useAsyncFn(async () => {
    const response = await Promise.all([api.createChecks('datasource'), api.createChecks('plugin')]);
    return response;
  }, []);

  return (
    <PluginPage
      actions={
        <>
          <Button onClick={createChecks} disabled={createChecksState.loading}>
            Run checks
          </Button>
          <Button onClick={deleteChecks} disabled={deleteChecksState.loading} variant="destructive">
            Delete checks
          </Button>
        </>
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

        {!checkSummaries.loading && !checkSummaries.error && checkSummaries.value && (
          <>
            {/* Check summaries */}
            <div className={styles.checks}>
              <Stack direction="row">
                <Link to={SUB_ROUTES[Severity.High]} className={styles.summaryLink}>
                  <CheckSummary checkSummary={checkSummaries.value.high} isActive={isHighActive !== null} />
                </Link>
                <Link to={SUB_ROUTES[Severity.Low]} className={styles.summaryLink}>
                  <CheckSummary checkSummary={checkSummaries.value.low} isActive={isLowActive !== null} />
                </Link>
                <Link to={SUB_ROUTES[Severity.Success]} className={styles.summaryLink}>
                  <CheckSummary checkSummary={checkSummaries.value.success} isActive={isSuccessActive !== null} />
                </Link>
              </Stack>
            </div>

            {/* Check drilldowns */}
            <Routes>
              <Route
                path={SUB_ROUTES[Severity.High]}
                element={<CheckDrillDown severity={Severity.High} checkSummary={checkSummaries.value.high} />}
              />
              <Route
                path={SUB_ROUTES[Severity.Low]}
                element={<CheckDrillDown severity={Severity.Low} checkSummary={checkSummaries.value.low} />}
              />
              <Route
                path={SUB_ROUTES[Severity.Success]}
                element={<CheckDrillDown severity={Severity.Success} checkSummary={checkSummaries.value.success} />}
              />
            </Routes>
          </>
        )}
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    maxWidth: theme.breakpoints.values.xxl,
  }),
  summaryLink: css({
    flex: 1,
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
