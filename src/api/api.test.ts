import { renderHook, waitFor } from '@testing-library/react';
import {
  useCheckSummaries,
  useCheckTypes,
  useLastChecks,
  useCreateChecks,
  useDeleteChecks,
  useCompletedChecks,
  STATUS_ANNOTATION,
  CHECK_TYPE_LABEL,
  RETRY_ANNOTATION,
  useRetryCheck,
  useSkipCheckTypeStep,
  IGNORE_STEPS_ANNOTATION_LIST,
} from './api';
import { config } from '@grafana/runtime';

// Mock the generated API hooks
const mockListCheckQuery = jest.fn();
const mockListCheckTypeQuery = jest.fn();
const mockCreateCheckMutation = jest.fn();
const mockDeleteCheckMutation = jest.fn();
const mockUpdateCheckMutation = jest.fn();
const mockUpdateCheckTypeMutation = jest.fn();

jest.mock('generated', () => ({
  useListCheckQuery: (arg0: any, arg1: any) => mockListCheckQuery(arg0, arg1),
  useListCheckTypeQuery: () => mockListCheckTypeQuery(),
  useCreateCheckMutation: () => mockCreateCheckMutation(),
  useDeleteCheckMutation: () => mockDeleteCheckMutation(),
  useUpdateCheckMutation: () => mockUpdateCheckMutation(),
  useUpdateCheckTypeMutation: () => mockUpdateCheckTypeMutation(),
}));

// Mock config
jest.mock('@grafana/runtime', () => ({
  config: {
    namespace: 'test-namespace',
  },
  usePluginUserStorage: () => ({
    getItem: jest.fn().mockResolvedValue(''),
    setItem: jest.fn(),
  }),
}));

