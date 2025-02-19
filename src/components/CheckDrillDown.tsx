import React from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';

export default function CheckDrillDown({ checkSummary }: { checkSummary: CheckSummaryType }) {
  const styles = useStyles2(getStyles(checkSummary.severity));

  return (
    <div className={styles.container}>
      {Object.values(checkSummary.checks).map((check) => {
        // Dont' display a drilldown for empty checks
        if (check.issueCount === 0) {
          return null;
        }

        return Object.values(check.steps).map((step) =>
          step.issues.map((issue) => (
            <div key={issue.itemID} className={styles.issue}>
              <div className={styles.issueReason}>{issue.reason}</div>
              <div dangerouslySetInnerHTML={{ __html: issue.action }}></div>
            </div>
          ))
        );
      })}
    </div>
  );
}

const getStyles = (severity: Severity) => (theme: GrafanaTheme2) => {
  return {
    container: css({
      marginTop: theme.spacing(2),
    }),
    spacingTopLg: css({
      marginTop: theme.spacing(5),
    }),
    spacingTopMd: css({
      marginTop: theme.spacing(2),
    }),
    description: css({
      color: theme.colors.text.secondary,
    }),
    issue: css({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(2),
      marginBottom: theme.spacing(1),
      a: {
        color: theme.colors.text.link,
        cursor: 'pointer',
        ':hover': {
          textDecoration: 'underline',
        },
      },
    }),
    issueReason: css({
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    bold: css({
      fontWeight: theme.typography.fontWeightBold,
    }),
  };
};
