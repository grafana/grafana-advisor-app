import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Button, Collapse, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { type CheckSummary as CheckSummaryType } from 'types';
import { useLocation, useNavigate } from 'react-router-dom';

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

  const handleStepClick = (item: string) => {
    const params = new URLSearchParams(location.search);
    params.set('scrollToStep', item);
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleRetryCheck = (checkName: string, item: string) => {
    retryCheck(checkName, item);
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
                        {step.name} failed for {issues.length} {check.type}
                        {issues.length > 1 ? 's' : ''}.
                      </div>
                      <div className={styles.resolution} dangerouslySetInnerHTML={{ __html: step.resolution }}></div>
                    </div>
                  }
                  isOpen={isOpen[step.stepID] ?? false}
                  collapsible={true}
                  onToggle={() => handleToggle(step.stepID)}
                >
                  {issues.map((issue) => {
                    return (
                      <div
                        key={issue.item}
                        className={issue.isHidden ? styles.issueHidden : styles.issue}
                        ref={issue.item === scrollToStep ? scrollToRef : null}
                      >
                        <div className={styles.issueReason}>
                          {issue.item}
                          <Button
                            size="sm"
                            className={styles.issueLink}
                            icon={issue.isHidden ? 'bell' : 'bell-slash'}
                            variant="secondary"
                            title={issue.isHidden ? 'Show issue' : 'Hide issue'}
                            onClick={() => handleHideIssue(step.stepID, issue.itemID, !issue.isHidden)}
                          />
                          {check.canRetry && (
                            <Button
                              size="sm"
                              className={styles.issueLink}
                              icon={issue.isRetrying ? 'spinner' : 'sync'}
                              variant="secondary"
                              title="Retry check"
                              disabled={!isCompleted}
                              onClick={() => handleRetryCheck(check.name, issue.itemID)}
                            />
                          )}
                          {issue.links.map((link) => {
                            const extraProps = link.url.startsWith('http')
                              ? { target: '_self', rel: 'noopener noreferrer' }
                              : {};
                            return (
                              <a
                                key={link.url}
                                href={link.url}
                                onClick={() => handleStepClick(issue.item)}
                                {...extraProps}
                              >
                                <Button
                                  size="sm"
                                  className={styles.issueLink}
                                  icon={getIcon(link.message)}
                                  variant="secondary"
                                >
                                  {link.message}
                                </Button>
                              </a>
                            );
                          })}
                        </div>
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
    }),
    issue: css({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(2),
      marginBottom: theme.spacing(1),
      borderColor: 'transparent',
      borderStyle: 'solid',
      ':hover': {
        borderColor: theme.colors.border.strong,
        borderStyle: 'solid',
      },
    }),
    issueHidden: css({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(2),
      marginBottom: theme.spacing(1),
      borderColor: 'transparent',
      borderStyle: 'solid',
      ':hover': {
        borderColor: theme.colors.border.strong,
        borderStyle: 'solid',
      },
      opacity: 0.6,
    }),
    issueReason: css({
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    issueLink: css({
      float: 'right',
      marginLeft: theme.spacing(1),
    }),
    bold: css({
      fontWeight: theme.typography.fontWeightBold,
    }),
  };
};

const getIcon = (message: string) => {
  message = message.toLowerCase();
  let icon: IconName = 'info-circle';
  if (message.includes('fix')) {
    icon = 'wrench';
  } else if (message.includes('info')) {
    icon = 'document-info';
  } else if (message.includes('upgrade')) {
    icon = 'arrow-up';
  } else if (message.includes('delete')) {
    icon = 'trash-alt';
  } else if (message.includes('admin') || message.includes('settings') || message.includes('config')) {
    icon = 'cog';
  }
  return icon;
};
