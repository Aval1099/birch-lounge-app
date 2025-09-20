/**
 * Recipe Similarity Matching Engine
 * Provides intelligent recipe similarity analysis and "if you like this, try this" recommendations
 * based on flavor profiles, techniques, ingredients, and user preferences.
 */

/**
 * Flavor profile similarity weights for matching
 */
const FLAVOR_WEIGHTS = {
  'sweet': { 'fruity': 0.8, 'floral': 0.6, 'vanilla': 0.7, 'caramel': 0.8 },
  'sour': { 'citrusy': 0.9, 'tart': 0.8, 'bright': 0.7 },
  'bitter': { 'herbal': 0.8, 'earthy': 0.7, 'hoppy': 0.6 },
  'salty': { 'savory': 0.8, 'umami': 0.7 },
  'spicy': { 'warming': 0.8, 'hot': 0.9, 'peppery': 0.7 },
  'herbal': { 'botanical': 0.9, 'grassy': 0.6, 'bitter': 0.8 },
  'citrusy': { 'bright': 0.8, 'zesty': 0.9, 'sour': 0.9 },
  'fruity': { 'sweet': 0.8, 'tropical': 0.7, 'berry': 0.8 },
  'smoky': { 'peated': 0.9, 'charred': 0.8, 'woody': 0.7 },
  'woody': { 'oaky': 0.9, 'vanilla': 0.6, 'smoky': 0.7 }
};

/**
 * Technique complexity and similarity mappings
 */
const TECHNIQUE_SIMILARITY = {
  'shake': { 'stir': 0.7, 'build': 0.5, 'muddle': 0.6 },
  'stir': { 'shake': 0.7, 'build': 0.8, 'strain': 0.6 },
  'build': { 'stir': 0.8, 'layer': 0.6, 'float': 0.5 },
  'muddle': { 'shake': 0.6, 'crush': 0.8, 'press': 0.7 },
  'strain': { 'double strain': 0.9, 'fine strain': 0.8, 'stir': 0.6 },
  'layer': { 'float': 0.8, 'build': 0.6 },
  'flame': { 'torch': 0.8, 'ignite': 0.9 },
  'clarify': { 'filter': 0.7, 'fine strain': 0.6 },
  'infuse': { 'steep': 0.8, 'macerate': 0.7 },
  'foam': { 'froth': 0.9, 'whip': 0.7 }
};

/**
 * Spirit category relationships for ingredient similarity
 */
const SPIRIT_RELATIONSHIPS = {
  'whiskey': { 'bourbon': 0.9, 'rye': 0.9, 'scotch': 0.8, 'irish': 0.8 },
  'bourbon': { 'whiskey': 0.9, 'rye': 0.8, 'american whiskey': 0.9 },
  'rye': { 'whiskey': 0.9, 'bourbon': 0.8 },
  'gin': { 'vodka': 0.6, 'genever': 0.8 },
  'vodka': { 'gin': 0.6, 'neutral spirit': 0.8 },
  'rum': { 'white rum': 0.9, 'dark rum': 0.8, 'spiced rum': 0.7 },
  'tequila': { 'mezcal': 0.8, 'agave spirit': 0.9 },
  'brandy': { 'cognac': 0.9, 'armagnac': 0.8, 'calvados': 0.7 }
};

/**
 * Calculate similarity score between two flavor profiles
 * @param {Array} profile1 - First flavor profile
 * @param {Array} profile2 - Second flavor profile
 * @returns {number} Similarity score (0-1)
 */
export const calculateFlavorSimilarity = (profile1, profile2) => {
  if (!Array.isArray(profile1) || !Array.isArray(profile2)) {
    return 0;
  }

  if (profile1.length === 0 && profile2.length === 0) {
    return 1; // Both empty, perfectly similar
  }

  if (profile1.length === 0 || profile2.length === 0) {
    return 0; // One empty, no similarity
  }

  // For identical arrays, return 1.0
  const profile1Lower = profile1.map(f => f.toLowerCase()).sort();
  const profile2Lower = profile2.map(f => f.toLowerCase()).sort();

  if (JSON.stringify(profile1Lower) === JSON.stringify(profile2Lower)) {
    return 1.0;
  }

  let totalSimilarity = 0;
  const maxPossibleScore = Math.max(profile1.length, profile2.length);

  // Calculate best matches for each flavor in profile1
  profile1.forEach(flavor1 => {
    let bestMatch = 0;
    const flavor1Lower = flavor1.toLowerCase();

    profile2.forEach(flavor2 => {
      const flavor2Lower = flavor2.toLowerCase();

      if (flavor1Lower === flavor2Lower) {
        bestMatch = Math.max(bestMatch, 1.0);
      } else {
        const similarity = FLAVOR_WEIGHTS[flavor1Lower]?.[flavor2Lower] ||
          FLAVOR_WEIGHTS[flavor2Lower]?.[flavor1Lower] || 0;
        bestMatch = Math.max(bestMatch, similarity);
      }
    });

    totalSimilarity += bestMatch;
  });

  return maxPossibleScore > 0 ? totalSimilarity / maxPossibleScore : 0;
};

