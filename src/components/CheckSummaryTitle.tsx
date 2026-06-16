import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconName, Icon, Stack } from '@grafana/ui';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';

export const IconBySeverity: Record<string, IconName> = {
  high: 'exclamation-circle',
  low: 'exclamation-triangle',
  success: 'check-circle',
};

export function CheckSummaryTitle({ checkSummary }: { checkSummary: CheckSummaryType }) {
  const styles = useStyles2(getStyles(checkSummary.severity));
  const icon = IconBySeverity[checkSummary.severity];
  const totalIssueCount = Object.values(checkSummary.checks).reduce((acc, check) => acc + check.issueCount, 0);
  const titleText: Record<string, string> = {
    [Severity.High]: `${totalIssueCount} items needs to be fixed`,
    [Severity.Low]: `${totalIssueCount} items may need your attention`,
  };

  return (
    <Stack alignItems={'center'} gap={1}>
      {icon && <Icon name={icon} size="xl" className={styles.highlightColor} />}
      <div>
        <span className={styles.highlightColor}>{checkSummary.name}</span>
        {titleText[checkSummary.severity] && ' - ' + titleText[checkSummary.severity]}
      </div>
    </Stack>
  );
}

const getStyles = (severity: Severity) => (theme: GrafanaTheme2) => {
  const severityColor: Record<Severity, string> = {
    [Severity.High]: theme.colors.error.text,
    [Severity.Low]: theme.colors.warning.text,
  };

  return {
    highlightColor: css({
      color: severityColor[severity],
    }),
    checks: css({
      padding: theme.spacing(2),
      paddingTop: 0,
      backgrounColor: theme.colors.background.primary,
    }),
  };
};
