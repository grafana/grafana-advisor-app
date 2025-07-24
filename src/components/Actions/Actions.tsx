import React, { useEffect, useState } from 'react';
import { Button, ConfirmModal, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { useDeleteChecks, useCreateChecks } from 'api/api';
import { CheckStatus } from 'types';
import ChecksStatus from './ChecksStatus';
import { useInteractionTracker, GlobalActionType } from '../../api/useInteractionTracker';

interface ActionsProps {
  isCompleted: boolean;
  checkStatuses: CheckStatus[];
}

const enum LoadingState {
  IDLE = 0,
  ACTION_TRIGGERED = 1,
  IS_COMPLETED_TRIGGERED = 2,
}

export default function Actions({ isCompleted, checkStatuses }: ActionsProps) {
  const { createChecks, createCheckState } = useCreateChecks();
  const { deleteChecks, deleteChecksState } = useDeleteChecks();
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const { trackGlobalAction } = useInteractionTracker();
  const [isLoading, setIsLoading] = useState(LoadingState.IDLE);

  const styles = useStyles2(getStyles);

  const handleRefreshClick = () => {
    setIsLoading(LoadingState.ACTION_TRIGGERED);
    createChecks();
    trackGlobalAction(GlobalActionType.REFRESH_CLICKED);
  };

  const handlePurgeClick = () => {
    setIsLoading(LoadingState.ACTION_TRIGGERED);
    deleteChecks();
    setConfirmDeleteModalOpen(false);
    trackGlobalAction(GlobalActionType.PURGE_CLICKED);
  };

  useEffect(() => {
    if (!isCompleted && isLoading === LoadingState.ACTION_TRIGGERED) {
      setIsLoading(LoadingState.IS_COMPLETED_TRIGGERED);
    } else if (isCompleted && isLoading === LoadingState.IS_COMPLETED_TRIGGERED) {
      setIsLoading(LoadingState.IDLE);
    }
  }, [isCompleted, isLoading]);

  return (
    <div className={styles.actionsContainer}>
      <Stack direction="column" alignItems="flex-end" gap={0}>
        <Stack direction="row" gap={1}>
          <ConfirmModal
            isOpen={confirmDeleteModalOpen}
            title="Delete reports?"
            body="Grafana keeps a history of reports, this action will delete all of them. It is not reversible."
            confirmText="Confirm"
            onConfirm={handlePurgeClick}
            onDismiss={() => setConfirmDeleteModalOpen(false)}
          />

          <Button
            onClick={handleRefreshClick}
            disabled={isLoading !== 0}
            variant="secondary"
            icon={isLoading === 0 ? 'sync' : 'spinner'}
          >
            {isLoading === 0 ? 'Refresh' : 'Running checks...'}
          </Button>
          <Button
            onClick={() => setConfirmDeleteModalOpen(true)}
            disabled={deleteChecksState.isLoading}
            variant="secondary"
            icon="trash-alt"
            aria-label="Delete reports"
          ></Button>
        </Stack>

        <ChecksStatus checkStatuses={checkStatuses} />

        <div className={styles.rightColumn}>
          {createCheckState.isError && isFetchError(createCheckState.error) && (
            <div className={styles.apiErrorMessage}>
              Error while running checks: {createCheckState.error.status} {createCheckState.error.statusText}
            </div>
          )}
          {deleteChecksState.isError && isFetchError(deleteChecksState.error) && (
            <div className={styles.apiErrorMessage}>
              Error deleting checks: {deleteChecksState.error.status} {deleteChecksState.error.statusText}
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
  actionsContainer: css({
    position: 'absolute',
    right: theme.spacing(4),
    top: theme.spacing(3),
  }),
});
