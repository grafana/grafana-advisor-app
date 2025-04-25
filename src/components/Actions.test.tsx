import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Actions from './Actions';

const mockUseCreateChecks = jest.fn();
const mockUseDeleteChecks = jest.fn();

jest.mock('api/api', () => ({
  useCreateChecks: () => mockUseCreateChecks(),
  useDeleteChecks: () => mockUseDeleteChecks(),
}));

describe('Actions', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCreateChecks.mockReturnValue({
      createChecks: jest.fn(),
      createCheckState: { isError: false, error: undefined },
    });

    mockUseDeleteChecks.mockReturnValue({
      deleteChecks: jest.fn(),
      deleteChecksState: { isLoading: false, isError: false, error: undefined },
    });
  });

  it('renders refresh and delete buttons', async () => {
    render(<Actions isCompleted={true} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete reports/i })).toBeInTheDocument();
    });
  });

  it('shows loading state when running checks', async () => {
    render(<Actions isCompleted={false} />);
    await waitFor(() => {
      expect(screen.getByText('Running checks...')).toBeInTheDocument();
    });
  });

  it('shows error message when check creation fails', async () => {
    const error = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    };

    mockUseCreateChecks.mockReturnValue({
      createChecks: jest.fn(),
      createCheckState: { isError: true, error },
    });

    render(<Actions isCompleted={true} />);
    await waitFor(() => {
      expect(screen.getByText(/error while running checks: 500 internal server error/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation modal when delete button clicked', async () => {
    render(<Actions isCompleted={true} />);
    const deleteButton = screen.getByRole('button', { name: /delete reports/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /delete reports\?/i })).toBeInTheDocument();
      expect(screen.getByText(/grafana keeps a history of reports/i)).toBeInTheDocument();
    });
  });

  it('calls delete function when deletion confirmed', async () => {
    const mockDeleteFn = jest.fn();
    mockUseDeleteChecks.mockReturnValue({
      deleteChecks: mockDeleteFn,
      deleteChecksState: { isLoading: false, isError: false, error: undefined },
    });

    render(<Actions isCompleted={true} />);
    const deleteButton = screen.getByRole('button', { name: /delete reports/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteFn).toHaveBeenCalled();
    });
  });

  it('shows error message when delete fails', async () => {
    const error = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    };

    mockUseDeleteChecks.mockReturnValue({
      deleteChecks: jest.fn(),
      deleteChecksState: { isLoading: false, isError: true, error },
    });

    render(<Actions isCompleted={true} />);
    await waitFor(() => {
      expect(screen.getByText(/error deleting checks: 500 internal server error/i)).toBeInTheDocument();
    });
  });

  it('calls createChecks when refresh button clicked', async () => {
    const mockCreateFn = jest.fn();
    mockUseCreateChecks.mockReturnValue({
      createChecks: mockCreateFn,
      createCheckState: { isError: false, error: undefined },
    });

    render(<Actions isCompleted={true} />);
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockCreateFn).toHaveBeenCalled();
    });
  });
});
