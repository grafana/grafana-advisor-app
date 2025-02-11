import React from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconName, Icon, Stack } from '@grafana/ui';
import { ReportFailure } from 'generated/check/v0alpha1/types.status.gen';
import { type CheckSummary as CheckSummaryType } from 'types';

// TODO: this should come from the backend (be part of the data)
const checkTitles: Record<string, string> = {
  datasource: 'Datasources',
  plugin: 'Plugins',
};

interface Props {
  checkSummary: CheckSummaryType;
}

const IconBySeverity: Record<string, IconName> = {
  high: 'exclamation-circle',
  low: 'exclamation-triangle',
  success: 'check-circle',
};

export function CheckSummary({ checkSummary }: Props) {
  const styles = useStyles2(getStyles);
  const icon = IconBySeverity[checkSummary.severity];
  const textColor = cx(
    checkSummary.severity === 'high' && styles.errorText,
    checkSummary.severity === 'low' && styles.warningText,
    checkSummary.severity === 'success' && styles.successText
  );

  return (
    <div className={styles.content}>
      <div className={cx(styles.title, textColor)}>
        <Stack alignItems={'center'} gap={1}>
          {icon && <Icon name={icon} size="xl" />}
          <div>{checkSummary.name}</div>
        </Stack>
      </div>

      {/* Checks */}
      <div className={styles.errorsRow}>
        {Object.values(checkSummary.checks).map((check) => (
          <div key={check.name} className={styles.check}>
            <div className={cx(styles.checkCount, textColor)}>{check.issueCount}</div>
            <div className={styles.checkName}>{checkTitles[check.name] ?? check.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorRow({ error }: { error: ReportFailure }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.error)}>
      <div>
        <strong>Severity:</strong>{' '}
        <span
          className={cx(error.severity === 'high' && styles.errorText, error.severity === 'low' && styles.warningText)}
        >
          {error.severity}
        </span>
      </div>
      <div>
        <strong>Reason:</strong> {error.reason}
      </div>
      <div>
        <div className={styles.actionTitle}>Action: </div>
        <div className={styles.actionContent} dangerouslySetInnerHTML={{ __html: error.action }}></div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  title: css({
    padding: theme.spacing(2),
    backgrounColor: theme.colors.background.secondary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  errorText: css({
    color: theme.colors.error.text,
  }),
  warningText: css({
    color: theme.colors.warning.text,
  }),
  successText: css({
    color: theme.colors.success.text,
  }),
  errorsRow: css({
    padding: theme.spacing(2),
    paddingTop: 0,
    backgrounColor: theme.colors.background.primary,
  }),
  errorsTypeHeader: css({
    textDecoration: 'underline',
  }),
  error: css({
    fontSize: theme.typography.bodySmall.fontSize,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
  }),
  content: css({
    minWidth: 300,
    width: '50%',
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    cursor: 'pointer',
    '&:hover': {
      border: `1px solid ${theme.colors.border.strong}`,
    },
  }),
  contentActive: css({
    border: `1px solid ${theme.colors.border.strong}`,
  }),
  actionTitle: css({
    display: 'inline',
    fontWeight: theme.typography.fontWeightMedium,
  }),
  actionContent: css({
    display: 'inline',
    '> a': {
      color: theme.colors.text.link,
      cursor: 'pointer',
      ':hover': {
        textDecoration: 'underline',
      },
    },
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
});
