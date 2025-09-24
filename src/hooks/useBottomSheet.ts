import { useCallback, useState } from 'react';

import { useMobileDetection } from './useMobile';
import type { BottomSheetOptions } from '../types/hooks';

/**
 * useBottomSheet Hook - Manages bottom sheet state and mobile detection
 *
 * Features:
 * - Automatic mobile detection
 * - State management for bottom sheet visibility
 * - Callback handlers for open/close actions
 * - Integration with existing modal systems
 */
export const useBottomSheet = (options: BottomSheetOptions = {}) => {
  const {
    defaultOpen = false,
    onOpen: onOpenCallback,
    onClose: onCloseCallback,
    forceDesktop = false, // Force bottom sheet on desktop
  } = options;

  const { isMobile } = useMobileDetection();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Determine if we should use bottom sheet
  const shouldUseBottomSheet = isMobile || forceDesktop;

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenCallback?.();
  }, [onOpenCallback]);

  const close = useCallback(() => {
    setIsOpen(false);
    onCloseCallback?.();
  }, [onCloseCallback]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    isMobile,
    shouldUseBottomSheet,
  };
};

/**
 * useBottomSheetModal Hook - Enhanced hook for modal/bottom sheet hybrid
 *
 * Automatically switches between modal and bottom sheet based on device
 */
export const useBottomSheetModal = (options: BottomSheetOptions = {}) => {
  const {
    defaultOpen = false,
    onOpen: onOpenCallback,
    onClose: onCloseCallback,
  } = options;

  const { isMobile } = useMobileDetection();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenCallback?.();
  }, [onOpenCallback]);

  const close = useCallback(() => {
    setIsOpen(false);
    onCloseCallback?.();
  }, [onCloseCallback]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Return different component props based on device
  const getModalProps = useCallback(() => ({
    isOpen,
    onClose: close,
  }), [isOpen, close]);

  const getBottomSheetProps = useCallback(() => ({
    isOpen,
    onClose: close,
  }), [isOpen, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    isMobile,
    getModalProps,
    getBottomSheetProps,
    // Helper to determine which component to render
    renderAs: isMobile ? 'bottomsheet' : 'modal',
  };
};

export default useBottomSheet;
