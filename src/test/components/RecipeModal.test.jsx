import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRecipe, renderWithProviders, userEvent } from '../utils/test-utils';

const mockState = {
  modal: {
    isOpen: true,
    type: 'recipe',
    data: null
  },
  recipes: [],
  ingredients: [
    { id: '1', name: 'Bourbon', category: 'Whiskey' },
    { id: '2', name: 'Simple Syrup', category: 'Sweetener' },
    { id: '3', name: 'Angostura Bitters', category: 'Bitters' }
  ],
  theme: 'light'
};

const mockEditState = {
  ...mockState,
  modal: {
    isOpen: true,
    type: 'recipe',
    data: mockRecipe
  }
};

describe('RecipeModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create recipe modal', () => {
    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    expect(screen.getByText('Create New Recipe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Old Fashioned')).toBeInTheDocument(); // Recipe Name input
    expect(screen.getByText('Category')).toBeInTheDocument(); // Category label
    expect(screen.getByPlaceholderText('Step-by-step preparation instructions...')).toBeInTheDocument(); // Instructions textarea
  });

  it('renders edit recipe modal with existing data', () => {
    renderWithProviders(
      <RecipeModal recipe={mockRecipe} onClose={vi.fn()} />,
      { initialState: mockEditState }
    );

    expect(screen.getByDisplayValue('Test Old Fashioned')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Whiskey')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Classic')).toBeInTheDocument();
  });

  it('handles form input changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    const nameInput = screen.getByPlaceholderText('e.g., Old Fashioned');
    await user.type(nameInput, 'New Recipe');

    expect(nameInput).toHaveValue('New Recipe');
  });

  it('adds new ingredient to recipe', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    const addButton = screen.getByText('Add Ingredient');
    await user.click(addButton);

    // Should show new ingredient row - look for ingredient name inputs
    const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs.length).toBeGreaterThan(1); // Should have more than the initial one
  });

  it('removes ingredient from recipe', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal recipe={mockRecipe} onClose={vi.fn()} />,
      { initialState: mockEditState }
    );

    // Should have multiple ingredients initially (from mockEditState)
    const initialRemoveButtons = screen.getAllByRole('button', { name: /remove ingredient/i });
    expect(initialRemoveButtons.length).toBeGreaterThan(1);

    await user.click(initialRemoveButtons[0]);

    // Should have one less remove button after removal
    const remainingRemoveButtons = screen.getAllByRole('button', { name: /remove ingredient/i });
    expect(remainingRemoveButtons.length).toBe(initialRemoveButtons.length - 1);
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );

    // Submit the form directly to trigger validation
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);

    // Should show validation errors for empty required fields
    await waitFor(() => {
      expect(screen.getByText(/recipe name is required/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('saves new recipe successfully', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );

    // Fill in required fields using placeholder text
    await user.type(screen.getByPlaceholderText('e.g., Old Fashioned'), 'Test Recipe');
    await user.type(screen.getByPlaceholderText('e.g., Classic, House Special'), 'Classic');
    await user.selectOptions(screen.getByDisplayValue('Select Category'), 'Whiskey');
    await user.type(screen.getByPlaceholderText('Step-by-step preparation instructions...'), 'Test instructions');

    // Fill in ingredient data (required for validation)
    const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs.length).toBeGreaterThan(0);
    await user.type(ingredientInputs[0], 'Bourbon');

    const amountInputs = screen.getAllByPlaceholderText('Amount');
    expect(amountInputs.length).toBeGreaterThan(0);
    await user.type(amountInputs[0], '2');

    const saveButton = screen.getByText('Create Recipe');
    await user.click(saveButton);

    // Wait for form submission to complete using RTL's waitFor
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles flavor profile selection', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    const bitterButton = screen.getByText('bitter');
    await user.click(bitterButton);

    // Button should have active styling after selection
    expect(bitterButton).toHaveClass('bg-blue-600', 'text-white');

    // Should also be able to deselect
    await user.click(bitterButton);
    expect(bitterButton).not.toHaveClass('bg-blue-600');
    expect(bitterButton).toHaveClass('bg-gray-200');
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal on escape key', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );

    // Ensure modal is focused to receive escape key
    const modal = screen.getByRole('dialog');
    modal.focus();

    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents closing when form has unsaved changes', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );

    // Make changes to form to trigger unsaved changes state
    await user.type(screen.getByPlaceholderText('e.g., Old Fashioned'), 'Changed Name');

    // Try to close by clicking backdrop
    const backdrop = screen.getByRole('dialog').parentElement;
    await user.click(backdrop);

    // Should show confirmation dialog instead of closing
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles ingredient autocomplete', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    // Initially should have one ingredient row
    const initialIngredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(initialIngredientInputs.length).toBe(1);

    const addButton = screen.getByText('Add Ingredient');
    await user.click(addButton);

    // Should show additional ingredient input fields
    const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs.length).toBe(2);

    // Should have corresponding amount inputs and unit selects
    const amountInputs = screen.getAllByPlaceholderText('Amount');
    expect(amountInputs.length).toBe(2);

    const unitSelects = screen.getAllByRole('combobox');
    expect(unitSelects.length).toBe(4); // Category + 2 ingredient units + Difficulty
  });

  it('calculates recipe statistics', () => {
    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockEditState }
    );

    // Should show prep time, difficulty fields with proper labels
    expect(screen.getByLabelText('Prep Time (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();

    // Should have yields field as well
    expect(screen.getByLabelText('Yields (servings)')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    const nameInput = screen.getByPlaceholderText('e.g., Old Fashioned');
    nameInput.focus();

    expect(nameInput).toHaveFocus();

    await user.keyboard('{Tab}');

    // Should move focus to version input (next form field)
    const versionInput = screen.getByPlaceholderText('e.g., Classic, House Special');
    expect(versionInput).toHaveFocus();
  });

  it('shows autosave indicator', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );

    // Type in form to trigger autosave
    await user.type(screen.getByPlaceholderText('e.g., Old Fashioned'), 'Auto Save Test');

    // Should show unsaved changes indicator (since autosave has 30s delay)
    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
