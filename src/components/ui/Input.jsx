import { forwardRef, memo } from 'react';

import { useApp } from '../../hooks/useApp';

/**
 * Reusable Input component with theme support and accessibility features
 */
const Input = memo(forwardRef(({
  label,
  icon,
  className = '',
  id,
  name,
  error,
  helperText,
  required = false,
  ...props
}, ref) => {
  const { state } = useApp();
  const theme = state.theme;

  // Generate unique ID if not provided
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;

  // Theme-based styles
  const themeStyles = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500';

  // Error styles
  const errorStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'focus:ring-amber-500';

  // Base input styles
  const inputStyles = [
    'w-full py-2 rounded-lg transition-colors',
    'focus:outline-none focus:ring-2',
    'border disabled:opacity-50 disabled:cursor-not-allowed',
    themeStyles,
    errorStyles,
    icon ? 'pl-10 pr-4' : 'px-4',
    className
  ].join(' ');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          className={inputStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` :
              helperText ? `${inputId}-helper` :
                undefined
          }
          {...props}
        />
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';

export default Input;
