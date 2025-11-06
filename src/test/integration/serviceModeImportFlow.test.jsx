/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';

import { ActionType } from '../../constants';
import ServiceMode from '../../components/features/ServiceMode';
import { initialAppState } from '../../context/appReducer';
import { useApp } from '../../hooks/useApp';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '../utils/test-utils';

const ImportedRecipeHarness = ({ recipe }) => {
  const { dispatch } = useApp();

  useEffect(() => {
    dispatch({ type: ActionType.ADD_RECIPE, payload: recipe });
    dispatch({
      type: ActionType.SHOW_NOTIFICATION,
      payload: {
        message: `${recipe.name} imported successfully`,
        type: 'success',
      },
    });
  }, [dispatch, recipe]);

  return <ServiceMode />;
};

describe('Service Mode recipe ingestion flow', () => {
  it('surfaces imported recipes through advanced search', async () => {
    const importedRecipe = {
      id: 'imported-sazerac',
      name: 'Imported Sazerac',
      version: 'House',
      category: 'Whiskey',
      ingredients: [
        { name: 'Rye Whiskey', amount: '2', unit: 'oz' },
        { name: "Peychaud's Bitters", amount: '3', unit: 'dashes' },
        { name: 'Absinthe', amount: '1', unit: 'rinse' },
      ],
      instructions:
        'Stir with ice, rinse glass with absinthe, strain, garnish with lemon peel.',
      flavorProfile: ['strong', 'aromatic'],
      prepTime: 3,
      difficulty: 'Medium',
      tags: ['house', 'rye'],
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      yields: 1,
      isOriginalVersion: true,
    };

    const testState = {
      ...initialAppState,
      isInitialized: true,
      serviceMode: true,
      recipes: [],
      filters: { ...initialAppState.filters },
    };

    renderWithProviders(<ImportedRecipeHarness recipe={importedRecipe} />, {
      initialState: testState,
    });

    expect(
      await screen.findByRole('button', { name: /imported sazerac/i })
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/multi-field search/i);
    await userEvent.type(searchInput, 'sazerac');

    await waitFor(() => {
      expect(screen.getByText(/imported sazerac/i)).toBeVisible();
    });
  });
});
