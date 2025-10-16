import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Home from './Home';
import { CheckSummaries, Severity } from 'types';
import { renderWithRouter } from 'components/test/utils';

// Mock PluginPage to render its actions prop
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  usePluginInteractionReporter: jest.fn(() => jest.fn()),
  usePluginUserStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn(),
  }),
  PluginPage: ({ actions, children }: { actions: React.ReactNode; children: React.ReactNode }) => (
    <div>
      <div data-testid="plugin-actions">{actions}</div>
      {children}
    </div>
  ),
}));

const mockCheck = (name: string, type: string, description: string, issueCount: number) => ({
  name,
  type,
  typeName: type,
  description,
  totalCheckCount: issueCount,
  issueCount,
  canRetry: true,
  steps: {},
});

const defaultSummaries = {
  high: {
    created: new Date('2023-01-01'),
    name: 'High Priority',
    description: 'High priority issues',
    severity: Severity.High,
    checks: {
      'check-1': mockCheck('check-1', 'datasource', 'Check 1', 1),
      'check-2': mockCheck('check-2', 'datasource', 'Check 2', 2),
    },
  },
  low: {
    created: new Date('2023-01-01'),
    name: 'Low Priority',
    description: 'Low priority issues',
    severity: Severity.Low,
    checks: {
      'check-3': mockCheck('check-3', 'datasource', 'Check 3', 1),
    },
  },
} as CheckSummaries;

const mockUseCheckSummaries = jest.fn();
const mockUseCompletedChecks = jest.fn();
const mockUseCreateChecks = jest.fn();
const mockUseDeleteChecks = jest.fn();
const mockUseRetryCheck = jest.fn().mockReturnValue({
  retryCheck: jest.fn(),
  retryCheckState: { isError: false, error: undefined },
});

