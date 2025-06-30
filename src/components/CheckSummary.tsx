import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { CheckSummaryTitle } from './CheckSummaryTitle';
import CheckDrillDown from './CheckDrillDown/CheckDrillDown';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  checkSummary: CheckSummaryType;
  retryCheck: (checkName: string, item: string) => void;
  isCompleted: boolean;
  showHiddenIssues: boolean;
  handleHideIssue: (stepID: string, itemID: string, isHidden: boolean) => void;
  isLLMEnabled: boolean;
}

export function CheckSummary({
  checkSummary,
  retryCheck,
  isCompleted,
  showHiddenIssues,
  handleHideIssue,
  isLLMEnabled,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const styles = useStyles2(getStyles(checkSummary.severity));
  const issueCount = Object.values(checkSummary.checks).reduce((acc, check) => acc + check.issueCount, 0);
  const location = useLocation();
  const navigate = useNavigate();
  const isSummaryOpenParam = 'summaryOpen' + checkSummary.severity;

  useEffect(() => {
    // Restore state from URL
    const params = new URLSearchParams(location.search);
    const isSummaryOpen = params.get(isSummaryOpenParam) === 'true';
    setIsOpen(isSummaryOpen);
  }, [location.search, isSummaryOpenParam]);

  const handleToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);

    // Update URL with summary state
    const params = new URLSearchParams(location.search);
    if (isOpen) {
      params.set(isSummaryOpenParam, 'true');
    } else {
      params.delete(isSummaryOpenParam);
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
        <CheckDrillDown
          checkSummary={checkSummary}
          retryCheck={retryCheck}
          isCompleted={isCompleted}
          showHiddenIssues={showHiddenIssues}
          handleHideIssue={handleHideIssue}
          isLLMEnabled={isLLMEnabled}
        />
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
