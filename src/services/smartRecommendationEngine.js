/**
 * Smart Recipe Recommendation Engine
 * Provides intelligent recipe recommendations based on available ingredients,
 * user preferences, and contextual factors.
 */


/**
 * Ingredient substitution mappings for recommendation flexibility
 */
const INGREDIENT_SUBSTITUTIONS = {
  // Spirits
  'whiskey': ['bourbon', 'rye', 'scotch', 'irish whiskey'],
  'bourbon': ['whiskey', 'rye'],
  'rye': ['whiskey', 'bourbon'],
  'gin': ['vodka'], // Limited substitution
  'vodka': ['gin'], // Limited substitution
  'rum': ['white rum', 'dark rum', 'spiced rum'],
  'tequila': ['mezcal'],
  'mezcal': ['tequila'],

  // Liqueurs and Cordials
  'triple sec': ['cointreau', 'grand marnier', 'orange liqueur'],
  'cointreau': ['triple sec', 'grand marnier'],
  'grand marnier': ['cointreau', 'triple sec'],
  'simple syrup': ['sugar syrup', 'rich simple syrup'],
  'sugar syrup': ['simple syrup'],

  // Citrus
  'lime juice': ['lemon juice'], // Limited substitution
  'lemon juice': ['lime juice'], // Limited substitution
  'fresh lime juice': ['lime juice', 'fresh lemon juice'],
  'fresh lemon juice': ['lemon juice', 'fresh lime juice'],

  // Bitters
  'angostura bitters': ['orange bitters', 'aromatic bitters'],
  'orange bitters': ['angostura bitters'],

  // Vermouth
  'dry vermouth': ['blanc vermouth'],
  'sweet vermouth': ['red vermouth'],

  // Mixers
  'club soda': ['soda water', 'sparkling water'],
  'soda water': ['club soda', 'sparkling water'],
  'tonic water': ['club soda'], // Emergency substitution
};

/**
 * Confidence scoring weights for different match types
 */
const CONFIDENCE_WEIGHTS = {
  EXACT_MATCH: 1.0,
  SUBSTITUTION_MATCH: 0.8,
  CATEGORY_MATCH: 0.6,
  PARTIAL_MATCH: 0.4,
  MISSING_INGREDIENT: -0.3
};

/**
 * Analyze available ingredients against recipe requirements
 * @param {Array} availableIngredients - User's ingredient inventory
 * @param {Object} recipe - Recipe to analyze
 * @returns {Object} Analysis result with confidence score and missing ingredients
 */
export const analyzeRecipeCompatibility = (availableIngredients, recipe) => {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    return {
      canMake: false,
      confidence: 0,
      matchedIngredients: [],
      missingIngredients: recipe.ingredients || [],
      substitutions: [],
      totalIngredients: 0
    };
  }

  const analysis = {
    canMake: false,
    confidence: 0,
    matchedIngredients: [],
    missingIngredients: [],
    substitutions: [],
    totalIngredients: recipe.ingredients.length
  };

  // Normalize available ingredients for matching
  const normalizedAvailable = availableIngredients.map(ing => ({
    ...ing,
    normalizedName: ing.name.toLowerCase().trim()
  }));

  let totalScore = 0;
  const maxPossibleScore = recipe.ingredients.length;

  recipe.ingredients.forEach(recipeIngredient => {
    const requiredName = recipeIngredient.name.toLowerCase().trim();
    let matched = false;
    let matchType = null;
    let substitution = null;

    // 1. Try exact match
    const exactMatch = normalizedAvailable.find(avail =>
      avail.normalizedName === requiredName
    );

    if (exactMatch) {
      matched = true;
      matchType = 'EXACT_MATCH';
      analysis.matchedIngredients.push({
        required: recipeIngredient,
        available: exactMatch,
        matchType,
        confidence: CONFIDENCE_WEIGHTS.EXACT_MATCH
      });
      totalScore += CONFIDENCE_WEIGHTS.EXACT_MATCH;
    } else {
      // 2. Try substitution match
      const substitutions = INGREDIENT_SUBSTITUTIONS[requiredName] || [];
      const substitutionMatch = normalizedAvailable.find(avail =>
        substitutions.some(sub => avail.normalizedName.includes(sub.toLowerCase()))
      );

      if (substitutionMatch) {
        matched = true;
        matchType = 'SUBSTITUTION_MATCH';
        substitution = {
          original: recipeIngredient.name,
          substitute: substitutionMatch.name,
          confidence: CONFIDENCE_WEIGHTS.SUBSTITUTION_MATCH
        };
        analysis.substitutions.push(substitution);
        analysis.matchedIngredients.push({
          required: recipeIngredient,
          available: substitutionMatch,
          matchType,
          substitution,
          confidence: CONFIDENCE_WEIGHTS.SUBSTITUTION_MATCH
        });
        totalScore += CONFIDENCE_WEIGHTS.SUBSTITUTION_MATCH;
      } else {
        // 3. Try partial name match
        const partialMatch = normalizedAvailable.find(avail =>
          avail.normalizedName.includes(requiredName) ||
          requiredName.includes(avail.normalizedName)
        );

        if (partialMatch) {
          matched = true;
          matchType = 'PARTIAL_MATCH';
          analysis.matchedIngredients.push({
            required: recipeIngredient,
            available: partialMatch,
            matchType,
            confidence: CONFIDENCE_WEIGHTS.PARTIAL_MATCH
          });
          totalScore += CONFIDENCE_WEIGHTS.PARTIAL_MATCH;
        }
      }
    }

    if (!matched) {
      analysis.missingIngredients.push(recipeIngredient);
      totalScore += CONFIDENCE_WEIGHTS.MISSING_INGREDIENT;
    }
  });

  // Calculate final confidence score (0-100)
  analysis.confidence = Math.max(0, Math.min(100, (totalScore / maxPossibleScore) * 100));

  // Determine if recipe can be made (>= 70% confidence AND <= 2 missing ingredients)
  analysis.canMake = analysis.confidence >= 70 && analysis.missingIngredients.length <= 2;

  return analysis;
};

