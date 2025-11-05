import { forwardRef, memo } from 'react';

import { useMobileDetection, useTouchInteraction } from '../../hooks';
import { useApp } from '../../hooks/useApp';

/**
 * Reusable Button component with theme support and accessibility features
 */
const Button = memo(forwardRef(({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  ariaLabel,
  touchOptimized = true,
  ...props
}, ref) => {
  const { state } = useApp();
  const theme = state.theme;
  const { isMobile, isTouch } = useMobileDetection();

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size variants with mobile touch target optimization
  const sizeStyles = {
    sm: touchOptimized && (isMobile || isTouch)
      ? 'px-4 py-3 text-sm rounded-md min-h-[44px] min-w-[44px]' // WCAG AA compliant
      : 'px-3 py-1.5 text-sm rounded-md',
    md: touchOptimized && (isMobile || isTouch)
      ? 'px-6 py-3 text-sm rounded-lg min-h-[48px] min-w-[48px]' // Recommended size
      : 'px-4 py-2 text-sm rounded-lg',
    lg: touchOptimized && (isMobile || isTouch)
      ? 'px-8 py-4 text-base rounded-lg min-h-[56px] min-w-[56px]' // Comfortable size
      : 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-xl min-h-[56px]'
  };

  // Theme-based variant styles
  const variantStyles = {
    light: {
      default: 'bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-800 focus:ring-green-500 border border-green-200',
      primary: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white focus:ring-green-500 shadow-lg shadow-green-500/25',
      secondary: 'bg-gradient-to-r from-neutral-100 to-neutral-200 hover:from-neutral-200 hover:to-neutral-300 text-neutral-800 focus:ring-neutral-400 border border-neutral-300',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
      ghost: 'bg-transparent hover:bg-green-100 text-green-700 focus:ring-green-500',
      success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white focus:ring-green-500',
      outline: 'border border-green-300 bg-transparent hover:bg-green-50 text-green-700 focus:ring-green-500'
    },
    dark: {
      default: 'bg-gradient-to-r from-green-800 to-emerald-800 hover:from-green-700 hover:to-emerald-700 text-green-100 focus:ring-green-500',
      primary: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white focus:ring-green-500 shadow-lg shadow-green-500/25',
      secondary: 'bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 text-neutral-100 focus:ring-neutral-500 border border-neutral-600/60',
      danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
      ghost: 'bg-transparent hover:bg-green-900/30 text-green-300 focus:ring-green-500',
      success: 'bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white focus:ring-green-500',
      outline: 'border border-green-600 bg-transparent hover:bg-green-900/20 text-green-300 focus:ring-green-500'
    }
  };

  // Combine all styles
  const buttonStyles = [
    baseStyles,
    sizeStyles[size],
    variantStyles[theme][variant],
    className
  ].join(' ');

  // Touch interaction handlers for mobile
  const touchHandlers = useTouchInteraction({
    onTap: (e) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }

      // For submit buttons, let the form handle the submission
      if (type === 'submit') {
        return;
      }

      onClick?.(e);
    }
  });

  // Handle click with loading state
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    // For submit buttons, let the form handle the submission
    if (type === 'submit') {
      return;
    }

    onClick?.(e);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...(touchOptimized && (isMobile || isTouch) ? touchHandlers : {})}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}));

Button.displayName = 'Button';

export default Button;
