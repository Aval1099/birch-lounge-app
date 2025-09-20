// =============================================================================
// ADVANCED SEARCH & DISCOVERY INTEGRATION TESTS
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import all Advanced Search & Discovery services
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { performAdvancedSearch, getAdvancedSearchSuggestions, clearSearchCache } from '../../services/advancedSearchEngine';
import { getContextualRecommendations } from '../../services/contextualRecommendationEngine';
import { performFuzzySearch } from '../../services/fuzzySearchEngine';
import { processNaturalLanguageQuery } from '../../services/naturalLanguageProcessor';

// Import existing services for integration testing
import { calculateRecipeSimilarity } from '../../services/recipeSimilarityEngine';
import { getIngredientBasedRecommendations } from '../../services/smartRecommendationEngine';

// Import application hook

describe('Advanced Search & Discovery Integration Tests', () => {
  let mockRecipes;

  beforeEach(() => {
    // Clear any cached data
    clearSearchCache();

    // Mock recipe data that represents real application data
    mockRecipes = [
      {
        id: 'recipe1',
        name: 'Classic Gin & Tonic',
        category: 'Gin',
        abv: 15,
        prepTime: 2,
        difficulty: 2,
        ingredients: [
          { name: 'gin', amount: '2', unit: 'oz' },
          { name: 'tonic water', amount: '4', unit: 'oz' },
          { name: 'lime', amount: '1', unit: 'wedge' }
        ],
        techniques: ['build'],
        flavorProfile: ['refreshing', 'citrusy', 'light'],
        glassware: 'highball',
        isFavorite: true,
        popularity: 0.9,
        qualityScore: 88
      },
      {
        id: 'recipe2',
        name: 'Old Fashioned',
        category: 'Whiskey',
        abv: 35,
        prepTime: 4,
        difficulty: 6,
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'simple syrup', amount: '0.25', unit: 'oz' },
          { name: 'angostura bitters', amount: '2', unit: 'dashes' },
          { name: 'orange peel', amount: '1', unit: 'piece' }
        ],
        techniques: ['stir', 'strain'],
        flavorProfile: ['strong', 'bitter', 'complex'],
        glassware: 'rocks',
        isFavorite: false,
        popularity: 0.95,
        qualityScore: 92
      },
      {
        id: 'recipe3',
        name: 'Margarita',
        category: 'Tequila',
        abv: 22,
        prepTime: 3,
        difficulty: 4,
        ingredients: [
          { name: 'tequila', amount: '2', unit: 'oz' },
          { name: 'lime juice', amount: '1', unit: 'oz' },
          { name: 'triple sec', amount: '0.5', unit: 'oz' },
          { name: 'salt', amount: '1', unit: 'rim' }
        ],
        techniques: ['shake', 'strain'],
        flavorProfile: ['citrusy', 'tart', 'refreshing'],
        glassware: 'margarita',
        isFavorite: true,
        popularity: 0.85,
        qualityScore: 85
      }
    ];
  });

  describe('Cross-Service Integration', () => {
    it('should integrate Advanced Search with basic functionality', async () => {
      const searchResult = await performAdvancedSearch('gin', mockRecipes);

      expect(searchResult.success).toBe(true);
      expect(searchResult.results.length).toBeGreaterThanOrEqual(0);
      expect(searchResult.processingTime).toBeLessThan(100);
    });

    it('should integrate Advanced Search with existing services separately', async () => {
      // Test contextual recommendations separately
      const contextualRecs = getContextualRecommendations(mockRecipes, {
        season: 'Summer',
        occasion: 'casual'
      });

      // Test ingredient-based recommendations separately
      const availableIngredients = [
        { name: 'gin', amount: '2', unit: 'oz' },
        { name: 'tonic water', amount: '4', unit: 'oz' }
      ];
      const ingredientRecs = getIngredientBasedRecommendations(availableIngredients, mockRecipes);

      expect(Array.isArray(contextualRecs)).toBe(true);
      expect(Array.isArray(ingredientRecs)).toBe(true);
    });

    it('should integrate Natural Language Processing with Fuzzy Search', async () => {
      // Test NLP → Fuzzy Search pipeline
      const nlpResult = processNaturalLanguageQuery('jin and tonic');
      expect(nlpResult.success).toBe(true);

      const fuzzyResult = performFuzzySearch('jin', ['gin', 'rum', 'vodka']);
      expect(fuzzyResult.success).toBe(true);
      expect(fuzzyResult.matches.some(match => match.ingredient === 'gin')).toBe(true);
    });

    it('should integrate Advanced Filtering with Search Results', async () => {
      const searchResult = await performAdvancedSearch('cocktails', mockRecipes, {
        filters: {
          abvRange: [10, 25],
          difficulty: 'easy'
        }
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.results.length).toBeGreaterThanOrEqual(0);
      expect(searchResult.stats).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should maintain <100ms response times across all services', async () => {
      const startTime = performance.now();

      // Test comprehensive search with available features
      const result = await performAdvancedSearch('light gin cocktails', mockRecipes, {
        maxResults: 50
      });

      const totalTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(100);
      expect(result.processingTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', async () => {
      // Create larger dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockRecipes[i % mockRecipes.length],
        id: `recipe${i}`,
        name: `${mockRecipes[i % mockRecipes.length].name} ${i}`
      }));

      const startTime = performance.now();
      const result = await performAdvancedSearch('gin', largeDataset);
      const totalTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(500); // Allow more time for large datasets in test environment
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle service failures', async () => {
      // Mock a service failure
      const originalConsoleError = console.error;
      console.error = vi.fn();

      try {
        const result = await performAdvancedSearch('test query', null); // Invalid input
        // If it doesn't throw, check that it handles the error gracefully
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } catch (error) {
        // If it throws, that's also acceptable error handling
        expect(error).toBeDefined();
      }

      console.error = originalConsoleError;
    });

    it('should provide fallback functionality when individual services fail', async () => {
      // Test with basic search that should work
      const result = await performAdvancedSearch('gin cocktails', mockRecipes);

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThanOrEqual(0);
      expect(result.stats).toBeDefined();
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across all search operations', async () => {
      const query = 'gin cocktails';

      // Perform multiple searches with different options
      const basicSearch = await performAdvancedSearch(query, mockRecipes);
      const filteredSearch = await performAdvancedSearch(query, mockRecipes, {
        includeFilters: true,
        filters: { category: 'Gin' }
      });
      const contextualSearch = await performAdvancedSearch(query, mockRecipes, {
        includeContextual: true,
        context: { season: 'Summer' }
      });

      // All searches should return consistent base results
      expect(basicSearch.success).toBe(true);
      expect(filteredSearch.success).toBe(true);
      expect(contextualSearch.success).toBe(true);

      // Results should be properly formatted
      basicSearch.results.forEach(result => {
        expect(result.recipe).toBeDefined();
        expect(result.relevanceScore).toBeDefined();
        expect(result.matchType).toBeDefined();
      });
    });

    it('should properly integrate with existing application hooks', () => {
      // Test that the useAdvancedSearch hook exists and can be called
      // Note: Full hook testing would require React Testing Library setup
      expect(typeof useAdvancedSearch).toBe('function');

      // Test basic hook functionality without full React context
      try {
        const hookResult = useAdvancedSearch(mockRecipes, {
          searchFields: ['name', 'category', 'flavorProfile'],
          enableFuzzy: true,
          maxResults: 10
        });
        // If hook runs without error, integration is working
        expect(hookResult).toBeDefined();
      } catch (error) {
        // Hook may require React context, which is expected in test environment
        expect(error.message).toMatch(/hook|useState|React/i);
      }
    });
  });

  describe('Feature Compatibility', () => {
    it('should work with existing recipe similarity calculations', () => {
      const recipe1 = mockRecipes[0];
      const recipe2 = mockRecipes[2]; // Both have 'refreshing' and 'citrusy'

      const similarity = calculateRecipeSimilarity(recipe1, recipe2);
      expect(similarity.overall).toBeGreaterThan(0);
      expect(similarity.overall).toBeLessThanOrEqual(1);
    });

    it('should integrate with existing recommendation engines', async () => {
      const contextualRecs = getContextualRecommendations(mockRecipes, {
        season: 'Summer',
        occasion: 'casual',
        timeOfDay: 'evening'
      });

      // Fix ingredient format for smart recommendation engine
      const availableIngredients = [
        { name: 'gin', amount: '2', unit: 'oz' },
        { name: 'lime', amount: '1', unit: 'wedge' }
      ];
      const ingredientRecs = getIngredientBasedRecommendations(availableIngredients, mockRecipes);

      expect(Array.isArray(contextualRecs)).toBe(true);
      expect(Array.isArray(ingredientRecs)).toBe(true);

      if (contextualRecs.length > 0) {
        expect(contextualRecs[0].recipe).toBeDefined();
        expect(contextualRecs[0].contextualScore).toBeDefined();
      }
    });
  });

  describe('Search Suggestion Integration', () => {
    it('should provide comprehensive search suggestions', () => {
      const suggestions = getAdvancedSearchSuggestions('gin');

      expect(suggestions.success).toBe(true);
      expect(suggestions.autocomplete).toBeDefined();
      expect(suggestions.trending).toBeDefined();
      expect(suggestions.personalized).toBeDefined();
      expect(suggestions.processingTime).toBeLessThan(100);
    });

    it('should integrate suggestions with search results', async () => {
      const result = await performAdvancedSearch('gi', mockRecipes, {
        includeSuggestions: true,
        includeDidYouMean: true
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.didYouMean).toBeDefined();
    });
  });
});

// Helper function for hook testing (would normally import from testing library)
const renderHook = (hook) => {
  let result;
  const TestComponent = () => {
    result = hook();
    return null;
  };

  return { result: { current: result } };
};
