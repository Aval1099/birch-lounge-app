import React, { memo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select component with theme support and accessibility features
 */
const Select = memo(({ 
  label, 
  children, 
  className = '', 
  id, 
  name, 
  error,
  helperText,
  required = false,
  placeholder,
  ...props 
}) => {
  const { state } = useApp();
  const theme = state.theme;

  // Generate unique ID if not provided
  const selectId = id || `select-${name || Math.random().toString(36).substr(2, 9)}`;

  // Theme-based styles
  const themeStyles = theme === 'dark' 
    ? 'bg-gray-700 border-gray-600 text-white' 
    : 'bg-white border-gray-300 text-gray-900';

  // Error styles
  const errorStyles = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : 'focus:border-amber-500 focus:ring-amber-500';

  // Base select styles
  const selectStyles = [
    'w-full py-2 px-3 pr-10 rounded-lg transition-colors',
    'border appearance-none cursor-pointer',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    themeStyles,
    errorStyles,
    className
  ].join(' ');

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={selectId} 
          className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
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
        <select
          id={selectId}
          name={name}
          className={selectStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${selectId}-error` : 
            helperText ? `${selectId}-helper` : 
            undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        
        {/* Custom dropdown arrow */}
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {error && (
        <p 
          id={`${selectId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {helperText && !error && (
        <p 
          id={`${selectId}-helper`}
          className={`mt-1 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
