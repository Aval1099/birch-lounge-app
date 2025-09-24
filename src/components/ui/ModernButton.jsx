import { forwardRef, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

/**
 * Modern Button Component - Premium mobile-first design
 * Features: Glassmorphism, haptic feedback, accessibility, touch-optimized
 */
const ModernButton = memo(forwardRef(({ 
  children,
  className = '',
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  haptic = true,
  onClick,
  ...props 
}, ref) => {
  // Base classes for all buttons
  const baseClasses = [
    // Layout & Sizing
    'relative inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98] transform',
    
    // Touch optimization
    'touch-manipulation select-none',
    'min-h-[44px]', // iOS/Android touch target minimum
    
    // Modern styling
    'rounded-xl shadow-sm',
    'backdrop-blur-sm',
  ].join(' ');

  // Variant styles
  const variants = {
    primary: [
      'bg-gradient-to-r from-primary-500 to-primary-600',
      'hover:from-primary-600 hover:to-primary-700',
      'text-white shadow-lg shadow-primary-500/25',
      'focus:ring-primary-500',
      'border border-primary-400/20',
    ].join(' '),
    
    secondary: [
      'bg-gradient-to-r from-neutral-100 to-neutral-200',
      'hover:from-neutral-200 hover:to-neutral-300',
      'text-neutral-900 shadow-md',
      'focus:ring-neutral-500',
      'border border-neutral-300/50',
      'dark:from-neutral-800 dark:to-neutral-700',
      'dark:hover:from-neutral-700 dark:hover:to-neutral-600',
      'dark:text-neutral-100 dark:border-neutral-600/50',
    ].join(' '),
    
    accent: [
      'bg-gradient-to-r from-accent-500 to-accent-600',
      'hover:from-accent-600 hover:to-accent-700',
      'text-white shadow-lg shadow-accent-500/25',
      'focus:ring-accent-500',
      'border border-accent-400/20',
    ].join(' '),
    
    ghost: [
      'bg-transparent hover:bg-neutral-100/80',
      'text-neutral-700 hover:text-neutral-900',
      'focus:ring-neutral-500',
      'dark:hover:bg-neutral-800/80',
      'dark:text-neutral-300 dark:hover:text-neutral-100',
      'backdrop-blur-md',
    ].join(' '),
    
    glass: [
      'bg-white/10 hover:bg-white/20',
      'text-neutral-900 hover:text-neutral-800',
      'border border-white/20 hover:border-white/30',
      'backdrop-blur-xl shadow-glass',
      'focus:ring-white/50',
      'dark:text-neutral-100 dark:hover:text-neutral-50',
      'dark:bg-black/10 dark:hover:bg-black/20',
      'dark:border-black/20 dark:hover:border-black/30',
    ].join(' '),
    
    danger: [
      'bg-gradient-to-r from-error-500 to-error-600',
      'hover:from-error-600 hover:to-error-700',
      'text-white shadow-lg shadow-error-500/25',
      'focus:ring-error-500',
      'border border-error-400/20',
    ].join(' '),
    
    success: [
      'bg-gradient-to-r from-success-500 to-success-600',
      'hover:from-success-600 hover:to-success-700',
      'text-white shadow-lg shadow-success-500/25',
      'focus:ring-success-500',
      'border border-success-400/20',
    ].join(' '),
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    default: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
    xl: 'px-8 py-5 text-xl min-h-[60px]',
    icon: 'p-3 min-h-[44px] min-w-[44px]',
  };

  // Handle click with haptic feedback
  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Haptic feedback for mobile devices
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10); // Subtle haptic feedback
    }
    
    onClick?.(e);
  };

  // Combine all classes
  const buttonClasses = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Loading state */}
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      
      {/* Left icon */}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="w-4 h-4" />
      )}
      
      {/* Button content */}
      {children && (
        <span className={loading ? 'opacity-70' : ''}>
          {children}
        </span>
      )}
      
      {/* Right icon */}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="w-4 h-4" />
      )}
      
      {/* Ripple effect overlay */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      </div>
    </button>
  );
}));

ModernButton.displayName = 'ModernButton';

export default ModernButton;
