import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfoNotification from './InfoNotification';

// Mock usePluginUserStorage hook
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  usePluginUserStorage: () => ({
    getItem: mockGetItem,
    setItem: mockSetItem,
  }),
}));

describe('InfoNotification', () => {
  const user = userEvent.setup();
  const defaultProps = {
    id: 'test-notification',
    title: 'Test Title',
    text: 'This is a test notification message',
    displayCondition: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('shows notification when storage value is null/undefined', async () => {
      mockGetItem.mockResolvedValue(null);

      render(<InfoNotification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('This is a test notification message')).toBeInTheDocument();
      });

      expect(mockGetItem).toHaveBeenCalledWith('test-notification');
    });

    it('shows notification when storage value is "true"', async () => {
      mockGetItem.mockResolvedValue('true');

      render(<InfoNotification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('This is a test notification message')).toBeInTheDocument();
      });
    });

    it('does not show notification when storage value is "false"', async () => {
      mockGetItem.mockResolvedValue('false');

      render(<InfoNotification {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetItem).toHaveBeenCalledWith('test-notification');
      });

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
      expect(screen.queryByText('This is a test notification message')).not.toBeInTheDocument();
    });
  });

  describe('Dismissing notification', () => {
    it('dismisses notification and updates storage when close button is clicked', async () => {
      mockGetItem.mockResolvedValue(null);

      render(<InfoNotification {...defaultProps} />);

      // Wait for notification to appear
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
      });

      // Find and click the close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Check that storage was updated
      expect(mockSetItem).toHaveBeenCalledWith('test-notification', 'false');

      // Check that notification is no longer visible
      await waitFor(() => {
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
      });
    });
  });
});
