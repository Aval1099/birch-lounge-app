// =============================================================================
// DATA MODELS & VALIDATION
// =============================================================================

import { DIFFICULTY_LEVELS } from '../constants';
import { getRecipeAlcoholContent } from '../services/enhancedRecipeParser';
import { generateId, safeParseFloat, safeParseInt, sanitizeInput } from '../utils';

/**
 * Create a new ingredient with validation
 * @param {Object} data - Ingredient data
 * @returns {Object} Validated ingredient object
 */
export const createIngredient = (data = {}) => {
  const ingredient = {
    id: data.id || generateId('ing'),
    name: sanitizeInput(String(data.name || '')),
    price: Math.max(0, safeParseFloat(data.price)),
    unit: sanitizeInput(String(data.unit || 'oz')),
    category: sanitizeInput(String(data.category || 'Other')),
    allergens: Array.isArray(data.allergens) ? data.allergens : []
  };

  // Determine if ingredient is alcoholic based on category
  const alcoholicCategories = [
    'whiskey', 'gin', 'rum', 'vodka', 'agave', 'cordials/liqueur', 'amari',
    'beer', 'wine', 'misc spirits', 'brandy'
  ];

  ingredient.isAlcoholic = alcoholicCategories.includes(ingredient.category.toLowerCase());

  return ingredient;
};

/**
 * Create version metadata with defaults
 * @param {Object} data - Version metadata
 * @returns {Object} Validated version metadata
 */
export const createVersionMetadata = (data = {}) => {
  return {
    versionNumber: sanitizeInput(String(data.versionNumber || '1.0')),
    versionName: data.versionName ? sanitizeInput(String(data.versionName)) : undefined,
    parentRecipeId: data.parentRecipeId ? sanitizeInput(String(data.parentRecipeId)) : undefined,
    baseVersionId: data.baseVersionId ? sanitizeInput(String(data.baseVersionId)) : undefined,
    isMainVersion: Boolean(data.isMainVersion),
    versionType: ['original', 'variation', 'improvement', 'seasonal', 'custom', 'source'].includes(data.versionType)
      ? data.versionType
      : 'original',
    changeDescription: data.changeDescription ? sanitizeInput(String(data.changeDescription)) : undefined,
    createdBy: data.createdBy ? sanitizeInput(String(data.createdBy)) : undefined,
    approvedBy: data.approvedBy ? sanitizeInput(String(data.approvedBy)) : undefined,
    versionStatus: ['draft', 'published', 'archived', 'deprecated'].includes(data.versionStatus)
      ? data.versionStatus
      : 'draft',
    branchReason: data.branchReason ? sanitizeInput(String(data.branchReason)) : undefined,
    mergeableWith: Array.isArray(data.mergeableWith)
      ? data.mergeableWith.map(id => sanitizeInput(String(id)))
      : [],
    sourceAttribution: data.sourceAttribution ? {
      sourceName: sanitizeInput(String(data.sourceAttribution.sourceName || '')),
      sourceType: ['book', 'website', 'bartender', 'original', 'ai_generated', 'user_created'].includes(data.sourceAttribution.sourceType)
        ? data.sourceAttribution.sourceType
        : 'original',
      sourceUrl: data.sourceAttribution.sourceUrl ? sanitizeInput(String(data.sourceAttribution.sourceUrl)) : undefined,
      sourceAuthor: data.sourceAttribution.sourceAuthor ? sanitizeInput(String(data.sourceAttribution.sourceAuthor)) : undefined,
      sourcePage: data.sourceAttribution.sourcePage ? sanitizeInput(String(data.sourceAttribution.sourcePage)) : undefined,
      scrapedAt: data.sourceAttribution.scrapedAt || undefined,
      confidence: typeof data.sourceAttribution.confidence === 'number'
        ? Math.max(0, Math.min(1, data.sourceAttribution.confidence))
        : undefined
    } : undefined
  };
};

