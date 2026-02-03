import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { IssueDescription } from './IssueDescription';
import { useAssistantHelp, useLLMSuggestion } from 'api/api';

// Mock dependencies
jest.mock('api/api');

const mockUseLLMSuggestion = useLLMSuggestion as jest.MockedFunction<typeof useLLMSuggestion>;
const mockUseAssistantHelp = useAssistantHelp as jest.MockedFunction<typeof useAssistantHelp>;

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
  });

  afterEach(() => {
    jest.useRealTimers(); // Clean up any fake timers after each test
  });

  it('renders issue description with all buttons', () => {
    renderWithRouter(<IssueDescription {...defaultProps} />);

    expect(screen.getByText(defaultProps.item)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide issue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry check' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fix this issue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument();
  });

  it('renders the AI suggestion button when the LLM plugin is available', () => {
    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: jest.fn(),
      response: null,
      isAvailable: true,
      isLoading: false,
    });

    renderWithRouter(<IssueDescription {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Generate AI suggestion' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ask Assistant' })).toBeNull();
  });

  it('renders the Ask Assistant button when the Assistant plugin is available', () => {
    mockUseAssistantHelp.mockReturnValue({
      askAssistant: jest.fn(),
      isAvailable: true,
      isLoading: false,
    });

    renderWithRouter(<IssueDescription {...defaultProps} />);
    expect(screen.queryByRole('button', { name: 'Generate AI suggestion' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Ask Assistant' })).toBeInTheDocument();
  });

  it('prefers Assistant when both the LLM and Assistant plugins are available', () => {
    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: jest.fn(),
      response: null,
      isAvailable: true,
      isLoading: false,
    });

    mockUseAssistantHelp.mockReturnValue({
      askAssistant: jest.fn(),
      isAvailable: true,
      isLoading: false,
    });

    renderWithRouter(<IssueDescription {...defaultProps} />);
    expect(screen.queryByRole('button', { name: 'Generate AI suggestion' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Ask Assistant' })).toBeInTheDocument();
  });

  it('handles retry button click with local loading state', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnRetryCheck = jest.fn();

    renderWithRouter(<IssueDescription {...defaultProps} onRetryCheck={mockOnRetryCheck} />);

    const retryButton = screen.getByRole('button', { name: 'Retry check' });

    // Initially button should be enabled (Grafana Button uses aria-disabled, not disabled)
    expect(retryButton).toHaveAttribute('aria-disabled', 'false');

    await user.click(retryButton);

    // After click, button should be disabled
    expect(retryButton).toHaveAttribute('aria-disabled', 'true');
    expect(mockOnRetryCheck).toHaveBeenCalledTimes(1);

    // After timeout, button should be enabled again
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(retryButton).toHaveAttribute('aria-disabled', 'false');
    });

    jest.useRealTimers();
  });
});
