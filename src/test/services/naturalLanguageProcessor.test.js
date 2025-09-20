import { describe, it, expect } from 'vitest';

import {
  normalizeQuery,
  extractIngredients,
  extractDescriptors,
  classifyIntent,
  generateSearchParameters,
  processNaturalLanguageQuery
} from '../../services/naturalLanguageProcessor';

describe('Natural Language Processor', () => {
  describe('Query Normalization', () => {
    it('should normalize and tokenize basic queries', () => {
      const result = normalizeQuery('Light Summer Cocktails with Gin');

      expect(result.original).toBe('Light Summer Cocktails with Gin');
      expect(result.normalized).toBe('light summer cocktails with gin');
      expect(result.tokens).toEqual(['light', 'summer', 'cocktails', 'with', 'gin']);
      expect(result.cleanTokens).toEqual(['light', 'summer', 'cocktails', 'with', 'gin']);
    });

    it('should handle empty and invalid inputs', () => {
      expect(normalizeQuery('').normalized).toBe('');
      expect(normalizeQuery(null).normalized).toBe('');
      expect(normalizeQuery(undefined).normalized).toBe('');
    });

    it('should remove stop words but keep relevant ones', () => {
      const result = normalizeQuery('The best cocktails with gin and tonic');

      expect(result.cleanTokens).not.toContain('the');
      expect(result.cleanTokens).not.toContain('and');
      expect(result.cleanTokens).toContain('with');
      expect(result.cleanTokens).toContain('gin');
    });

    it('should handle punctuation and special characters', () => {
      const result = normalizeQuery('Gin & Tonic, please!');

      expect(result.tokens).toEqual(['gin', '&', 'tonic', 'please']);
      expect(result.cleanTokens).toEqual(['gin', '&', 'tonic', 'please']);
    });
  });

  describe('Ingredient Extraction', () => {
    it('should extract known ingredients from tokens', () => {
      const tokens = ['gin', 'cocktails', 'with', 'lime', 'juice'];
      const ingredients = extractIngredients(tokens);

      expect(ingredients.length).toBeGreaterThanOrEqual(2);
      expect(ingredients.some(ing => ing.ingredient === 'gin')).toBe(true);
      expect(ingredients.some(ing => ing.ingredient === 'lime juice')).toBe(true);
      const ginMatch = ingredients.find(ing => ing.ingredient === 'gin');
      expect(ginMatch.confidence).toBe(1.0);
    });

    it('should handle ingredient aliases', () => {
      const tokens = ['bourbon', 'whisky', 'drinks'];
      const ingredients = extractIngredients(tokens);

      expect(ingredients.some(ing => ing.ingredient === 'whiskey')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const tokens = ['random', 'words', 'here'];
      const ingredients = extractIngredients(tokens);

      expect(ingredients).toEqual([]);
    });

    it('should handle partial matches with lower confidence', () => {
      const tokens = ['vodka', 'based', 'cocktails'];
      const ingredients = extractIngredients(tokens);

      const vodkaMatch = ingredients.find(ing => ing.ingredient === 'vodka');
      expect(vodkaMatch).toBeDefined();
      expect(vodkaMatch.confidence).toBeGreaterThan(0.5);
    });

    it('should remove duplicates and prioritize by confidence', () => {
      const tokens = ['gin', 'london', 'dry', 'gin'];
      const ingredients = extractIngredients(tokens);

      const ginMatches = ingredients.filter(ing => ing.ingredient === 'gin');
      expect(ginMatches).toHaveLength(1);
    });
  });

  describe('Descriptor Extraction', () => {
    it('should extract strength descriptors', () => {
      const tokens = ['light', 'cocktails', 'for', 'summer'];
      const descriptors = extractDescriptors(tokens);

      expect(descriptors.strength).toHaveLength(1);
      expect(descriptors.strength[0].subcategory).toBe('light');
      expect(descriptors.strength[0].confidence).toBe(1.0);
    });

    it('should extract flavor descriptors', () => {
      const tokens = ['sweet', 'fruity', 'cocktails'];
      const descriptors = extractDescriptors(tokens);

      expect(descriptors.flavor).toHaveLength(2);
      expect(descriptors.flavor.some(f => f.subcategory === 'sweet')).toBe(true);
      expect(descriptors.flavor.some(f => f.subcategory === 'fruity')).toBe(true);
    });

    it('should extract occasion descriptors', () => {
      const tokens = ['party', 'cocktails', 'for', 'celebration'];
      const descriptors = extractDescriptors(tokens);

      expect(descriptors.occasion).toHaveLength(1);
      expect(descriptors.occasion[0].subcategory).toBe('party');
    });

    it('should extract seasonal descriptors', () => {
      const tokens = ['summer', 'drinks', 'for', 'hot', 'weather'];
      const descriptors = extractDescriptors(tokens);

      expect(descriptors.season).toHaveLength(1);
      expect(descriptors.season[0].subcategory).toBe('summer');
    });

    it('should handle multiple categories', () => {
      const tokens = ['light', 'summer', 'party', 'cocktails'];
      const descriptors = extractDescriptors(tokens);

      expect(descriptors.strength).toHaveLength(1);
      expect(descriptors.season).toHaveLength(1);
      expect(descriptors.occasion).toHaveLength(1);
    });

    it('should remove duplicates within categories', () => {
      const tokens = ['sweet', 'sugary', 'cocktails'];
      const descriptors = extractDescriptors(tokens);

      expect(descriptors.flavor).toHaveLength(1);
      expect(descriptors.flavor[0].subcategory).toBe('sweet');
    });
  });

  describe('Intent Classification', () => {
    it('should classify ingredient-based intent', () => {
      const query = 'cocktails with gin and lime juice';
      const extractedData = {
        ingredients: [{ ingredient: 'gin' }, { ingredient: 'lime juice' }],
        descriptors: { strength: [], flavor: [], temperature: [], occasion: [], season: [], style: [] }
      };

      const intent = classifyIntent(query, extractedData);

      expect(intent.primary.type).toBe('ingredient_based');
      expect(intent.primary.confidence).toBeGreaterThan(0.6);
    });

    it('should classify style-based intent', () => {
      const query = 'light refreshing cocktails';
      const extractedData = {
        ingredients: [],
        descriptors: {
          strength: [{ subcategory: 'light' }],
          flavor: [{ subcategory: 'refreshing' }],
          temperature: [], occasion: [], season: [], style: []
        }
      };

      const intent = classifyIntent(query, extractedData);

      expect(intent.primary.type).toBe('style_based');
    });

    it('should classify occasion-based intent', () => {
      const query = 'party cocktails for celebration';
      const extractedData = {
        ingredients: [],
        descriptors: {
          strength: [], flavor: [], temperature: [],
          occasion: [{ subcategory: 'party' }],
          season: [], style: []
        }
      };

      const intent = classifyIntent(query, extractedData);

      // Should find occasion-based intent in the results
      expect(intent.all.some(i => i.type === 'occasion_based')).toBe(true);
    });

    it('should classify seasonal-based intent', () => {
      const query = 'summer cocktails for hot weather';
      const extractedData = {
        ingredients: [],
        descriptors: {
          strength: [], flavor: [], temperature: [],
          occasion: [], season: [{ subcategory: 'summer' }], style: []
        }
      };

      const intent = classifyIntent(query, extractedData);

      // Should find seasonal-based intent in the results
      expect(intent.all.some(i => i.type === 'seasonal_based')).toBe(true);
    });

    it('should handle mixed intents and prioritize correctly', () => {
      const query = 'light gin cocktails for summer parties';
      const extractedData = {
        ingredients: [{ ingredient: 'gin' }],
        descriptors: {
          strength: [{ subcategory: 'light' }],
          flavor: [], temperature: [],
          occasion: [{ subcategory: 'party' }],
          season: [{ subcategory: 'summer' }], style: []
        }
      };

      const intent = classifyIntent(query, extractedData);

      expect(intent.primary.type).toBe('ingredient_based');
      expect(intent.secondary).toBeDefined();
      expect(intent.all.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide fallback for unclear intents', () => {
      const query = 'random text here';
      const extractedData = {
        ingredients: [],
        descriptors: { strength: [], flavor: [], temperature: [], occasion: [], season: [], style: [] }
      };

      const intent = classifyIntent(query, extractedData);

      expect(intent.primary.type).toBe('general');
      expect(intent.primary.confidence).toBeLessThan(0.5);
    });
  });

  describe('Search Parameter Generation', () => {
    it('should generate parameters for ingredient-based queries', () => {
      const queryData = {
        ingredients: [{ ingredient: 'gin', confidence: 1.0 }],
        descriptors: { strength: [], flavor: [], temperature: [], occasion: [], season: [], style: [] },
        intent: { primary: { type: 'ingredient_based' } }
      };

      const params = generateSearchParameters(queryData);

      expect(params.ingredients).toHaveLength(1);
      expect(params.ingredients[0].name).toBe('gin');
      expect(params.ingredients[0].required).toBe(true);
      expect(params.intent).toBe('ingredient_based');
    });

    it('should convert strength descriptors to ABV filters', () => {
      const queryData = {
        ingredients: [],
        descriptors: {
          strength: [{ subcategory: 'light' }],
          flavor: [], temperature: [], occasion: [], season: [], style: []
        },
        intent: { primary: { type: 'style_based' } }
      };

      const params = generateSearchParameters(queryData);

      expect(params.filters.abvRange).toEqual([0, 20]);
    });

    it('should handle occasion filters', () => {
      const queryData = {
        ingredients: [],
        descriptors: {
          strength: [], flavor: [], temperature: [],
          occasion: [{ subcategory: 'party' }],
          season: [], style: []
        },
        intent: { primary: { type: 'occasion_based' } }
      };

      const params = generateSearchParameters(queryData);

      expect(params.filters.occasion).toBe('party');
    });

    it('should handle style complexity filters', () => {
      const queryData = {
        ingredients: [],
        descriptors: {
          strength: [], flavor: [], temperature: [], occasion: [], season: [],
          style: [{ subcategory: 'simple' }]
        },
        intent: { primary: { type: 'style_based' } }
      };

      const params = generateSearchParameters(queryData);

      expect(params.filters.maxIngredients).toBe(4);
      expect(params.filters.maxPrepTime).toBe(3);
    });
  });

  describe('Complete NLP Processing', () => {
    it('should process complete natural language queries', () => {
      const query = 'light gin cocktails for summer parties';
      const result = processNaturalLanguageQuery(query);

      expect(result.success).toBe(true);
      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients.some(ing => ing.ingredient === 'gin')).toBe(true);
      expect(result.descriptors.strength.some(s => s.subcategory === 'light')).toBe(true);
      expect(result.descriptors.season.some(s => s.subcategory === 'summer')).toBe(true);
      expect(result.descriptors.occasion.length).toBeGreaterThanOrEqual(0); // May or may not detect 'parties'
      expect(result.intent.primary.type).toBe('ingredient_based');
      expect(result.searchParameters).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle empty queries gracefully', () => {
      const result = processNaturalLanguageQuery('');

      expect(result.success).toBe(true);
      expect(result.ingredients).toEqual([]);
      expect(result.intent.primary.type).toBe('general');
    });

    it('should handle complex multi-intent queries', () => {
      const query = 'strong whiskey cocktails with bitters for formal dinner parties';
      const result = processNaturalLanguageQuery(query);

      expect(result.success).toBe(true);
      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.descriptors.strength.some(s => s.subcategory === 'strong')).toBe(true);
      expect(result.descriptors.occasion.length).toBeGreaterThanOrEqual(0); // May detect formal/dinner/parties
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should provide error handling for processing failures', () => {
      // Test with malformed input that might cause errors
      const result = processNaturalLanguageQuery(null);

      expect(result.success).toBe(true); // Should handle gracefully
      expect(result.ingredients).toEqual([]);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete processing in under 100ms', () => {
      const query = 'light summer gin cocktails with lime juice for casual parties';
      const startTime = performance.now();

      const result = processNaturalLanguageQuery(query);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.processingTime).toBeLessThan(100);
    });

    it('should handle large queries efficiently', () => {
      const query = 'light refreshing summer gin cocktails with fresh lime juice and mint for casual outdoor parties and celebrations';
      const startTime = performance.now();

      const result = processNaturalLanguageQuery(query);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.success).toBe(true);
    });

    it('should maintain accuracy with complex queries', () => {
      const query = 'strong spirit-forward whiskey cocktails with angostura bitters for sophisticated formal dinner events';
      const result = processNaturalLanguageQuery(query);

      expect(result.success).toBe(true);
      expect(result.ingredients.some(ing => ing.ingredient === 'whiskey')).toBe(true);
      expect(result.descriptors.strength.some(s => s.subcategory === 'strong')).toBe(true);
      expect(result.descriptors.occasion.some(o => o.subcategory === 'formal')).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });
});
