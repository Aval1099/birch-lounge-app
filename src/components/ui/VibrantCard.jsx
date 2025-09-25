import { forwardRef } from 'react';

/**
 * Vibrant Card Component - Modern, colorful, and interactive
 */
const VibrantCard = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  hover = true,
  clickable = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = `
    rounded-xl border transition-all duration-200 ease-out
    ${hover ? 'hover:scale-[1.02] hover:-translate-y-1' : ''}
    ${clickable ? 'cursor-pointer' : ''}
  `;

  const variants = {
    default: `
      bg-white dark:bg-gray-800
      border-gray-200 dark:border-gray-700
      shadow-lg hover:shadow-xl
      hover:border-emerald-300 dark:hover:border-emerald-600
    `,
    elevated: `
      bg-white dark:bg-gray-800
      border-gray-200 dark:border-gray-700
      shadow-xl hover:shadow-2xl
      hover:border-emerald-300 dark:hover:border-emerald-600
    `,
    glass: `
      bg-white/80 dark:bg-gray-800/80 backdrop-blur-md
      border-white/20 dark:border-gray-700/20
      shadow-lg hover:shadow-xl
      hover:bg-white/90 dark:hover:bg-gray-800/90
    `,
    gradient: `
      bg-gradient-to-br from-emerald-50 to-green-100
      dark:from-emerald-900/20 dark:to-green-900/20
      border-emerald-200 dark:border-emerald-700
      shadow-lg hover:shadow-xl
      hover:from-emerald-100 hover:to-green-200
      dark:hover:from-emerald-900/30 dark:hover:to-green-900/30
    `,
    outlined: `
      bg-transparent border-2
      border-emerald-300 dark:border-emerald-600
      hover:bg-emerald-50 dark:hover:bg-emerald-900/20
      hover:border-emerald-400 dark:hover:border-emerald-500
    `,
    vibrant: `
      bg-gradient-to-br from-emerald-500 to-green-600
      border-emerald-400 text-white
      shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40
      hover:from-emerald-600 hover:to-green-700
    `
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant] || variants.default}
    ${paddings[padding] || paddings.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

VibrantCard.displayName = 'VibrantCard';

// Card Header Component
export const VibrantCardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Card Content Component
export const VibrantCardContent = ({ children, className = '', ...props }) => (
  <div className={`py-4 ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer Component
export const VibrantCardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default VibrantCard;
