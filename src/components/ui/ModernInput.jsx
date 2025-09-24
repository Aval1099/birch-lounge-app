import { forwardRef, memo, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils';

/**
 * Modern Input Component - Premium mobile-first design
 * Features: Floating labels, validation states, touch-optimized, accessibility
 */
const ModernInput = memo(forwardRef(({ 
  label,
  placeholder,
  type = 'text',
  error,
  success,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  // Handle focus
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e) => {
    setIsFocused(false);
    setHasValue(Boolean(e.target.value));
    onBlur?.(e);
  };

  // Handle change
  const handleChange = (e) => {
    setHasValue(Boolean(e.target.value));
    onChange?.(e);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Container classes
  const containerClasses = cn(
    'relative w-full',
    containerClassName
  );

  // Input wrapper classes
  const wrapperClasses = cn(
    // Base layout
    'relative flex items-center',
    'min-h-[56px]', // Touch-friendly height
    
    // Background and border
    'bg-white/90 backdrop-blur-sm',
    'dark:bg-neutral-900/90',
    'border border-neutral-300/60',
    'dark:border-neutral-600/60',
    'rounded-xl',
    
    // Focus states
    isFocused && [
      'border-primary-500 dark:border-primary-400',
      'ring-2 ring-primary-500/20',
      'shadow-sm shadow-primary-500/10',
    ],
    
    // Error states
    error && [
      'border-error-500 dark:border-error-400',
      'ring-2 ring-error-500/20',
      'shadow-sm shadow-error-500/10',
    ],
    
    // Success states
    success && [
      'border-success-500 dark:border-success-400',
      'ring-2 ring-success-500/20',
      'shadow-sm shadow-success-500/10',
    ],
    
    // Disabled states
    disabled && [
      'opacity-60 cursor-not-allowed',
      'bg-neutral-100/60 dark:bg-neutral-800/60',
    ],
    
    // Transitions
    'transition-all duration-200 ease-out'
  );

  // Input classes
  const inputClasses = cn(
    // Base styling
    'flex-1 bg-transparent border-none outline-none',
    'text-base text-neutral-900 dark:text-neutral-100',
    'placeholder-transparent',
    
    // Spacing
    'px-4 py-4',
    LeftIcon && 'pl-12',
    (RightIcon || isPassword) && 'pr-12',
    
    // Touch optimization
    'touch-manipulation',
    
    // Disabled state
    disabled && 'cursor-not-allowed',
    
    className
  );

  // Label classes
  const labelClasses = cn(
    // Base positioning
    'absolute left-4 transition-all duration-200 ease-out',
    'pointer-events-none select-none',
    'text-neutral-600 dark:text-neutral-400',
    
    // Floating label animation
    (isFocused || hasValue) ? [
      'top-2 text-xs font-medium',
      'text-primary-600 dark:text-primary-400',
    ] : [
      'top-1/2 -translate-y-1/2 text-base',
    ],
    
    // Icon spacing
    LeftIcon && 'left-12',
    
    // Error/success states
    error && 'text-error-600 dark:text-error-400',
    success && 'text-success-600 dark:text-success-400',
    
    // Required indicator
    required && "after:content-['*'] after:text-error-500 after:ml-1"
  );

  return (
    <div className={containerClasses}>
      {/* Input wrapper */}
      <div className={wrapperClasses}>
        {/* Left icon */}
        {LeftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <LeftIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </div>
        )}
        
        {/* Input field */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={inputClasses}
          placeholder={placeholder}
          {...props}
        />
        
        {/* Floating label */}
        {label && (
          <label className={labelClasses}>
            {label}
          </label>
        )}
        
        {/* Right icon or password toggle */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Validation icons */}
          {error && (
            <AlertCircle className="w-5 h-5 text-error-500" />
          )}
          {success && (
            <CheckCircle className="w-5 h-5 text-success-500" />
          )}
          
          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-neutral-500" />
              ) : (
                <Eye className="w-5 h-5 text-neutral-500" />
              )}
            </button>
          )}
          
          {/* Custom right icon */}
          {RightIcon && !isPassword && (
            <RightIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          )}
        </div>
        
        {/* Focus ring effect */}
        <div className="absolute inset-0 rounded-xl pointer-events-none">
          <div className={cn(
            'absolute inset-0 rounded-xl transition-opacity duration-200',
            'bg-gradient-to-r from-primary-500/5 via-transparent to-primary-500/5',
            isFocused ? 'opacity-100' : 'opacity-0'
          )} />
        </div>
      </div>
      
      {/* Helper text or error message */}
      {(helperText || error) && (
        <div className="mt-2 px-4">
          <p className={cn(
            'text-sm',
            error 
              ? 'text-error-600 dark:text-error-400' 
              : 'text-neutral-600 dark:text-neutral-400'
          )}>
            {error || helperText}
          </p>
        </div>
      )}
    </div>
  );
}));

ModernInput.displayName = 'ModernInput';

export default ModernInput;
