import React from 'react';
import { css, cx } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconName, Icon, Stack } from '@grafana/ui';
import { ReportError, Severity } from 'types';

interface Props {
  title: string;
  checks: Record<string, { count: number; errors: ReportError[] }>;
  icon?: IconName;
  severity?: Severity;
}

export function CheckSummary({ title, icon, checks, severity = 'low' }: Props) {
  const styles = useStyles2(getStyles);
  const typeTitles: Record<string, string> = {
    datasource: 'Datasources',
    plugin: 'Plugins',
  };

  return (
    <div className={styles.content}>
      <div className={cx(styles.title, severity === 'high' ? styles.errorColor : styles.warningColor)}>
        <Stack alignItems={'center'} gap={1}>
          {icon && <Icon name={icon} size="xl" />}
          <div>{title}</div>
        </Stack>
      </div>

      <div className={styles.errorsRow}>
        {Object.entries(checks).length === 0 && <div>All is good 🎉</div>}
        {Object.entries(checks).length > 0 &&
          Object.entries(checks).map(([type, { count, errors }]) => (
            <div key={type}>
              <div className={styles.errorsTypeHeader}>
                <strong>{typeTitles[type]}</strong> - {errors.length} issue(s), {count} checked
              </div>
              <div>
                {errors.length === 0 && <div>No issues 🎉</div>}
                {errors.length > 0 && errors.map((error, i) => <ErrorRow key={i} error={error} />)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ErrorRow({ error }: { error: ReportError }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.error)}>
      <div>
        <strong>Severity:</strong>{' '}
        <span
          className={cx(
            error.severity === 'high' && styles.errorColor,
            error.severity === 'low' && styles.warningColor
          )}
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
  errorColor: css({
    color: theme.colors.error.text,
  }),
  warningColor: css({
    color: theme.colors.warning.text,
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
});
