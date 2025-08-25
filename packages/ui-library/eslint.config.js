import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { 
    ignores: [
      'dist/**', 
      'node_modules/**',
      '**/*.d.ts'
    ] 
  },
  {
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
      // 包边界检查规则 - ui-library 不能导入任何内部包
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/screenshot-splitter/src/**'],
              message: '禁止导入应用层包: ui-library 不能依赖 screenshot-splitter'
            },
            {
              group: ['**/shared-components/src/**'],
              message: '禁止导入共享服务层包: ui-library 不能依赖 shared-components'
            }
          ]
        }
      ],
    },
  },
);