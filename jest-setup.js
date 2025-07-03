// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Global mocks to avoid Redux context issues in tests
jest.mock('api/api', () => ({
  ...jest.requireActual('api/api'),
  useLLMSuggestion: jest.fn().mockReturnValue({
    getSuggestion: jest.fn(),
    response: null,
    isLoading: false,
    isLLMEnabled: false,
  }),
}));
