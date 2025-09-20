import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render } from '../utils/test-utils';

// Mock the mobile detection hook
vi.mock('../../hooks', () => ({
  useMobileDetection: () => ({ isMobile: true, isTouch: true }),
  useSwipeGesture: () => ({ bind: () => ({}) }),
  useTouchInteraction: () => ({ bind: () => ({}) }),
}));

// Mock the useApp hook
vi.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    state: {
      theme: 'light'
    }
  })
}));

describe('BottomSheet Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Bottom Sheet',
    children: <div>Bottom sheet content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<BottomSheet {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Bottom Sheet')).toBeInTheDocument();
      expect(screen.getByText('Bottom sheet content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<BottomSheet {...defaultProps} isOpen={false} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Should be translated off-screen when closed
      expect(dialog).toHaveStyle('transform: translateY(100%)');
    });

    it('renders without title', () => {
      render(<BottomSheet {...defaultProps} title={undefined} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Bottom sheet content')).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} height="half" />
      );

      const bottomSheet = container.querySelector('[role="dialog"]');
      expect(bottomSheet).toHaveClass('h-[50vh]');
    });

    it('renders with custom className', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} className="custom-class" />
      );

      const bottomSheet = container.querySelector('[role="dialog"]');
      expect(bottomSheet).toHaveClass('custom-class');
    });
  });

  describe('Handle and Close Button', () => {
    it('shows handle by default', () => {
      const { container } = render(<BottomSheet {...defaultProps} />);

      const handle = container.querySelector('.w-10.h-1');
      expect(handle).toBeInTheDocument();
    });

    it('hides handle when showHandle is false', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} showHandle={false} />
      );

      const handle = container.querySelector('.w-10.h-1');
      expect(handle).not.toBeInTheDocument();
    });

    it('shows close button by default', () => {
      render(<BottomSheet {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close bottom sheet');
      expect(closeButton).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<BottomSheet {...defaultProps} showCloseButton={false} />);

      const closeButton = screen.queryByLabelText('Close bottom sheet');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close bottom sheet');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop', () => {
    it('shows backdrop by default', () => {
      const { container } = render(<BottomSheet {...defaultProps} />);

      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('hides backdrop when backdrop is false', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} backdrop={false} />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).not.toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(
        <BottomSheet {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when other keys are pressed', () => {
      const onClose = vi.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<BottomSheet {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('has proper ARIA attributes without title', () => {
      render(<BottomSheet {...defaultProps} title={undefined} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('backdrop has aria-hidden attribute', () => {
      const { container } = render(<BottomSheet {...defaultProps} />);

      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Height Options', () => {
    it('applies auto height class', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} height="auto" />
      );

      const bottomSheet = container.querySelector('[role="dialog"]');
      expect(bottomSheet).toHaveClass('max-h-[80vh]');
    });

    it('applies half height class', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} height="half" />
      );

      const bottomSheet = container.querySelector('[role="dialog"]');
      expect(bottomSheet).toHaveClass('h-[50vh]');
    });

    it('applies full height class', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} height="full" />
      );

      const bottomSheet = container.querySelector('[role="dialog"]');
      expect(bottomSheet).toHaveClass('h-[90vh]');
    });

    it('applies custom height', () => {
      const { container } = render(
        <BottomSheet {...defaultProps} height="h-64" />
      );

      const bottomSheet = container.querySelector('[role="dialog"]');
      expect(bottomSheet).toHaveClass('h-64');
    });
  });

  describe('Mobile Detection', () => {
    it('renders on mobile by default', () => {
      render(<BottomSheet {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('can be forced to render on desktop', () => {
      // Mock desktop detection for this specific test
      const mockUseMobileDetection = vi.fn().mockReturnValue({
        isMobile: false,
        isTouch: false
      });

      vi.doMock('../../hooks', () => ({
        useMobileDetection: mockUseMobileDetection,
        useSwipeGesture: () => ({ bind: () => ({}) }),
        useTouchInteraction: () => ({ bind: () => ({}) }),
      }));

      render(<BottomSheet {...defaultProps} forceRender={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
