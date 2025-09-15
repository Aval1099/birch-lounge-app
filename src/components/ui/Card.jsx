import React, { memo, forwardRef } from 'react';

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
  const baseClasses = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg';
  
  const variantClasses = {
    default: '',
    elevated: 'bg-white dark:bg-gray-800',
    outlined: 'border-2',
    ghost: 'border-transparent bg-gray-50 dark:bg-gray-900'
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
  
  const hoverClasses = hover ? 'transition-shadow hover:shadow-lg cursor-pointer' : '';
  
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
