import React, { useState } from 'react';
import { Button, ConfirmModal, Stack, useStyles2, LinkButton } from '@grafana/ui';
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
  showHiddenIssues: boolean;
  setShowHiddenIssues: (showHiddenIssues: boolean) => void;
}

export default function Actions({ isCompleted, checkStatuses, showHiddenIssues, setShowHiddenIssues }: ActionsProps) {
  const { createChecks, createCheckState } = useCreateChecks();
  const { deleteChecks, deleteChecksState } = useDeleteChecks();
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const { trackGlobalAction } = useInteractionTracker();

  const styles = useStyles2(getStyles);

  const handleRefreshClick = () => {
    createChecks();
    trackGlobalAction(GlobalActionType.REFRESH_CLICKED);
  };

  const handlePurgeClick = () => {
    deleteChecks();
    setConfirmDeleteModalOpen(false);
    trackGlobalAction(GlobalActionType.PURGE_CLICKED);
  };

  const handleConfigureClick = () => {
    trackGlobalAction(GlobalActionType.CONFIGURE_CLICKED);
  };

  const handleToggleHiddenIssues = () => {
    setShowHiddenIssues(!showHiddenIssues);
    trackGlobalAction(GlobalActionType.TOGGLE_HIDDEN_ISSUES, {
      show_hidden_issues: showHiddenIssues,
    });
  };

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
            disabled={!isCompleted}
            variant="secondary"
            icon={isCompleted ? 'sync' : 'spinner'}
          >
            {isCompleted ? 'Refresh' : 'Running checks...'}
          </Button>

          <LinkButton
            icon="cog"
            variant="secondary"
            aria-label="Configuration"
            tooltip="Configure advisor steps"
            href="/plugins/grafana-advisor-app?page=configuration"
            onClick={handleConfigureClick}
          />

          <Button
            variant="secondary"
            icon={showHiddenIssues ? 'eye' : 'eye-slash'}
            aria-label={showHiddenIssues ? 'Hide silenced issues' : 'Show silenced issues'}
            tooltip={showHiddenIssues ? 'Hide silenced issues' : 'Show silenced issues'}
            onClick={handleToggleHiddenIssues}
          />

          <Button
            onClick={() => setConfirmDeleteModalOpen(true)}
            disabled={deleteChecksState.isLoading}
            variant="secondary"
            icon="trash-alt"
            aria-label="Delete reports"
            tooltip="Delete reports"
          />
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
