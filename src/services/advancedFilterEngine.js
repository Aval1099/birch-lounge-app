/**
 * Advanced Filter Engine for Recipe Search
 * Provides multi-dimensional filtering capabilities including ABV range,
 * difficulty level, preparation time, equipment requirements, and more.
 */

/**
 * Difficulty level mappings based on recipe complexity
 */
const DIFFICULTY_MAPPINGS = {
  Easy: {
    maxIngredients: 4,
    maxPrepTime: 3,
    allowedTechniques: ['build', 'shake', 'stir'],
    excludedTechniques: ['clarify', 'fat wash', 'molecular', 'flame'],
    scoreRange: [1, 3]
  },
  Medium: {
    maxIngredients: 6,
    maxPrepTime: 5,
    allowedTechniques: ['build', 'shake', 'stir', 'muddle', 'strain', 'layer'],
    excludedTechniques: ['clarify', 'fat wash', 'molecular'],
    scoreRange: [4, 6]
  },
  Hard: {
    maxIngredients: 8,
    maxPrepTime: 8,
    allowedTechniques: ['build', 'shake', 'stir', 'muddle', 'strain', 'layer', 'double strain', 'dry shake'],
    excludedTechniques: ['molecular'],
    scoreRange: [7, 8]
  },
  Expert: {
    maxIngredients: 12,
    maxPrepTime: 15,
    allowedTechniques: ['all'],
    excludedTechniques: [],
    scoreRange: [9, 10]
  }
};

/**
 * Equipment requirements mapping
 */
const EQUIPMENT_MAPPINGS = {
  shaker: ['shake', 'dry shake', 'reverse dry shake'],
  strainer: ['strain', 'double strain', 'fine strain'],
  muddler: ['muddle'],
  blender: ['blend', 'frozen'],
  torch: ['flame', 'caramelize'],
  juicer: ['fresh juice'],
  fine_mesh: ['clarify', 'fine strain'],
  smoking_gun: ['smoke'],
  centrifuge: ['clarify', 'molecular'],
  immersion_circulator: ['sous vide'],
  liquid_nitrogen: ['molecular', 'frozen']
};

/**
 * Preparation time categories
 */
const PREP_TIME_CATEGORIES = {
  'Under 3 min': { min: 0, max: 3 },
  '3-5 min': { min: 3, max: 5 },
  '5-10 min': { min: 5, max: 10 },
  '10+ min': { min: 10, max: 60 }
};

/**
 * Filter recipes by ABV range
 * @param {Array} recipes - Recipe list
 * @param {Array} abvRange - [min, max] ABV values
 * @returns {Array} Filtered recipes
 */
export const filterByABVRange = (recipes, abvRange) => {
  if (!Array.isArray(recipes) || !Array.isArray(abvRange) || abvRange.length !== 2) {
    return recipes;
  }

  const [minABV, maxABV] = abvRange;
  
  return recipes.filter(recipe => {
    if (typeof recipe.abv !== 'number') return true; // Include if ABV unknown
    return recipe.abv >= minABV && recipe.abv <= maxABV;
  });
};

/**
 * Filter recipes by difficulty level
 * @param {Array} recipes - Recipe list
 * @param {string} difficultyLevel - Difficulty level (Easy, Medium, Hard, Expert)
 * @returns {Array} Filtered recipes
 */
