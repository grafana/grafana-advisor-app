import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { IssueDescription } from './IssueDescription';
import { useLLMSuggestion } from 'api/api';
import { usePluginContext } from 'contexts/Context';
import { useInteractionTracker } from '../../api/useInteractionTracker';

// Mock dependencies
jest.mock('api/api');
jest.mock('contexts/Context');
jest.mock('../../api/useInteractionTracker');

const mockUseLLMSuggestion = useLLMSuggestion as jest.MockedFunction<typeof useLLMSuggestion>;
const mockUsePluginContext = usePluginContext as jest.MockedFunction<typeof usePluginContext>;
const mockUseInteractionTracker = useInteractionTracker as jest.MockedFunction<typeof useInteractionTracker>;

// Mock LLMSuggestionContent component
jest.mock('./LLMSuggestionContent', () => ({
  LLMSuggestionContent: ({ isLoading, response }: { isLoading: boolean; response: string | null }) => (
    <div data-testid="llm-suggestion-content">{isLoading ? 'Loading...' : response || 'No response'}</div>
  ),
}));

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
  const mockGetSuggestion = jest.fn();
  const mockTrackCheckInteraction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // Ensure real timers are used by default

    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: mockGetSuggestion,
      response: null,
      isLoading: false,
    });

    mockUsePluginContext.mockReturnValue({
      isLLMEnabled: true,
      isLoading: false,
    });

    mockUseInteractionTracker.mockReturnValue({
      trackCheckInteraction: mockTrackCheckInteraction,
      trackGroupToggle: jest.fn(),
      trackGlobalAction: jest.fn(),
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

  it('triggers loading behavior when AI suggestion button is clicked multiple times', async () => {
    const user = userEvent.setup();

    // Mock the loading states for multiple calls
    let callCount = 0;
    mockUseLLMSuggestion.mockImplementation(() => {
      callCount++;
      return {
        getSuggestion: mockGetSuggestion,
        response: callCount === 1 ? null : 'AI suggestion response',
        isLoading: callCount <= 2, // First two calls show loading
      };
    });

    const { rerender } = renderWithRouter(<IssueDescription {...defaultProps} />);

    const aiButton = screen.getByTitle('Generate AI suggestion');

    // First click - should trigger getSuggestion and show loading
    await user.click(aiButton);

    expect(mockGetSuggestion).toHaveBeenCalledWith('check1', 'step1', 'item1');
    expect(mockGetSuggestion).toHaveBeenCalledTimes(1);

    // Simulate loading state
    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: mockGetSuggestion,
      response: null,
      isLoading: true,
    });

    rerender(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <IssueDescription {...defaultProps} />
      </BrowserRouter>
    );

    // Verify LLM section is open and shows loading
    expect(screen.getByTestId('llm-suggestion-content')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate completion of first call
    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: mockGetSuggestion,
      response: 'First AI suggestion',
      isLoading: false,
    });

    rerender(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <IssueDescription {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('First AI suggestion')).toBeInTheDocument();

    // Reset mock call count for second test
    mockGetSuggestion.mockClear();

    // Click the AI button again (it should toggle closed first, then open again)
    await user.click(aiButton); // This closes it
    await user.click(aiButton); // This opens it and calls getSuggestion again

    // Verify getSuggestion was called again with same parameters
    expect(mockGetSuggestion).toHaveBeenCalledWith('check1', 'step1', 'item1');
    expect(mockGetSuggestion).toHaveBeenCalledTimes(1); // Called once after clear

    // Simulate loading state for second call
    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: mockGetSuggestion,
      response: 'First AI suggestion',
      isLoading: true,
    });

    rerender(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <IssueDescription {...defaultProps} />
      </BrowserRouter>
    );

    // Verify loading is shown again
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows AI suggestion when LLM section is open', async () => {
    const user = userEvent.setup();

    mockUseLLMSuggestion.mockReturnValue({
      getSuggestion: mockGetSuggestion,
      response: 'This is an AI-generated suggestion for your issue.',
      isLoading: false,
    });

    renderWithRouter(<IssueDescription {...defaultProps} />);

    const aiButton = screen.getByTitle('Generate AI suggestion');
    await user.click(aiButton);

    expect(screen.getByTestId('llm-suggestion-content')).toBeInTheDocument();
    expect(screen.getByText('This is an AI-generated suggestion for your issue.')).toBeInTheDocument();
  });

  it('does not show AI button when LLM is disabled', () => {
    mockUsePluginContext.mockReturnValue({
      isLLMEnabled: false,
      isLoading: false,
    });

    renderWithRouter(<IssueDescription {...defaultProps} />);

    expect(screen.queryByTitle('Generate AI suggestion')).not.toBeInTheDocument();
    expect(screen.queryByTestId('llm-suggestion-content')).not.toBeInTheDocument();
  });

  it('calls getSuggestion only when opening LLM section', async () => {
    const user = userEvent.setup();

    renderWithRouter(<IssueDescription {...defaultProps} />);

    const aiButton = screen.getByTitle('Generate AI suggestion');

    // First click - opens section and calls getSuggestion
    await user.click(aiButton);
    expect(mockGetSuggestion).toHaveBeenCalledTimes(1);

    // Second click - closes section, should not call getSuggestion again
    await user.click(aiButton);
    expect(mockGetSuggestion).toHaveBeenCalledTimes(1); // Still only 1 call
    expect(screen.queryByTestId('llm-suggestion-content')).not.toBeInTheDocument();
  });

  it('tracks interaction when AI suggestion button is clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(<IssueDescription {...defaultProps} />);

    const aiButton = screen.getByTitle('Generate AI suggestion');
    await user.click(aiButton);

    expect(mockTrackCheckInteraction).toHaveBeenCalledWith('aisuggestion_clicked', 'dashboard-performance', 'step1');
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
    expect(mockTrackCheckInteraction).toHaveBeenCalledWith('refresh_clicked', 'dashboard-performance', 'step1');

    // After timeout, button should be enabled again
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(retryButton).toBeEnabled();
    });

    jest.useRealTimers();
  });

  it('handles hide/show issue button click', async () => {
    const user = userEvent.setup();
    const mockOnHideIssue = jest.fn();

    renderWithRouter(<IssueDescription {...defaultProps} onHideIssue={mockOnHideIssue} />);

    const hideButton = screen.getByTitle('Hide issue');
    await user.click(hideButton);

    expect(mockOnHideIssue).toHaveBeenCalledWith(true);
    expect(mockTrackCheckInteraction).toHaveBeenCalledWith('silence_clicked', 'dashboard-performance', 'step1', {
      silenced: true,
    });
  });
});
