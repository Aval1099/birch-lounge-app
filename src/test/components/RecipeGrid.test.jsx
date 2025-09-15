import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent, mockRecipe } from '../utils/test-utils';
import RecipeGrid from '../../components/features/RecipeGrid';

const mockRecipes = [
  { ...mockRecipe, id: '1', name: 'Old Fashioned' },
  { ...mockRecipe, id: '2', name: 'Manhattan', category: 'Whiskey' },
  { ...mockRecipe, id: '3', name: 'Margarita', category: 'Tequila' },
];

const mockState = {
  recipes: mockRecipes,
  searchTerm: '',
  selectedCategory: 'All',
  selectedFlavorProfile: 'All',
  showFavoritesOnly: false,
  currentView: 'recipes',
  theme: 'light'
};

describe('RecipeGrid Component', () => {
  it('renders recipe cards correctly', () => {
    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    expect(getByText('Old Fashioned')).toBeInTheDocument();
    expect(getByText('Manhattan')).toBeInTheDocument();
    expect(getByText('Margarita')).toBeInTheDocument();
  });

  it('filters recipes by search term', () => {
    const searchState = { ...mockState, searchTerm: 'old' };
    
    const { getByText, queryByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: searchState }
    );
    
    expect(getByText('Old Fashioned')).toBeInTheDocument();
    expect(queryByText('Manhattan')).not.toBeInTheDocument();
    expect(queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('filters recipes by category', () => {
    const categoryState = { ...mockState, selectedCategory: 'Whiskey' };
    
    const { getByText, queryByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: categoryState }
    );
    
    expect(getByText('Old Fashioned')).toBeInTheDocument();
    expect(getByText('Manhattan')).toBeInTheDocument();
    expect(queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('shows favorites only when filter is active', () => {
    const favoriteRecipes = mockRecipes.map((recipe, index) => ({
      ...recipe,
      isFavorite: index === 0 // Only first recipe is favorite
    }));
    
    const favoritesState = {
      ...mockState,
      recipes: favoriteRecipes,
      showFavoritesOnly: true
    };
    
    const { getByText, queryByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: favoritesState }
    );
    
    expect(getByText('Old Fashioned')).toBeInTheDocument();
    expect(queryByText('Manhattan')).not.toBeInTheDocument();
    expect(queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('handles recipe card clicks', async () => {
    const user = userEvent.setup();
    
    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    const recipeCard = getByText('Old Fashioned').closest('div[role="button"]');
    expect(recipeCard).toBeInTheDocument();
    
    await user.click(recipeCard);
    // Modal should open - we can test this by checking if the modal state changed
  });

  it('displays empty state when no recipes match filters', () => {
    const emptyState = { ...mockState, searchTerm: 'nonexistent' };
    
    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: emptyState }
    );
    
    expect(getByText(/no recipes found/i)).toBeInTheDocument();
  });

  it('shows recipe count', () => {
    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    expect(getByText(/3 recipes/i)).toBeInTheDocument();
  });

  it('handles favorite toggle', async () => {
    const user = userEvent.setup();
    
    const { container } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    const favoriteButton = container.querySelector('[aria-label*="favorite"]');
    expect(favoriteButton).toBeInTheDocument();
    
    await user.click(favoriteButton);
    // Should dispatch favorite toggle action
  });

  it('displays recipe metadata correctly', () => {
    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    // Check for recipe details
    expect(getByText('Easy')).toBeInTheDocument(); // difficulty
    expect(getByText('3 min')).toBeInTheDocument(); // prep time
    expect(getByText('Rocks Glass')).toBeInTheDocument(); // glassware
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    const { container } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    const firstCard = container.querySelector('div[role="button"]');
    firstCard.focus();
    
    expect(firstCard).toHaveFocus();
    
    await user.keyboard('{Enter}');
    // Should open recipe modal
  });

  it('handles responsive grid layout', () => {
    const { container } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('shows loading state', () => {
    const loadingState = { ...mockState, isLoading: true };
    
    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: loadingState }
    );
    
    expect(getByText(/loading/i)).toBeInTheDocument();
  });
});
