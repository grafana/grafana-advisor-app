import React from 'react';
import { Icon, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { t } from '@grafana/i18n';
import { formatDistanceToNow } from 'date-fns';

interface CheckWarningProps {
  checkLastUpdate: Date;
}

export default function CheckWarning({ checkLastUpdate }: CheckWarningProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.warningContainer}>
      <Icon name="exclamation-triangle" className={styles.warningIcon} />
      <span className={styles.warningText}>
        {t('check-warning.message', 'Check is taking longer than expected (updated {{time}} ago). Inspect server logs for errors or delete and re-create the report to retry.', { time: formatDistanceToNow(checkLastUpdate) })}
      </span>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  warningContainer: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(3),
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.radius.default,
  }),
  warningIcon: css({
    color: theme.colors.warning.text,
    marginRight: theme.spacing(0.5),
  }),
  warningText: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
  }),
});
