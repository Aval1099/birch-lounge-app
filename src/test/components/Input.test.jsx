import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Input from '../../components/ui/Input';
import { renderWithProviders } from '../utils/test-utils';

const mockProps = {
  label: 'Test Input',
  name: 'test-input',
  onChange: vi.fn()
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

describe('Input Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with label', () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
      expect(screen.getByText('Test Input')).toBeInTheDocument();
    });

    it('renders without label', () => {
      renderWithProviders(<Input name="test" onChange={vi.fn()} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      renderWithProviders(
        <Input {...mockProps} placeholder="Enter text here" />,
        { initialState: mockInitialState }
      );

      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      renderWithProviders(<Input {...mockProps} defaultValue="Default text" />, { initialState: mockInitialState });

      const input = screen.getByDisplayValue('Default text');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('renders text input by default', () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      renderWithProviders(<Input {...mockProps} type="email" />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      renderWithProviders(<Input {...mockProps} type="password" />, { initialState: mockInitialState });

      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      renderWithProviders(<Input {...mockProps} type="number" />, { initialState: mockInitialState });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Styling and Theme', () => {
    it('applies default light theme styles', () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-white', 'border-gray-300', 'text-gray-900');
    });

    it('applies dark theme styles', () => {
      const darkState = { ...mockInitialState, theme: 'dark' };
      renderWithProviders(<Input {...mockProps} />, { initialState: darkState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-gray-700', 'border-gray-600', 'text-white');
    });

    it('applies custom className', () => {
      renderWithProviders(<Input {...mockProps} className="custom-input" />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      renderWithProviders(<Input {...mockProps} disabled />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('handles readonly state', () => {
      renderWithProviders(<Input {...mockProps} readOnly />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('handles required state', () => {
      renderWithProviders(<Input {...mockProps} required />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      renderWithProviders(
        <Input {...mockProps} error="This field is required" />,
        { initialState: mockInitialState }
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });

    it('has proper error accessibility', () => {
      renderWithProviders(
        <Input {...mockProps} error="This field is required" />,
        { initialState: mockInitialState }
      );

      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('This field is required');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id');
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      renderWithProviders(
        <Input {...mockProps} helperText="Enter your full name" />,
        { initialState: mockInitialState }
      );

      expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });

    it('has proper helper text accessibility', () => {
      renderWithProviders(
        <Input {...mockProps} helperText="Enter your full name" />,
        { initialState: mockInitialState }
      );

      const input = screen.getByRole('textbox');
      const helpText = screen.getByText('Enter your full name');

      expect(input).toHaveAttribute('aria-describedby');
      expect(helpText).toHaveAttribute('id');
    });
  });

  describe('Icons', () => {
    it('renders with icon', () => {
      const TestIcon = () => <span data-testid="test-icon">📧</span>;
      renderWithProviders(
        <Input {...mockProps} icon={<TestIcon />} />,
        { initialState: mockInitialState }
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('adjusts padding for icons', () => {
      const TestIcon = () => <span>📧</span>;
      renderWithProviders(
        <Input {...mockProps} icon={<TestIcon />} />,
        { initialState: mockInitialState }
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('does not adjust padding without icon', () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-4');
      expect(input).not.toHaveClass('pl-10');
    });
  });

  describe('User Interaction', () => {
    it('handles value changes', async () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalled();
      });
    });

    it('handles focus events', async () => {
      const onFocus = vi.fn();
      renderWithProviders(<Input {...mockProps} onFocus={onFocus} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(onFocus).toHaveBeenCalled();
      });
    });

    it('handles blur events', async () => {
      const onBlur = vi.fn();
      renderWithProviders(<Input {...mockProps} onBlur={onBlur} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onBlur).toHaveBeenCalled();
      });
    });

    it('handles key down events', async () => {
      const onKeyDown = vi.fn();
      renderWithProviders(<Input {...mockProps} onKeyDown={onKeyDown} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(onKeyDown).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'test-input');
      expect(input).toHaveAttribute('id');
    });

    it('associates label with input', () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByLabelText('Test Input');
      expect(input).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<Input {...mockProps} />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      input.focus();

      expect(input).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      renderWithProviders(<Input {...mockProps} className="custom-input" />, { initialState: mockInitialState });

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('forwards additional props', () => {
      renderWithProviders(
        <Input {...mockProps} data-testid="custom-input" maxLength={10} />,
        { initialState: mockInitialState }
      );

      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });
});
