import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Collapse, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { type CheckSummary as CheckSummaryType } from 'types';
import { useLocation, useNavigate } from 'react-router-dom';
import { IssueDescription } from './IssueDescription';
import { useInteractionTracker } from '../../api/useInteractionTracker';

export interface CheckDrillDownProps {
  checkSummary: CheckSummaryType;
  retryCheck: (checkName: string, item: string) => void;
  isCompleted: boolean;
  showHiddenIssues: boolean;
  handleHideIssue: (stepID: string, itemID: string, isHidden: boolean) => void;
}

export default function CheckDrillDown({
  checkSummary,
  retryCheck,
  isCompleted,
  showHiddenIssues,
  handleHideIssue,
}: CheckDrillDownProps) {
  const styles = useStyles2(getStyles());
  const [isOpen, setIsOpen] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const scrollToRef = useRef<HTMLDivElement>(null);
  const [scrollToStep, setScrollToStep] = useState<string | null>(null);
  const { trackGroupToggle } = useInteractionTracker();

  useEffect(() => {
    // Restore state from URL
    const params = new URLSearchParams(location.search);
    const openSteps = params.get('openSteps')?.split(',') || [];
    const initialState = openSteps.reduce((acc, stepId) => ({ ...acc, [stepId]: true }), {});
    setIsOpen(initialState);
    const scrollToStep = params.get('scrollToStep');
    if (scrollToStep) {
      setScrollToStep(scrollToStep);
    }
  }, [location.search]);

  useEffect(() => {
    if (scrollToStep && scrollToRef.current) {
      scrollToRef.current.scrollIntoView({ block: 'center' });
    }
  }, [scrollToStep]);

  const handleToggle = (stepId: string) => {
    const newState = {
      ...isOpen,
      [stepId]: !isOpen[stepId],
    };
    setIsOpen(newState);
    trackGroupToggle(stepId, newState[stepId]);

    // Update URL with open steps
    const openSteps = Object.entries(newState)
      .filter(([_, isOpen]) => isOpen)
      .map(([stepId]) => stepId)
      .join(',');

    const params = new URLSearchParams(location.search);
    if (openSteps) {
      params.set('openSteps', openSteps);
    } else {
      params.delete('openSteps');
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  const avoidLinkPropagation = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a')) {
      e.stopPropagation();
    }
  };

  return (
    <div className={styles.container}>
      {Object.values(checkSummary.checks).map((check) => {
        // Dont' display a drilldown for empty checks
        if (check.issueCount === 0) {
          return null;
        }

        return Object.values(check.steps).map((step) => {
          const issues = step.issues.filter((issue) => showHiddenIssues || !issue.isHidden);
          return (
            <div key={step.stepID} className={styles.spacingTopMd}>
              {issues.length > 0 && (
                <Collapse
                  label={
                    <div className={styles.description}>
                      <div>
                        {step.name} failed for {issues.length} {check.typeName || check.type}
                        {issues.length > 1 ? 's' : ''}.
                      </div>
                      <div
                        className={styles.resolution}
                        dangerouslySetInnerHTML={{ __html: step.resolution }}
                        onClick={avoidLinkPropagation}
                      ></div>
                    </div>
                  }
                  isOpen={isOpen[step.stepID] ?? false}
                  collapsible={true}
                  onToggle={() => handleToggle(step.stepID)}
                >
                  {issues.map((issue) => {
                    return (
                      <div key={issue.item} ref={issue.item === scrollToStep ? scrollToRef : null}>
                        <IssueDescription
                          item={issue.item}
                          isHidden={issue.isHidden}
                          isRetrying={issue.isRetrying}
                          canRetry={check.canRetry}
                          isCompleted={isCompleted}
                          checkName={check.name}
                          checkType={check.type}
                          itemID={issue.itemID}
                          stepID={step.stepID}
                          links={issue.links}
                          onHideIssue={(isHidden) => handleHideIssue(step.stepID, issue.itemID, isHidden)}
                          onRetryCheck={() => retryCheck(check.name, issue.itemID)}
                        />
                      </div>
                    );
                  })}
                </Collapse>
              )}
            </div>
          );
        });
      })}
    </div>
  );
}

const getStyles = () => (theme: GrafanaTheme2) => {
  return {
    container: css({
      marginTop: theme.spacing(2),
    }),
    spacingTopLg: css({
      marginTop: theme.spacing(5),
    }),
    spacingTopMd: css({
      marginTop: theme.spacing(2),
    }),
    description: css({
      a: {
        color: theme.colors.text.link,
        cursor: 'pointer',
        ':hover': {
          textDecoration: 'underline',
        },
      },
      marginBottom: theme.spacing(1),
      textAlign: 'left',
    }),
    resolution: css({
      color: theme.colors.text.secondary,
      marginRight: theme.spacing(1),
    }),
  };
};
