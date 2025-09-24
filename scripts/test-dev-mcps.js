#!/usr/bin/env node

/**
 * Test Development MCP Services
 *
 * Verifies that all development-focused MCP services are properly installed
 * and configured for use with Augment
 */

import fs from 'fs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  // eslint-disable-next-line no-console
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function testFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description} exists`);
    return true;
  } else {
    logError(`${description} missing: ${filePath}`);
    return false;
  }
}

function testDevMCPInstallation() {
  logHeader('Testing Development MCP Installation');

  let allTestsPassed = true;

  // Test core files
  const coreFiles = [
    { path: 'scripts/mcp-code-analysis.js', desc: 'Code Analysis MCP service' },
    { path: 'scripts/mcp-test-automation.js', desc: 'Test Automation MCP service' },
    { path: 'mcp-dev-config.json', desc: 'Development MCP configuration' }
  ];

  coreFiles.forEach(file => {
    if (!testFileExists(file.path, file.desc)) {
      allTestsPassed = false;
    }
  });

  // Test package.json scripts
  logInfo('Checking package.json scripts...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = [
      'dev-mcp:install',
      'dev-mcp:test',
      'dev-mcp:analyze',
      'dev-mcp:test-auto'
    ];

    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logSuccess(`Script '${script}' configured`);
      } else {
        logWarning(`Script '${script}' missing`);
        allTestsPassed = false;
      }
    });
  } catch (error) {
    logError(`Failed to read package.json: ${error.message}`);
    allTestsPassed = false;
  }

  // Test MCP configuration
  logInfo('Validating MCP configuration...');
  try {
    const mcpConfig = JSON.parse(fs.readFileSync('mcp-dev-config.json', 'utf8'));
    if (mcpConfig.mcpServers) {
      const serverCount = Object.keys(mcpConfig.mcpServers).length;
      logSuccess(`${serverCount} MCP servers configured`);
    } else {
      logWarning('No MCP servers found in configuration');
    }
  } catch (error) {
    logError(`Failed to read MCP config: ${error.message}`);
    allTestsPassed = false;
  }

  return allTestsPassed;
}

function displayTestResults(passed) {
  logHeader('Development MCP Test Results');

  if (passed) {
    log('\n🎉 All tests passed!', 'green');
    log('\n✅ Development MCP services are ready to use', 'bright');

    log('\n🚀 Next Steps:', 'cyan');
    log('   1. Copy mcp-dev-config.json to Claude Desktop config');
    log('   2. Ask Augment to analyze your code');
    log('   3. Request automated test generation');
    log('   4. Monitor development performance');

    log('\n📋 Available Commands:', 'blue');
    log('   • npm run dev-mcp:analyze - Run code analysis');
    log('   • npm run dev-mcp:test-auto - Run test automation');
    log('   • npm run dev-mcp:test - Run this test suite');

  } else {
    log('\n❌ Some tests failed', 'red');
    log('\n🔧 To fix issues:', 'yellow');
    log('   1. Run: npm run dev-mcp:install');
    log('   2. Check file permissions');
    log('   3. Verify Node.js version compatibility');
    log('   4. Re-run: npm run dev-mcp:test');
  }
}

function main() {
  log('🧪 Development MCP Test Suite', 'bright');

  try {
    const testsPassed = testDevMCPInstallation();
    displayTestResults(testsPassed);

    process.exit(testsPassed ? 0 : 1);

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
main();
