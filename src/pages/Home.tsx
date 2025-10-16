import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Alert, EmptyState, Icon, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckSummary } from 'components/CheckSummary';
import { MoreInfo } from 'components/MoreInfo';
import Actions from 'components/Actions/Actions';
import { useCheckSummaries, useCompletedChecks, useRetryCheck } from 'api/api';
import { formatDate } from 'utils';
import { InfoNotification } from 'components/InfoNotification/InfoNotification';
import { NoChecksEmptyState } from 'components/NoChecksEmptyState';

export default function Home() {
  const styles = useStyles2(getStyles);
  const {
    summaries,
    isLoading,
    isError,
    error,
    showHiddenIssues,
    setShowHiddenIssues,
    handleHideIssue,
    hasHiddenIssues,
    partialResults,
  } = useCheckSummaries();
  const [isEmpty, setIsEmpty] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);
  const { isCompleted, checkStatuses } = useCompletedChecks();
  const { retryCheck } = useRetryCheck();

  useEffect(() => {
    if (!isLoading && !isError) {
      const isEmptyTemp = summaries.high.created.getTime() === 0;
      setIsEmpty(isEmptyTemp);
      if (!isEmptyTemp && isCompleted) {
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
        subTitle: 'Run checks and get suggested action items to fix identified issues',
      }}
      actions={
        !isEmpty ? (
          <Actions
            isCompleted={isCompleted}
            checkStatuses={checkStatuses}
            showHiddenIssues={showHiddenIssues}
            setShowHiddenIssues={setShowHiddenIssues}
          />
        ) : null
      }
    >
      <Stack direction="row" gap={1} justifyContent="space-between" alignItems="center">
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

        {!isEmpty && (
          <div className={styles.lastChecked}>
            Last checked: <strong>{summaries ? formatDate(summaries.high.created) : '...'}</strong>
          </div>
        )}
      </Stack>

      <div className={styles.page}>
        {/* Loading */}
        {isLoading && (
          <div className={styles.loading}>
            <LoadingPlaceholder text="Loading..." />
          </div>
        )}

        {/* Partial results */}
        {partialResults && (
          <Alert title="Partial results" className={styles.error} severity="warning">
            Found too many reports to process. Please delete them and refresh.
          </Alert>
        )}

        {/* Error */}
        {isError && (
          <Alert title="Failed to load checks" className={styles.error}>
            {isFetchError(error)
              ? `${error.status} ${error.statusText}`
              : 'Check server logs for more details, refresh the report or open a support ticket if the problem persists.'}
          </Alert>
        )}

        {/* Empty state */}
        {isEmpty && <NoChecksEmptyState isCompleted={isCompleted} />}

        {/* All issues resolved */}
        {isHealthy && <EmptyState variant="completed" message="No issues found." />}

        {/* Checks */}
        {!isLoading && !isError && summaries && !isEmpty && (
          <>
            {/* Warning for incomplete report */}
            {!isCompleted && (
              <div className={styles.incompleteWarning}>
                <Icon name="hourglass" />
                Report in progress -
                <span className={styles.incompleteInfo}> results may change as checks complete</span>
              </div>
            )}

            <InfoNotification
              id="some-issues-silenced"
              title="Some issues have been silenced"
              text="Silenced issues don't appear in this report. Use the eye icon in the top right corner to manage visibility."
              displayCondition={!showHiddenIssues && hasHiddenIssues}
            />

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
                <MoreInfo checkSummaries={summaries} />
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
  error: css({
    marginTop: theme.spacing(2),
  }),
  incompleteWarning: css({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.colors.warning.text,
    fontSize: theme.typography.bodySmall.fontSize,
    fontStyle: 'italic',
  }),
  incompleteInfo: css({
    color: theme.colors.text.primary,
  }),
});
