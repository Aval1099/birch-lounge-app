import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { ActionType } from '../constants';
import { storageService } from '../services/storageService';
import { appReducer, initialAppState } from './appReducer';

// Create the context
const AppContext = createContext(null);

/**
 * App Context Provider component
 * Manages global application state and provides it to child components
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // Initialize app on mount
  useEffect(() => {
    dispatch({ type: ActionType.INITIALIZE_APP });
    
    // Load saved API key
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      dispatch({ 
        type: ActionType.SET_GEMINI_API_KEY, 
        payload: savedApiKey 
      });
    }
  }, []);

  // Auto-save state changes to localStorage
  useEffect(() => {
    if (state.isInitialized) {
      const dataToSave = {
        recipes: state.recipes,
        ingredients: state.ingredients,
        techniques: state.techniques,
        theme: state.theme,
        savedMenus: state.savedMenus,
        savedBatches: state.savedBatches
      };
      
      storageService.save(dataToSave);
    }
  }, [
    state.recipes,
    state.ingredients,
    state.techniques,
    state.theme,
    state.savedMenus,
    state.savedBatches,
    state.isInitialized
  ]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to access the app context
 * @returns {Object} Context value with state and dispatch
 */
export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
};

export default AppContext;
