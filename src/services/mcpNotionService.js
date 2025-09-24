/**
 * MCP Notion Service for Recipe Documentation and Collaboration
 * Integrates with Notion MCP server for comprehensive recipe management
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { apiKeyService } from './apiKeyService.js';

class MCPNotionService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.databaseIds = {
      recipes: null,
      ingredients: null,
      techniques: null,
      menus: null,
      training: null
    };
  }

  /**
   * Initialize MCP Notion connection
   */
  async initialize() {
    try {
      // WARNING: VITE_ environment variables are exposed to client-side code
      const notionApiKey = apiKeyService.getApiKey('notion') || process.env.VITE_NOTION_API_KEY;

      if (!notionApiKey) {
        throw new Error('Notion API key not found. Please configure in settings.');
      }

      // Log security warning in development
      if (process.env.NODE_ENV === 'development' && process.env.VITE_NOTION_API_KEY) {
        console.warn('⚠️ Notion API key exposed to client-side. Consider using a backend proxy for production.');
      }

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@ankitmalik84/notion-mcp-server'],
        env: {
          ...process.env,
          NOTION_API_KEY: notionApiKey
        }
      });

      this.client = new Client({
        name: 'birch-lounge-notion',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      // Initialize databases
      await this.initializeDatabases();

      console.warn('MCP Notion Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP Notion Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Initialize Notion databases for Birch Lounge
   */
  async initializeDatabases() {
    try {
      // Create or find Recipe Database
      this.databaseIds.recipes = await this.createOrFindDatabase('Birch Lounge Recipes', {
        'Name': { title: {} },
        'Category': {
          select: {
            options: [
              { name: 'Cocktail', color: 'blue' },
              { name: 'Mocktail', color: 'green' },
              { name: 'Shot', color: 'red' },
              { name: 'Punch', color: 'purple' }
            ]
          }
        },
        'Flavor Profile': {
          select: {
            options: [
              { name: 'Sweet', color: 'pink' },
              { name: 'Sour', color: 'yellow' },
              { name: 'Bitter', color: 'orange' },
              { name: 'Citrusy', color: 'green' },
              { name: 'Tropical', color: 'blue' },
              { name: 'Spicy', color: 'red' }
            ]
          }
        },
        'Alcohol Content': {
          select: {
            options: [
              { name: 'Alcoholic', color: 'red' },
              { name: 'Non-alcoholic', color: 'green' },
              { name: 'Low-alcohol', color: 'yellow' }
            ]
          }
        },
        'Prep Time': { number: { format: 'number' } },
        'Servings': { number: { format: 'number' } },
        'Instructions': { rich_text: {} },
        'Ingredients': { rich_text: {} },
        'Garnish': { rich_text: {} },
        'Glass Type': {
          select: {
            options: [
              { name: 'Rocks', color: 'brown' },
              { name: 'Highball', color: 'blue' },
              { name: 'Martini', color: 'gray' },
              { name: 'Coupe', color: 'pink' }
            ]
          }
        },
        'Cost Estimate': { number: { format: 'dollar' } },
        'Difficulty': {
          select: {
            options: [
              { name: 'Easy', color: 'green' },
              { name: 'Medium', color: 'yellow' },
              { name: 'Hard', color: 'red' }
            ]
          }
        },
        'Tags': { multi_select: { options: [] } },
        'Source': { url: {} },
        'Notes': { rich_text: {} },
        'Created': { created_time: {} },
        'Last Modified': { last_edited_time: {} }
      });

      // Create or find Ingredients Database
      this.databaseIds.ingredients = await this.createOrFindDatabase('Birch Lounge Ingredients', {
        'Name': { title: {} },
        'Category': {
          select: {
            options: [
              { name: 'Spirits', color: 'red' },
              { name: 'Liqueurs', color: 'orange' },
              { name: 'Mixers', color: 'blue' },
              { name: 'Fresh Ingredients', color: 'green' },
              { name: 'Garnish', color: 'yellow' },
              { name: 'Bitters', color: 'purple' }
            ]
          }
        },
        'Unit': {
          select: {
            options: [
              { name: 'oz', color: 'blue' },
              { name: 'ml', color: 'green' },
              { name: 'dash', color: 'yellow' },
              { name: 'splash', color: 'orange' }
            ]
          }
        },
        'Cost per Unit': { number: { format: 'dollar' } },
        'Current Stock': { number: { format: 'number' } },
        'Low Stock Threshold': { number: { format: 'number' } },
        'Supplier': { rich_text: {} },
        'Supplier SKU': { rich_text: {} },
        'Notes': { rich_text: {} },
        'Last Updated': { last_edited_time: {} }
      });

      // Create or find Training Database
      this.databaseIds.training = await this.createOrFindDatabase('Birch Lounge Training', {
        'Title': { title: {} },
        'Type': {
          select: {
            options: [
              { name: 'Recipe Guide', color: 'blue' },
              { name: 'Technique', color: 'green' },
              { name: 'Equipment', color: 'orange' },
              { name: 'Service', color: 'purple' },
              { name: 'Safety', color: 'red' }
            ]
          }
        },
        'Difficulty Level': {
          select: {
            options: [
              { name: 'Beginner', color: 'green' },
              { name: 'Intermediate', color: 'yellow' },
              { name: 'Advanced', color: 'red' }
            ]
          }
        },
        'Content': { rich_text: {} },
        'Video URL': { url: {} },
        'Related Recipes': { relation: { database_id: this.databaseIds.recipes } },
        'Tags': { multi_select: { options: [] } },
        'Created': { created_time: {} }
      });

    } catch (error) {
      console.error('Error initializing Notion databases:', error);
    }
  }

  /**
   * Create or find a Notion database
   * @param {string} title - Database title
   * @param {Object} properties - Database properties schema
   * @returns {Promise<string>} Database ID
   */
  async createOrFindDatabase(title, properties) {
    try {
      // First, try to find existing database
      const searchResponse = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'search_pages',
          arguments: {
            query: title,
            filter: { property: 'object', value: 'database' }
          }
        }
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        return searchResponse.results[0].id;
      }

      // If not found, create new database
      const createResponse = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'create_database',
          arguments: {
            parent: { type: 'page_id', page_id: process.env.VITE_NOTION_PARENT_PAGE_ID },
            title: [{ type: 'text', text: { content: title } }],
            properties
          }
        }
      });

      return createResponse.id;
    } catch (error) {
      console.error(`Error creating/finding database ${title}:`, error);
      throw error;
    }
  }

  /**
   * Sync recipe to Notion
   * @param {Object} recipe - Recipe to sync
   * @returns {Promise<string>} Notion page ID
   */
  async syncRecipeToNotion(recipe) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      // Check if recipe already exists in Notion
      const existingPage = await this.findRecipeInNotion(recipe.name);

      const pageProperties = this.buildRecipeProperties(recipe);
      const pageContent = this.buildRecipeContent(recipe);

      if (existingPage) {
        // Update existing page
        const response = await this.client.request({
          method: 'tools/call',
          params: {
            name: 'update_page',
            arguments: {
              page_id: existingPage.id,
              properties: pageProperties,
              children: pageContent
            }
          }
        });
        return response.id;
      } else {
        // Create new page
        const response = await this.client.request({
          method: 'tools/call',
          params: {
            name: 'create_page',
            arguments: {
              parent: { database_id: this.databaseIds.recipes },
              properties: pageProperties,
              children: pageContent
            }
          }
        });
        return response.id;
      }
    } catch (error) {
      console.error('Error syncing recipe to Notion:', error);
      throw error;
    }
  }

  /**
   * Find recipe in Notion by name
   * @param {string} recipeName - Recipe name to search for
   * @returns {Promise<Object|null>} Found page or null
   */
  async findRecipeInNotion(recipeName) {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'query_database',
          arguments: {
            database_id: this.databaseIds.recipes,
            filter: {
              property: 'Name',
              title: { equals: recipeName }
            }
          }
        }
      });

      return response.results && response.results.length > 0 ? response.results[0] : null;
    } catch (error) {
      console.error('Error finding recipe in Notion:', error);
      return null;
    }
  }

  /**
   * Build recipe properties for Notion
   * @param {Object} recipe - Recipe object
   * @returns {Object} Notion properties
   */
  buildRecipeProperties(recipe) {
    const properties = {
      'Name': { title: [{ type: 'text', text: { content: recipe.name } }] },
      'Category': { select: { name: recipe.category || 'Cocktail' } },
      'Flavor Profile': { select: { name: recipe.flavorProfile || 'Balanced' } },
      'Alcohol Content': { select: { name: recipe.alcoholContent || 'Alcoholic' } },
      'Servings': { number: recipe.servings || 1 }
    };

    if (recipe.prepTime) {
      properties['Prep Time'] = { number: recipe.prepTime };
    }

    if (recipe.glassType) {
      properties['Glass Type'] = { select: { name: recipe.glassType } };
    }

    if (recipe.garnish) {
      properties['Garnish'] = { rich_text: [{ type: 'text', text: { content: recipe.garnish } }] };
    }

    if (recipe.source) {
      properties['Source'] = { url: recipe.source };
    }

    if (recipe.tags && recipe.tags.length > 0) {
      properties['Tags'] = {
        multi_select: recipe.tags.map(tag => ({ name: tag }))
      };
    }

    if (recipe.notes) {
      properties['Notes'] = { rich_text: [{ type: 'text', text: { content: recipe.notes } }] };
    }

    return properties;
  }

  /**
   * Build recipe content blocks for Notion
   * @param {Object} recipe - Recipe object
   * @returns {Object[]} Notion content blocks
   */
  buildRecipeContent(recipe) {
    const blocks = [];

    // Instructions section
    if (recipe.instructions) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Instructions' } }]
        }
      });

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: recipe.instructions } }]
        }
      });
    }

    // Ingredients section
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Ingredients' } }]
        }
      });

      const _ingredientsList = {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: []
        }
      };

      recipe.ingredients.forEach(ingredient => {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              type: 'text',
              text: { content: `${ingredient.amount} ${ingredient.unit} ${ingredient.name}` }
            }]
          }
        });
      });
    }

    // Equipment section (if available)
    if (recipe.equipment && recipe.equipment.length > 0) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Equipment' } }]
        }
      });

      recipe.equipment.forEach(item => {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: item } }]
          }
        });
      });
    }

    // Tips section (if available)
    if (recipe.tips) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Tips' } }]
        }
      });

      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [{ type: 'text', text: { content: recipe.tips } }],
          icon: { emoji: '💡' }
        }
      });
    }

    return blocks;
  }

  /**
   * Create training material in Notion
   * @param {Object} trainingData - Training material data
   * @returns {Promise<string>} Notion page ID
   */
  async createTrainingMaterial(trainingData) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const properties = {
        'Title': { title: [{ type: 'text', text: { content: trainingData.title } }] },
        'Type': { select: { name: trainingData.type || 'Recipe Guide' } },
        'Difficulty Level': { select: { name: trainingData.difficulty || 'Beginner' } }
      };

      if (trainingData.videoUrl) {
        properties['Video URL'] = { url: trainingData.videoUrl };
      }

      if (trainingData.tags && trainingData.tags.length > 0) {
        properties['Tags'] = {
          multi_select: trainingData.tags.map(tag => ({ name: tag }))
        };
      }

      const contentBlocks = this.buildTrainingContent(trainingData);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'create_page',
          arguments: {
            parent: { database_id: this.databaseIds.training },
            properties,
            children: contentBlocks
          }
        }
      });

      return response.id;
    } catch (error) {
      console.error('Error creating training material:', error);
      throw error;
    }
  }

  /**
   * Build training content blocks
   * @param {Object} trainingData - Training data
   * @returns {Object[]} Content blocks
   */
  buildTrainingContent(trainingData) {
    const blocks = [];

    if (trainingData.overview) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: trainingData.overview } }]
        }
      });
    }

    if (trainingData.steps && trainingData.steps.length > 0) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Steps' } }]
        }
      });

      trainingData.steps.forEach((step, _index) => {
        blocks.push({
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: step } }]
          }
        });
      });
    }

    if (trainingData.tips && trainingData.tips.length > 0) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Tips' } }]
        }
      });

      trainingData.tips.forEach(tip => {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: tip } }]
          }
        });
      });
    }

    return blocks;
  }

  /**
   * Get recipes from Notion
   * @param {Object} filters - Query filters
   * @returns {Promise<Object[]>} Recipes from Notion
   */
  async getRecipesFromNotion(filters = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const queryArgs = {
        database_id: this.databaseIds.recipes
      };

      if (filters.category) {
        queryArgs.filter = {
          property: 'Category',
          select: { equals: filters.category }
        };
      }

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'query_database',
          arguments: queryArgs
        }
      });

      return response.results || [];
    } catch (error) {
      console.error('Error getting recipes from Notion:', error);
      return [];
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const mcpNotionService = new MCPNotionService();
