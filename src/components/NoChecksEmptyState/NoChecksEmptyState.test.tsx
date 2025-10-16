import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoChecksEmptyState } from './NoChecksEmptyState';

const mockCreateChecks = jest.fn();
const mockTrackGlobalAction = jest.fn();

jest.mock('api/api', () => ({
  useCreateChecks: () => ({
    createChecks: mockCreateChecks,
  }),
}));

jest.mock('api/useInteractionTracker', () => ({
  useInteractionTracker: () => ({
    trackGlobalAction: mockTrackGlobalAction,
  }),
  GlobalActionType: {
    REFRESH_CLICKED: 'REFRESH_CLICKED',
  },
}));

describe('NoChecksEmptyState', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty state message', () => {
    render(<NoChecksEmptyState isCompleted={true} />);

    expect(screen.getByText('No checks run yet')).toBeInTheDocument();
  });

  describe('Generate report button', () => {
    it('renders enabled button with "Generate report" text when checks are completed', () => {
      render(<NoChecksEmptyState isCompleted={true} />);

      const button = screen.getByRole('button', { name: /Generate report/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('renders disabled button with "Running checks..." text when checks are not completed', () => {
      render(<NoChecksEmptyState isCompleted={false} />);

      const button = screen.getByRole('button', { name: /Running checks.../i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('calls createChecks and trackGlobalAction when button is clicked', async () => {
      render(<NoChecksEmptyState isCompleted={true} />);

      const button = screen.getByRole('button', { name: /Generate report/i });
      await user.click(button);

      expect(mockCreateChecks).toHaveBeenCalledTimes(1);
      expect(mockTrackGlobalAction).toHaveBeenCalledTimes(1);
      expect(mockTrackGlobalAction).toHaveBeenCalledWith('REFRESH_CLICKED');
    });
  });
});
