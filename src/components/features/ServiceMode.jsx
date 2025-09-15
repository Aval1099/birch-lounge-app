import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Search, Clock, DollarSign, Star, Heart, X,
  Zap, ChefHat, Filter, SortAsc, Eye, Gauge, Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSelectors, useAdvancedSearch } from '../../hooks';
import { ActionType } from '../../constants';
import { Button, Input, Select, Badge } from '../ui';
import { formatCurrency } from '../../utils';

/**
 * Service Mode Component - Bartender-focused interface for quick recipe access
 */
const ServiceMode = memo(() => {
  const { state, dispatch } = useApp();
  const { serviceMode } = state;
  const { selectFilteredRecipeGroups, calculateRecipeCost } = useSelectors();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('All');

  // Get all recipes for advanced search
  const allRecipes = useMemo(() => {
    const { groups } = selectFilteredRecipeGroups;
    return Object.values(groups).flat();
  }, [selectFilteredRecipeGroups]);

  // Advanced search configuration for ultra-fast service mode
  const searchOptions = useMemo(() => ({
    searchFields: ['name', 'category', 'version', 'ingredients.name', 'description', 'tags'],
    delay: 50, // Ultra-fast response <100ms for service mode
    fuzzyThreshold: 0.8, // Higher threshold for more precise matches
    maxResults: 100,
    enableFuzzy: true,
    enableHighlight: true,
    sortByRelevance: true
  }), []);

  // Advanced search with multi-field support
  const {
    searchTerm,
    setSearchTerm,
    searchResults: searchedRecipes,
    searchStats,
    filters,
    updateFilters,
    clearFilters,
    sortBy: searchSortBy,
    setSortBy: setSearchSortBy,
    isSearching,
    clearSearch
  } = useAdvancedSearch(allRecipes, searchOptions);

  // Apply additional service mode filters
  const filteredRecipes = useMemo(() => {
    let filtered = searchedRecipes;

    // Category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(recipe => recipe.category === filterCategory);
    }

    // Sort recipes if not using search relevance
    if (sortBy !== 'relevance') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'category':
            return a.category.localeCompare(b.category);
          case 'prepTime':
            return (a.prepTime || 0) - (b.prepTime || 0);
          case 'cost':
            return calculateRecipeCost(a.ingredients) - calculateRecipeCost(b.ingredients);
          case 'favorites':
            return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [searchedRecipes, filterCategory, sortBy, calculateRecipeCost]);

  const handleToggleServiceMode = useCallback(() => {
    dispatch({
      type: ActionType.SET_SERVICE_MODE,
      payload: !serviceMode
    });
  }, [serviceMode, dispatch]);

  const handleSelectRecipe = useCallback((recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseRecipe = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(allRecipes.map(recipe => recipe.category));
    return ['All', ...Array.from(cats).sort()];
  }, [allRecipes]);

  if (!serviceMode) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Service Mode
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick access interface for bartenders during service
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Zap className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Activate Service Mode
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Service mode provides a streamlined interface optimized for quick recipe lookup during busy service periods.
            </p>
            <Button
              onClick={handleToggleServiceMode}
              variant="primary"
              ariaLabel="Activate service mode"
            >
              <Zap className="w-4 h-4" />
              Activate Service Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Service Mode Header */}
      <div className="bg-amber-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6" />
            <h1 className="text-xl font-bold">Service Mode Active</h1>
            <span className="text-sm bg-amber-700 px-2 py-1 rounded">
              {filteredRecipes.length} recipes
            </span>
            {searchStats.searchTime > 0 && (
              <span className="text-xs bg-green-600 px-2 py-1 rounded flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {searchStats.searchTime.toFixed(0)}ms
              </span>
            )}
          </div>
          <Button
            onClick={handleToggleServiceMode}
            variant="ghost"
            className="text-white hover:bg-amber-700"
            ariaLabel="Exit service mode"
          >
            <X className="w-5 h-5" />
            Exit
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Recipe List */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-700 space-y-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Multi-field search: name, ingredients, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                aria-label="Advanced search recipes"
              />

              {isSearching && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                </div>
              )}

              {searchTerm && (
                <Button
                  onClick={clearSearch}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  ariaLabel="Clear search"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Stats */}
            {searchStats.lastSearchTerm && (
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  {searchStats.totalResults} results for "{searchStats.lastSearchTerm}"
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  {searchStats.searchTime.toFixed(1)}ms
                </span>
              </div>
            )}

            {/* Active Filters */}
            {Object.entries(filters).some(([_, value]) => value && value !== 'All') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Filters:</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === 'All') return null;
                  return (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {key}: {value}
                      <button
                        onClick={() => updateFilters({ [key]: 'All' })}
                        className="ml-1 hover:text-red-400"
                        aria-label={`Remove ${key} filter`}
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear All
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                aria-label="Filter by category"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                aria-label="Sort recipes"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="name">Sort by Name</option>
                <option value="category">Sort by Category</option>
                <option value="prepTime">Sort by Prep Time</option>
                <option value="cost">Sort by Cost</option>
                <option value="favorites">Sort by Favorites</option>
              </Select>
            </div>
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No recipes found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredRecipes.map((recipe) => (
                  <RecipeListItem
                    key={recipe.id}
                    recipe={recipe}
                    isSelected={selectedRecipe?.id === recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    calculateRecipeCost={calculateRecipeCost}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recipe Detail */}
        <div className="w-1/2 flex flex-col">
          {selectedRecipe ? (
            <RecipeDetail
              recipe={selectedRecipe}
              onClose={handleCloseRecipe}
              calculateRecipeCost={calculateRecipeCost}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  Select a Recipe
                </h3>
                <p className="text-gray-500">
                  Choose a recipe from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Recipe List Item Component
 */
const RecipeListItem = memo(({ recipe, isSelected, onClick, calculateRecipeCost }) => {
  const recipeCost = calculateRecipeCost(recipe.ingredients);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-700 hover:bg-gray-800 transition-colors ${
        isSelected ? 'bg-gray-800 border-l-4 border-l-amber-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white truncate">{recipe.name}</h3>
        <div className="flex items-center gap-2 ml-2">
          {recipe.isFavorite && (
            <Heart className="w-4 h-4 text-red-500 fill-current" />
          )}
          {recipe.prepTime > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {recipe.prepTime}m
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{recipe.version}</span>
        <div className="flex items-center gap-1 text-green-400">
          <DollarSign className="w-3 h-3" />
          {formatCurrency(recipeCost)}
        </div>
      </div>
      
      <div className="mt-1">
        <span className="inline-block px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
          {recipe.category}
        </span>
      </div>
    </button>
  );
});

/**
 * Recipe Detail Component
 */
const RecipeDetail = memo(({ recipe, onClose, calculateRecipeCost }) => {
  const recipeCost = calculateRecipeCost(recipe.ingredients);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">{recipe.name}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-400 hover:text-white p-2"
            ariaLabel="Close recipe detail"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{recipe.version}</span>
          <span>{recipe.category}</span>
          {recipe.prepTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.prepTime}m
            </div>
          )}
          <div className="flex items-center gap-1 text-green-400">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(recipeCost)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Ingredients */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Ingredients</h3>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <span className="text-white font-medium">{ingredient.name}</span>
                <span className="text-amber-400 font-bold">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {recipe.instructions}
              </p>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          {recipe.glassware && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Glassware</h4>
              <p className="text-white">{recipe.glassware}</p>
            </div>
          )}
          
          {recipe.garnish && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Garnish</h4>
              <p className="text-white">{recipe.garnish}</p>
            </div>
          )}
        </div>

        {/* Flavor Profile */}
        {recipe.flavorProfile && recipe.flavorProfile.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Flavor Profile</h4>
            <div className="flex flex-wrap gap-2">
              {recipe.flavorProfile.map((flavor, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full"
                >
                  {flavor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Notes</h4>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {recipe.notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ServiceMode.displayName = 'ServiceMode';
RecipeListItem.displayName = 'RecipeListItem';
RecipeDetail.displayName = 'RecipeDetail';

export default ServiceMode;