describe('API Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCheckTypes', () => {
    it('returns empty array when no data', () => {
      mockListCheckTypeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckTypes());
      expect(result.current.checkTypes).toEqual(undefined);
    });

    it('returns check types when data exists', () => {
      const mockCheckTypes = [
        {
          metadata: { name: 'type1' },
          spec: { name: 'Type 1', steps: [] },
        },
      ];

      mockListCheckTypeQuery.mockReturnValue({
        data: { items: mockCheckTypes },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckTypes());
      expect(result.current.checkTypes).toEqual(mockCheckTypes);
    });
  });

  describe('useSkipCheckTypeStep', () => {
    it('calls updateCheckTypeMutation with the correct parameters', () => {
      const mockUpdateCheckType = jest.fn();
      mockUpdateCheckTypeMutation.mockReturnValue([mockUpdateCheckType, { isError: false }]);
      const { result } = renderHook(() => useSkipCheckTypeStep());
      result.current.updateIgnoreStepsAnnotation('type1', ['step1']);
      expect(mockUpdateCheckType).toHaveBeenCalledWith({
        name: 'type1',
        patch: [{ op: 'add', path: '/metadata/annotations/advisor.grafana.app~1ignore-steps-list', value: 'step1' }],
      });
    });

    it('sets the default value if all the steps are removed', () => {
      const mockUpdateCheckType = jest.fn();
      mockUpdateCheckTypeMutation.mockReturnValue([mockUpdateCheckType, { isError: false }]);
      const { result } = renderHook(() => useSkipCheckTypeStep());
      result.current.updateIgnoreStepsAnnotation('type1', []);
      expect(mockUpdateCheckType).toHaveBeenCalledWith({
        name: 'type1',
        patch: [{ op: 'add', path: '/metadata/annotations/advisor.grafana.app~1ignore-steps-list', value: '' }],
      });
    });
  });

  describe('useLastChecks', () => {
    it('returns empty array when no data', () => {
      mockListCheckQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useLastChecks());
      expect(result.current.checks).toEqual([]);
    });

    it('returns only processed checks', () => {
      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed' },
            },
            status: { report: { count: 1, failures: [] } },
          },
          {
            metadata: {
              name: 'check2',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-02T00:00:00Z',
              annotations: {},
            },
            status: { report: { count: 1, failures: [] } },
          },
        ],
      };

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useLastChecks());
      expect(result.current.checks).toHaveLength(1);
      expect(result.current.checks[0].metadata.name).toBe('check1');
    });

    it('returns only the latest check for each type', () => {
      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed' },
            },
            status: { report: { count: 1, failures: [] } },
          },
          {
            metadata: {
              name: 'check2',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-02T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed' },
            },
            status: { report: { count: 1, failures: [] } },
          },
        ],
      };

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useLastChecks());
      expect(result.current.checks).toHaveLength(1);
      expect(result.current.checks[0].metadata.name).toBe('check2');
    });
  });

  describe('useCheckSummaries', () => {
    it('returns empty summary when no data', () => {
      mockListCheckQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      });

      mockListCheckTypeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.created.getTime()).toBe(0);
      expect(result.current.summaries.low.created.getTime()).toBe(0);
    });

    it('aggregates check failures by severity', () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: { name: 'type1' },
            spec: {
              name: 'type1',
              steps: [{ stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' }],
            },
          },
        ],
      };

      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed' },
            },
            status: {
              report: {
                count: 2,
                failures: [
                  { stepID: 'step1', severity: 'High' },
                  { stepID: 'step1', severity: 'Low' },
                ],
              },
            },
          },
        ],
      };

      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.checks.type1.issueCount).toBe(1);
      expect(result.current.summaries.low.checks.type1.issueCount).toBe(1);
    });

    it('enables retry if the check type has a retry annotation', () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: {
              name: 'type1',
              annotations: { [RETRY_ANNOTATION]: 'item1' },
            },
            spec: {
              name: 'type1',
              steps: [{ stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' }],
            },
          },
        ],
      };
      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.checks.type1.canRetry).toBe(true);
    });

    it('marks a failure as retrying if the itemID matches the retry annotation', () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: { name: 'type1' },
            spec: {
              name: 'type1',
              steps: [{ stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' }],
            },
          },
        ],
      };

      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed', [RETRY_ANNOTATION]: 'item1' },
            },
            status: {
              report: {
                count: 1,
                failures: [{ stepID: 'step1', severity: 'High', itemID: 'item1' }],
              },
            },
          },
        ],
      };

      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.checks.type1.issueCount).toBe(1);
      expect(result.current.summaries.high.checks.type1.steps.step1.issues[0].isRetrying).toBe(true);
    });

    it('removes a check type step if it is ignored', () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: { name: 'type1' },
            spec: {
              name: 'type1',
              steps: [
                { stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' },
                { stepID: 'step2', title: 'Step 2', description: 'desc', resolution: 'res' },
              ],
            },
          },
        ],
      };

      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed', [IGNORE_STEPS_ANNOTATION_LIST]: 'step1' },
            },
            status: { report: { count: 1, failures: [] } },
          },
        ],
      };

      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.checks.type1.steps.step1).toBeUndefined();
      expect(result.current.summaries.low.checks.type1.steps.step1).toBeUndefined();
      expect(result.current.summaries.high.checks.type1.steps.step2).toBeDefined();
      expect(result.current.summaries.low.checks.type1.steps.step2).toBeDefined();
    });

    it('removes a check type if all steps are ignored', () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: { name: 'type1' },
            spec: {
              name: 'type1',
              steps: [
                { stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' },
                { stepID: 'step2', title: 'Step 2', description: 'desc', resolution: 'res' },
              ],
            },
          },
        ],
      };

      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed', [IGNORE_STEPS_ANNOTATION_LIST]: 'step1,step2' },
            },
            status: { report: { count: 1, failures: [] } },
          },
        ],
      };

      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.checks.type1).toBeUndefined();
      expect(result.current.summaries.low.checks.type1).toBeUndefined();
    });

    it('hides an issue', async () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: { name: 'type1' },
            spec: {
              name: 'type1',
              steps: [{ stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' }],
            },
          },
        ],
      };

      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'processed' },
            },
            status: {
              report: {
                count: 1,
                failures: [{ stepID: 'step1', severity: 'High', itemID: 'item1' }],
              },
            },
          },
        ],
      };

      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.summaries.high.checks.type1.steps.step1.issues[0].isHidden).toBe(false);
      expect(result.current.summaries.high.checks.type1.steps.step1.issueCount).toBe(1);

      await waitFor(() => {
        result.current.handleHideIssue('step1', 'item1', true);
      });
      expect(result.current.summaries.high.checks.type1.steps.step1.issues[0].isHidden).toBe(true);
      expect(result.current.summaries.high.checks.type1.steps.step1.issueCount).toBe(0);

      // Still counts as an issue if showHiddenIssues is true
      await waitFor(() => {
        result.current.setShowHiddenIssues(true);
      });
      expect(result.current.summaries.high.checks.type1.steps.step1.issueCount).toBe(1);
    });
    it('shows an errored check', async () => {
      const mockCheckTypes = {
        items: [
          {
            metadata: { name: 'type1' },
            spec: {
              name: 'type1',
              steps: [{ stepID: 'step1', title: 'Step 1', description: 'desc', resolution: 'res' }],
            },
          },
        ],
      };

      const mockChecks = {
        items: [
          {
            metadata: {
              name: 'check1',
              labels: { [CHECK_TYPE_LABEL]: 'type1' },
              creationTimestamp: '2024-01-01T00:00:00Z',
              annotations: { [STATUS_ANNOTATION]: 'error' },
            },
            status: {
              report: {
                count: 1,
                failures: [{ stepID: 'step1', severity: 'High', itemID: 'item1' }],
              },
            },
          },
        ],
      };

      mockListCheckTypeQuery.mockReturnValue({
        data: mockCheckTypes,
        isLoading: false,
        isError: false,
      });

      mockListCheckQuery.mockReturnValue({
        data: mockChecks,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckSummaries());
      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreateChecks', () => {
    it('creates checks for all check types', () => {
      const mockCreateCheck = jest.fn();
      const mockCheckTypes = [
        {
          metadata: { name: 'type1' },
          spec: { name: 'Type 1', steps: [] },
        },
      ];

      mockCreateCheckMutation.mockReturnValue([mockCreateCheck, { isError: false }]);
      mockListCheckTypeQuery.mockReturnValue({
        data: { items: mockCheckTypes },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCreateChecks());
      result.current.createChecks();

      expect(mockCreateCheck).toHaveBeenCalledWith({
        check: {
          kind: 'Check',
          apiVersion: 'advisor.grafana.app/v0alpha1',
          spec: { data: {} },
          metadata: {
            generateName: 'check-',
            labels: { [CHECK_TYPE_LABEL]: 'type1' },
            namespace: config.namespace,
          },
          status: { report: { count: 0, failures: [] } },
        },
      });
    });
  });

  describe('useDeleteChecks', () => {
    it('calls delete mutation with empty name', () => {
      const mockDeleteCheck = jest.fn();
      mockDeleteCheckMutation.mockReturnValue([mockDeleteCheck, { isError: false }]);

      const { result } = renderHook(() => useDeleteChecks());
      result.current.deleteChecks();

      expect(mockDeleteCheck).toHaveBeenCalledWith({ name: '' });
    });
  });

  describe('useCompletedChecks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns completed when no incomplete checks', () => {
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: { [STATUS_ANNOTATION]: 'processed' },
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCompletedChecks());
      expect(result.current.isCompleted).toBe(true);
    });

    it('polls when there are incomplete checks', async () => {
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: {},
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      await waitFor(() => {
        renderHook(() => useCompletedChecks());
        expect(mockListCheckQuery).toHaveBeenCalledWith({}, { pollingInterval: 2000, refetchOnMountOrArgChange: true });
      });
    });

    it('filters by provided names', () => {
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: {},
              },
            },
            {
              metadata: {
                name: 'check2',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: {},
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCompletedChecks(['check1']));
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('ignores incomplete checks if they are older than the latest check', () => {
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                creationTimestamp: '2024-01-01T00:00:00Z',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
              },
            },
            {
              metadata: {
                name: 'check2',
                creationTimestamp: '2024-01-02T00:00:00Z',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: { [STATUS_ANNOTATION]: 'processed' },
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCompletedChecks());
      expect(result.current.isCompleted).toBe(true);
    });

    it('marks a check as incomplete if it has a retry annotation', () => {
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                creationTimestamp: '2024-01-02T00:00:00Z',
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: { [STATUS_ANNOTATION]: 'processed', [RETRY_ANNOTATION]: 'item1' },
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCompletedChecks());
      expect(result.current.isCompleted).toBe(false);
    });
  });

  describe('useRetryCheck', () => {
    it('calls update mutation with the correct parameters', () => {
      const mockUpdateCheck = jest.fn();
      mockUpdateCheckMutation.mockReturnValue([mockUpdateCheck, { isError: false }]);

      const { result } = renderHook(() => useRetryCheck());
      result.current.retryCheck('check1', 'item1');

      expect(mockUpdateCheck).toHaveBeenCalledWith({
        name: 'check1',
        patch: [{ op: 'add', path: '/metadata/annotations/advisor.grafana.app~1retry', value: 'item1' }],
      });
    });
  });
});
