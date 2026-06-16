import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { useStyles2, FieldSet, LoadingPlaceholder } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { useCheckTypes, useSkipCheckTypeStep } from 'api/api';
import { CheckTypeList } from './CheckTypeList';

export const AppConfig = () => {
  const s = useStyles2(getStyles);
  const { checkTypes, isLoading, isError, refetch } = useCheckTypes();
  const { updateIgnoreStepsAnnotation, updateCheckTypeState } = useSkipCheckTypeStep();
  const prevIsLoadingRef = React.useRef(updateCheckTypeState.isLoading);

  useEffect(() => {
    if (prevIsLoadingRef.current && !updateCheckTypeState.isLoading) {
      refetch(); // Refetch to get the updated check types
    }
    prevIsLoadingRef.current = updateCheckTypeState.isLoading;
  }, [refetch, updateCheckTypeState.isLoading]);

  return (
    <FieldSet label="Available Check Types">
      <div className={s.description}>Enable or disable the steps for each check type.</div>
      {isLoading && <LoadingPlaceholder text="Loading check types..." />}
      {isError && <div>Error loading check types</div>}
      {!isLoading && !isError && !checkTypes?.length && <div>No check types available</div>}
      {!isLoading && !isError && checkTypes?.length && (
        <CheckTypeList
          checkTypes={checkTypes}
          updateIgnoreStepsAnnotation={updateIgnoreStepsAnnotation}
          updateCheckTypeState={updateCheckTypeState}
        />
      )}
    </FieldSet>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  description: css`
    margin-bottom: ${theme.spacing(2)};
  `,
});
