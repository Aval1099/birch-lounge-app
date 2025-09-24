import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Card from '../../components/ui/Card';
import { renderWithProviders } from '../utils/test-utils';

const mockProps = {
  children: <div>Card content</div>
};

const mockInitialState = {
  isInitialized: true,
  theme: 'light',
  activeTab: 'recipes',
  modal: { isOpen: false, type: null, data: null },
  notification: { message: null, type: null },
  recipes: [],
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
  geminiApiKey: null,
  auth: { user: null, isAuthenticated: false },
  sync: { status: 'idle', lastSync: null, error: null }
};

describe('Card Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with children', () => {
      renderWithProviders(<Card {...mockProps} />, { initialState: mockInitialState });

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      renderWithProviders(<Card {...mockProps} />, { initialState: mockInitialState });

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-800', 'border', 'rounded-lg');
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      renderWithProviders(<Card {...mockProps} variant="default" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-800');
    });

    it('applies elevated variant', () => {
      renderWithProviders(<Card {...mockProps} variant="elevated" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-800');
    });

    it('applies outlined variant', () => {
      renderWithProviders(<Card {...mockProps} variant="outlined" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('border-2');
    });

    it('applies ghost variant', () => {
      renderWithProviders(<Card {...mockProps} variant="ghost" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('border-transparent', 'bg-gray-50', 'dark:bg-gray-900');
    });
  });

  describe('Padding', () => {
    it('applies default padding', () => {
      renderWithProviders(<Card {...mockProps} padding="default" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('p-4');
    });

    it('applies no padding', () => {
      renderWithProviders(<Card {...mockProps} padding="none" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).not.toHaveClass('p-4');
    });

    it('applies small padding', () => {
      renderWithProviders(<Card {...mockProps} padding="sm" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('p-3');
    });

    it('applies large padding', () => {
      renderWithProviders(<Card {...mockProps} padding="lg" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('p-6');
    });

    it('applies extra large padding', () => {
      renderWithProviders(<Card {...mockProps} padding="xl" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Shadow', () => {
    it('applies default shadow', () => {
      renderWithProviders(<Card {...mockProps} shadow="default" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('shadow');
    });

    it('applies no shadow', () => {
      renderWithProviders(<Card {...mockProps} shadow="none" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).not.toHaveClass('shadow');
    });

    it('applies small shadow', () => {
      renderWithProviders(<Card {...mockProps} shadow="sm" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('shadow-sm');
    });

    it('applies medium shadow', () => {
      renderWithProviders(<Card {...mockProps} shadow="md" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('shadow-md');
    });

    it('applies large shadow', () => {
      renderWithProviders(<Card {...mockProps} shadow="lg" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies extra large shadow', () => {
      renderWithProviders(<Card {...mockProps} shadow="xl" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('shadow-xl');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover effects when enabled', () => {
      renderWithProviders(<Card {...mockProps} hover />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('transition-shadow', 'hover:shadow-lg', 'cursor-pointer');
    });

    it('does not apply hover effects by default', () => {
      renderWithProviders(<Card {...mockProps} />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).not.toHaveClass('transition-shadow', 'hover:shadow-lg', 'cursor-pointer');
    });
  });

  describe('Click Interaction', () => {
    it('handles click events', async () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(onClick).toHaveBeenCalled();
      });
    });

    it('adds button role when clickable', () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('does not add button role when not clickable', () => {
      renderWithProviders(<Card {...mockProps} />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Keyboard Interaction', () => {
    it('handles Enter key press', async () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;
      fireEvent.keyDown(card, { key: 'Enter' });

      await waitFor(() => {
        expect(onClick).toHaveBeenCalled();
      });
    });

    it('handles Space key press', async () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;
      fireEvent.keyDown(card, { key: ' ' });

      await waitFor(() => {
        expect(onClick).toHaveBeenCalled();
      });
    });

    it('handles Space key press', async () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;

      // Trigger the keydown event with space key
      fireEvent.keyDown(card, { key: ' ' });

      await waitFor(() => {
        expect(onClick).toHaveBeenCalled();
      });
    });

    it('ignores other keys', async () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;
      fireEvent.keyDown(card, { key: 'Tab' });
      fireEvent.keyDown(card, { key: 'Escape' });

      await waitFor(() => {
        expect(onClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label when provided', () => {
      renderWithProviders(
        <Card {...mockProps} onClick={vi.fn()} aria-label="Custom card" />
      );

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveAttribute('aria-label', 'Custom card');
    });

    it('supports keyboard focus when clickable', () => {
      const onClick = vi.fn();
      renderWithProviders(<Card {...mockProps} onClick={onClick} />);

      const card = screen.getByText('Card content').parentElement;
      card.focus();

      expect(card).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      renderWithProviders(<Card {...mockProps} className="custom-card" />);

      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('custom-card');
    });

    it('forwards additional props', () => {
      renderWithProviders(<Card {...mockProps} data-testid="custom-card" />);

      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = vi.fn();
      renderWithProviders(<Card {...mockProps} ref={ref} />);

      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Complex Content', () => {
    it('renders complex nested content', () => {
      const complexContent = (
        <div>
          <h2>Card Title</h2>
          <p>Card description</p>
          <button>Action Button</button>
        </div>
      );

      renderWithProviders(<Card>{complexContent}</Card>);

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('maintains proper layout with various content types', () => {
      const mixedContent = (
        <>
          <img src="test.jpg" alt="Test" />
          <div>Text content</div>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </>
      );

      renderWithProviders(<Card>{mixedContent}</Card>);

      expect(screen.getByAltText('Test')).toBeInTheDocument();
      expect(screen.getByText('Text content')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
    });
  });
});
