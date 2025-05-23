import { CheckSummaries, Severity } from 'types';
import {
  Check,
  useListCheckQuery,
  useListCheckTypeQuery,
  useCreateCheckMutation,
  useDeleteCheckMutation,
  useUpdateCheckMutation,
  useUpdateCheckTypeMutation,
} from 'generated';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { config, usePluginUserStorage } from '@grafana/runtime';
import { CheckTypeSpec } from 'generated/endpoints.gen';

export const STATUS_ANNOTATION = 'advisor.grafana.app/status';
export const CHECK_TYPE_LABEL = 'advisor.grafana.app/type';
export const CHECK_TYPE_NAME_ANNOTATION = 'advisor.grafana.app/checktype-name';
export const RETRY_ANNOTATION = 'advisor.grafana.app/retry';
export const IGNORE_STEPS_ANNOTATION = 'advisor.grafana.app/ignore-steps';
export const IGNORE_STEPS_ANNOTATION_LIST = 'advisor.grafana.app/ignore-steps-list';

export function useCheckSummaries() {
  const { checks, ...listChecksState } = useLastChecks();
  const { checkTypes, ...listCheckTypesState } = useCheckTypes();
  const [showHiddenIssues, setShowHiddenIssues] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { isIssueHidden, handleHideIssue } = useHiddenIssues();

  const summaries = useMemo(() => {
    if (!checks || !checkTypes) {
      return getEmptyCheckSummary(getEmptyCheckTypes());
    }

    const checkSummary = getEmptyCheckSummary(
      checkTypes.reduce(
        (acc, checkType) => ({
          ...acc,
          [checkType.metadata.name as string]: {
            name: checkType.spec.name,
            steps: checkType.spec.steps,
          },
        }),
        {}
      )
    );

    for (const check of checks) {
      const checkType = check.metadata.labels?.[CHECK_TYPE_LABEL];

      if (checkType === undefined || !checkSummary[Severity.High].checks[checkType]) {
        continue;
      }

      const checkTypeDefinition = checkTypes.find((ct) => ct.metadata.name === checkType);

      if (check.metadata.annotations?.[STATUS_ANNOTATION] === 'error') {
        setHasError(true);
      }

      checkSummary[Severity.High].checks[checkType].totalCheckCount = check.status.report.count;
      checkSummary[Severity.High].checks[checkType].typeName =
        checkTypeDefinition?.metadata.annotations?.[CHECK_TYPE_NAME_ANNOTATION] ?? checkType;
      checkSummary[Severity.High].checks[checkType].name = check.metadata.name ?? '';
      checkSummary[Severity.Low].checks[checkType].name = check.metadata.name ?? '';
      const canRetry = !!checkTypeDefinition?.metadata.annotations?.[RETRY_ANNOTATION];
      // Enable retry if the check type has a retry annotation
      checkSummary[Severity.High].checks[checkType].canRetry = canRetry;
      checkSummary[Severity.Low].checks[checkType].canRetry = canRetry;
      // Get the steps that are ignored for the check type
      const ignoreSteps = check.metadata.annotations?.[IGNORE_STEPS_ANNOTATION_LIST];
      if (ignoreSteps) {
        const steps = ignoreSteps.split(',');
        for (const step of steps) {
          delete checkSummary[Severity.High].checks[checkType].steps[step];
          delete checkSummary[Severity.Low].checks[checkType].steps[step];
          // Remove the check type if all steps are ignored
          if (Object.keys(checkSummary[Severity.Low].checks[checkType].steps).length === 0) {
            delete checkSummary[Severity.Low].checks[checkType];
          }
          if (Object.keys(checkSummary[Severity.High].checks[checkType].steps).length === 0) {
            delete checkSummary[Severity.High].checks[checkType];
          }
        }
      }

      const createdTimestamp = new Date(check.metadata.creationTimestamp ?? 0);
      const prevCreatedTimestamp = checkSummary[Severity.High].created;
      if (createdTimestamp > prevCreatedTimestamp) {
        checkSummary[Severity.High].created = createdTimestamp;
        checkSummary[Severity.Low].created = createdTimestamp;
      }

      const retryAnnotation = check.metadata.annotations?.[RETRY_ANNOTATION];
      if (check.status.report.failures) {
        for (const failure of check.status.report.failures) {
          const severity = failure.severity.toLowerCase() as Severity;
          const persistedCheck = checkSummary[severity].checks[checkType];
          const persistedStep = checkSummary[severity].checks[checkType].steps[failure.stepID];
          if (!persistedStep) {
            console.error(`Step ${failure.stepID} not found for check ${check.metadata.name}`);
            continue;
          }
          if (showHiddenIssues || !isIssueHidden(failure.stepID, failure.itemID)) {
            persistedCheck.issueCount++;
            persistedStep.issueCount++;
          }
          persistedStep.issues.push({
            ...failure,
            isRetrying: retryAnnotation ? failure.itemID === retryAnnotation : false,
            isHidden: isIssueHidden(failure.stepID, failure.itemID),
          });
        }
      }
    }

    return checkSummary;
  }, [checks, checkTypes, isIssueHidden, showHiddenIssues]);

  return {
    summaries,
    isLoading: listChecksState.isLoading || listCheckTypesState.isLoading,
    isError: listChecksState.isError || listCheckTypesState.isError || hasError,
    error: listChecksState.error || listCheckTypesState.error,
    showHiddenIssues,
    setShowHiddenIssues,
    handleHideIssue,
  };
}

