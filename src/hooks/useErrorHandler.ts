// =============================================================================
// ERROR HANDLER HOOK
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { enhancedErrorHandler, ErrorContext } from '../services/enhancedErrorHandler';

export interface UseErrorHandlerOptions {
  context?: string;
  enableAutoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (errorContext: ErrorContext) => void;
  onRetry?: (attempt: number) => void;
  onRecovery?: () => void;
}

export interface ErrorHandlerState {
  error: ErrorContext | null;
  isRetrying: boolean;
  retryCount: number;
  hasRecovered: boolean;
}

export interface ErrorHandlerActions {
  handleError: (error: Error | string, context?: string) => ErrorContext;
  handleAsyncError: <T>(promise: Promise<T>, context?: string) => Promise<T>;
  retry: () => void;
  clearError: () => void;
  executeRecoveryAction: (actionType: string) => void;
}

/**
 * Enhanced error handler hook for functional components
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}): ErrorHandlerState & ErrorHandlerActions => {
  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    hasRecovered: false
  });

  const {
    context = 'Component',
    enableAutoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onRecovery
  } = options;

  // Handle error with enhanced context
  const handleError = useCallback((error: Error | string, errorContext?: string): ErrorContext => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const fullContext = errorContext || context;

    const errorCtx = enhancedErrorHandler.handle(errorObj, fullContext, {
      retryAction: () => retry(),
      maxRetries,
      currentRetryCount: state.retryCount
    });

    setState(prev => ({
      ...prev,
      error: errorCtx,
      hasRecovered: false
    }));

    // Call custom error handler
    if (onError) {
      onError(errorCtx);
    }

    // Auto-retry for retryable errors
    if (enableAutoRetry && errorCtx.canRetry && state.retryCount < maxRetries) {
      scheduleRetry();
    }

    return errorCtx;
  }, [context, maxRetries, state.retryCount, onError, enableAutoRetry]);

  // Handle async operations with error handling
  const handleAsyncError = useCallback(async <T>(promise: Promise<T>, errorContext?: string): Promise<T> => {
    try {
      setState(prev => ({ ...prev, isRetrying: false }));
      const result = await promise;
      
      // Mark as recovered if there was a previous error
      if (state.error) {
        setState(prev => ({ ...prev, hasRecovered: true, error: null }));
        if (onRecovery) {
          onRecovery();
        }
      }
      
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      handleError(errorObj, errorContext);
      throw error;
    }
  }, [handleError, state.error, onRecovery]);

  // Schedule automatic retry
  const scheduleRetry = useCallback(() => {
    if (state.isRetrying || state.retryCount >= maxRetries) {
      return;
    }

    setState(prev => ({ ...prev, isRetrying: true }));

    const delay = retryDelay * Math.pow(2, state.retryCount); // Exponential backoff
    
    setTimeout(() => {
      retry();
    }, delay);
  }, [state.isRetrying, state.retryCount, maxRetries, retryDelay]);

  // Manual retry function
  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isRetrying: false,
      error: null
    }));

    if (onRetry) {
      onRetry(state.retryCount + 1);
    }
  }, [state.retryCount, maxRetries, onRetry]);

  // Clear error state
  const clearError = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      hasRecovered: false
    });
  }, []);

  // Execute recovery action
  const executeRecoveryAction = useCallback((actionType: string) => {
    if (!state.error) return;

    const action = state.error.recoveryActions.find(a => a.type === actionType);
    if (action) {
      try {
        action.action();
        
        // Clear error after successful recovery action
        setTimeout(() => {
          clearError();
          if (onRecovery) {
            onRecovery();
          }
        }, 100);
      } catch (error) {
        console.error('Recovery action failed:', error);
        handleError(error instanceof Error ? error : new Error(String(error)), 'Recovery Action');
      }
    }
  }, [state.error, clearError, onRecovery, handleError]);

  // Global error listener
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message), 'Global Error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      handleError(error, 'Unhandled Promise Rejection');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  return {
    // State
    error: state.error,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    hasRecovered: state.hasRecovered,
    
    // Actions
    handleError,
    handleAsyncError,
    retry,
    clearError,
    executeRecoveryAction
  };
};

/**
 * Hook for handling specific async operations with error handling
 */
export const useAsyncErrorHandler = <T>(
  asyncOperation: () => Promise<T>,
  dependencies: any[] = [],
  options: UseErrorHandlerOptions = {}
) => {
  const errorHandler = useErrorHandler(options);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      const result = await errorHandler.handleAsyncError(asyncOperation(), options.context);
      setData(result);
      return result;
    } catch (error) {
      // Error is already handled by handleAsyncError
      throw error;
    } finally {
      setLoading(false);
    }
  }, [asyncOperation, errorHandler, options.context, ...dependencies]);

  return {
    ...errorHandler,
    data,
    loading,
    execute
  };
};

/**
 * Hook for handling form submission errors
 */
export const useFormErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const errorHandler = useErrorHandler({
    ...options,
    context: options.context || 'Form Submission'
  });

  const handleSubmit = useCallback(async <T>(
    submitFunction: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: ErrorContext) => void
  ) => {
    try {
      const result = await errorHandler.handleAsyncError(submitFunction());
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (error) {
      if (onError && errorHandler.error) {
        onError(errorHandler.error);
      }
      throw error;
    }
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleSubmit
  };
};

/**
 * Hook for handling API call errors
 */
export const useApiErrorHandler = (baseUrl?: string, options: UseErrorHandlerOptions = {}) => {
  const errorHandler = useErrorHandler({
    ...options,
    context: options.context || 'API Call'
  });

  const apiCall = useCallback(async <T>(
    endpoint: string,
    requestOptions: RequestInit = {}
  ): Promise<T> => {
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
    
    return errorHandler.handleAsyncError(
      (async () => {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      })(),
      `API: ${endpoint}`
    );
  }, [baseUrl, errorHandler]);

  return {
    ...errorHandler,
    apiCall
  };
};

export default useErrorHandler;
