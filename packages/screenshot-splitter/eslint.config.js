import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config([
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // 包边界检查规则
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/shared-components/src/**'],
              message: '请使用包名导入: import { Component } from "shared-components"'
            },
            {
              group: ['**/ui-library/src/**'],
              message: '请使用包名导入: import { Component } from "ui-library"'
            }
          ]
        }
      ],
    },
  },
]);
