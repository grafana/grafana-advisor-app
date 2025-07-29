import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';
import { type CheckSummaries } from 'types';
import { useInteractionTracker } from '../api/useInteractionTracker';

interface Props {
  checkSummaries: CheckSummaries;
}

export function MoreInfo({ checkSummaries }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const styles = useStyles2(getStyles);
  const { trackGroupToggle } = useInteractionTracker();

  const handleToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
    trackGroupToggle('more_info', isOpen);
  };

  return (
    <Collapse isOpen={isOpen} onToggle={handleToggle} collapsible={true} label="More Info">
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
      </div>
    </Collapse>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      padding: theme.spacing(1),
      paddingTop: 0,
      color: theme.colors.text.secondary,
      position: 'relative',
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
