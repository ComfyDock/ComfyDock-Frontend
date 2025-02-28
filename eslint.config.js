import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
// These imports assume you installed the separate parser + plugin:
import tsPlugin, { configs as tsConfigs } from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Bring in baseline ESLint recommendations
      ...js.configs.recommended.rules,

      // Bring in TS recommendations
      ...tsConfigs.recommended.rules,

      // React hooks recommended rules
      ...reactHooks.configs.recommended.rules,

      // Add any custom rules you want from the TS plugin
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // You can disable the built-in no-unused-vars if you want TS to handle it
      'no-unused-vars': 'off',

      // React Refresh rule
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];