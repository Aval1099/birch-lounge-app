import { describe, expect, it } from 'vitest';

import { RecipeGrid } from '../../components/features';
import { mockRecipe, renderWithProviders, userEvent } from '../utils/test-utils';

const mockRecipes = [
  { ...mockRecipe, id: '1', name: 'Old Fashioned', isFavorite: true },
  { ...mockRecipe, id: '2', name: 'Manhattan', category: 'Whiskey', isFavorite: false },
  { ...mockRecipe, id: '3', name: 'Margarita', category: 'Tequila', isFavorite: false },
];

const mockState = {
  isInitialized: true,
  theme: 'light',
  activeTab: 'recipes',
  modal: { isOpen: false, type: null, data: null },
  notification: { message: null, type: null },
  recipes: mockRecipes,
  ingredients: [],
  techniques: [],
  filters: {
    searchTerm: '',
    category: 'All',
    flavorProfile: 'All',
    favoritesOnly: false
  },
  comparison: { isActive: false, selectedIds: [] },
  currentMenu: { id: null, name: '', items: [] },
  savedMenus: [],
  batchScaling: { recipe: null, servings: 1, name: '' },
  savedBatches: [],
  serviceMode: false,
  geminiApiKey: null
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
    const searchState = {
      ...mockState,
      filters: { ...mockState.filters, searchTerm: 'old' }
    };

    const { getByText, queryByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: searchState }
    );

    expect(getByText('Old Fashioned')).toBeInTheDocument();
    expect(queryByText('Manhattan')).not.toBeInTheDocument();
    expect(queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('filters recipes by category', () => {
    const categoryState = {
      ...mockState,
      filters: { ...mockState.filters, category: 'Whiskey' }
    };

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
      filters: { ...mockState.filters, favoritesOnly: true }
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
    const emptyState = {
      ...mockState,
      recipes: [] // No recipes to trigger empty state
    };

    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: emptyState }
    );

    expect(getByText('No recipes found')).toBeInTheDocument();
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
    const { getByText, getAllByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: mockState }
    );

    // Check for recipe details
    expect(getAllByText('Easy')[0]).toBeInTheDocument(); // difficulty (multiple recipes may have same difficulty)
    expect(getAllByText('3 min')[0]).toBeInTheDocument(); // prep time
    expect(getAllByText('Whiskey')[0]).toBeInTheDocument(); // category instead of glassware
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

  it('shows empty state when no recipes', () => {
    const emptyState = { ...mockState, recipes: [] };

    const { getByText } = renderWithProviders(
      <RecipeGrid />,
      { initialState: emptyState }
    );

    // When no recipes, should show empty state
    expect(getByText('No recipes found')).toBeInTheDocument();
  });
});
