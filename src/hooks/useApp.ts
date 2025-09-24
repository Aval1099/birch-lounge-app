/**
 * App Context Hook
 * Separated from AppContext component to avoid React Fast Refresh issues
 */

import { useContext } from 'react';

import AppContext from '../context/AppContext';
import type { AppState, AppAction } from '../types';

// Properly typed app context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * Hook to access the app context
 * @returns Context value with state and dispatch
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context as AppContextType;
};

export default useApp;
