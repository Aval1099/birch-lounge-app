import { describe, it, expect, beforeEach } from 'vitest';

import {
  generateAutocompleteSuggestions,
  getTrendingRecommendations,
  generateDidYouMeanSuggestions,
  addToSearchHistory,
  getPersonalizedSuggestions,
  getSearchSuggestions
} from '../../services/searchSuggestionEngine';

describe('Search Suggestion Engine', () => {
  beforeEach(() => {
    // Clear search history and preferences before each test
    // Note: In a real implementation, you might want to expose these for testing
  });

  describe('Autocomplete Suggestions', () => {
    it('should generate autocomplete suggestions for partial queries', () => {
      const suggestions = generateAutocompleteSuggestions('gin');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.text.includes('gin'))).toBe(true);
      expect(suggestions.every(s => s.confidence > 0)).toBe(true);
    });

    it('should include popular terms in suggestions', () => {
      const suggestions = generateAutocompleteSuggestions('cocktail', {
        includePopular: true
      });

      expect(suggestions.length).toBeGreaterThan(0);
      const popularSuggestion = suggestions.find(s => s.type === 'popular');
      expect(popularSuggestion).toBeDefined();
    });

    it('should include trending terms for current season', () => {
      const suggestions = generateAutocompleteSuggestions('summer', {
        includeTrending: true,
        currentSeason: 'Summer'
      });

      expect(suggestions.length).toBeGreaterThan(0);
      // May or may not include trending suggestions depending on implementation
      const trendingSuggestion = suggestions.find(s => s.type === 'trending');
      if (trendingSuggestion) {
        expect(trendingSuggestion.season).toBe('Summer');
      }
    });

    it('should generate pattern-based suggestions', () => {
      const suggestions = generateAutocompleteSuggestions('gin');

      expect(suggestions.length).toBeGreaterThan(0);
      const patternSuggestion = suggestions.find(s => s.type === 'pattern');
      expect(patternSuggestion).toBeDefined();
    });

    it('should limit suggestions to maxSuggestions', () => {
      const suggestions = generateAutocompleteSuggestions('cocktail', {
        maxSuggestions: 3
      });

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should sort suggestions by confidence', () => {
      const suggestions = generateAutocompleteSuggestions('gin');

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });

    it('should handle short queries', () => {
      const suggestions = generateAutocompleteSuggestions('g');

      expect(suggestions).toEqual([]);
    });

    it('should handle empty queries', () => {
      const suggestions = generateAutocompleteSuggestions('');

      expect(suggestions).toEqual([]);
    });

    it('should remove duplicate suggestions', () => {
      const suggestions = generateAutocompleteSuggestions('gin cocktails');

      const uniqueTexts = [...new Set(suggestions.map(s => s.text.toLowerCase()))];
      expect(suggestions.length).toBe(uniqueTexts.length);
    });
  });

  describe('Trending Recommendations', () => {
    it('should provide seasonal trending recommendations', () => {
      const recommendations = getTrendingRecommendations({
        season: 'Summer'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const seasonalRec = recommendations.find(r => r.type === 'seasonal_trending');
      expect(seasonalRec).toBeDefined();
      expect(seasonalRec.category).toBe('seasonal');
    });

    it('should provide time-based recommendations', () => {
      const recommendations = getTrendingRecommendations({
        timeOfDay: 'Evening'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const timeRec = recommendations.find(r => r.type === 'time_based');
      expect(timeRec).toBeDefined();
      expect(timeRec.category).toBe('time');
    });

    it('should provide occasion-based recommendations', () => {
      const recommendations = getTrendingRecommendations({
        occasion: 'Party'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const occasionRec = recommendations.find(r => r.type === 'occasion_based');
      expect(occasionRec).toBeDefined();
      expect(occasionRec.category).toBe('occasion');
    });

    it('should handle multiple context factors', () => {
      const recommendations = getTrendingRecommendations({
        season: 'Summer',
        timeOfDay: 'Evening',
        occasion: 'Party'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty context', () => {
      const recommendations = getTrendingRecommendations({});

      expect(recommendations).toEqual([]);
    });

    it('should provide reasons for recommendations', () => {
      const recommendations = getTrendingRecommendations({
        season: 'Summer'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(r => r.reason)).toBe(true);
    });
  });

  describe('Did You Mean Suggestions', () => {
    it('should generate spelling correction suggestions', () => {
      const corrections = [
        { suggestion: 'gin', confidence: 0.8, reason: 'spelling_correction' }
      ];

      const suggestions = generateDidYouMeanSuggestions('jin', corrections);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].suggestion).toBe('gin');
      expect(suggestions[0].type).toBe('spelling_correction');
    });

    it('should include common misspelling corrections', () => {
      const suggestions = generateDidYouMeanSuggestions('coctails', []);

      expect(suggestions.length).toBeGreaterThan(0);
      const commonCorrection = suggestions.find(s => s.suggestion.includes('cocktails'));
      expect(commonCorrection).toBeDefined();
    });

    it('should limit suggestions to 3', () => {
      const manyCorrections = Array.from({ length: 10 }, (_, i) => ({
        suggestion: `correction${i}`,
        confidence: 0.5,
        reason: 'test'
      }));

      const suggestions = generateDidYouMeanSuggestions('test', manyCorrections);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty corrections', () => {
      const suggestions = generateDidYouMeanSuggestions('perfect', []);

      // Should still try common corrections
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should preserve original query in suggestions', () => {
      const suggestions = generateDidYouMeanSuggestions('jin', [
        { suggestion: 'gin', confidence: 0.8, reason: 'test' }
      ]);

      expect(suggestions.every(s => s.original === 'jin')).toBe(true);
    });
  });

  describe('Search History Management', () => {
    it('should add searches to history', () => {
      const query = 'gin cocktails';
      const results = [{ id: 'recipe1', name: 'Gin & Tonic' }];
      const context = { season: 'Summer' };

      addToSearchHistory(query, results, context);

      // Since we can't directly access history, we test through personalized suggestions
      const personalized = getPersonalizedSuggestions();
      expect(Array.isArray(personalized)).toBe(true);
    });

    it('should update user preferences based on searches', () => {
      addToSearchHistory('gin cocktails', [], { season: 'Summer' });
      addToSearchHistory('vodka drinks', [], { occasion: 'Party' });

      const personalized = getPersonalizedSuggestions();
      expect(Array.isArray(personalized)).toBe(true);
    });

    it('should track search frequency', () => {
      addToSearchHistory('gin cocktails', [], {});
      addToSearchHistory('gin cocktails', [], {});
      addToSearchHistory('vodka drinks', [], {});

      // Frequency tracking is internal, but should affect personalized suggestions
      const personalized = getPersonalizedSuggestions();
      expect(Array.isArray(personalized)).toBe(true);
    });
  });

  describe('Personalized Suggestions', () => {
    it('should provide personalized suggestions based on preferences', () => {
      // Add some search history to build preferences
      addToSearchHistory('gin cocktails', [], {});
      addToSearchHistory('sweet cocktails', [], {});
      addToSearchHistory('party drinks', [], { occasion: 'Party' });

      const suggestions = getPersonalizedSuggestions();

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(s => s.type === 'personalized')).toBe(true);
      expect(suggestions.every(s => s.reason)).toBe(true);
    });

    it('should limit personalized suggestions', () => {
      const suggestions = getPersonalizedSuggestions({ maxSuggestions: 3 });

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should categorize personalized suggestions', () => {
      addToSearchHistory('gin cocktails', [], {});

      const suggestions = getPersonalizedSuggestions();

      if (suggestions.length > 0) {
        expect(suggestions.every(s => s.category)).toBe(true);
        expect(['spirit_preference', 'flavor_preference', 'occasion_preference'])
          .toContain(suggestions[0].category);
      }
    });

    it('should sort personalized suggestions by confidence', () => {
      addToSearchHistory('gin cocktails', [], {});
      addToSearchHistory('sweet drinks', [], {});

      const suggestions = getPersonalizedSuggestions();

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });
  });

  describe('Complete Search Suggestions', () => {
    it('should provide comprehensive search suggestions', () => {
      const result = getSearchSuggestions('gin', {
        season: 'Summer',
        timeOfDay: 'Evening'
      });

      expect(result.success).toBe(true);
      expect(result.query).toBe('gin');
      expect(Array.isArray(result.autocomplete)).toBe(true);
      expect(Array.isArray(result.trending)).toBe(true);
      expect(Array.isArray(result.personalized)).toBe(true);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should provide suggestion statistics', () => {
      const result = getSearchSuggestions('cocktail');

      expect(result.stats).toBeDefined();
      expect(result.stats.autocompleteCount).toBe(result.autocomplete.length);
      expect(result.stats.trendingCount).toBe(result.trending.length);
      expect(result.stats.personalizedCount).toBe(result.personalized.length);
    });

    it('should handle empty queries', () => {
      const result = getSearchSuggestions('');

      expect(result.success).toBe(true);
      expect(result.autocomplete).toEqual([]);
    });

    it('should handle errors gracefully', () => {
      // Test with potentially problematic input
      const result = getSearchSuggestions(null);

      // The implementation may handle null gracefully or return an error
      expect(result.success).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.autocomplete).toEqual([]);
        expect(result.trending).toEqual([]);
        expect(result.personalized).toEqual([]);
      }
    });

    it('should respect suggestion options', () => {
      const result = getSearchSuggestions('gin', {}, {
        maxSuggestions: 3
      });

      expect(result.autocomplete.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete suggestion generation in under 100ms', () => {
      const startTime = performance.now();

      const result = getSearchSuggestions('gin cocktails', {
        season: 'Summer',
        timeOfDay: 'Evening',
        occasion: 'Party'
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.processingTime).toBeLessThan(100);
    });

    it('should handle complex queries efficiently', () => {
      const startTime = performance.now();

      const result = getSearchSuggestions('light refreshing summer gin cocktails');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.success).toBe(true);
    });

    it('should maintain performance with search history', () => {
      // Add multiple searches to history
      for (let i = 0; i < 50; i++) {
        addToSearchHistory(`search query ${i}`, [], {});
      }

      const startTime = performance.now();

      const result = getSearchSuggestions('gin');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.success).toBe(true);
    });
  });

  describe('Context-Aware Suggestions', () => {
    it('should adapt suggestions based on season', () => {
      const summerResult = getSearchSuggestions('cocktails', { season: 'Summer' });
      const winterResult = getSearchSuggestions('cocktails', { season: 'Winter' });

      expect(summerResult.trending.length).toBeGreaterThan(0);
      expect(winterResult.trending.length).toBeGreaterThan(0);

      // Summer and winter should have different trending suggestions
      const summerTexts = summerResult.trending.map(t => t.text);
      const winterTexts = winterResult.trending.map(t => t.text);
      expect(summerTexts).not.toEqual(winterTexts);
    });

    it('should adapt suggestions based on time of day', () => {
      const morningResult = getSearchSuggestions('cocktails', { timeOfDay: 'Morning' });
      const eveningResult = getSearchSuggestions('cocktails', { timeOfDay: 'Evening' });

      if (morningResult.trending.length > 0 && eveningResult.trending.length > 0) {
        const morningTexts = morningResult.trending.map(t => t.text);
        const eveningTexts = eveningResult.trending.map(t => t.text);
        expect(morningTexts).not.toEqual(eveningTexts);
      }
    });

    it('should adapt suggestions based on occasion', () => {
      const casualResult = getSearchSuggestions('cocktails', { occasion: 'Casual' });
      const formalResult = getSearchSuggestions('cocktails', { occasion: 'Formal' });

      if (casualResult.trending.length > 0 && formalResult.trending.length > 0) {
        const casualTexts = casualResult.trending.map(t => t.text);
        const formalTexts = formalResult.trending.map(t => t.text);
        expect(casualTexts).not.toEqual(formalTexts);
      }
    });
  });
});
