import { memo, useMemo } from 'react';

import { ActionType } from '../../constants';
import { useSelectors } from '../../hooks';
import { useApp } from '../../hooks/useApp';

/**
 * Recipe Comparison Modal Component
 * Displays side-by-side comparison of selected recipes
 */
const ComparisonModal = memo(() => {
  const { state, dispatch } = useApp();
  const { comparison, recipes } = state;
  const { calculateRecipeCost } = useSelectors();

  // Get selected recipes for comparison
  const selectedRecipes = useMemo(() => {
    return comparison.selectedIds
      .map(id => recipes.find(recipe => recipe.id === id))
      .filter(Boolean);
  }, [comparison.selectedIds, recipes]);

  const handleClose = () => {
    dispatch({ type: ActionType.CLOSE_MODAL });
  };

  const handleRemoveFromComparison = (recipeId) => {
    dispatch({
      type: ActionType.TOGGLE_COMPARE_SELECTION,
      payload: recipeId
    });
  };

  const handleClearComparison = () => {
    dispatch({
      type: ActionType.TOGGLE_COMPARISON_MODE
    });
    handleClose();
  };

  // Get comparison metrics
  const comparisonData = useMemo(() => {
    if (selectedRecipes.length === 0) return null;

    const metrics = {
      avgPrepTime: selectedRecipes.reduce((sum, recipe) => sum + (recipe.prepTime || 0), 0) / selectedRecipes.length,
      difficulties: [...new Set(selectedRecipes.map(recipe => recipe.difficulty))],
      categories: [...new Set(selectedRecipes.map(recipe => recipe.category))],
      commonIngredients: []
    };

    // Find common ingredients
    if (selectedRecipes.length > 1) {
      const firstRecipeIngredients = selectedRecipes[0].ingredients?.map(ing => ing.name.toLowerCase()) || [];
      metrics.commonIngredients = firstRecipeIngredients.filter(ingredient =>
        selectedRecipes.every(recipe =>
          recipe.ingredients?.some(ing => ing.name.toLowerCase() === ingredient)
        )
      );
    }

    return metrics;
  }, [selectedRecipes]);

  if (selectedRecipes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <GitCompare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Recipes Selected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select at least 2 recipes to compare them side by side.
            </p>
            <Button onClick={handleClose} variant="primary">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <GitCompare className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Recipe Comparison
            </h2>
            <Badge variant="secondary">
              {selectedRecipes.length} recipes
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleClearComparison}
              variant="ghost"
              size="sm"
            >
              Clear All
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              className="p-2"
              ariaLabel="Close comparison"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Summary Stats */}
          {comparisonData && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Comparison Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Prep Time</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {Math.round(comparisonData.avgPrepTime)} min
                  </div>
                </div>
                <div className="text-center">
                  <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Difficulties</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.difficulties.join(', ')}
                  </div>
                </div>
                <div className="text-center">
                  <ChefHat className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.categories.join(', ')}
                  </div>
                </div>
                <div className="text-center">
                  <GitCompare className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Common Ingredients</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.commonIngredients.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recipe Comparison Grid */}
          <div className="p-6">
            <div className={`grid gap-6 ${selectedRecipes.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {selectedRecipes.map((recipe) => (
                <RecipeComparisonCard
                  key={recipe.id}
                  recipe={recipe}
                  cost={calculateRecipeCost(recipe)}
                  onRemove={() => handleRemoveFromComparison(recipe.id)}
                  commonIngredients={comparisonData?.commonIngredients || []}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Individual Recipe Comparison Card
 */
const RecipeComparisonCard = memo(({ recipe, cost, onRemove, commonIngredients }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {recipe.name}
          </h3>
          {recipe.version && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version: {recipe.version}
            </p>
          )}
        </div>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
          ariaLabel="Remove from comparison"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {recipe.prepTime || 0} min
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {recipe.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {recipe.category}
          </span>
        </div>
        {cost > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ${cost.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Ingredients ({recipe.ingredients?.length || 0})
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {recipe.ingredients?.map((ingredient, index) => {
            const isCommon = commonIngredients.includes(ingredient.name.toLowerCase());
            return (
              <div
                key={index}
                className={`text-sm p-2 rounded ${isCommon
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                {ingredient.amount} {ingredient.unit} {ingredient.name}
                {isCommon && (
                  <Badge variant="success" className="ml-2 text-xs">
                    Common
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions Preview */}
      {recipe.instructions && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Instructions
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {recipe.instructions}
          </p>
        </div>
      )}
    </div>
  );
});

ComparisonModal.displayName = 'ComparisonModal';
RecipeComparisonCard.displayName = 'RecipeComparisonCard';

export default ComparisonModal;
