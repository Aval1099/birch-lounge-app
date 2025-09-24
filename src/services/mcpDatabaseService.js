/**
 * MCP Database Service for Advanced Recipe Analytics
 * Integrates with PostgreSQL MCP server for complex queries and analytics
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class MCPDatabaseService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.dbConfig = {
      host: process.env.VITE_DB_HOST || 'localhost',
      port: process.env.VITE_DB_PORT || 5432,
      database: process.env.VITE_DB_NAME || 'birch_lounge',
      user: process.env.VITE_DB_USER || 'postgres',
      password: process.env.VITE_DB_PASSWORD || ''
    };
  }

  /**
   * Initialize MCP Database connection
   */
  async initialize() {
    try {
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@modelcontextprotocol/server-postgresql'],
        env: {
          ...process.env,
          DATABASE_URL: this.buildConnectionString()
        }
      });

      this.client = new Client({
        name: 'birch-lounge-database',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      // Initialize database schema if needed
      await this.initializeSchema();

      console.warn('MCP Database Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP Database Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Build database connection string
   * @returns {string} Connection string
   */
  buildConnectionString() {
    const { host, port, database, user, password } = this.dbConfig;
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    const createTablesSQL = `
      -- Recipes table
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        flavor_profile VARCHAR(100),
        alcohol_content VARCHAR(50),
        prep_time INTEGER,
        servings INTEGER DEFAULT 1,
        instructions TEXT,
        garnish VARCHAR(255),
        glass_type VARCHAR(100),
        notes TEXT,
        source VARCHAR(255),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_favorite BOOLEAN DEFAULT FALSE,
        view_count INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMP
      );

      -- Ingredients table
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(100),
        unit VARCHAR(50),
        cost_per_unit DECIMAL(10,2) DEFAULT 0,
        current_stock DECIMAL(10,2) DEFAULT 0,
        low_stock_threshold DECIMAL(10,2) DEFAULT 0,
        supplier VARCHAR(255),
        supplier_sku VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Recipe ingredients junction table
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50),
        notes TEXT,
        UNIQUE(recipe_id, ingredient_id)
      );

      -- Recipe analytics table
      CREATE TABLE IF NOT EXISTS recipe_analytics (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL, -- 'view', 'favorite', 'make', 'share'
        event_data JSONB,
        user_session VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Menu analytics table
      CREATE TABLE IF NOT EXISTS menu_analytics (
        id SERIAL PRIMARY KEY,
        menu_name VARCHAR(255),
        recipe_id INTEGER REFERENCES recipes(id),
        position INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
      CREATE INDEX IF NOT EXISTS idx_recipes_flavor_profile ON recipes(flavor_profile);
      CREATE INDEX IF NOT EXISTS idx_recipes_alcohol_content ON recipes(alcohol_content);
      CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
      CREATE INDEX IF NOT EXISTS idx_recipe_analytics_recipe_id ON recipe_analytics(recipe_id);
      CREATE INDEX IF NOT EXISTS idx_recipe_analytics_event_type ON recipe_analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_recipe_analytics_timestamp ON recipe_analytics(timestamp);
    `;

    await this.executeQuery(createTablesSQL);
  }

  /**
   * Execute SQL query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'query',
          arguments: {
            sql: query,
            params
          }
        }
      });

      return response.result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Sync recipes to database
   * @param {Object[]} recipes - Recipes to sync
   * @returns {Promise<Object>} Sync results
   */
  async syncRecipes(recipes) {
    const results = { inserted: 0, updated: 0, errors: [] };

    for (const recipe of recipes) {
      try {
        // Check if recipe exists
        const existingRecipe = await this.executeQuery(
          'SELECT id FROM recipes WHERE name = $1',
          [recipe.name]
        );

        if (existingRecipe.rows && existingRecipe.rows.length > 0) {
          // Update existing recipe
          await this.updateRecipe(existingRecipe.rows[0].id, recipe);
          results.updated++;
        } else {
          // Insert new recipe
          await this.insertRecipe(recipe);
          results.inserted++;
        }
      } catch (error) {
        results.errors.push({ recipe: recipe.name, error: error.message });
      }
    }

    return results;
  }

  /**
   * Insert new recipe
   * @param {Object} recipe - Recipe to insert
   * @returns {Promise<number>} Recipe ID
   */
  async insertRecipe(recipe) {
    const insertSQL = `
      INSERT INTO recipes (
        name, category, flavor_profile, alcohol_content, prep_time, servings,
        instructions, garnish, glass_type, notes, source, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const result = await this.executeQuery(insertSQL, [
      recipe.name,
      recipe.category,
      recipe.flavorProfile,
      recipe.alcoholContent,
      recipe.prepTime,
      recipe.servings,
      recipe.instructions,
      recipe.garnish,
      recipe.glassType,
      recipe.notes,
      recipe.source,
      recipe.tags || []
    ]);

    const recipeId = result.rows[0].id;

    // Insert recipe ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      await this.insertRecipeIngredients(recipeId, recipe.ingredients);
    }

    return recipeId;
  }

  /**
   * Update existing recipe
   * @param {number} recipeId - Recipe ID
   * @param {Object} recipe - Recipe data
   */
  async updateRecipe(recipeId, recipe) {
    const updateSQL = `
      UPDATE recipes SET
        name = $1, category = $2, flavor_profile = $3, alcohol_content = $4,
        prep_time = $5, servings = $6, instructions = $7, garnish = $8,
        glass_type = $9, notes = $10, source = $11, tags = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
    `;

    await this.executeQuery(updateSQL, [
      recipe.name,
      recipe.category,
      recipe.flavorProfile,
      recipe.alcoholContent,
      recipe.prepTime,
      recipe.servings,
      recipe.instructions,
      recipe.garnish,
      recipe.glassType,
      recipe.notes,
      recipe.source,
      recipe.tags || [],
      recipeId
    ]);

    // Update recipe ingredients
    if (recipe.ingredients) {
      await this.updateRecipeIngredients(recipeId, recipe.ingredients);
    }
  }

  /**
   * Insert recipe ingredients
   * @param {number} recipeId - Recipe ID
   * @param {Object[]} ingredients - Ingredients array
   */
  async insertRecipeIngredients(recipeId, ingredients) {
    // First, ensure all ingredients exist in ingredients table
    for (const ingredient of ingredients) {
      await this.upsertIngredient(ingredient);
    }

    // Then insert recipe-ingredient relationships
    for (const ingredient of ingredients) {
      const ingredientResult = await this.executeQuery(
        'SELECT id FROM ingredients WHERE name = $1',
        [ingredient.name]
      );

      if (ingredientResult.rows && ingredientResult.rows.length > 0) {
        const ingredientId = ingredientResult.rows[0].id;

        await this.executeQuery(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (recipe_id, ingredient_id)
          DO UPDATE SET amount = $3, unit = $4
        `, [recipeId, ingredientId, ingredient.amount, ingredient.unit]);
      }
    }
  }

  /**
   * Update recipe ingredients
   * @param {number} recipeId - Recipe ID
   * @param {Object[]} ingredients - Ingredients array
   */
  async updateRecipeIngredients(recipeId, ingredients) {
    // Delete existing ingredients for this recipe
    await this.executeQuery(
      'DELETE FROM recipe_ingredients WHERE recipe_id = $1',
      [recipeId]
    );

    // Insert updated ingredients
    await this.insertRecipeIngredients(recipeId, ingredients);
  }

  /**
   * Upsert ingredient
   * @param {Object} ingredient - Ingredient data
   */
  async upsertIngredient(ingredient) {
    const upsertSQL = `
      INSERT INTO ingredients (name, category, unit)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO UPDATE SET
        category = COALESCE($2, ingredients.category),
        unit = COALESCE($3, ingredients.unit),
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.executeQuery(upsertSQL, [
      ingredient.name,
      ingredient.category || 'Other',
      ingredient.unit || 'oz'
    ]);
  }

  /**
   * Track recipe analytics event
   * @param {number} recipeId - Recipe ID
   * @param {string} eventType - Event type
   * @param {Object} eventData - Additional event data
   * @param {string} userSession - User session ID
   */
  async trackAnalyticsEvent(recipeId, eventType, eventData = {}, userSession = null) {
    const insertSQL = `
      INSERT INTO recipe_analytics (recipe_id, event_type, event_data, user_session)
      VALUES ($1, $2, $3, $4)
    `;

    await this.executeQuery(insertSQL, [
      recipeId,
      eventType,
      JSON.stringify(eventData),
      userSession
    ]);

    // Update recipe view count if it's a view event
    if (eventType === 'view') {
      await this.executeQuery(`
        UPDATE recipes SET
          view_count = view_count + 1,
          last_viewed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [recipeId]);
    }
  }

  /**
   * Get recipe analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Analytics data
   */
  async getRecipeAnalytics(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      recipeId = null,
      eventType = null
    } = options;

    let whereClause = 'WHERE timestamp >= $1 AND timestamp <= $2';
    const params = [startDate, endDate];

    if (recipeId) {
      whereClause += ' AND recipe_id = $3';
      params.push(recipeId);
    }

    if (eventType) {
      whereClause += ` AND event_type = $${params.length + 1}`;
      params.push(eventType);
    }

    // Get popular recipes
    const popularRecipesSQL = `
      SELECT
        r.id, r.name, r.category, r.view_count,
        COUNT(ra.id) as recent_views
      FROM recipes r
      LEFT JOIN recipe_analytics ra ON r.id = ra.recipe_id
        AND ra.event_type = 'view' ${whereClause.replace('WHERE', 'AND')}
      GROUP BY r.id, r.name, r.category, r.view_count
      ORDER BY recent_views DESC, r.view_count DESC
      LIMIT 10
    `;

    // Get category distribution
    const categoryDistributionSQL = `
      SELECT
        r.category,
        COUNT(ra.id) as event_count
      FROM recipe_analytics ra
      JOIN recipes r ON ra.recipe_id = r.id
      ${whereClause}
      GROUP BY r.category
      ORDER BY event_count DESC
    `;

    // Get daily activity
    const dailyActivitySQL = `
      SELECT
        DATE(timestamp) as date,
        event_type,
        COUNT(*) as count
      FROM recipe_analytics
      ${whereClause}
      GROUP BY DATE(timestamp), event_type
      ORDER BY date DESC
    `;

    const [popularRecipes, categoryDistribution, dailyActivity] = await Promise.all([
      this.executeQuery(popularRecipesSQL, params),
      this.executeQuery(categoryDistributionSQL, params),
      this.executeQuery(dailyActivitySQL, params)
    ]);

    return {
      popularRecipes: popularRecipes.rows || [],
      categoryDistribution: categoryDistribution.rows || [],
      dailyActivity: dailyActivity.rows || [],
      dateRange: { startDate, endDate }
    };
  }

  /**
   * Get ingredient usage analytics
   * @returns {Promise<Object[]>} Ingredient usage data
   */
  async getIngredientUsageAnalytics() {
    const usageSQL = `
      SELECT
        i.name,
        i.category,
        COUNT(ri.recipe_id) as recipe_count,
        AVG(ri.amount) as avg_amount,
        SUM(ri.amount) as total_amount,
        i.unit
      FROM ingredients i
      LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      GROUP BY i.id, i.name, i.category, i.unit
      ORDER BY recipe_count DESC, total_amount DESC
    `;

    const result = await this.executeQuery(usageSQL);
    return result.rows || [];
  }

  /**
   * Get cost analysis
   * @returns {Promise<Object[]>} Cost analysis data
   */
  async getCostAnalysis() {
    const costSQL = `
      SELECT
        r.id,
        r.name,
        r.category,
        SUM(ri.amount * i.cost_per_unit) as estimated_cost,
        COUNT(ri.ingredient_id) as ingredient_count
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE i.cost_per_unit > 0
      GROUP BY r.id, r.name, r.category
      ORDER BY estimated_cost DESC
    `;

    const result = await this.executeQuery(costSQL);
    return result.rows || [];
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
export const mcpDatabaseService = new MCPDatabaseService();
