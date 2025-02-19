import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { CheckSummaryTitle } from './CheckSummaryTitle';
import CheckDrillDown from './CheckDrillDown';

interface Props {
  checkSummary: CheckSummaryType;
  isActive?: boolean;
}

export function CheckSummary({ checkSummary }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const styles = useStyles2(getStyles(checkSummary.severity));
  const issueCount = Object.values(checkSummary.checks).reduce((acc, check) => acc + check.issueCount, 0);

  if (issueCount === 0) {
    return null;
  }

  return (
    <Collapse
      label={<CheckSummaryTitle checkSummary={checkSummary} />}
      isOpen={isOpen}
      collapsible={true}
      onToggle={() => setIsOpen(!isOpen)}
    >
      {/* Issues */}
      <div className={styles.issues}>
        <CheckDrillDown checkSummary={checkSummary} />
      </div>
    </Collapse>
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
    issues: css({
      padding: theme.spacing(2),
      paddingTop: 0,
    }),
  };
};
