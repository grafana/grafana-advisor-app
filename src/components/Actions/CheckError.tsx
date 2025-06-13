import React from 'react';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export default function CheckError() {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.errorContainer}>
      <span className={styles.errorText}>Check failed to complete. See server logs for details or try again.</span>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  errorContainer: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(3),
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.radius.default,
  }),
  errorText: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
  }),
});
