// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const path = require('path');
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  moduleNameMapper: {
    // Existing mappings from the base config
    ...require('./.config/jest.config').moduleNameMapper,
    // Add react-markdown mock
    '^react-markdown$': path.resolve(__dirname, 'src/__mocks__/react-markdown.tsx'),
    // Add @grafana/llm mock
    '^@grafana/llm$': path.resolve(__dirname, 'src/__mocks__/grafana-llm.ts'),
  },
  // @grafana/data pulls in @react-hookz/web (and its dep @ver0/deep-equal), which only ship ESM builds
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, '@react-hookz/web', '@ver0/deep-equal'])],
};
