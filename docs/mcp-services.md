# MCP Services Documentation

## Overview

The Birch Lounge app integrates with 7 Model Context Protocol (MCP) servers to enhance recipe management, discovery, and collaboration capabilities. This document provides comprehensive setup and usage instructions for each service.

## Quick Start

1. **Install Dependencies**: `npm run mcp:install`
2. **Configure Environment**: Edit `.env` file with your API keys
3. **Test Services**: `npm run mcp:test`
4. **Check Status**: `npm run mcp:status`

## Service Categories

### 🚀 **Priority 1: Immediate Recipe Management**
- **Web Fetch MCP** - Recipe discovery and import
- **Excel MCP** - Bulk recipe operations
- **Database MCP** - Advanced analytics

### 🎯 **Priority 2: Service Mode Enhancement**
- **Search MCP** - Real-time recipe discovery
- **Notion MCP** - Documentation and collaboration

### 🔧 **Priority 3: Augment Integration**
- **GitHub MCP** - Version control and collaboration
- **OpenAI MCP** - Enhanced AI capabilities

---

## 1. 🌐 Web Fetch MCP - Recipe Discovery & Scraping

### Purpose
Automatically discover and import cocktail recipes from popular websites.

### Setup
```bash
# No API keys required - uses public web scraping
MCP_WEB_FETCH_ENABLED=true
WEB_FETCH_ALLOWED_DOMAINS=liquor.com,diffordsguide.com,punchdrink.com
WEB_FETCH_RATE_LIMIT=30
```

### Features
- **Recipe Discovery**: Search and scrape recipes from trusted cocktail websites
- **Batch Import**: Import multiple recipes from URLs
- **Smart Parsing**: Automatically extract ingredients, instructions, and metadata
- **Domain Filtering**: Only scrape from approved cocktail websites

### Usage
```javascript
// Import single recipe
const recipe = await mcpWebFetchService.fetchRecipe('https://liquor.com/gin-tonic');

// Batch import
const recipes = await mcpWebFetchService.batchFetchRecipes([
  'https://liquor.com/gin-tonic',
  'https://diffordsguide.com/negroni'
]);

// Search recipes
const results = await mcpWebFetchService.searchRecipes('gin cocktails');
```

### Supported Websites
- Liquor.com
- Difford's Guide
- Punch Drink
- The Spruce Eats
- CocktailDB

---

## 2. 📊 Excel MCP - Bulk Recipe Management

### Purpose
Import and export large quantities of recipes using Excel files.

### Setup
```bash
# No API keys required
MCP_EXCEL_ENABLED=true
EXCEL_EXPORT_DIR=./data/exports
EXCEL_IMPORT_DIR=./data/imports
```

### Features
- **Bulk Export**: Export all recipes to Excel format
- **Template Import**: Use standardized Excel templates for recipe import
- **Data Validation**: Automatic validation of imported recipe data
- **Batch Operations**: Process hundreds of recipes efficiently

### Usage
```javascript
// Export recipes to Excel
await mcpExcelService.exportRecipes(recipes, 'cocktail-menu-2024.xlsx');

// Import from Excel
const importedRecipes = await mcpExcelService.importRecipes('new-recipes.xlsx');

// Create template
const template = await mcpExcelService.createRecipeTemplate();
```

### Excel Template Format
| Name | Category | Ingredients | Instructions | Garnish | Glass |
|------|----------|-------------|--------------|---------|-------|
| Gin & Tonic | Classic | Gin: 2oz, Tonic: 4oz | Build in glass | Lime wheel | Highball |

---

## 3. 🗄️ Database MCP - Advanced Analytics

### Purpose
Advanced recipe analytics and business intelligence using PostgreSQL.

### Setup
```bash
# Requires PostgreSQL installation
MCP_DATABASE_ENABLED=true
DATABASE_URL=postgresql://localhost:5432/birch_lounge_analytics
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Prerequisites
1. Install PostgreSQL
2. Create database: `createdb birch_lounge_analytics`
3. Update DATABASE_URL in .env

### Features
- **Recipe Analytics**: Track popular recipes, ingredients, and trends
- **Cost Analysis**: Calculate ingredient costs and profit margins
- **Performance Metrics**: Monitor app usage and recipe performance
- **Custom Reports**: Generate business intelligence reports

### Usage
```javascript
// Get recipe analytics
const analytics = await mcpDatabaseService.getRecipeAnalytics();

// Track recipe usage
await mcpDatabaseService.trackRecipeUsage(recipeId, userId);