/**
 * Calculate similarity score between two ingredient lists
 * @param {Array} ingredients1 - First ingredient list
 * @param {Array} ingredients2 - Second ingredient list
 * @returns {number} Similarity score (0-1)
 */
export const calculateIngredientSimilarity = (ingredients1, ingredients2) => {
  if (!Array.isArray(ingredients1) || !Array.isArray(ingredients2)) {
    return 0;
  }

  if (ingredients1.length === 0 && ingredients2.length === 0) {
    return 1;
  }

  if (ingredients1.length === 0 || ingredients2.length === 0) {
    return 0;
  }

  const names1 = ingredients1.map(ing => ing.name?.toLowerCase() || '');
  const names2 = ingredients2.map(ing => ing.name?.toLowerCase() || '');

  let matches = 0;
  const totalComparisons = Math.max(names1.length, names2.length);

  names1.forEach(name1 => {
    const exactMatch = names2.includes(name1);
    if (exactMatch) {
      matches += 1.0;
    } else {
      // Check for spirit relationships
      const bestSimilarity = names2.reduce((best, name2) => {
        const similarity = SPIRIT_RELATIONSHIPS[name1]?.[name2] ||
          SPIRIT_RELATIONSHIPS[name2]?.[name1] || 0;
        return Math.max(best, similarity);
      }, 0);
      matches += bestSimilarity;
    }
  });

  return matches / totalComparisons;
};

/**
 * Calculate similarity score between two technique lists
 * @param {Array} techniques1 - First technique list
 * @param {Array} techniques2 - Second technique list
 * @returns {number} Similarity score (0-1)
 */
export const calculateTechniqueSimilarity = (techniques1, techniques2) => {
  if (!Array.isArray(techniques1) || !Array.isArray(techniques2)) {
    return 0;
  }

  if (techniques1.length === 0 && techniques2.length === 0) {
    return 1;
  }

  if (techniques1.length === 0 || techniques2.length === 0) {
    return 0;
  }

  const tech1 = techniques1.map(t => t.toLowerCase()).sort();
  const tech2 = techniques2.map(t => t.toLowerCase()).sort();

  // For identical arrays, return 1.0
  if (JSON.stringify(tech1) === JSON.stringify(tech2)) {
    return 1.0;
  }

  let totalSimilarity = 0;
  const maxPossibleScore = Math.max(tech1.length, tech2.length);

  // Calculate best matches for each technique in tech1
  tech1.forEach(t1 => {
    let bestMatch = 0;

    tech2.forEach(t2 => {
      if (t1 === t2) {
        bestMatch = Math.max(bestMatch, 1.0);
      } else {
        const similarity = TECHNIQUE_SIMILARITY[t1]?.[t2] ||
          TECHNIQUE_SIMILARITY[t2]?.[t1] || 0;
        bestMatch = Math.max(bestMatch, similarity);
      }
    });

    totalSimilarity += bestMatch;
  });

  return maxPossibleScore > 0 ? totalSimilarity / maxPossibleScore : 0;
};

/**
 * Calculate overall similarity between two recipes
 * @param {Object} recipe1 - First recipe
 * @param {Object} recipe2 - Second recipe
 * @param {Object} weights - Similarity calculation weights
 * @returns {Object} Similarity analysis with score and breakdown
 */
export const calculateRecipeSimilarity = (recipe1, recipe2, weights = {}) => {
  const defaultWeights = {
    flavor: 0.4,
    ingredients: 0.35,
    techniques: 0.15,
    category: 0.1
  };

  const finalWeights = { ...defaultWeights, ...weights };

  // Calculate individual similarity scores
  const flavorSimilarity = calculateFlavorSimilarity(
    recipe1.flavorProfile || [],
    recipe2.flavorProfile || []
  );

  const ingredientSimilarity = calculateIngredientSimilarity(
    recipe1.ingredients || [],
    recipe2.ingredients || []
  );

  const techniqueSimilarity = calculateTechniqueSimilarity(
    recipe1.techniques || [],
    recipe2.techniques || []
  );

  // Category similarity (exact match or related categories)
  const categorySimilarity = recipe1.category === recipe2.category ? 1.0 : 0.0;

  // Calculate weighted overall similarity
  const overallSimilarity = (
    flavorSimilarity * finalWeights.flavor +
    ingredientSimilarity * finalWeights.ingredients +
    techniqueSimilarity * finalWeights.techniques +
    categorySimilarity * finalWeights.category
  );

  return {
    overall: Math.round(overallSimilarity * 100) / 100,
    breakdown: {
      flavor: Math.round(flavorSimilarity * 100) / 100,
      ingredients: Math.round(ingredientSimilarity * 100) / 100,
      techniques: Math.round(techniqueSimilarity * 100) / 100,
      category: Math.round(categorySimilarity * 100) / 100
    },
    weights: finalWeights
  };
};

