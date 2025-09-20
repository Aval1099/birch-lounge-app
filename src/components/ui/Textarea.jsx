import { memo } from 'react';

import { useApp } from '../../hooks/useApp';

/**
 * Reusable Textarea component with theme support and accessibility features
 */
const Textarea = memo(({
  label,
  className = '',
  id,
  name,
  error,
  helperText,
  required = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  ...props
}) => {
  const { state } = useApp();
  const theme = state.theme;

  // Generate unique ID if not provided
  const textareaId = id || `textarea-${name || Math.random().toString(36).substr(2, 9)}`;

  // Theme-based styles
  const themeStyles = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Error styles
  const errorStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'focus:border-amber-500 focus:ring-amber-500';

  // Base textarea styles
  const textareaStyles = [
    'w-full p-3 rounded-lg transition-colors resize-vertical',
    'border focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    themeStyles,
    errorStyles,
    className
  ].join(' ');

  // Character count
  const currentLength = props.value?.length || 0;
  const isNearLimit = maxLength && currentLength > maxLength * 0.8;
  const isOverLimit = maxLength && currentLength > maxLength;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
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

      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        className={textareaStyles}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${textareaId}-error` :
            helperText ? `${textareaId}-helper` :
              undefined
        }
        {...props}
      />

      {/* Character count and helper text row */}
      <div className="mt-1 flex justify-between items-start">
        <div className="flex-1">
          {error && (
            <p
              id={`${textareaId}-error`}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}

          {helperText && !error && (
            <p
              id={`${textareaId}-helper`}
              className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
            >
              {helperText}
            </p>
          )}
        </div>

        {(showCharCount || maxLength) && (
          <div className="ml-2 flex-shrink-0">
            <span
              className={`text-xs ${isOverLimit
                  ? 'text-red-500'
                  : isNearLimit
                    ? 'text-yellow-500'
                    : theme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              aria-label={`Character count: ${currentLength}${maxLength ? ` of ${maxLength}` : ''}`}
            >
              {currentLength}
              {maxLength && `/${maxLength}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
