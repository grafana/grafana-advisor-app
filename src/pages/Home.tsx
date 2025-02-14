import React, { useEffect } from 'react';
import { Link, Route, Routes, useMatch } from 'react-router-dom';
import { useAsyncFn } from 'react-use';
import { css } from '@emotion/css';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import * as api from 'api/api';
import { CheckSummary } from 'components/CheckSummary';
import CheckDrillDown from 'components/CheckDrillDown';
import { Severity } from 'types';
import { formatDate } from 'utils';

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
  const [checkSummariesState, checkSummaries] = useAsyncFn(async () => {
    return await api.getCheckSummaries();
  }, []);
  const [deleteChecksState, deleteChecks] = useAsyncFn(async () => {
    try {
      await api.deleteChecks();
      await checkSummaries();
    } catch (error) {
      throw error;
    }
  }, []);
  const [createChecksState, createChecks] = useAsyncFn(async () => {
    try {
      const checks = await Promise.all([api.createChecks('datasource'), api.createChecks('plugin')]);
      const names = checks.map((check) => check.data.metadata.name);
      await api.waitForChecks(names);
      await checkSummaries();
    } catch (error) {
      throw error;
    }
  }, []);
  useEffect(() => {
    checkSummaries();
  }, [checkSummaries]);
  const isLoading = createChecksState.loading || deleteChecksState.loading || checkSummariesState.loading;

  return (
    <PluginPage
      actions={
        <>
          <Button onClick={createChecks} disabled={isLoading} variant="secondary" icon={isLoading ? 'spinner' : 'sync'}>
            Refresh
          </Button>
          <Button onClick={deleteChecks} disabled={isLoading} variant="secondary" icon="trash-alt"></Button>
        </>
      }
    >
      <div className={styles.page}>
        {/* Header */}
        <Stack direction="row">
          <div className={styles.headerLeftColumn}>
            Keep Grafana running smoothly and securely.
            {createChecksState.error && isFetchError(createChecksState.error) && (
              <div className={styles.apiErrorMessage}>
                Error while running checks: {createChecksState.error.status} {createChecksState.error.statusText}
              </div>
            )}
            {deleteChecksState.error && isFetchError(deleteChecksState.error) && (
              <div className={styles.apiErrorMessage}>
                Error deleting checks: {deleteChecksState.error.status} {deleteChecksState.error.statusText}
              </div>
            )}
          </div>
          <div className={styles.headerRightColumn}>
            Last checked:{' '}
            <strong>{checkSummariesState.value ? formatDate(checkSummariesState.value.high.updated) : '...'}</strong>
          </div>
        </Stack>

        {/* Loading */}
        {checkSummariesState.loading && <div>Loading...</div>}

        {/* Error */}
        {checkSummariesState.error && isFetchError(checkSummariesState.error) && (
          <div>
            Error: {checkSummariesState.error.status} {checkSummariesState.error.statusText}
          </div>
        )}

        {!checkSummariesState.loading && !checkSummariesState.error && checkSummariesState.value && (
          <>
            {/* Check summaries */}
            <div className={styles.checksSummaries}>
              <Stack direction="row">
                <Link to={SUB_ROUTES[Severity.High]} className={styles.checkSummaryLink}>
                  <CheckSummary checkSummary={checkSummariesState.value.high} isActive={isHighActive !== null} />
                </Link>
                <Link to={SUB_ROUTES[Severity.Low]} className={styles.checkSummaryLink}>
                  <CheckSummary checkSummary={checkSummariesState.value.low} isActive={isLowActive !== null} />
                </Link>
                <Link to={SUB_ROUTES[Severity.Success]} className={styles.checkSummaryLink}>
                  <CheckSummary checkSummary={checkSummariesState.value.success} isActive={isSuccessActive !== null} />
                </Link>
              </Stack>
            </div>

            {/* Check drilldowns */}
            <Routes>
              {/* Default route */}
              <Route
                path="*"
                element={<CheckDrillDown severity={Severity.High} checkSummary={checkSummariesState.value.high} />}
              />
              <Route
                path={SUB_ROUTES[Severity.Low]}
                element={<CheckDrillDown severity={Severity.Low} checkSummary={checkSummariesState.value.low} />}
              />
              <Route
                path={SUB_ROUTES[Severity.Success]}
                element={
                  <CheckDrillDown severity={Severity.Success} checkSummary={checkSummariesState.value.success} />
                }
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
  checkSummaryLink: css({
    flex: 1,
  }),
  checksSummaries: css({
    marginTop: theme.spacing(2),
  }),
  apiErrorMessage: css({
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
