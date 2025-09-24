#!/usr/bin/env node

/**
 * MCP Installation and Setup Script for Birch Lounge
 *
 * This script:
 * 1. Checks for required dependencies
 * 2. Creates necessary directories
 * 3. Sets up environment configuration
 * 4. Initializes MCP services
 * 5. Provides setup instructions
 */

import { execSync } from 'child_process';
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
  magenta: '\x1b[35m',
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

async function checkDependencies() {
  logHeader('Checking Dependencies');

  const requiredPackages = [
    '@modelcontextprotocol/sdk',
    'axios',
    'cheerio',
    'xlsx',
    'pg',
    'notion-client',
    '@octokit/rest',
    'openai'
  ];

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const missingPackages = [];

  for (const pkg of requiredPackages) {
    if (dependencies[pkg]) {
      logSuccess(`${pkg} is installed`);
    } else {
      logWarning(`${pkg} is missing`);
      missingPackages.push(pkg);
    }
  }

  if (missingPackages.length > 0) {
    logInfo('Installing missing packages...');
    try {
      execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
      logSuccess('All dependencies installed successfully');
    } catch (error) {
      logError('Failed to install dependencies');
      process.exit(1);
    }
  } else {
    logSuccess('All dependencies are already installed');
  }
}

function createDirectories() {
  logHeader('Creating Directories');

  const directories = [
    'data',
    'data/imports',
    'data/exports',
    'data/templates',
    'data/cache',
    'logs'
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    } else {
      logInfo(`Directory already exists: ${dir}`);
    }
  }
}

function setupEnvironment() {
  logHeader('Setting Up Environment');

  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      logSuccess('Created .env file from .env.example');
      logWarning('Please edit .env file and add your API keys');
    } else {
      logError('.env.example file not found');
    }
  } else {
    logInfo('.env file already exists');
  }
}

function createMCPTemplates() {
  logHeader('Creating MCP Templates');

  // Create Excel template
  const excelTemplate = {
    name: 'Sample Cocktail',
    category: 'Classic',
    alcoholContent: 'alcoholic',
    flavorProfile: ['refreshing', 'citrusy'],
    ingredients: [
      { name: 'Gin', amount: 2, unit: 'oz', type: 'spirit' },
      { name: 'Lime Juice', amount: 0.75, unit: 'oz', type: 'citrus' },
      { name: 'Simple Syrup', amount: 0.5, unit: 'oz', type: 'sweetener' }
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake vigorously for 10-15 seconds',
      'Double strain into chilled coupe glass',
      'Garnish with lime wheel'
    ],
    garnish: 'Lime wheel',
    glassware: 'Coupe',
    servingSize: 1,
    preparationTime: 2,
    difficulty: 'Easy',
    tags: ['refreshing', 'citrus', 'classic']
  };

  const templatePath = 'data/templates/recipe-template.json';
  if (!fs.existsSync(templatePath)) {
    fs.writeFileSync(templatePath, JSON.stringify(excelTemplate, null, 2));
    logSuccess('Created recipe template');
  } else {
    logInfo('Recipe template already exists');
  }
}

function displaySetupInstructions() {
  logHeader('Setup Instructions');

  log('\n📋 Next Steps:', 'bright');
  log('\n1. Configure API Keys:', 'yellow');
  log('   • Edit .env file and add your API keys');
  log('   • Get Exa Search API key: https://exa.ai/');
  log('   • Get Notion API key: https://developers.notion.com/');
  log('   • Get GitHub token: https://github.com/settings/tokens');
  log('   • Get OpenAI API key: https://platform.openai.com/api-keys');

  log('\n2. Database Setup (Optional):', 'yellow');
  log('   • Install PostgreSQL if using database analytics');
  log('   • Create database: birch_lounge_analytics');
  log('   • Update DATABASE_URL in .env file');

  log('\n3. Claude Desktop Integration:', 'yellow');
  log('   • Copy mcp-config.json to Claude Desktop config');
  log('   • Update API keys in the config');
  log('   • Restart Claude Desktop');

  log('\n4. Test MCP Services:', 'yellow');
  log('   • Run: npm run test:mcp');
  log('   • Check MCP Dashboard in the app');

  log('\n🚀 MCP Services Available:', 'bright');
  log('   ✅ Web Fetch - Recipe discovery and scraping');
  log('   ✅ Excel - Bulk recipe import/export');
  log('   ⚙️  Database - Advanced analytics (requires PostgreSQL)');
  log('   ⚙️  Search - Real-time recipe discovery (requires Exa API)');
  log('   ⚙️  Notion - Documentation and collaboration (requires Notion API)');
  log('   ⚙️  GitHub - Version control (requires GitHub token)');
  log('   ⚙️  OpenAI - Enhanced AI capabilities (requires OpenAI API)');

  log('\n📚 Documentation:', 'bright');
  log('   • MCP Services: /docs/mcp-services.md');
  log('   • API Keys Setup: /docs/api-keys-setup.md');
  log('   • Troubleshooting: /docs/troubleshooting.md');

  log('\n🎉 Installation Complete!', 'green');
  log('Edit your .env file and start using MCP services.', 'green');
}

async function main() {
  try {
    log('🚀 Birch Lounge MCP Installation Script', 'bright');

    await checkDependencies();
    createDirectories();
    setupEnvironment();
    createMCPTemplates();
    displaySetupInstructions();

  } catch (error) {
    logError(`Installation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the installation
main();
