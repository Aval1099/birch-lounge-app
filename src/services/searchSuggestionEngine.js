/**
 * Search Suggestion Engine for Advanced Recipe Search
 * Provides real-time search suggestions, autocomplete, trending recommendations,
 * and personalized suggestions based on user preferences and search history.
 */

/**
 * Popular search terms and trending queries
 */
const POPULAR_SEARCH_TERMS = [
  // Spirits
  'gin cocktails', 'vodka drinks', 'whiskey cocktails', 'rum drinks', 'tequila cocktails',

  // Styles
  'classic cocktails', 'modern cocktails', 'tropical drinks', 'simple cocktails',
  'strong cocktails', 'light cocktails', 'refreshing drinks', 'warming cocktails',

  // Occasions
  'party cocktails', 'formal cocktails', 'brunch cocktails', 'dinner cocktails',
  'casual drinks', 'date night cocktails', 'celebration drinks',

  // Seasons
  'summer cocktails', 'winter cocktails', 'spring cocktails', 'fall cocktails',
  'hot weather drinks', 'cold weather cocktails',

  // Flavors
  'sweet cocktails', 'sour cocktails', 'bitter cocktails', 'fruity cocktails',
  'citrus cocktails', 'herbal cocktails', 'spicy cocktails',

  // Specific ingredients
  'lime cocktails', 'lemon cocktails', 'mint cocktails', 'ginger cocktails',
  'coffee cocktails', 'chocolate cocktails', 'berry cocktails'
];

/**
 * Seasonal trending terms based on current season
 */
const SEASONAL_TRENDING = {
  Spring: [
    'fresh cocktails', 'floral cocktails', 'garden cocktails', 'elderflower cocktails',
    'cucumber cocktails', 'herb cocktails', 'light gin cocktails'
  ],
  Summer: [
    'frozen cocktails', 'poolside drinks', 'beach cocktails', 'watermelon cocktails',
    'coconut cocktails', 'tropical rum drinks', 'refreshing vodka cocktails'
  ],
  Fall: [
    'apple cocktails', 'cinnamon cocktails', 'warming drinks', 'harvest cocktails',
    'spiced rum cocktails', 'bourbon cocktails', 'cranberry cocktails'
  ],
  Winter: [
    'hot cocktails', 'holiday drinks', 'warming cocktails', 'spiced cocktails',
    'hot toddy', 'mulled wine', 'brandy cocktails', 'comfort cocktails'
  ]
};

/**
 * Common search patterns and templates
 */
const _SEARCH_PATTERNS = [
  '{spirit} cocktails',
  '{flavor} {spirit} drinks',
  '{occasion} cocktails',
  '{season} {spirit} cocktails',
  'cocktails with {ingredient}',
  '{difficulty} {spirit} cocktails',
  '{flavor} cocktails for {occasion}',
  '{season} {flavor} drinks'
];

/**
 * Search history storage (in-memory for this implementation)
 */
let searchHistory = [];
const userPreferences = {
  favoriteSpirits: [],
  preferredFlavors: [],
  commonOccasions: [],
  searchFrequency: {}
};

/**
 * Generate autocomplete suggestions based on partial input
 * @param {string} partialQuery - Partial search query
 * @param {Object} options - Suggestion options
 * @returns {Array} Autocomplete suggestions
 */
