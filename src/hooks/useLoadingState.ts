import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoadingStateOptions, LoadingState, OptimisticLoadingOptions, AsyncOperation } from '../types/hooks';

/**
 * Hook for managing loading states with skeleton loading support
 * @param options - Configuration options
 * @returns Loading state management
 */
export const useLoadingState = (options: LoadingStateOptions = {}) => {
  const {
    initialLoading = false,
    minLoadingTime = 500, // Minimum time to show loading state (prevents flashing)
    showSkeleton = true,
    skeletonType = 'default',
    skeletonCount = 3
  } = options;

  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [showSkeletonLoader, setShowSkeletonLoader] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start loading with optional minimum time
  const startLoading = useCallback(() => {
    const startTime = Date.now();
    setLoadingStartTime(startTime);
    setIsLoading(true);
    setError(null);

    if (showSkeleton) {
      setShowSkeletonLoader(true);
    }
  }, [showSkeleton]);

  // Stop loading with minimum time enforcement
  const stopLoading = useCallback(() => {
    if (!loadingStartTime) {
      setIsLoading(false);
      setShowSkeletonLoader(false);
      return;
    }

    const elapsedTime = Date.now() - loadingStartTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

    if (remainingTime > 0) {
      minTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setShowSkeletonLoader(false);
        setLoadingStartTime(null);
      }, remainingTime);
    } else {
      setIsLoading(false);
      setShowSkeletonLoader(false);
      setLoadingStartTime(null);
    }
  }, [loadingStartTime, minLoadingTime]);

  // Set error state
  const setLoadingError = useCallback((errorMessage: string | Error) => {
    const error = typeof errorMessage === 'string' ? new Error(errorMessage) : errorMessage;
    setError(error);
    stopLoading();
  }, [stopLoading]);

  // Async operation wrapper
  const withLoading = useCallback(async <T>(asyncOperation: AsyncOperation<T>): Promise<T> => {
    try {
      startLoading();
      const result = await asyncOperation();
      stopLoading();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setLoadingError(errorMessage);
      throw err;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const loadingTimeoutId = loadingTimeoutRef.current;
    const minTimeoutId = minTimeoutRef.current;
    return () => {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
      if (minTimeoutId) {
        clearTimeout(minTimeoutId);
      }
    };
  }, []);

  return {
    isLoading,
    showSkeletonLoader,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
    skeletonProps: {
      type: skeletonType,
      count: skeletonCount
    }
  };
};

/**
 * Hook for managing multiple loading states (e.g., different data types)
 * @param {Array} stateKeys - Array of state keys to manage
 * @returns {Object} Multiple loading state management
 */
export const useMultipleLoadingStates = (stateKeys = []) => {
  const [loadingStates, setLoadingStates] = useState(
    stateKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const [errors, setErrors] = useState(
    stateKeys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
  );

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
    if (isLoading) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const setError = useCallback((key: string, error: string | Error) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setErrors(prev => ({ ...prev, [key]: errorMessage }));
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const withLoading = useCallback(async <T>(key: string, asyncOperation: AsyncOperation<T>): Promise<T> => {
    try {
      setLoading(key, true);
      const result = await asyncOperation();
      setLoading(key, false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(key, errorMessage);
      throw err;
    }
  }, [setLoading, setError]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const hasAnyError = Object.values(errors).some(Boolean);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    withLoading,
    isAnyLoading,
    hasAnyError,
    getLoadingState: (key: string) => loadingStates[key as keyof typeof loadingStates],
    getError: (key: string) => errors[key as keyof typeof errors]
  };
};

/**
 * Hook for progressive loading with skeleton states
 * @param {Array} loadingStages - Array of loading stage configurations
 * @returns {Object} Progressive loading state management
 */
export const useProgressiveLoading = (loadingStages = []) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [stageData, setStageData] = useState({});
  const [error, setError] = useState(null);

  const nextStage = useCallback(() => {
    if (currentStage < loadingStages.length - 1) {
      setCurrentStage(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentStage, loadingStages.length]);

  const setStageComplete = useCallback((stageIndex: number, data: any = null) => {
    if (data) {
      setStageData(prev => ({ ...prev, [stageIndex]: data }));
    }

    if (stageIndex === currentStage) {
      nextStage();
    }
  }, [currentStage, nextStage]);

  const reset = useCallback(() => {
    setCurrentStage(0);
    setIsComplete(false);
    setStageData({});
    setError(null);
  }, []);

  const currentStageConfig = loadingStages[currentStage] || {};
  const progress = loadingStages.length > 0 ? (currentStage / loadingStages.length) * 100 : 0;

  return {
    currentStage,
    currentStageConfig,
    isComplete,
    stageData,
    error,
    progress,
    nextStage,
    setStageComplete,
    setError,
    reset,
    isLoading: !isComplete && !error
  };
};

/**
 * Hook for optimistic loading states
 * @param {Function} updateFunction - Function to update optimistic state
 * @param {Function} rollbackFunction - Function to rollback on error
 * @returns {Object} Optimistic loading management
 */
export const useOptimisticLoading = (updateFunction: (value: any) => void, rollbackFunction: () => void) => {
  const [isOptimistic, setIsOptimistic] = useState<boolean>(false);
  const [optimisticData, setOptimisticData] = useState<any>(null);

  const performOptimisticUpdate = useCallback(async <T>(
    optimisticValue: any,
    asyncOperation: AsyncOperation<T>,
    options: OptimisticLoadingOptions = {}
  ): Promise<T> => {
    const { showLoading = false, onSuccess, onError } = options;

    try {
      setIsOptimistic(true);
      setOptimisticData(optimisticValue);

      // Apply optimistic update immediately
      if (updateFunction) {
        updateFunction(optimisticValue);
      }

      // Perform actual operation
      const result = await asyncOperation();

      // Success - update with real data
      if (updateFunction) {
        updateFunction(result);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      // Error - rollback optimistic changes
      if (rollbackFunction) {
        rollbackFunction();
      }

      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }

      throw error;
    } finally {
      setIsOptimistic(false);
      setOptimisticData(null);
    }
  }, [updateFunction, rollbackFunction]);

  return {
    isOptimistic,
    optimisticData,
    performOptimisticUpdate
  };
};

export default useLoadingState;
