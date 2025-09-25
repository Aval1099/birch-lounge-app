import { memo, forwardRef } from 'react';

/**
 * Card Component - A flexible container with consistent styling
 */
const Card = memo(forwardRef(({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  hover = false,
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/20 border border-green-200/50 dark:border-green-700/50 rounded-lg shadow-sm';

  const variantClasses = {
    default: '',
    elevated: 'bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/30 shadow-lg',
    outlined: 'border-2 border-green-300/50 dark:border-green-600/50',
    ghost: 'border-transparent bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-gray-900/50 dark:to-green-900/30'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 cursor-pointer' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    shadowClasses[shadow],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      aria-label={props['aria-label']}
      {...props}
    >
      {children}
    </div>
  );
}));

Card.displayName = 'Card';

export default Card;