// Generate cost report
const costReport = await mcpDatabaseService.generateCostReport();
```

---

## 4. 🔍 Search MCP - Real-time Recipe Discovery

### Purpose
Real-time cocktail recipe discovery using Exa Search API.

### Setup
```bash
# Requires Exa API key from https://exa.ai/
MCP_SEARCH_ENABLED=true
EXA_API_KEY=your_exa_api_key_here
SEARCH_RATE_LIMIT=100
SEARCH_CACHE_TTL=3600
```

### Features
- **Intelligent Search**: AI-powered recipe discovery
- **Trending Recipes**: Find popular and seasonal cocktails
- **Ingredient Substitution**: Suggest alternatives for missing ingredients
- **Real-time Results**: Fast search with caching

### Usage
```javascript
// Search for recipes
const results = await mcpSearchService.searchRecipes('summer gin cocktails');

// Get trending recipes
const trending = await mcpSearchService.getTrendingRecipes();

// Find substitutions
const substitutions = await mcpSearchService.findSubstitutions('elderflower liqueur');
```

---

## 5. 📝 Notion MCP - Comprehensive Documentation

### Purpose
Create comprehensive recipe documentation and team collaboration.

### Setup
```bash
# Requires Notion integration
MCP_NOTION_ENABLED=true
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here
```

### Prerequisites
1. Create Notion integration at https://developers.notion.com/
2. Create a database for recipes
3. Share database with your integration

### Features
- **Recipe Documentation**: Rich recipe pages with images and notes
- **Team Collaboration**: Share recipes and get feedback
- **Training Materials**: Create bartender training guides
- **Version History**: Track recipe changes over time

### Usage
```javascript
// Create recipe page
await mcpNotionService.createRecipePage(recipe);

// Update recipe
await mcpNotionService.updateRecipe(recipeId, updates);

// Create training guide
await mcpNotionService.createTrainingGuide(recipes);
```

---

## 6. 🔄 GitHub MCP - Version Control & Collaboration

### Purpose
Version control for recipes and team collaboration.

### Setup
```bash
# Requires GitHub personal access token
MCP_GITHUB_ENABLED=true
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=your_github_username_here
GITHUB_REPO=birch-lounge-recipes
```

### Prerequisites
1. Create GitHub repository for recipes
2. Generate personal access token with repo permissions
3. Configure repository settings

### Features
- **Recipe Versioning**: Track all recipe changes
- **Team Collaboration**: Pull requests for recipe reviews
- **Backup & Sync**: Automatic backup of all recipes
- **Change History**: Complete audit trail of modifications

### Usage
```javascript
// Commit recipe changes
await mcpGitHubService.commitRecipe(recipe, 'Updated gin & tonic recipe');

// Create pull request
await mcpGitHubService.createPullRequest(changes, 'New summer cocktails');

// Sync recipes
await mcpGitHubService.syncRecipes();
```

---

## 7. 🤖 OpenAI MCP - Enhanced AI Capabilities

### Purpose
Enhanced AI capabilities to complement Gemini AI.

### Setup
```bash
# Requires OpenAI API key
MCP_OPENAI_ENABLED=true
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
```

### Features
- **Recipe Analysis**: Detailed recipe analysis and optimization
- **Menu Optimization**: AI-powered menu profitability analysis
- **Ingredient Pairing**: Smart ingredient combination suggestions
- **Cost Optimization**: Reduce costs while maintaining quality

### Usage
```javascript
// Analyze recipe
const analysis = await mcpOpenAIService.analyzeRecipe(recipe);

// Optimize menu
const optimization = await mcpOpenAIService.optimizeMenu(menu);

// Suggest pairings
const pairings = await mcpOpenAIService.suggestPairings(ingredient);
```

---

## Management Commands

### Installation & Setup
```bash
npm run mcp:install    # Install and configure MCP services
npm run mcp:test       # Test all services
npm run mcp:status     # Check service status
```

### Service Management
```bash
npm run mcp:start      # Start all services
npm run mcp:stop       # Stop all services
npm run mcp:restart    # Restart all services
npm run mcp:health     # Health check
npm run mcp:logs       # View service logs
```

## Troubleshooting

### Common Issues

1. **Service Not Available**
   - Check API keys in .env file
   - Verify service is enabled
   - Check network connectivity

2. **Rate Limiting**
   - Reduce request frequency
   - Check rate limit settings
   - Use caching where available

3. **Authentication Errors**
   - Verify API keys are correct
   - Check token permissions
   - Ensure services are properly configured

### Getting Help

- Check logs: `npm run mcp:logs`
- Run health check: `npm run mcp:health`
- Review troubleshooting guide: `/docs/troubleshooting.md`
- Open GitHub issue for persistent problems

## Next Steps

1. **Configure Priority 1 Services** (Web Fetch, Excel)
2. **Set up API keys** for Priority 2 services
3. **Test integration** with Claude Desktop
4. **Explore advanced features** and customization options
