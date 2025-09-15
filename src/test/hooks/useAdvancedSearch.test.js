import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';

// Mock data for testing
const mockData = [
  {
    id: 1,
    name: 'Old Fashioned',
    category: 'Whiskey',
    ingredients: [
      { name: 'Bourbon' },
      { name: 'Simple Syrup' },
      { name: 'Angostura Bitters' }
    ],
    description: 'Classic whiskey cocktail',
    tags: ['classic', 'spirit-forward'],
    difficulty: 'Easy'
  },
  {
    id: 2,
    name: 'Margarita',
    category: 'Tequila',
    ingredients: [
      { name: 'Tequila' },
      { name: 'Lime Juice' },
      { name: 'Cointreau' }
    ],
    description: 'Refreshing tequila cocktail',
    tags: ['citrus', 'refreshing'],
    difficulty: 'Easy'
  },
  {
    id: 3,
    name: 'Paper Plane',
    category: 'Whiskey',
    ingredients: [
      { name: 'Rye Whiskey' },
      { name: 'Amaro Nonino' },
      { name: 'Aperol' },
      { name: 'Lemon Juice' }
    ],
    description: 'Modern whiskey cocktail with amaro',
    tags: ['modern', 'bitter'],
    difficulty: 'Intermediate'
  }
];

describe('useAdvancedSearch', () => {
  let result;

  beforeEach(() => {
    const { result: hookResult } = renderHook(() =>
      useAdvancedSearch(mockData, {
        searchFields: ['name', 'category', 'ingredients.name', 'description', 'tags'],
        delay: 50, // Longer delay for reliable testing
        fuzzyThreshold: 0.6,
        maxResults: 10,
        enableFuzzy: false, // Disable fuzzy for basic tests to get exact matches
        enableHighlight: true
      })
    );
    result = hookResult;
  });

  describe('Basic Search Functionality', () => {
    it('should return all items when search term is empty', () => {
      expect(result.current.searchResults).toHaveLength(3);
      expect(result.current.searchResults).toEqual(mockData);
    });

    it('should filter items by name', async () => {
      await act(async () => {
        result.current.setSearchTerm('Margarita'); // Unique name that won't match other fields
      });

      // Wait for debounce to complete with extra time for test environment
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Verify debounced search term is set correctly
      expect(result.current.debouncedSearchTerm).toBe('Margarita');

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].name).toBe('Margarita');
    });

    it('should filter items by category', async () => {
      await act(async () => {
        result.current.setSearchTerm('Tequila'); // Unique category
      });

      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].category).toBe('Tequila');
    });

    it('should filter items by ingredient name', async () => {
      await act(async () => {
        result.current.setSearchTerm('Cointreau'); // Unique ingredient
      });
      
      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].name).toBe('Margarita');
    });

    it('should filter items by description', async () => {
      await act(async () => {
        result.current.setSearchTerm('refreshing'); // Unique description word (case sensitive)
      });

      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].name).toBe('Margarita');
    });

    it('should filter items by tags', async () => {
      await act(async () => {
        result.current.setSearchTerm('citrus'); // Unique tag
      });

      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].name).toBe('Margarita');
    });
  });

  describe('Search Performance', () => {
    it('should complete search in under 100ms', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
      });

      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.searchStats.searchTime).toBeLessThan(100);
    });

    it('should track search statistics', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
      });

      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.searchStats.totalResults).toBe(2);
      expect(result.current.searchStats.lastSearchTerm).toBe('whiskey');
      expect(result.current.searchStats.searchTime).toBeGreaterThan(0);
    });

    it('should show searching state during debounce', async () => {
      act(() => {
        result.current.setSearchTerm('test');
      });

      expect(result.current.isSearching).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('Fuzzy Matching', () => {
    let fuzzyResult;

    beforeEach(() => {
      const { result: hookResult } = renderHook(() =>
        useAdvancedSearch(mockData, {
          searchFields: ['name', 'category', 'ingredients.name', 'description', 'tags'],
          delay: 10,
          fuzzyThreshold: 0.6,
          maxResults: 10,
          enableFuzzy: true, // Enable fuzzy for these tests
          enableHighlight: true
        })
      );
      fuzzyResult = hookResult;
    });

    it('should find items with typos using fuzzy matching', async () => {
      await act(async () => {
        fuzzyResult.current.setSearchTerm('Margrita'); // Typo in Margarita
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(fuzzyResult.current.searchResults).toHaveLength(1);
      expect(fuzzyResult.current.searchResults[0].name).toBe('Margarita');
    });

    it('should handle partial matches', async () => {
      await act(async () => {
        fuzzyResult.current.setSearchTerm('Marg');
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(fuzzyResult.current.searchResults).toHaveLength(1);
      expect(fuzzyResult.current.searchResults[0].name).toBe('Margarita');
    });
  });

  describe('Sorting and Relevance', () => {
    it('should sort by relevance by default', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      const results = result.current.searchResults;
      expect(results).toHaveLength(2);
      
      // Results should have relevance scores
      expect(results[0]._relevanceScore).toBeDefined();
      expect(results[1]._relevanceScore).toBeDefined();
      
      // Should be sorted by relevance (higher scores first)
      expect(results[0]._relevanceScore).toBeGreaterThanOrEqual(results[1]._relevanceScore);
    });

    it('should allow custom sorting', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
        result.current.setSortBy('name');
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      const results = result.current.searchResults;
      expect(results[0].name).toBe('Old Fashioned');
      expect(results[1].name).toBe('Paper Plane');
    });
  });

  describe('Filters', () => {
    it('should apply additional filters', async () => {
      await act(async () => {
        result.current.updateFilters({ difficulty: 'Easy' });
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.searchResults).toHaveLength(2);
      expect(result.current.searchResults.every(item => item.difficulty === 'Easy')).toBe(true);
    });

    it('should combine search and filters', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
        result.current.updateFilters({ difficulty: 'Easy' });
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].name).toBe('Old Fashioned');
    });

    it('should clear filters', async () => {
      await act(async () => {
        result.current.updateFilters({ difficulty: 'Easy' });
        result.current.clearFilters();
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.searchResults).toHaveLength(3);
      expect(result.current.filters).toEqual({});
    });
  });

  describe('Search History', () => {
    it('should track search history', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      await act(async () => {
        result.current.setSearchTerm('tequila');
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.searchHistory).toContain('whiskey');
      expect(result.current.searchHistory).toContain('tequila');
    });

    it('should limit search history to 10 items', async () => {
      // Add 12 search terms
      for (let i = 0; i < 12; i++) {
        await act(async () => {
          result.current.setSearchTerm(`search${i}`);
          await new Promise(resolve => setTimeout(resolve, 20));
        });
      }

      expect(result.current.searchHistory).toHaveLength(10);
    });

    it('should clear search history', async () => {
      await act(async () => {
        result.current.setSearchTerm('test');
        await new Promise(resolve => setTimeout(resolve, 20));
        result.current.clearHistory();
      });

      expect(result.current.searchHistory).toHaveLength(0);
    });
  });

  describe('Utility Functions', () => {
    it('should clear search', async () => {
      await act(async () => {
        result.current.setSearchTerm('test');
        result.current.clearSearch();
      });

      expect(result.current.searchTerm).toBe('');
    });

    it('should highlight search terms', async () => {
      await act(async () => {
        result.current.setSearchTerm('whiskey');
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      const highlighted = result.current.highlightText('This is a whiskey cocktail');
      expect(highlighted).toContain('<mark>whiskey</mark>');
    });
  });
});
