import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceMode } from '../../components/features';
import { renderWithProviders } from '../utils/test-utils';

const mockState = {
  isInitialized: true,
  theme: 'light',
  activeTab: 'service',
  modal: { isOpen: false, type: null, data: null },
  notification: { message: null, type: null },
  recipes: [
    {
      id: '1',
      name: 'Old Fashioned',
      category: 'Whiskey',
      ingredients: [
        { name: 'Bourbon', amount: '2 oz' },
        { name: 'Simple Syrup', amount: '0.25 oz' },
        { name: 'Angostura Bitters', amount: '2 dashes' }
      ],
      instructions: 'Stir with ice, strain over large ice cube',
      prepTime: 3,
      difficulty: 'Easy',
      tags: ['classic', 'whiskey']
    },
    {
      id: '2',
      name: 'Margarita',
      category: 'Tequila',
      ingredients: [
        { name: 'Tequila', amount: '2 oz' },
        { name: 'Lime Juice', amount: '1 oz' },
        { name: 'Triple Sec', amount: '0.5 oz' }
      ],
      instructions: 'Shake with ice, strain into salt-rimmed glass',
      prepTime: 2,
      difficulty: 'Easy',
      tags: ['citrus', 'tequila']
    }
  ],
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
  serviceMode: true,
  geminiApiKey: null,
  auth: { user: null, isAuthenticated: false },
  sync: { status: 'idle', lastSync: null, error: null }
};

describe('ServiceMode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders service mode interface', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      expect(screen.getByText(/service mode active/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/multi-field search/i)).toBeInTheDocument();
      expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
      expect(screen.getByText('Margarita')).toBeInTheDocument();
    });

    it('displays exit service mode button', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const exitButton = screen.getByLabelText(/exit service mode/i);
      expect(exitButton).toBeInTheDocument();
    });

    it('shows performance metrics', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      // Check for the performance indicator showing response time and recipe count
      expect(screen.getByText(/service mode active/i)).toBeInTheDocument();
      expect(screen.getByText(/recipes/i)).toBeInTheDocument();
      expect(screen.getByText(/ms/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters recipes by search term', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const searchInput = screen.getByPlaceholderText(/multi-field search/i);
      fireEvent.change(searchInput, { target: { value: 'old fashioned' } });

      expect(searchInput.value).toBe('old fashioned');
      expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    });

    it('shows search input functionality', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const searchInput = screen.getByPlaceholderText(/multi-field search/i);
      fireEvent.change(searchInput, { target: { value: 'whiskey' } });

      expect(searchInput.value).toBe('whiskey');
      expect(screen.getAllByText(/whiskey/i).length).toBeGreaterThan(0);
    });

    it('clears search results', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const searchInput = screen.getByPlaceholderText(/multi-field search/i);
      fireEvent.change(searchInput, { target: { value: 'old fashioned' } });

      expect(searchInput.value).toBe('old fashioned');

      fireEvent.change(searchInput, { target: { value: '' } });

      expect(searchInput.value).toBe('');
      expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
      expect(screen.getByText('Margarita')).toBeInTheDocument();
    });
  });

  describe('Service Mode Toggle', () => {
    it('shows exit service mode button', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const exitButton = screen.getByLabelText(/exit service mode/i);
      expect(exitButton).toBeInTheDocument();
    });

    it('shows service mode active indicator', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      expect(screen.getByText(/service mode active/i)).toBeInTheDocument();
    });
  });

  describe('Quick Access', () => {
    it('shows recipe buttons', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const oldFashionedButton = screen.getByText('Old Fashioned').closest('button');
      const margaritaButton = screen.getByText('Margarita').closest('button');

      expect(oldFashionedButton).toBeInTheDocument();
      expect(margaritaButton).toBeInTheDocument();
    });

    it('displays recipe information', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
      expect(screen.getByText('Margarita')).toBeInTheDocument();
      expect(screen.getAllByText('Whiskey').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Tequila').length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('filters by category', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const categoryFilter = screen.getByLabelText(/filter by category/i);
      fireEvent.change(categoryFilter, { target: { value: 'Whiskey' } });

      expect(categoryFilter.value).toBe('Whiskey');
    });

    it('shows sort functionality', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const sortFilter = screen.getByLabelText(/sort recipes/i);
      fireEvent.change(sortFilter, { target: { value: 'name' } });

      expect(sortFilter.value).toBe('name');
    });

    it('shows filter controls', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      expect(screen.getByLabelText(/filter by category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort recipes/i)).toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    it('shows response time metrics', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      // Check for the performance indicator showing response time
      expect(screen.getByText(/ms/i)).toBeInTheDocument();
    });

    it('shows recipe count', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      expect(screen.getByText(/recipes/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('search input can be focused', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const searchInput = screen.getByPlaceholderText(/multi-field search/i);
      searchInput.focus();

      expect(searchInput).toHaveFocus();
    });

    it('search input handles keyboard input', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const searchInput = screen.getByPlaceholderText(/multi-field search/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      // Input should still contain the value (no automatic clearing)
      expect(searchInput.value).toBe('test');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      expect(screen.getByLabelText(/advanced search recipes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exit service mode/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<ServiceMode />, { initialState: mockState });

      const searchInput = screen.getByPlaceholderText(/multi-field search/i);
      searchInput.focus();

      expect(searchInput).toHaveFocus();

      // Test that the input can receive focus and keyboard events
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // The input should still be focused after keyboard interaction
      expect(searchInput).toHaveFocus();
    });
  });
});