/**
 * Find similar recipes to a given recipe
 * @param {Object} targetRecipe - Recipe to find similarities for
 * @param {Array} allRecipes - All available recipes
 * @param {Object} options - Search options
 * @returns {Array} Array of similar recipes with similarity scores
 */
export const findSimilarRecipes = (targetRecipe, allRecipes, options = {}) => {
  const {
    maxResults = 5,
    minSimilarity = 0.3,
    excludeExact = true,
    weights = {}
  } = options;

  if (!targetRecipe || !Array.isArray(allRecipes)) {
    return [];
  }

  // Calculate similarity for all recipes
  const similarities = allRecipes
    .filter(recipe => {
      // Exclude the target recipe itself if requested
      if (excludeExact && recipe.id === targetRecipe.id) {
        return false;
      }
      return true;
    })
    .map(recipe => ({
      recipe,
      similarity: calculateRecipeSimilarity(targetRecipe, recipe, weights)
    }))
    .filter(item => item.similarity.overall >= minSimilarity)
    .sort((a, b) => b.similarity.overall - a.similarity.overall)
    .slice(0, maxResults);

  return similarities;
};

/**
 * Get "if you like this, try this" recommendations based on user favorites
 * @param {Array} favoriteRecipes - User's favorite recipes
 * @param {Array} allRecipes - All available recipes
 * @param {Object} options - Recommendation options
 * @returns {Array} Recommended recipes based on favorites
 */
export const getIfYouLikeThisTryThis = (favoriteRecipes, allRecipes, options = {}) => {
  const {
    maxRecommendations = 10,
    minSimilarity = 0.4,
    diversityFactor = 0.3 // How much to prioritize diverse recommendations
  } = options;

  if (!Array.isArray(favoriteRecipes) || !Array.isArray(allRecipes)) {
    return [];
  }

  if (favoriteRecipes.length === 0) {
    return [];
  }

  const recommendations = new Map();

  // For each favorite recipe, find similar recipes
  favoriteRecipes.forEach(favorite => {
    const similar = findSimilarRecipes(favorite, allRecipes, {
      maxResults: Math.ceil(maxRecommendations / favoriteRecipes.length) + 2,
      minSimilarity,
      excludeExact: true
    });

    similar.forEach(({ recipe, similarity }) => {
      if (!recommendations.has(recipe.id)) {
        recommendations.set(recipe.id, {
          recipe,
          totalSimilarity: similarity.overall,
          similarTo: [{ recipe: favorite, similarity: similarity.overall }],
          count: 1
        });
      } else {
        const existing = recommendations.get(recipe.id);
        existing.totalSimilarity += similarity.overall;
        existing.similarTo.push({ recipe: favorite, similarity: similarity.overall });
        existing.count++;
      }
    });
  });

  // Convert to array and calculate final scores
  const finalRecommendations = Array.from(recommendations.values())
    .map(item => ({
      ...item,
      averageSimilarity: item.totalSimilarity / item.count,
      diversityBonus: item.count > 1 ? diversityFactor : 0
    }))
    .sort((a, b) => {
      const scoreA = a.averageSimilarity + a.diversityBonus;
      const scoreB = b.averageSimilarity + b.diversityBonus;
      return scoreB - scoreA;
    })
    .slice(0, maxRecommendations);

  return finalRecommendations;
};

/**
 * Create recipe clusters based on similarity
 * @param {Array} recipes - Recipes to cluster
 * @param {Object} options - Clustering options
 * @returns {Array} Array of recipe clusters
 */
export const createRecipeClusters = (recipes, options = {}) => {
  const {
    minClusterSize = 2,
    maxClusters = 10,
    similarityThreshold = 0.6
  } = options;

  if (!Array.isArray(recipes) || recipes.length < minClusterSize) {
    return [];
  }

  const clusters = [];
  const processed = new Set();

  recipes.forEach(recipe => {
    if (processed.has(recipe.id)) {
      return;
    }

    const cluster = {
      id: `cluster_${clusters.length + 1}`,
      recipes: [recipe],
      centerRecipe: recipe,
      averageSimilarity: 0
    };

    // Find similar recipes for this cluster
    const similar = findSimilarRecipes(recipe, recipes, {
      maxResults: recipes.length,
      minSimilarity: similarityThreshold,
      excludeExact: true
    });

    let totalSimilarity = 0;
    similar.forEach(({ recipe: similarRecipe, similarity }) => {
      if (!processed.has(similarRecipe.id)) {
        cluster.recipes.push(similarRecipe);
        processed.add(similarRecipe.id);
        totalSimilarity += similarity.overall;
      }
    });

    if (cluster.recipes.length >= minClusterSize) {
      cluster.averageSimilarity = totalSimilarity / (cluster.recipes.length - 1);
      clusters.push(cluster);
    }

    processed.add(recipe.id);
  });

  // Sort clusters by size and average similarity
  return clusters
    .sort((a, b) => {
      if (a.recipes.length !== b.recipes.length) {
        return b.recipes.length - a.recipes.length;
      }
      return b.averageSimilarity - a.averageSimilarity;
    })
    .slice(0, maxClusters);
};
