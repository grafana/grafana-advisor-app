import React from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckType } from 'generated';
import { CheckTypeItem } from './CheckTypeItem';

interface CheckTypeListProps {
  checkTypes: CheckType[];
  updateIgnoreStepsAnnotation: (typeName: string, ignoreSteps: string[]) => void;
  updateCheckTypeState: { isLoading: boolean };
}

export const CheckTypeList: React.FC<CheckTypeListProps> = ({
  checkTypes,
  updateIgnoreStepsAnnotation,
  updateCheckTypeState,
}) => {
  const s = useStyles2(getStyles);

  return (
    <div className={s.checkTypesList}>
      {checkTypes.map((checkType) => (
        <CheckTypeItem
          key={checkType.metadata.name}
          checkType={checkType}
          updateIgnoreStepsAnnotation={updateIgnoreStepsAnnotation}
          updateCheckTypeState={updateCheckTypeState}
        />
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  checkTypesList: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    gap: ${theme.spacing(2)};
  `,
});
