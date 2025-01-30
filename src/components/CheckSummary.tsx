import React from 'react';
import { css, cx } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconName, Icon, Stack } from '@grafana/ui';
import { ReportError } from 'types';

interface Props {
  title: string;
  icon?: IconName;
  errors: Record<string, { count: number; errors: ReportError[] }>;
}

export function CheckSummary({ title, icon, errors }: Props) {
  const styles = useStyles2(getStyles);
  const typeTitles: Record<string, string> = {
    datasource: 'Datasources',
    plugin: 'Plugins',
  };

  return (
    <div className={styles.content}>
      <div className={styles.titleRow}>
        <Stack>
          {icon && <Icon name={icon} />}
          <div className={styles.title}>{title}</div>
        </Stack>
      </div>

      <div className={styles.errorsRow}>
        {Object.entries(errors).length === 0 && <div>All is good 🎉.</div>}
        {Object.entries(errors).length > 0 &&
          Object.entries(errors).map(([type, { count, errors }]) => (
            <div key={type}>
              <div className={styles.errorsTypeHeader}>
                <strong>{typeTitles[type]}</strong> - {errors.length} error(s), {count} checked
              </div>
              <div>
                {errors.length === 0 && <div>No errors</div>}
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
        <strong>Severity:</strong> {error.severity}
      </div>
      <div>
        <strong>Reason:</strong> {error.reason}
      </div>
      <div>
        <div>Action:</div>
        <div dangerouslySetInnerHTML={{ __html: error.action }}></div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  titleRow: css({
    padding: theme.spacing(2),
    backgrounColor: theme.colors.background.secondary,
  }),
  title: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
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
});
