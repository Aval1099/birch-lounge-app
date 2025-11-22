// =============================================================================
// ADVANCED SEARCH HOOK
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from './useDebounce';
import type { AdvancedSearchOptions, SearchResult } from '../types/hooks';

/**
 * Advanced search hook with multi-field search, fuzzy matching, and performance optimization
 * @param data - Array of items to search
 * @param options - Search configuration options
 * @returns Search state and handlers
 */
export const useAdvancedSearch = <T = any>(data: T[] = [], options: AdvancedSearchOptions = {}) => {
  const {
    searchFields = ['name'], // Fields to search in
    delay = 100, // Debounce delay for <100ms response
    fuzzyThreshold = 0.6, // Fuzzy matching threshold
    maxResults = 100, // Maximum results to return
    enableFuzzy = true, // Enable fuzzy matching
    enableHighlight = true, // Enable search term highlighting
    caseSensitive = false, // Case sensitive search
    exactMatch = false, // Require exact matches
    sortByRelevance = true // Sort results by relevance score
  } = options;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
    lastSearchTerm: ''
  });

  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const searchStartTime = useRef<number | null>(null);

  // Optimized fuzzy matching algorithm
  const fuzzyMatch = useCallback((text: string, pattern: string): boolean => {
    if (!enableFuzzy) {
      const textLower = caseSensitive ? text : text.toLowerCase();
      const patternLower = caseSensitive ? pattern : pattern.toLowerCase();
      return textLower.includes(patternLower);
    }

    const textLower = caseSensitive ? text : text.toLowerCase();
    const patternLower = caseSensitive ? pattern : pattern.toLowerCase();

    if (exactMatch) return textLower === patternLower;
    if (textLower.includes(patternLower)) return true;

    // Use simpler fuzzy matching for performance
    // Only use Levenshtein for short strings to avoid O(n*m) performance issues
    if (patternLower.length > 10 || textLower.length > 50) {
      // For longer strings, use word-based matching instead of full Levenshtein
      const patternWords = patternLower.split(/\s+/);
      return patternWords.some((word: string) => textLower.includes(word));
    }

    // Optimized Levenshtein distance for short strings only
    const matrix = Array(patternLower.length + 1).fill(null).map(() =>
      Array(textLower.length + 1).fill(null)
    );

    for (let i = 0; i <= textLower.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= patternLower.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= patternLower.length; j++) {
      for (let i = 1; i <= textLower.length; i++) {
        const indicator = patternLower[j - 1] === textLower[i - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[patternLower.length][textLower.length];
    const similarity = 1 - distance / Math.max(textLower.length, patternLower.length);

    return similarity >= fuzzyThreshold;
  }, [enableFuzzy, caseSensitive, exactMatch, fuzzyThreshold]);

  // Get nested object value by path
  const getNestedValue = useCallback((obj: any, path: string): string => {
    return path.split('.').reduce((current: any, key: string) => {
      if (Array.isArray(current)) {
        return current.map(item => item[key]).join(' ');
      }
      return current?.[key];
    }, obj);
  }, []);

  // Calculate relevance score for search results
  const calculateRelevance = useCallback((item: T, searchTerms: string): number => {
    let score = 0;
    const terms = searchTerms.toLowerCase().split(/\s+/).filter(Boolean);

    searchFields.forEach((field: string, fieldIndex: number) => {
      const fieldValue = getNestedValue(item, field);
      if (!fieldValue) return;

      const fieldText = String(fieldValue).toLowerCase();

      terms.forEach((term: string, termIndex: number) => {
        // Exact match bonus
        if (fieldText.includes(term)) {
          score += 10;

          // Start of field bonus
          if (fieldText.startsWith(term)) {
            score += 5;
          }

          // Field priority bonus (earlier fields get higher scores)
          score += (searchFields.length - fieldIndex) * 2;

          // Term position bonus (earlier terms get higher scores)
          score += (terms.length - termIndex);
        }

        // Fuzzy match bonus (lower than exact)
        else if (fuzzyMatch(fieldText, term)) {
          score += 3;
        }
      });
    });

    return score;
  }, [searchFields, fuzzyMatch, getNestedValue]);

  // Highlight search terms in text
  const highlightText = useCallback((text: string, searchTerms: string): string => {
    if (!enableHighlight || !searchTerms) return text;

    const terms = searchTerms.split(/\s+/).filter(Boolean);
    let highlightedText = text;

    terms.forEach((term: string) => {
      const regex = new RegExp(`(${term})`, caseSensitive ? 'g' : 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  }, [enableHighlight, caseSensitive]);

  // Apply additional filters
  const applyFilters = useCallback((items: T[]): T[] => {
    return items.filter((item: T) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'All') return true;

        const itemValue = getNestedValue(item, key);
        if (Array.isArray(itemValue)) {
          return itemValue.some(v => String(v).toLowerCase().includes(String(value).toLowerCase()));
        }
        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      });
    });
  }, [filters, getNestedValue]);

  // Main search function
  const searchResults = useMemo(() => {
    const startTime = performance.now();

    if (!debouncedSearchTerm.trim()) {
      const filtered = applyFilters(data);
      return {
        results: filtered.slice(0, maxResults),
        stats: {
          totalResults: filtered.length,
          searchTime: performance.now() - startTime,
          lastSearchTerm: ''
        }
      };
    }

    // Filter by search term
    const searchMatches = data.filter(item => {
      return searchFields.some((field: string) => {
        const fieldValue = getNestedValue(item, field);
        if (!fieldValue) return false;

        const fieldText = String(fieldValue);
        return fuzzyMatch(fieldText, debouncedSearchTerm);
      });
    });

    // Apply additional filters
    const filtered = applyFilters(searchMatches);

    // Calculate relevance scores
    const withScores = filtered.map((item: T): SearchResult<T> => ({
      ...item,
      _relevanceScore: calculateRelevance(item, debouncedSearchTerm),
      _highlightedFields: enableHighlight ? searchFields.reduce((acc: Record<string, string>, field: string) => {
        const value = getNestedValue(item, field);
        if (value) {
          acc[field] = highlightText(String(value), debouncedSearchTerm);
        }
        return acc;
      }, {}) : {}
    }));

    // Sort results
    let sorted = withScores;
    if (sortByRelevance && sortBy === 'relevance') {
      sorted = withScores.sort((a: SearchResult<T>, b: SearchResult<T>) => b._relevanceScore - a._relevanceScore);
    } else if (sortBy !== 'relevance') {
      sorted = withScores.sort((a: SearchResult<T>, b: SearchResult<T>) => {
        const aValue = getNestedValue(a, sortBy);
        const bValue = getNestedValue(b, sortBy);

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        return (Number(aValue) || 0) - (Number(bValue) || 0);
      });
    }

    const results = sorted.slice(0, maxResults);

    return {
      results,
      stats: {
        totalResults: results.length,
        searchTime: performance.now() - startTime,
        lastSearchTerm: debouncedSearchTerm
      }
    };
  }, [
    data,
    debouncedSearchTerm,
    searchFields,
    fuzzyMatch,
    applyFilters,
    calculateRelevance,
    enableHighlight,
    highlightText,
    maxResults,
    sortBy,
    sortByRelevance,
    getNestedValue
  ]);

  // Update search stats when results change (memoized to prevent unnecessary updates)
  useEffect(() => {
    if (searchResults.stats) {
      setSearchStats(prev => {
        const newStats = searchResults.stats;
        // Only update if stats actually changed
        if (prev.totalResults !== newStats.totalResults ||
          prev.lastSearchTerm !== newStats.lastSearchTerm ||
          Math.abs(prev.searchTime - newStats.searchTime) > 0.1) {
          return newStats;
        }
        return prev;
      });
    }
  }, [searchResults]);

  // Track search state
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
      searchStartTime.current = performance.now();
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Update search history
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length > 2) {
      setSearchHistory((prev: string[]) => {
        const newHistory = [debouncedSearchTerm, ...prev.filter(term => term !== debouncedSearchTerm)];
        return newHistory.slice(0, 10); // Keep last 10 searches
      });
    }
  }, [debouncedSearchTerm]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    // Search state
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    searchResults: searchResults.results,
    searchStats,

    // Filters
    filters,
    updateFilters,
    clearFilters,

    // Sorting
    sortBy,
    setSortBy,

    // History
    searchHistory,
    clearHistory,

    // Actions
    clearSearch,

    // Utilities
    highlightText: (text: string) => highlightText(text, debouncedSearchTerm),
    getRelevanceScore: (item: T) => calculateRelevance(item, debouncedSearchTerm)
  };
};
