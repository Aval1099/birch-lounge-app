/**
 * Contextual Recommendation Engine
 * Provides intelligent cocktail recommendations based on seasonal, occasion-based,
 * time-of-day, and weather contexts for enhanced user experience.
 */

/**
 * Seasonal cocktail characteristics and preferences
 */
const SEASONAL_CHARACTERISTICS = {
  Spring: {
    flavorProfiles: ['floral', 'fresh', 'light', 'citrusy', 'herbal'],
    preferredSpirits: ['gin', 'vodka', 'white rum', 'aperitif'],
    avoidSpirits: ['dark rum', 'whiskey'],
    abvRange: [15, 25],
    techniques: ['shake', 'build', 'muddle'],
    temperature: 'cold',
    garnishPreference: ['fresh herbs', 'citrus', 'flowers'],
    seasonalIngredients: ['elderflower', 'cucumber', 'mint', 'lime', 'lemon']
  },
  Summer: {
    flavorProfiles: ['refreshing', 'citrusy', 'fruity', 'light', 'tropical'],
    preferredSpirits: ['gin', 'vodka', 'white rum', 'tequila'],
    avoidSpirits: ['whiskey', 'brandy', 'dark spirits'],
    abvRange: [12, 22],
    techniques: ['shake', 'build', 'blend', 'muddle'],
    temperature: 'cold',
    garnishPreference: ['citrus', 'tropical fruits', 'mint'],
    seasonalIngredients: ['watermelon', 'cucumber', 'mint', 'lime', 'coconut']
  },
  Fall: {
    flavorProfiles: ['spiced', 'warming', 'apple', 'cinnamon', 'nutty'],
    preferredSpirits: ['whiskey', 'brandy', 'rum', 'apple brandy'],
    avoidSpirits: ['light rum', 'vodka'],
    abvRange: [20, 30],
    techniques: ['stir', 'build', 'warm'],
    temperature: 'room temperature',
    garnishPreference: ['apple', 'cinnamon', 'orange peel'],
    seasonalIngredients: ['apple', 'cinnamon', 'maple', 'pear', 'cranberry']
  },
  Winter: {
    flavorProfiles: ['warming', 'spiced', 'rich', 'strong', 'comforting'],
    preferredSpirits: ['whiskey', 'brandy', 'dark rum', 'amaro'],
    avoidSpirits: ['light spirits', 'gin'],
    abvRange: [25, 40],
    techniques: ['stir', 'build', 'warm', 'flame'],
    temperature: 'warm',
    garnishPreference: ['orange peel', 'cinnamon', 'star anise'],
    seasonalIngredients: ['cinnamon', 'nutmeg', 'clove', 'orange', 'chocolate']
  },
  'Year-round': {
    flavorProfiles: ['balanced', 'classic', 'versatile'],
    preferredSpirits: ['gin', 'whiskey', 'vodka', 'rum'],
    abvRange: [18, 28],
    techniques: ['shake', 'stir', 'build'],
    temperature: 'cold',
    garnishPreference: ['citrus', 'olives', 'cherries']
  }
};

/**
 * Occasion-based cocktail preferences
 */
const OCCASION_CHARACTERISTICS = {
  Casual: {
    complexity: 'simple',
    maxIngredients: 4,
    preferredTechniques: ['build', 'shake'],
    avoidTechniques: ['clarify', 'fat wash', 'molecular'],
    glassware: ['rocks', 'highball', 'collins'],
    prepTimeMax: 3
  },
  Formal: {
    complexity: 'sophisticated',
    maxIngredients: 8,
    preferredTechniques: ['stir', 'strain', 'layer'],
    glassware: ['coupe', 'martini', 'nick and nora'],
    prepTimeMax: 8,
    presentation: 'elegant'
  },
  Party: {
    complexity: 'batch-friendly',
    maxIngredients: 5,
    preferredTechniques: ['build', 'batch'],
    avoidTechniques: ['individual preparation'],
    scalable: true,
    prepTimeMax: 2,
    costEffective: true
  },
  Digestif: {
    complexity: 'spirit-forward',
    preferredSpirits: ['amaro', 'brandy', 'whiskey'],
    flavorProfiles: ['bitter', 'herbal', 'warming'],
    servingSize: 'small',
    abvRange: [25, 45],
    timing: 'post-dinner'
  },
  Brunch: {
    complexity: 'light',
    preferredSpirits: ['champagne', 'prosecco', 'light spirits', 'aperitif'],
    flavorProfiles: ['citrusy', 'fresh', 'effervescent', 'light', 'bitter'],
    abvRange: [8, 18],
    timing: 'morning',
    foodPairing: true,
    maxIngredients: 4,
    preferredTechniques: ['build', 'shake'],
    prepTimeMax: 3
  }
};

