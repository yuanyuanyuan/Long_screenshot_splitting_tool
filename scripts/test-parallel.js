#!/usr/bin/env node

/**
 * Parallel Test Runner for SEO and Mobile Feature Development
 * Supports isolated feature testing and parallel execution
 */

const { spawn } = require('child_process');
const path = require('path');

const testConfigs = {
  seo: {
    name: 'SEO Tests',
    patterns: [
      'src/utils/seo/**/*.test.ts',
      'src/components/**/SEO*.test.tsx',
      'src/hooks/**/useSEO*.test.ts',
      'src/config/**/seo*.test.ts'
    ],
    env: {
      VITE_ENABLE_SEO_DEV: 'true',
      VITE_ENABLE_MOBILE_DEV: 'false',
      VITE_FEATURE_FOCUS: 'seo'
    }
  },
  mobile: {
    name: 'Mobile Responsive Tests',
    patterns: [
      'src/components/responsive/**/*.test.tsx',
      'src/hooks/**/useViewport*.test.ts',
      'src/utils/**/*responsive*.test.ts'
    ],
    env: {
      VITE_ENABLE_SEO_DEV: 'false',
      VITE_ENABLE_MOBILE_DEV: 'true',
      VITE_FEATURE_FOCUS: 'mobile'
    }
  },
  integration: {
    name: 'Integration Tests',
    patterns: [
      'src/**/*.integration.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}'
    ],
    env: {
      VITE_ENABLE_SEO_DEV: 'true',
      VITE_ENABLE_MOBILE_DEV: 'true',
      VITE_FEATURE_FOCUS: 'integration'
    }
  }
};

function runTests(feature, options = {}) {
  const config = testConfigs[feature];
  if (!config) {
    console.error(`❌ Unknown feature: ${feature}`);
    process.exit(1);
  }

  console.log(`\n🧪 Running ${config.name}...`);
  console.log(`📁 Patterns: ${config.patterns.join(', ')}\n`);

  const args = [
    'run',
    options.coverage ? 'test:coverage' : 'test',
    '--',
    '--reporter=verbose',
    ...config.patterns.map(pattern => `--run "${pattern}"`)
  ];

  if (options.watch) {
    args.push('--watch');
  }

  const testProcess = spawn('npm', args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...config.env,
      NODE_ENV: 'test',
      VITE_DEV_MODE: 'parallel'
    },
    stdio: 'inherit'
  });

  testProcess.on('close', (code) => {
    const status = code === 0 ? '✅' : '❌';
    console.log(`\n${status} ${config.name} completed with code ${code}`);
    
    if (options.exitOnFailure && code !== 0) {
      process.exit(code);
    }
  });

  return testProcess;
}

function runAllParallel(options = {}) {
  console.log('🚀 Running all tests in parallel...\n');
  
  const features = Object.keys(testConfigs);
  const processes = features.map(feature => runTests(feature, options));
  
  let completed = 0;
  let hasFailures = false;

  processes.forEach((process, index) => {
    process.on('close', (code) => {
      completed++;
      if (code !== 0) hasFailures = true;
      
      if (completed === processes.length) {
        const status = hasFailures ? '❌' : '✅';
        console.log(`\n${status} All parallel tests completed`);
        process.exit(hasFailures ? 1 : 0);
      }
    });
  });
}

// CLI Interface
const args = process.argv.slice(2);
const feature = args[0];
const options = {
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  exitOnFailure: args.includes('--exit-on-failure')
};

if (!feature || feature === 'all') {
  runAllParallel(options);
} else if (testConfigs[feature]) {
  runTests(feature, options);
} else {
  console.log(`
📋 Available test configurations:
  • seo           - SEO optimization tests
  • mobile        - Mobile responsive tests  
  • integration   - Integration tests
  • all          - Run all tests in parallel

🔧 Options:
  --coverage     - Generate coverage report
  --watch        - Watch mode
  --exit-on-failure - Exit on first failure

📘 Examples:
  node scripts/test-parallel.js seo
  node scripts/test-parallel.js all --coverage
  node scripts/test-parallel.js mobile --watch
  `);
}