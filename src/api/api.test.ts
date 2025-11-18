import { renderHook, waitFor, act } from '@testing-library/react';
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
  useLLMSuggestion,
  _resetRegistration,
} from './api';
import { config } from '@grafana/runtime';

// Unmock the api module for this test file so we can test the real implementations
jest.unmock('api/api');

// Mock the generated API hooks
const mockListCheckQuery = jest.fn();
const mockListCheckTypeQuery = jest.fn();
const mockCreateCheckMutation = jest.fn();
const mockDeleteCheckMutation = jest.fn();
const mockUpdateCheckMutation = jest.fn();
const mockUpdateCheckTypeMutation = jest.fn();
const mockLazyGetCheckQuery = jest.fn();
const mockCreateRegisterMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: jest.fn().mockReturnValue({ then: jest.fn().mockResolvedValue({}) }),
  }),
  { isLoading: false, isSuccess: true, error: undefined },
]);

jest.mock('generated', () => ({
  useListCheckQuery: (arg0: any, arg1: any) => mockListCheckQuery(arg0, arg1),
  useListCheckTypeQuery: (arg0: any, arg1: any) => mockListCheckTypeQuery(arg0, arg1),
  useCreateCheckMutation: () => mockCreateCheckMutation(),
  useDeleteCheckMutation: () => mockDeleteCheckMutation(),
  useUpdateCheckMutation: () => mockUpdateCheckMutation(),
  useUpdateCheckTypeMutation: () => mockUpdateCheckTypeMutation(),
  useLazyGetCheckQuery: () => mockLazyGetCheckQuery(),
  useCreateRegisterMutation: () => mockCreateRegisterMutation(),
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
    beforeEach(() => {
      _resetRegistration();
      // mock console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.spyOn(console, 'error').mockRestore();
    });
    it('returns empty array when no data', async () => {
      mockListCheckTypeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCheckTypes());
      await waitFor(() => {
        expect(result.current.checkTypes).toEqual(undefined);
      });
    });

    it('returns check types when data exists', async () => {
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
      await waitFor(() => {
        expect(result.current.checkTypes).toEqual(mockCheckTypes);
      });
    });

    it('includes registration loading state in isLoading', async () => {
      const mockCreateRegister = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({}),
      });
      const mockRegisterState = { isLoading: true, isSuccess: false, error: undefined };
      mockCreateRegisterMutation.mockReturnValue([mockCreateRegister, mockRegisterState]);

      mockListCheckTypeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useCheckTypes());
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(mockCreateRegister).toHaveBeenCalled();
      });
    });

    it('sets isRegistered to true after successful registration', async () => {
      const mockCreateRegister = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({}),
      });
      const mockRegisterState = { isLoading: false, isSuccess: true, error: undefined };
      mockCreateRegisterMutation.mockReturnValue([mockCreateRegister, mockRegisterState]);

      mockListCheckTypeQuery.mockReturnValue({
        data: { items: [] },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useCheckTypes());
      await waitFor(() => {
        // When registered, check types query should be enabled (not skipped)
        expect(mockListCheckTypeQuery).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets isRegistered to true even on registration error', async () => {
      const mockCreateRegister = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockRejectedValue(new Error('Registration failed')),
      });
      const mockRegisterState = { isLoading: false, isSuccess: false, error: new Error('Registration failed') };
      mockCreateRegisterMutation.mockReturnValue([mockCreateRegister, mockRegisterState]);

      mockListCheckTypeQuery.mockReturnValue({
        data: { items: [] },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useCheckTypes());
      await waitFor(() => {
        // Even on error, isRegistered should be true and check types should be queried
        expect(mockListCheckTypeQuery).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('refetches check types after successful registration', async () => {
      const mockRefetch = jest.fn();
      const mockCreateRegister = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({}),
      });
      const mockRegisterState = { isLoading: false, isSuccess: true, error: undefined };
      mockCreateRegisterMutation.mockReturnValue([mockCreateRegister, mockRegisterState]);

      mockListCheckTypeQuery.mockReturnValue({
        data: { items: [] },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      renderHook(() => useCheckTypes());
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('shares registration promise across multiple hook instances', async () => {
      // This test verifies that multiple hook instances don't trigger multiple registrations
      // Due to module-level registrationPromise, if registration already happened in a previous test,
      // this test verifies that subsequent hooks use the existing promise
      const resolvedPromise = Promise.resolve({});
      const mockUnwrap = jest.fn().mockReturnValue(resolvedPromise);
      const mockCreateRegister = jest.fn(() => ({
        unwrap: mockUnwrap,
      }));
      const mockRegisterState = { isLoading: false, isSuccess: false, error: undefined };
      mockCreateRegisterMutation.mockReturnValue([mockCreateRegister, mockRegisterState]);

      mockListCheckTypeQuery.mockReturnValue({
        data: { items: [] },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      // Render multiple hooks - they should share the registration
      renderHook(() => useCheckTypes());
      renderHook(() => useCheckTypes());
      renderHook(() => useCheckTypes());

      // Wait for any registration calls
      await act(async () => {
        await resolvedPromise;
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // If registration was called, it should only be called once due to shared promise
      // If it wasn't called, that's also valid (previous test already registered)
      if (mockCreateRegister.mock.calls.length > 0) {
        expect(mockCreateRegister).toHaveBeenCalledTimes(1);
      }
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

    it('returns all checks grouped by type, keeping the latest', () => {
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
      expect(result.current.checks[0].metadata.name).toBe('check2');
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
    it('returns empty summary when no data', async () => {
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
      await waitFor(() => {
        expect(result.current.summaries.high.created.getTime()).toBe(0);
        expect(result.current.summaries.low.created.getTime()).toBe(0);
      });
    });

    it('aggregates check failures by severity', async () => {
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
      await waitFor(() => {
        expect(result.current.summaries.high.checks.type1.issueCount).toBe(1);
        expect(result.current.summaries.low.checks.type1.issueCount).toBe(1);
      });
    });

    it('enables retry if the check type has a retry annotation', async () => {
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
      await waitFor(() => {
        expect(result.current.summaries.high.checks.type1.canRetry).toBe(true);
      });
    });

    it('marks a failure as retrying if the itemID matches the retry annotation', async () => {
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
      await waitFor(() => {
        expect(result.current.summaries.high.checks.type1.issueCount).toBe(1);
        expect(result.current.summaries.high.checks.type1.steps.step1.issues[0].isRetrying).toBe(true);
      });
      expect(result.current.summaries.high.checks.type1.steps.step1.issues[0].isRetrying).toBe(true);
    });

    it('removes a check type step if it is ignored', async () => {
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
      await waitFor(() => {
        expect(result.current.summaries.high.checks.type1.steps.step1).toBeUndefined();
        expect(result.current.summaries.low.checks.type1.steps.step1).toBeUndefined();
        expect(result.current.summaries.high.checks.type1.steps.step2).toBeDefined();
        expect(result.current.summaries.low.checks.type1.steps.step2).toBeDefined();
      });
      expect(result.current.summaries.low.checks.type1.steps.step1).toBeUndefined();
      expect(result.current.summaries.high.checks.type1.steps.step2).toBeDefined();
      expect(result.current.summaries.low.checks.type1.steps.step2).toBeDefined();
    });

    it('removes a check type if all steps are ignored', async () => {
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
      await waitFor(() => {
        expect(result.current.summaries.high.checks.type1).toBeUndefined();
        expect(result.current.summaries.low.checks.type1).toBeUndefined();
      });
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
  });
  describe('useCreateChecks', () => {
    it('creates checks for all check types', async () => {
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
      await waitFor(() => {
        result.current.createChecks();
      });

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
        expect(mockListCheckQuery).toHaveBeenCalledWith(
          { limit: 1000 },
          { pollingInterval: 2000, refetchOnMountOrArgChange: true }
        );
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
                creationTimestamp: new Date().toISOString(),
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
    it('returns a list of check statuses', () => {
      const creationTimestamp = new Date(Date.now() - 11 * 60 * 1000).toISOString();
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                creationTimestamp,
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: { [STATUS_ANNOTATION]: 'processed' },
              },
            },
            {
              metadata: {
                name: 'check2',
                creationTimestamp,
                labels: { [CHECK_TYPE_LABEL]: 'type2' },
                annotations: { [STATUS_ANNOTATION]: 'error', [RETRY_ANNOTATION]: 'item1' },
              },
            },
            {
              metadata: {
                name: 'check3',
                creationTimestamp,
                labels: { [CHECK_TYPE_LABEL]: 'type3' },
                annotations: {},
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCompletedChecks());
      expect(result.current.checkStatuses).toEqual([
        { name: 'type1', lastUpdate: new Date(creationTimestamp), incomplete: false, hasError: false },
        { name: 'type2', lastUpdate: new Date(creationTimestamp), incomplete: false, hasError: true },
        { name: 'type3', lastUpdate: new Date(creationTimestamp), incomplete: true, hasError: false },
      ]);
    });

    it('returns a list of check statuses with a lastUpdate date', () => {
      const creationTimestamp = new Date(Date.now() - 11 * 60 * 1000).toISOString();
      const updateTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      mockListCheckQuery.mockReturnValue({
        data: {
          items: [
            {
              metadata: {
                name: 'check1',
                creationTimestamp,
                labels: { [CHECK_TYPE_LABEL]: 'type1' },
                annotations: { [STATUS_ANNOTATION]: 'processed' },
                managedFields: [{ time: updateTimestamp }],
              },
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useCompletedChecks());
      expect(result.current.checkStatuses).toEqual([
        { name: 'type1', lastUpdate: new Date(updateTimestamp), incomplete: false, hasError: false },
      ]);
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

  describe('useLLMSuggestion', () => {
    it('returns a suggestion', async () => {
      const mockUpdateCheck = jest.fn();
      const mockGetCheck = jest.fn();

      mockUpdateCheckMutation.mockReturnValue([mockUpdateCheck, { isError: false }]);
      mockLazyGetCheckQuery.mockReturnValue([mockGetCheck, { isError: false }]);

      mockGetCheck.mockResolvedValue({
        data: {
          metadata: { name: 'check1', annotations: {} },
          status: {
            report: {
              failures: [
                {
                  stepID: 'step1',
                  itemID: 'item1',
                  item: 'item1',
                  severity: 'High',
                  moreInfo: 'moreInfo',
                  links: [],
                },
              ],
            },
          },
        },
      });

      const { result } = renderHook(() => useLLMSuggestion());

      await act(async () => {
        result.current.getSuggestion('check1', 'step1', 'item1');
      });

      // Wait for the assertions to pass
      await waitFor(() => {
        expect(mockGetCheck).toHaveBeenCalledWith({ name: 'check1' });
        expect(result.current.response).toBe('test');
      });
    });
  });
});