/**
 * Time-of-day preferences
 */
const TIME_OF_DAY_CHARACTERISTICS = {
  Morning: {
    abvRange: [0, 25],
    preferredTypes: ['coffee cocktails', 'champagne cocktails', 'low-abv'],
    avoidTypes: ['spirit-forward', 'high-abv'],
    flavorProfiles: ['coffee', 'rich', 'sweet'],
    caffeineOk: true
  },
  Afternoon: {
    abvRange: [12, 22],
    preferredTypes: ['aperitif', 'light cocktails', 'refreshing'],
    flavorProfiles: ['citrusy', 'herbal', 'light'],
    socialSetting: true
  },
  Evening: {
    abvRange: [18, 35],
    preferredTypes: ['classic cocktails', 'spirit-forward', 'full-strength'],
    complexity: 'any',
    dinnerPairing: true
  },
  'Late Night': {
    abvRange: [20, 45],
    preferredTypes: ['digestif', 'nightcap', 'simple'],
    flavorProfiles: ['warming', 'comforting', 'spirit-forward'],
    complexity: 'simple'
  }
};

/**
 * Weather-based recommendations
 */
const WEATHER_CHARACTERISTICS = {
  Hot: {
    temperature: 'cold',
    dilution: 'high',
    flavorProfiles: ['refreshing', 'citrusy', 'light'],
    preferredTypes: ['frozen', 'highball', 'spritz'],
    avoidTypes: ['hot cocktails', 'spirit-forward']
  },
  Cold: {
    temperature: 'warm',
    flavorProfiles: ['warming', 'spiced', 'rich'],
    preferredTypes: ['hot cocktails', 'spirit-forward', 'warming'],
    techniques: ['warm', 'build'],
    garnish: ['warming spices']
  },
  Rainy: {
    mood: 'comfort',
    flavorProfiles: ['comforting', 'warming', 'familiar', 'refreshing', 'citrusy'],
    preferredTypes: ['classic cocktails', 'comfort drinks'],
    complexity: 'simple',
    indoorFriendly: true
  },
  Mild: {
    versatility: 'high',
    flavorProfiles: ['balanced', 'versatile'],
    anyType: true
  }
};

/**
 * Calculate seasonal compatibility score for a recipe
 * @param {Object} recipe - Recipe to analyze
 * @param {string} season - Target season
 * @returns {number} Compatibility score (0-100)
 */
export const calculateSeasonalScore = (recipe, season) => {
  if (!recipe || !season || !SEASONAL_CHARACTERISTICS[season]) {
    return 0;
  }

  const seasonalChar = SEASONAL_CHARACTERISTICS[season];
  let score = 0;
  let factors = 0;

  // Check flavor profile compatibility
  if (recipe.flavorProfile && Array.isArray(recipe.flavorProfile)) {
    const flavorMatches = recipe.flavorProfile.filter(flavor =>
      seasonalChar.flavorProfiles.includes(flavor.toLowerCase())
    ).length;
    score += (flavorMatches / Math.max(recipe.flavorProfile.length, 1)) * 30;
    factors += 30;
  }

  // Check spirit compatibility
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    const spirits = recipe.ingredients.filter(ing =>
      ['whiskey', 'gin', 'vodka', 'rum', 'tequila', 'brandy'].includes(ing.name?.toLowerCase())
    );

    if (spirits.length > 0) {
      const spiritMatches = spirits.filter(spirit =>
        seasonalChar.preferredSpirits.includes(spirit.name?.toLowerCase())
      ).length;
      const spiritAvoids = spirits.filter(spirit =>
        seasonalChar.avoidSpirits?.includes(spirit.name?.toLowerCase())
      ).length;

      score += (spiritMatches / spirits.length) * 25 - (spiritAvoids / spirits.length) * 15;
      factors += 25;
    }
  }

  // Check ABV compatibility
  if (recipe.abv && seasonalChar.abvRange) {
    const [minAbv, maxAbv] = seasonalChar.abvRange;
    if (recipe.abv >= minAbv && recipe.abv <= maxAbv) {
      score += 20;
    } else {
      const deviation = Math.min(
        Math.abs(recipe.abv - minAbv),
        Math.abs(recipe.abv - maxAbv)
      );
      score += Math.max(0, 20 - deviation * 2);
    }
    factors += 20;
  }

  // Check technique compatibility
  if (recipe.techniques && Array.isArray(recipe.techniques)) {
    const techniqueMatches = recipe.techniques.filter(tech =>
      seasonalChar.techniques.includes(tech.toLowerCase())
    ).length;
    score += (techniqueMatches / Math.max(recipe.techniques.length, 1)) * 15;
    factors += 15;
  }

  // Check seasonal ingredients
  if (recipe.ingredients && seasonalChar.seasonalIngredients) {
    const seasonalMatches = recipe.ingredients.filter(ing =>
      seasonalChar.seasonalIngredients.some(seasonal =>
        ing.name?.toLowerCase().includes(seasonal.toLowerCase())
      )
    ).length;
    score += (seasonalMatches / Math.max(recipe.ingredients.length, 1)) * 10;
    factors += 10;
  }

  return factors > 0 ? Math.min(100, Math.max(0, (score / factors) * 100)) : 0;
};

