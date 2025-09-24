import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Modal from '../../components/ui/Modal';
import { renderWithProviders } from '../utils/test-utils';

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <div>Modal content</div>
};

describe('Modal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithProviders(<Modal {...mockProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders without title', () => {
      renderWithProviders(<Modal {...mockProps} title={undefined} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('renders without close button', () => {
      renderWithProviders(<Modal {...mockProps} showCloseButton={false} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByLabelText(/close modal/i)).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size class', () => {
      renderWithProviders(<Modal {...mockProps} size="sm" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-sm');
    });

    it('applies medium size class (default)', () => {
      renderWithProviders(<Modal {...mockProps} size="md" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-md');
    });

    it('applies large size class', () => {
      renderWithProviders(<Modal {...mockProps} size="lg" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-lg');
    });

    it('applies full size class', () => {
      renderWithProviders(<Modal {...mockProps} size="full" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-full');
    });
  });

  describe('Backdrop Behavior', () => {
    it('closes on backdrop click by default', async () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      fireEvent.click(backdrop);
      
      await waitFor(() => {
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    it('does not close on backdrop click when disabled', async () => {
      renderWithProviders(<Modal {...mockProps} backdrop={false} />);
      
      const modal = screen.getByRole('dialog');
      fireEvent.click(modal.parentElement);
      
      await waitFor(() => {
        expect(mockProps.onClose).not.toHaveBeenCalled();
      });
    });

    it('does not close on content click', async () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      const content = screen.getByText('Modal content');
      fireEvent.click(content);
      
      await waitFor(() => {
        expect(mockProps.onClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Interaction', () => {
    it('closes on Escape key', async () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    it('does not close on other keys', async () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      
      await waitFor(() => {
        expect(mockProps.onClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Close Button', () => {
    it('closes modal when close button is clicked', async () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      const closeButton = screen.getByLabelText(/close modal/i);
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    it('has proper accessibility attributes', () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      const closeButton = screen.getByLabelText(/close modal/i);
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Body Scroll Management', () => {
    it('prevents body scroll when open', () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = renderWithProviders(<Modal {...mockProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...mockProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = renderWithProviders(<Modal {...mockProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('does not have aria-labelledby when no title', () => {
      renderWithProviders(<Modal {...mockProps} title={undefined} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveAttribute('aria-labelledby');
    });

    it('has proper heading structure', () => {
      renderWithProviders(<Modal {...mockProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Modal');
      expect(heading).toHaveAttribute('id');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      renderWithProviders(<Modal {...mockProps} className="custom-modal" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });

    it('forwards additional props', () => {
      renderWithProviders(<Modal {...mockProps} data-testid="custom-modal" />);
      
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
    });
  });

  describe('Content Overflow', () => {
    it('handles long content with scroll', () => {
      const longContent = (
        <div style={{ height: '2000px' }}>
          Very long content that should scroll
        </div>
      );
      
      renderWithProviders(<Modal {...mockProps}>{longContent}</Modal>);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-h-[90vh]', 'overflow-hidden');
    });
  });
});
