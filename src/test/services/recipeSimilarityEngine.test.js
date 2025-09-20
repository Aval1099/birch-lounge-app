import { describe, it, expect, beforeEach } from 'vitest';

import {
  calculateFlavorSimilarity,
  calculateIngredientSimilarity,
  calculateTechniqueSimilarity,
  calculateRecipeSimilarity,
  findSimilarRecipes,
  getIfYouLikeThisTryThis,
  createRecipeClusters
} from '../../services/recipeSimilarityEngine';

describe('Recipe Similarity Engine', () => {
  let mockRecipes;

  beforeEach(() => {
    mockRecipes = [
      {
        id: 'recipe1',
        name: 'Old Fashioned',
        category: 'Whiskey',
        isFavorite: true,
        flavorProfile: ['sweet', 'bitter', 'woody'],
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'simple syrup', amount: '0.5', unit: 'oz' },
          { name: 'angostura bitters', amount: '2', unit: 'dashes' }
        ],
        techniques: ['stir', 'strain']
      },
      {
        id: 'recipe2',
        name: 'Manhattan',
        category: 'Whiskey',
        isFavorite: false,
        flavorProfile: ['sweet', 'bitter', 'herbal'],
        ingredients: [
          { name: 'rye', amount: '2', unit: 'oz' },
          { name: 'sweet vermouth', amount: '1', unit: 'oz' },
          { name: 'angostura bitters', amount: '2', unit: 'dashes' }
        ],
        techniques: ['stir', 'strain']
      },
      {
        id: 'recipe3',
        name: 'Gin & Tonic',
        category: 'Gin',
        isFavorite: true,
        flavorProfile: ['bitter', 'citrusy', 'herbal'],
        ingredients: [
          { name: 'gin', amount: '2', unit: 'oz' },
          { name: 'tonic water', amount: '4', unit: 'oz' },
          { name: 'lime juice', amount: '0.25', unit: 'oz' }
        ],
        techniques: ['build']
      },
      {
        id: 'recipe4',
        name: 'Whiskey Sour',
        category: 'Whiskey',
        isFavorite: false,
        flavorProfile: ['sour', 'sweet', 'citrusy'],
        ingredients: [
          { name: 'bourbon', amount: '2', unit: 'oz' },
          { name: 'lemon juice', amount: '0.75', unit: 'oz' },
          { name: 'simple syrup', amount: '0.75', unit: 'oz' }
        ],
        techniques: ['shake', 'strain']
      },
      {
        id: 'recipe5',
        name: 'Negroni',
        category: 'Gin',
        isFavorite: true,
        flavorProfile: ['bitter', 'sweet', 'herbal'],
        ingredients: [
          { name: 'gin', amount: '1', unit: 'oz' },
          { name: 'campari', amount: '1', unit: 'oz' },
          { name: 'sweet vermouth', amount: '1', unit: 'oz' }
        ],
        techniques: ['stir', 'build']
      }
    ];
  });

  describe('Flavor Similarity Calculation', () => {
    it('should return 1 for identical flavor profiles', () => {
      const profile1 = ['sweet', 'bitter'];
      const profile2 = ['sweet', 'bitter'];
      
      const similarity = calculateFlavorSimilarity(profile1, profile2);
      expect(similarity).toBe(1);
    });

    it('should return 0 for completely different flavor profiles', () => {
      const profile1 = ['sweet'];
      const profile2 = ['salty'];
      
      const similarity = calculateFlavorSimilarity(profile1, profile2);
      expect(similarity).toBe(0);
    });

    it('should calculate partial similarity for related flavors', () => {
      const profile1 = ['sweet'];
      const profile2 = ['fruity']; // Related to sweet
      
      const similarity = calculateFlavorSimilarity(profile1, profile2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty arrays', () => {
      expect(calculateFlavorSimilarity([], [])).toBe(1);
      expect(calculateFlavorSimilarity(['sweet'], [])).toBe(0);
      expect(calculateFlavorSimilarity([], ['sweet'])).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(calculateFlavorSimilarity(null, ['sweet'])).toBe(0);
      expect(calculateFlavorSimilarity(['sweet'], null)).toBe(0);
      expect(calculateFlavorSimilarity(undefined, undefined)).toBe(0);
    });
  });

  describe('Ingredient Similarity Calculation', () => {
    it('should return high similarity for exact ingredient matches', () => {
      const ingredients1 = [
        { name: 'whiskey', amount: '2', unit: 'oz' },
        { name: 'simple syrup', amount: '0.5', unit: 'oz' }
      ];
      const ingredients2 = [
        { name: 'whiskey', amount: '2', unit: 'oz' },
        { name: 'simple syrup', amount: '0.5', unit: 'oz' }
      ];
      
      const similarity = calculateIngredientSimilarity(ingredients1, ingredients2);
      expect(similarity).toBe(1);
    });

    it('should calculate similarity for related spirits', () => {
      const ingredients1 = [{ name: 'whiskey', amount: '2', unit: 'oz' }];
      const ingredients2 = [{ name: 'bourbon', amount: '2', unit: 'oz' }];
      
      const similarity = calculateIngredientSimilarity(ingredients1, ingredients2);
      expect(similarity).toBeGreaterThan(0.8); // High similarity for related spirits
    });

    it('should handle different ingredient counts', () => {
      const ingredients1 = [
        { name: 'gin', amount: '2', unit: 'oz' },
        { name: 'tonic', amount: '4', unit: 'oz' }
      ];
      const ingredients2 = [
        { name: 'gin', amount: '2', unit: 'oz' }
      ];
      
      const similarity = calculateIngredientSimilarity(ingredients1, ingredients2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty ingredient lists', () => {
      expect(calculateIngredientSimilarity([], [])).toBe(1);
      expect(calculateIngredientSimilarity([{ name: 'gin' }], [])).toBe(0);
    });
  });

  describe('Technique Similarity Calculation', () => {
    it('should return 1 for identical techniques', () => {
      const techniques1 = ['shake', 'strain'];
      const techniques2 = ['shake', 'strain'];
      
      const similarity = calculateTechniqueSimilarity(techniques1, techniques2);
      expect(similarity).toBe(1);
    });

    it('should calculate similarity for related techniques', () => {
      const techniques1 = ['shake'];
      const techniques2 = ['stir']; // Related technique
      
      const similarity = calculateTechniqueSimilarity(techniques1, techniques2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty technique lists', () => {
      expect(calculateTechniqueSimilarity([], [])).toBe(1);
      expect(calculateTechniqueSimilarity(['shake'], [])).toBe(0);
    });
  });

  describe('Overall Recipe Similarity', () => {
    it('should calculate comprehensive similarity between recipes', () => {
      const recipe1 = mockRecipes[0]; // Old Fashioned
      const recipe2 = mockRecipes[1]; // Manhattan
      
      const similarity = calculateRecipeSimilarity(recipe1, recipe2);
      
      expect(similarity.overall).toBeGreaterThan(0);
      expect(similarity.breakdown).toBeDefined();
      expect(similarity.breakdown.flavor).toBeDefined();
      expect(similarity.breakdown.ingredients).toBeDefined();
      expect(similarity.breakdown.techniques).toBeDefined();
      expect(similarity.breakdown.category).toBeDefined();
    });

    it('should return high similarity for very similar recipes', () => {
      const recipe1 = mockRecipes[0]; // Old Fashioned
      const recipe2 = mockRecipes[1]; // Manhattan (both whiskey-based, similar techniques)
      
      const similarity = calculateRecipeSimilarity(recipe1, recipe2);
      expect(similarity.overall).toBeGreaterThan(0.5);
    });

    it('should return low similarity for very different recipes', () => {
      const recipe1 = mockRecipes[0]; // Old Fashioned (whiskey)
      const recipe2 = mockRecipes[2]; // Gin & Tonic (gin)
      
      const similarity = calculateRecipeSimilarity(recipe1, recipe2);
      expect(similarity.overall).toBeLessThan(0.5);
    });

    it('should respect custom weights', () => {
      const recipe1 = mockRecipes[0];
      const recipe2 = mockRecipes[1];
      
      const defaultSimilarity = calculateRecipeSimilarity(recipe1, recipe2);
      const customSimilarity = calculateRecipeSimilarity(recipe1, recipe2, {
        flavor: 0.8,
        ingredients: 0.1,
        techniques: 0.1,
        category: 0.0
      });
      
      expect(customSimilarity.weights.flavor).toBe(0.8);
      expect(customSimilarity.overall).not.toBe(defaultSimilarity.overall);
    });
  });

  describe('Finding Similar Recipes', () => {
    it('should find similar recipes to a target recipe', () => {
      const targetRecipe = mockRecipes[0]; // Old Fashioned
      const similar = findSimilarRecipes(targetRecipe, mockRecipes, {
        maxResults: 3,
        minSimilarity: 0.1
      });
      
      expect(similar).toBeInstanceOf(Array);
      expect(similar.length).toBeGreaterThan(0);
      expect(similar.length).toBeLessThanOrEqual(3);
      
      // Should be sorted by similarity (descending)
      for (let i = 1; i < similar.length; i++) {
        expect(similar[i-1].similarity.overall)
          .toBeGreaterThanOrEqual(similar[i].similarity.overall);
      }
    });

    it('should exclude the target recipe itself', () => {
      const targetRecipe = mockRecipes[0];
      const similar = findSimilarRecipes(targetRecipe, mockRecipes, {
        excludeExact: true
      });
      
      const foundSelf = similar.find(item => item.recipe.id === targetRecipe.id);
      expect(foundSelf).toBeUndefined();
    });

    it('should respect minimum similarity threshold', () => {
      const targetRecipe = mockRecipes[0];
      const similar = findSimilarRecipes(targetRecipe, mockRecipes, {
        minSimilarity: 0.8
      });
      
      similar.forEach(item => {
        expect(item.similarity.overall).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should handle empty recipe list', () => {
      const targetRecipe = mockRecipes[0];
      const similar = findSimilarRecipes(targetRecipe, []);
      
      expect(similar).toEqual([]);
    });
  });

  describe('If You Like This Try This Recommendations', () => {
    it('should generate recommendations based on favorite recipes', () => {
      const favorites = [mockRecipes[0], mockRecipes[2]]; // Old Fashioned, Gin & Tonic
      const recommendations = getIfYouLikeThisTryThis(favorites, mockRecipes, {
        maxRecommendations: 3
      });
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);
      
      // Should not include the favorite recipes themselves
      recommendations.forEach(rec => {
        expect(favorites.find(fav => fav.id === rec.recipe.id)).toBeUndefined();
      });
    });

    it('should prioritize recipes similar to multiple favorites', () => {
      const favorites = [mockRecipes[0], mockRecipes[1]]; // Both whiskey cocktails
      const recommendations = getIfYouLikeThisTryThis(favorites, mockRecipes);
      
      // Should find whiskey sour as it's similar to both favorites
      const whiskeyRecommendation = recommendations.find(rec => 
        rec.recipe.category === 'Whiskey'
      );
      expect(whiskeyRecommendation).toBeDefined();
    });

    it('should handle empty favorites list', () => {
      const recommendations = getIfYouLikeThisTryThis([], mockRecipes);
      expect(recommendations).toEqual([]);
    });

    it('should handle single favorite recipe', () => {
      const favorites = [mockRecipes[0]];
      const recommendations = getIfYouLikeThisTryThis(favorites, mockRecipes);
      
      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.recipe.id).not.toBe(mockRecipes[0].id);
      });
    });
  });

  describe('Recipe Clustering', () => {
    it('should create clusters of similar recipes', () => {
      const clusters = createRecipeClusters(mockRecipes, {
        minClusterSize: 2,
        similarityThreshold: 0.3
      });
      
      expect(clusters).toBeInstanceOf(Array);
      clusters.forEach(cluster => {
        expect(cluster.recipes.length).toBeGreaterThanOrEqual(2);
        expect(cluster.centerRecipe).toBeDefined();
        expect(cluster.id).toBeDefined();
      });
    });

    it('should sort clusters by size and similarity', () => {
      const clusters = createRecipeClusters(mockRecipes, {
        minClusterSize: 2
      });
      
      for (let i = 1; i < clusters.length; i++) {
        const prev = clusters[i-1];
        const curr = clusters[i];
        
        // Should be sorted by size first, then by similarity
        if (prev.recipes.length === curr.recipes.length) {
          expect(prev.averageSimilarity).toBeGreaterThanOrEqual(curr.averageSimilarity);
        } else {
          expect(prev.recipes.length).toBeGreaterThan(curr.recipes.length);
        }
      }
    });

    it('should handle insufficient recipes for clustering', () => {
      const smallRecipeSet = [mockRecipes[0]];
      const clusters = createRecipeClusters(smallRecipeSet, {
        minClusterSize: 2
      });
      
      expect(clusters).toEqual([]);
    });

    it('should respect maximum cluster limit', () => {
      const clusters = createRecipeClusters(mockRecipes, {
        maxClusters: 2
      });
      
      expect(clusters.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete similarity calculations in under 100ms', () => {
      const startTime = performance.now();
      
      // Perform multiple similarity calculations
      for (let i = 0; i < mockRecipes.length; i++) {
        for (let j = i + 1; j < mockRecipes.length; j++) {
          calculateRecipeSimilarity(mockRecipes[i], mockRecipes[j]);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    it('should handle large recipe sets efficiently', () => {
      // Create larger dataset
      const largeRecipeSet = Array.from({ length: 50 }, (_, i) => ({
        id: `recipe${i}`,
        name: `Recipe ${i}`,
        category: 'Test',
        flavorProfile: ['sweet', 'bitter'],
        ingredients: [{ name: 'test ingredient', amount: '1', unit: 'oz' }],
        techniques: ['stir']
      }));

      const startTime = performance.now();
      
      findSimilarRecipes(largeRecipeSet[0], largeRecipeSet, {
        maxResults: 10
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });
  });
});