export const generateAutocompleteSuggestions = (partialQuery, options = {}) => {
  const {
    maxSuggestions = 8,
    includePopular = true,
    includeTrending = true,
    includeHistory = true,
    currentSeason = null
  } = options;

  if (!partialQuery || partialQuery.length < 2) {
    return [];
  }

  const query = partialQuery.toLowerCase().trim();
  const suggestions = [];

  // Search in popular terms
  if (includePopular) {
    POPULAR_SEARCH_TERMS.forEach(term => {
      if (term.toLowerCase().includes(query)) {
        suggestions.push({
          text: term,
          type: 'popular',
          confidence: 0.8,
          source: 'popular_terms'
        });
      }
    });
  }

  // Search in seasonal trending terms
  if (includeTrending && currentSeason && SEASONAL_TRENDING[currentSeason]) {
    SEASONAL_TRENDING[currentSeason].forEach(term => {
      if (term.toLowerCase().includes(query)) {
        suggestions.push({
          text: term,
          type: 'trending',
          confidence: 0.9,
          source: 'seasonal_trending',
          season: currentSeason
        });
      }
    });
  }

  // Search in user history
  if (includeHistory) {
    searchHistory.forEach(historyItem => {
      if (historyItem.query.toLowerCase().includes(query)) {
        suggestions.push({
          text: historyItem.query,
          type: 'history',
          confidence: 0.7,
          source: 'search_history',
          lastUsed: historyItem.timestamp
        });
      }
    });
  }

  // Generate pattern-based suggestions
  const patternSuggestions = generatePatternSuggestions(query);
  suggestions.push(...patternSuggestions);

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = suggestions.reduce((acc, suggestion) => {
    const existing = acc.find(s => s.text.toLowerCase() === suggestion.text.toLowerCase());
    if (!existing || suggestion.confidence > existing.confidence) {
      return [...acc.filter(s => s.text.toLowerCase() !== suggestion.text.toLowerCase()), suggestion];
    }
    return acc;
  }, []);

  return uniqueSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);
};

/**
 * Generate pattern-based suggestions
 * @param {string} query - Search query
 * @returns {Array} Pattern-based suggestions
 */
const generatePatternSuggestions = (query) => {
  const suggestions = [];
  const spirits = ['gin', 'vodka', 'whiskey', 'rum', 'tequila', 'brandy'];
  const flavors = ['sweet', 'sour', 'bitter', 'fruity', 'citrus', 'herbal'];
  const occasions = ['party', 'formal', 'casual', 'brunch', 'dinner'];
  const seasons = ['summer', 'winter', 'spring', 'fall'];

  // Check if query matches any category
  const matchedSpirit = spirits.find(spirit => spirit.includes(query) || query.includes(spirit));
  const matchedFlavor = flavors.find(flavor => flavor.includes(query) || query.includes(flavor));
  const matchedOccasion = occasions.find(occasion => occasion.includes(query) || query.includes(occasion));
  const _matchedSeason = seasons.find(season => season.includes(query) || query.includes(season));

  // Generate suggestions based on matches
  if (matchedSpirit) {
    suggestions.push(
      { text: `${matchedSpirit} cocktails`, type: 'pattern', confidence: 0.6, source: 'pattern_generation' },
      { text: `classic ${matchedSpirit} cocktails`, type: 'pattern', confidence: 0.5, source: 'pattern_generation' },
      { text: `simple ${matchedSpirit} drinks`, type: 'pattern', confidence: 0.5, source: 'pattern_generation' }
    );
  }

  if (matchedFlavor) {
    suggestions.push(
      { text: `${matchedFlavor} cocktails`, type: 'pattern', confidence: 0.6, source: 'pattern_generation' },
      { text: `${matchedFlavor} gin cocktails`, type: 'pattern', confidence: 0.5, source: 'pattern_generation' }
    );
  }

  if (matchedOccasion) {
    suggestions.push(
      { text: `${matchedOccasion} cocktails`, type: 'pattern', confidence: 0.6, source: 'pattern_generation' },
      { text: `cocktails for ${matchedOccasion}`, type: 'pattern', confidence: 0.5, source: 'pattern_generation' }
    );
  }

  return suggestions;
};

/**
 * Get trending search recommendations based on context
 * @param {Object} context - Current context (season, time, etc.)
 * @returns {Array} Trending recommendations
 */
