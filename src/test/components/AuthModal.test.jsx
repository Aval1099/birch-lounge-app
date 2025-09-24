import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthModal } from '../../components/features';
import { renderWithProviders } from '../utils/test-utils';

// Mock Supabase
vi.mock('../../services/supabaseClient', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  onAuthSuccess: vi.fn()
};

describe('AuthModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sign in form by default', () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('does not render when Supabase is not configured', () => {
      const { isSupabaseConfigured } = require('../../services/supabaseClient');
      isSupabaseConfigured.mockReturnValue(false);
      
      const { container } = renderWithProviders(<AuthModal {...mockProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when closed', () => {
      const { container } = renderWithProviders(
        <AuthModal {...mockProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Form Switching', () => {
    it('switches to sign up mode', async () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      const signUpLink = screen.getByText(/create account/i);
      fireEvent.click(signUpLink);
      
      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });
    });

    it('switches back to sign in mode', async () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      // Switch to sign up
      fireEvent.click(screen.getByText(/create account/i));
      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument();
      });
      
      // Switch back to sign in
      fireEvent.click(screen.getByText(/sign in/i));
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for invalid email', async () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for short password', async () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/6 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for password mismatch in sign up', async () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      // Switch to sign up mode
      fireEvent.click(screen.getByText(/create account/i));
      
      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });
        
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmInput, { target: { value: 'different123' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/passwords.*match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('handles successful sign in', async () => {
      const { supabase } = require('../../services/supabaseClient');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      });
      
      renderWithProviders(<AuthModal {...mockProps} />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockProps.onAuthSuccess).toHaveBeenCalledWith({
          id: '123',
          email: 'test@example.com'
        });
      });
    });

    it('handles sign in error', async () => {
      const { supabase } = require('../../services/supabaseClient');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });
      
      renderWithProviders(<AuthModal {...mockProps} />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<AuthModal {...mockProps} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();
      
      // Tab to password field
      fireEvent.keyDown(emailInput, { key: 'Tab' });
      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toHaveFocus();
      });
    });
  });
});
