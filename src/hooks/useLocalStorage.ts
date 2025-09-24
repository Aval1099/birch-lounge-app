// =============================================================================
// LOCAL STORAGE HOOK
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { LocalStorageOptions } from '../types/hooks';

/**
 * Custom hook for managing localStorage with error handling and type safety
 * @param key - localStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue, removeValue, error]
 */
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const [error, setError] = useState<Error | null>(null);

  // Update localStorage when value changes
  useEffect(() => {
    try {
      if (value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      setError(null);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      const err = error instanceof Error ? error : new Error('localStorage error');
      setError(err);
    }
  }, [key, value]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(defaultValue);
      setError(null);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      const err = error instanceof Error ? error : new Error('localStorage error');
      setError(err);
    }
  }, [key, defaultValue]);

  return [value, setValue, removeValue, error] as const;
};

/**
 * Hook for managing API keys in localStorage with validation
 * @param keyName - Name of the API key
 * @param validator - Optional validation function
 * @returns API key management object
 */
export const useApiKey = (keyName: string, validator: ((key: string) => boolean) | null = null) => {
  const [apiKey, setApiKey, removeApiKey, error] = useLocalStorage(`${keyName}-api-key`, '');
  const [isValid, setIsValid] = useState(false);

  // Validate API key when it changes
  useEffect(() => {
    if (validator && apiKey) {
      setIsValid(validator(apiKey));
    } else {
      setIsValid(Boolean(apiKey));
    }
  }, [apiKey, validator]);

  const updateApiKey = useCallback((newKey: string) => {
    const trimmedKey = newKey?.trim() || '';
    setApiKey(trimmedKey);
  }, [setApiKey]);

  return {
    apiKey,
    setApiKey: updateApiKey,
    removeApiKey,
    isValid,
    error
  };
};

/**
 * Hook for managing user preferences in localStorage
 * @param {Object} defaultPreferences - Default preferences object
 * @returns {Object} Preferences management object
 */
export const usePreferences = <T extends Record<string, any>>(defaultPreferences: T = {} as T) => {
  const [preferences, setPreferences, removePreferences, error] = useLocalStorage(
    'user-preferences',
    defaultPreferences
  );

  const updatePreference = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    removePreferences,
    error
  };
};
