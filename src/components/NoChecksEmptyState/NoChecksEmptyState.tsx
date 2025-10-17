import React from 'react';
import { css } from '@emotion/css';
import { Button, EmptyState, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { GlobalActionType, useInteractionTracker } from 'api/useInteractionTracker';
import { useCreateChecks } from 'api/api';

interface NoChecksEmptyStateProps {
  isCompleted: boolean;
}

export function NoChecksEmptyState({ isCompleted }: NoChecksEmptyStateProps) {
  const styles = useStyles2(getStyles);
  const { createChecks } = useCreateChecks();
  const { trackGlobalAction } = useInteractionTracker();

  const handleCreateChecksClick = () => {
    createChecks();
    trackGlobalAction(GlobalActionType.REFRESH_CLICKED);
  };

  return (
    <EmptyState variant="call-to-action" message="No checks run yet">
      Advisor can analyze your Grafana setup and look for potential issues.
      <br />
      Once a report is generated, it will be automatically updated periodically.
      <br />
      Check the{' '}
      <a
        href="https://grafana.com/docs/grafana/latest/administration/grafana-advisor/"
        target="_blank"
        rel="noreferrer noopener"
        className={styles.link}
      >
        documentation
      </a>{' '}
      for more information.
      <div className={styles.createChecksButton}>
        <Button
          onClick={handleCreateChecksClick}
          disabled={!isCompleted}
          variant="primary"
          icon={isCompleted ? 'plus' : 'spinner'}
        >
          {isCompleted ? 'Generate report' : 'Running checks...'}
        </Button>
      </div>
    </EmptyState>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  link: css({
    color: theme.colors.text.link,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  createChecksButton: css({
    marginTop: theme.spacing(2),
  }),
});