export const getTrendingRecommendations = (context = {}) => {
  const { season, timeOfDay, occasion } = context;
  const recommendations = [];

  // Seasonal recommendations
  if (season && SEASONAL_TRENDING[season]) {
    SEASONAL_TRENDING[season].forEach(term => {
      recommendations.push({
        text: term,
        type: 'seasonal_trending',
        confidence: 0.8,
        reason: `Popular for ${season.toLowerCase()}`,
        category: 'seasonal'
      });
    });
  }

  // Time-based recommendations
  if (timeOfDay) {
    const timeBasedTerms = getTimeBasedRecommendations(timeOfDay);
    timeBasedTerms.forEach(term => {
      recommendations.push({
        text: term,
        type: 'time_based',
        confidence: 0.7,
        reason: `Perfect for ${timeOfDay.toLowerCase()}`,
        category: 'time'
      });
    });
  }

  // Occasion-based recommendations
  if (occasion) {
    const occasionTerms = getOccasionBasedRecommendations(occasion);
    occasionTerms.forEach(term => {
      recommendations.push({
        text: term,
        type: 'occasion_based',
        confidence: 0.7,
        reason: `Great for ${occasion.toLowerCase()} events`,
        category: 'occasion'
      });
    });
  }

  return recommendations.slice(0, 10);
};

/**
 * Get time-based recommendations
 * @param {string} timeOfDay - Current time of day
 * @returns {Array} Time-appropriate search terms
 */
const getTimeBasedRecommendations = (timeOfDay) => {
  const timeRecommendations = {
    Morning: ['coffee cocktails', 'brunch cocktails', 'light cocktails', 'champagne cocktails'],
    Afternoon: ['aperitif cocktails', 'light gin cocktails', 'refreshing drinks', 'spritz cocktails'],
    Evening: ['classic cocktails', 'dinner cocktails', 'strong cocktails', 'whiskey cocktails'],
    'Late Night': ['digestif cocktails', 'nightcap drinks', 'simple cocktails', 'brandy cocktails']
  };

  return timeRecommendations[timeOfDay] || [];
};

/**
 * Get occasion-based recommendations
 * @param {string} occasion - Current occasion
 * @returns {Array} Occasion-appropriate search terms
 */
const getOccasionBasedRecommendations = (occasion) => {
  const occasionRecommendations = {
    Casual: ['simple cocktails', 'easy drinks', 'beer cocktails', 'highball cocktails'],
    Formal: ['classic cocktails', 'elegant drinks', 'sophisticated cocktails', 'martini cocktails'],
    Party: ['batch cocktails', 'punch recipes', 'crowd-pleasing drinks', 'fun cocktails'],
    Brunch: ['brunch cocktails', 'mimosa variations', 'bloody mary cocktails', 'light drinks'],
    Dinner: ['dinner cocktails', 'wine cocktails', 'aperitif drinks', 'digestif cocktails']
  };

  return occasionRecommendations[occasion] || [];
};

/**
 * Generate "Did you mean?" suggestions for misspelled queries
 * @param {string} query - Potentially misspelled query
 * @param {Array} corrections - Fuzzy search corrections
 * @returns {Array} "Did you mean?" suggestions
 */
export const generateDidYouMeanSuggestions = (query, corrections = []) => {
  const suggestions = [];

  // Use fuzzy search corrections
  corrections.forEach(correction => {
    suggestions.push({
      original: query,
      suggestion: correction.suggestion,
      confidence: correction.confidence,
      reason: correction.reason,
      type: 'spelling_correction'
    });
  });

  // Add common misspelling corrections
  const commonCorrections = getCommonSpellingCorrections(query);
  commonCorrections.forEach(correction => {
    suggestions.push({
      original: query,
      suggestion: correction,
      confidence: 0.6,
      reason: 'common_misspelling',
      type: 'spelling_correction'
    });
  });

  return suggestions.slice(0, 3);
};

/**
 * Get common spelling corrections
 * @param {string} query - Query to correct
 * @returns {Array} Common corrections
 */
const getCommonSpellingCorrections = (query) => {
  const corrections = [];
  const commonMisspellings = {
    'jin': 'gin',
    'wodka': 'vodka',
    'wisky': 'whiskey',
    'tequilla': 'tequila',
    'cointrau': 'cointreau',
    'vermuth': 'vermouth',
    'coctails': 'cocktails',
    'coctail': 'cocktail',
    'recepies': 'recipes',
    'recepie': 'recipe'
  };

  const queryLower = query.toLowerCase();
  for (const [misspelling, correction] of Object.entries(commonMisspellings)) {
    if (queryLower.includes(misspelling)) {
      const correctedQuery = query.replace(new RegExp(misspelling, 'gi'), correction);
      corrections.push(correctedQuery);
    }
  }

  return corrections;
};

