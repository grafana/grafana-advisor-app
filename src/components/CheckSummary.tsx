import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { CheckSummaryTitle } from './CheckSummaryTitle';
import CheckDrillDown from './CheckDrillDown';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  checkSummary: CheckSummaryType;
  isActive?: boolean;
}

export function CheckSummary({ checkSummary }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const styles = useStyles2(getStyles(checkSummary.severity));
  const issueCount = Object.values(checkSummary.checks).reduce((acc, check) => acc + check.issueCount, 0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Restore state from URL
    const params = new URLSearchParams(location.search);
    const isSummaryOpen = params.get('summaryOpen') === 'true';
    setIsOpen(isSummaryOpen);
  }, [location.search]);

  const handleToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);

    // Update URL with summary state
    const params = new URLSearchParams(location.search);
    if (isOpen) {
      params.set('summaryOpen', 'true');
    } else {
      params.delete('summaryOpen');
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  if (issueCount === 0) {
    return null;
  }

  return (
    <Collapse
      label={<CheckSummaryTitle checkSummary={checkSummary} />}
      isOpen={isOpen}
      collapsible={true}
      onToggle={() => handleToggle(!isOpen)}
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
