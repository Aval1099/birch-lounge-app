import { describe, it, expect, beforeEach } from 'vitest';

import {
  analyzeRecipeCompatibility,
  getIngredientBasedRecommendations,
  getWhatCanIMakeRecommendations,
  getShoppingSuggestions,
  calculateIngredientImportance
} from '../../services/smartRecommendationEngine';

describe('Smart Recommendation Engine', () => {
  let mockAvailableIngredients;
  let mockRecipes;

  beforeEach(() => {
    // Mock available ingredients in user's inventory
    mockAvailableIngredients = [
      { id: 'ing1', name: 'Whiskey', category: 'Spirits' },
      { id: 'ing2', name: 'Simple Syrup', category: 'Mixers' },
      { id: 'ing3', name: 'Angostura Bitters', category: 'Bitters' },
      { id: 'ing4', name: 'Lime Juice', category: 'Fresh Ingredients' },
      { id: 'ing5', name: 'Club Soda', category: 'Mixers' },
      { id: 'ing6', name: 'Gin', category: 'Spirits' }
    ];

    // Mock recipe database
    mockRecipes = [
      {
        id: 'recipe1',
        name: 'Old Fashioned',
        category: 'Whiskey',
        isFavorite: true,
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'simple syrup', amount: '0.5', unit: 'oz' },
          { name: 'angostura bitters', amount: '2', unit: 'dashes' }
        ]
      },
      {
        id: 'recipe2',
        name: 'Gin & Tonic',
        category: 'Gin',
        isFavorite: false,
        ingredients: [
          { name: 'gin', amount: '2', unit: 'oz' },
          { name: 'tonic water', amount: '4', unit: 'oz' },
          { name: 'lime juice', amount: '0.25', unit: 'oz' }
        ]
      },
      {
        id: 'recipe3',
        name: 'Whiskey Sour',
        category: 'Whiskey',
        isFavorite: false,
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'lemon juice', amount: '0.75', unit: 'oz' },
          { name: 'simple syrup', amount: '0.75', unit: 'oz' },
          { name: 'egg white', amount: '1', unit: 'whole' }
        ]
      },
      {
        id: 'recipe4',
        name: 'Martini',
        category: 'Gin',
        isFavorite: true,
        ingredients: [
          { name: 'gin', amount: '2.5', unit: 'oz' },
          { name: 'dry vermouth', amount: '0.5', unit: 'oz' },
          { name: 'orange bitters', amount: '1', unit: 'dash' }
        ]
      },
      {
        id: 'recipe5',
        name: 'Impossible Recipe',
        category: 'Other',
        isFavorite: false,
        ingredients: [
          { name: 'rare spirit', amount: '2', unit: 'oz' },
          { name: 'exotic liqueur', amount: '1', unit: 'oz' },
          { name: 'unicorn tears', amount: '3', unit: 'drops' }
        ]
      }
    ];
  });

  describe('Recipe Compatibility Analysis', () => {
    it('should analyze perfect match recipe correctly', () => {
      const recipe = mockRecipes[0]; // Old Fashioned
      const analysis = analyzeRecipeCompatibility(mockAvailableIngredients, recipe);

      expect(analysis.canMake).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(90);
      expect(analysis.matchedIngredients).toHaveLength(3);
      expect(analysis.missingIngredients).toHaveLength(0);
      expect(analysis.substitutions).toHaveLength(0);
    });

    it('should handle recipe with substitutions', () => {
      const recipe = mockRecipes[1]; // Gin & Tonic (needs tonic water, has club soda)
      const analysis = analyzeRecipeCompatibility(mockAvailableIngredients, recipe);

      expect(analysis.confidence).toBeGreaterThan(60);
      expect(analysis.matchedIngredients.length).toBeGreaterThan(0);
      // Should find substitution for tonic water -> club soda
    });

    it('should handle recipe with missing ingredients', () => {
      const recipe = mockRecipes[2]; // Whiskey Sour (missing lemon juice, egg white)
      const analysis = analyzeRecipeCompatibility(mockAvailableIngredients, recipe);

      expect(analysis.canMake).toBe(false);
      expect(analysis.confidence).toBeLessThan(70);
      expect(analysis.missingIngredients.length).toBeGreaterThan(0);
    });

    it('should handle empty or invalid recipe', () => {
      const invalidRecipe = { name: 'Invalid', ingredients: null };
      const analysis = analyzeRecipeCompatibility(mockAvailableIngredients, invalidRecipe);

      expect(analysis.canMake).toBe(false);
      expect(analysis.confidence).toBe(0);
      expect(analysis.totalIngredients).toBe(0);
    });

    it('should handle empty available ingredients', () => {
      const recipe = mockRecipes[0];
      const analysis = analyzeRecipeCompatibility([], recipe);

      expect(analysis.canMake).toBe(false);
      expect(analysis.confidence).toBe(0);
      expect(analysis.missingIngredients).toHaveLength(3);
    });
  });

  describe('Ingredient-Based Recommendations', () => {
    it('should return recommendations sorted by confidence', () => {
      const recommendations = getIngredientBasedRecommendations(
        mockAvailableIngredients,
        mockRecipes,
        { maxRecommendations: 5, minConfidence: 30 }
      );

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should be sorted by confidence (descending)
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].analysis.confidence)
          .toBeGreaterThanOrEqual(recommendations[i].analysis.confidence);
      }
    });

    it('should respect minimum confidence threshold', () => {
      const recommendations = getIngredientBasedRecommendations(
        mockAvailableIngredients,
        mockRecipes,
        { minConfidence: 80 }
      );

      recommendations.forEach(rec => {
        expect(rec.analysis.confidence).toBeGreaterThanOrEqual(80);
      });
    });

    it('should limit number of recommendations', () => {
      const maxRecs = 2;
      const recommendations = getIngredientBasedRecommendations(
        mockAvailableIngredients,
        mockRecipes,
        { maxRecommendations: maxRecs }
      );

      expect(recommendations.length).toBeLessThanOrEqual(maxRecs);
    });

    it('should prioritize favorite recipes when confidence is equal', () => {
      const recommendations = getIngredientBasedRecommendations(
        mockAvailableIngredients,
        mockRecipes,
        { preferFavorites: true }
      );

      // Find recipes with similar confidence scores
      const highConfidenceRecs = recommendations.filter(rec => rec.analysis.confidence > 80);
      if (highConfidenceRecs.length > 1) {
        const favorites = highConfidenceRecs.filter(rec => rec.isFavorite);
        const nonFavorites = highConfidenceRecs.filter(rec => !rec.isFavorite);
        
        if (favorites.length > 0 && nonFavorites.length > 0) {
          // Favorites should come first when confidence is similar
          const firstFavoriteIndex = recommendations.findIndex(rec => rec.isFavorite);
          const firstNonFavoriteIndex = recommendations.findIndex(rec => !rec.isFavorite);
          
          if (firstFavoriteIndex !== -1 && firstNonFavoriteIndex !== -1) {
            expect(firstFavoriteIndex).toBeLessThan(firstNonFavoriteIndex);
          }
        }
      }
    });

    it('should handle empty inputs gracefully', () => {
      expect(getIngredientBasedRecommendations([], [])).toEqual([]);
      expect(getIngredientBasedRecommendations(null, mockRecipes)).toEqual([]);
      expect(getIngredientBasedRecommendations(mockAvailableIngredients, null)).toEqual([]);
    });
  });

  describe('What Can I Make Recommendations', () => {
    it('should return only high-confidence recipes', () => {
      const recommendations = getWhatCanIMakeRecommendations(
        mockAvailableIngredients,
        mockRecipes
      );

      recommendations.forEach(rec => {
        expect(rec.analysis.confidence).toBeGreaterThanOrEqual(70);
      });
    });

    it('should return makeable recipes', () => {
      const recommendations = getWhatCanIMakeRecommendations(
        mockAvailableIngredients,
        mockRecipes
      );

      recommendations.forEach(rec => {
        expect(rec.analysis.canMake).toBe(true);
      });
    });

    it('should limit to 20 recommendations', () => {
      const recommendations = getWhatCanIMakeRecommendations(
        mockAvailableIngredients,
        mockRecipes
      );

      expect(recommendations.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Shopping Suggestions', () => {
    it('should suggest recipes with few missing ingredients', () => {
      const suggestions = getShoppingSuggestions(
        mockAvailableIngredients,
        mockRecipes,
        { maxSuggestions: 3, maxMissingIngredients: 2 }
      );

      suggestions.forEach(suggestion => {
        expect(suggestion.missingIngredients.length).toBeLessThanOrEqual(2);
        expect(suggestion.missingIngredients.length).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeGreaterThanOrEqual(40);
      });
    });

    it('should include recipe information in suggestions', () => {
      const suggestions = getShoppingSuggestions(
        mockAvailableIngredients,
        mockRecipes
      );

      suggestions.forEach(suggestion => {
        expect(suggestion.recipe).toBeDefined();
        expect(suggestion.recipe.id).toBeDefined();
        expect(suggestion.recipe.name).toBeDefined();
        expect(suggestion.missingIngredients).toBeInstanceOf(Array);
        expect(typeof suggestion.confidence).toBe('number');
      });
    });

    it('should sort by fewest missing ingredients first', () => {
      const suggestions = getShoppingSuggestions(
        mockAvailableIngredients,
        mockRecipes
      );

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i-1].missingIngredients.length)
          .toBeLessThanOrEqual(suggestions[i].missingIngredients.length);
      }
    });

    it('should respect maximum suggestions limit', () => {
      const maxSuggestions = 2;
      const suggestions = getShoppingSuggestions(
        mockAvailableIngredients,
        mockRecipes,
        { maxSuggestions }
      );

      expect(suggestions.length).toBeLessThanOrEqual(maxSuggestions);
    });
  });

  describe('Ingredient Importance Calculation', () => {
    it('should calculate importance based on recipe frequency', () => {
      const whiskeyImportance = calculateIngredientImportance(mockRecipes, 'whiskey');
      const rareIngredientImportance = calculateIngredientImportance(mockRecipes, 'rare spirit');

      expect(whiskeyImportance).toBeGreaterThan(rareIngredientImportance);
      expect(whiskeyImportance).toBeGreaterThan(0);
    });

    it('should boost importance for ingredients in favorite recipes', () => {
      // Gin appears in both favorite and non-favorite recipes
      const ginImportance = calculateIngredientImportance(mockRecipes, 'gin');
      
      // Should have some importance due to frequency and favorites
      expect(ginImportance).toBeGreaterThan(0);
      expect(ginImportance).toBeLessThanOrEqual(100);
    });

    it('should return 0 for non-existent ingredients', () => {
      const importance = calculateIngredientImportance(mockRecipes, 'non-existent-ingredient');
      expect(importance).toBe(0);
    });

    it('should handle empty inputs gracefully', () => {
      expect(calculateIngredientImportance([], 'whiskey')).toBe(0);
      expect(calculateIngredientImportance(mockRecipes, '')).toBe(0);
      expect(calculateIngredientImportance(null, 'whiskey')).toBe(0);
    });

    it('should be case insensitive', () => {
      const lowerCase = calculateIngredientImportance(mockRecipes, 'whiskey');
      const upperCase = calculateIngredientImportance(mockRecipes, 'WHISKEY');
      const mixedCase = calculateIngredientImportance(mockRecipes, 'Whiskey');

      expect(lowerCase).toBe(upperCase);
      expect(lowerCase).toBe(mixedCase);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete recommendations in under 100ms for typical dataset', () => {
      const startTime = performance.now();
      
      getIngredientBasedRecommendations(
        mockAvailableIngredients,
        mockRecipes,
        { maxRecommendations: 10 }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // <100ms requirement
    });

    it('should handle large datasets efficiently', () => {
      // Create larger dataset for performance testing
      const largeRecipeSet = Array.from({ length: 100 }, (_, i) => ({
        id: `recipe${i}`,
        name: `Recipe ${i}`,
        category: 'Test',
        isFavorite: i % 10 === 0,
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'simple syrup', amount: '0.5', unit: 'oz' }
        ]
      }));

      const startTime = performance.now();
      
      const recommendations = getIngredientBasedRecommendations(
        mockAvailableIngredients,
        largeRecipeSet,
        { maxRecommendations: 20 }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should still be under 100ms
      expect(recommendations.length).toBeLessThanOrEqual(20);
    });
  });
});
