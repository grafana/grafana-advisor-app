import { defineConfig } from 'eslint/config';
import grafanaConfig from '@grafana/eslint-config';

export default defineConfig([
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      'playwright-report/',
      'test-results/',
      '**/.eslintcache',
      'src/generated/endpoints.gen.ts',
    ],
  },
  ...grafanaConfig,
  {
    rules: {
      'react/prop-types': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    files: ['tests/**/*'],

    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]);
