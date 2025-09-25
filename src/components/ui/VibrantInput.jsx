import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { forwardRef, useState } from 'react';

/**
 * Vibrant Input Component - Modern, colorful, and accessible
 */
const VibrantInput = forwardRef(({
  type = 'text',
  label,
  placeholder,
  error,
  success,
  helperText,
  icon,
  rightIcon,
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const baseClasses = `
    w-full rounded-lg border transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `;

  const variants = {
    default: `
      bg-white dark:bg-gray-800
      border-gray-300 dark:border-gray-600
      text-gray-900 dark:text-gray-100
      focus:border-emerald-500 focus:ring-emerald-500/20
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${success ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : ''}
    `,
    glass: `
      bg-white/80 dark:bg-gray-800/80 backdrop-blur-md
      border-white/30 dark:border-gray-700/30
      text-gray-900 dark:text-gray-100
      focus:border-emerald-500 focus:ring-emerald-500/20
      focus:bg-white/90 dark:focus:bg-gray-800/90
    `,
    vibrant: `
      bg-gradient-to-r from-emerald-50 to-green-50
      dark:from-emerald-900/20 dark:to-green-900/20
      border-emerald-300 dark:border-emerald-600
      text-gray-900 dark:text-gray-100
      focus:border-emerald-500 focus:ring-emerald-500/20
      focus:from-emerald-100 focus:to-green-100
      dark:focus:from-emerald-900/30 dark:focus:to-green-900/30
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-4 py-3 text-base min-h-[48px]'
  };

  const inputClasses = `
    ${baseClasses}
    ${variants[variant] || variants.default}
    ${sizes[size] || sizes.md}
    ${icon ? 'pl-10' : ''}
    ${rightIcon || type === 'password' ? 'pr-10' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const containerClasses = `
    relative ${fullWidth ? 'w-full' : ''}
  `;

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`
          block text-sm font-medium mb-2
          ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
          ${focused ? 'text-emerald-600 dark:text-emerald-400' : ''}
        `}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        
        {rightIcon && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {rightIcon}
          </div>
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
        
        {success && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className={`mt-2 text-xs ${
          error ? 'text-red-600 dark:text-red-400' : 
          success ? 'text-green-600 dark:text-green-400' : 
          'text-gray-500 dark:text-gray-400'
        }`}>
          {error || (success && 'This looks good!') || helperText}
        </div>
      )}
    </div>
  );
});

VibrantInput.displayName = 'VibrantInput';

export default VibrantInput;