export function getEmptyCheckSummary(checkTypes: Record<string, CheckTypeSpec>): CheckSummaries {
  const generateChecks = () =>
    Object.values(checkTypes).reduce(
      (acc, checkType) => ({
        ...acc,
        [checkType.name]: {
          type: checkType.name,
          name: '',
          description: '',
          totalCheckCount: 0,
          issueCount: 0,
          steps: checkType.steps.reduce(
            (acc, step) => ({
              ...acc,
              [step.stepID]: {
                name: step.title,
                description: step.description,
                stepID: step.stepID,
                issueCount: 0,
                issues: [],
                resolution: step.resolution,
              },
            }),
            {}
          ),
        },
      }),
      {}
    );

  return {
    high: {
      name: 'Action needed',
      description: 'These checks require immediate action.',
      severity: Severity.High,
      checks: generateChecks(),
      created: new Date(0),
    },
    low: {
      name: 'Investigation needed',
      description: 'These checks require further investigation.',
      severity: Severity.Low,
      checks: generateChecks(),
      created: new Date(0),
    },
  };
}

export function getEmptyCheckTypes(): Record<string, CheckTypeSpec> {
  return {
    datasource: {
      name: 'datasource',
      steps: [
        {
          stepID: 'step1',
          title: 'Step 1',
          description: 'Step description ...',
          resolution: 'Resolution ...',
        },
      ],
    },
    plugin: {
      name: 'plugin',
      steps: [
        {
          stepID: 'step1',
          title: 'Step 1',
          description: 'Step description ...',
          resolution: 'Resolution ...',
        },
      ],
    },
  };
}

export function useCheckTypes() {
  const listCheckTypesState = useListCheckTypeQuery({});
  const { data } = listCheckTypesState;

  return { checkTypes: data?.items, ...listCheckTypesState };
}

export function useSkipCheckTypeStep() {
  const [updateCheckType, updateCheckTypeState] = useUpdateCheckTypeMutation();

  const updateIgnoreStepsAnnotation = useCallback(
    (checkType: string, stepsToIgnore: string[]) => {
      const annotation = stepsToIgnore.join(',');
      updateCheckType({
        name: checkType,
        patch: [
          {
            op: 'add',
            path: '/metadata/annotations/advisor.grafana.app~1ignore-steps-list',
            value: annotation,
          },
        ],
      });
    },
    [updateCheckType]
  );

  return { updateIgnoreStepsAnnotation, updateCheckTypeState };
}

export function useLastChecks() {
  const listChecksState = useListCheckQuery({});
  const { data } = listChecksState;

  const checks = useMemo(() => {
    if (!data?.items) {
      return [];
    }

    const checkByType: Record<string, Check> = {};
    for (const check of data.items) {
      const type = check.metadata.labels?.[CHECK_TYPE_LABEL];

      if (!type || !check.metadata.creationTimestamp || !check.metadata.annotations?.[STATUS_ANNOTATION]) {
        continue;
      }

      if (
        !checkByType[type] ||
        new Date(check.metadata.creationTimestamp) > new Date(checkByType[type].metadata.creationTimestamp ?? 0)
      ) {
        checkByType[type] = check;
      }
    }

    return Object.values(checkByType);
  }, [data]);

  return { checks, ...listChecksState };
}