/**
 * Calculate occasion compatibility score for a recipe
 * @param {Object} recipe - Recipe to analyze
 * @param {string} occasion - Target occasion
 * @returns {number} Compatibility score (0-100)
 */
export const calculateOccasionScore = (recipe, occasion) => {
  if (!recipe || !occasion || !OCCASION_CHARACTERISTICS[occasion]) {
    return 0;
  }

  const occasionChar = OCCASION_CHARACTERISTICS[occasion];
  let score = 0;
  let factors = 0;

  // Check ingredient count
  if (recipe.ingredients && occasionChar.maxIngredients) {
    if (recipe.ingredients.length <= occasionChar.maxIngredients) {
      score += 25;
    } else {
      const excess = recipe.ingredients.length - occasionChar.maxIngredients;
      score += Math.max(0, 25 - excess * 5);
    }
    factors += 25;
  }

  // Check preparation time
  if (recipe.prepTime && occasionChar.prepTimeMax) {
    if (recipe.prepTime <= occasionChar.prepTimeMax) {
      score += 20;
    } else {
      const excess = recipe.prepTime - occasionChar.prepTimeMax;
      score += Math.max(0, 20 - excess * 3);
    }
    factors += 20;
  }

  // Check technique compatibility
  if (recipe.techniques && occasionChar.preferredTechniques) {
    const techniqueMatches = recipe.techniques.filter(tech =>
      occasionChar.preferredTechniques.includes(tech.toLowerCase())
    ).length;
    score += (techniqueMatches / Math.max(recipe.techniques.length, 1)) * 20;
    factors += 20;
  }

  // Check avoided techniques
  if (recipe.techniques && occasionChar.avoidTechniques) {
    const avoidedTechniques = recipe.techniques.filter(tech =>
      occasionChar.avoidTechniques.includes(tech.toLowerCase())
    ).length;
    score -= (avoidedTechniques / Math.max(recipe.techniques.length, 1)) * 15;
  }

  // Check ABV range for specific occasions
  if (recipe.abv && occasionChar.abvRange) {
    const [minAbv, maxAbv] = occasionChar.abvRange;
    if (recipe.abv >= minAbv && recipe.abv <= maxAbv) {
      score += 15;
    } else {
      const deviation = Math.min(
        Math.abs(recipe.abv - minAbv),
        Math.abs(recipe.abv - maxAbv)
      );
      score += Math.max(0, 15 - deviation * 2);
    }
    factors += 15;
  }

  // Check flavor profile compatibility
  if (recipe.flavorProfile && occasionChar.flavorProfiles) {
    const flavorMatches = recipe.flavorProfile.filter(flavor =>
      occasionChar.flavorProfiles.includes(flavor.toLowerCase())
    ).length;
    score += (flavorMatches / Math.max(recipe.flavorProfile.length, 1)) * 20;
    factors += 20;
  }

  return factors > 0 ? Math.min(100, Math.max(0, (score / factors) * 100)) : 0;
};

/**
 * Calculate time-of-day compatibility score for a recipe
 * @param {Object} recipe - Recipe to analyze
 * @param {string} timeOfDay - Target time of day
 * @returns {number} Compatibility score (0-100)
 */
