import React, { useState } from 'react';
import { Stack, useStyles2, Icon, Collapse } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { CheckStatus } from 'types';
import CheckWarning from './CheckWarning';
import CheckError from './CheckError';
import { isOld } from 'utils';

interface RunningChecksStatusProps {
  checkStatuses: CheckStatus[];
}

export default function ChecksStatus({ checkStatuses }: RunningChecksStatusProps) {
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const styles = useStyles2(getStyles);
  const hasError = checkStatuses.some((check) => check.hasError);
  const hasOldChecks = checkStatuses.some((check) => isOld(check) && check.incomplete);
  const allChecksCompleted = checkStatuses.every((check) => !check.incomplete);

  return (
    <Stack direction="row" gap={1}>
      {(!allChecksCompleted || hasError) && (
        <div className={styles.statusSection}>
          <Collapse
            collapsible
            isOpen={isStatusExpanded}
            onToggle={() => setIsStatusExpanded(!isStatusExpanded)}
            label={
              <div className={styles.collapseLabel}>
                {hasError && <Icon name="exclamation-circle" className={styles.errorIcon} />}
                {hasOldChecks && !hasError && <Icon name="exclamation-triangle" className={styles.warningIcon} />}
                <span>Show checks status</span>
              </div>
            }
            className={styles.collapseContainer}
          >
            <div className={styles.checksHeader}>Check types</div>
            <div className={styles.checksContainer}>
              {checkStatuses.map((check, index) => {
                return (
                  <div key={`${check.name}-${index}`} className={styles.checkItemWrapper}>
                    <div className={styles.checkItem}>
                      {check.hasError && <Icon name="exclamation-circle" className={styles.errorIcon} />}
                      {check.incomplete && <Icon name="spinner" className={styles.spinnerIcon} />}
                      {!check.incomplete && !check.hasError && <Icon name="check" className={styles.completedIcon} />}
                      <span className={styles.checkName}>{check.name}</span>
                    </div>
                    {check.incomplete && isOld(check) && <CheckWarning checkLastUpdate={check.lastUpdate} />}
                    {check.hasError && <CheckError />}
                  </div>
                );
              })}
            </div>
          </Collapse>
        </div>
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  statusSection: css({
    position: 'relative',
    zIndex: 1001,
  }),
  collapseLabel: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
  checksContainer: css({
    maxWidth: '300px',
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.shape.radius.default,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    position: 'relative',
    zIndex: 1002,
  }),
  checkItem: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  completedIcon: css({
    color: theme.colors.success.text,
  }),
  spinnerIcon: css({
    color: theme.colors.primary.text,
  }),
  errorIcon: css({
    color: theme.colors.error.text,
  }),
  warningIcon: css({
    color: theme.colors.warning.text,
  }),
  checkName: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
  }),
  checksHeader: css({
    paddingLeft: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  collapseContainer: css({
    border: 'none',
  }),
  checkItemWrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.radius.default,
    '&:hover': {
      backgroundColor: theme.colors.background.secondary,
    },
  }),
});
