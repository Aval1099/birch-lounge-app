

import { ChevronDown, ChevronUp, Clock, DollarSign, FileText, Plus, Printer, Save, Search, Trash2, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { ActionType } from '../../constants';
import { useDebouncedSearch, useSelectors } from '../../hooks';
import { useApp } from '../../hooks/useApp';
import { formatCurrency, generateId } from '../../utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { MenuSkeleton } from '../ui/SkeletonLoader';

/**
 * Menu Builder Component - Menu creation, editing, and management interface
 */
const MenuBuilder = memo(() => {
  const { state, dispatch } = useApp();
  const { currentMenu, savedMenus } = state;
  const { selectRecipeGroups, calculateRecipeCost } = useSelectors();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [spiritFilter, setSpiritFilter] = useState('All');
  const [sortBy, setSortBy] = useState('alphabetical');

  // Debounced search for recipes
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    clearSearch
  } = useDebouncedSearch('', 300);

  // Calculate menu statistics
  const menuStats = useMemo(() => {
    if (!currentMenu.items.length) {
      return { totalCost: 0, avgCost: 0, totalTime: 0, avgTime: 0 };
    }

    const totalCost = currentMenu.items.reduce((sum, recipe) =>
      sum + calculateRecipeCost(recipe.ingredients), 0
    );

    const totalTime = currentMenu.items.reduce((sum, recipe) =>
      sum + (recipe.prepTime || 0), 0
    );

    return {
      totalCost,
      avgCost: totalCost / currentMenu.items.length,
      totalTime,
      avgTime: totalTime / currentMenu.items.length
    };
  }, [currentMenu.items, calculateRecipeCost]);

  const handleAddRecipe = useCallback((recipe) => {
    dispatch({
      type: ActionType.ADD_RECIPE_TO_MENU,
      payload: { menuId: 'current', recipe }
    });
  }, [dispatch]);

  const handleRemoveFromMenu = useCallback((recipeId) => {
    dispatch({
      type: ActionType.REMOVE_FROM_MENU,
      payload: recipeId
    });
  }, [dispatch]);

  const handleClearMenu = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the current menu?')) {
      dispatch({
        type: ActionType.CLEAR_CURRENT_MENU
      });
    }
  }, [dispatch]);

  const handleSaveMenu = useCallback(() => {
    if (currentMenu.items.length === 0) {
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'Cannot save an empty menu.',
          type: 'error'
        }
      });
      return;
    }
    setShowSaveModal(true);
  }, [currentMenu.items.length, dispatch]);

  const handleLoadMenu = useCallback(() => {
    setShowLoadModal(true);
  }, []);

  const handlePrintMenu = useCallback(() => {
    window.print();
  }, []);

  const handleReorderItems = useCallback((newOrder) => {
    dispatch({
      type: ActionType.REORDER_MENU_ITEMS,
      payload: newOrder
    });
  }, [dispatch]);

  const handleMoveUp = useCallback((index) => {
    if (index > 0) {
      const newItems = [...currentMenu.items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      handleReorderItems(newItems);
    }
  }, [currentMenu.items, handleReorderItems]);

  const handleMoveDown = useCallback((index) => {
    if (index < currentMenu.items.length - 1) {
      const newItems = [...currentMenu.items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      handleReorderItems(newItems);
    }
  }, [currentMenu.items, handleReorderItems]);

  // Get available recipes (not already in menu) with search and filtering
  const availableRecipes = useMemo(() => {
    const allRecipes = Object.values(selectRecipeGroups).flat();
    const menuRecipeIds = new Set(currentMenu.items.map(item => item.id));
    let filtered = allRecipes.filter(recipe => !menuRecipeIds.has(recipe.id));

    // Apply spirit filter
    if (spiritFilter !== 'All') {
      filtered = filtered.filter(recipe =>
        recipe.category.toLowerCase() === spiritFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.version.toLowerCase().includes(term) ||
        recipe.category.toLowerCase().includes(term) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'spirit') {
      filtered.sort((a, b) => {
        const categoryCompare = a.category.localeCompare(b.category);
        return categoryCompare !== 0 ? categoryCompare : a.name.localeCompare(b.name);
      });
    }

    return filtered;
  }, [selectRecipeGroups, currentMenu.items, spiritFilter, debouncedSearchTerm, sortBy]);

  // Get unique spirit categories for filter dropdown
  const spiritCategories = useMemo(() => {
    const allRecipes = Object.values(selectRecipeGroups).flat();
    const categories = [...new Set(allRecipes.map(recipe => recipe.category))];
    return ['All', ...categories.sort()];
  }, [selectRecipeGroups]);

  // Show skeleton loading during app initialization
  if (!state.isInitialized) {
    return <MenuSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Menu Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage cocktail menus for your establishment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleLoadMenu}
            variant="ghost"
            ariaLabel="Load saved menu"
          >
            <FileText className="w-4 h-4" />
            Load Menu
          </Button>
          <Button
            onClick={handleSaveMenu}
            variant="primary"
            disabled={currentMenu.items.length === 0}
            ariaLabel="Save current menu"
          >
            <Save className="w-4 h-4" />
            Save Menu
          </Button>
        </div>
      </div>

      {/* Current Menu Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Current Menu: {currentMenu.name || 'Untitled Menu'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrintMenu}
              variant="ghost"
              size="sm"
              disabled={currentMenu.items.length === 0}
              ariaLabel="Print menu"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleClearMenu}
              variant="ghost"
              size="sm"
              disabled={currentMenu.items.length === 0}
              className="text-red-600 hover:text-red-700"
              ariaLabel="Clear menu"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Menu Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentMenu.items.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(menuStats.avgCost)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Cost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(menuStats.avgTime)}m
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Prep</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(menuStats.totalCost)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Menu Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Menu Items ({currentMenu.items.length})
            </h3>
          </div>

          <div className="p-4">
            {currentMenu.items.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No items in menu yet. Add recipes from the available list.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentMenu.items.map((recipe, index) => (
                  <Card key={recipe.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {recipe.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(calculateRecipeCost(recipe))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Reorder buttons */}
                        <div className="flex flex-col">
                          <Button
                            onClick={() => handleMoveUp(index)}
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            disabled={index === 0}
                            ariaLabel="Move up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleMoveDown(index)}
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            disabled={index === currentMenu.items.length - 1}
                            ariaLabel="Move down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleRemoveFromMenu(recipe.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Recipes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Available Recipes ({availableRecipes.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setSpiritFilter('All');
                    setSortBy('alphabetical');
                    clearSearch();
                  }}
                  variant="ghost"
                  size="sm"
                  disabled={spiritFilter === 'All' && sortBy === 'alphabetical' && !searchTerm}
                  ariaLabel="Clear all filters"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="pr-10"
                  aria-label="Search recipes"
                />

                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                  </div>
                )}

                {searchTerm && !isSearching && (
                  <Button
                    onClick={clearSearch}
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    ariaLabel="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Spirit Filter */}
              <Select
                label="Filter by Spirit"
                value={spiritFilter}
                onChange={(e) => setSpiritFilter(e.target.value)}
                aria-label="Filter recipes by spirit category"
              >
                {spiritCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'All' ? 'All Spirits' : category}
                  </option>
                ))}
              </Select>

              {/* Sort Options */}
              <Select
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort recipes"
              >
                <option value="alphabetical">Alphabetical (A-Z)</option>
                <option value="spirit">By Spirit Category</option>
              </Select>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {availableRecipes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  {debouncedSearchTerm || spiritFilter !== 'All'
                    ? 'No recipes match your search criteria. Try adjusting your filters.'
                    : 'All recipes have been added to the menu.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {recipe.name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          {recipe.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{recipe.version}</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(calculateRecipeCost(recipe.ingredients))}
                        </span>
                        {recipe.prepTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recipe.prepTime}m
                          </span>
                        )}
                        <span className="text-xs">
                          {recipe.ingredients.length} ingredients
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddRecipe(recipe)}
                      variant="primary"
                      size="sm"
                      className="ml-4 flex-shrink-0"
                      ariaLabel={`Add ${recipe.name} to menu`}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSaveModal && (
        <SaveMenuModal
          currentMenu={currentMenu}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showLoadModal && (
        <LoadMenuModal
          savedMenus={savedMenus}
          onClose={() => setShowLoadModal(false)}
        />
      )}
    </div>
  );
});

