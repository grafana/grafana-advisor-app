import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RunningChecksStatus from './ChecksStatus';
import { CheckStatus } from 'types';

describe('RunningChecksStatus', () => {
  const user = userEvent.setup();

  const oldDate = new Date(Date.now() - 20 * 60 * 1000);
  const mockCheckStatuses: CheckStatus[] = [
    {
      name: 'datasource',
      lastUpdate: oldDate,
      incomplete: true,
      hasError: false,
    },
    {
      name: 'plugin',
      lastUpdate: oldDate,
      incomplete: false,
      hasError: false,
    },
  ];

  it('does not render when completed and no errors', () => {
    const { container } = render(
      <RunningChecksStatus
        checkStatuses={[
          {
            name: 'datasource',
            lastUpdate: new Date(),
            incomplete: false,
            hasError: false,
          },
        ]}
      />
    );

    expect(container.firstChild?.firstChild).toBeNull();
  });

  it('renders when not completed', () => {
    render(<RunningChecksStatus checkStatuses={mockCheckStatuses} />);

    expect(screen.getByText('Show checks status')).toBeInTheDocument();
  });

  it('renders when there are errors', () => {
    const checkStatusesWithError: CheckStatus[] = [
      {
        name: 'datasource',
        lastUpdate: new Date(),
        incomplete: false,
        hasError: true,
      },
    ];

    render(<RunningChecksStatus checkStatuses={checkStatusesWithError} />);

    expect(screen.getByText('Show checks status')).toBeInTheDocument();
  });

  it('expands to show check details when clicked', async () => {
    render(<RunningChecksStatus checkStatuses={mockCheckStatuses} />);

    const expandButton = screen.getByText('Show checks status');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Check types')).toBeInTheDocument();
      expect(screen.getByText('datasource')).toBeInTheDocument();
      expect(screen.getByText('plugin')).toBeInTheDocument();
    });
  });

  it('shows CheckWarning for incomplete checks', async () => {
    render(<RunningChecksStatus checkStatuses={mockCheckStatuses} />);

    const expandButton = screen.getByText('Show checks status');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/Check is taking longer than expected/)).toBeInTheDocument();
    });
  });

  it('shows CheckError for failed checks', async () => {
    const checkStatusesWithError: CheckStatus[] = [
      {
        name: 'datasource',
        lastUpdate: new Date(),
        incomplete: false,
        hasError: true,
      },
    ];

    render(<RunningChecksStatus checkStatuses={checkStatusesWithError} />);

    const expandButton = screen.getByText('Show checks status');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/Check failed to complete/)).toBeInTheDocument();
    });
  });
});
