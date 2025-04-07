import React, { useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';
import * as api from 'api/api';
import { Button, ConfirmModal, Stack, useStyles2 } from '@grafana/ui';
import { CheckSummaries } from 'types';
import { AsyncState } from 'react-use/lib/useAsync';
import { isFetchError } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { formatDate } from 'utils';

export default function Actions({
  checkSummaries,
  checkSummariesState,
  emptyState,
}: {
  checkSummaries: () => Promise<CheckSummaries>;
  checkSummariesState: AsyncState<CheckSummaries>;
  emptyState: boolean;
}) {
  const [cancelWaitForChecks, setCancelWaitForChecks] = useState<() => void>(() => {
    return () => {};
  });
  useEffect(() => {
    return cancelWaitForChecks;
  }, [cancelWaitForChecks]);

  const [completedChecksState, getCompletedChecks] = useAsyncFn(async (names?: string[]) => {
    const { promise, cancel } = await api.waitForChecks(names);
    setCancelWaitForChecks(() => cancel);
    await promise;
    await checkSummaries();
  }, []);

  const [createChecksState, createChecks] = useAsyncFn(async () => {
    const checks = await Promise.all([api.createChecks('datasource'), api.createChecks('plugin')]);
    const names = checks.map((check) => check.data.metadata.name);
    await getCompletedChecks(names);
  }, []);
  const [deleteChecksState, deleteChecks] = useAsyncFn(async () => {
    try {
      await api.deleteChecks();
      await checkSummaries();
    } catch (error) {
      throw error;
    }
  }, []);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

  useEffect(() => {
    // Wait for new checks
    getCompletedChecks();
  }, [getCompletedChecks]);

  const isLoading =
    completedChecksState.loading ||
    createChecksState.loading ||
    deleteChecksState.loading ||
    checkSummariesState.loading;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.actionsContainer}>
      <Stack direction="column" alignItems="flex-end" gap={0}>
        <Stack direction="row" gap={1}>
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

          <Button onClick={createChecks} disabled={isLoading} variant="secondary" icon={isLoading ? 'spinner' : 'sync'}>
            {isLoading ? 'Running checks...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setConfirmDeleteModalOpen(true)}
            disabled={deleteChecksState.loading}
            variant="secondary"
            icon="trash-alt"
            aria-label="Delete reports"
          ></Button>
        </Stack>

        <div className={styles.rightColumn}>
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
          {!emptyState && (
            <div className={styles.lastChecked}>
              Last checked:{' '}
              <strong>{checkSummariesState.value ? formatDate(checkSummariesState.value?.high.created) : '...'}</strong>
            </div>
          )}
        </div>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  apiErrorMessage: css({
    marginBottom: theme.spacing(1),
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  rightColumn: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: '200px',
    marginTop: theme.spacing(1),
  }),
  lastChecked: css({
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  actionsContainer: css({
    position: 'absolute',
    right: theme.spacing(4),
    top: theme.spacing(3),
  }),
});