/**
 * Save Menu Modal Component
 */
const SaveMenuModal = memo(({ currentMenu, onClose }) => {
  const { dispatch } = useApp();
  const [menuName, setMenuName] = useState(currentMenu.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!menuName.trim()) return;

    setIsSubmitting(true);

    try {
      const menuToSave = {
        id: currentMenu.id || generateId('menu'),
        name: menuName.trim(),
        items: currentMenu.items,
        createdAt: currentMenu.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      dispatch({
        type: ActionType.SAVE_CURRENT_MENU,
        payload: menuToSave
      });

      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: `Menu "${menuName}" saved successfully!`,
          type: 'success'
        }
      });

      onClose();
    } catch (error) {
      console.error('Error saving menu:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [menuName, currentMenu, dispatch, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-menu-title" // cspell:disable-line
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="save-menu-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Save Menu
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            ariaLabel="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <Input
            label="Menu Name"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            required
            placeholder="e.g., Summer Cocktails 2024"
            maxLength={100}
            autoFocus
          />

          <div className="text-sm text-gray-600 dark:text-gray-400">
            This menu contains {currentMenu.items.length} recipe{currentMenu.items.length !== 1 ? 's' : ''}.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting || !menuName.trim()}
            >
              <Save className="w-4 h-4" />
              Save Menu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

/**
 * Load Menu Modal Component
 */
const LoadMenuModal = memo(({ savedMenus, onClose }) => {
  const { dispatch } = useApp();

  const handleLoadMenu = useCallback((menu) => {
    dispatch({
      type: ActionType.LOAD_SAVED_MENU,
      payload: menu
    });

    dispatch({
      type: ActionType.SET_NOTIFICATION,
      payload: {
        message: `Menu "${menu.name}" loaded successfully!`,
        type: 'success'
      }
    });

    onClose();
  }, [dispatch, onClose]);

  const handleDeleteMenu = useCallback((menuId, menuName) => {
    if (window.confirm(`Are you sure you want to delete "${menuName}"?`)) {
      dispatch({
        type: ActionType.DELETE_SAVED_MENU,
        payload: menuId
      });
    }
  }, [dispatch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="load-menu-title" // cspell:disable-line
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="load-menu-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Load Saved Menu
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            ariaLabel="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {savedMenus.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No saved menus found. Create and save a menu first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {menu.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {menu.items.length} item{menu.items.length !== 1 ? 's' : ''} •
                      Created {new Date(menu.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleLoadMenu(menu)}
                      variant="primary"
                      size="sm"
                      ariaLabel={`Load ${menu.name}`}
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => handleDeleteMenu(menu.id, menu.name)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      ariaLabel={`Delete ${menu.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MenuBuilder.displayName = 'MenuBuilder';
SaveMenuModal.displayName = 'SaveMenuModal';
LoadMenuModal.displayName = 'LoadMenuModal';

export default MenuBuilder;
