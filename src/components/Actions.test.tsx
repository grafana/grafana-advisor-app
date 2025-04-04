import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Actions from './Actions';

const mockUseCompletedChecks = jest.fn();
const mockUseCreateCheck = jest.fn();
const mockUseDeleteChecks = jest.fn();

jest.mock('api/api', () => ({
  useCompletedChecks: () => mockUseCompletedChecks(),
  useCreateCheck: () => mockUseCreateCheck(),
  useDeleteChecks: () => mockUseDeleteChecks(),
}));

describe('Actions', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCompletedChecks.mockReturnValue({
      isCompleted: true,
      isLoading: false,
    });

    mockUseCreateCheck.mockReturnValue([jest.fn(), { isError: false, error: undefined }]);

    mockUseDeleteChecks.mockReturnValue([jest.fn(), { isLoading: false, isError: false, error: undefined }]);
  });

  it('renders refresh and delete buttons', async () => {
    render(<Actions />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Delete button has no text
    });
  });

  it('shows loading state when running checks', async () => {
    mockUseCompletedChecks.mockReturnValue({
      isCompleted: false,
      isLoading: true,
    });

    render(<Actions />);
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

    mockUseCreateCheck.mockReturnValue([jest.fn(), { isError: true, error }]);

    render(<Actions />);
    await waitFor(() => {
      expect(screen.getByText(/error while running checks: 500 internal server error/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation modal when delete button clicked', async () => {
    render(<Actions />);
    const deleteButton = screen.getByRole('button', { name: '' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /delete reports\?/i })).toBeInTheDocument();
      expect(screen.getByText(/grafana keeps a history of reports/i)).toBeInTheDocument();
    });
  });

  it('calls delete function when deletion confirmed', async () => {
    const mockDelete = jest.fn();
    mockUseDeleteChecks.mockReturnValue([mockDelete, { isLoading: false, isError: false, error: undefined }]);

    render(<Actions />);
    const deleteButton = screen.getByRole('button', { name: '' });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  it('shows error message when delete fails', async () => {
    const error = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
    };

    mockUseDeleteChecks.mockReturnValue([jest.fn(), { isLoading: false, isError: true, error }]);

    render(<Actions />);
    await waitFor(() => {
      expect(screen.getByText(/error deleting checks: 500 internal server error/i)).toBeInTheDocument();
    });
  });
});
