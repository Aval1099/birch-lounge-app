import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { 
  useMobileDetection, 
  useSwipeGesture, 
  useBreakpoint, 
  useTouchInteraction,
  useViewportHeight 
} from '../../hooks/useMobile';

// Mock window properties
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn()
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

describe('useMobileDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  it('should detect desktop by default', () => {
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.screenSize).toBe('lg');
  });

  it('should detect mobile when width is small', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.screenSize).toBe('xs');
  });

  it('should detect touch capability', () => {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTouch).toBe(true);
  });
});

describe('useSwipeGesture', () => {
  let mockOnSwipeLeft, mockOnSwipeRight;

  beforeEach(() => {
    mockOnSwipeLeft = vi.fn();
    mockOnSwipeRight = vi.fn();
    vi.clearAllMocks();
  });

  it('should provide touch event handlers', () => {
    const { result } = renderHook(() => 
      useSwipeGesture({
        onSwipeLeft: mockOnSwipeLeft,
        onSwipeRight: mockOnSwipeRight
      })
    );

    expect(result.current.onTouchStart).toBeDefined();
    expect(result.current.onTouchMove).toBeDefined();
    expect(result.current.onTouchEnd).toBeDefined();
  });

  it('should detect swipe left', () => {
    const { result } = renderHook(() => 
      useSwipeGesture({
        onSwipeLeft: mockOnSwipeLeft,
        threshold: 50
      })
    );

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({
        targetTouches: [{ clientX: 200, clientY: 100 }]
      });
    });

    // Simulate touch move
    act(() => {
      result.current.onTouchMove({
        targetTouches: [{ clientX: 100, clientY: 100 }]
      });
    });

    // Simulate touch end
    act(() => {
      result.current.onTouchEnd();
    });

    expect(mockOnSwipeLeft).toHaveBeenCalled();
  });
});

describe('useBreakpoint', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('768'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('should return breakpoint match status', () => {
    const { result } = renderHook(() => useBreakpoint('md'));

    expect(result.current).toBe(true);
  });
});

describe('useTouchInteraction', () => {
  let mockOnTap, mockOnLongPress;

  beforeEach(() => {
    mockOnTap = vi.fn();
    mockOnLongPress = vi.fn();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide touch interaction handlers', () => {
    const { result } = renderHook(() => 
      useTouchInteraction({
        onTap: mockOnTap,
        onLongPress: mockOnLongPress
      })
    );

    expect(result.current.onTouchStart).toBeDefined();
    expect(result.current.onTouchEnd).toBeDefined();
    expect(result.current.onTouchCancel).toBeDefined();
  });

  it('should trigger tap on short touch', () => {
    const { result } = renderHook(() => 
      useTouchInteraction({
        onTap: mockOnTap,
        longPressDelay: 500
      })
    );

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({});
    });

    // Simulate quick touch end (before long press)
    act(() => {
      vi.advanceTimersByTime(100);
      result.current.onTouchEnd({});
    });

    // Wait for tap timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnTap).toHaveBeenCalled();
  });

  it('should trigger long press on extended touch', () => {
    const { result } = renderHook(() => 
      useTouchInteraction({
        onLongPress: mockOnLongPress,
        longPressDelay: 500
      })
    );

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({});
    });

    // Wait for long press timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockOnLongPress).toHaveBeenCalled();
  });
});

describe('useViewportHeight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  it('should return viewport height', () => {
    const { result } = renderHook(() => useViewportHeight());

    expect(result.current.viewportHeight).toBe(768);
    expect(result.current.isAddressBarVisible).toBe(false);
  });

  it('should detect address bar visibility', () => {
    Object.defineProperty(document.documentElement, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result } = renderHook(() => useViewportHeight());

    expect(result.current.isAddressBarVisible).toBe(true);
  });
});
