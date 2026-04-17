import React, { useState } from 'react';
import { Button, ConfirmModal, Stack, useStyles2, LinkButton } from '@grafana/ui';
import { isFetchError } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { t } from '@grafana/i18n';
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
            title={t('actions.delete-title', 'Delete reports?')}
            body={t('actions.delete-body', 'Grafana keeps a history of reports, this action will delete all of them. It is not reversible.')}
            confirmText={t('actions.confirm', 'Confirm')}
            onConfirm={handlePurgeClick}
            onDismiss={() => setConfirmDeleteModalOpen(false)}
          />
          <Button
            onClick={handleRefreshClick}
            disabled={!isCompleted}
            variant="secondary"
            icon={isCompleted ? 'sync' : 'spinner'}
            aria-label={isCompleted ? t('actions.refresh', 'Refresh') : t('actions.running-checks', 'Running checks...')}
            tooltip={isCompleted ? t('actions.refresh', 'Refresh') : t('actions.running-checks', 'Running checks...')}
          >
          </Button>
          <LinkButton
            icon="cog"
            variant="secondary"
            aria-label={t('actions.configuration', 'Configuration')}
            tooltip={t('actions.configure-application', 'Configure application')}
            href="/plugins/grafana-advisor-app?page=configuration"
            onClick={handleConfigureClick}
          />
          <Button
            variant="secondary"
            icon={showHiddenIssues ? 'eye' : 'eye-slash'}
            aria-label={showHiddenIssues ? t('actions.hide-silenced', 'Hide silenced issues') : t('actions.show-silenced', 'Show silenced issues')}
            tooltip={showHiddenIssues ? t('actions.hide-silenced', 'Hide silenced issues') : t('actions.show-silenced', 'Show silenced issues')}
            onClick={handleToggleHiddenIssues}
          />
          <Button
            onClick={() => setConfirmDeleteModalOpen(true)}
            disabled={deleteChecksState.isLoading}
            variant="secondary"
            icon="trash-alt"
            aria-label={t('actions.delete-reports', 'Delete reports')}
            tooltip={t('actions.delete-reports', 'Delete reports')}
          />
        </Stack>

        <ChecksStatus checkStatuses={checkStatuses} />

        <div className={styles.rightColumn}>
          {createCheckState.isError && isFetchError(createCheckState.error) && (
            <div className={styles.apiErrorMessage}>
              {t('actions.error-running-checks', 'Error while running checks: {{status}} {{statusText}}', { status: createCheckState.error.status, statusText: createCheckState.error.statusText })}
            </div>
          )}
          {deleteChecksState.isError && isFetchError(deleteChecksState.error) && (
            <div className={styles.apiErrorMessage}>
              {t('actions.error-deleting-checks', 'Error deleting checks: {{status}} {{statusText}}', { status: deleteChecksState.error.status, statusText: deleteChecksState.error.statusText })}
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
