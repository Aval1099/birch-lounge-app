// =============================================================================
// MOCKTAIL UTILITIES
// =============================================================================

import { getSampleMocktails } from '../data/sampleMocktails';

/**
 * Check if sample mocktails should be loaded
 * Only loads if there are no existing mocktails in the recipes
 */
export const shouldLoadSampleMocktails = (existingRecipes = []) => {
  const existingMocktails = existingRecipes.filter(
    recipe => recipe.category?.toLowerCase() === 'mocktail'
  );
  
  // Load samples if there are fewer than 3 mocktails
  return existingMocktails.length < 3;
};

/**
 * Get sample mocktails for initial app setup
 */
export const getInitialMocktails = (existingRecipes = []) => {
  if (!shouldLoadSampleMocktails(existingRecipes)) {
    return [];
  }
  
  return getSampleMocktails();
};

/**
 * Filter recipes by alcohol content
 */
export const filterRecipesByAlcoholContent = (recipes, alcoholContent) => {
  if (!alcoholContent || alcoholContent === 'all') {
    return recipes;
  }
  
  return recipes.filter(recipe => {
    if (alcoholContent === 'alcoholic') {
      return recipe.alcoholContent === 'alcoholic' || 
             (recipe.category && recipe.category.toLowerCase() !== 'mocktail');
    }
    
    if (alcoholContent === 'non_alcoholic') {
      return recipe.alcoholContent === 'non_alcoholic' || 
             (recipe.category && recipe.category.toLowerCase() === 'mocktail');
    }
    
    return true;
  });
};

/**
 * Get alcohol content display text
 */
export const getAlcoholContentDisplay = (alcoholContent) => {
  switch (alcoholContent) {
    case 'alcoholic':
      return 'Alcoholic';
    case 'non_alcoholic':
      return 'Non-Alcoholic';
    case 'low_alcohol':
      return 'Low Alcohol';
    default:
      return 'Unknown';
  }
};

/**
 * Check if a recipe is a mocktail
 */
export const isMocktail = (recipe) => {
  return recipe.category?.toLowerCase() === 'mocktail' || 
         recipe.alcoholContent === 'non_alcoholic';
};

/**
 * Get mocktail-specific flavor profiles
 */
export const getMocktailFlavorProfiles = () => [
  'refreshing', 'tropical', 'creamy', 'fizzy', 'tart', 'aromatic',
  'citrusy', 'fruity', 'herbal', 'sweet', 'bright', 'floral'
];

/**
 * Suggest mocktail garnishes based on ingredients
 */
export const suggestMocktailGarnish = (ingredients) => {
  const ingredientNames = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
  
  if (ingredientNames.includes('mint')) {
    return 'Fresh mint sprig';
  }
  
  if (ingredientNames.includes('lime') || ingredientNames.includes('lemon')) {
    return 'Citrus wheel and mint sprig';
  }
  
  if (ingredientNames.includes('cucumber')) {
    return 'Cucumber ribbon';
  }
  
  if (ingredientNames.includes('pineapple')) {
    return 'Pineapple wedge and cocktail umbrella';
  }
  
  if (ingredientNames.includes('berry') || ingredientNames.includes('cherry')) {
    return 'Fresh berries';
  }
  
  return 'Fresh fruit garnish';
};

/**
 * Get recommended glassware for mocktails
 */
export const getMocktailGlassware = () => [
  'Highball Glass',
  'Collins Glass', 
  'Rocks Glass',
  'Hurricane Glass',
  'Coupe Glass',
  'Wine Glass',
  'Mug',
  'Mason Jar'
];
