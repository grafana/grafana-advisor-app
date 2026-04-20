import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Alert, EmptyState, Icon, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
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
  const { isCompleted, checkStatuses } = useCompletedChecks();
  const { retryCheck } = useRetryCheck();

  const isEmpty = useMemo(() => {
    if (isLoading || isError) {
      return false;
    }
    return summaries.high.created.getTime() === 0;
  }, [isLoading, isError, summaries.high.created]);

  const isHealthy = useMemo(() => {
    if (isLoading || isError || isEmpty || !isCompleted) {
      return false;
    }
    const highIssueCount = Object.values(summaries.high.checks).reduce((acc, check) => acc + check.issueCount, 0);
    const lowIssueCount = Object.values(summaries.low.checks).reduce((acc, check) => acc + check.issueCount, 0);
    return highIssueCount + lowIssueCount === 0;
  }, [isLoading, isError, isEmpty, isCompleted, summaries.high.checks, summaries.low.checks]);

  return (
    <PluginPage
      pageNav={{
        text: t('home.title', 'Advisor'),
        subTitle: t('home.subtitle', 'Helps you keep your Grafana instances running smoothly and securely by running checks and suggest actions to fix identified issues.'),
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
            title={t('home.feedback-title', 'Share your thoughts about Grafana Advisor.')}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Trans i18nKey="home.give-feedback">Give feedback</Trans>
          </a>
        </div>

        {!isEmpty && (
          <div className={styles.lastChecked}>
            <Trans i18nKey="home.last-checked">Last checked:</Trans>{' '}
            <strong>{summaries ? formatDate(summaries.high.created) : '...'}</strong>
          </div>
        )}
      </Stack>

      <div className={styles.page}>
        {/* Loading */}
        {isLoading && (
          <div className={styles.loading}>
            <LoadingPlaceholder text={t('home.loading', 'Loading...')} />
          </div>
        )}

        {/* Partial results */}
        {partialResults && (
          <Alert title={t('home.partial-results-title', 'Partial results')} className={styles.error} severity="warning">
            <Trans i18nKey="home.partial-results-body">
              Found too many reports to process. Please delete them and refresh.
            </Trans>
          </Alert>
        )}

        {/* Error */}
        {isError && (
          <Alert title={t('home.error-title', 'Failed to load checks')} className={styles.error}>
            {isFetchError(error)
              ? `${error.status} ${error.statusText}`
              : t('home.error-body', 'Check server logs for more details, refresh the report or open a support ticket if the problem persists.')}
          </Alert>
        )}

        {/* Empty state */}
        {isEmpty && <NoChecksEmptyState isCompleted={isCompleted} />}

        {/* All issues resolved */}
        {isHealthy && <EmptyState variant="completed" message={t('home.no-issues', 'No issues found.')} />}

        {/* Checks */}
        {!isLoading && !isError && summaries && !isEmpty && (
          <>
            {/* Warning for incomplete report */}
            {!isCompleted && (
              <div className={styles.incompleteWarning}>
                <Icon name="hourglass" />
                <Trans i18nKey="home.report-in-progress">Report in progress -</Trans>
                <span className={styles.incompleteInfo}>
                  {' '}
                  <Trans i18nKey="home.results-may-change">results may change as checks complete</Trans>
                </span>
              </div>
            )}

            <InfoNotification
              id="some-issues-silenced"
              title={t('home.silenced-title', 'Some issues have been silenced')}
              text={t('home.silenced-text', "Silenced issues don't appear in this report. Use the eye icon in the top right corner to manage visibility.")}
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
