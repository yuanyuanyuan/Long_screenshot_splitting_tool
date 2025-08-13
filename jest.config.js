/**
 * Jest 测试配置
 * 支持 monorepo 结构和 TypeScript
 */

module.exports = {
  // 项目配置，支持多包测试
  projects: [
    {
      displayName: 'screenshot-splitter',
      testMatch: ['<rootDir>/packages/screenshot-splitter/**/*.test.{js,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/test-setup/screenshot-splitter.setup.js'],
      testEnvironment: 'jsdom',
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/packages/screenshot-splitter/src/$1',
        '^@shared/(.*)$': '<rootDir>/packages/shared-components/src/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/packages/screenshot-splitter/tsconfig.json'
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      collectCoverageFrom: [
        'packages/screenshot-splitter/src/**/*.{ts,tsx}',
        '!packages/screenshot-splitter/src/**/*.d.ts',
        '!packages/screenshot-splitter/src/main.tsx'
      ]
    },
    {
      displayName: 'shared-components',
      testMatch: ['<rootDir>/packages/shared-components/**/*.test.{js,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/test-setup/shared-components.setup.js'],
      testEnvironment: 'jsdom',
      moduleNameMapping: {
        '^@shared/(.*)$': '<rootDir>/packages/shared-components/src/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/packages/shared-components/tsconfig.json'
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      collectCoverageFrom: [
        'packages/shared-components/src/**/*.{ts,tsx}',
        '!packages/shared-components/src/**/*.d.ts',
        '!packages/shared-components/src/index.ts'
      ]
    },
    {
      displayName: 'build-scripts',
      testMatch: ['<rootDir>/tools/build-scripts/**/*.test.js'],
      testEnvironment: 'node',
      collectCoverageFrom: [
        'tools/build-scripts/**/*.js',
        '!tools/build-scripts/**/*.test.js'
      ]
    }
  ],

  // 全局配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // 清理模拟
  clearMocks: true,
  restoreMocks: true,

  // 测试超时
  testTimeout: 10000,

  // 详细输出
  verbose: true
};