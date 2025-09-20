/**
 * Advanced Search Engine for Recipe Discovery
 * Main orchestrator that combines natural language processing, fuzzy search,
 * advanced filtering, and smart suggestions for comprehensive recipe search.
 */

import { applyAdvancedFilters } from './advancedFilterEngine.js';
import { getContextualRecommendations } from './contextualRecommendationEngine.js';
import { performFuzzySearch } from './fuzzySearchEngine.js';
import { processNaturalLanguageQuery } from './naturalLanguageProcessor.js';
import { getSearchSuggestions, addToSearchHistory, generateDidYouMeanSuggestions } from './searchSuggestionEngine.js';
import { getIngredientBasedRecommendations } from './smartRecommendationEngine.js';

/**
 * Search result ranking weights
 */
const RANKING_WEIGHTS = {
  exactMatch: 1.0,
  fuzzyMatch: 0.8,
  ingredientMatch: 0.9,
  contextualMatch: 0.7,
  similarityMatch: 0.6,
  popularityBoost: 0.2,
  favoriteBoost: 0.3,
  recentBoost: 0.1
};

/**
 * Search performance cache
 */
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

/**
 * Clean expired cache entries
 */
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
};

/**
 * Generate cache key for search parameters
 * @param {string} query - Search query
 * @param {Object} filters - Applied filters
 * @param {Object} context - Search context
 * @returns {string} Cache key
 */
const generateCacheKey = (query, filters, context) => {
  return JSON.stringify({ query: query.toLowerCase().trim(), filters, context });
};

/**
 * Score and rank search results
 * @param {Array} results - Search results
 * @param {Object} searchParams - Search parameters
 * @param {Object} context - Search context
 * @returns {Array} Ranked results
 */
