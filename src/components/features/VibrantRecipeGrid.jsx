import { ActionType } from '../../constants';
import { useApp } from '../../hooks/useApp';
import { VibrantCard } from '../ui';

import VibrantRecipeCard from './VibrantRecipeCard';


const VibrantRecipeGrid = () => {
  const { state, dispatch } = useApp();
  const { recipes, filters, currentMenu } = state;

  // Filter recipes based on current filters
  const filteredRecipes = recipes.filter(recipe => {
    if (filters.searchTerm && !recipe.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'All' && recipe.category !== filters.category) {
      return false;
    }
    if (filters.flavorProfile !== 'All' && !recipe.flavorProfile?.includes(filters.flavorProfile)) {
      return false;
    }
    if (filters.alcoholContent !== 'All') {
      const isAlcoholic = recipe.category !== 'Mocktail';
      if (filters.alcoholContent === 'Alcoholic' && !isAlcoholic) return false;
      if (filters.alcoholContent === 'Non-Alcoholic' && isAlcoholic) return false;
    }
    if (filters.favoritesOnly && !recipe.isFavorite) {
      return false;
    }
    return true;
  });

  const handleEdit = (recipe) => {
    dispatch({
      type: ActionType.OPEN_MODAL,
      payload: { type: 'recipe', data: recipe }
    });
  };

  const handleFavorite = (recipeId) => {
    dispatch({
      type: ActionType.TOGGLE_FAVORITE,
      payload: recipeId
    });
  };

  const handleAddToMenu = (recipe) => {
    const alreadyInMenu = currentMenu.items.some(item => item.id === recipe.id);

    if (alreadyInMenu) {
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: `${recipe.name} is already in the current menu.`,
          type: 'warning'
        }
      });
      return;
    }

    dispatch({
      type: ActionType.ADD_RECIPE_TO_MENU,
      payload: { menuId: 'current', recipe }
    });

    dispatch({
      type: ActionType.SET_NOTIFICATION,
      payload: {
        message: `${recipe.name} added to the current menu.`,
        type: 'success'
      }
    });
  };

  const handleBatchScale = (recipe) => {
    dispatch({
      type: ActionType.SET_BATCH_RECIPE,
      payload: recipe
    });
    dispatch({
      type: ActionType.SET_ACTIVE_TAB,
      payload: 'batch'
    });
  };

  const handleDelete = (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      dispatch({
        type: ActionType.DELETE_RECIPE,
        payload: recipeId
      });
    }
  };

  if (filteredRecipes.length === 0) {
    return (
      <VibrantCard variant="glass" className="text-center py-12 m-4">
        <div className="text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">No recipes found</h3>
          <p className="text-sm">Try adjusting your filters or add a new recipe.</p>
        </div>
      </VibrantCard>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <VibrantRecipeCard
            key={recipe.id}
            recipe={recipe}
            onEdit={handleEdit}
            onFavorite={handleFavorite}
            onAddToMenu={handleAddToMenu}
            onBatchScale={handleBatchScale}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default VibrantRecipeGrid;
