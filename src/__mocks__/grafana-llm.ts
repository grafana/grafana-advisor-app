// Mock implementation of @grafana/llm for testing
// This avoids ES module import issues in Jest

export const llm = {
  Model: {
    BASE: 'base',
  },
  enabled: jest.fn().mockResolvedValue(true),
  chatCompletions: jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'test' } }],
  }),
};
