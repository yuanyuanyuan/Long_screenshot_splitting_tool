/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared-components'),
      'shared-components': path.resolve(__dirname, './shared-components'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/results.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'test-results/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-setup.ts',
        '**/*.test.*',
        '**/__tests__/**',
        '.backup/'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // Feature-specific thresholds
        'src/utils/seo/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/components/responsive/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Parallel testing configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    },
    // Test organization
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'shared-components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.backup',
      'test-results'
    ],
    typecheck: {
      tsconfig: './tsconfig.test.json'
    }
  }
})