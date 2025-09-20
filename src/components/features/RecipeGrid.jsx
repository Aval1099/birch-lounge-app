
/* eslint-disable unused-imports/no-unused-imports */
import { ChefHat, Clock, DollarSign, Edit3, GitCompare, Heart, Plus, Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';

import { ActionType } from '../../constants';
import { useSelectors } from '../../hooks';
import { useApp } from '../../hooks/useApp';
import { formatCurrency } from '../../utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ResponsiveGrid from '../ui/ResponsiveGrid';
import { RecipeSkeleton } from '../ui/SkeletonLoader';

/**
 * Recipe Grid Component - Displays recipes in a responsive grid layout
 */
const RecipeGrid = memo(() => {
  const { state, dispatch } = useApp();
  const { selectFilteredRecipeGroups, calculateRecipeCost } = useSelectors();
  const { groups, orderedGroupNames } = selectFilteredRecipeGroups;

  // All hooks must be called before any early returns
  const handleEditRecipe = useCallback((recipe) => {
    dispatch({
      type: ActionType.OPEN_MODAL,
      payload: { type: 'recipe', data: recipe }
    });
  }, [dispatch]);

  const handleDeleteRecipe = useCallback((recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      dispatch({
        type: ActionType.DELETE_RECIPE,
        payload: recipeId
      });
    }
  }, [dispatch]);

  const handleToggleFavorite = useCallback((recipeId, isFavorite) => {
    dispatch({
      type: ActionType.TOGGLE_FAVORITE,
      payload: { recipeId, isFavorite: !isFavorite }
    });
  }, [dispatch]);

  const handleToggleComparison = useCallback((recipeId) => {
    dispatch({
      type: ActionType.TOGGLE_COMPARE_SELECTION,
      payload: recipeId
    });
  }, [dispatch]);

  const handleAddToMenu = useCallback((recipe) => {
    dispatch({
      type: ActionType.ADD_RECIPE_TO_MENU,
      payload: { menuId: 'current', recipe }
    });
  }, [dispatch]);

  const handleSetBatch = useCallback((recipe) => {
    dispatch({
      type: ActionType.SET_BATCH_RECIPE,
      payload: recipe
    });
    dispatch({
      type: ActionType.SET_ACTIVE_TAB,
      payload: 'batch'
    });
  }, [dispatch]);

  const handleCreateNewRecipe = useCallback(() => {
    dispatch({
      type: ActionType.OPEN_MODAL,
      payload: { type: 'recipe', data: null }
    });
  }, [dispatch]);

  // Show skeleton loading during app initialization
  if (!state.isInitialized) {
    return <RecipeSkeleton count={6} />;
  }

  if (orderedGroupNames.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No recipes found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {state.filters.searchTerm || state.filters.category !== 'All' || state.filters.favoritesOnly
            ? 'Try adjusting your filters to see more recipes.'
            : 'Get started by creating your first recipe.'}
        </p>
        <Button
          onClick={handleCreateNewRecipe}
          variant="primary"
          className="inline-flex items-center gap-2"
          ariaLabel="Create new recipe"
        >
          <Plus className="w-4 h-4" />
          Create Recipe
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Recipe Count Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {state.recipes.length} recipes
        </h2>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orderedGroupNames.map(recipeName => {
          const recipeGroup = groups[recipeName];
          const primaryRecipe = recipeGroup[0];
          const variants = recipeGroup.slice(1);
          const recipeCost = calculateRecipeCost(primaryRecipe.ingredients);

          return (
            <div key={recipeName} className="space-y-4">
              {/* Primary Recipe Card */}
              <Card
                interactive={true}
                onClick={() => handleEditRecipe(primaryRecipe)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {primaryRecipe.name}
                        </h3>
                        {primaryRecipe.isOriginalVersion && (
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                            Original
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{primaryRecipe.version}</span>
                        {primaryRecipe.category && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                            {primaryRecipe.category}
                          </span>
                        )}
                        {primaryRecipe.difficulty && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            {primaryRecipe.difficulty}
                          </span>
                        )}
                        {primaryRecipe.prepTime > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {primaryRecipe.prepTime} min
                          </div>
                        )}
                        {recipeCost > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(recipeCost)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Favorite Button */}
                      <Button
                        onClick={() => handleToggleFavorite(primaryRecipe.id, primaryRecipe.isFavorite)}
                        variant="ghost"
                        className="p-2"
                        ariaLabel={primaryRecipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-5 h-5 ${primaryRecipe.isFavorite
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                            }`}
                        />
                      </Button>

                      {/* Comparison Toggle */}
                      {state.comparison.isActive && (
                        <Button
                          onClick={() => handleToggleComparison(primaryRecipe.id)}
                          variant={state.comparison.selectedIds.includes(primaryRecipe.id) ? 'primary' : 'ghost'}
                          className="p-2"
                          ariaLabel="Toggle comparison selection"
                        >
                          <GitCompare className="w-5 h-5" />
                        </Button>
                      )}

                      {/* Edit Button */}
                      <Button
                        onClick={() => handleEditRecipe(primaryRecipe)}
                        variant="ghost"
                        className="p-2"
                        ariaLabel="Edit recipe"
                      >
                        <Edit3 className="w-5 h-5" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        onClick={() => handleDeleteRecipe(primaryRecipe.id)}
                        variant="ghost"
                        className="p-2 text-red-600 hover:text-red-700"
                        ariaLabel="Delete recipe"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Flavor Profile Tags */}
                  {primaryRecipe.flavorProfile && primaryRecipe.flavorProfile.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {primaryRecipe.flavorProfile.map(flavor => (
                        <span
                          key={flavor}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          {flavor}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ingredients Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Ingredients ({primaryRecipe.ingredients.length})
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {primaryRecipe.ingredients.slice(0, 3).map((ing, idx) => (
                        <span key={idx}>
                          {ing.amount} {ing.unit} {ing.name}
                          {idx < Math.min(2, primaryRecipe.ingredients.length - 1) && ', '}
                        </span>
                      ))}
                      {primaryRecipe.ingredients.length > 3 && (
                        <span> and {primaryRecipe.ingredients.length - 3} more...</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleAddToMenu(primaryRecipe)}
                      variant="primary"
                      size="sm"
                      ariaLabel="Add to current menu"
                    >
                      Add to Menu
                    </Button>
                    <Button
                      onClick={() => handleSetBatch(primaryRecipe)}
                      variant="default"
                      size="sm"
                      ariaLabel="Set for batch scaling"
                    >
                      Batch Scale
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Recipe Variants */}
              {variants.length > 0 && (
                <div className="ml-6 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variants ({variants.length})
                  </h4>
                  <ResponsiveGrid
                    cols={{ xs: 1, sm: 1, md: 2, lg: 3 }}
                    gap="gap-3"
                  >
                    {variants.map(variant => (
                      <div
                        key={variant.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100">
                              {variant.version}
                            </h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {variant.source}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditRecipe(variant)}
                              variant="ghost"
                              className="p-1"
                              size="sm"
                              ariaLabel="Edit variant"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteRecipe(variant.id)}
                              variant="ghost"
                              className="p-1 text-red-600"
                              size="sm"
                              ariaLabel="Delete variant"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAddToMenu(variant)}
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            ariaLabel="Add variant to menu"
                          >
                            Add to Menu
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ResponsiveGrid>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

RecipeGrid.displayName = 'RecipeGrid';

export default RecipeGrid;