// Mock the entire api module
jest.mock('api/api', () => ({
  useCheckSummaries: () => mockUseCheckSummaries(),
  useCompletedChecks: () => mockUseCompletedChecks(),
  useCreateChecks: () => mockUseCreateChecks(),
  useDeleteChecks: () => mockUseDeleteChecks(),
  useRetryCheck: () => mockUseRetryCheck(),
}));

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockUseCheckSummaries.mockReturnValue({
      summaries: defaultSummaries,
      isLoading: false,
      isError: false,
      error: undefined,
    });

    // Mock implementations for Actions component
    mockUseCompletedChecks.mockReturnValue({
      isCompleted: true,
      isLoading: false,
      checkStatuses: [],
    });

    mockUseCreateChecks.mockReturnValue({
      createChecks: jest.fn(),
      createCheckState: { isError: false, error: undefined },
    });

    mockUseDeleteChecks.mockReturnValue({
      deleteChecks: jest.fn(),
      deleteChecksState: { isLoading: false, isError: false, error: undefined },
    });
  });

  it('shows error state when API call fails', async () => {
    const error = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    };
    mockUseCheckSummaries.mockReturnValue({
      summaries: defaultSummaries,
      isLoading: false,
      isError: true,
      error,
    });

    renderWithRouter(<Home />);
    expect(await screen.findByText(/500 Internal Server Error/)).toBeInTheDocument();
  });

  it('shows error state when the check is errored', async () => {
    mockUseCheckSummaries.mockReturnValue({
      summaries: {
        ...defaultSummaries,
        high: {
          ...defaultSummaries.high,
          checks: {
            ...defaultSummaries.high.checks,
            'check-1': { ...defaultSummaries.high.checks['check-1'], isError: true },
          },
        },
      },
      isLoading: false,
      isError: true,
    });

    renderWithRouter(<Home />);
    expect(await screen.findByText(/Check server logs for more details/)).toBeInTheDocument();
  });

  it('shows empty state when no reports exist', async () => {
    mockUseCheckSummaries.mockReturnValue({
      summaries: {
        high: {
          created: new Date(0),
          name: 'High Priority',
          description: 'High priority issues',
          severity: Severity.High,
          checks: {},
        },
        low: {
          created: new Date(0),
          name: 'Low Priority',
          description: 'Low priority issues',
          severity: Severity.Low,
          checks: {},
        },
      },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderWithRouter(<Home />);
    expect(await screen.findByText(/No checks run yet/)).toBeInTheDocument();
  });

  it('shows completed state when no issues found', async () => {
    mockUseCheckSummaries.mockReturnValue({
      summaries: {
        high: {
          created: new Date('2023-01-01'),
          name: 'High Priority',
          description: 'High priority issues',
          severity: Severity.High,
          checks: {
            'check-1': mockCheck('check-1', 'datasource', 'Check 1', 0),
          },
        },
        low: {
          created: new Date('2023-01-01'),
          name: 'Low Priority',
          description: 'Low priority issues',
          severity: Severity.Low,
          checks: {},
        },
      },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderWithRouter(<Home />);
    expect(await screen.findByText(/No issues found/)).toBeInTheDocument();
  });

  it('avoid showing completed state when checks are not completed', async () => {
    mockUseCheckSummaries.mockReturnValue({
      summaries: {
        high: {
          created: new Date('2023-01-01'),
          name: 'High Priority',
          description: 'High priority issues',
          severity: Severity.High,
          checks: {
            'check-1': mockCheck('check-1', 'datasource', 'Check 1', 0),
          },
        },
        low: {
          created: new Date('2023-01-01'),
          name: 'Low Priority',
          description: 'Low priority issues',
          severity: Severity.Low,
          checks: {},
        },
      },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    mockUseCompletedChecks.mockReturnValue({
      isCompleted: false,
      isLoading: false,
      checkStatuses: [],
    });

    renderWithRouter(<Home />);
    expect(screen.queryByText(/No issues found/)).not.toBeInTheDocument();
  });

  it('shows check summaries when issues exist', async () => {
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/3 items needs to be fixed/i)).toBeInTheDocument();
      expect(screen.getByText(/1 items may need your attention/i)).toBeInTheDocument();
    });
  });

  it('shows last checked time when not in empty state', async () => {
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/last checked:/i)).toBeInTheDocument();
      expect(screen.getByText('2023. 01. 01. 00:00')).toBeInTheDocument();
    });
  });

  it('hides last checked time in empty state', async () => {
    mockUseCheckSummaries.mockReturnValue({
      summaries: {
        high: {
          created: new Date(0),
          name: 'High Priority',
          description: 'High priority issues',
          severity: Severity.High,
          checks: {},
        },
        low: {
          created: new Date(0),
          name: 'Low Priority',
          description: 'Low priority issues',
          severity: Severity.Low,
          checks: {},
        },
      },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.queryByText(/last checked:/i)).not.toBeInTheDocument();
    });
  });

  it('shows progress warning when checks are incomplete', async () => {
    mockUseCompletedChecks.mockReturnValue({
      isCompleted: false,
      isLoading: false,
      checkStatuses: [],
    });

    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/report in progress/i)).toBeInTheDocument();
      expect(screen.getByText(/results may change as checks complete/i)).toBeInTheDocument();
    });
  });

  it('hides progress warning when checks are completed', async () => {
    mockUseCompletedChecks.mockReturnValue({
      isCompleted: true,
      isLoading: false,
      checkStatuses: [],
    });

    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.queryByText(/report in progress/i)).not.toBeInTheDocument();
    });
  });

  it('shows partial results warning when there are too many reports', async () => {
    mockUseCheckSummaries.mockReturnValue({
      summaries: defaultSummaries,
      isLoading: false,
      isError: false,
      error: undefined,
      partialResults: true,
    });

    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/partial results/i)).toBeInTheDocument();
      expect(screen.getByText(/found too many reports to process/i)).toBeInTheDocument();
    });
  });
});
