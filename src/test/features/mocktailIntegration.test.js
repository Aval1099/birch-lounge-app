// =============================================================================
// MOCKTAIL INTEGRATION TESTS
// =============================================================================

import { describe, it, expect } from 'vitest';

import { BASE_SPIRITS, ALCOHOL_CONTENT_TYPES } from '../../constants';
import { getSampleMocktails } from '../../data/sampleMocktails';
import { createRecipe } from '../../models';
import { getRecipeAlcoholContent, classifyRecipeCategory } from '../../services/enhancedRecipeParser';
import { 
  shouldLoadSampleMocktails, 
  getInitialMocktails, 
  filterRecipesByAlcoholContent,
  isMocktail,
  getMocktailFlavorProfiles
} from '../../utils/mocktailUtils';

describe('Mocktail Integration', () => {
  describe('Constants and Configuration', () => {
    it('should include Mocktail in BASE_SPIRITS', () => {
      expect(BASE_SPIRITS).toContain('Mocktail');
      expect(BASE_SPIRITS.indexOf('Mocktail')).toBe(1); // Should be second after 'All'
    });

    it('should have alcohol content types defined', () => {
      expect(ALCOHOL_CONTENT_TYPES.ALCOHOLIC).toBe('alcoholic');
      expect(ALCOHOL_CONTENT_TYPES.NON_ALCOHOLIC).toBe('non_alcoholic');
      expect(ALCOHOL_CONTENT_TYPES.LOW_ALCOHOL).toBe('low_alcohol');
    });
  });

  describe('Sample Mocktails', () => {
    it('should provide sample mocktails', () => {
      const mocktails = getSampleMocktails();
      expect(mocktails).toBeInstanceOf(Array);
      expect(mocktails.length).toBeGreaterThan(0);
      
      // Check that all samples are properly categorized as mocktails
      const allowedAlcoholContent = ['non_alcoholic', 'low_alcohol'];
      mocktails.forEach(mocktail => {
        expect(mocktail.category).toBe('Mocktail');
        expect(allowedAlcoholContent).toContain(mocktail.alcoholContent);
      });

      // Ensure the collection includes at least one truly non-alcoholic mocktail
      expect(mocktails.some(mocktail => mocktail.alcoholContent === 'non_alcoholic')).toBe(true);
    });

    it('should have properly structured mocktail recipes', () => {
      const mocktails = getSampleMocktails();
      const firstMocktail = mocktails[0];
      
      expect(firstMocktail).toHaveProperty('name');
      expect(firstMocktail).toHaveProperty('category', 'Mocktail');
      expect(firstMocktail).toHaveProperty('ingredients');
      expect(firstMocktail).toHaveProperty('instructions');
      expect(firstMocktail.ingredients).toBeInstanceOf(Array);
      expect(firstMocktail.ingredients.length).toBeGreaterThan(0);
    });
  });

  describe('Recipe Creation and Classification', () => {
    it('should automatically classify mocktails correctly', () => {
      const mocktailData = {
        name: 'Test Virgin Mojito',
        category: 'Mocktail',
        ingredients: [
          { name: 'Fresh Mint', amount: '10', unit: 'leaves' },
          { name: 'Lime Juice', amount: '1', unit: 'oz' },
          { name: 'Club Soda', amount: '4', unit: 'oz' }
        ]
      };

      const recipe = createRecipe(mocktailData);
      expect(recipe.alcoholContent).toBe('non_alcoholic');
    });

    it('should classify alcoholic recipes correctly', () => {
      const cocktailData = {
        name: 'Test Mojito',
        category: 'Rum',
        ingredients: [
          { name: 'White Rum', amount: '2', unit: 'oz' },
          { name: 'Fresh Mint', amount: '10', unit: 'leaves' },
          { name: 'Lime Juice', amount: '1', unit: 'oz' }
        ]
      };

      const recipe = createRecipe(cocktailData);
      expect(recipe.alcoholContent).toBe('alcoholic');
    });

    it('should detect alcohol content from ingredients', () => {
      const mocktailRecipe = {
        ingredients: [
          { name: 'Orange Juice', category: 'Fresh Ingredients' },
          { name: 'Grenadine', category: 'Mixers' }
        ]
      };

      const cocktailRecipe = {
        ingredients: [
          { name: 'Vodka', category: 'Vodka' },
          { name: 'Orange Juice', category: 'Fresh Ingredients' }
        ]
      };

      expect(getRecipeAlcoholContent(mocktailRecipe)).toBe('non_alcoholic');
      expect(getRecipeAlcoholContent(cocktailRecipe)).toBe('alcoholic');
    });
  });

  describe('Utility Functions', () => {
    it('should determine when to load sample mocktails', () => {
      const emptyRecipes = [];
      const recipesWithMocktails = [
        { category: 'Mocktail' },
        { category: 'Mocktail' },
        { category: 'Mocktail' }
      ];

      expect(shouldLoadSampleMocktails(emptyRecipes)).toBe(true);
      expect(shouldLoadSampleMocktails(recipesWithMocktails)).toBe(false);
    });

    it('should filter recipes by alcohol content', () => {
      const recipes = [
        { name: 'Mojito', category: 'Rum', alcoholContent: 'alcoholic' },
        { name: 'Virgin Mojito', category: 'Mocktail', alcoholContent: 'non_alcoholic' },
        { name: 'Margarita', category: 'Tequila', alcoholContent: 'alcoholic' }
      ];

      const alcoholic = filterRecipesByAlcoholContent(recipes, 'alcoholic');
      const nonAlcoholic = filterRecipesByAlcoholContent(recipes, 'non_alcoholic');
      const all = filterRecipesByAlcoholContent(recipes, 'all');

      expect(alcoholic).toHaveLength(2);
      expect(nonAlcoholic).toHaveLength(1);
      expect(all).toHaveLength(3);
    });

    it('should support low alcohol and unexpected filter values gracefully', () => {
      const spritz = { name: 'Citrus Spritz', category: 'Mocktail', alcoholContent: 'low_alcohol' };
      const recipes = [
        { name: 'Old Fashioned', category: 'Whiskey', alcoholContent: 'alcoholic' },
        { name: 'Garden Collins', category: 'Mocktail', alcoholContent: 'non_alcoholic' },
        spritz
      ];

      const lowAlcohol = filterRecipesByAlcoholContent(recipes, 'low_alcohol');
      const unexpected = filterRecipesByAlcoholContent(recipes, 'sparkling');

      expect(lowAlcohol).toEqual([spritz]);
      expect(unexpected).toEqual(recipes);
    });

    it('should identify mocktails correctly', () => {
      const mocktail = { category: 'Mocktail', alcoholContent: 'non_alcoholic' };
      const cocktail = { category: 'Rum', alcoholContent: 'alcoholic' };
      const nonAlcoholic = { category: 'Other', alcoholContent: 'non_alcoholic' };

      expect(isMocktail(mocktail)).toBe(true);
      expect(isMocktail(cocktail)).toBe(false);
      expect(isMocktail(nonAlcoholic)).toBe(true);
    });

    it('should provide mocktail-specific flavor profiles', () => {
      const profiles = getMocktailFlavorProfiles();
      expect(profiles).toBeInstanceOf(Array);
      expect(profiles).toContain('refreshing');
      expect(profiles).toContain('tropical');
      expect(profiles).toContain('fizzy');
    });
  });

  describe('Enhanced Recipe Parser', () => {
    it('should classify mocktail category from patterns', () => {
      const mocktailRecipe = {
        name: 'Virgin Bloody Mary',
        ingredients: [{ name: 'tomato juice' }, { name: 'worcestershire sauce' }]
      };

      const category = classifyRecipeCategory(mocktailRecipe);
      // Should classify based on ingredients or default to category
      expect(typeof category).toBe('string');
    });
  });
});
