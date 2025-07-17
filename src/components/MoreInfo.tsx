import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse, LinkButton, Switch, Field } from '@grafana/ui';
import { type CheckSummaries } from 'types';
import { useInteractionTracker } from '../api/useInteractionTracker';

interface Props {
  checkSummaries: CheckSummaries;
  showHiddenIssues: boolean;
  setShowHiddenIssues: (showHiddenIssues: boolean) => void;
}

export function MoreInfo({ checkSummaries, showHiddenIssues, setShowHiddenIssues }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const styles = useStyles2(getStyles);
  const { trackGlobalAction } = useInteractionTracker();

  const handleConfigureClick = () => {
    trackGlobalAction('configure_clicked');
  };

  return (
    <Collapse
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      collapsible={true}
      label={
        <div className={styles.labelContainer}>
          <span>More Info</span>
          <LinkButton
            icon="cog"
            variant="secondary"
            size="sm"
            fill="text"
            aria-label="Configuration"
            tooltip="Configure advisor steps"
            className={styles.configButton}
            href="/plugins/grafana-advisor-app?page=configuration"
            onClick={handleConfigureClick}
          />
        </div>
      }
    >
      <div className={styles.container}>
        <div>Summary: </div>
        {Object.values(checkSummaries.high.checks).map((check) => (
          <div key={check.type} className={styles.check}>
            <div className={styles.checkTitle}>
              {check.totalCheckCount} {check.typeName || check.type}(s) analyzed
            </div>
            <div>
              {Object.values(check.steps).map((step) => (
                <div key={step.name} className={styles.step}>
                  <span className={styles.stepTitle}>- {step.name}</span>
                  <span className={styles.stepDescription}>{step.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div>Options: </div>
          <Field
            label="Show silenced issues"
            description="Silenced issues are still evaluated but can be hidden from this report"
          >
            <Switch value={showHiddenIssues} onChange={() => setShowHiddenIssues(!showHiddenIssues)} />
          </Field>
        </div>
      </div>
    </Collapse>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    labelContainer: css({
      display: 'flex',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
    container: css({
      padding: theme.spacing(1),
      paddingTop: 0,
      color: theme.colors.text.secondary,
      position: 'relative',
    }),
    configButton: css({
      marginRight: theme.spacing(1),
      opacity: 0.7,
    }),
    check: css({
      marginBottom: theme.spacing(2),
    }),
    checkTitle: css({
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightBold,
    }),
    step: css({
      paddingLeft: theme.spacing(1),
    }),
    stepTitle: css({
      color: theme.colors.text.primary,
    }),
    stepDescription: css({
      paddingLeft: theme.spacing(1),
    }),
  };
};
