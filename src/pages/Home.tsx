import React, { useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { css } from '@emotion/css';
import { EmptyState, Icon, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import * as api from 'api/api';
import { CheckSummary } from 'components/CheckSummary';
import { MoreInfo } from 'components/MoreInfo';
import Actions from 'components/Actions';

export default function Home() {
  const styles = useStyles2(getStyles);
  const [issueCount, setIssueCount] = useState(0);
  const [checkSummariesState, checkSummaries] = useAsyncFn(async () => {
    const summaries = await api.getCheckSummaries();
    const highIssueCount = Object.values(summaries.high.checks).reduce((acc, check) => acc + check.issueCount, 0);
    const lowIssueCount = Object.values(summaries.low.checks).reduce((acc, check) => acc + check.issueCount, 0);
    setIssueCount(highIssueCount + lowIssueCount);
    return summaries;
  }, []);
  useEffect(() => {
    checkSummaries();
  }, [checkSummaries]);

  const isLoading = checkSummariesState.loading;
  const emptyState = checkSummariesState.value?.high.created.getTime() === 0;
  const isHealthy = !isLoading && !emptyState && !checkSummariesState.error && issueCount === 0;

  return (
    <PluginPage
      pageNav={{
        text: 'Advisor',
        subTitle: 'Keep Grafana running smoothly and securely',
      }}
      actions={
        <Actions checkSummaries={checkSummaries} checkSummariesState={checkSummariesState} emptyState={emptyState} />
      }
    >
      <div className={styles.feedbackContainer}>
        <Icon name="comment-alt-message" />
        <a
          href="https://forms.gle/oFkqRoXS8g8mnTu6A"
          className={styles.feedback}
          title="Share your thoughts about tracing in Grafana."
          target="_blank"
          rel="noreferrer noopener"
        >
          Give feedback
        </a>
      </div>
      <div className={styles.page}>
        {/* Loading */}
        {checkSummariesState.loading && (
          <div className={styles.loading}>
            <LoadingPlaceholder text="Loading..." />
          </div>
        )}

        {/* Error */}
        {checkSummariesState.error && isFetchError(checkSummariesState.error) && (
          <div>
            Error: {checkSummariesState.error.status} {checkSummariesState.error.statusText}
          </div>
        )}

        {/* Empty state */}
        {!checkSummariesState.loading && !checkSummariesState.error && emptyState && (
          <EmptyState variant="not-found" message="No report found. Click the Refresh button to run analysis." />
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
  checksSummaries: css({
    marginTop: theme.spacing(2),
  }),
  loading: css({
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
});
