import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Actions from './Actions';
import * as api from 'api/api';
import { CheckSummaries } from 'types';

jest.mock('api/api');

const mockApi = api as jest.Mocked<typeof api>;

describe('Actions', () => {
  const user = userEvent.setup();
  const mockCheckSummaries = jest.fn().mockResolvedValue({});
  const defaultProps = {
    checkSummaries: mockCheckSummaries,
    checkSummariesState: {
      loading: false,
      value: {
        high: {
          created: new Date('2023-01-01'),
          checks: {},
        },
        low: {
          created: new Date('2023-01-01'),
          checks: {},
        },
      } as CheckSummaries,
    },
    emptyState: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.createChecks.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: {} as any,
      redirected: false,
      type: 'basic',
      url: '',
      config: { url: '' },
      data: {
        kind: 'Check',
        apiVersion: 'v0alpha1',
        metadata: { name: 'test-check', namespace: 'default' },
        spec: {},
        status: { report: { count: 0, failures: [] } },
      },
    });
    mockApi.deleteChecks.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: {} as any,
      redirected: false,
      type: 'basic',
      url: '',
      config: { url: '' },
      data: undefined,
    });

    mockApi.waitForChecks.mockResolvedValue({
      promise: Promise.resolve(),
      cancel: jest.fn(),
    });
  });

  it('renders refresh and delete buttons', async () => {
    render(<Actions {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete reports/i })).toBeInTheDocument();
    });
  });

  it('shows loading state when running checks', async () => {
    render(
      <Actions
        {...defaultProps}
        checkSummariesState={{
          ...defaultProps.checkSummariesState,
          loading: true,
        }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Running checks...')).toBeInTheDocument();
    });
  });

  it('shows last checked time when not in empty state', async () => {
    render(<Actions {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/last checked:/i)).toBeInTheDocument();
      expect(screen.getByText('2023. 01. 01. 00:00')).toBeInTheDocument();
    });
  });

  it('hides last checked time in empty state', async () => {
    render(<Actions {...defaultProps} emptyState={true} />);
    await waitFor(() => {
      expect(screen.queryByText(/last checked:/i)).not.toBeInTheDocument();
    });
  });

  it('shows error message when check creation fails', async () => {
    const error = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    };
    mockApi.createChecks.mockRejectedValue(error);

    render(<Actions {...defaultProps} />);

    // Wait for the refresh button to be rendered
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Wait for the error state to be updated and rendered
    await waitFor(() => {
      expect(screen.getByText(/error while running checks: 500 internal server error/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation modal when delete button clicked', async () => {
    render(<Actions {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: /delete reports/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /delete reports\?/i })).toBeInTheDocument();
      expect(screen.getByText(/grafana keeps a history of reports/i)).toBeInTheDocument();
    });
  });

  it('calls delete API when deletion confirmed', async () => {
    render(<Actions {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: /delete reports/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockApi.deleteChecks).toHaveBeenCalled();
    });
  });

  it('shows error message when delete API fails', async () => {
    mockApi.deleteChecks.mockRejectedValue({
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(<Actions {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: /delete reports/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/error deleting checks: 500 internal server error/i)).toBeInTheDocument();
    });
  });

  it('cancels waiting for checks when unmounting', async () => {
    // make waitForChecks not resolve
    const cancel = jest.fn();
    mockApi.waitForChecks.mockImplementation(() =>
      Promise.resolve({
        promise: new Promise((resolve) => {
          setTimeout(() => {
            resolve({});
          }, 1000);
        }),
        cancel,
      })
    );
    const { unmount } = render(<Actions {...defaultProps} />);

    await waitFor(() => {
      expect(cancel).not.toHaveBeenCalled();
    });

    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
