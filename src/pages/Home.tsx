import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { EmptyState, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { isFetchError, PluginPage } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckSummary } from 'components/CheckSummary';
import { MoreInfo } from 'components/MoreInfo';
import Actions from 'components/Actions';
import { useCheckSummaries } from 'api/api';
import { formatDate } from 'utils';

export default function Home() {
  const styles = useStyles2(getStyles);
  const { summaries, isLoading, isError, error } = useCheckSummaries();
  const [isEmpty, setIsEmpty] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);

  useEffect(() => {
    if (!isLoading && !isError) {
      const isEmptyTemp = summaries.high.created.getTime() === 0;
      setIsEmpty(isEmptyTemp);
      if (!isEmptyTemp) {
        const highIssueCount = Object.values(summaries.high.checks).reduce((acc, check) => acc + check.issueCount, 0);
        const lowIssueCount = Object.values(summaries.low.checks).reduce((acc, check) => acc + check.issueCount, 0);
        setIsHealthy(highIssueCount + lowIssueCount === 0);
      }
    }
  }, [isLoading, isError, summaries]);

  return (
    <PluginPage
      pageNav={{
        text: 'Advisor',
        subTitle: 'Keep Grafana running smoothly and securely',
      }}
      actions={
        <>
          <Actions />
          {!isEmpty && (
            <div className={styles.lastChecked}>
              Last checked: <strong>{summaries ? formatDate(summaries.high.created) : '...'}</strong>
            </div>
          )}
        </>
      }
    >
      <div className={styles.page}>
        {/* Loading */}
        {isLoading && (
          <div className={styles.loading}>
            <LoadingPlaceholder text="Loading..." />
          </div>
        )}

        {/* Error */}
        {isError && isFetchError(error) && (
          <div>
            Error: {error.status} {error.statusText}
          </div>
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
                <CheckSummary checkSummary={summaries.high} />
                <CheckSummary checkSummary={summaries.low} />
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
    position: 'absolute',
    right: theme.spacing(4),
    top: theme.spacing(8),
  }),
});
