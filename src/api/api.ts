import { CheckSummaries, Severity } from 'types';
import {
  Check,
  useListCheckQuery,
  useListCheckTypeQuery,
  useCreateCheckMutation,
  useDeleteCheckMutation,
} from './generated';
import React, { useEffect, useState } from 'react';
import { config } from '@grafana/runtime';
import { CheckTypeSpec } from './generated/endpoints.gen';

const STATUS_ANNOTATION = 'advisor.grafana.app/status';
const CHECK_TYPE_LABEL = 'advisor.grafana.app/type';

export function useCheckSummaries() {
  const { checks, ...listChecksState } = useLastChecks();
  const { checkTypes, ...listCheckTypesState } = useCheckTypes();

  const summaries = React.useMemo(() => {
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
    let totalIssueCount = 0;

    for (const check of checks) {
      const checkType = check.metadata.labels?.[CHECK_TYPE_LABEL];

      if (checkType === undefined || !checkSummary[Severity.High].checks[checkType]) {
        continue;
      }

      checkSummary[Severity.High].checks[checkType].totalCheckCount = check.status.report.count;

      const createdTimestamp = new Date(check.metadata.creationTimestamp ?? 0);
      const prevCreatedTimestamp = checkSummary[Severity.High].created;
      if (createdTimestamp > prevCreatedTimestamp) {
        checkSummary[Severity.High].created = createdTimestamp;
        checkSummary[Severity.Low].created = createdTimestamp;
      }

      if (check.status.report.failures) {
        for (const failure of check.status.report.failures) {
          const severity = failure.severity.toLowerCase() as Severity;
          const persistedCheck = checkSummary[severity].checks[checkType];
          const persistedStep = checkSummary[severity].checks[checkType].steps[failure.stepID];
          persistedCheck.issueCount++;
          persistedStep.issueCount++;
          totalIssueCount++;
          persistedStep.issues.push(failure);
        }
      }
    }

    return checkSummary;
  }, [checks, checkTypes]);

  return {
    summaries,
    isLoading: listChecksState.isLoading || listCheckTypesState.isLoading,
    isError: listChecksState.isError || listCheckTypesState.isError,
    error: listChecksState.error || listCheckTypesState.error,
  };
}

export function getEmptyCheckSummary(checkTypes: Record<string, CheckTypeSpec>): CheckSummaries {
  const generateChecks = () =>
    Object.values(checkTypes).reduce(
      (acc, checkType) => ({
        ...acc,
        [checkType.name]: {
          name: checkType.name,
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

export function useLastChecks() {
  const listChecksState = useListCheckQuery({});
  const { data } = listChecksState;

  const checks = React.useMemo(() => {
    if (!data?.items) {
      return [];
    }

    const checkByType: Record<string, Check> = {};
    for (const check of data.items) {
      const type = check.metadata.labels?.[CHECK_TYPE_LABEL];

      if (
        !type ||
        !check.metadata.creationTimestamp ||
        check.metadata.annotations?.[STATUS_ANNOTATION] !== 'processed'
      ) {
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

export function useCreateCheck(type: 'datasource' | 'plugin') {
  const [createCheck, createCheckState] = useCreateCheckMutation();

  const createCheckPopulated = React.useCallback(() => {
    const check = {
      kind: 'Check',
      apiVersion: 'advisor.grafana.app/v0alpha1',
      spec: { data: {} },
      metadata: {
        generateName: 'check-',
        labels: {
          'advisor.grafana.app/type': type,
        },
        namespace: config.namespace,
      },
      status: {
        report: {
          count: 0,
          failures: [],
        },
      },
    };
    return createCheck({ check });
  }, [createCheck, type]);

  return [createCheckPopulated, createCheckState] as const;
}

export function useDeleteChecks() {
  const [deleteCheckMutation, deleteChecksState] = useDeleteCheckMutation();

  const deleteChecks = () => deleteCheckMutation({ name: '' });

  return [deleteChecks, deleteChecksState] as const;
}

function useIncompleteChecks(names?: string[]) {
  const listChecksState = useListCheckQuery(
    {},
    {
      refetchOnMountOrArgChange: true,
      pollingInterval: 0, // We'll handle polling in useCompletedChecks
    }
  );
  const incompleteChecks = React.useMemo(() => {
    if (!listChecksState.data?.items) {
      return [];
    }
    return listChecksState.data.items
      .filter((check) => (names ? names.includes(check.metadata.name ?? '') : true))
      .filter((check) => !check.metadata.annotations?.[STATUS_ANNOTATION])
      .map((check) => check.metadata.name ?? '');
  }, [listChecksState.data, names]);

  return {
    incompleteChecks,
    ...listChecksState,
  };
}

export function useCompletedChecks(names?: string[]) {
  const { incompleteChecks, isLoading, refetch, ...incompleteChecksState } = useIncompleteChecks(names);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // If not completed and not loading, start polling
    if (incompleteChecks.length > 0 && !isLoading) {
      timeoutId = setTimeout(() => {
        refetch();
        setRetryCount((count) => count + 1);
      }, 2000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [incompleteChecks.length, isLoading, retryCount, refetch]);

  return {
    isCompleted: incompleteChecks.length === 0,
    isLoading,
    ...incompleteChecksState,
  };
}
