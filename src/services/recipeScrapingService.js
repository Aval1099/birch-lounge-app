/**
 * Recipe Scraping Service with Versioning Support
 * Handles AI-powered recipe scraping while preserving existing versions
 */

import { createSourceVersion, findExistingSourceVersion } from '../models/index';
import { generateId } from '../utils';

import { recipeVersionService } from './recipeVersionService';

class RecipeScrapingService {
  constructor() {
    this.scrapingHistory = new Map();
  }

  /**
   * Import a scraped recipe with proper versioning
   * @param {Object} scrapedRecipe - Recipe data from scraping
   * @param {Object} sourceInfo - Source attribution information
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result with version information
   */
  async importScrapedRecipe(scrapedRecipe, sourceInfo, options = {}) {
    try {
      const {
        overwriteExisting = false,
        setAsMain = false,
        mergeWithExisting = false
      } = options;

      // Check if we already have versions of this recipe
      const existingFamily = await this.findExistingRecipeFamily(scrapedRecipe.name);

      if (existingFamily) {
        return await this.handleExistingRecipeFamily(
          scrapedRecipe,
          sourceInfo,
          existingFamily,
          { overwriteExisting, setAsMain, mergeWithExisting }
        );
      } else {
        return await this.createNewRecipeFamily(scrapedRecipe, sourceInfo);
      }
    } catch (error) {
      console.error('Error importing scraped recipe:', error);
      throw new Error(`Failed to import recipe: ${error.message}`);
    }
  }

  /**
   * Handle importing when recipe family already exists
   */
  async handleExistingRecipeFamily(scrapedRecipe, sourceInfo, existingFamily, options) {
    const { overwriteExisting, setAsMain } = options;

    // Check if we already have a version from this source
    const existingSourceVersion = findExistingSourceVersion(
      existingFamily.versions,
      sourceInfo.sourceName
    );

    if (existingSourceVersion && !overwriteExisting) {
      return {
        success: false,
        reason: 'source_version_exists',
        message: `A version from ${sourceInfo.sourceName} already exists`,
        existingVersion: existingSourceVersion,
        suggestedActions: [
          'overwrite_existing',
          'create_variation',
          'merge_changes'
        ]
      };
    }

    // Create new source version
    const sourceVersion = createSourceVersion(scrapedRecipe, {
      ...sourceInfo,
      confidence: sourceInfo.confidence || 0.8
    });

    // Set recipe family
    sourceVersion.recipeFamily = existingFamily.familyId;

    if (existingSourceVersion && overwriteExisting) {
      // Update existing source version
      const updatedVersion = await recipeVersionService.updateVersion(
        existingSourceVersion.id,
        sourceVersion
      );

      if (setAsMain) {
        await recipeVersionService.setMainVersion(updatedVersion.id);
      }

      return {
        success: true,
        action: 'updated_existing',
        version: updatedVersion,
        family: existingFamily
      };
    } else {
      // Create new version
      const newVersion = await recipeVersionService.createVersion(
        existingFamily.mainVersion,
        sourceVersion.versionMetadata,
        sourceVersion
      );

      if (setAsMain) {
        await recipeVersionService.setMainVersion(newVersion.id);
      }

      return {
        success: true,
        action: 'created_new_version',
        version: newVersion,
        family: existingFamily
      };
    }
  }

  /**
   * Create new recipe family for scraped recipe
   */
  async createNewRecipeFamily(scrapedRecipe, sourceInfo) {
    const sourceVersion = createSourceVersion(scrapedRecipe, sourceInfo);

    // Generate family ID
    const familyId = generateId('family');
    sourceVersion.recipeFamily = familyId;

    // For new families, the source version can be the main version
    sourceVersion.versionMetadata.isMainVersion = true;

    // Save the recipe
    const savedVersion = await recipeVersionService.saveRecipe(sourceVersion);

    return {
      success: true,
      action: 'created_new_family',
      version: savedVersion,
      family: {
        familyId,
        mainVersion: savedVersion,
        versions: [savedVersion]
      }
    };
  }

  /**
   * Find existing recipe family by name similarity
   */
  async findExistingRecipeFamily(recipeName) {
    try {
      // Get all recipes and group by family
      const allRecipes = await recipeVersionService.getAllRecipes();
      const families = new Map();

      // Group recipes by family
      allRecipes.forEach(recipe => {
        const familyId = recipe.recipeFamily || recipe.id;
        if (!families.has(familyId)) {
          families.set(familyId, {
            familyId,
            versions: [],
            mainVersion: null
          });
        }

        const family = families.get(familyId);
        family.versions.push(recipe);

        if (recipe.versionMetadata?.isMainVersion) {
          family.mainVersion = recipe;
        }
      });

      // Find family with similar recipe name
      for (const family of families.values()) {
        const mainVersion = family.mainVersion || family.versions[0];
        if (this.isRecipeNameSimilar(recipeName, mainVersion.name)) {
          return family;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing recipe family:', error);
      return null;
    }
  }

  /**
   * Check if recipe names are similar enough to be the same recipe
   */
  isRecipeNameSimilar(name1, name2) {
    const normalize = (name) => name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);

    // Exact match
    if (normalized1 === normalized2) return true;

    // Check if one contains the other (for variations like "Old Fashioned" vs "Classic Old Fashioned")
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }

    // Simple word overlap check
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));

    // If most words match, consider it similar
    return commonWords.length >= Math.min(words1.length, words2.length) * 0.7;
  }

  /**
   * Batch import multiple scraped recipes
   */
  async batchImportRecipes(scrapedRecipes, defaultSourceInfo, options = {}) {
    const results = [];

    for (const recipe of scrapedRecipes) {
      try {
        const sourceInfo = recipe.sourceInfo || defaultSourceInfo;
        const result = await this.importScrapedRecipe(recipe, sourceInfo, options);
        results.push({
          recipe: recipe.name,
          ...result
        });
      } catch (error) {
        results.push({
          recipe: recipe.name,
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: scrapedRecipes.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get import suggestions for a scraped recipe
   */
  async getImportSuggestions(scrapedRecipe, sourceInfo) {
    const existingFamily = await this.findExistingRecipeFamily(scrapedRecipe.name);

    if (!existingFamily) {
      return {
        action: 'create_new',
        message: 'This appears to be a new recipe',
        options: ['create_new_family']
      };
    }

    const existingSourceVersion = findExistingSourceVersion(
      existingFamily.versions,
      sourceInfo.sourceName
    );

    if (existingSourceVersion) {
      return {
        action: 'source_exists',
        message: `A version from ${sourceInfo.sourceName} already exists`,
        existingVersion: existingSourceVersion,
        options: [
          'overwrite_existing',
          'create_variation',
          'skip_import'
        ]
      };
    }

    return {
      action: 'add_version',
      message: `Add as new version to existing recipe family`,
      existingFamily,
      options: [
        'add_as_source_version',
        'add_as_variation',
        'set_as_main_version'
      ]
    };
  }

  /**
   * Preview what would happen during import
   */
  async previewImport(scrapedRecipe, sourceInfo) {
    const suggestions = await this.getImportSuggestions(scrapedRecipe, sourceInfo);

    return {
      recipeName: scrapedRecipe.name,
      sourceInfo,
      suggestions,
      wouldCreate: suggestions.action === 'create_new',
      wouldUpdate: suggestions.action === 'source_exists',
      wouldAddVersion: suggestions.action === 'add_version'
    };
  }
}

// Export singleton instance
export const recipeScrapingService = new RecipeScrapingService();
export default recipeScrapingService;
