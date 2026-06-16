import React from 'react';
import { css } from '@emotion/css';
import { useStyles2, Card, Switch, Stack } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { IGNORE_STEPS_ANNOTATION, IGNORE_STEPS_ANNOTATION_LIST } from 'api/api';
import { CheckType } from 'generated';
import { testIds } from 'components/testIds';

interface CheckTypeItemProps {
  checkType: CheckType;
  updateIgnoreStepsAnnotation: (typeName: string, ignoreSteps: string[]) => void;
  updateCheckTypeState: { isLoading: boolean };
}

export const CheckTypeItem: React.FC<CheckTypeItemProps> = ({
  checkType,
  updateIgnoreStepsAnnotation,
  updateCheckTypeState,
}) => {
  const s = useStyles2(getStyles);
  const typeName = checkType.metadata.name!;
  const canIgnoreSteps = checkType.metadata.annotations?.[IGNORE_STEPS_ANNOTATION] !== '';
  const ignoreSteps = checkType.metadata.annotations?.[IGNORE_STEPS_ANNOTATION_LIST]?.split(',').filter(Boolean) || [];

  return (
    <Card className={s.checkTypeCard}>
      <Card.Heading>Check type: {checkType.spec.name}</Card.Heading>
      <Card.Description>
        <div>Steps:</div>
        <ul className={s.stepsList}>
          {checkType.spec.steps.map((step) => (
            <li key={step.stepID} className={s.stepItem}>
              <Stack direction="row">
                <div className={s.switchWrapper}>
                  <Switch
                    value={!ignoreSteps.includes(step.stepID)}
                    data-testid={testIds.AppConfig.ignoreSwitch(step.stepID)}
                    onChange={(e) => {
                      const ignore = !e.currentTarget.checked;
                      if (ignore) {
                        ignoreSteps.push(step.stepID);
                      } else {
                        ignoreSteps.splice(ignoreSteps.indexOf(step.stepID), 1);
                      }
                      updateIgnoreStepsAnnotation(typeName, ignoreSteps);
                    }}
                    disabled={!canIgnoreSteps || updateCheckTypeState.isLoading}
                  />
                </div>
                <div className={s.stepDescription}>
                  <strong>{step.title}</strong> - {step.description}
                </div>
              </Stack>
            </li>
          ))}
        </ul>
        {!canIgnoreSteps && (
          <div className={s.missingAnnotationNote}>Your current version of Grafana does not support ignoring steps</div>
        )}
      </Card.Description>
    </Card>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  checkTypeCard: css`
    width: 100%;
    max-width: 100%;
    margin-bottom: ${theme.spacing(2)};
  `,
  missingAnnotationNote: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  stepsList: css`
    margin-top: ${theme.spacing(1)};
    padding-left: ${theme.spacing(1)};
    list-style: none;
    width: 100%;
  `,
  stepItem: css`
    margin-bottom: ${theme.spacing(1)};
    padding-bottom: ${theme.spacing(0.5)};
    background: ${theme.colors.background.secondary};
    width: 100%;
  `,
  stepDescription: css`
    flex: 1;
    word-break: break-word;
  `,
  switchWrapper: css`
    margin-right: ${theme.spacing(1)};
    margin-top: ${theme.spacing(0.5)};
    flex-shrink: 0;
  `,
});
