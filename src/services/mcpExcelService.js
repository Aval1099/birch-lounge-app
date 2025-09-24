/**
 * MCP Excel Service for Bulk Recipe Operations
 * Integrates with Excel MCP server for import/export functionality
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { createRecipe, createIngredient } from '../models/index.js';

class MCPExcelService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.allowedPaths = [
      './data/imports',
      './data/exports',
      './data/templates'
    ];
  }

  /**
   * Initialize MCP Excel connection
   */
  async initialize() {
    try {
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@haris-musa/excel-server'],
        env: {
          ...process.env,
          MCP_ALLOWED_PATHS: this.allowedPaths.join(',')
        }
      });

      this.client = new Client({
        name: 'birch-lounge-excel',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      console.warn('MCP Excel Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP Excel Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Export recipes to Excel file
   * @param {Object[]} recipes - Array of recipes to export
   * @param {string} filename - Output filename
   * @param {Object} options - Export options
   * @returns {Promise<string>} File path of exported file
   */
  async exportRecipes(recipes, filename = 'recipes_export.xlsx', options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      // Prepare recipe data for Excel export
      const excelData = this.prepareRecipeDataForExport(recipes, options);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'write_excel',
          arguments: {
            file_path: `./data/exports/${filename}`,
            data: excelData,
            sheet_name: 'Recipes'
          }
        }
      });

      return response.file_path;
    } catch (error) {
      console.error('Error exporting recipes to Excel:', error);
      throw error;
    }
  }

  /**
   * Import recipes from Excel file
   * @param {string} filePath - Path to Excel file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importRecipes(filePath, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'read_excel',
          arguments: {
            file_path: filePath,
            sheet_name: options.sheetName || 'Recipes'
          }
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid Excel data format');
      }

      // Process imported data
      const importResults = await this.processImportedRecipeData(response.data, options);

      return importResults;
    } catch (error) {
      console.error('Error importing recipes from Excel:', error);
      throw error;
    }
  }

  /**
   * Export ingredients to Excel file
   * @param {Object[]} ingredients - Array of ingredients to export
   * @param {string} filename - Output filename
   * @returns {Promise<string>} File path of exported file
   */
  async exportIngredients(ingredients, filename = 'ingredients_export.xlsx') {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const excelData = ingredients.map(ingredient => ({
        'Name': ingredient.name,
        'Category': ingredient.category,
        'Unit': ingredient.unit,
        'Cost per Unit': ingredient.costPerUnit || 0,
        'Current Stock': ingredient.currentStock || 0,
        'Low Stock Threshold': ingredient.lowStockThreshold || 0,
        'Supplier': ingredient.supplier || '',
        'Supplier SKU': ingredient.supplierSku || '',
        'Notes': ingredient.notes || '',
        'Last Updated': ingredient.updatedAt || new Date().toISOString()
      }));

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'write_excel',
          arguments: {
            file_path: `./data/exports/${filename}`,
            data: excelData,
            sheet_name: 'Ingredients'
          }
        }
      });

      return response.file_path;
    } catch (error) {
      console.error('Error exporting ingredients to Excel:', error);
      throw error;
    }
  }

  /**
   * Import ingredients from Excel file
   * @param {string} filePath - Path to Excel file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importIngredients(filePath, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'read_excel',
          arguments: {
            file_path: filePath,
            sheet_name: options.sheetName || 'Ingredients'
          }
        }
      });

      const importResults = await this.processImportedIngredientData(response.data, options);

      return importResults;
    } catch (error) {
      console.error('Error importing ingredients from Excel:', error);
      throw error;
    }
  }

  /**
   * Create recipe import template
   * @param {string} filename - Template filename
   * @returns {Promise<string>} File path of template
   */
  async createRecipeTemplate(filename = 'recipe_import_template.xlsx') {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const templateData = [
        {
          'Recipe Name': 'Example Margarita',
          'Category': 'Cocktail',
          'Flavor Profile': 'citrusy',
          'Alcohol Content': 'alcoholic',
          'Prep Time (minutes)': 5,
          'Servings': 1,
          'Instructions': 'Shake with ice, strain into glass',
          'Ingredients': 'Tequila:2:oz;Lime Juice:1:oz;Triple Sec:0.5:oz',
          'Garnish': 'Lime wheel',
          'Glass Type': 'Margarita glass',
          'Notes': 'Classic cocktail recipe',
          'Source': 'Traditional',
          'Tags': 'classic,citrus,tequila'
        }
      ];

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'write_excel',
          arguments: {
            file_path: `./data/templates/${filename}`,
            data: templateData,
            sheet_name: 'Recipe Template'
          }
        }
      });

      return response.file_path;
    } catch (error) {
      console.error('Error creating recipe template:', error);
      throw error;
    }
  }

  /**
   * Prepare recipe data for Excel export
   * @param {Object[]} recipes - Recipes to export
   * @param {Object} options - Export options
   * @returns {Object[]} Excel-formatted data
   */
  prepareRecipeDataForExport(recipes, options = {}) {
    return recipes.map(recipe => {
      const baseData = {
        'Recipe Name': recipe.name,
        'Category': recipe.category,
        'Flavor Profile': recipe.flavorProfile,
        'Alcohol Content': recipe.alcoholContent,
        'Prep Time (minutes)': recipe.prepTime || '',
        'Servings': recipe.servings || 1,
        'Instructions': recipe.instructions,
        'Garnish': recipe.garnish || '',
        'Glass Type': recipe.glassType || '',
        'Notes': recipe.notes || '',
        'Source': recipe.source || '',
        'Tags': recipe.tags ? recipe.tags.join(',') : '',
        'Created At': recipe.createdAt || '',
        'Updated At': recipe.updatedAt || ''
      };

      // Format ingredients as semicolon-separated string
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        baseData['Ingredients'] = recipe.ingredients
          .map(ing => `${ing.name}:${ing.amount}:${ing.unit}`)
          .join(';');
      }

      // Add cost information if requested
      if (options.includeCosts) {
        baseData['Estimated Cost'] = this.calculateRecipeCost(recipe.ingredients);
      }

      // Add nutritional info if available
      if (options.includeNutrition && recipe.nutrition) {
        baseData['Calories'] = recipe.nutrition.calories || '';
        baseData['ABV'] = recipe.nutrition.abv || '';
      }

      return baseData;
    });
  }

  /**
   * Process imported recipe data from Excel
   * @param {Object[]} data - Raw Excel data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processImportedRecipeData(data, options = {}) {
    const results = {
      successful: [],
      failed: [],
      duplicates: [],
      summary: {
        total: data.length,
        imported: 0,
        failed: 0,
        duplicates: 0
      }
    };

    for (const row of data) {
      try {
        // Skip header row or empty rows
        if (!row['Recipe Name'] || row['Recipe Name'] === 'Recipe Name') {
          continue;
        }

        // Parse ingredients from string format
        const ingredients = this.parseIngredientsFromString(row['Ingredients'] || '');

        // Create recipe object
        const recipeData = {
          name: row['Recipe Name'],
          category: row['Category'] || 'Cocktail',
          flavorProfile: row['Flavor Profile'] || 'balanced',
          alcoholContent: row['Alcohol Content'] || 'alcoholic',
          prepTime: parseInt(row['Prep Time (minutes)']) || null,
          servings: parseInt(row['Servings']) || 1,
          instructions: row['Instructions'] || '',
          ingredients,
          garnish: row['Garnish'] || '',
          glassType: row['Glass Type'] || '',
          notes: row['Notes'] || '',
          source: row['Source'] || 'Excel Import',
          tags: row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [],
          importedAt: new Date().toISOString()
        };

        // Validate recipe data
        const validatedRecipe = createRecipe(recipeData);

        if (validatedRecipe) {
          // Check for duplicates if requested
          if (options.checkDuplicates && this.isDuplicateRecipe(validatedRecipe, options.existingRecipes)) {
            results.duplicates.push({
              recipe: validatedRecipe,
              reason: 'Recipe with same name already exists'
            });
            results.summary.duplicates++;
          } else {
            results.successful.push(validatedRecipe);
            results.summary.imported++;
          }
        } else {
          throw new Error('Recipe validation failed');
        }

      } catch (error) {
        results.failed.push({
          row,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Process imported ingredient data from Excel
   * @param {Object[]} data - Raw Excel data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processImportedIngredientData(data, _options = {}) {
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: data.length,
        imported: 0,
        failed: 0
      }
    };

    for (const row of data) {
      try {
        if (!row['Name'] || row['Name'] === 'Name') {
          continue;
        }

        const ingredientData = {
          name: row['Name'],
          category: row['Category'] || 'Other',
          unit: row['Unit'] || 'oz',
          costPerUnit: parseFloat(row['Cost per Unit']) || 0,
          currentStock: parseFloat(row['Current Stock']) || 0,
          lowStockThreshold: parseFloat(row['Low Stock Threshold']) || 0,
          supplier: row['Supplier'] || '',
          supplierSku: row['Supplier SKU'] || '',
          notes: row['Notes'] || '',
          importedAt: new Date().toISOString()
        };

        const validatedIngredient = createIngredient(ingredientData);

        if (validatedIngredient) {
          results.successful.push(validatedIngredient);
          results.summary.imported++;
        } else {
          throw new Error('Ingredient validation failed');
        }

      } catch (error) {
        results.failed.push({
          row,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Parse ingredients from semicolon-separated string
   * @param {string} ingredientsString - Formatted ingredients string
   * @returns {Object[]} Parsed ingredients array
   */
  parseIngredientsFromString(ingredientsString) {
    if (!ingredientsString) return [];

    return ingredientsString
      .split(';')
      .map(ingredientStr => {
        const parts = ingredientStr.split(':');
        if (parts.length >= 3) {
          return {
            name: parts[0].trim(),
            amount: parseFloat(parts[1]) || 0,
            unit: parts[2].trim()
          };
        }
        return null;
      })
      .filter(ingredient => ingredient !== null);
  }

  /**
   * Check if recipe is duplicate
   * @param {Object} recipe - Recipe to check
   * @param {Object[]} existingRecipes - Existing recipes to compare against
   * @returns {boolean} Is duplicate
   */
  isDuplicateRecipe(recipe, existingRecipes = []) {
    return existingRecipes.some(existing =>
      existing.name.toLowerCase() === recipe.name.toLowerCase()
    );
  }

  /**
   * Calculate recipe cost
   * @param {Object[]} ingredients - Recipe ingredients
   * @returns {number} Total cost
   */
  calculateRecipeCost(ingredients = []) {
    return ingredients.reduce((total, ingredient) => {
      const cost = (ingredient.amount || 0) * (ingredient.costPerUnit || 0);
      return total + cost;
    }, 0);
  }

  /**
   * Get list of available Excel files
   * @param {string} directory - Directory to scan
   * @returns {Promise<string[]>} List of Excel files
   */
  async listExcelFiles(directory = './data/imports') {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'list_files',
          arguments: {
            directory,
            extension: '.xlsx'
          }
        }
      });

      return response.files || [];
    } catch (error) {
      console.error('Error listing Excel files:', error);
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
export const mcpExcelService = new MCPExcelService();
