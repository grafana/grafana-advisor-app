import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { IssueDescription } from './IssueDescription';
import { usePluginContext } from 'contexts/Context';

// Mock dependencies
jest.mock('contexts/Context');

const mockUsePluginContext = usePluginContext as jest.MockedFunction<typeof usePluginContext>;

const defaultProps = {
  item: 'Dashboard "Test Dashboard" has performance issues',
  isHidden: false,
  isRetrying: false,
  canRetry: true,
  isCompleted: true,
  checkType: 'dashboard-performance',
  checkName: 'check1',
  itemID: 'item1',
  stepID: 'step1',
  links: [
    { url: 'https://example.com/fix', message: 'Fix this issue' },
    { url: '/local/help', message: 'More info' },
  ],
  onHideIssue: jest.fn(),
  onRetryCheck: jest.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{component}</BrowserRouter>
  );
};

describe('IssueDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // Ensure real timers are used by default

    mockUsePluginContext.mockReturnValue({
      isLLMEnabled: true,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers(); // Clean up any fake timers after each test
  });

  it('renders issue description with all buttons', () => {
    renderWithRouter(<IssueDescription {...defaultProps} />);

    expect(screen.getByText(defaultProps.item)).toBeInTheDocument();
    expect(screen.getByTitle('Generate AI suggestion')).toBeInTheDocument();
    expect(screen.getByTitle('Hide issue')).toBeInTheDocument();
    expect(screen.getByTitle('Retry check')).toBeInTheDocument();
    expect(screen.getByText('Fix this issue')).toBeInTheDocument();
    expect(screen.getByText('More info')).toBeInTheDocument();
  });

  it('handles retry button click with local loading state', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnRetryCheck = jest.fn();

    renderWithRouter(<IssueDescription {...defaultProps} onRetryCheck={mockOnRetryCheck} />);

    const retryButton = screen.getByTitle('Retry check');

    // Initially button should be enabled
    expect(retryButton).toBeEnabled();

    await user.click(retryButton);

    // After click, button should be disabled
    expect(retryButton).toBeDisabled();
    expect(mockOnRetryCheck).toHaveBeenCalledTimes(1);

    // After timeout, button should be enabled again
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(retryButton).toBeEnabled();
    });

    jest.useRealTimers();
  });
});
