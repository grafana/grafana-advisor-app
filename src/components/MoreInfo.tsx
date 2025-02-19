import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';
import { type CheckSummaries } from 'types';

interface Props {
  checkSummaries: CheckSummaries;
}

export function MoreInfo({ checkSummaries }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const styles = useStyles2(getStyles);

  return (
    <Collapse label={'More info'} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} collapsible={true}>
      <div className={styles.container}>
        {Object.values(checkSummaries.high.checks).map((check) => (
          <div key={check.name} className={styles.check}>
            <div className={styles.checkTitle}>
              {check.totalCheckCount} {check.name}(s) analyzed
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
