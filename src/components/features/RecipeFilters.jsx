
import { GitCompare, Search, Star, X } from 'lucide-react';
import React, { memo, useCallback } from 'react';

import { ActionType, BASE_SPIRITS, FLAVOR_PROFILES, ALCOHOL_CONTENT_TYPES } from '../../constants';
import { useDebouncedSearch } from '../../hooks';
import { useApp } from '../../hooks/useApp';
import { useSearchPerformance } from '../../hooks/usePerformanceMonitoring';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

/**
 * Recipe Filters Component - Provides search and filtering controls for recipes
 */
const RecipeFilters = memo(() => {
  const { state, dispatch } = useApp();
  const { filters, comparison } = state;
  const { measureSearchCall } = useSearchPerformance();

  // Debounced search to improve performance
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    clearSearch
  } = useDebouncedSearch(filters.searchTerm, 300);

  // Update global search term when debounced value changes
  React.useEffect(() => {
    if (debouncedSearchTerm !== filters.searchTerm) {
      // Measure search performance
      measureSearchCall(() => {
        dispatch({
          type: ActionType.UPDATE_FILTERS,
          payload: { searchTerm: debouncedSearchTerm }
        });
      });
    }
  }, [debouncedSearchTerm, filters.searchTerm, dispatch, measureSearchCall]);

  const handleCategoryChange = useCallback((e) => {
    dispatch({
      type: ActionType.UPDATE_FILTERS,
      payload: { category: e.target.value }
    });
  }, [dispatch]);

  const handleFlavorProfileChange = useCallback((e) => {
    dispatch({
      type: ActionType.UPDATE_FILTERS,
      payload: { flavorProfile: e.target.value }
    });
  }, [dispatch]);

  const handleAlcoholContentChange = useCallback((e) => {
    dispatch({
      type: ActionType.UPDATE_FILTERS,
      payload: { alcoholContent: e.target.value }
    });
  }, [dispatch]);

  const handleFavoritesToggle = useCallback(() => {
    dispatch({
      type: ActionType.UPDATE_FILTERS,
      payload: { favoritesOnly: !filters.favoritesOnly }
    });
  }, [dispatch, filters.favoritesOnly]);

  const handleToggleComparison = useCallback(() => {
    dispatch({
      type: ActionType.TOGGLE_COMPARISON_MODE
    });
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    clearSearch();
    dispatch({
      type: ActionType.UPDATE_FILTERS,
      payload: {
        searchTerm: '',
        category: 'All',
        flavorProfile: 'All',
        alcoholContent: 'All',
        favoritesOnly: false
      }
    });
  }, [dispatch, clearSearch]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.category !== 'All' ||
    filters.flavorProfile !== 'All' ||
    filters.alcoholContent !== 'All' ||
    filters.favoritesOnly;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search recipes, ingredients, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="pr-10"
            aria-label="Search recipes"
          />

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Clear search button */}
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

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Filter */}
          <Select
            label="Category"
            value={filters.category}
            onChange={handleCategoryChange}
            aria-label="Filter by category"
          >
            {BASE_SPIRITS.map(spirit => (
              <option key={spirit} value={spirit}>
                {spirit}
              </option>
            ))}
          </Select>

          {/* Flavor Profile Filter */}
          <Select
            label="Flavor Profile"
            value={filters.flavorProfile}
            onChange={handleFlavorProfileChange}
            aria-label="Filter by flavor profile"
          >
            <option value="All">All Flavors</option>
            {FLAVOR_PROFILES.map(flavor => (
              <option key={flavor} value={flavor}>
                {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
              </option>
            ))}
          </Select>

          {/* Alcohol Content Filter */}
          <Select
            label="Alcohol Content"
            value={filters.alcoholContent}
            onChange={handleAlcoholContentChange}
            aria-label="Filter by alcohol content"
          >
            <option value="All">All Drinks</option>
            <option value="alcoholic">Alcoholic</option>
            <option value="non_alcoholic">Non-Alcoholic</option>
          </Select>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Actions
            </label>
            <div className="flex gap-2">
              {/* Favorites Toggle */}
              <Button
                onClick={handleFavoritesToggle}
                variant={filters.favoritesOnly ? 'primary' : 'ghost'}
                className="flex-1"
                ariaLabel={filters.favoritesOnly ? 'Show all recipes' : 'Show only favorites'}
              >
                <Star className={`w-4 h-4 ${filters.favoritesOnly ? 'fill-current' : ''}`} />
                Favorites
              </Button>

              {/* Comparison Mode Toggle */}
              <Button
                onClick={handleToggleComparison}
                variant={comparison.isActive ? 'primary' : 'ghost'}
                className="flex-1"
                ariaLabel={comparison.isActive ? 'Exit comparison mode' : 'Enter comparison mode'}
              >
                <GitCompare className="w-4 h-4" />
                Compare
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Reset
            </label>
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              disabled={!hasActiveFilters}
              ariaLabel="Clear all filters"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>

            {filters.searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                Search: "{filters.searchTerm}"
                <Button
                  onClick={() => {
                    clearSearch();
                    dispatch({
                      type: ActionType.UPDATE_FILTERS,
                      payload: { searchTerm: '' }
                    });
                  }}
                  variant="ghost"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  ariaLabel="Clear search filter"
                >
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}

            {filters.category !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                Category: {filters.category}
                <Button
                  onClick={() => dispatch({
                    type: ActionType.UPDATE_FILTERS,
                    payload: { category: 'All' }
                  })}
                  variant="ghost"
                  className="p-0 h-auto text-green-600 hover:text-green-800"
                  ariaLabel="Clear category filter"
                >
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}

            {filters.flavorProfile !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                Flavor: {filters.flavorProfile}
                <Button
                  onClick={() => dispatch({
                    type: ActionType.UPDATE_FILTERS,
                    payload: { flavorProfile: 'All' }
                  })}
                  variant="ghost"
                  className="p-0 h-auto text-purple-600 hover:text-purple-800"
                  ariaLabel="Clear flavor profile filter"
                >
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}

            {filters.favoritesOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                Favorites Only
                <Button
                  onClick={() => dispatch({
                    type: ActionType.UPDATE_FILTERS,
                    payload: { favoritesOnly: false }
                  })}
                  variant="ghost"
                  className="p-0 h-auto text-red-600 hover:text-red-800"
                  ariaLabel="Clear favorites filter"
                >
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
          </div>
        )}

        {/* Comparison Status */}
        {comparison.isActive && (
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Comparison Mode Active
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-300">
                ({comparison.selectedIds.length}/3 selected)
              </span>
            </div>

            {comparison.selectedIds.length > 1 && (
              <Button
                onClick={() => dispatch({
                  type: ActionType.SET_MODAL,
                  payload: { view: 'comparison', data: null }
                })}
                variant="primary"
                size="sm"
                ariaLabel="View comparison"
              >
                Compare Selected
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

RecipeFilters.displayName = 'RecipeFilters';

export default RecipeFilters;
