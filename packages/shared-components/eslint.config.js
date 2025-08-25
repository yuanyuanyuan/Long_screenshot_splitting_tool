// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config({ 
  ignores: [
    'dist/**', 
    'node_modules/**',
    '**/*.d.ts'
  ] 
}, {
  extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
  files: ['**/*.{ts,tsx,js,jsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: {
      ...globals.browser,
      ...globals.node
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // 包边界检查规则 - shared-components 只能导入 ui-library
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/screenshot-splitter/src/**'],
            message: '禁止导入应用层包: shared-components 不能依赖 screenshot-splitter'
          },
          {
            group: ['**/ui-library/src/**'],
            message: '请使用包名导入: import { Component } from "ui-library"'
          }
        ]
      }
    ],
  },
}, storybook.configs["flat/recommended"]);