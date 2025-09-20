// =============================================================================
// MOBILE HOOKS
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

import { BREAKPOINTS, MOBILE_GESTURES } from '../constants';

/**
 * Hook to detect if the device is mobile/touch-enabled
 * @returns {Object} Mobile detection state
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [screenSize, setScreenSize] = useState('lg');

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsTouch(isTouchDevice);
      setIsMobile(width < BREAKPOINTS.MD);
      
      // Determine screen size
      if (width < BREAKPOINTS.SM) {
        setScreenSize('xs');
      } else if (width < BREAKPOINTS.MD) {
        setScreenSize('sm');
      } else if (width < BREAKPOINTS.LG) {
        setScreenSize('md');
      } else if (width < BREAKPOINTS.XL) {
        setScreenSize('lg');
      } else {
        setScreenSize('xl');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isTouch, screenSize };
};

/**
 * Hook for swipe gesture detection
 * @param {Object} options - Configuration options
 * @returns {Object} Swipe handlers and state
 */
export const useSwipeGesture = (options = {}) => {
  const {
    onSwipeLeft = null,
    onSwipeRight = null,
    onSwipeUp = null,
    onSwipeDown = null,
    threshold = MOBILE_GESTURES.SWIPE_THRESHOLD,
    velocity = MOBILE_GESTURES.SWIPE_VELOCITY
  } = options;

  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const startTime = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    startTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    const deltaTime = Date.now() - startTime.current;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const swipeVelocity = distance / deltaTime;

    if (distance < threshold || swipeVelocity < velocity) return;

    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      if (deltaX > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX < 0 && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (deltaY > 0 && onSwipeUp) {
        onSwipeUp();
      } else if (deltaY < 0 && onSwipeDown) {
        onSwipeDown();
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocity]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

/**
 * Hook for responsive breakpoint detection
 * @param {string} breakpoint - Breakpoint to watch
 * @returns {boolean} Whether the breakpoint is active
 */
export const useBreakpoint = (breakpoint) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint.toUpperCase()]}px)`);
    
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
};

/**
 * Hook for touch-friendly interactions
 * @param {Object} options - Configuration options
 * @returns {Object} Touch interaction handlers
 */
export const useTouchInteraction = (options = {}) => {
  const {
    onTap = null,
    onLongPress = null,
    onDoubleTap = null,
    longPressDelay = MOBILE_GESTURES.LONG_PRESS_TIMEOUT,
    doubleTapDelay = MOBILE_GESTURES.TAP_TIMEOUT
  } = options;

  const touchStartTime = useRef(null);
  const longPressTimer = useRef(null);
  const lastTapTime = useRef(null);
  const tapCount = useRef(0);

  const handleTouchStart = useCallback((e) => {
    touchStartTime.current = Date.now();
    
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(e);
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchEnd = useCallback((e) => {
    const touchDuration = Date.now() - touchStartTime.current;
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Only trigger tap if it wasn't a long press
    if (touchDuration < longPressDelay) {
      if (onDoubleTap) {
        const now = Date.now();
        const timeSinceLastTap = now - (lastTapTime.current || 0);
        
        if (timeSinceLastTap < doubleTapDelay) {
          tapCount.current++;
          if (tapCount.current === 2) {
            onDoubleTap(e);
            tapCount.current = 0;
            lastTapTime.current = null;
            return;
          }
        } else {
          tapCount.current = 1;
        }
        
        lastTapTime.current = now;
        
        // Wait to see if there's a second tap
        setTimeout(() => {
          if (tapCount.current === 1 && onTap) {
            onTap(e);
          }
          tapCount.current = 0;
        }, doubleTapDelay);
      } else if (onTap) {
        onTap(e);
      }
    }
  }, [onTap, onDoubleTap, longPressDelay, doubleTapDelay]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};

/**
 * Hook for viewport height handling (mobile browser address bar)
 * @returns {Object} Viewport dimensions
 */
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isAddressBarVisible, setIsAddressBarVisible] = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      const newHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      
      setViewportHeight(newHeight);
      setIsAddressBarVisible(documentHeight > newHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return { viewportHeight, isAddressBarVisible };
};
