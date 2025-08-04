// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const path = require('path');
const { grafanaESModules } = require('./.config/jest/utils');

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
  // Transform all ES modules that might be problematic with Jest
  // This broader approach handles the cascading ES module dependencies from Grafana 12.1.0
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      [
        ...grafanaESModules,
        'marked',
        'react-calendar',
        'get-user-locale',
        'memoize',
        'mimic-function',
        '@wojtekmaj',
      ].join('|') +
      '))',
  ],
};
