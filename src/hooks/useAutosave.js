// =============================================================================
// AUTOSAVE HOOK
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedCallback } from './useDebounce';

/**
 * Hook for automatic saving with visual feedback
 * @param {Object} data - Data to autosave
 * @param {Function} saveFunction - Function to call for saving
 * @param {Object} options - Configuration options
 * @returns {Object} Autosave state and controls
 */
export const useAutosave = (data, saveFunction, options = {}) => {
  const {
    delay = 30000, // 30 seconds default
    enabled = true,
    skipInitial = true,
    onSaveStart = null,
    onSaveSuccess = null,
    onSaveError = null
  } = options;

  const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState(null);
  
  const initialDataRef = useRef(data);
  const isInitialRender = useRef(true);
  const saveTimeoutRef = useRef(null);

  // Check if data has changed from initial state
  const hasChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
  }, [data]);

  // Update unsaved changes status
  useEffect(() => {
    if (isInitialRender.current && skipInitial) {
      isInitialRender.current = false;
      return;
    }
    
    setHasUnsavedChanges(hasChanges());
  }, [data, hasChanges, skipInitial]);

  // Autosave function with error handling
  const performAutosave = useCallback(async (force = false) => {
    if (!enabled || (!hasUnsavedChanges && !force)) return;

    try {
      setAutosaveStatus('saving');
      setError(null);

      if (onSaveStart) onSaveStart();

      await saveFunction(data);

      setAutosaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      initialDataRef.current = data;

      if (onSaveSuccess) onSaveSuccess();

      // Reset status after 3 seconds
      setTimeout(() => {
        setAutosaveStatus('idle');
      }, 3000);

    } catch (err) {
      console.error('Autosave failed:', err);
      setAutosaveStatus('error');
      setError(err);

      if (onSaveError) onSaveError(err);

      // Reset error status after 5 seconds
      setTimeout(() => {
        setAutosaveStatus('idle');
        setError(null);
      }, 5000);
    }
  }, [data, enabled, hasUnsavedChanges, saveFunction, onSaveStart, onSaveSuccess, onSaveError]);

  // Debounced autosave to prevent excessive saves
  const debouncedAutosave = useDebouncedCallback(performAutosave, delay);

  // Trigger autosave when data changes
  useEffect(() => {
    if (hasUnsavedChanges && enabled) {
      debouncedAutosave();
    }
  }, [hasUnsavedChanges, enabled, debouncedAutosave]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (enabled) {
      await performAutosave(true); // Force save even without changes
    }
  }, [enabled, performAutosave]);

  // Force save without debounce
  const forceSave = useCallback(async () => {
    if (!enabled) return;
    await performAutosave(true); // Force save even without changes
  }, [enabled, performAutosave]);

  // Reset autosave state
  const resetAutosave = useCallback(() => {
    setAutosaveStatus('idle');
    setLastSaved(null);
    setHasUnsavedChanges(false);
    setError(null);
    initialDataRef.current = data;
    isInitialRender.current = true;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    autosaveStatus,
    lastSaved,
    hasUnsavedChanges,
    error,
    saveNow,
    forceSave,
    resetAutosave,
    isAutosaveEnabled: enabled
  };
};

/**
 * Hook for recipe draft autosave specifically
 * @param {Object} recipeData - Recipe form data
 * @param {string} recipeId - Recipe ID for draft key
 * @param {Object} options - Configuration options
 * @returns {Object} Recipe autosave state and controls
 */
export const useRecipeAutosave = (recipeData, recipeId, options = {}) => {
  const draftKey = `recipe-draft-${recipeId}`;
  
  // Save draft to localStorage
  const saveDraft = useCallback(async (data) => {
    const draft = {
      ...data,
      lastModified: Date.now(),
      isDraft: true
    };
    
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draftKey]);

  // Load existing draft
  const loadDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load recipe draft:', error);
      return null;
    }
  }, [draftKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    return Boolean(localStorage.getItem(draftKey));
  }, [draftKey]);

  const autosave = useAutosave(recipeData, saveDraft, {
    delay: 30000, // 30 seconds
    ...options
  });

  return {
    ...autosave,
    loadDraft,
    clearDraft,
    hasDraft,
    draftKey
  };
};
