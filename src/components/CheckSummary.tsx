import React from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconName, Icon, Stack } from '@grafana/ui';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { formatCheckName } from 'utils';

interface Props {
  checkSummary: CheckSummaryType;
  isActive?: boolean;
}

const IconBySeverity: Record<string, IconName> = {
  high: 'exclamation-circle',
  low: 'exclamation-triangle',
  success: 'check-circle',
};

export function CheckSummary({ checkSummary, isActive }: Props) {
  const styles = useStyles2(getStyles(checkSummary.severity));
  const icon = IconBySeverity[checkSummary.severity];

  return (
    <div className={cx(styles.container, isActive && styles.containerActive)}>
      <div className={styles.title}>
        <Stack alignItems={'center'} gap={1}>
          {icon && <Icon name={icon} size="xl" className={styles.highlightColor} />}
          <div>{checkSummary.name}</div>
        </Stack>
      </div>

      {/* Checks */}
      <div className={styles.checks}>
        {Object.values(checkSummary.checks).map((check) => (
          <div key={check.name} className={cx(styles.check, check.issueCount > 0 && styles.highlightColor)}>
            <div className={styles.checkCount}>{check.issueCount}</div>
            <div className={styles.checkName}>{formatCheckName(check.name)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const getStyles = (severity: Severity) => (theme: GrafanaTheme2) => {
  const severityColor: Record<Severity, string> = {
    [Severity.High]: theme.colors.error.text,
    [Severity.Low]: theme.colors.warning.text,
    [Severity.Success]: theme.colors.success.text,
  };

  return {
    title: css({
      padding: theme.spacing(2),
      backgrounColor: theme.colors.background.secondary,
      fontSize: theme.typography.h4.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    highlightColor: css({
      color: severityColor[severity],
    }),
    checks: css({
      padding: theme.spacing(2),
      paddingTop: 0,
      backgrounColor: theme.colors.background.primary,
    }),
    container: css({
      width: '100%',
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      cursor: 'pointer',
      '&:hover': {
        border: `1px solid ${theme.colors.border.strong}`,
      },
    }),
    containerActive: css({
      border: `1px solid ${theme.colors.border.strong}`,
    }),
    check: css({
      display: 'flex',
      paddingX: theme.spacing(1),
    }),
    checkCount: css({
      fontWeight: theme.typography.fontWeightBold,
      marginRight: theme.spacing(1),
    }),
    checkName: css({}),
  };
};