/**
 * Add search to history and update preferences
 * @param {string} query - Search query
 * @param {Array} results - Search results
 * @param {Object} context - Search context
 */
export const addToSearchHistory = (query, results = [], context = {}) => {
  const historyEntry = {
    query,
    timestamp: Date.now(),
    resultCount: results.length,
    context,
    sessionId: context.sessionId || 'default'
  };

  // Add to history (keep last 100 searches)
  searchHistory.unshift(historyEntry);
  searchHistory = searchHistory.slice(0, 100);

  // Update search frequency
  userPreferences.searchFrequency[query] = (userPreferences.searchFrequency[query] || 0) + 1;

  // Extract preferences from query
  updateUserPreferences(query, context);
};

/**
 * Update user preferences based on search patterns
 * @param {string} query - Search query
 * @param {Object} context - Search context
 */
const updateUserPreferences = (query, context) => {
  const queryLower = query.toLowerCase();

  // Extract spirit preferences
  const spirits = ['gin', 'vodka', 'whiskey', 'rum', 'tequila', 'brandy'];
  spirits.forEach(spirit => {
    if (queryLower.includes(spirit)) {
      if (!userPreferences.favoriteSpirits.includes(spirit)) {
        userPreferences.favoriteSpirits.push(spirit);
      }
    }
  });

  // Extract flavor preferences
  const flavors = ['sweet', 'sour', 'bitter', 'fruity', 'citrus', 'herbal'];
  flavors.forEach(flavor => {
    if (queryLower.includes(flavor)) {
      if (!userPreferences.preferredFlavors.includes(flavor)) {
        userPreferences.preferredFlavors.push(flavor);
      }
    }
  });

  // Extract occasion preferences
  if (context.occasion && !userPreferences.commonOccasions.includes(context.occasion)) {
    userPreferences.commonOccasions.push(context.occasion);
  }
};

/**
 * Get personalized suggestions based on user preferences
 * @param {Object} options - Personalization options
 * @returns {Array} Personalized suggestions
 */
export const getPersonalizedSuggestions = (options = {}) => {
  const { maxSuggestions = 5 } = options;
  const suggestions = [];

  // Suggest based on favorite spirits
  userPreferences.favoriteSpirits.forEach(spirit => {
    suggestions.push({
      text: `new ${spirit} cocktails`,
      type: 'personalized',
      confidence: 0.8,
      reason: `Based on your interest in ${spirit}`,
      category: 'spirit_preference'
    });
  });

  // Suggest based on preferred flavors
  userPreferences.preferredFlavors.forEach(flavor => {
    suggestions.push({
      text: `${flavor} cocktail recipes`,
      type: 'personalized',
      confidence: 0.7,
      reason: `You often search for ${flavor} drinks`,
      category: 'flavor_preference'
    });
  });

  // Suggest based on common occasions
  userPreferences.commonOccasions.forEach(occasion => {
    suggestions.push({
      text: `${occasion} cocktail ideas`,
      type: 'personalized',
      confidence: 0.7,
      reason: `Perfect for your ${occasion} events`,
      category: 'occasion_preference'
    });
  });

  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);
};

/**
 * Main search suggestion function
 * @param {string} partialQuery - Partial search query
 * @param {Object} context - Current context
 * @param {Object} options - Suggestion options
 * @returns {Object} Complete suggestion results
 */
export const getSearchSuggestions = (partialQuery, context = {}, options = {}) => {
  const startTime = performance.now();

  try {
    const autocomplete = generateAutocompleteSuggestions(partialQuery, {
      ...options,
      currentSeason: context.season
    });

    const trending = getTrendingRecommendations(context);
    const personalized = getPersonalizedSuggestions(options);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      query: partialQuery,
      autocomplete,
      trending,
      personalized,
      processingTime,
      stats: {
        autocompleteCount: autocomplete.length,
        trendingCount: trending.length,
        personalizedCount: personalized.length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: partialQuery,
      autocomplete: [],
      trending: [],
      personalized: [],
      processingTime: performance.now() - startTime
    };
  }
};
