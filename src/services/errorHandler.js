// =============================================================================
// SIMPLIFIED ERROR HANDLING SERVICE
// =============================================================================

/**
 * Simplified error handling service for the application
 */
export const errorHandler = {
  /**
   * Handle and log errors with appropriate user messages
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @param {Object} options - Additional options for error handling
   * @returns {Object} User-friendly error info with recovery actions
   */
  handle: (error, context = 'Unknown', options = {}) => {
    const category = options.category || errorHandler.getErrorCategory(error, context);
    const severity = options.severity || errorHandler.getSeverity(error);
    const actionable = options.actionable ?? (category !== errorHandler.ErrorCategories.SYSTEM);

    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message || 'An unexpected error occurred',
      userMessage: errorHandler.getUserMessage(error, context),
      severity,
      category,
      actionable,
      recoveryActions: errorHandler.getRecoveryActions(error, context, { ...options, category }),
      canRetry: errorHandler.canRetry(error, context),
      isTemporary: errorHandler.isTemporary(error),
      metadata: {
        errorCode: error.code || null,
        statusCode: error.status || null,
        stack: error.stack || null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null
      }
    };

    // Track error for statistics
    errorHandler._trackError(errorInfo);

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error(`🔴 Error in ${context}`);
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('Info:', errorInfo);
    } else {
      console.error(`Error in ${context}:`, errorInfo.message);
    }

    return errorInfo;
  },

  /**
   * Handle and log errors with appropriate user messages (backward compatibility)
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {Object} User-friendly error info
   */
  handleSimple: (error, context = 'Unknown') => {
    const detailed = errorHandler.handle(error, context);
    return {
      timestamp: detailed.timestamp,
      context: detailed.context,
      message: detailed.message,
      userMessage: detailed.userMessage,
      severity: detailed.severity
    };
  },

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {string} User-friendly message
   */
  getUserMessage: (error, context) => {
    const message = error.message?.toLowerCase() || '';

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    // Storage errors
    if (message.includes('quota') || message.includes('storage')) {
      return 'Storage limit reached. Please clear some data or free up browser storage.';
    }

    // API errors
    if (message.includes('api') || message.includes('unauthorized')) {
      return 'API service issue. Please check your API key configuration.';
    }

    // File errors
    if (message.includes('file') || message.includes('upload')) {
      return 'File processing error. Please check the file format and try again.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Data validation error. Please check your input and try again.';
    }

    // Context-specific messages
    switch (context) {
      case 'Recipe Save':
        return 'Failed to save recipe. Please check all required fields and try again.';
      case 'Data Import':
        return 'Failed to import data. Please check the file format and try again.';
      case 'Cloud Sync':
        return 'Cloud sync failed. Your data is saved locally and will sync when connection is restored.';
      case 'PDF Processing':
        return 'Failed to process PDF. Please ensure the file is a valid PDF and try again.';
      default:
        return 'Something went wrong. Please try again or refresh the page.';
    }
  },

  /**
   * Determine error severity
   * @param {Error} error - Error object
   * @returns {string} Severity level
   */
  getSeverity: (error) => {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('api key') || message.includes('configuration')) {
      return errorHandler.ErrorSeverity.HIGH;
    }

    if (message.includes('network') || message.includes('sync')) {
      return errorHandler.ErrorSeverity.MEDIUM;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return errorHandler.ErrorSeverity.HIGH;
    }

    if (message.includes('quota') || message.includes('storage')) {
      return errorHandler.ErrorSeverity.CRITICAL;
    }

    return errorHandler.ErrorSeverity.MEDIUM;
  },

  /**
   * Create error boundary handler
   * @param {string} componentName - Name of the component
   * @returns {Function} Error boundary handler
   */
  createBoundaryHandler: (componentName) => {
    return (error, errorInfo) => {
      const handled = errorHandler.handle(error, `Component: ${componentName}`);

      // Additional logging for React errors
      if (import.meta.env.DEV) {
        console.error('React Error Info:', errorInfo);
      }

      return handled;
    };
  },

  /**
   * Handle async operation errors
   * @param {Promise} promise - Promise to handle
   * @param {string} context - Context for error handling
   * @returns {Promise} Promise with error handling
   */
  handleAsync: async (promise, context) => {
    try {
      return await promise;
    } catch (error) {
      const handled = errorHandler.handle(error, context);
      throw new Error(handled.userMessage);
    }
  },

  /**
   * Validate and handle API responses
   * @param {Response} response - Fetch response
   * @param {string} context - API context
   * @returns {Promise} Validated response
   */
  handleApiResponse: async (response, context) => {
    if (!response.ok) {
      const error = new Error(`API Error: ${response.status} ${response.statusText}`);
      throw errorHandler.handle(error, context);
    }
    return response;
  },

  /**
   * Safe JSON parsing with error handling
   * @param {string} jsonString - JSON string to parse
   * @param {string} context - Context for error handling
   * @returns {Object|null} Parsed object or null if invalid
   */
  safeJsonParse: (jsonString, context = 'JSON Parse') => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      errorHandler.handle(error, context);
      return null;
    }
  },

  /**
   * Get error category for classification
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {string} Error category
   */
  getErrorCategory: (error, context) => {
    const message = error.message?.toLowerCase() || '';

    // Network and connectivity
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }

    // Storage and quota
    if (message.includes('quota') || message.includes('storage') || message.includes('localstorage')) {
      return 'storage';
    }

    // Authentication and authorization
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }

    if (message.includes('configuration')) {
      return 'configuration';
    }

    // Validation and input
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }

    // File processing
    if (message.includes('file') || message.includes('upload') || message.includes('pdf') || message.includes('parse')) {
      return 'file';
    }

    // Database and sync
    if (message.includes('sync') || message.includes('database') || message.includes('supabase')) {
      return 'database';
    }

    // Context-based categorization
    if (context.includes('Recipe')) return 'recipe';
    if (context.includes('Ingredient')) return 'ingredient';
    if (context.includes('Import')) return 'import';
    if (context.includes('Export')) return 'export';
    if (context.includes('PDF')) return 'file';
    if (context.includes('AI') || context.includes('Gemini')) return 'ai';

    return 'general';
  },

  /**
   * Get recovery actions for the error
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @param {Object} options - Additional options
   * @returns {Array} Array of recovery actions
   */
  getRecoveryActions: (error, context, options = {}) => {
    const category = options.category || errorHandler.getErrorCategory(error, context);
    const actions = [];

    switch (category) {
      case 'configuration':
        actions.push(
          {
            type: 'open_settings',
            label: 'Open Settings',
            description: 'Review your API key configuration',
            action: 'open_settings',
            priority: 'high'
          },
          {
            type: 'regenerate_key',
            label: 'Regenerate Key',
            description: 'Generate a new API key from your provider',
            action: 'external_link',
            url: errorHandler._getApiKeyUrl(error.message),
            priority: 'medium'
          }
        );
        break;

      case 'network':
        actions.push(
          {
            type: 'retry',
            label: 'Retry',
            description: 'Try the operation again',
            action: 'retry',
            priority: 'high'
          },
          {
            type: 'check_connection',
            label: 'Check Connection',
            description: 'Verify your internet connection',
            action: 'manual',
            priority: 'medium'
          },
          {
            type: 'offline_mode',
            label: 'Work Offline',
            description: 'Continue working offline until connection is restored',
            action: 'switch_mode',
            priority: 'low'
          }
        );
        break;

      case 'storage':
        actions.push(
          {
            type: 'clear_storage',
            label: 'Clear Storage',
            description: 'Clear browser storage to free up space',
            action: 'clear_storage',
            priority: 'high'
          },
          {
            type: 'export_data',
            label: 'Export Data',
            description: 'Export your data before clearing storage',
            action: 'export',
            priority: 'medium'
          }
        );
        break;

      case 'auth':
        actions.push(
          {
            type: 'check_api_key',
            label: 'Check API Key',
            description: 'Verify your API key configuration in Settings',
            action: 'open_settings',
            priority: 'high'
          },
          {
            type: 'regenerate_key',
            label: 'Regenerate Key',
            description: 'Generate a new API key from your provider',
            action: 'external_link',
            url: errorHandler._getApiKeyUrl(error.message),
            priority: 'medium'
          }
        );
        break;

      case 'validation':
        actions.push(
          {
            type: 'fix_validation',
            label: 'Fix Errors',
            description: 'Correct the validation errors and try again',
            action: 'manual',
            priority: 'high'
          },
          {
            type: 'reset_form',
            label: 'Reset Form',
            description: 'Clear the form and start over',
            action: 'reset',
            priority: 'low'
          }
        );
        break;

      case 'file':
        actions.push(
          {
            type: 'check_file',
            label: 'Check File',
            description: 'Ensure the file is valid and not corrupted',
            action: 'manual',
            priority: 'high'
          },
          {
            type: 'try_different_file',
            label: 'Try Different File',
            description: 'Select a different file to process',
            action: 'file_select',
            priority: 'medium'
          }
        );
        break;

      case 'database':
        actions.push(
          {
            type: 'retry_sync',
            label: 'Retry Sync',
            description: 'Try syncing your data again',
            action: 'retry',
            priority: 'high'
          },
          {
            type: 'work_offline',
            label: 'Work Offline',
            description: 'Continue working offline, data will sync later',
            action: 'switch_mode',
            priority: 'medium'
          }
        );
        break;

      default:
        actions.push(
          {
            type: 'retry',
            label: 'Try Again',
            description: 'Retry the operation',
            action: 'retry',
            priority: 'high'
          },
          {
            type: 'refresh',
            label: 'Refresh Page',
            description: 'Refresh the page and try again',
            action: 'refresh',
            priority: 'medium'
          },
          {
            type: 'contact_support',
            label: 'Contact Support',
            description: 'Get help if the problem persists',
            action: 'external_link',
            url: 'mailto:support@example.com',
            priority: 'low'
          }
        );
    }

    // Add context-specific actions
    if (context.includes('Import') && options.hasBackup) {
      actions.unshift({
        type: 'restore_backup',
        label: 'Restore Backup',
        description: 'Restore from the last successful backup',
        action: 'restore',
        priority: 'high'
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  },

  /**
   * Check if error can be retried
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {boolean} Whether the error can be retried
   */
  canRetry: (error, _context) => {
    const message = error.message?.toLowerCase() || '';

    // Network errors are usually retryable
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return true;
    }

    // Temporary server errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Rate limiting
    if (error.status === 429) {
      return true;
    }

    // Validation errors are not retryable without fixing the input
    if (message.includes('validation') || message.includes('invalid')) {
      return false;
    }

    // Auth errors need manual intervention
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return false;
    }

    return false;
  },

  /**
   * Check if error is temporary
   * @param {Error} error - Error object
   * @returns {boolean} Whether the error is temporary
   */
  isTemporary: (error) => {
    const message = error.message?.toLowerCase() || '';

    // Network issues are usually temporary
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return true;
    }

    // Server errors might be temporary
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Rate limiting is temporary
    if (error.status === 429) {
      return true;
    }

    return false;
  },

  /**
   * Get error statistics (enhanced with tracking)
   * @returns {Object} Error statistics
   */
  getStats: () => {
    return errorHandler._errorStats || {
      totalErrors: 0,
      errorsByContext: {},
      errorsByCategory: {},
      lastError: null,
      mostCommonErrors: []
    };
  },

  // =========================================================================
  // PRIVATE HELPER FUNCTIONS
  // =========================================================================

  /**
   * Track error for statistics
   * @private
   */
  _trackError: (errorInfo) => {
    if (!errorHandler._errorStats) {
      errorHandler._errorStats = {
        totalErrors: 0,
        errorsByContext: {},
        errorsByCategory: {},
        lastError: null,
        mostCommonErrors: []
      };
    }

    const stats = errorHandler._errorStats;
    stats.totalErrors++;
    stats.lastError = errorInfo;

    // Track by context
    if (!stats.errorsByContext[errorInfo.context]) {
      stats.errorsByContext[errorInfo.context] = 0;
    }
    stats.errorsByContext[errorInfo.context]++;

    // Track by category
    if (!stats.errorsByCategory[errorInfo.category]) {
      stats.errorsByCategory[errorInfo.category] = 0;
    }
    stats.errorsByCategory[errorInfo.category]++;

    // Update most common errors (keep top 10)
    const errorKey = `${errorInfo.category}:${errorInfo.context}`;
    const existing = stats.mostCommonErrors.find(e => e.key === errorKey);

    if (existing) {
      existing.count++;
    } else {
      stats.mostCommonErrors.push({
        key: errorKey,
        category: errorInfo.category,
        context: errorInfo.context,
        count: 1,
        lastOccurrence: errorInfo.timestamp
      });
    }

    // Sort and keep top 10
    stats.mostCommonErrors.sort((a, b) => b.count - a.count);
    stats.mostCommonErrors = stats.mostCommonErrors.slice(0, 10);
  },

  /**
   * Get API key generation URL based on error message
   * @private
   */
  _getApiKeyUrl: (errorMessage) => {
    const message = errorMessage?.toLowerCase() || '';

    if (message.includes('gemini') || message.includes('google')) {
      return 'https://aistudio.google.com/app/apikey';
    }

    if (message.includes('openai') || message.includes('gpt')) {
      return 'https://platform.openai.com/api-keys';
    }

    return 'https://console.developers.google.com/apis/credentials';
  },

  /**
   * Reset error statistics
   * @private
   */
  _resetStats: () => {
    errorHandler._errorStats = {
      totalErrors: 0,
      errorsByContext: {},
      errorsByCategory: {},
      lastError: null,
      mostCommonErrors: []
    };
  },

  /**
   * Handle API key specific errors
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {Object} API key error info
   */
  handleApiKeyError: (error, context = 'API Key') => {
    return errorHandler.handle(error, context, {
      category: errorHandler.ErrorCategories.CONFIGURATION,
      severity: errorHandler.ErrorSeverity.HIGH,
      actionable: true
    });
  },

  /**
   * Validate API key with detailed feedback
   * @param {string} apiKey - API key to validate
   * @param {string} service - Service name
   * @returns {Object} Validation result with detailed feedback
   */
  validateApiKeyWithDetails: (apiKey, service) => {
    const errors = [];
    const warnings = [];

    if (!apiKey || apiKey.trim() === '') {
      errors.push({
        code: 'MISSING_API_KEY',
        message: `API key is required for ${service}`,
        severity: 'high'
      });
    } else if (apiKey === 'your_api_key_here' || apiKey.includes('placeholder')) {
      errors.push({
        code: 'PLACEHOLDER_KEY',
        message: `Please replace the placeholder API key for ${service}`,
        severity: 'high'
      });
    } else {
      // Basic format validation without exposing the key
      if (service === 'gemini' && !apiKey.startsWith('AIza')) {
        errors.push({
          code: 'INVALID_FORMAT',
          message: `Invalid API key format for ${service}`,
          severity: 'high'
        });
      } else if (service === 'openai' && !apiKey.startsWith('sk-')) {
        errors.push({
          code: 'INVALID_FORMAT',
          message: `Invalid API key format for ${service}`,
          severity: 'high'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      service
    };
  },

  /**
   * Create user-friendly error message
   * @param {Object} errorInfo - Error information object
   * @returns {string} User-friendly message
   */
  createUserFriendlyMessage: (errorInfo) => {
    let message = errorInfo.userMessage || errorInfo.message || 'An error occurred';

    if (errorInfo.category === 'configuration' || errorInfo.category === 'validation') {
      message += '\n\nPlease check your API key format and configuration.';
    }

    if (errorInfo.suggestions && errorInfo.suggestions.length > 0) {
      message += `\n\nSuggestions:\n${  errorInfo.suggestions.map(s => `• ${s}`).join('\n')}`;
    }

    return message;
  },

  /**
   * Error categories for classification
   */
  ErrorCategories: {
    VALIDATION: 'validation',
    CONFIGURATION: 'configuration',
    NETWORK: 'network',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    SYSTEM: 'system'
  },

  /**
   * Error severity levels
   */
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  /**
   * Create recovery action for errors
   * @param {Object} errorInfo - Error information object
   * @returns {Object} Recovery action information
   */
  createRecoveryAction: (errorInfo) => {
    const canRecover = errorInfo.category !== errorHandler.ErrorCategories.SYSTEM &&
      errorInfo.severity !== errorHandler.ErrorSeverity.CRITICAL;

    let primaryAction = {
      action: 'retry',
      label: 'Try Again',
      description: 'Retry the operation',
      priority: 'medium'
    };

    switch (errorInfo.category) {
      case errorHandler.ErrorCategories.CONFIGURATION:
      case errorHandler.ErrorCategories.VALIDATION:
        primaryAction = {
          action: 'open_settings',
          label: 'Open Settings',
          description: 'Review your API key configuration in Settings',
          priority: 'high'
        };
        break;
      case errorHandler.ErrorCategories.NETWORK:
        primaryAction = {
          action: 'retry',
          label: 'Retry Request',
          description: 'Try the request again',
          priority: 'medium'
        };
        break;
      default:
        primaryAction = {
          action: 'retry',
          label: 'Try Again',
          description: 'Retry the operation',
          priority: 'medium'
        };
    }

    return {
      canRecover,
      action: primaryAction.action,
      label: primaryAction.label,
      description: primaryAction.description,
      priority: primaryAction.priority,
      autoRetry: errorInfo.canRetry || false,
      retryDelay: errorInfo.isTemporary ? 5000 : 0
    };
  }
};

export default errorHandler;
