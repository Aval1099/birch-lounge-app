import React, { memo } from 'react';
import { Save, CheckCircle, AlertCircle, Clock } from 'lucide-react';

/**
 * Autosave Status Indicator Component
 * Provides visual feedback for autosave operations
 */
const AutosaveIndicator = memo(({ 
  status, 
  lastSaved, 
  hasUnsavedChanges, 
  error,
  className = '',
  showText = true,
  size = 'sm'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          className: 'text-blue-600 dark:text-blue-400',
          animate: true
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          className: 'text-green-600 dark:text-green-400',
          animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          className: 'text-red-600 dark:text-red-400',
          animate: false
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: Clock,
            text: 'Unsaved changes',
            className: 'text-amber-600 dark:text-amber-400',
            animate: false
          };
        }
        return {
          icon: CheckCircle,
          text: 'All changes saved',
          className: 'text-gray-500 dark:text-gray-400',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diff = now - lastSaved;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ago`;
    } else if (seconds > 0) {
      return `${seconds}s ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon 
        className={`${iconSize} ${config.className} ${
          config.animate ? 'animate-spin' : ''
        }`} 
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSize} font-medium ${config.className}`}>
            {config.text}
          </span>
          {status === 'saved' && lastSaved && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatLastSaved()}
            </span>
          )}
          {status === 'error' && error && (
            <span className="text-xs text-red-500 dark:text-red-400">
              {error.message || 'Unknown error'}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

AutosaveIndicator.displayName = 'AutosaveIndicator';

export default AutosaveIndicator;

/**
 * Compact Autosave Indicator for headers/toolbars
 */
export const CompactAutosaveIndicator = memo(({ 
  status, 
  lastSaved, 
  hasUnsavedChanges, 
  error,
  className = ''
}) => {
  return (
    <AutosaveIndicator
      status={status}
      lastSaved={lastSaved}
      hasUnsavedChanges={hasUnsavedChanges}
      error={error}
      className={className}
      showText={false}
      size="sm"
    />
  );
});

CompactAutosaveIndicator.displayName = 'CompactAutosaveIndicator';

/**
 * Detailed Autosave Status for forms
 */
export const DetailedAutosaveIndicator = memo(({ 
  status, 
  lastSaved, 
  hasUnsavedChanges, 
  error,
  className = '',
  onSaveNow = null
}) => {
  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 ${className}`}>
      <AutosaveIndicator
        status={status}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        error={error}
        showText={true}
        size="sm"
      />
      {hasUnsavedChanges && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Save now
        </button>
      )}
    </div>
  );
});

DetailedAutosaveIndicator.displayName = 'DetailedAutosaveIndicator';
