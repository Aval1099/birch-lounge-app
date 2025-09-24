import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  SignalLow,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import Button from '../ui/Button';
import type { OfflineIndicatorProps } from '../../types/offline';

/**
 * Offline Indicator Component
 * Shows connection status and sync information
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = false,
  showSyncStatus = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const {
    connectionStatus,
    isOnline,
    syncStatus,
    syncProgress,
    syncQueue,
    lastSyncError,
    forcSync
  } = useOffline();

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'slow':
        return <SignalLow className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wifi className="w-4 h-4 text-green-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'offline':
        return 'Offline';
      case 'slow':
        return 'Slow Connection';
      default:
        return 'Online';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'offline':
        return 'text-red-600 dark:text-red-400';
      case 'slow':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getSyncIcon = () => {
    if (syncStatus === 'syncing') {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (syncStatus === 'error' || lastSyncError) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (syncQueue.length > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getSyncText = () => {
    if (syncStatus === 'syncing') {
      return `Syncing... ${Math.round(syncProgress)}%`;
    }
    if (syncStatus === 'error' || lastSyncError) {
      return 'Sync Error';
    }
    if (syncQueue.length > 0) {
      return `${syncQueue.length} pending`;
    }
    return 'Synced';
  };

  const getSyncColor = () => {
    if (syncStatus === 'syncing') {
      return 'text-blue-600 dark:text-blue-400';
    }
    if (syncStatus === 'error' || lastSyncError) {
      return 'text-red-600 dark:text-red-400';
    }
    if (syncQueue.length > 0) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  if (!showDetails && !showSyncStatus) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {getConnectionIcon()}
        {showSyncStatus && getSyncIcon()}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Compact View */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {getConnectionIcon()}
          <span className={`text-xs font-medium ${getConnectionColor()}`}>
            {getConnectionText()}
          </span>
        </div>

        {showSyncStatus && (
          <div className="flex items-center gap-1">
            {getSyncIcon()}
            <span className={`text-xs ${getSyncColor()}`}>
              {getSyncText()}
            </span>
          </div>
        )}

        {showDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-1"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && showDetails && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {/* Connection Details */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Connection
              </span>
              <div className="flex items-center gap-1">
                {getConnectionIcon()}
                <span className={`text-sm ${getConnectionColor()}`}>
                  {getConnectionText()}
                </span>
              </div>
            </div>

            {/* Sync Details */}
            {showSyncStatus && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sync Status
                  </span>
                  <div className="flex items-center gap-1">
                    {getSyncIcon()}
                    <span className={`text-sm ${getSyncColor()}`}>
                      {getSyncText()}
                    </span>
                  </div>
                </div>

                {/* Sync Progress */}
                {syncStatus === 'syncing' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Progress</span>
                      <span>{Math.round(syncProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sync Queue */}
                {syncQueue.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Pending Items
                    </span>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {syncQueue.length}
                    </span>
                  </div>
                )}

                {/* Sync Error */}
                {lastSyncError && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Sync Error
                      </span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {lastSyncError}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {isOnline && syncQueue.length > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={forcSync}
                      disabled={syncStatus === 'syncing'}
                      className="text-xs"
                    >
                      {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
