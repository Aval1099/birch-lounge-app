
import { X } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import { useMobileDetection, useSwipeGesture } from '../../hooks';

import Button from './Button';








/**
 * BottomSheet Component - iOS-style bottom sheet modal for mobile devices
 *
 * Features:
 * - Smooth slide-up/down animations
 * - Swipe-to-dismiss gesture support
 * - Backdrop touch-to-dismiss
 * - Keyboard navigation support
 * - Responsive height options
 * - Auto-mobile detection
 */
const BottomSheet = forwardRef(({
  isOpen = false,
  onClose,
  title,
  children,
  height = 'auto', // 'auto', 'half', 'full', or custom height
  showHandle = true,
  showCloseButton = true,
  backdrop = true,
  swipeToClose = true,
  className = '',
  ...props
}, ref) => {
  const { isMobile } = useMobileDetection();
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);

  // Height configurations
  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  };

  const heightClass = typeof height === 'string' && heightClasses[height]
    ? heightClasses[height]
    : height;

  // Swipe gesture handling
  const handleSwipeStart = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const handleSwipeMove = useCallback((deltaY) => {
    if (deltaY > 0) { // Only allow downward swipes
      setDragOffset(Math.min(deltaY, 200));
    }
  }, []);

  const handleSwipeEnd = useCallback((deltaY, velocity) => {
    setIsAnimating(true);

    // Close if swiped down significantly or with high velocity
    if (deltaY > 100 || velocity > 0.5) {
      onClose?.();
    } else {
      setDragOffset(0);
    }
  }, [onClose]);

  const { bind } = useSwipeGesture({
    onSwipeStart: handleSwipeStart,
    onSwipeMove: handleSwipeMove,
    onSwipeEnd: handleSwipeEnd,
    direction: 'vertical',
    threshold: 10,
    enabled: swipeToClose && isMobile,
  });

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === backdropRef.current) {
      onClose?.();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Reset drag offset when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Don't render on desktop unless explicitly forced
  if (!isMobile && !props.forceRender) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {backdrop && (
        <div
          ref={backdropRef}
          className={`
            fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
            transition-opacity duration-300 ease-out
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={ref || sheetRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-900
          rounded-t-2xl shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isAnimating ? '' : 'transition-none'}
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          ${heightClass}
          ${className}
        `}
        style={{
          transform: isOpen
            ? `translateY(${dragOffset}px)`
            : 'translateY(100%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        {...(swipeToClose && isMobile ? bind() : {})}
        {...props}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2
                id="bottom-sheet-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-auto"
                aria-label="Close bottom sheet"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
});

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;
