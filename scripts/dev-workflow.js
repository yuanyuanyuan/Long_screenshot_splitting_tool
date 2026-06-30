#!/usr/bin/env node

/**
 * Development Workflow Script for Parallel Feature Development
 * Manages branch switching, testing, and environment configuration
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const workflows = {
  setup: {
    description: 'Setup parallel development environment',
    actions: [
      "Create feature branches if they don't exist",
      'Install dependencies',
      'Run initial tests to validate setup',
    ],
  },
  seo: {
    description: 'Switch to SEO optimization workflow',
    branch: 'seo-optimization',
    env: {
      VITE_ENABLE_SEO_DEV: 'true',
      VITE_ENABLE_MOBILE_DEV: 'false',
      VITE_FEATURE_FOCUS: 'seo',
    },
    testCommand: 'npm run test:seo',
  },
  mobile: {
    description: 'Switch to Mobile responsive workflow',
    branch: 'mobile-responsive',
    env: {
      VITE_ENABLE_SEO_DEV: 'false',
      VITE_ENABLE_MOBILE_DEV: 'true',
      VITE_FEATURE_FOCUS: 'mobile',
    },
    testCommand: 'npm run test:mobile',
  },
  integration: {
    description: 'Integration testing workflow',
    branch: 'main',
    env: {
      VITE_ENABLE_SEO_DEV: 'true',
      VITE_ENABLE_MOBILE_DEV: 'true',
      VITE_FEATURE_FOCUS: 'integration',
    },
    testCommand: 'npm run test:integration',
  },
};

function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('❌ Error getting current branch:', error.message);
    return null;
  }
}

function branchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function switchToBranch(branchName) {
  try {
    console.log(`🔄 Switching to branch: ${branchName}`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error switching to branch ${branchName}:`, error.message);
    return false;
  }
}

function createBranch(branchName) {
  try {
    console.log(`🌱 Creating branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error creating branch ${branchName}:`, error.message);
    return false;
  }
}

function updateEnvFile(env) {
  const envPath = path.join(process.cwd(), '.env.development');
  try {
    let envContent = fs.readFileSync(envPath, 'utf-8');

    Object.entries(env).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment configuration updated');
  } catch (error) {
    console.error('❌ Error updating environment file:', error.message);
  }
}

function runSetup() {
  console.log('🚀 Setting up parallel development environment...\n');

  const featureBranches = ['seo-optimization', 'mobile-responsive'];
  const currentBranch = getCurrentBranch();

  // Ensure we're on main branch
  if (currentBranch !== 'main') {
    console.log('📍 Switching to main branch first...');
    if (!switchToBranch('main')) return false;
  }

  // Create feature branches if they don't exist
  featureBranches.forEach(branch => {
    if (!branchExists(branch)) {
      console.log(`🌱 Creating feature branch: ${branch}`);
      createBranch(branch);
      switchToBranch('main');
    } else {
      console.log(`✅ Branch ${branch} already exists`);
    }
  });

  // Install dependencies
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    return false;
  }

  // Run initial test to validate setup
  console.log('🧪 Running initial tests...');
  try {
    execSync('npm run test -- --run', { stdio: 'inherit' });
    console.log('✅ Setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Some tests failed, but setup is complete. Fix tests before proceeding.');
    return false;
  }
}

function runWorkflow(workflowName) {
  const workflow = workflows[workflowName];

  if (!workflow) {
    console.error(`❌ Unknown workflow: ${workflowName}`);
    return false;
  }

  console.log(`🎯 Starting ${workflow.description}...\n`);

  // Switch to appropriate branch
  if (workflow.branch) {
    const currentBranch = getCurrentBranch();
    if (currentBranch !== workflow.branch) {
      if (!branchExists(workflow.branch)) {
        createBranch(workflow.branch);
      } else {
        switchToBranch(workflow.branch);
      }
    }
  }

  // Update environment configuration
  if (workflow.env) {
    updateEnvFile(workflow.env);
  }

  // Run tests if specified
  if (workflow.testCommand) {
    console.log(`🧪 Running tests: ${workflow.testCommand}`);
    try {
      execSync(workflow.testCommand, { stdio: 'inherit' });
      console.log('✅ Tests passed!');
    } catch (error) {
      console.error('❌ Tests failed. Fix issues before proceeding.');
      return false;
    }
  }

  console.log(`✅ ${workflow.description} setup complete!`);
  return true;
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
📋 Available workflows:
  setup      - Setup parallel development environment
  seo        - Switch to SEO optimization workflow  
  mobile     - Switch to Mobile responsive workflow
  integration - Integration testing workflow

🔧 Usage:
  node scripts/dev-workflow.js <workflow>

📘 Examples:
  node scripts/dev-workflow.js setup
  node scripts/dev-workflow.js seo
  node scripts/dev-workflow.js mobile
  `);
  process.exit(0);
}

if (command === 'setup') {
  const success = runSetup();
  process.exit(success ? 0 : 1);
} else if (workflows[command]) {
  const success = runWorkflow(command);
  process.exit(success ? 0 : 1);
} else {
  console.error(`❌ Unknown command: ${command}`);
  process.exit(1);
}
