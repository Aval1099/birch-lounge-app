import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for managing loading states with skeleton loading support
 * @param {Object} options - Configuration options
 * @returns {Object} Loading state management
 */
export const useLoadingState = (options = {}) => {
  const {
    initialLoading = false,
    minLoadingTime = 500, // Minimum time to show loading state (prevents flashing)
    showSkeleton = true,
    skeletonType = 'default',
    skeletonCount = 3
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [showSkeletonLoader, setShowSkeletonLoader] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(null);

  const loadingTimeoutRef = useRef(null);
  const minTimeoutRef = useRef(null);

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
  const setLoadingError = useCallback((errorMessage) => {
    setError(errorMessage);
    stopLoading();
  }, [stopLoading]);

  // Async operation wrapper
  const withLoading = useCallback(async (asyncOperation) => {
    try {
      startLoading();
      const result = await asyncOperation();
      stopLoading();
      return result;
    } catch (err) {
      setLoadingError(err.message || 'An error occurred');
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

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
    if (isLoading) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const withLoading = useCallback(async (key, asyncOperation) => {
    try {
      setLoading(key, true);
      const result = await asyncOperation();
      setLoading(key, false);
      return result;
    } catch (err) {
      setError(key, err.message || 'An error occurred');
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
    getLoadingState: (key) => loadingStates[key],
    getError: (key) => errors[key]
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

  const setStageComplete = useCallback((stageIndex, data = null) => {
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
export const useOptimisticLoading = (updateFunction, rollbackFunction) => {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [optimisticData, setOptimisticData] = useState(null);

  const performOptimisticUpdate = useCallback(async (
    optimisticValue,
    asyncOperation,
    options = {}
  ) => {
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
        onError(error);
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
