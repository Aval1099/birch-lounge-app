import { describe, it, expect, beforeEach } from 'vitest';

import {
  calculateSeasonalScore,
  calculateOccasionScore,
  calculateTimeOfDayScore,
  calculateWeatherScore,
  getContextualRecommendations,
  getSeasonalRecommendations,
  getOccasionRecommendations,
  getTimeOfDayRecommendations,
  getWeatherRecommendations,
  getCurrentContext
} from '../../services/contextualRecommendationEngine';

describe('Contextual Recommendation Engine', () => {
  let mockRecipes;

  beforeEach(() => {
    mockRecipes = [
      {
        id: 'recipe1',
        name: 'Gin & Tonic',
        category: 'Gin',
        isFavorite: true,
        flavorProfile: ['refreshing', 'citrusy', 'herbal'],
        ingredients: [
          { name: 'gin', amount: '2', unit: 'oz' },
          { name: 'tonic water', amount: '4', unit: 'oz' },
          { name: 'lime juice', amount: '0.25', unit: 'oz' }
        ],
        techniques: ['build'],
        abv: 15,
        prepTime: 2
      },
      {
        id: 'recipe2',
        name: 'Hot Toddy',
        category: 'Whiskey',
        isFavorite: false,
        flavorProfile: ['warming', 'spiced', 'comforting'],
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'honey', amount: '1', unit: 'tbsp' },
          { name: 'lemon juice', amount: '0.5', unit: 'oz' },
          { name: 'hot water', amount: '4', unit: 'oz' }
        ],
        techniques: ['warm', 'build'],
        abv: 25,
        prepTime: 3
      },
      {
        id: 'recipe3',
        name: 'Espresso Martini',
        category: 'Vodka',
        isFavorite: true,
        flavorProfile: ['rich', 'coffee', 'sweet'],
        ingredients: [
          { name: 'vodka', amount: '2', unit: 'oz' },
          { name: 'coffee liqueur', amount: '0.5', unit: 'oz' },
          { name: 'espresso', amount: '1', unit: 'shot' }
        ],
        techniques: ['shake', 'strain'],
        abv: 22,
        prepTime: 4
      },
      {
        id: 'recipe4',
        name: 'Aperol Spritz',
        category: 'Aperitif',
        isFavorite: false,
        flavorProfile: ['light', 'bitter', 'citrusy'],
        ingredients: [
          { name: 'aperol', amount: '3', unit: 'oz' },
          { name: 'prosecco', amount: '3', unit: 'oz' },
          { name: 'soda water', amount: '1', unit: 'oz' }
        ],
        techniques: ['build'],
        abv: 11,
        prepTime: 2
      },
      {
        id: 'recipe5',
        name: 'Old Fashioned',
        category: 'Whiskey',
        isFavorite: true,
        flavorProfile: ['strong', 'bitter', 'warming'],
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'simple syrup', amount: '0.25', unit: 'oz' },
          { name: 'angostura bitters', amount: '2', unit: 'dashes' }
        ],
        techniques: ['stir', 'strain'],
        abv: 35,
        prepTime: 3
      }
    ];
  });

  describe('Seasonal Score Calculation', () => {
    it('should score summer drinks highly for summer season', () => {
      const ginTonic = mockRecipes[0]; // Light, refreshing, citrusy
      const score = calculateSeasonalScore(ginTonic, 'Summer');

      expect(score).toBeGreaterThan(70);
    });

    it('should score winter drinks highly for winter season', () => {
      const hotToddy = mockRecipes[1]; // Warming, spiced, higher ABV
      const score = calculateSeasonalScore(hotToddy, 'Winter');

      expect(score).toBeGreaterThan(70);
    });

    it('should score summer drinks poorly for winter season', () => {
      const ginTonic = mockRecipes[0];
      const score = calculateSeasonalScore(ginTonic, 'Winter');

      expect(score).toBeLessThan(50);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(calculateSeasonalScore(null, 'Summer')).toBe(0);
      expect(calculateSeasonalScore(mockRecipes[0], 'InvalidSeason')).toBe(0);
      expect(calculateSeasonalScore(mockRecipes[0], null)).toBe(0);
    });

    it('should consider ABV range for seasonal appropriateness', () => {
      const lowAbvDrink = { ...mockRecipes[0], abv: 12 }; // Perfect for summer
      const highAbvDrink = { ...mockRecipes[0], abv: 35 }; // Too strong for summer

      const lowScore = calculateSeasonalScore(lowAbvDrink, 'Summer');
      const highScore = calculateSeasonalScore(highAbvDrink, 'Summer');

      expect(lowScore).toBeGreaterThan(highScore);
    });
  });

  describe('Occasion Score Calculation', () => {
    it('should score simple drinks highly for casual occasions', () => {
      const ginTonic = mockRecipes[0]; // Simple build, few ingredients
      const score = calculateOccasionScore(ginTonic, 'Casual');

      expect(score).toBeGreaterThan(70);
    });

    it('should score complex drinks highly for formal occasions', () => {
      const espressoMartini = mockRecipes[2]; // More complex preparation
      const score = calculateOccasionScore(espressoMartini, 'Formal');

      expect(score).toBeGreaterThan(60);
    });

    it('should score batch-friendly drinks for parties', () => {
      const aperolSpritz = mockRecipes[3]; // Simple, scalable
      const score = calculateOccasionScore(aperolSpritz, 'Party');

      expect(score).toBeGreaterThan(60);
    });

    it('should score low-ABV drinks for brunch', () => {
      const aperolSpritz = mockRecipes[3]; // Low ABV, light
      const score = calculateOccasionScore(aperolSpritz, 'Brunch');

      expect(score).toBeGreaterThan(60);
    });

    it('should penalize overly complex drinks for casual occasions', () => {
      const complexDrink = {
        ...mockRecipes[0],
        ingredients: Array(8).fill({ name: 'ingredient', amount: '1', unit: 'oz' }),
        prepTime: 10
      };

      const score = calculateOccasionScore(complexDrink, 'Casual');
      expect(score).toBeLessThan(50);
    });
  });

  describe('Time of Day Score Calculation', () => {
    it('should score coffee drinks highly for morning', () => {
      const espressoMartini = mockRecipes[2]; // Contains espresso
      const score = calculateTimeOfDayScore(espressoMartini, 'Morning');

      expect(score).toBeGreaterThan(55);
    });

    it('should score low-ABV drinks for morning', () => {
      const aperolSpritz = mockRecipes[3]; // Low ABV
      const score = calculateTimeOfDayScore(aperolSpritz, 'Morning');

      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('should score high-ABV drinks for evening', () => {
      const oldFashioned = mockRecipes[4]; // High ABV, spirit-forward
      const score = calculateTimeOfDayScore(oldFashioned, 'Evening');

      expect(score).toBeGreaterThan(70);
    });

    it('should score simple drinks for late night', () => {
      const simpleDrink = {
        ...mockRecipes[4],
        ingredients: [
          { name: 'whiskey', amount: '2', unit: 'oz' },
          { name: 'ice', amount: '1', unit: 'cube' }
        ]
      };

      const score = calculateTimeOfDayScore(simpleDrink, 'Late Night');
      expect(score).toBeGreaterThan(60);
    });

    it('should handle invalid inputs', () => {
      expect(calculateTimeOfDayScore(null, 'Morning')).toBe(0);
      expect(calculateTimeOfDayScore(mockRecipes[0], 'InvalidTime')).toBe(0);
    });
  });

  describe('Weather Score Calculation', () => {
    it('should score refreshing drinks highly for hot weather', () => {
      const ginTonic = mockRecipes[0]; // Refreshing, citrusy
      const score = calculateWeatherScore(ginTonic, 'Hot');

      expect(score).toBeGreaterThan(70);
    });

    it('should score hot drinks highly for cold weather', () => {
      const hotToddy = mockRecipes[1]; // Hot cocktail
      const score = calculateWeatherScore(hotToddy, 'Cold');

      expect(score).toBeGreaterThan(80);
    });

    it('should score diluted drinks for hot weather', () => {
      const aperolSpritz = mockRecipes[3]; // Contains soda water
      const score = calculateWeatherScore(aperolSpritz, 'Hot');

      expect(score).toBeGreaterThan(60);
    });

    it('should score simple drinks for rainy weather', () => {
      const simpleDrink = {
        ...mockRecipes[0],
        ingredients: mockRecipes[0].ingredients.slice(0, 3) // Keep it simple
      };

      const score = calculateWeatherScore(simpleDrink, 'Rainy');
      expect(score).toBeGreaterThan(15);
    });

    it('should handle invalid inputs', () => {
      expect(calculateWeatherScore(null, 'Hot')).toBe(0);
      expect(calculateWeatherScore(mockRecipes[0], 'InvalidWeather')).toBe(0);
    });
  });

  describe('Contextual Recommendations', () => {
    it('should return contextually appropriate recommendations', () => {
      const context = {
        season: 'Summer',
        occasion: 'Casual',
        timeOfDay: 'Afternoon',
        weather: 'Hot'
      };

      const recommendations = getContextualRecommendations(mockRecipes, context, {
        maxRecommendations: 3,
        minScore: 30
      });

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      // Should be sorted by contextual score
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].contextualScore)
          .toBeGreaterThanOrEqual(recommendations[i].contextualScore);
      }
    });

    it('should include breakdown scores for each context factor', () => {
      const context = {
        season: 'Summer',
        occasion: 'Casual'
      };

      const recommendations = getContextualRecommendations(mockRecipes, context);

      recommendations.forEach(rec => {
        expect(rec.breakdown).toBeDefined();
        expect(rec.breakdown.seasonal).toBeGreaterThanOrEqual(0);
        expect(rec.breakdown.occasion).toBeGreaterThanOrEqual(0);
        expect(rec.breakdown.timeOfDay).toBeNull();
        expect(rec.breakdown.weather).toBeNull();
      });
    });

    it('should respect minimum score threshold', () => {
      const context = { season: 'Winter' }; // Should filter out summer drinks

      const recommendations = getContextualRecommendations(mockRecipes, context, {
        minScore: 70
      });

      recommendations.forEach(rec => {
        expect(rec.contextualScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should handle empty recipe list', () => {
      const context = { season: 'Summer' };
      const recommendations = getContextualRecommendations([], context);

      expect(recommendations).toEqual([]);
    });

    it('should prioritize favorites when scores are equal', () => {
      const context = { season: 'Summer' };
      const recommendations = getContextualRecommendations(mockRecipes, context);

      // Find recipes with similar scores
      const similarScores = recommendations.filter((rec, index) => {
        if (index === 0) return false;
        return Math.abs(rec.contextualScore - recommendations[index - 1].contextualScore) < 5;
      });

      if (similarScores.length > 0) {
        // Among similar scores, favorites should come first
        const favorites = recommendations.filter(rec => rec.recipe.isFavorite);
        const nonFavorites = recommendations.filter(rec => !rec.recipe.isFavorite);

        if (favorites.length > 0 && nonFavorites.length > 0) {
          const firstFavoriteIndex = recommendations.findIndex(rec => rec.recipe.isFavorite);
          const firstNonFavoriteIndex = recommendations.findIndex(rec => !rec.recipe.isFavorite);

          // This test only applies if there are similar scores
          if (firstFavoriteIndex !== -1 && firstNonFavoriteIndex !== -1) {
            const favoriteScore = recommendations[firstFavoriteIndex].contextualScore;
            const nonFavoriteScore = recommendations[firstNonFavoriteIndex].contextualScore;

            if (Math.abs(favoriteScore - nonFavoriteScore) < 5) {
              expect(firstFavoriteIndex).toBeLessThan(firstNonFavoriteIndex);
            }
          }
        }
      }
    });
  });

  describe('Specific Recommendation Functions', () => {
    it('should get seasonal recommendations', () => {
      const recommendations = getSeasonalRecommendations(mockRecipes, 'Summer', {
        maxRecommendations: 3
      });

      expect(recommendations.length).toBeLessThanOrEqual(3);
      recommendations.forEach(rec => {
        expect(rec.breakdown.seasonal).toBeGreaterThan(0);
      });
    });

    it('should get occasion recommendations', () => {
      const recommendations = getOccasionRecommendations(mockRecipes, 'Casual', {
        maxRecommendations: 3
      });

      expect(recommendations.length).toBeLessThanOrEqual(3);
      recommendations.forEach(rec => {
        expect(rec.breakdown.occasion).toBeGreaterThan(0);
      });
    });

    it('should get time-of-day recommendations', () => {
      const recommendations = getTimeOfDayRecommendations(mockRecipes, 'Morning', {
        maxRecommendations: 3
      });

      expect(recommendations.length).toBeLessThanOrEqual(3);
      recommendations.forEach(rec => {
        expect(rec.breakdown.timeOfDay).toBeGreaterThan(0);
      });
    });

    it('should get weather recommendations', () => {
      const recommendations = getWeatherRecommendations(mockRecipes, 'Hot', {
        maxRecommendations: 3
      });

      expect(recommendations.length).toBeLessThanOrEqual(3);
      recommendations.forEach(rec => {
        expect(rec.breakdown.weather).toBeGreaterThan(0);
      });
    });
  });

  describe('Current Context Detection', () => {
    it('should detect season based on date', () => {
      const summerDate = new Date('2024-07-15');
      const context = getCurrentContext(summerDate);

      expect(context.season).toBe('Summer');
    });

    it('should detect time of day based on hour', () => {
      const morningDate = new Date('2024-07-15T09:00:00');
      const context = getCurrentContext(morningDate);

      expect(context.timeOfDay).toBe('Morning');
    });

    it('should include weather when provided', () => {
      const context = getCurrentContext(new Date(), 'Hot');

      expect(context.weather).toBe('Hot');
    });

    it('should handle all seasons correctly', () => {
      const springDate = new Date('2024-04-15');
      const summerDate = new Date('2024-07-15');
      const fallDate = new Date('2024-10-15');
      const winterDate = new Date('2024-01-15');

      expect(getCurrentContext(springDate).season).toBe('Spring');
      expect(getCurrentContext(summerDate).season).toBe('Summer');
      expect(getCurrentContext(fallDate).season).toBe('Fall');
      expect(getCurrentContext(winterDate).season).toBe('Winter');
    });

    it('should handle all times of day correctly', () => {
      const morning = new Date('2024-07-15T09:00:00');
      const afternoon = new Date('2024-07-15T15:00:00');
      const evening = new Date('2024-07-15T19:00:00');
      const lateNight = new Date('2024-07-15T02:00:00');

      expect(getCurrentContext(morning).timeOfDay).toBe('Morning');
      expect(getCurrentContext(afternoon).timeOfDay).toBe('Afternoon');
      expect(getCurrentContext(evening).timeOfDay).toBe('Evening');
      expect(getCurrentContext(lateNight).timeOfDay).toBe('Late Night');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete contextual recommendations in under 100ms', () => {
      const context = {
        season: 'Summer',
        occasion: 'Casual',
        timeOfDay: 'Afternoon',
        weather: 'Hot'
      };

      const startTime = performance.now();

      getContextualRecommendations(mockRecipes, context, {
        maxRecommendations: 10
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', () => {
      // Create larger dataset
      const largeRecipeSet = Array.from({ length: 100 }, (_, i) => ({
        id: `recipe${i}`,
        name: `Recipe ${i}`,
        category: 'Test',
        flavorProfile: ['refreshing', 'citrusy'],
        ingredients: [{ name: 'test ingredient', amount: '1', unit: 'oz' }],
        techniques: ['build'],
        abv: 20,
        prepTime: 2
      }));

      const context = { season: 'Summer', occasion: 'Casual' };

      const startTime = performance.now();

      const recommendations = getContextualRecommendations(largeRecipeSet, context, {
        maxRecommendations: 20
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(recommendations.length).toBeLessThanOrEqual(20);
    });
  });
});
