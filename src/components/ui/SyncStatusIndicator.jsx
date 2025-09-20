// =============================================================================
// SYNC STATUS INDICATOR COMPONENT
// =============================================================================

/* eslint-disable unused-imports/no-unused-imports */
import { AlertCircle, Check, Cloud, CloudOff, LogOut, RefreshCw, User, Wifi, WifiOff } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import { hybridStorageService } from '../../services/hybridStorageService';
import { getCurrentUser, isSupabaseConfigured, signOut } from '../../services/supabaseClient';

import Button from './Button';

/**
 * Sync Status Indicator Component
 * Shows current sync status and provides manual sync controls
 */
const SyncStatusIndicator = memo(({ onAuthClick, className = '' }) => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    isConfigured: false,
    queueLength: 0,
    syncInProgress: false
  });
  const [user, setUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Update sync status periodically
  useEffect(() => {
    const updateStatus = () => {
      if (isSupabaseConfigured()) {
        const status = hybridStorageService.getSyncStatus();
        setSyncStatus(status);
      }
    };

    // Initial update
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      if (isSupabaseConfigured()) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
    };

    fetchUser();
  }, []);

  const handleManualSync = async () => {
    try {
      await hybridStorageService.forceSync();
      // Status will be updated by the periodic check
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Don't render if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return (
      <div className={`flex items-center text-gray-500 dark:text-gray-400 ${className}`}>
        <CloudOff className="w-4 h-4 mr-1" />
        <span className="text-xs">Offline Only</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (syncStatus.syncInProgress) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    }

    if (!syncStatus.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    if (syncStatus.queueLength > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }

    if (user && syncStatus.isOnline) {
      return <Check className="w-4 h-4 text-green-500" />;
    }

    return <Cloud className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) {
      return 'Syncing...';
    }

    if (!syncStatus.isOnline) {
      return 'Offline';
    }

    if (!user) {
      return 'Not signed in';
    }

    if (syncStatus.queueLength > 0) {
      return `${syncStatus.queueLength} pending`;
    }

    return 'Synced';
  };

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) return 'text-blue-600 dark:text-blue-400';
    if (!syncStatus.isOnline) return 'text-red-600 dark:text-red-400';
    if (!user) return 'text-gray-600 dark:text-gray-400';
    if (syncStatus.queueLength > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 px-2 py-1"
      >
        {getStatusIcon()}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </Button>

      {/* Details Dropdown */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Connection:</span>
              <div className="flex items-center space-x-1">
                {syncStatus.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${syncStatus.isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* User Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Account:</span>
              <div className="flex items-center space-x-1">
                {user ? (
                  <>
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 truncate max-w-32">
                      {user.email}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400">Not signed in</span>
                )}
              </div>
            </div>

            {/* Sync Queue */}
            {syncStatus.queueLength > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending:</span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {syncStatus.queueLength} changes
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSync}
                    disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                    className="w-full text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
                    Sync Now
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAuthClick}
                  className="w-full text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SyncStatusIndicator.displayName = 'SyncStatusIndicator';

export default SyncStatusIndicator;
