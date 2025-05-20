import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Alert, EmptyState, Icon, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckSummary } from 'components/CheckSummary';
import { MoreInfo } from 'components/MoreInfo';
import Actions from 'components/Actions';
import { useCheckSummaries, useCompletedChecks, useRetryCheck } from 'api/api';
import { formatDate } from 'utils';

export default function Home() {
  const styles = useStyles2(getStyles);
  const { summaries, isLoading, isError, error, showHiddenIssues, setShowHiddenIssues, handleHideIssue } =
    useCheckSummaries();
  const [isEmpty, setIsEmpty] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);
  const { isCompleted } = useCompletedChecks();
  const { retryCheck } = useRetryCheck();

  useEffect(() => {
    if (!isLoading && !isError && isCompleted) {
      const isEmptyTemp = summaries.high.created.getTime() === 0;
      setIsEmpty(isEmptyTemp);
      if (!isEmptyTemp) {
        const highIssueCount = Object.values(summaries.high.checks).reduce((acc, check) => acc + check.issueCount, 0);
        const lowIssueCount = Object.values(summaries.low.checks).reduce((acc, check) => acc + check.issueCount, 0);
        setIsHealthy(highIssueCount + lowIssueCount === 0);
      } else {
        setIsHealthy(false);
      }
    }
  }, [isLoading, isError, summaries, isCompleted]);

  return (
    <PluginPage
      pageNav={{
        text: 'Advisor',
        subTitle: 'Keep Grafana running smoothly and securely',
      }}
      actions={
        <>
          <Actions isCompleted={isCompleted} />
          {!isEmpty && (
            <div className={styles.lastChecked}>
              Last checked: <strong>{summaries ? formatDate(summaries.high.created) : '...'}</strong>
            </div>
          )}
        </>
      }
    >
      <div className={styles.feedbackContainer}>
        <Icon name="comment-alt-message" />
        <a
          href="https://forms.gle/oFkqRoXS8g8mnTu6A"
          className={styles.feedback}
          title="Share your thoughts about Grafana Advisor."
          target="_blank"
          rel="noreferrer noopener"
        >
          Give feedback
        </a>
      </div>

      <div className={styles.page}>
        {/* Loading */}
        {isLoading && (
          <div className={styles.loading}>
            <LoadingPlaceholder text="Loading..." />
          </div>
        )}

        {/* Error */}
        {isError && (
          <Alert title="Failed to load checks" className={styles.error}>
            {isFetchError(error)
              ? `${error.status} ${error.statusText}`
              : 'Check server logs for more details or open a support ticket.'}
          </Alert>
        )}

        {/* Empty state */}
        {isEmpty && (
          <EmptyState variant="not-found" message="No report found. Click the Refresh button to run analysis." />
        )}

        {/* All issues resolved */}
        {isHealthy && <EmptyState variant="completed" message="No issues found." />}

        {/* Checks */}
        {!isLoading && !isError && summaries && !isEmpty && (
          <>
            {/* Check summaries */}
            <div className={styles.checksSummaries}>
              <Stack direction="column">
                <CheckSummary
                  checkSummary={summaries.high}
                  retryCheck={retryCheck}
                  isCompleted={isCompleted}
                  showHiddenIssues={showHiddenIssues}
                  handleHideIssue={handleHideIssue}
                />
                <CheckSummary
                  checkSummary={summaries.low}
                  retryCheck={retryCheck}
                  isCompleted={isCompleted}
                  showHiddenIssues={showHiddenIssues}
                  handleHideIssue={handleHideIssue}
                />
                <MoreInfo
                  checkSummaries={summaries}
                  showHiddenIssues={showHiddenIssues}
                  setShowHiddenIssues={setShowHiddenIssues}
                />
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
  checksSummaries: css({
    marginTop: theme.spacing(2),
  }),
  loading: css({
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  lastChecked: css({
    fontSize: theme.typography.bodySmall.fontSize,
    position: 'absolute',
    right: theme.spacing(4),
    top: theme.spacing(8),
  }),
  feedbackContainer: css({
    color: theme.colors.text.link,
    marginTop: theme.spacing(-1),
  }),
  feedback: css({
    margin: '6px',
    color: theme.colors.text.link,
    fontSize: theme.typography.bodySmall.fontSize,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  link: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    ':hover': {
      color: theme.colors.text.link,
    },
  }),
  error: css({
    marginTop: theme.spacing(2),
  }),
});
