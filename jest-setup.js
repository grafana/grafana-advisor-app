// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Mock @grafana/runtime to provide usePluginInteractionReporter
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  usePluginInteractionReporter: jest.fn(() => jest.fn()),
}));

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
