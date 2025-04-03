import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './Home';
import * as api from 'api/api';
import { CheckSummaries, Check } from 'types';

jest.mock('api/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('Home', () => {
  const user = userEvent.setup();

  const mockCheck = (name: string, description: string, issueCount: number): Check => ({
    name,
    description,
    issueCount,
    totalCheckCount: issueCount,
    steps: {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful response
    mockApi.getCheckSummaries.mockResolvedValue({
      high: {
        created: new Date('2023-01-01'),
        name: 'High Priority',
        description: 'High priority issues',
        severity: 'high',
        checks: {
          'check-1': mockCheck('Check 1', 'First check', 1),
          'check-2': mockCheck('Check 2', 'Second check', 2),
        },
      },
      low: {
        created: new Date('2023-01-01'),
        name: 'Low Priority',
        description: 'Low priority issues',
        severity: 'low',
        checks: {
          'check-3': mockCheck('Check 3', 'Third check', 1),
        },
      },
    } as CheckSummaries);
  });

  it('shows loading state initially', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    const error = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    };
    mockApi.getCheckSummaries.mockRejectedValue(error);

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/error: 500 internal server error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no reports exist', async () => {
    mockApi.getCheckSummaries.mockResolvedValue({
      high: {
        created: new Date(0),
        name: 'High Priority',
        description: 'High priority issues',
        severity: 'high',
        checks: {},
      },
      low: {
        created: new Date(0),
        name: 'Low Priority',
        description: 'Low priority issues',
        severity: 'low',
        checks: {},
      },
    } as CheckSummaries);

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/no report found/i)).toBeInTheDocument();
    });
  });

  it('shows completed state when no issues found', async () => {
    mockApi.getCheckSummaries.mockResolvedValue({
      high: {
        created: new Date('2023-01-01'),
        name: 'High Priority',
        description: 'High priority issues',
        severity: 'high',
        checks: {},
      },
      low: {
        created: new Date('2023-01-01'),
        name: 'Low Priority',
        description: 'Low priority issues',
        severity: 'low',
        checks: {},
      },
    } as CheckSummaries);

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/no issues found/i)).toBeInTheDocument();
    });
  });

  it('shows check summaries when issues exist', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/3 items needs to be fixed/i)).toBeInTheDocument();
      expect(screen.getByText(/1 items may need your attention/i)).toBeInTheDocument();
    });
  });
});