export function useCreateChecks() {
  const { checkTypes } = useCheckTypes();
  const [createCheck, createCheckState] = useCreateCheckMutation();

  const createChecks = useCallback(() => {
    if (!checkTypes) {
      return;
    }
    for (const type of checkTypes) {
      createCheck({
        check: {
          kind: 'Check',
          apiVersion: 'advisor.grafana.app/v0alpha1',
          spec: { data: {} },
          metadata: {
            generateName: 'check-',
            labels: { 'advisor.grafana.app/type': type.metadata.name ?? '' },
            namespace: config.namespace,
          },
          status: { report: { count: 0, failures: [] } },
        },
      });
    }
  }, [createCheck, checkTypes]);

  return { createChecks, createCheckState };
}

export function useDeleteChecks() {
  const [deleteCheckMutation, deleteChecksState] = useDeleteCheckMutation();
  const deleteChecks = () => deleteCheckMutation({ name: '' });

  return { deleteChecks, deleteChecksState };
}

function useIncompleteChecks(names?: string[]) {
  const [pollingInterval, setPollingInterval] = useState(2000);
  const listChecksState = useListCheckQuery(
    {},
    {
      refetchOnMountOrArgChange: true,
      pollingInterval,
    }
  );
  const incompleteChecks = useMemo(() => {
    if (!listChecksState.data?.items) {
      return [];
    }

    // Group checks by type and keep only the most recent one
    const checksByType = new Map<string, Check>();
    for (const check of listChecksState.data.items) {
      const type = check.metadata.labels?.[CHECK_TYPE_LABEL];
      if (!type) {
        continue;
      }

      const existingCheck = checksByType.get(type);
      if (
        !existingCheck ||
        (check.metadata.creationTimestamp &&
          existingCheck.metadata.creationTimestamp &&
          new Date(check.metadata.creationTimestamp) > new Date(existingCheck.metadata.creationTimestamp))
      ) {
        checksByType.set(type, check);
      }
    }

    // Filter incomplete checks from the most recent ones
    return Array.from(checksByType.values())
      .filter((check) => (names ? names.includes(check.metadata.name ?? '') : true))
      .filter(
        (check) =>
          !check.metadata.annotations?.[STATUS_ANNOTATION] ||
          (check.metadata.annotations?.[RETRY_ANNOTATION] !== undefined &&
            check.metadata.annotations?.[STATUS_ANNOTATION] !== 'error')
      )
      .map((check) => check.metadata.name ?? '');
  }, [listChecksState.data, names]);

  // Update polling interval based on incomplete checks
  useEffect(() => {
    setPollingInterval(incompleteChecks.length > 0 ? 2000 : 0);
  }, [incompleteChecks.length]);

  return {
    incompleteChecks,
    ...listChecksState,
  };
}

export function useCompletedChecks(names?: string[]) {
  const { incompleteChecks, isLoading, ...incompleteChecksState } = useIncompleteChecks(names);

  return {
    isCompleted: incompleteChecks.length === 0,
    isLoading,
    ...incompleteChecksState,
  };
}

export function useRetryCheck() {
  const [updateCheck, updateCheckState] = useUpdateCheckMutation();

  const retryCheck = useCallback(
    (checkName: string, itemID: string) => {
      updateCheck({
        name: checkName,
        patch: [
          {
            op: 'add',
            path: '/metadata/annotations/advisor.grafana.app~1retry',
            value: itemID,
          },
        ],
      });
    },
    [updateCheck]
  );

  return {
    retryCheck,
    retryCheckState: updateCheckState,
  };
}

const useHiddenIssues = () => {
  const [hiddenIssues, setHiddenIssues] = useState<string[]>([]);
  const userStorage = usePluginUserStorage();

  useEffect(() => {
    userStorage.getItem('hiddenIssues').then((hiddenIssues) => {
      if (hiddenIssues) {
        setHiddenIssues(hiddenIssues.split(','));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHideIssue = useCallback(
    (stepID: string, itemID: string, isHidden: boolean) => {
      const ID = `${stepID}-${itemID}`;
      setHiddenIssues((prevHiddenIssues) => {
        let newHiddenIssues;
        if (isHidden) {
          newHiddenIssues = [...prevHiddenIssues, ID];
        } else {
          newHiddenIssues = prevHiddenIssues.filter((hiddenIssue) => hiddenIssue !== ID);
        }
        userStorage.setItem('hiddenIssues', newHiddenIssues.join(','));
        return newHiddenIssues;
      });
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const isIssueHidden = useCallback(
    (stepID: string, itemID: string) => {
      return hiddenIssues.includes(`${stepID}-${itemID}`);
    },
    [hiddenIssues]
  );

  return { handleHideIssue, isIssueHidden };
};
