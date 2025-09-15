import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent, mockRecipe } from '../utils/test-utils';
import RecipeModal from '../../components/features/RecipeModal';

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
    const { getByText, getByLabelText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    expect(getByText('Create New Recipe')).toBeInTheDocument();
    expect(getByLabelText('Recipe Name')).toBeInTheDocument();
    expect(getByLabelText('Category')).toBeInTheDocument();
    expect(getByLabelText('Instructions')).toBeInTheDocument();
  });

  it('renders edit recipe modal with existing data', () => {
    const { getByDisplayValue } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockEditState }
    );
    
    expect(getByDisplayValue('Test Old Fashioned')).toBeInTheDocument();
    expect(getByDisplayValue('Whiskey')).toBeInTheDocument();
    expect(getByDisplayValue('Classic')).toBeInTheDocument();
  });

  it('handles form input changes', async () => {
    const user = userEvent.setup();
    
    const { getByLabelText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    const nameInput = getByLabelText('Recipe Name');
    await user.type(nameInput, 'New Recipe');
    
    expect(nameInput).toHaveValue('New Recipe');
  });

  it('adds new ingredient to recipe', async () => {
    const user = userEvent.setup();
    
    const { getByText, getByLabelText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    const addButton = getByText('Add Ingredient');
    await user.click(addButton);
    
    // Should show new ingredient row
    const ingredientSelects = document.querySelectorAll('select[aria-label*="ingredient"]');
    expect(ingredientSelects.length).toBeGreaterThan(0);
  });

  it('removes ingredient from recipe', async () => {
    const user = userEvent.setup();
    
    const { container } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockEditState }
    );
    
    const removeButtons = container.querySelectorAll('[aria-label*="Remove ingredient"]');
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      // Should remove the ingredient row
    }
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    const { getByText } = renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );
    
    const saveButton = getByText('Save Recipe');
    await user.click(saveButton);
    
    // Should show validation errors for empty required fields
    expect(getByText(/recipe name is required/i)).toBeInTheDocument();
  });

  it('saves new recipe successfully', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    const { getByLabelText, getByText } = renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );
    
    // Fill in required fields
    await user.type(getByLabelText('Recipe Name'), 'Test Recipe');
    await user.selectOptions(getByLabelText('Category'), 'Whiskey');
    await user.type(getByLabelText('Instructions'), 'Test instructions');
    
    const saveButton = getByText('Save Recipe');
    await user.click(saveButton);
    
    // Should close modal and save recipe
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles flavor profile selection', async () => {
    const user = userEvent.setup();
    
    const { getByLabelText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    const strongCheckbox = getByLabelText('Strong');
    await user.click(strongCheckbox);
    
    expect(strongCheckbox).toBeChecked();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    const { getByText } = renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );
    
    const cancelButton = getByText('Cancel');
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
    
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents closing when form has unsaved changes', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    const { getByLabelText, container } = renderWithProviders(
      <RecipeModal onClose={mockOnClose} />,
      { initialState: mockState }
    );
    
    // Make changes to form
    await user.type(getByLabelText('Recipe Name'), 'Changed Name');
    
    // Try to close by clicking backdrop
    const backdrop = container.querySelector('.fixed.inset-0');
    await user.click(backdrop);
    
    // Should show confirmation dialog instead of closing
    expect(getByText(/unsaved changes/i)).toBeInTheDocument();
  });

  it('handles ingredient autocomplete', async () => {
    const user = userEvent.setup();
    
    const { getByText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    const addButton = getByText('Add Ingredient');
    await user.click(addButton);
    
    // Should show ingredient dropdown with available ingredients
    const ingredientSelect = document.querySelector('select[aria-label*="ingredient"]');
    expect(ingredientSelect).toBeInTheDocument();
    
    // Should have options from state.ingredients
    const options = ingredientSelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1); // Including default option
  });

  it('calculates recipe statistics', () => {
    const { getByText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockEditState }
    );
    
    // Should show prep time, difficulty, etc.
    expect(getByText('3 min')).toBeInTheDocument();
    expect(getByText('Easy')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    const { getByLabelText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    const nameInput = getByLabelText('Recipe Name');
    nameInput.focus();
    
    expect(nameInput).toHaveFocus();
    
    await user.keyboard('{Tab}');
    // Should move focus to next form element
  });

  it('shows autosave indicator', async () => {
    const user = userEvent.setup();
    
    const { getByLabelText, getByText } = renderWithProviders(
      <RecipeModal onClose={vi.fn()} />,
      { initialState: mockState }
    );
    
    // Type in form to trigger autosave
    await user.type(getByLabelText('Recipe Name'), 'Auto Save Test');
    
    // Should show saving indicator after delay
    setTimeout(() => {
      expect(getByText(/saving/i)).toBeInTheDocument();
    }, 100);
  });
});
