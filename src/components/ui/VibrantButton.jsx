import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

/**
 * Vibrant Button Component - Modern, colorful, and touch-optimized
 */
const VibrantButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  className = '',
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-medium rounded-lg
    transition-all duration-200 ease-out transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 hover:scale-105 hover:-translate-y-0.5
    shadow-lg hover:shadow-xl
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-emerald-500 to-green-600 
      hover:from-emerald-600 hover:to-green-700
      text-white border-0
      focus:ring-emerald-500
      shadow-emerald-500/25 hover:shadow-emerald-500/40
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200
      hover:from-gray-200 hover:to-gray-300
      text-gray-800 border border-gray-300
      focus:ring-gray-500
      shadow-gray-500/25 hover:shadow-gray-500/40
    `,
    accent: `
      bg-gradient-to-r from-green-400 to-emerald-500
      hover:from-green-500 hover:to-emerald-600
      text-white border-0
      focus:ring-green-500
      shadow-green-500/25 hover:shadow-green-500/40
    `,
    glass: `
      bg-white/10 backdrop-blur-md border border-white/20
      hover:bg-white/20 hover:border-white/30
      text-gray-800 dark:text-white
      focus:ring-emerald-500
      shadow-lg hover:shadow-xl
    `,
    ghost: `
      bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20
      text-emerald-600 dark:text-emerald-400 border-0
      focus:ring-emerald-500
      shadow-none hover:shadow-md
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600
      hover:from-red-600 hover:to-red-700
      text-white border-0
      focus:ring-red-500
      shadow-red-500/25 hover:shadow-red-500/40
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[52px]'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

VibrantButton.displayName = 'VibrantButton';

export default VibrantButton;
