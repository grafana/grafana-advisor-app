import React from 'react';
import { css } from '@emotion/css';
import { useStyles2, FieldSet, Card, LoadingPlaceholder, Switch, Stack } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { IGNORE_STEPS_ANNOTATION, IGNORE_STEPS_ANNOTATION_LIST, useCheckTypes, useSkipCheckTypeStep } from 'api/api';

export type JsonData = {
  apiUrl?: string;
};

export const AppConfig = () => {
  const s = useStyles2(getStyles);
  const { checkTypes, isLoading, isError } = useCheckTypes();
  const { updateIgnoreStepsAnnotation, updateCheckTypeState } = useSkipCheckTypeStep();

  return (
    <FieldSet label="Available Check Types">
      <div className={s.description}>Enable or disable the steps for each check type.</div>
      {isLoading && <LoadingPlaceholder text="Loading check types..." />}
      {isError && <div>Error loading check types</div>}
      {!isLoading && !isError && checkTypes && checkTypes.length === 0 && <div>No check types available</div>}
      {!isLoading && !isError && checkTypes && checkTypes.length > 0 && (
        <div className={s.checkTypesList}>
          {checkTypes.map((checkType) => {
            const typeName = checkType.metadata.name!;
            const canIgnoreSteps = checkType.metadata.annotations?.[IGNORE_STEPS_ANNOTATION] !== '';
            const ignoreSteps =
              checkType.metadata.annotations?.[IGNORE_STEPS_ANNOTATION_LIST]?.split(',').filter(Boolean) || [];
            return (
              <Card key={typeName} className={s.checkTypeCard}>
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
                    <div className={s.missingAnnotationNote}>
                      Your current version of Grafana does not support ignoring steps
                    </div>
                  )}
                </Card.Description>
              </Card>
            );
          })}
        </div>
      )}
    </FieldSet>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  description: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  checkTypesList: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    gap: ${theme.spacing(2)};
  `,
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