/**
 * Create a new recipe with validation and versioning support
 * @param {Object} data - Recipe data
 * @returns {Object} Validated recipe object
 */
export const createRecipe = (data = {}) => {
  // Handle legacy version field
  const versionMetadata = data.versionMetadata || createVersionMetadata({
    versionNumber: data.version || '1.0',
    isMainVersion: data.isOriginalVersion !== false,
    versionType: 'original'
  });

  const recipe = {
    id: data.id || generateId('recipe'),
    name: sanitizeInput(String(data.name || '')),
    version: sanitizeInput(String(data.version || versionMetadata.versionNumber)), // Keep for backward compatibility
    versionMetadata,
    category: sanitizeInput(String(data.category || '')),
    source: sanitizeInput(String(data.source || 'Original')),
    isOriginalVersion: Boolean(data.isOriginalVersion), // Keep for backward compatibility
    isFavorite: Boolean(data.isFavorite),
    flavorProfile: Array.isArray(data.flavorProfile)
      ? data.flavorProfile.map(f => sanitizeInput(String(f)))
      : [],
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    instructions: sanitizeInput(String(data.instructions || '')),
    glassware: sanitizeInput(String(data.glassware || '')),
    garnish: sanitizeInput(String(data.garnish || '')),
    prepTime: Math.max(0, safeParseInt(data.prepTime)),
    difficulty: DIFFICULTY_LEVELS.includes(data.difficulty) ? data.difficulty : 'Easy',
    notes: sanitizeInput(String(data.notes || '')),
    anecdotes: sanitizeInput(String(data.anecdotes || '')),
    history: sanitizeInput(String(data.history || '')),
    tags: Array.isArray(data.tags)
      ? data.tags.map(t => sanitizeInput(String(t)))
      : [],
    yields: Math.max(1, safeParseInt(data.yields, 1)),

    // Versioning fields
    recipeFamily: data.recipeFamily || data.id || generateId('family'),
    versionHistory: Array.isArray(data.versionHistory) ? data.versionHistory : [],
    relatedVersions: Array.isArray(data.relatedVersions)
      ? data.relatedVersions.map(id => sanitizeInput(String(id)))
      : [],
    conflictsWith: Array.isArray(data.conflictsWith)
      ? data.conflictsWith.map(id => sanitizeInput(String(id)))
      : [],

    createdAt: data.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // Automatically determine alcohol content
  recipe.alcoholContent = data.alcoholContent || getRecipeAlcoholContent(recipe);

  return recipe;
};

/**
 * Validate recipe data
 * @param {Object} recipe - Recipe to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateRecipe = (recipe) => {
  const errors = [];

  if (!recipe.name || recipe.name.trim().length === 0) {
    errors.push('Recipe name is required');
  }

  if (!recipe.version || recipe.version.trim().length === 0) {
    errors.push('Version is required');
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  } else {
    // Validate each ingredient
    recipe.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name || ingredient.name.trim().length === 0) {
        errors.push(`Ingredient ${index + 1}: Name is required`);
      }
      if (!ingredient.amount || isNaN(parseFloat(ingredient.amount))) {
        errors.push(`Ingredient ${index + 1}: Valid amount is required`);
      }
      if (!ingredient.unit || ingredient.unit.trim().length === 0) {
        errors.push(`Ingredient ${index + 1}: Unit is required`);
      }
    });
  }

  if (!recipe.instructions || recipe.instructions.trim().length === 0) {
    errors.push('Instructions are required');
  }

  // Additional validation rules
  if (recipe.name && recipe.name.length > 100) {
    errors.push('Recipe name must be less than 100 characters');
  }

  if (recipe.instructions && recipe.instructions.length > 2000) {
    errors.push('Instructions must be less than 2000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate ingredient data
 * @param {Object} ingredient - Ingredient to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateIngredient = (ingredient) => {
  const errors = [];

  if (!ingredient.name || ingredient.name.trim().length === 0) {
    errors.push('Ingredient name is required');
  }

  if (ingredient.name && ingredient.name.length > 50) {
    errors.push('Ingredient name must be less than 50 characters');
  }

  if (ingredient.price !== undefined && (isNaN(ingredient.price) || ingredient.price < 0)) {
    errors.push('Price must be a non-negative number');
  }

  if (!ingredient.unit || ingredient.unit.trim().length === 0) {
    errors.push('Unit is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new menu with validation
 * @param {Object} data - Menu data
 * @returns {Object} Validated menu object
 */
export const createMenu = (data = {}) => ({
  id: data.id || generateId('menu'),
  name: sanitizeInput(String(data.name || '')),
  items: Array.isArray(data.items) ? data.items : [],
  createdAt: data.createdAt || Date.now(),
  updatedAt: Date.now()
});

/**
 * Create a new batch with validation
 * @param {Object} data - Batch data
 * @returns {Object} Validated batch object
 */
export const createBatch = (data = {}) => ({
  id: data.id || generateId('batch'),
  name: sanitizeInput(String(data.name || '')),
  recipe: data.recipe || null,
  servings: Math.max(1, safeParseInt(data.servings, 1)),
  createdAt: data.createdAt || Date.now()
});

/**
 * Create a recipe family
 * @param {Object} data - Recipe family data
 * @returns {Object} Validated recipe family object
 */
export const createRecipeFamily = (data = {}) => ({
  id: data.id || generateId('family'),
  name: sanitizeInput(String(data.name || '')),
  description: data.description ? sanitizeInput(String(data.description)) : undefined,
  mainVersionId: sanitizeInput(String(data.mainVersionId || '')),
  versions: Array.isArray(data.versions) ? data.versions : [],
  totalVersions: Math.max(0, safeParseInt(data.totalVersions, 0)),
  createdAt: data.createdAt || Date.now(),
  updatedAt: data.updatedAt || Date.now(),
  tags: Array.isArray(data.tags)
    ? data.tags.map(t => sanitizeInput(String(t)))
    : [],
  category: sanitizeInput(String(data.category || '')),
  isArchived: Boolean(data.isArchived)
});

/**
 * Create a version history entry
 * @param {Object} data - Version history data
 * @returns {Object} Validated version history entry
 */
export const createVersionHistoryEntry = (data = {}) => ({
  id: data.id || generateId('history'),
  recipeId: sanitizeInput(String(data.recipeId || '')),
  versionId: sanitizeInput(String(data.versionId || '')),
  action: ['created', 'modified', 'published', 'archived', 'branched', 'merged'].includes(data.action)
    ? data.action
    : 'created',
  timestamp: data.timestamp || Date.now(),
  userId: data.userId ? sanitizeInput(String(data.userId)) : undefined,
  changes: Array.isArray(data.changes)
    ? data.changes.map(c => sanitizeInput(String(c)))
    : [],
  previousVersionId: data.previousVersionId ? sanitizeInput(String(data.previousVersionId)) : undefined,
  metadata: data.metadata || {}
});

/**
 * Generate next version number
 * @param {string} currentVersion - Current version number
 * @param {string} incrementType - Type of increment (major, minor, patch)
 * @returns {string} Next version number
 */
export const generateNextVersion = (currentVersion = '1.0', incrementType = 'minor') => {
  const parts = currentVersion.split('.').map(p => parseInt(p) || 0);

  // Ensure we have at least major.minor format
  while (parts.length < 2) {
    parts.push(0);
  }

  switch (incrementType) {
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      if (parts.length > 2) parts[2] = 0;
      break;
    case 'minor':
      parts[1] += 1;
      if (parts.length > 2) parts[2] = 0;
      break;
    case 'patch':
      if (parts.length < 3) parts.push(1);
      else parts[2] += 1;
      break;
    default:
      parts[1] += 1;
  }

  return parts.join('.');
};

/**
 * Check if a recipe is the main version in its family
 * @param {Object} recipe - Recipe to check
 * @returns {boolean} Is main version
 */
export const isMainVersion = (recipe) => {
  return recipe?.versionMetadata?.isMainVersion === true;
};

/**
 * Get recipe display name with version and source
 * @param {Object} recipe - Recipe object
 * @returns {string} Display name with version
 */
export const getRecipeDisplayName = (recipe) => {
  if (!recipe) return '';

  const baseName = recipe.name || 'Untitled Recipe';
  const versionInfo = recipe.versionMetadata;

  if (!versionInfo) return baseName;

  // For source-based versions, prioritize source name
  if (versionInfo.versionType === 'source' && versionInfo.sourceAttribution?.sourceName) {
    return `${baseName} (${versionInfo.sourceAttribution.sourceName})`;
  }

  if (versionInfo.versionName) {
    return `${baseName} (${versionInfo.versionName})`;
  }

  if (versionInfo.versionNumber && versionInfo.versionNumber !== '1.0') {
    return `${baseName} v${versionInfo.versionNumber}`;
  }

  return baseName;
};

/**
 * Create a source-based version for scraped recipes
 * @param {Object} recipeData - Base recipe data
 * @param {Object} sourceInfo - Source attribution information
 * @returns {Object} Recipe with source version metadata
 */
export const createSourceVersion = (recipeData, sourceInfo) => {
  const sourceAttribution = {
    sourceName: sourceInfo.sourceName || 'Unknown Source',
    sourceType: sourceInfo.sourceType || 'website',
    sourceUrl: sourceInfo.sourceUrl,
    sourceAuthor: sourceInfo.sourceAuthor,
    sourcePage: sourceInfo.sourcePage,
    scrapedAt: new Date().toISOString(),
    confidence: sourceInfo.confidence || 0.8
  };

  const versionMetadata = createVersionMetadata({
    versionNumber: '1.0',
    versionType: 'source',
    versionName: sourceAttribution.sourceName,
    isMainVersion: false, // Source versions are not main by default
    versionStatus: 'published',
    changeDescription: `Imported from ${sourceAttribution.sourceName}`,
    branchReason: `Recipe scraped from ${sourceAttribution.sourceName}`,
    sourceAttribution
  });

  return createRecipe({
    ...recipeData,
    versionMetadata,
    source: sourceAttribution.sourceName
  });
};

/**
 * Check if a recipe family already has a version from a specific source
 * @param {Array} versions - Array of recipe versions
 * @param {string} sourceName - Source name to check
 * @returns {Object|null} Existing source version or null
 */
export const findExistingSourceVersion = (versions, sourceName) => {
  return versions.find(version =>
    version.versionMetadata?.versionType === 'source' &&
    version.versionMetadata?.sourceAttribution?.sourceName === sourceName
  ) || null;
};

/**
 * Get source display info for UI
 * @param {Object} recipe - Recipe object
 * @returns {Object} Source display information
 */
export const getSourceDisplayInfo = (recipe) => {
  const sourceAttribution = recipe?.versionMetadata?.sourceAttribution;

  if (!sourceAttribution) {
    return {
      displayName: 'Original',
      type: 'original',
      icon: '📝',
      color: 'blue'
    };
  }

  const sourceTypeConfig = {
    book: { icon: '📚', color: 'green' },
    website: { icon: '🌐', color: 'blue' },
    bartender: { icon: '🍸', color: 'purple' },
    original: { icon: '📝', color: 'blue' },
    ai_generated: { icon: '🤖', color: 'orange' },
    user_created: { icon: '👤', color: 'gray' }
  };

  const config = sourceTypeConfig[sourceAttribution.sourceType] || sourceTypeConfig.original;

  return {
    displayName: sourceAttribution.sourceName,
    type: sourceAttribution.sourceType,
    author: sourceAttribution.sourceAuthor,
    url: sourceAttribution.sourceUrl,
    page: sourceAttribution.sourcePage,
    confidence: sourceAttribution.confidence,
    scrapedAt: sourceAttribution.scrapedAt,
    ...config
  };
};
