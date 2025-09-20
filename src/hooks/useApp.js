/**
 * App Context Hook
 * Separated from AppContext component to avoid React Fast Refresh issues
 */

import { useContext } from 'react';

import AppContext from '../context/AppContext';

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

export default useApp;
