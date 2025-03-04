import React, { useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { css } from '@emotion/css';
import { Button, ConfirmModal, EmptyState, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import * as api from 'api/api';
import { CheckSummary } from 'components/CheckSummary';
import { formatDate } from 'utils';
import { MoreInfo } from 'components/MoreInfo';

export default function Home() {
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
  const emptyState = checkSummariesState.value?.high.updated.getTime() === 0;
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const checks = {
    ...checkSummariesState.value?.high.checks,
    ...checkSummariesState.value?.low.checks,
  };
  const issueCount = Object.values(checks).reduce((acc, check) => acc + check.issueCount, 0);
  const isHealthy = issueCount === 0;

  return (
    <PluginPage
      // info={[
      //   {
      //     label: 'Grafana Advisor',
      //     value: 'Grafana Advisor',
      //   },
      // ]}
      // layout={PageLayoutType.Custom}
      pageNav={{
        text: 'Advisor',
        subTitle: 'Keep Grafana running smoothly and securely',
      }}
      // renderTitle={(title) => <h1>{title}</h1>}
      // subTitle="Grafana Advisorr"
      actions={
        <>
          <Button onClick={createChecks} disabled={isLoading} variant="secondary" icon={isLoading ? 'spinner' : 'sync'}>
            Refresh
          </Button>
          <Button
            onClick={() => setConfirmDeleteModalOpen(true)}
            disabled={isLoading}
            variant="secondary"
            icon="trash-alt"
          ></Button>
        </>
      }
    >
      <ConfirmModal
        isOpen={confirmDeleteModalOpen}
        title="Delete reports?"
        body="Grafana keeps a history of reports, this action will delete all of them. It is not reversible."
        confirmText="Confirm"
        onConfirm={() => {
          deleteChecks();
          setConfirmDeleteModalOpen(false);
        }}
        onDismiss={() => setConfirmDeleteModalOpen(false)}
      />

      <div className={styles.page}>
        {/* Header */}
        <Stack direction="row">
          <div className={styles.headerLeftColumn}>
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
          {!emptyState && (
            <div className={styles.headerRightColumn}>
              Last checked:{' '}
              <strong>{checkSummariesState.value ? formatDate(checkSummariesState.value?.high.updated) : '...'}</strong>
            </div>
          )}
        </Stack>

        {/* Loading */}
        {checkSummariesState.loading && <div>Loading...</div>}

        {/* Error */}
        {checkSummariesState.error && isFetchError(checkSummariesState.error) && (
          <div>
            Error: {checkSummariesState.error.status} {checkSummariesState.error.statusText}
          </div>
        )}

        {/* Empty state */}
        {!checkSummariesState.loading && !checkSummariesState.error && emptyState && (
          <EmptyState variant="not-found" message="No report found.">
            <Button onClick={createChecks} disabled={isLoading} variant="primary">
              Run analysis
            </Button>
          </EmptyState>
        )}

        {/* All issues resolved */}
        {isHealthy && <EmptyState variant="completed" message="No issues found." />}

        {/* Checks */}
        {!checkSummariesState.loading && !checkSummariesState.error && checkSummariesState.value && !emptyState && (
          <>
            {/* Check summaries */}
            <div className={styles.checksSummaries}>
              <Stack direction="column">
                <CheckSummary checkSummary={checkSummariesState.value.high} />
                <CheckSummary checkSummary={checkSummariesState.value.low} />
                <MoreInfo checkSummaries={checkSummariesState.value} />
              </Stack>
            </div>
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
