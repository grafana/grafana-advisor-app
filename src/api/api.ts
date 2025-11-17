import { CheckSummaries, Severity, CheckStatus } from 'types';
import {
  Check,
  useListCheckQuery,
  useListCheckTypeQuery,
  useCreateCheckMutation,
  useDeleteCheckMutation,
  useUpdateCheckMutation,
  useUpdateCheckTypeMutation,
  useLazyGetCheckQuery,
  useCreateRegisterMutation,
} from 'generated';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { config, usePluginUserStorage } from '@grafana/runtime';
import { CheckReportFailure, CheckTypeSpec } from 'generated/endpoints.gen';
import { llm } from '@grafana/llm';

export const STATUS_ANNOTATION = 'advisor.grafana.app/status';
export const CHECK_TYPE_LABEL = 'advisor.grafana.app/type';
export const CHECK_TYPE_NAME_ANNOTATION = 'advisor.grafana.app/checktype-name';
export const RETRY_ANNOTATION = 'advisor.grafana.app/retry';
export const IGNORE_STEPS_ANNOTATION = 'advisor.grafana.app/ignore-steps';
export const IGNORE_STEPS_ANNOTATION_LIST = 'advisor.grafana.app/ignore-steps-list';
export const LLM_RESPONSE_ANNOTATION_PREFIX = 'advisor.grafana.app/llm-response';

const API_PAGE_SIZE = 1000;

