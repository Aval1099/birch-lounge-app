import { forwardRef, memo } from 'react';

import { cn } from '../../utils';

/**
 * Modern Card Component - Premium glassmorphism design
 * Features: Multiple variants, responsive, touch-optimized, accessibility
 */
const ModernCard = memo(forwardRef(({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  hover = false,
  interactive = false,
  glass = false,
  gradient = false,
  onClick,
  ...props
}, ref) => {
  // Base classes for all cards
  const baseClasses = [
    'relative overflow-hidden',
    'transition-all duration-300 ease-out',
    'border border-neutral-200/50',
    'dark:border-neutral-700/50',
  ].join(' ');

  // Variant styles
  const variants = {
    default: [
      'bg-white/95 backdrop-blur-sm',
      'dark:bg-neutral-900/95',
      'shadow-sm hover:shadow-md',
      'rounded-xl',
    ].join(' '),

    elevated: [
      'bg-white/98 backdrop-blur-md',
      'dark:bg-neutral-900/98',
      'shadow-lg hover:shadow-xl',
      'rounded-2xl',
      'border-white/20 dark:border-neutral-800/20',
    ].join(' '),

    glass: [
      'bg-white/10 backdrop-blur-xl',
      'dark:bg-black/10',
      'border-white/20 dark:border-white/10',
      'shadow-glass hover:shadow-glass-lg',
      'rounded-2xl',
    ].join(' '),

    gradient: [
      'bg-gradient-to-br from-white/90 via-white/95 to-neutral-50/90',
      'dark:from-neutral-900/90 dark:via-neutral-900/95 dark:to-neutral-800/90',
      'backdrop-blur-sm',
      'shadow-md hover:shadow-lg',
      'rounded-2xl',
      'border-gradient',
    ].join(' '),

    outlined: [
      'bg-transparent',
      'border-2 border-neutral-300/60',
      'dark:border-neutral-600/60',
      'hover:border-primary-400/60',
      'dark:hover:border-primary-500/60',
      'rounded-xl',
    ].join(' '),

    minimal: [
      'bg-neutral-50/80 backdrop-blur-sm',
      'dark:bg-neutral-800/80',
      'border-transparent',
      'shadow-none hover:shadow-sm',
      'rounded-lg',
    ].join(' '),
  };

  // Padding styles
  const paddings = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  // Interactive styles
  const interactiveClasses = interactive ? [
    'cursor-pointer',
    'hover:scale-[1.02]',
    'active:scale-[0.98]',
    'transform transition-transform',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
    'touch-manipulation',
  ].join(' ') : '';

  // Hover effects
  const hoverClasses = hover ? [
    'hover:-translate-y-1',
    'hover:shadow-lg',
    'transition-all duration-300',
  ].join(' ') : '';

  // Glass effect overlay
  const glassOverlay = glass && (
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 dark:from-white/5 dark:to-black/20 pointer-events-none" />
  );

  // Gradient border effect
  const gradientBorder = gradient && (
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-primary-600/20 p-px">
      <div className="h-full w-full rounded-2xl bg-white/95 dark:bg-neutral-900/95" />
    </div>
  );

  // Combine all classes
  const cardClasses = cn(
    baseClasses,
    variants[variant],
    paddings[padding],
    interactiveClasses,
    hoverClasses,
    className
  );

  const handleKeyDown = (e) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {/* Gradient border effect */}
      {gradientBorder}

      {/* Glass overlay effect */}
      {glassOverlay}

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Ripple effect for interactive cards */}
      {interactive && (
        <div className="absolute inset-0 overflow-hidden rounded-inherit">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
      )}
    </div>
  );
}));

ModernCard.displayName = 'ModernCard';

export default ModernCard;
