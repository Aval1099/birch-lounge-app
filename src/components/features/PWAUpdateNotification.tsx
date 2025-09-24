import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  Star,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { pwaUpdateManager, type UpdateEvent } from '../../services/pwaUpdateManager';
import Button from '../ui/Button';

/**
 * Enhanced PWA Update Notification Component
 * Provides rich update notifications with detailed information and smooth UX
 */
export const PWAUpdateNotification: React.FC = () => {
  const [updateEvent, setUpdateEvent] = useState<UpdateEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [_showDetails] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = pwaUpdateManager.subscribe((event) => {
      setUpdateEvent(event);

      switch (event.type) {
        case 'available':
        case 'ready':
          setIsVisible(true);
          break;
        case 'error':
          setIsVisible(true);
          setIsUpdating(false);
          break;
        case 'checking':
          // Don't show notification for checking
          break;
        case 'no-update':
          setIsVisible(false);
          break;
      }
    });

    return unsubscribe;
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await pwaUpdateManager.skipWaiting();
      setUpdateProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        setIsVisible(false);
        setIsUpdating(false);
        clearInterval(progressInterval);
      }, 1000);
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      clearInterval(progressInterval);
    }
  };

  const handleDismiss = () => {
    pwaUpdateManager.dismissUpdate();
    setIsVisible(false);
  };

  const handleLater = () => {
    setIsVisible(false);
    // Will show again on next check
  };

  const getUpdateIcon = () => {
    if (!updateEvent) return <Download className="w-5 h-5" />;

    switch (updateEvent.type) {
      case 'available':
        return <Download className="w-5 h-5 text-blue-600" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const getUpdateTitle = () => {
    if (!updateEvent) return 'Update Available';

    switch (updateEvent.type) {
      case 'available':
        return 'New Version Available';
      case 'ready':
        return 'Update Ready to Install';
      case 'error':
        return 'Update Failed';
      case 'checking':
        return 'Checking for Updates...';
      default:
        return 'Update Available';
    }
  };

  const getUpdateMessage = () => {
    if (!updateEvent) return 'A new version of the app is available.';

    switch (updateEvent.type) {
      case 'available':
        return 'A new version with improvements and bug fixes is available for download.';
      case 'ready':
        return 'The update has been downloaded and is ready to install. The app will restart briefly.';
      case 'error':
        return 'There was an error updating the app. Please try again or check your connection.';
      case 'checking':
        return 'Checking for the latest version...';
      default:
        return 'A new version of the app is available.';
    }
  };

  const getUpdateFeatures = () => {
    if (!updateEvent?.features) return [];

    return updateEvent.features.slice(0, 3); // Show max 3 features
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isVisible || !updateEvent) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getUpdateIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {getUpdateTitle()}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="p-1 -mr-1"
                  icon={X}
                />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getUpdateMessage()}
              </p>

              {/* Version and Size Info */}
              {(updateEvent.version || updateEvent.size) && (
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {updateEvent.version && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      v{updateEvent.version}
                    </span>
                  )}
                  {updateEvent.size && (
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {formatSize(updateEvent.size)}
                    </span>
                  )}
                </div>
              )}

              {/* Features Preview */}
              {getUpdateFeatures().length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    What's New:
                  </div>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    {getUpdateFeatures().map((feature, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-yellow-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Update Progress */}
              {isUpdating && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Installing update...</span>
                    <span>{updateProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${updateProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {(updateEvent.features && updateEvent.features.length > 3) && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between p-3 text-xs"
              icon={isExpanded ? ChevronUp : ChevronDown}
            >
              {isExpanded ? 'Show Less' : `Show All ${updateEvent.features.length} Features`}
            </Button>

            {isExpanded && (
              <div className="px-4 pb-3">
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {updateEvent.features.slice(3).map((feature, index) => (
                    <li key={index + 3} className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {updateEvent.type !== 'checking' && updateEvent.type !== 'error' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2">
              {updateEvent.type === 'ready' ? (
                <>
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={isUpdating ? RefreshCw : Zap}
                  >
                    {isUpdating ? 'Installing...' : 'Install Now'}
                  </Button>
                  <Button
                    onClick={handleLater}
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                  >
                    Later
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={Download}
                  >
                    Download
                  </Button>
                  <Button
                    onClick={handleLater}
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                  >
                    Later
                  </Button>
                </>
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {navigator.onLine ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-500" />
                  <span>Offline - Update will start when connected</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Actions */}
        {updateEvent.type === 'error' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2">
              <Button
                onClick={() => pwaUpdateManager.forceUpdate()}
                variant="primary"
                size="sm"
                className="flex-1"
                icon={RefreshCw}
              >
                Retry
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Update Benefits */}
        {updateEvent.type === 'available' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Shield className="w-3 h-3" />
              <span>Includes security improvements and performance enhancements</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