export function useCheckSummaries() {
  const { checks, ...listChecksState } = useLastChecks();
  const { checkTypes, ...listCheckTypesState } = useCheckTypes();
  const [showHiddenIssues, setShowHiddenIssues] = useState(false);
  const { isIssueHidden, handleHideIssue, hasHiddenIssues } = useHiddenIssues();

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

      checkSummary[Severity.High].checks[checkType].totalCheckCount = check.status?.report?.count ?? 0;
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
      if (check.status?.report?.failures) {
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
    isError: listChecksState.isError || listCheckTypesState.isError,
    error: listChecksState.error || listCheckTypesState.error,
    showHiddenIssues,
    setShowHiddenIssues,
    handleHideIssue,
    hasHiddenIssues,
    partialResults: !!listChecksState.data?.metadata?.continue,
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
  const { isRegistered, isRegistering } = useRegister();
  const listCheckTypesState = useListCheckTypeQuery(
    {},
    {
      skip: !isRegistered,
    }
  );
  const { data, refetch } = listCheckTypesState;

  // Refetch check types after successful registration
  useEffect(() => {
    if (isRegistered && !isRegistering && refetch) {
      refetch();
    }
  }, [isRegistered, isRegistering, refetch]);

  return {
    checkTypes: data?.items,
    ...listCheckTypesState,
    isLoading: listCheckTypesState.isLoading || isRegistering,
  };
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
  const listChecksState = useListCheckQuery({ limit: API_PAGE_SIZE });
  const { data } = listChecksState;

  const checks = useMemo(() => {
    if (!data?.items) {
      return [];
    }

    const checkByType: Record<string, Check> = {};
    for (const check of data.items) {
      const type = check.metadata.labels?.[CHECK_TYPE_LABEL];

      if (!type || !check.metadata.creationTimestamp) {
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
    { limit: API_PAGE_SIZE },
    {
      refetchOnMountOrArgChange: true,
      pollingInterval,
    }
  );

  const checkStatuses = useMemo((): CheckStatus[] => {
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
      .map((check): CheckStatus => {
        // Use the creation timestamp or the last managed field timestamp
        let lastUpdate = check.metadata.creationTimestamp ? new Date(check.metadata.creationTimestamp) : new Date(0);
        for (const field of check.metadata.managedFields ?? []) {
          if (field.time && new Date(field.time) > lastUpdate) {
            lastUpdate = new Date(field.time);
          }
        }
        return {
          name: check.metadata.labels?.[CHECK_TYPE_LABEL] ?? '',
          lastUpdate: lastUpdate,
          incomplete:
            !check.metadata.annotations?.[STATUS_ANNOTATION] ||
            (check.metadata.annotations?.[RETRY_ANNOTATION] !== undefined &&
              check.metadata.annotations?.[STATUS_ANNOTATION] !== 'error'),
          hasError: check.metadata.annotations?.[STATUS_ANNOTATION] === 'error',
        };
      });
  }, [listChecksState.data, names]);

  // Update polling interval based on incomplete checks
  useEffect(() => {
    setPollingInterval(checkStatuses.filter((check) => check.incomplete).length > 0 ? 2000 : 0);
  }, [checkStatuses]);

  return {
    checkStatuses,
    ...listChecksState,
  };
}

export function useCompletedChecks(names?: string[]) {
  const { checkStatuses, isLoading, ...incompleteChecksState } = useIncompleteChecks(names);

  return {
    isCompleted: checkStatuses.filter((check) => check.incomplete).length === 0,
    checkStatuses,
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
  const [hasHiddenIssues, setHasHiddenIssues] = useState(false);

  useEffect(() => {
    userStorage.getItem('hiddenIssues').then((hiddenIssues) => {
      if (hiddenIssues) {
        const hiddenIssuesArray = hiddenIssues.split(',');
        setHiddenIssues(hiddenIssuesArray);
        setHasHiddenIssues(hiddenIssuesArray.length > 0);
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
        setHasHiddenIssues(newHiddenIssues.length > 0);
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

  return { handleHideIssue, isIssueHidden, hasHiddenIssues };
};

async function llmRequest(failure: CheckReportFailure) {
  // Construct messages for the LLM
  const messages: llm.Message[] = [
    { role: 'system', content: 'You are an experienced, competent SRE with knowledge of Grafana.' },
    {
      role: 'user',
      content:
        `I have received an error message from the Grafana Advisor with the following details:\n\n` +
        `Step ID: ${failure.stepID}\n` +
        `Item ID: ${failure.itemID}\n` +
        `Item: ${failure.item}\n` +
        `Severity: ${failure.severity}\n` +
        `More info: ${failure.moreInfo}\n` +
        `Links: ${failure.links.map((link) => `${link.message} (${link.url})`).join(', ') || 'N/A'}\n\n` +
        `Provide a more detailed explanation of this issue and if there is a known solution, provide next steps to resolve it.\n\n` +
        `Be as concise as possible. Avoid using internal terminology like the IDs and use human readable language instead.`,
    },
  ];

  const result = await llm.chatCompletions({
    model: llm.Model.BASE,
    messages,
  });

  return result?.choices[0]?.message?.content || '';
}

export function useLLMSuggestion() {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [getCheck, _] = useLazyGetCheckQuery();
  const [updateCheck] = useUpdateCheckMutation();

  const getSuggestion = useCallback(
    async (checkName: string, stepID: string, itemID: string) => {
      setIsLoading(true);

      try {
        // Find the specific failure from the check data
        const { data: check } = await getCheck({ name: checkName });
        if (!check?.status?.report?.failures) {
          console.error('No failures found for check:', checkName);
          setIsLoading(false);
          return;
        }

        const failure = check.status.report.failures.find((f) => f.stepID === stepID && f.itemID === itemID);
        if (!failure) {
          console.error('No failure found for stepID:', stepID, 'and itemID:', itemID);
          setIsLoading(false);
          return;
        }

        // Create annotation key for this specific step+item combination
        const annotationKey = `${LLM_RESPONSE_ANNOTATION_PREFIX}-${stepID}-${itemID}`;

        // Check if we already have a cached response
        const cachedResponse = check.metadata.annotations?.[annotationKey];
        if (cachedResponse) {
          setResponse(cachedResponse);
          setIsLoading(false);
          return;
        }

        // Get the LLM response
        const content = await llmRequest(failure);
        setResponse(content);

        // Store the response content as an annotation in the check
        try {
          await updateCheck({
            name: checkName,
            patch: [
              {
                op: 'add',
                path: `/metadata/annotations/${annotationKey.replace(/\//g, '~1')}`,
                value: content,
              },
            ],
          });
        } catch (updateError) {
          console.error('Failed to cache LLM response:', updateError);
        }
      } catch (error) {
        console.error('Error getting LLM suggestion:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [getCheck, updateCheck]
  );

  return { getSuggestion, response, isLoading };
}

// Shared registration promise to prevent duplicate calls
let registrationPromise: Promise<void> | null = null;

// Helper function to reset registration state, exported for testing
export function _resetRegistration() {
  registrationPromise = null;
}

function useRegister() {
  const [createRegister, createRegisterState] = useCreateRegisterMutation();
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // If registration already in progress, wait for it
    if (registrationPromise) {
      registrationPromise.then(() => setIsRegistered(true)).catch(() => setIsRegistered(true)); // Allow check types to load even on error
      return;
    }

    // Start new registration
    registrationPromise = createRegister()
      .unwrap()
      .then(() => setIsRegistered(true))
      .catch((error: unknown) => {
        console.error('Failed to register check types:', error);
        setIsRegistered(true); // Still allow check types to load
      });
  }, [createRegister]);

  return {
    isRegistered: isRegistered || createRegisterState.isSuccess,
    isRegistering: createRegisterState.isLoading,
    registrationError: createRegisterState.error,
  };
}
