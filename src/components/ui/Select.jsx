 
import { ChevronDown } from 'lucide-react';
import { memo } from 'react';

import { useApp } from '../../hooks/useApp';

/**
 * Reusable Select component with theme support and accessibility features
 */
const Select = memo(({
  label,
  children,
  className = '',
  error,
  helperText,
  required = false,
  disabled = false,
  ...props
}) => {
  const { state } = useApp();
  const { theme } = state;

  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectStyles = `
    w-full px-3 py-2 pr-10 border rounded-lg
    bg-white dark:bg-gray-800
    border-gray-300 dark:border-gray-600
    text-gray-900 dark:text-gray-100
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 dark:disabled:bg-gray-700
    disabled:text-gray-500 dark:disabled:text-gray-400
    disabled:cursor-not-allowed
    appearance-none
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          required={required}
          {...props}
          className={selectStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${selectId}-error` :
              helperText ? `${selectId}-helper` :
                undefined
          }
        >
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
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {helperText && !error && (
        <p
          id={`${selectId}-helper`}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
