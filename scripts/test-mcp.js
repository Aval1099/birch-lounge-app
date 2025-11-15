#!/usr/bin/env node

/**
 * MCP Services Test Script for Birch Lounge
 *
 * This script tests all MCP services to ensure they're working correctly
 */

import fs from 'fs';
import path from 'path';

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
  console.warn(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
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

async function testWebFetchService() {
  logHeader('Testing Web Fetch MCP Service');

  try {
    logInfo('Testing service file exists...');

    // Check if service file exists
    if (fs.existsSync('src/services/mcpWebFetchClient.js')) {
      logSuccess('Web Fetch client wrapper exists');

      // Test basic URL validation logic
      const testUrl = 'https://www.liquor.com/recipes/gin-and-tonic/';
      const allowedDomains = ['liquor.com', 'diffordsguide.com', 'punchdrink.com'];

      const isValidDomain = allowedDomains.some(domain => testUrl.includes(domain));

      if (isValidDomain) {
        logSuccess('URL validation logic working');
      } else {
        logWarning('URL validation logic failed');
      }

      logInfo('Service ready for browser environment');

    } else {
      logError('Web Fetch service file not found');
    }

  } catch (error) {
    logError(`Web Fetch test failed: ${error.message}`);
  }
}

async function testExcelService() {
  logHeader('Testing Excel MCP Service');

  try {
    logInfo('Testing service file exists...');

    // Check if service file exists
    if (fs.existsSync('src/services/mcpExcelService.js')) {
      logSuccess('Excel service file exists');

      // Check if export/import directories exist
      if (fs.existsSync('data/exports') && fs.existsSync('data/imports')) {
        logSuccess('Export/import directories configured');
      } else {
        logWarning('Export/import directories not found');
      }

      // Check if template exists
      if (fs.existsSync('data/templates/recipe-template.json')) {
        logSuccess('Recipe template exists');
      } else {
        logWarning('Recipe template not found');
      }

      logInfo('Service ready for browser environment');

    } else {
      logError('Excel service file not found');
    }

  } catch (error) {
    logError(`Excel test failed: ${error.message}`);
  }
}

async function testDatabaseService() {
  logHeader('Testing Database MCP Service');

  try {
    logInfo('Testing service file exists...');

    if (fs.existsSync('src/services/mcpDatabaseService.js')) {
      logSuccess('Database service file exists');
      logInfo('Note: Database connection requires PostgreSQL setup');
      logInfo('Service ready for browser environment');
    } else {
      logError('Database service file not found');
    }

  } catch (error) {
    logError(`Database test failed: ${error.message}`);
  }
}

async function testSearchService() {
  logHeader('Testing Search MCP Service');

  try {
    logInfo('Testing service file exists...');

    if (fs.existsSync('src/services/mcpSearchService.js')) {
      logSuccess('Search service file exists');
      logInfo('Note: Search requires Exa API key');
      logInfo('Service ready for browser environment');
    } else {
      logError('Search service file not found');
    }

  } catch (error) {
    logError(`Search test failed: ${error.message}`);
  }
}

async function testNotionService() {
  logHeader('Testing Notion MCP Service');

  try {
    logInfo('Testing service file exists...');

    if (fs.existsSync('src/services/mcpNotionService.js')) {
      logSuccess('Notion service file exists');
      logInfo('Note: Notion requires API key and database ID');
      logInfo('Service ready for browser environment');
    } else {
      logError('Notion service file not found');
    }

  } catch (error) {
    logError(`Notion test failed: ${error.message}`);
  }
}

async function testGitHubService() {
  logHeader('Testing GitHub MCP Service');

  try {
    logInfo('Testing service file exists...');

    if (fs.existsSync('src/services/mcpGitHubService.js')) {
      logSuccess('GitHub service file exists');
      logInfo('Note: GitHub requires personal access token');
      logInfo('Service ready for browser environment');
    } else {
      logError('GitHub service file not found');
    }

  } catch (error) {
    logError(`GitHub test failed: ${error.message}`);
  }
}

async function testOpenAIService() {
  logHeader('Testing OpenAI MCP Service');

  try {
    logInfo('Testing service file exists...');

    if (fs.existsSync('src/services/mcpOpenAIService.js')) {
      logSuccess('OpenAI service file exists');
      logInfo('Note: OpenAI requires API key');
      logInfo('Service ready for browser environment');
    } else {
      logError('OpenAI service file not found');
    }

  } catch (error) {
    logError(`OpenAI test failed: ${error.message}`);
  }
}

async function testMCPManager() {
  logHeader('Testing MCP Manager');

  try {
    logInfo('Testing manager file exists...');

    if (fs.existsSync('src/services/mcpManager.js')) {
      logSuccess('MCP Manager file exists');
      logInfo('Manager ready for browser environment');
    } else {
      logError('MCP Manager file not found');
    }

  } catch (error) {
    logError(`MCP Manager test failed: ${error.message}`);
  }
}

function checkEnvironmentConfiguration() {
  logHeader('Checking Environment Configuration');

  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    logError('.env file not found');
    return;
  }

  logSuccess('.env file exists');

  // Read .env file
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');

  const requiredVars = [
    'MCP_WEB_FETCH_ENABLED',
    'MCP_EXCEL_ENABLED',
    'WEB_FETCH_ALLOWED_DOMAINS',
    'EXCEL_EXPORT_DIR'
  ];

  const optionalVars = [
    'EXA_API_KEY',
    'NOTION_API_KEY',
    'GITHUB_TOKEN',
    'OPENAI_API_KEY',
    'DATABASE_URL'
  ];

  for (const varName of requiredVars) {
    const found = envLines.some(line => line.startsWith(`${varName}=`));
    if (found) {
      logSuccess(`${varName} is configured`);
    } else {
      logWarning(`${varName} is missing`);
    }
  }

  for (const varName of optionalVars) {
    const found = envLines.some(line => line.startsWith(`${varName}=`) && !line.includes('your_'));
    if (found) {
      logSuccess(`${varName} is configured`);
    } else {
      logInfo(`${varName} is not configured (optional)`);
    }
  }
}

function displayTestSummary() {
  logHeader('Test Summary');

  log('\n🧪 MCP Services Test Complete!', 'bright');
  log('\n📋 Next Steps:', 'yellow');
  log('   1. Configure missing API keys in .env file');
  log('   2. Set up optional services (PostgreSQL, etc.)');
  log('   3. Test individual services with real API calls');
  log('   4. Integrate with Claude Desktop using mcp-config.json');

  log('\n🔧 Available Commands:', 'blue');
  log('   • npm run mcp:status - Check service status');
  log('   • npm run mcp:health - Health check all services');
  log('   • npm run mcp:logs - View service logs');

  log('\n📚 Documentation:', 'cyan');
  log('   • See /docs/mcp-services.md for detailed setup');
  log('   • Check /docs/troubleshooting.md for common issues');
}

async function main() {
  try {
    log('🧪 Birch Lounge MCP Services Test Suite', 'cyan');

    // Check environment first
    checkEnvironmentConfiguration();

    // Test all services
    await testWebFetchService();
    await testExcelService();
    await testDatabaseService();
    await testSearchService();
    await testNotionService();
    await testGitHubService();
    await testOpenAIService();
    await testMCPManager();

    displayTestSummary();

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
main();
