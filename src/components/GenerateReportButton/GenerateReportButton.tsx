import React from 'react';
import { IconName } from '@grafana/data';
import { Button } from '@grafana/ui';
import { GlobalActionType, useInteractionTracker } from 'api/useInteractionTracker';
import { useCreateChecks, useCheckTypes, useCompletedChecks } from 'api/api';

export interface GenerateReportButtonProps {
  /** Override the completed state. When omitted, derived automatically via useCompletedChecks. */
  isCompleted?: boolean;
  /** Custom label shown when the button is ready. */
  label?: string;
  /** Custom label shown while checks are running. */
  loadingLabel?: string;
  /**
   * When true, triggers check-type registration on mount so the button
   * works outside of the advisor plugin where registration hasn't happened yet.
   */
  autoRegister?: boolean;
  /** Icon shown when the button is ready. Defaults to "plus". */
  icon?: IconName;
  /** Called after the internal create-checks action runs. */
  onClick?: () => void;
}

export function GenerateReportButton({
  isCompleted: isCompletedProp,
  label = 'Generate report',
  loadingLabel = 'Running checks...',
  autoRegister = false,
  icon = 'plus',
  onClick,
}: GenerateReportButtonProps) {
  const { createChecks } = useCreateChecks();
  const { trackGlobalAction } = useInteractionTracker();
  const { isLoading: isCheckTypesLoading } = useCheckTypes({ skip: !autoRegister });
  const { isCompleted: isCompletedDerived } = useCompletedChecks();

  const isCompleted = isCompletedProp ?? isCompletedDerived;
  const isReady = autoRegister ? isCompleted && !isCheckTypesLoading : isCompleted;

  const handleClick = () => {
    createChecks();
    trackGlobalAction(GlobalActionType.REFRESH_CLICKED);
    onClick?.();
  };

  return (
    <Button onClick={handleClick} disabled={!isReady} variant="primary" icon={isReady ? icon : 'spinner'}>
      {isReady ? label : loadingLabel}
    </Button>
  );
}
