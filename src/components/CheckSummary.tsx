import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { CheckSummaryTitle } from './CheckSummaryTitle';
import CheckDrillDown from './CheckDrillDown/CheckDrillDown';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInteractionTracker } from '../api/useInteractionTracker';

interface Props {
  checkSummary: CheckSummaryType;
  retryCheck: (checkName: string, item: string) => void;
  isCompleted: boolean;
  showHiddenIssues: boolean;
  handleHideIssue: (stepID: string, itemID: string, isHidden: boolean) => void;
}

export function CheckSummary({ checkSummary, retryCheck, isCompleted, showHiddenIssues, handleHideIssue }: Props) {
  const styles = useStyles2(getStyles(checkSummary.severity));
  const issueCount = Object.values(checkSummary.checks).reduce((acc, check) => acc + check.issueCount, 0);
  const location = useLocation();
  const navigate = useNavigate();
  const isSummaryOpenParam = 'summaryOpen' + checkSummary.severity;
  const { trackGroupToggle } = useInteractionTracker();

  // Derive state from URL using useMemo
  const isOpen = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get(isSummaryOpenParam) === 'true';
  }, [location.search, isSummaryOpenParam]);

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(location.search);
      if (open) {
        params.set(isSummaryOpenParam, 'true');
      } else {
        params.delete(isSummaryOpenParam);
      }
      navigate({ search: params.toString() }, { replace: true });
    },
    [isSummaryOpenParam, navigate, location.search]
  );

  const handleToggle = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      trackGroupToggle(checkSummary.severity, open);
    },
    [setIsOpen, trackGroupToggle, checkSummary.severity]
  );

  if (issueCount === 0) {
    return null;
  }

  return (
    <Collapse
      label={<CheckSummaryTitle checkSummary={checkSummary} />}
      isOpen={isOpen}
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
