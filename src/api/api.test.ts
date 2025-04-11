import { renderHook, act } from '@testing-library/react';
import {
  useCheckSummaries,
  useCheckTypes,
  useLastChecks,
  useCreateChecks,
  useDeleteChecks,
  useCompletedChecks,
  STATUS_ANNOTATION,
  CHECK_TYPE_LABEL,
} from './api';
import { config } from '@grafana/runtime';

// Mock the generated API hooks
const mockListCheckQuery = jest.fn();
const mockListCheckTypeQuery = jest.fn();
const mockCreateCheckMutation = jest.fn();
const mockDeleteCheckMutation = jest.fn();

jest.mock('generated', () => ({
  useListCheckQuery: (arg0: any, arg1: any) => mockListCheckQuery(arg0, arg1),
  useListCheckTypeQuery: () => mockListCheckTypeQuery(),
  useCreateCheckMutation: () => mockCreateCheckMutation(),
  useDeleteCheckMutation: () => mockDeleteCheckMutation(),
}));

// Mock config
jest.mock('@grafana/runtime', () => ({
  config: {
    namespace: 'test-namespace',
  },
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
              annotations: { [STATUS_ANNOTATION]: 'unprocessed' },
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

    it('polls when there are incomplete checks', () => {
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

      act(() => {
        renderHook(() => useCompletedChecks());
      });
      expect(mockListCheckQuery).toHaveBeenCalledWith({}, { pollingInterval: 2000, refetchOnMountOrArgChange: true });
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
  });
});