const scoreAndRankResults = (results, searchParams, context) => {
  return results.map(result => {
    let score = 0;
    const factors = [];

    // Base relevance score
    if (result.relevanceScore) {
      score += result.relevanceScore * 0.4;
      factors.push({ type: 'relevance', value: result.relevanceScore, weight: 0.4 });
    }

    // Ingredient match score
    if (result.ingredientMatchScore) {
      score += result.ingredientMatchScore * RANKING_WEIGHTS.ingredientMatch * 0.3;
      factors.push({ type: 'ingredient_match', value: result.ingredientMatchScore, weight: 0.3 });
    }

    // Contextual match score
    if (result.contextualScore) {
      score += result.contextualScore * RANKING_WEIGHTS.contextualMatch * 0.2;
      factors.push({ type: 'contextual', value: result.contextualScore, weight: 0.2 });
    }

    // Popularity boost
    if (result.recipe.popularity) {
      const popularityScore = result.recipe.popularity * RANKING_WEIGHTS.popularityBoost;
      score += popularityScore;
      factors.push({ type: 'popularity', value: result.recipe.popularity, weight: RANKING_WEIGHTS.popularityBoost });
    }

    // Favorite boost
    if (result.recipe.isFavorite) {
      score += RANKING_WEIGHTS.favoriteBoost;
      factors.push({ type: 'favorite', value: 1, weight: RANKING_WEIGHTS.favoriteBoost });
    }

    // Quality score boost
    if (result.recipe.qualityScore) {
      const qualityBoost = (result.recipe.qualityScore / 100) * 0.1;
      score += qualityBoost;
      factors.push({ type: 'quality', value: result.recipe.qualityScore, weight: 0.1 });
    }

    return {
      ...result,
      finalScore: Math.min(1.0, score),
      scoringFactors: factors
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
};

/**
 * Perform comprehensive recipe search
 * @param {string} query - Search query
 * @param {Array} recipes - Recipe collection
 * @param {Object} options - Search options
 * @returns {Object} Search results
 */
export const performAdvancedSearch = async (query, recipes = [], options = {}) => {
  const startTime = performance.now();

  try {
    const {
      filters = {},
      context = {},
      maxResults = 20,
      includeFilters = true,
      includeSuggestions = true,
      useCache = true,
      sessionId = 'default'
    } = options;

    // Check cache first
    const cacheKey = generateCacheKey(query, filters, context);
    if (useCache && searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return {
          ...cached.result,
          fromCache: true,
          processingTime: performance.now() - startTime
        };
      }
    }

    // Clean cache periodically
    if (searchCache.size > MAX_CACHE_SIZE) {
      cleanCache();
    }

    let searchResults = [];
    let nlpResults = null;
    let fuzzyResults = null;
    const didYouMean = [];

    // Step 1: Natural Language Processing
    if (query && query.trim().length > 0) {
      nlpResults = processNaturalLanguageQuery(query);
      
      if (!nlpResults.success) {
        throw new Error(`NLP processing failed: ${nlpResults.error}`);
      }

      // Step 2: Fuzzy Search for ingredient matching
      if (nlpResults.ingredients.length > 0) {
        const ingredientNames = recipes.flatMap(recipe => 
          recipe.ingredients ? recipe.ingredients.map(ing => ing.name) : []
        );
        
        for (const ingredient of nlpResults.ingredients) {
          fuzzyResults = performFuzzySearch(ingredient.ingredient, ingredientNames);
          
          if (fuzzyResults.corrections.length > 0) {
            didYouMean.push(...generateDidYouMeanSuggestions(ingredient.ingredient, fuzzyResults.corrections));
          }
        }
      }

      // Step 3: Search based on intent
      switch (nlpResults.intent.primary.type) {
        case 'ingredient_based':
          searchResults = await performIngredientBasedSearch(nlpResults, recipes);
          break;
        case 'style_based':
          searchResults = await performStyleBasedSearch(nlpResults, recipes, context);
          break;
        case 'occasion_based':
          searchResults = await performOccasionBasedSearch(nlpResults, recipes, context);
          break;
        case 'seasonal_based':
          searchResults = await performSeasonalBasedSearch(nlpResults, recipes, context);
          break;
        default:
          searchResults = await performGeneralSearch(nlpResults, recipes, context);
      }
    } else {
      // Empty query - return contextual recommendations
      searchResults = await performContextualSearch(recipes, context);
    }

    // Step 4: Apply advanced filters
    let filteredResults = searchResults;
    let filterResults = null;
    
    if (includeFilters && Object.keys(filters).length > 0) {
      const recipesToFilter = searchResults.map(result => result.recipe);
      filterResults = applyAdvancedFilters(recipesToFilter, filters);
      
      if (filterResults.success) {
        filteredResults = searchResults.filter(result => 
          filterResults.recipes.includes(result.recipe)
        );
      }
    }

    // Step 5: Score and rank results
    const rankedResults = scoreAndRankResults(filteredResults, nlpResults?.searchParameters || {}, context);

    // Step 6: Limit results
    const finalResults = rankedResults.slice(0, maxResults);

    // Step 7: Generate suggestions if requested
    let suggestions = null;
    if (includeSuggestions) {
      suggestions = getSearchSuggestions(query, context, { maxSuggestions: 5 });
    }

    const processingTime = performance.now() - startTime;

    const result = {
      success: true,
      query,
      results: finalResults,
      totalResults: rankedResults.length,
      processingTime,
      nlpAnalysis: nlpResults,
      fuzzyMatches: fuzzyResults,
      didYouMean: didYouMean.slice(0, 3),
      appliedFilters: filterResults?.appliedFilters || [],
      suggestions,
      stats: {
        originalRecipeCount: recipes.length,
        searchResultCount: searchResults.length,
        filteredResultCount: filteredResults.length,
        finalResultCount: finalResults.length,
        cacheHit: false
      }
    };

    // Cache the result
    if (useCache) {
      searchCache.set(cacheKey, {
        result: { ...result, fromCache: false },
        timestamp: Date.now()
      });
    }

    // Add to search history
    addToSearchHistory(query, finalResults, { ...context, sessionId });

    return result;

  } catch (error) {
    return {
      success: false,
      error: error.message,
      query,
      results: [],
      totalResults: 0,
      processingTime: performance.now() - startTime,
      stats: {
        originalRecipeCount: recipes.length,
        searchResultCount: 0,
        filteredResultCount: 0,
        finalResultCount: 0,
        cacheHit: false
      }
    };
  }
};

/**
 * Perform ingredient-based search
 * @param {Object} nlpResults - NLP analysis results
 * @param {Array} recipes - Recipe collection
 * @returns {Array} Search results
 */
const performIngredientBasedSearch = async (nlpResults, recipes) => {
  const availableIngredients = nlpResults.ingredients.map(ing => ({
    name: ing.ingredient,
    available: true
  }));

  const recommendations = getIngredientBasedRecommendations(availableIngredients, recipes);
  
  return recommendations.map(rec => ({
    recipe: rec.recipe,
    relevanceScore: rec.analysis.confidence / 100,
    ingredientMatchScore: rec.analysis.confidence / 100,
    matchType: 'ingredient_based',
    matchDetails: rec.analysis
  }));
};

/**
 * Perform style-based search
 * @param {Object} nlpResults - NLP analysis results
 * @param {Array} recipes - Recipe collection
 * @param {Object} context - Search context
 * @returns {Array} Search results
 */
const performStyleBasedSearch = async (nlpResults, recipes, context) => {
  // Use contextual recommendations with style preferences
  const styleContext = {
    ...context,
    ...extractStyleContext(nlpResults.descriptors)
  };

  const recommendations = getContextualRecommendations(recipes, styleContext);
  
  return recommendations.map(rec => ({
    recipe: rec.recipe,
    relevanceScore: rec.contextualScore / 100,
    contextualScore: rec.contextualScore,
    matchType: 'style_based',
    matchDetails: rec.breakdown
  }));
};

/**
 * Perform occasion-based search
 * @param {Object} nlpResults - NLP analysis results
 * @param {Array} recipes - Recipe collection
 * @param {Object} context - Search context
 * @returns {Array} Search results
 */
const performOccasionBasedSearch = async (nlpResults, recipes, context) => {
  const occasionContext = {
    ...context,
    occasion: nlpResults.descriptors.occasion[0]?.subcategory || context.occasion
  };

  const recommendations = getContextualRecommendations(recipes, occasionContext);
  
  return recommendations.map(rec => ({
    recipe: rec.recipe,
    relevanceScore: rec.contextualScore / 100,
    contextualScore: rec.contextualScore,
    matchType: 'occasion_based',
    matchDetails: rec.breakdown
  }));
};

/**
 * Perform seasonal-based search
 * @param {Object} nlpResults - NLP analysis results
 * @param {Array} recipes - Recipe collection
 * @param {Object} context - Search context
 * @returns {Array} Search results
 */
const performSeasonalBasedSearch = async (nlpResults, recipes, context) => {
  const seasonalContext = {
    ...context,
    season: nlpResults.descriptors.season[0]?.subcategory || context.season
  };

  const recommendations = getContextualRecommendations(recipes, seasonalContext);
  
  return recommendations.map(rec => ({
    recipe: rec.recipe,
    relevanceScore: rec.contextualScore / 100,
    contextualScore: rec.contextualScore,
    matchType: 'seasonal_based',
    matchDetails: rec.breakdown
  }));
};

/**
 * Perform general search
 * @param {Object} nlpResults - NLP analysis results
 * @param {Array} recipes - Recipe collection
 * @param {Object} context - Search context
 * @returns {Array} Search results
 */
const performGeneralSearch = async (nlpResults, recipes, context) => {
  // Combine multiple search strategies
  const results = [];

  // Try ingredient-based if ingredients found
  if (nlpResults.ingredients.length > 0) {
    const ingredientResults = await performIngredientBasedSearch(nlpResults, recipes);
    results.push(...ingredientResults);
  }

  // Add contextual recommendations
  const contextualResults = getContextualRecommendations(recipes, context);
  contextualResults.forEach(rec => {
    results.push({
      recipe: rec.recipe,
      relevanceScore: rec.contextualScore / 100 * 0.7, // Lower weight for general search
      contextualScore: rec.contextualScore,
      matchType: 'contextual',
      matchDetails: rec.breakdown
    });
  });

  return results;
};

/**
 * Perform contextual search for empty queries
 * @param {Array} recipes - Recipe collection
 * @param {Object} context - Search context
 * @returns {Array} Search results
 */
const performContextualSearch = async (recipes, context) => {
  const recommendations = getContextualRecommendations(recipes, context, { maxRecommendations: 20 });
  
  return recommendations.map(rec => ({
    recipe: rec.recipe,
    relevanceScore: rec.contextualScore / 100,
    contextualScore: rec.contextualScore,
    matchType: 'contextual_default',
    matchDetails: rec.breakdown
  }));
};

/**
 * Extract style context from descriptors
 * @param {Object} descriptors - NLP descriptors
 * @returns {Object} Style context
 */
const extractStyleContext = (descriptors) => {
  const context = {};

  if (descriptors.occasion.length > 0) {
    context.occasion = descriptors.occasion[0].subcategory;
  }

  if (descriptors.season.length > 0) {
    context.season = descriptors.season[0].subcategory;
  }

  return context;
};

/**
 * Get search suggestions for autocomplete
 * @param {string} partialQuery - Partial query
 * @param {Object} context - Current context
 * @param {Object} options - Suggestion options
 * @returns {Object} Search suggestions
 */
export const getAdvancedSearchSuggestions = (partialQuery, context = {}, options = {}) => {
  return getSearchSuggestions(partialQuery, context, options);
};

/**
 * Clear search cache
 */
export const clearSearchCache = () => {
  searchCache.clear();
};
