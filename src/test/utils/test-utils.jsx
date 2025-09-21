import { render } from '@testing-library/react';

import { ErrorBoundary } from '../../components/ui';
import { AppProvider } from '../../context/AppContext';

// Custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialState, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <ErrorBoundary>
      <AppProvider initialState={initialState}>
        {children}
      </AppProvider>
    </ErrorBoundary>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data for testing
export const mockRecipe = {
  id: 'test-recipe-1',
  name: 'Test Old Fashioned',
  version: 'Classic',
  category: 'Whiskey',
  source: 'Test',
  isOriginalVersion: true,
  flavorProfile: ['strong', 'bitter'],
  ingredients: [
    { id: 'ing1', name: 'Bourbon', amount: '2', unit: 'oz' },
    { id: 'ing2', name: 'Simple Syrup', amount: '0.25', unit: 'oz' },
    { id: 'ing3', name: 'Angostura Bitters', amount: '2', unit: 'dashes' }
  ],
  instructions: 'Stir with ice, strain over large ice cube.',
  glassware: 'Rocks Glass',
  garnish: 'Orange Peel',
  prepTime: 3,
  difficulty: 'Easy',
  notes: 'Classic cocktail',
  yields: 1,
  isFavorite: false,
  tags: ['classic', 'whiskey', 'stirred'],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const mockIngredient = {
  id: 'test-ingredient-1',
  name: 'Test Bourbon',
  price: 2.50,
  unit: 'oz',
  category: 'Whiskey'
};

export const mockMenu = {
  id: 'test-menu-1',
  name: 'Test Menu',
  items: [mockRecipe],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// Helper functions for testing
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides
});

export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
