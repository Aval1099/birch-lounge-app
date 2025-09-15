// =============================================================================
// DATA MODELS & VALIDATION
// =============================================================================

import { generateId, safeParseFloat, safeParseInt, sanitizeInput } from '../utils';
import { DIFFICULTY_LEVELS } from '../constants';

/**
 * Create a new ingredient with validation
 * @param {Object} data - Ingredient data
 * @returns {Object} Validated ingredient object
 */
export const createIngredient = (data = {}) => ({
  id: data.id || generateId('ing'),
  name: sanitizeInput(String(data.name || '')),
  price: Math.max(0, safeParseFloat(data.price)),
  unit: sanitizeInput(String(data.unit || 'oz')),
  category: sanitizeInput(String(data.category || 'Other')),
  allergens: Array.isArray(data.allergens) ? data.allergens : []
});

/**
 * Create a new recipe with validation
 * @param {Object} data - Recipe data
 * @returns {Object} Validated recipe object
 */
export const createRecipe = (data = {}) => ({
  id: data.id || generateId('recipe'),
  name: sanitizeInput(String(data.name || '')),
  version: sanitizeInput(String(data.version || '')),
  category: sanitizeInput(String(data.category || '')),
  source: sanitizeInput(String(data.source || 'Original')),
  isOriginalVersion: Boolean(data.isOriginalVersion),
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
  createdAt: data.createdAt || Date.now(),
  updatedAt: Date.now()
});

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