/**
 * Get recipe recommendations based on available ingredients
 * @param {Array} availableIngredients - User's ingredient inventory
 * @param {Array} allRecipes - All available recipes
 * @param {Object} options - Recommendation options
 * @returns {Array} Sorted array of recipe recommendations
 */
export const getIngredientBasedRecommendations = (availableIngredients, allRecipes, options = {}) => {
  const {
    maxRecommendations = 10,
    minConfidence = 30,
    includePartialMatches = true,
    preferFavorites = true
  } = options;

  if (!Array.isArray(availableIngredients) || !Array.isArray(allRecipes)) {
    return [];
  }

  // Analyze all recipes
  const analyzedRecipes = allRecipes.map(recipe => ({
    ...recipe,
    analysis: analyzeRecipeCompatibility(availableIngredients, recipe)
  }));

  // Filter by minimum confidence
  const recommendations = analyzedRecipes.filter(recipe =>
    recipe.analysis.confidence >= minConfidence
  );

  // Sort by confidence, favorites, and other factors
  recommendations.sort((a, b) => {
    // Primary sort: confidence score
    if (a.analysis.confidence !== b.analysis.confidence) {
      return b.analysis.confidence - a.analysis.confidence;
    }

    // Secondary sort: favorites (if enabled)
    if (preferFavorites && a.isFavorite !== b.isFavorite) {
      return b.isFavorite - a.isFavorite;
    }

    // Tertiary sort: fewer missing ingredients
    if (a.analysis.missingIngredients.length !== b.analysis.missingIngredients.length) {
      return a.analysis.missingIngredients.length - b.analysis.missingIngredients.length;
    }

    // Quaternary sort: recipe name alphabetically
    return a.name.localeCompare(b.name);
  });

  // Limit results
  return recommendations.slice(0, maxRecommendations);
};

/**
 * Get "what can I make" recommendations with high confidence
 * @param {Array} availableIngredients - User's ingredient inventory
 * @param {Array} allRecipes - All available recipes
 * @returns {Array} Recipes that can be made with available ingredients
 */
export const getWhatCanIMakeRecommendations = (availableIngredients, allRecipes) => {
  return getIngredientBasedRecommendations(availableIngredients, allRecipes, {
    maxRecommendations: 20,
    minConfidence: 70,
    includePartialMatches: false,
    preferFavorites: true
  });
};

/**
 * Get shopping list suggestions for almost-makeable recipes
 * @param {Array} availableIngredients - User's ingredient inventory
 * @param {Array} allRecipes - All available recipes
 * @param {Object} options - Options for shopping suggestions
 * @returns {Array} Shopping suggestions with missing ingredients
 */
export const getShoppingSuggestions = (availableIngredients, allRecipes, options = {}) => {
  const {
    maxSuggestions = 5,
    maxMissingIngredients = 3
  } = options;

  // Find recipes that are close to being makeable
  const almostMakeableRecipes = allRecipes
    .map(recipe => ({
      ...recipe,
      analysis: analyzeRecipeCompatibility(availableIngredients, recipe)
    }))
    .filter(recipe =>
      recipe.analysis.missingIngredients.length > 0 &&
      recipe.analysis.missingIngredients.length <= maxMissingIngredients &&
      recipe.analysis.confidence >= 40
    )
    .sort((a, b) => {
      // Sort by fewest missing ingredients, then by confidence
      if (a.analysis.missingIngredients.length !== b.analysis.missingIngredients.length) {
        return a.analysis.missingIngredients.length - b.analysis.missingIngredients.length;
      }
      return b.analysis.confidence - a.analysis.confidence;
    })
    .slice(0, maxSuggestions);

  return almostMakeableRecipes.map(recipe => ({
    recipe: {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      difficulty: recipe.difficulty
    },
    missingIngredients: recipe.analysis.missingIngredients,
    confidence: recipe.analysis.confidence,
    substitutions: recipe.analysis.substitutions
  }));
};

/**
 * Calculate ingredient importance score for prioritizing purchases
 * @param {Array} allRecipes - All available recipes
 * @param {string} ingredientName - Name of ingredient to score
 * @returns {number} Importance score (0-100)
 */
export const calculateIngredientImportance = (allRecipes, ingredientName) => {
  if (!Array.isArray(allRecipes) || !ingredientName) {
    return 0;
  }

  const normalizedName = ingredientName.toLowerCase().trim();
  let recipeCount = 0;
  let favoriteRecipeCount = 0;
  const totalRecipes = allRecipes.length;

  allRecipes.forEach(recipe => {
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      const hasIngredient = recipe.ingredients.some(ing =>
        ing.name.toLowerCase().trim() === normalizedName
      );

      if (hasIngredient) {
        recipeCount++;
        if (recipe.isFavorite) {
          favoriteRecipeCount++;
        }
      }
    }
  });

  if (totalRecipes === 0) return 0;

  // Calculate importance based on frequency and favorite recipes
  const frequencyScore = (recipeCount / totalRecipes) * 70;
  const favoriteBonus = (favoriteRecipeCount / Math.max(1, recipeCount)) * 30;

  return Math.min(100, frequencyScore + favoriteBonus);
};
