import { createContext, useEffect, useMemo, useReducer, ReactNode } from 'react';

import { ActionType } from '../types/actions';
import { apiKeyService } from '../services/apiKeyService';
import { hybridStorageService } from '../services/hybridStorageService';
import { isSupabaseConfigured, onAuthStateChange } from '../services/supabaseClient';
import type { AppState, AppAction } from '../types';
import type { AuthEvent, AuthSession } from '../services/supabaseClient';

import { appReducer, initialAppState } from './appReducer';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

interface AppProviderProps {
  children: ReactNode;
  initialState?: AppState | null;
}

// Create the context
const AppContext = createContext<AppContextType | null>(null);

/**
 * App Context Provider component
 * Manages global application state and provides it to child components
 */
export const AppProvider = ({ children, initialState = null }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState || initialAppState);

  // Initialize hybrid storage and app on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize hybrid storage service
      await hybridStorageService.init();

      if (!initialState) {
        // First, initialize with localStorage data for immediate UI
        dispatch({ type: ActionType.INITIALIZE_APP });

        // Then, load hybrid data (which may include cloud data)
        try {
          const hybridData = await hybridStorageService.load();
          if (hybridData) {
            dispatch({
              type: ActionType.LOAD_HYBRID_DATA,
              payload: { data: hybridData }
            });
          }
        } catch (error) {
          console.warn('Failed to load hybrid data:', error);
        }
      }

      // Load API key securely using the API key service
      const secureApiKey = apiKeyService.getApiKey('gemini');
      if (secureApiKey) {
        dispatch({
          type: ActionType.SET_GEMINI_API_KEY,
          payload: secureApiKey
        });
      }
    };

    initializeApp();
  }, [initialState]);

  // Listen for auth state changes (Supabase)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsubscribe = onAuthStateChange(async (event: AuthEvent, session: AuthSession | null) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in, triggering sync...');
        // Trigger sync when user signs in
        await hybridStorageService.forceSync();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Could clear sensitive data here if needed
      }
    });

    return unsubscribe;
  }, []);

  // Auto-save state changes using hybrid storage
  useEffect(() => {
    const saveData = async () => {
      if (state.isInitialized) {
        const dataToSave = {
          recipes: state.recipes,
          ingredients: state.ingredients,
          techniques: state.techniques,
          theme: state.theme,
          savedMenus: state.savedMenus,
          savedBatches: state.savedBatches
        };

        // Use hybrid storage for automatic cloud sync
        await hybridStorageService.save(dataToSave);
      }
    };

    saveData();
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

// Hook lives in src/hooks/useApp.ts to avoid React Fast Refresh issues

export default AppContext;