export const calculateTimeOfDayScore = (recipe, timeOfDay) => {
  if (!recipe || !timeOfDay || !TIME_OF_DAY_CHARACTERISTICS[timeOfDay]) {
    return 0;
  }

  const timeChar = TIME_OF_DAY_CHARACTERISTICS[timeOfDay];
  let score = 0;
  let factors = 0;

  // Check ABV compatibility
  if (recipe.abv && timeChar.abvRange) {
    const [minAbv, maxAbv] = timeChar.abvRange;
    if (recipe.abv >= minAbv && recipe.abv <= maxAbv) {
      score += 40;
    } else {
      const deviation = Math.min(
        Math.abs(recipe.abv - minAbv),
        Math.abs(recipe.abv - maxAbv)
      );
      score += Math.max(0, 40 - deviation * 3);
    }
    factors += 40;
  }

  // Check flavor profile compatibility
  if (recipe.flavorProfile && timeChar.flavorProfiles) {
    const flavorMatches = recipe.flavorProfile.filter(flavor =>
      timeChar.flavorProfiles.includes(flavor.toLowerCase())
    ).length;
    score += (flavorMatches / Math.max(recipe.flavorProfile.length, 1)) * 30;
    factors += 30;
  }

  // Check complexity for late night (prefer simple)
  if (timeOfDay === 'Late Night' && recipe.ingredients) {
    if (recipe.ingredients.length <= 3) {
      score += 20;
    } else {
      score += Math.max(0, 20 - (recipe.ingredients.length - 3) * 5);
    }
    factors += 20;
  }

  // Check coffee ingredients for morning
  if (timeOfDay === 'Morning' && recipe.ingredients) {
    const hasCoffee = recipe.ingredients.some(ing =>
      ing.name?.toLowerCase().includes('coffee') ||
      ing.name?.toLowerCase().includes('espresso')
    );
    if (hasCoffee) {
      score += 10;
    }
    factors += 10;
  }

  return factors > 0 ? Math.min(100, Math.max(0, (score / factors) * 100)) : 0;
};

/**
 * Calculate weather compatibility score for a recipe
 * @param {Object} recipe - Recipe to analyze
 * @param {string} weather - Weather condition
 * @returns {number} Compatibility score (0-100)
 */
export const calculateWeatherScore = (recipe, weather) => {
  if (!recipe || !weather || !WEATHER_CHARACTERISTICS[weather]) {
    return 0;
  }

  const weatherChar = WEATHER_CHARACTERISTICS[weather];
  let score = 0;
  let factors = 0;

  // Check flavor profile compatibility
  if (recipe.flavorProfile && weatherChar.flavorProfiles) {
    const flavorMatches = recipe.flavorProfile.filter(flavor =>
      weatherChar.flavorProfiles.includes(flavor.toLowerCase())
    ).length;
    score += (flavorMatches / Math.max(recipe.flavorProfile.length, 1)) * 40;
    factors += 40;
  }

  // Check temperature preference
  if (weatherChar.temperature) {
    // Assume most cocktails are cold unless specified as hot
    const isHotCocktail = recipe.techniques?.includes('warm') ||
      recipe.name?.toLowerCase().includes('hot') ||
      recipe.name?.toLowerCase().includes('toddy');

    if (weatherChar.temperature === 'warm' && isHotCocktail) {
      score += 30;
    } else if (weatherChar.temperature === 'cold' && !isHotCocktail) {
      score += 30;
    }
    factors += 30;
  }

  // Check dilution preference for hot weather
  if (weather === 'Hot' && recipe.ingredients) {
    const hasDilution = recipe.ingredients.some(ing =>
      ['soda', 'tonic', 'water', 'juice'].some(dilutant =>
        ing.name?.toLowerCase().includes(dilutant)
      )
    );
    if (hasDilution) {
      score += 20;
    }
    factors += 20;
  }

  // Check complexity for rainy weather (prefer simple, comforting)
  if (weather === 'Rainy' && recipe.ingredients) {
    if (recipe.ingredients.length <= 4) {
      score += 10;
    }
    factors += 10;
  }

  return factors > 0 ? Math.min(100, Math.max(0, (score / factors) * 100)) : 0;
};

/**
 * Get contextual recommendations based on multiple factors
 * @param {Array} recipes - All available recipes
 * @param {Object} context - Context object with season, occasion, timeOfDay, weather
 * @param {Object} options - Recommendation options
 * @returns {Array} Contextually ranked recipe recommendations
 */
