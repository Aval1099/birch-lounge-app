/**
 * Enhanced Recipe Parser Service Tests
 * Comprehensive testing for intelligent recipe parsing, standardization, and analysis
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { apiKeyService } from '../../services/apiKeyService';
import {
  parseRecipesWithIntelligence,
  standardizeIngredient,
  calculateDifficultyScore,
  estimatePrepTime,
  classifyRecipeCategory,
  calculateABV,
  calculateRecipeQualityScore
} from '../../services/enhancedRecipeParser';
import { geminiService } from '../../services/geminiService';

// Mock dependencies
vi.mock('../../services/geminiService');
vi.mock('../../services/apiKeyService');

describe('Enhanced Recipe Parser Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiKeyService.getApiKey.mockReturnValue('test-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Recipe Parsing with Intelligence', () => {
    it('should parse recipes with enhanced intelligence', async () => {
      const mockRecipes = [
        {
          name: 'Old Fashioned',
          ingredients: [
            { name: 'bourbon whiskey', amount: '2', unit: 'oz' },
            { name: 'simple syrup', amount: '0.5', unit: 'oz' },
            { name: 'angostura bitters', amount: '2', unit: 'dashes' }
          ],
          instructions: 'Stir with ice, strain over large ice cube',
          glassware: 'rocks glass',
          techniques: ['stir', 'strain']
        }
      ];

      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const result = await parseRecipesWithIntelligence('Sample recipe text');

      expect(result.success).toBe(true);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].intelligenceEnhanced).toBe(true);
      expect(result.recipes[0].difficultyScore).toBeDefined();
      expect(result.recipes[0].abv).toBeDefined();
    });

    it('should handle multiple recipe formats', async () => {
      const mockRecipes = [
        {
          name: 'Martini',
          ingredients: [
            { name: 'gin', amount: '2.5', unit: 'oz' },
            { name: 'dry vermouth', amount: '0.5', unit: 'oz' }
          ],
          instructions: 'Stir with ice and strain',
          glassware: 'martini glass'
        },
        {
          name: 'Mojito',
          ingredients: [
            { name: 'white rum', amount: '2', unit: 'oz' },
            { name: 'lime juice', amount: '1', unit: 'oz' },
            { name: 'simple syrup', amount: '0.75', unit: 'oz' },
            { name: 'mint leaves', amount: '8', unit: 'leaves' }
          ],
          instructions: 'Muddle mint, add other ingredients, shake',
          techniques: ['muddle', 'shake']
        }
      ];

      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const result = await parseRecipesWithIntelligence('Multiple recipe formats text');

      expect(result.success).toBe(true);
      expect(result.recipes).toHaveLength(2);
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should handle parsing errors gracefully', async () => {
      geminiService.generate.mockRejectedValue(new Error('API Error'));

      const result = await parseRecipesWithIntelligence('Invalid text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(result.recipes).toEqual([]);
    });

    it('should handle malformed JSON responses', async () => {
      geminiService.generate.mockResolvedValue('Invalid JSON response');

      const result = await parseRecipesWithIntelligence('Sample text');

      expect(result.success).toBe(true);
      expect(result.recipes).toEqual([]);
    });
  });

  describe('Ingredient Standardization', () => {
    it('should standardize ingredient measurements to oz', () => {
      const ingredient = {
        name: 'vodka',
        amount: '30',
        unit: 'ml',
        originalText: '30ml vodka'
      };

      const result = standardizeIngredient(ingredient);

      expect(result.amount).toBe('1.01442'); // 30ml ≈ 1.01442oz
      expect(result.unit).toBe('oz');
      expect(result.standardized).toBe(true);
      expect(result.originalText).toBe('30ml vodka');
    });

    it('should standardize ingredient names', () => {
      const ingredient = {
        name: 'bourbon whiskey',
        amount: '2',
        unit: 'oz'
      };

      const result = standardizeIngredient(ingredient);

      expect(result.name).toBe('whiskey');
      expect(result.standardized).toBe(true);
    });

    it('should handle various unit conversions', () => {
      const testCases = [
        { unit: 'tbsp', amount: '1', expectedOz: '0.5' },
        { unit: 'tsp', amount: '1', expectedOz: '0.16667' },
        { unit: 'dash', amount: '2', expectedOz: '0.0625' },
        { unit: 'cup', amount: '0.5', expectedOz: '4' }
      ];

      testCases.forEach(({ unit, amount, expectedOz }) => {
        const ingredient = { name: 'test', amount, unit };
        const result = standardizeIngredient(ingredient);
        expect(result.amount).toBe(expectedOz);
        expect(result.unit).toBe('oz');
      });
    });

    it('should preserve original text when standardizing', () => {
      const ingredient = {
        name: 'fresh lime juice',
        amount: '1',
        unit: 'oz',
        originalText: '1 oz fresh lime juice'
      };

      const result = standardizeIngredient(ingredient);

      expect(result.name).toBe('lime juice');
      expect(result.originalText).toBe('1 oz fresh lime juice');
    });
  });

  describe('Difficulty Scoring', () => {
    it('should calculate easy difficulty for simple recipes', () => {
      const recipe = {
        ingredients: [
          { name: 'vodka', amount: '2', unit: 'oz' },
          { name: 'orange juice', amount: '4', unit: 'oz' }
        ],
        techniques: ['shake'],
        glassware: 'highball'
      };

      const result = calculateDifficultyScore(recipe);

      expect(result.level).toBe('Easy');
      expect(result.score).toBeLessThan(5);
    });

    it('should calculate medium difficulty for moderate recipes', () => {
      const recipe = {
        ingredients: [
          { name: 'gin', amount: '2', unit: 'oz' },
          { name: 'lime juice', amount: '0.75', unit: 'oz' },
          { name: 'simple syrup', amount: '0.75', unit: 'oz' },
          { name: 'mint', amount: '8', unit: 'leaves' },
          { name: 'soda water', amount: '2', unit: 'oz' }
        ],
        techniques: ['muddle', 'shake', 'strain'],
        glassware: 'coupe'
      };

      const result = calculateDifficultyScore(recipe);

      expect(result.level).toBe('Medium');
      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(result.score).toBeLessThan(7);
    });

    it('should calculate hard difficulty for complex recipes', () => {
      const recipe = {
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'yellow chartreuse', amount: '0.5', unit: 'oz' },
          { name: 'maraschino', amount: '0.25', unit: 'oz' },
          { name: 'lime juice', amount: '0.75', unit: 'oz' },
          { name: 'egg white', amount: '1', unit: 'whole' },
          { name: 'bitters', amount: '2', unit: 'dashes' },
          { name: 'absinthe', amount: '1', unit: 'rinse' },
          { name: 'garnish', amount: '1', unit: 'complex' }
        ],
        techniques: ['clarify', 'foam', 'rinse'],
        glassware: 'absinthe'
      };

      const result = calculateDifficultyScore(recipe);

      expect(result.level).toBe('Hard');
      expect(result.score).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Preparation Time Estimation', () => {
    it('should estimate prep time based on complexity', () => {
      const simpleRecipe = {
        ingredients: [
          { name: 'vodka', amount: '2', unit: 'oz' },
          { name: 'cranberry juice', amount: '4', unit: 'oz' }
        ],
        techniques: ['shake']
      };

      const complexRecipe = {
        ingredients: [
          { name: 'gin', amount: '2', unit: 'oz' },
          { name: 'lime juice', amount: '0.75', unit: 'oz' },
          { name: 'simple syrup', amount: '0.75', unit: 'oz' },
          { name: 'mint', amount: '8', unit: 'leaves' }
        ],
        techniques: ['muddle', 'shake', 'strain', 'float']
      };

      const simpleTime = estimatePrepTime(simpleRecipe);
      const complexTime = estimatePrepTime(complexRecipe);

      expect(simpleTime).toBeLessThan(complexTime);
      expect(simpleTime).toBeGreaterThan(0);
      expect(complexTime).toBeLessThanOrEqual(45); // Cap at 45 minutes
    });

    it('should add time for complex techniques', () => {
      const baseRecipe = {
        ingredients: [{ name: 'vodka', amount: '2', unit: 'oz' }],
        techniques: ['shake']
      };

      const muddleRecipe = {
        ingredients: [{ name: 'vodka', amount: '2', unit: 'oz' }],
        techniques: ['muddle', 'shake']
      };

      const baseTime = estimatePrepTime(baseRecipe);
      const muddleTime = estimatePrepTime(muddleRecipe);

      expect(muddleTime).toBeGreaterThan(baseTime);
    });
  });

  describe('Category Classification', () => {
    it('should classify whiskey-based cocktails', () => {
      const recipe = {
        ingredients: [
          { name: 'bourbon', amount: '2', unit: 'oz' },
          { name: 'simple syrup', amount: '0.5', unit: 'oz' }
        ]
      };

      const category = classifyRecipeCategory(recipe);
      expect(category).toBe('Whiskey');
    });

    it('should classify gin-based cocktails', () => {
      const recipe = {
        ingredients: [
          { name: 'london dry gin', amount: '2', unit: 'oz' },
          { name: 'tonic water', amount: '4', unit: 'oz' }
        ]
      };

      const category = classifyRecipeCategory(recipe);
      expect(category).toBe('Gin');
    });

    it('should handle multiple spirits and choose primary', () => {
      const recipe = {
        ingredients: [
          { name: 'vodka', amount: '1', unit: 'oz' },
          { name: 'rum', amount: '2', unit: 'oz' },
          { name: 'lime juice', amount: '1', unit: 'oz' }
        ]
      };

      const category = classifyRecipeCategory(recipe);
      expect(['Vodka', 'Rum']).toContain(category);
    });

    it('should default to Other for unrecognized spirits', () => {
      const recipe = {
        ingredients: [
          { name: 'unknown spirit', amount: '2', unit: 'oz' },
          { name: 'mixer', amount: '4', unit: 'oz' }
        ]
      };

      const category = classifyRecipeCategory(recipe);
      expect(category).toBe('Other');
    });
  });

  describe('ABV Calculation', () => {
    it('should calculate ABV for spirit-forward cocktails', () => {
      const ingredients = [
        { name: 'vodka', amount: '2', unit: 'oz' },
        { name: 'dry vermouth', amount: '0.5', unit: 'oz' }
      ];

      const abv = calculateABV(ingredients);

      expect(abv).toBeGreaterThan(25);
      expect(abv).toBeLessThan(40);
    });

    it('should calculate ABV for low-alcohol cocktails', () => {
      const ingredients = [
        { name: 'prosecco', amount: '4', unit: 'oz' },
        { name: 'aperol', amount: '1', unit: 'oz' }
      ];

      const abv = calculateABV(ingredients);

      expect(abv).toBeLessThan(15);
    });

    it('should handle non-alcoholic ingredients', () => {
      const ingredients = [
        { name: 'vodka', amount: '2', unit: 'oz' },
        { name: 'orange juice', amount: '4', unit: 'oz' },
        { name: 'cranberry juice', amount: '2', unit: 'oz' }
      ];

      const abv = calculateABV(ingredients);

      expect(abv).toBeGreaterThan(0);
      expect(abv).toBeLessThan(20);
    });

    it('should return 0 for non-alcoholic recipes', () => {
      const ingredients = [
        { name: 'orange juice', amount: '4', unit: 'oz' },
        { name: 'cranberry juice', amount: '2', unit: 'oz' }
      ];

      const abv = calculateABV(ingredients);

      expect(abv).toBe(0);
    });
  });

  describe('Quality Validation', () => {
    it('should validate high-quality recipes', () => {
      const recipe = {
        name: 'Manhattan',
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'sweet vermouth', amount: '1', unit: 'oz' }
        ],
        instructions: 'Stir with ice and strain',
        garnish: 'cherry',
        glassware: 'coupe'
      };

      const qualityScore = calculateRecipeQualityScore(recipe);

      expect(qualityScore).toBe(100); // Perfect score
    });

    it('should penalize incomplete recipes', () => {
      const incompleteRecipe = {
        name: 'Incomplete Recipe',
        ingredients: [
          { name: 'vodka', amount: '2', unit: 'oz' }
        ]
        // Missing instructions
      };

      const qualityScore = calculateRecipeQualityScore(incompleteRecipe);

      expect(qualityScore).toBeLessThan(100);
      expect(qualityScore).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during parsing', async () => {
      const mockRecipes = [{ name: 'Test Recipe', ingredients: [], instructions: 'Test' }];
      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const progressCallback = vi.fn();
      await parseRecipesWithIntelligence('Sample text', progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentChunk: expect.any(Number),
          totalChunks: expect.any(Number),
          progress: expect.any(Number),
          recipesFound: expect.any(Number)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API key errors', async () => {
      apiKeyService.getApiKey.mockReturnValue(null);

      const result = await parseRecipesWithIntelligence('Sample text');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key');
    });

    it('should handle network errors', async () => {
      geminiService.generate.mockRejectedValue(new Error('Network error'));

      const result = await parseRecipesWithIntelligence('Sample text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle empty input gracefully', async () => {
      const result = await parseRecipesWithIntelligence('');

      expect(result.success).toBe(true);
      expect(result.recipes).toEqual([]);
    });
  });
});
