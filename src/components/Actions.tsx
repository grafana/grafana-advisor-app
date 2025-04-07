import React, { useState } from 'react';
import { Button, ConfirmModal, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { useCompletedChecks, useCreateCheck, useDeleteChecks } from 'api/api';

export default function Actions() {
  const { isCompleted, isLoading } = useCompletedChecks();

  const [createCheckDatasource, createCheckDatasourceState] = useCreateCheck('datasource');
  const [createCheckPlugin, createCheckPluginState] = useCreateCheck('plugin');
  const createCheckIsError = createCheckDatasourceState.isError || createCheckPluginState.isError;
  const createCheckError = createCheckDatasourceState.error || createCheckPluginState.error;

  const [deleteChecks, deleteChecksState] = useDeleteChecks();
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

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

          <Button
            onClick={(e) => {
              e.preventDefault();
              createCheckDatasource();
              createCheckPlugin();
            }}
            disabled={isLoading || !isCompleted}
            variant="secondary"
            icon={isLoading || !isCompleted ? 'spinner' : 'sync'}
          >
            {isLoading || !isCompleted ? 'Running checks...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setConfirmDeleteModalOpen(true)}
            disabled={deleteChecksState.isLoading}
            variant="secondary"
            icon="trash-alt"
            aria-label="Delete reports"
          ></Button>
        </Stack>

        <div className={styles.rightColumn}>
          {createCheckIsError && isFetchError(createCheckError) && (
            <div className={styles.apiErrorMessage}>
              Error while running checks: {createCheckError.status} {createCheckError.statusText}
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