export const getContextualRecommendations = (recipes, context, options = {}) => {
  const {
    maxRecommendations = 10,
    minScore = 30,
    weights = {
      seasonal: 0.3,
      occasion: 0.3,
      timeOfDay: 0.25,
      weather: 0.15
    }
  } = options;

  if (!Array.isArray(recipes) || recipes.length === 0) {
    return [];
  }

  // Calculate contextual scores for each recipe
  const scoredRecipes = recipes.map(recipe => {
    let totalScore = 0;
    let totalWeight = 0;

    // Calculate individual context scores
    if (context.season) {
      const seasonalScore = calculateSeasonalScore(recipe, context.season);
      totalScore += seasonalScore * weights.seasonal;
      totalWeight += weights.seasonal;
    }

    if (context.occasion) {
      const occasionScore = calculateOccasionScore(recipe, context.occasion);
      totalScore += occasionScore * weights.occasion;
      totalWeight += weights.occasion;
    }

    if (context.timeOfDay) {
      const timeScore = calculateTimeOfDayScore(recipe, context.timeOfDay);
      totalScore += timeScore * weights.timeOfDay;
      totalWeight += weights.timeOfDay;
    }

    if (context.weather) {
      const weatherScore = calculateWeatherScore(recipe, context.weather);
      totalScore += weatherScore * weights.weather;
      totalWeight += weights.weather;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      recipe,
      contextualScore: Math.round(finalScore * 100) / 100,
      breakdown: {
        seasonal: context.season ? calculateSeasonalScore(recipe, context.season) : null,
        occasion: context.occasion ? calculateOccasionScore(recipe, context.occasion) : null,
        timeOfDay: context.timeOfDay ? calculateTimeOfDayScore(recipe, context.timeOfDay) : null,
        weather: context.weather ? calculateWeatherScore(recipe, context.weather) : null
      }
    };
  });

  // Filter by minimum score and sort by contextual score
  return scoredRecipes
    .filter(item => item.contextualScore >= minScore)
    .sort((a, b) => {
      // Primary sort: contextual score
      if (a.contextualScore !== b.contextualScore) {
        return b.contextualScore - a.contextualScore;
      }

      // Secondary sort: favorites
      if (a.recipe.isFavorite !== b.recipe.isFavorite) {
        return b.recipe.isFavorite - a.recipe.isFavorite;
      }

      // Tertiary sort: alphabetical
      return a.recipe.name.localeCompare(b.recipe.name);
    })
    .slice(0, maxRecommendations);
};

/**
 * Get seasonal recommendations for a specific season
 * @param {Array} recipes - All available recipes
 * @param {string} season - Target season
 * @param {Object} options - Options for seasonal recommendations
 * @returns {Array} Season-appropriate recipe recommendations
 */
export const getSeasonalRecommendations = (recipes, season, options = {}) => {
  return getContextualRecommendations(recipes, { season }, {
    ...options,
    weights: { seasonal: 1.0 }
  });
};

/**
 * Get occasion-based recommendations
 * @param {Array} recipes - All available recipes
 * @param {string} occasion - Target occasion
 * @param {Object} options - Options for occasion recommendations
 * @returns {Array} Occasion-appropriate recipe recommendations
 */
export const getOccasionRecommendations = (recipes, occasion, options = {}) => {
  return getContextualRecommendations(recipes, { occasion }, {
    ...options,
    weights: { occasion: 1.0 }
  });
};

/**
 * Get time-of-day recommendations
 * @param {Array} recipes - All available recipes
 * @param {string} timeOfDay - Target time of day
 * @param {Object} options - Options for time-based recommendations
 * @returns {Array} Time-appropriate recipe recommendations
 */
export const getTimeOfDayRecommendations = (recipes, timeOfDay, options = {}) => {
  return getContextualRecommendations(recipes, { timeOfDay }, {
    ...options,
    weights: { timeOfDay: 1.0 }
  });
};

/**
 * Get weather-based recommendations
 * @param {Array} recipes - All available recipes
 * @param {string} weather - Weather condition
 * @param {Object} options - Options for weather recommendations
 * @returns {Array} Weather-appropriate recipe recommendations
 */
export const getWeatherRecommendations = (recipes, weather, options = {}) => {
  return getContextualRecommendations(recipes, { weather }, {
    ...options,
    weights: { weather: 1.0 }
  });
};

/**
 * Get current context based on date and optional weather
 * @param {Date} date - Current date
 * @param {string} weather - Optional weather condition
 * @returns {Object} Context object with inferred season, timeOfDay, etc.
 */
export const getCurrentContext = (date = new Date(), weather = null) => {
  const month = date.getMonth() + 1; // 1-12
  const hour = date.getHours(); // 0-23

  // Determine season based on month
  let season;
  if (month >= 3 && month <= 5) {
    season = 'Spring';
  } else if (month >= 6 && month <= 8) {
    season = 'Summer';
  } else if (month >= 9 && month <= 11) {
    season = 'Fall';
  } else {
    season = 'Winter';
  }

  // Determine time of day based on hour
  let timeOfDay;
  if (hour >= 6 && hour < 12) {
    timeOfDay = 'Morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'Afternoon';
  } else if (hour >= 17 && hour < 23) {
    timeOfDay = 'Evening';
  } else {
    timeOfDay = 'Late Night';
  }

  return {
    season,
    timeOfDay,
    weather,
    date: date.toISOString(),
    timestamp: date.getTime()
  };
};
