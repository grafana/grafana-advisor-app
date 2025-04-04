import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from './Home';
import { CheckSummaries, Severity } from 'types';

// Mock PluginPage to render its actions prop
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  PluginPage: ({ actions, children }: { actions: React.ReactNode; children: React.ReactNode }) => (
    <div>
      <div data-testid="plugin-actions">{actions}</div>
      {children}
    </div>
  ),
}));

const mockCheck = (name: string, description: string, issueCount: number) => ({
  name,
  description,
  totalCheckCount: issueCount,
  issueCount,
  steps: {},
});

const defaultSummaries = {
  high: {
    created: new Date('2023-01-01'),
    name: 'High Priority',
    description: 'High priority issues',
    severity: Severity.High,
    checks: {
      'check-1': mockCheck('Check 1', 'First check', 1),
      'check-2': mockCheck('Check 2', 'Second check', 2),
    },
  },
  low: {
    created: new Date('2023-01-01'),
    name: 'Low Priority',
    description: 'Low priority issues',
    severity: Severity.Low,
    checks: {
      'check-3': mockCheck('Check 3', 'Third check', 1),
    },
  },
} as CheckSummaries;

const mockUseCheckSummaries = jest.fn();
const mockUseCompletedChecks = jest.fn();
const mockUseCreateCheck = jest.fn();
const mockUseDeleteChecks = jest.fn();

// Mock the entire api module
jest.mock('api/api', () => ({
  useCheckSummaries: () => mockUseCheckSummaries(),
  useCompletedChecks: () => mockUseCompletedChecks(),
  useCreateCheck: () => mockUseCreateCheck(),
  useDeleteChecks: () => mockUseDeleteChecks(),
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
    });

    mockUseCreateCheck.mockReturnValue([jest.fn(), { isError: false, error: undefined }]);

    mockUseDeleteChecks.mockReturnValue([jest.fn(), { isLoading: false, isError: false, error: undefined }]);
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

    render(<Home />);
    expect(await screen.findByText(/Error: 500 Internal Server Error/)).toBeInTheDocument();
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

    render(<Home />);
    expect(await screen.findByText(/No report found/)).toBeInTheDocument();
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
            'check-1': mockCheck('Check 1', 'First check', 0),
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

    render(<Home />);
    expect(await screen.findByText(/No issues found/)).toBeInTheDocument();
  });

  it('shows check summaries when issues exist', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/3 items needs to be fixed/i)).toBeInTheDocument();
      expect(screen.getByText(/1 items may need your attention/i)).toBeInTheDocument();
    });
  });

  it('shows last checked time when not in empty state', async () => {
    render(<Home />);
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

    render(<Home />);
    await waitFor(() => {
      expect(screen.queryByText(/last checked:/i)).not.toBeInTheDocument();
    });
  });
});