export const filterByDifficulty = (recipes, difficultyLevel) => {
  if (!Array.isArray(recipes) || !difficultyLevel || !DIFFICULTY_MAPPINGS[difficultyLevel]) {
    return recipes;
  }

  const criteria = DIFFICULTY_MAPPINGS[difficultyLevel];
  
  return recipes.filter(recipe => {
    // Check ingredient count
    if (recipe.ingredients && recipe.ingredients.length > criteria.maxIngredients) {
      return false;
    }

    // Check preparation time
    if (recipe.prepTime && recipe.prepTime > criteria.maxPrepTime) {
      return false;
    }

    // Check techniques
    if (recipe.techniques && Array.isArray(recipe.techniques)) {
      const hasExcludedTechnique = recipe.techniques.some(technique =>
        criteria.excludedTechniques.includes(technique.toLowerCase())
      );
      if (hasExcludedTechnique) return false;

      if (criteria.allowedTechniques[0] !== 'all') {
        const hasAllowedTechnique = recipe.techniques.some(technique =>
          criteria.allowedTechniques.includes(technique.toLowerCase())
        );
        if (!hasAllowedTechnique) return false;
      }
    }

    // Check difficulty score if available
    if (recipe.difficultyScore) {
      const [minScore, maxScore] = criteria.scoreRange;
      if (recipe.difficultyScore < minScore || recipe.difficultyScore > maxScore) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Filter recipes by preparation time
 * @param {Array} recipes - Recipe list
 * @param {string|Object} prepTimeFilter - Time category or {min, max} object
 * @returns {Array} Filtered recipes
 */
export const filterByPrepTime = (recipes, prepTimeFilter) => {
  if (!Array.isArray(recipes) || !prepTimeFilter) {
    return recipes;
  }

  let timeRange;
  
  if (typeof prepTimeFilter === 'string' && PREP_TIME_CATEGORIES[prepTimeFilter]) {
    timeRange = PREP_TIME_CATEGORIES[prepTimeFilter];
  } else if (typeof prepTimeFilter === 'object' && prepTimeFilter.min !== undefined && prepTimeFilter.max !== undefined) {
    timeRange = prepTimeFilter;
  } else {
    return recipes;
  }

  return recipes.filter(recipe => {
    if (typeof recipe.prepTime !== 'number') return true; // Include if prep time unknown
    return recipe.prepTime >= timeRange.min && recipe.prepTime <= timeRange.max;
  });
};

/**
 * Filter recipes by required equipment
 * @param {Array} recipes - Recipe list
 * @param {Array} requiredEquipment - List of required equipment
 * @param {Array} excludedEquipment - List of equipment to exclude
 * @returns {Array} Filtered recipes
 */
export const filterByEquipment = (recipes, requiredEquipment = [], excludedEquipment = []) => {
  if (!Array.isArray(recipes)) {
    return recipes;
  }

  return recipes.filter(recipe => {
    if (!recipe.techniques || !Array.isArray(recipe.techniques)) {
      return requiredEquipment.length === 0; // Include if no techniques specified and no equipment required
    }

    const recipeTechniques = recipe.techniques.map(t => t.toLowerCase());

    // Check required equipment
    for (const equipment of requiredEquipment) {
      const requiredTechniques = EQUIPMENT_MAPPINGS[equipment] || [];
      const hasRequiredTechnique = requiredTechniques.some(technique =>
        recipeTechniques.includes(technique.toLowerCase())
      );
      if (!hasRequiredTechnique) return false;
    }

    // Check excluded equipment
    for (const equipment of excludedEquipment) {
      const excludedTechniques = EQUIPMENT_MAPPINGS[equipment] || [];
      const hasExcludedTechnique = excludedTechniques.some(technique =>
        recipeTechniques.includes(technique.toLowerCase())
      );
      if (hasExcludedTechnique) return false;
    }

    return true;
  });
};

/**
 * Filter recipes by ingredient count
 * @param {Array} recipes - Recipe list
 * @param {Object} ingredientCountFilter - {min, max} ingredient count
 * @returns {Array} Filtered recipes
 */
export const filterByIngredientCount = (recipes, ingredientCountFilter) => {
  if (!Array.isArray(recipes) || !ingredientCountFilter) {
    return recipes;
  }

  const { min = 0, max = 20 } = ingredientCountFilter;

  return recipes.filter(recipe => {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return true;
    const count = recipe.ingredients.length;
    return count >= min && count <= max;
  });
};

/**
 * Filter recipes by category
 * @param {Array} recipes - Recipe list
 * @param {Array} categories - List of allowed categories
 * @returns {Array} Filtered recipes
 */
export const filterByCategory = (recipes, categories) => {
  if (!Array.isArray(recipes) || !Array.isArray(categories) || categories.length === 0) {
    return recipes;
  }

  const normalizedCategories = categories.map(cat => cat.toLowerCase());

  return recipes.filter(recipe => {
    if (!recipe.category) return false;
    return normalizedCategories.includes(recipe.category.toLowerCase());
  });
};

/**
 * Filter recipes by flavor profile
 * @param {Array} recipes - Recipe list
 * @param {Array} flavorProfiles - Required flavor profiles
 * @param {string} matchType - 'any' or 'all'
 * @returns {Array} Filtered recipes
 */
export const filterByFlavorProfile = (recipes, flavorProfiles, matchType = 'any') => {
  if (!Array.isArray(recipes) || !Array.isArray(flavorProfiles) || flavorProfiles.length === 0) {
    return recipes;
  }

  const normalizedProfiles = flavorProfiles.map(profile => profile.toLowerCase());

  return recipes.filter(recipe => {
    if (!recipe.flavorProfile || !Array.isArray(recipe.flavorProfile)) return false;
    
    const recipeProfiles = recipe.flavorProfile.map(profile => profile.toLowerCase());

    if (matchType === 'all') {
      return normalizedProfiles.every(profile => recipeProfiles.includes(profile));
    } else {
      return normalizedProfiles.some(profile => recipeProfiles.includes(profile));
    }
  });
};

/**
 * Filter recipes by glass type
 * @param {Array} recipes - Recipe list
 * @param {Array} glassTypes - Allowed glass types
 * @returns {Array} Filtered recipes
 */
export const filterByGlassType = (recipes, glassTypes) => {
  if (!Array.isArray(recipes) || !Array.isArray(glassTypes) || glassTypes.length === 0) {
    return recipes;
  }

  const normalizedGlassTypes = glassTypes.map(glass => glass.toLowerCase());

  return recipes.filter(recipe => {
    if (!recipe.glassware) return false;
    return normalizedGlassTypes.includes(recipe.glassware.toLowerCase());
  });
};

/**
 * Apply multiple filters to recipe list
 * @param {Array} recipes - Recipe list
 * @param {Object} filters - Filter configuration object
 * @returns {Object} Filtered results with metadata
 */
export const applyAdvancedFilters = (recipes, filters = {}) => {
  const startTime = performance.now();

  try {
    if (!Array.isArray(recipes)) {
      throw new Error('Invalid recipes array');
    }

    let filteredRecipes = [...recipes];
    const appliedFilters = [];

    // Apply ABV range filter
    if (filters.abvRange && Array.isArray(filters.abvRange)) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByABVRange(filteredRecipes, filters.abvRange);
      appliedFilters.push({
        type: 'abvRange',
        value: filters.abvRange,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByDifficulty(filteredRecipes, filters.difficulty);
      appliedFilters.push({
        type: 'difficulty',
        value: filters.difficulty,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply preparation time filter
    if (filters.prepTime) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByPrepTime(filteredRecipes, filters.prepTime);
      appliedFilters.push({
        type: 'prepTime',
        value: filters.prepTime,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply equipment filters
    if (filters.requiredEquipment || filters.excludedEquipment) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByEquipment(
        filteredRecipes,
        filters.requiredEquipment,
        filters.excludedEquipment
      );
      appliedFilters.push({
        type: 'equipment',
        value: { required: filters.requiredEquipment, excluded: filters.excludedEquipment },
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply ingredient count filter
    if (filters.ingredientCount) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByIngredientCount(filteredRecipes, filters.ingredientCount);
      appliedFilters.push({
        type: 'ingredientCount',
        value: filters.ingredientCount,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply category filter
    if (filters.categories && Array.isArray(filters.categories)) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByCategory(filteredRecipes, filters.categories);
      appliedFilters.push({
        type: 'categories',
        value: filters.categories,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply flavor profile filter
    if (filters.flavorProfiles && Array.isArray(filters.flavorProfiles)) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByFlavorProfile(
        filteredRecipes,
        filters.flavorProfiles,
        filters.flavorMatchType
      );
      appliedFilters.push({
        type: 'flavorProfiles',
        value: filters.flavorProfiles,
        matchType: filters.flavorMatchType,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    // Apply glass type filter
    if (filters.glassTypes && Array.isArray(filters.glassTypes)) {
      const beforeCount = filteredRecipes.length;
      filteredRecipes = filterByGlassType(filteredRecipes, filters.glassTypes);
      appliedFilters.push({
        type: 'glassTypes',
        value: filters.glassTypes,
        removedCount: beforeCount - filteredRecipes.length
      });
    }

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      recipes: filteredRecipes,
      originalCount: recipes.length,
      filteredCount: filteredRecipes.length,
      appliedFilters,
      processingTime,
      stats: {
        totalFiltersApplied: appliedFilters.length,
        totalRecipesRemoved: recipes.length - filteredRecipes.length,
        filterEfficiency: filteredRecipes.length / recipes.length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      recipes,
      originalCount: recipes.length,
      filteredCount: recipes.length,
      appliedFilters: [],
      processingTime: performance.now() - startTime
    };
  }
};

/**
 * Get available filter options from recipe collection
 * @param {Array} recipes - Recipe collection
 * @returns {Object} Available filter options
 */
export const getAvailableFilterOptions = (recipes) => {
  if (!Array.isArray(recipes)) {
    return {};
  }

  const options = {
    abvRange: { min: 0, max: 50 },
    difficulties: Object.keys(DIFFICULTY_MAPPINGS),
    prepTimeCategories: Object.keys(PREP_TIME_CATEGORIES),
    equipment: Object.keys(EQUIPMENT_MAPPINGS),
    categories: [],
    flavorProfiles: [],
    glassTypes: []
  };

  // Extract unique values from recipes
  recipes.forEach(recipe => {
    if (recipe.category && !options.categories.includes(recipe.category)) {
      options.categories.push(recipe.category);
    }

    if (recipe.flavorProfile && Array.isArray(recipe.flavorProfile)) {
      recipe.flavorProfile.forEach(profile => {
        if (!options.flavorProfiles.includes(profile)) {
          options.flavorProfiles.push(profile);
        }
      });
    }

    if (recipe.glassware && !options.glassTypes.includes(recipe.glassware)) {
      options.glassTypes.push(recipe.glassware);
    }
  });

  // Calculate actual ABV range
  const abvValues = recipes
    .filter(recipe => typeof recipe.abv === 'number')
    .map(recipe => recipe.abv);
  
  if (abvValues.length > 0) {
    options.abvRange.min = Math.min(...abvValues);
    options.abvRange.max = Math.max(...abvValues);
  }

  return options;
};
