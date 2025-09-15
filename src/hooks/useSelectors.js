// =============================================================================
// OPTIMIZED SELECTORS HOOK
// =============================================================================

import { useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { safeParseFloat } from '../utils';

/**
 * Optimized selectors hook with memoization to prevent unnecessary re-renders
 * @returns {Object} Object containing all selector functions and computed values
 */
export const useSelectors = () => {
  const { state } = useApp();

  // Memoized recipe groups selector
  const selectRecipeGroups = useMemo(() => {
    const groups = {};
    
    state.recipes.forEach(recipe => {
      if (!groups[recipe.name]) {
        groups[recipe.name] = [];
      }
      groups[recipe.name].push(recipe);
    });

    // Sort each group to prioritize original versions
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        // Original versions first
        if (a.isOriginalVersion && !b.isOriginalVersion) return -1;
        if (!a.isOriginalVersion && b.isOriginalVersion) return 1;
        // Then by creation date (newest first)
        return b.createdAt - a.createdAt;
      });
    });

    return groups;
  }, [state.recipes]);

  // Memoized filtered recipe groups selector
  const selectFilteredRecipeGroups = useMemo(() => {
    const { searchTerm, category, flavorProfile, favoritesOnly } = state.filters;
    const term = searchTerm.toLowerCase().trim();

    // First, filter recipes based on criteria
    let filteredRecipes = state.recipes.filter(recipe => {
      // Favorites filter
      if (favoritesOnly && !recipe.isFavorite) return false;
      
      // Category filter
      if (category !== 'All' && recipe.category !== category) return false;
      
      // Flavor profile filter
      if (flavorProfile !== 'All' && !recipe.flavorProfile.includes(flavorProfile)) return false;
      
      return true;
    });

    // Apply search term with scoring
    if (term) {
      filteredRecipes = filteredRecipes
        .map(recipe => {
          let score = 0;
          const recipeName = recipe.name.toLowerCase();
          
          // Exact name match gets highest score
          if (recipeName === term) score = 5;
          // Name starts with term gets high score
          else if (recipeName.startsWith(term)) score = 4;
          // Name contains term gets medium score
          else if (recipeName.includes(term)) score = 3;
          // Ingredient match gets lower score
          else if (recipe.ingredients.some(i => 
            i.name.toLowerCase().includes(term)
          )) score = 2;
          // Tag match gets lowest score
          else if (recipe.tags.some(t => 
            t.toLowerCase().includes(term)
          )) score = 1;

          return { ...recipe, searchScore: score };
        })
        .filter(recipe => recipe.searchScore > 0)
        .sort((a, b) => {
          // Sort by search score first
          if (b.searchScore !== a.searchScore) {
            return b.searchScore - a.searchScore;
          }
          // Then alphabetically
          return a.name.localeCompare(b.name);
        });
    } else {
      // No search term, sort alphabetically
      filteredRecipes.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Group filtered recipes
    const groups = {};
    const orderedGroupNames = [];
    
    filteredRecipes.forEach(recipe => {
      if (!groups[recipe.name]) {
        groups[recipe.name] = selectRecipeGroups[recipe.name];
        orderedGroupNames.push(recipe.name);
      }
    });

    return { groups, orderedGroupNames };
  }, [state.recipes, state.filters, selectRecipeGroups]);

  // Memoized ingredients categorization
  const { spiritsAndCordials, otherIngredients } = useMemo(() => {
    const alcoholicCategories = [
      'Whiskey', 'Vodka', 'Gin', 'Tequila', 'Rum', 'Brandy', 
      'Cordials/Liqueurs', 'Amari', 'Beer', 'Wine', 'Misc Liqueur/Spirit'
    ];

    const spirits = [];
    const others = [];

    state.ingredients.forEach(ingredient => {
      if (alcoholicCategories.includes(ingredient.category)) {
        spirits.push(ingredient);
      } else {
        others.push(ingredient);
      }
    });

    return {
      spiritsAndCordials: spirits,
      otherIngredients: others
    };
  }, [state.ingredients]);

  // Memoized recipe cost calculation
  const calculateRecipeCost = useCallback((recipeIngredients) => {
    if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
      return 0;
    }

    return recipeIngredients.reduce((total, recipeIngredient) => {
      const ingredient = state.ingredients.find(i => 
        i.name.toLowerCase() === recipeIngredient.name.toLowerCase()
      );
      
      if (!ingredient) return total;
      
      const amount = safeParseFloat(recipeIngredient.amount);
      const price = safeParseFloat(ingredient.price);
      
      return total + (amount * price);
    }, 0);
  }, [state.ingredients]);

  // Memoized recipe scaling function
  const scaleRecipe = useCallback((recipe, servings) => {
    if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) {
      return [];
    }

    const targetServings = Math.max(1, safeParseFloat(servings));
    const originalYields = Math.max(1, safeParseFloat(recipe.yields || 1));
    const scaleFactor = targetServings / originalYields;

    return recipe.ingredients.map(ingredient => ({
      ...ingredient,
      amount: (safeParseFloat(ingredient.amount) * scaleFactor).toFixed(2)
    }));
  }, []);

  // Memoized compared recipes selector
  const selectComparedRecipes = useMemo(() => {
    return state.comparison.selectedIds
      .map(id => state.recipes.find(r => r.id === id))
      .filter(Boolean);
  }, [state.comparison.selectedIds, state.recipes]);

  // Memoized recipe statistics
  const recipeStats = useMemo(() => {
    const totalRecipes = state.recipes.length;
    const favoriteRecipes = state.recipes.filter(r => r.isFavorite).length;
    const categories = [...new Set(state.recipes.map(r => r.category))].length;
    const avgCost = totalRecipes > 0 
      ? state.recipes.reduce((sum, recipe) => 
          sum + calculateRecipeCost(recipe.ingredients), 0) / totalRecipes
      : 0;

    return {
      totalRecipes,
      favoriteRecipes,
      categories,
      avgCost: avgCost.toFixed(2)
    };
  }, [state.recipes, calculateRecipeCost]);

  return {
    selectRecipeGroups,
    selectFilteredRecipeGroups,
    spiritsAndCordials,
    otherIngredients,
    calculateRecipeCost,
    scaleRecipe,
    selectComparedRecipes,
    recipeStats
  };
};
