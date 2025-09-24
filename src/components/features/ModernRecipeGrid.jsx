import { memo, useState, useMemo } from 'react';
import { Search, Filter, SortAsc, Grid, List, Plus } from 'lucide-react';
import { cn } from '../../utils';
import { 
  ModernCard, 
  ModernButton, 
  ModernInput, 
  ModernRecipeCard 
} from '../ui';

/**
 * Modern Recipe Grid - Premium mobile-first recipe display
 * Features: Search, filter, sort, responsive grid, smooth animations
 */
const ModernRecipeGrid = memo(({ 
  recipes = [],
  loading = false,
  onRecipeSelect,
  onRecipeFavorite,
  onRecipeShare,
  onAddRecipe,
  className = '',
  ...props 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterBy, setFilterBy] = useState('all');

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients?.some(ing => 
          ing.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === filterBy);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'prepTime':
          return (a.prepTime || 0) - (b.prepTime || 0);
        case 'recent':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchQuery, sortBy, filterBy]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = recipes.reduce((acc, recipe) => {
      if (recipe.category && !acc.includes(recipe.category)) {
        acc.push(recipe.category);
      }
      return acc;
    }, []);
    return ['all', ...cats];
  }, [recipes]);

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'prepTime', label: 'Prep Time' },
    { value: 'recent', label: 'Recently Added' },
  ];

  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Search and Controls */}
      <ModernCard variant="glass" padding="lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <ModernInput
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
            className="w-full"
          />
          
          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Filter and Sort */}
            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className={cn(
                  'px-3 py-2 rounded-lg border border-neutral-300/60',
                  'bg-white/90 dark:bg-neutral-900/90',
                  'text-sm text-neutral-700 dark:text-neutral-300',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all duration-200'
                )}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={cn(
                  'px-3 py-2 rounded-lg border border-neutral-300/60',
                  'bg-white/90 dark:bg-neutral-900/90',
                  'text-sm text-neutral-700 dark:text-neutral-300',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all duration-200'
                )}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* View Mode and Add Button */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-neutral-300/60 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Add Recipe Button */}
              <ModernButton
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={onAddRecipe}
                className="hidden sm:flex"
              >
                Add Recipe
              </ModernButton>
            </div>
          </div>
        </div>
      </ModernCard>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
        
        {searchQuery && (
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </ModernButton>
        )}
      </div>

      {/* Recipe Grid/List */}
      {loading ? (
        <RecipeGridSkeleton viewMode={viewMode} />
      ) : filteredRecipes.length > 0 ? (
        <div className={cn(
          'transition-all duration-300',
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          {filteredRecipes.map((recipe, index) => (
            <div
              key={recipe.id || index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ModernRecipeCard
                recipe={recipe}
                onSelect={onRecipeSelect}
                onFavorite={onRecipeFavorite}
                onShare={onRecipeShare}
                variant={viewMode === 'list' ? 'minimal' : 'default'}
                className={viewMode === 'list' ? 'flex flex-row' : ''}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          searchQuery={searchQuery}
          onAddRecipe={onAddRecipe}
          onClearSearch={() => setSearchQuery('')}
        />
      )}
    </div>
  );
});

/**
 * Loading Skeleton Component
 */
const RecipeGridSkeleton = memo(({ viewMode }) => (
  <div className={cn(
    viewMode === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      : 'space-y-4'
  )}>
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={index}
        className={cn(
          'animate-pulse',
          viewMode === 'grid' ? 'aspect-[3/4]' : 'h-32'
        )}
      >
        <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    ))}
  </div>
));

/**
 * Empty State Component
 */
const EmptyState = memo(({ searchQuery, onAddRecipe, onClearSearch }) => (
  <ModernCard variant="glass" padding="xl" className="text-center">
    <div className="space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <Search className="w-8 h-8 text-neutral-400" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {searchQuery ? 'No recipes found' : 'No recipes yet'}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          {searchQuery 
            ? `No recipes match "${searchQuery}". Try a different search term.`
            : 'Start building your recipe collection by adding your first recipe.'
          }
        </p>
      </div>
      
      <div className="flex gap-3 justify-center">
        {searchQuery && (
          <ModernButton
            variant="secondary"
            onClick={onClearSearch}
          >
            Clear search
          </ModernButton>
        )}
        <ModernButton
          variant="primary"
          icon={Plus}
          onClick={onAddRecipe}
        >
          Add Recipe
        </ModernButton>
      </div>
    </div>
  </ModernCard>
));

RecipeGridSkeleton.displayName = 'RecipeGridSkeleton';
EmptyState.displayName = 'EmptyState';
ModernRecipeGrid.displayName = 'ModernRecipeGrid';

export default ModernRecipeGrid;
