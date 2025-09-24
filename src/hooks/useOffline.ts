// =============================================================================
// OFFLINE HOOKS - React hooks for offline functionality
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import type {
  ConnectionStatus,
  BackgroundSyncEvent,
  OfflineStorageStats,
  SyncQueueItem,
  OfflineRecipe
} from '../types/offline';
import { offlineManager } from '../services/offlineManager';

/**
 * Hook for monitoring connection status
 */
export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => {
      const status = offlineManager.getConnectionStatus();
      setConnectionStatus(status);
      setIsOnline(offlineManager.isOnline());
    };

    // Initial status
    updateStatus();

    // Listen for connection changes
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { connectionStatus, isOnline };
};

/**
 * Hook for background sync events and status
 */
export const useBackgroundSync = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe((event: BackgroundSyncEvent) => {
      switch (event.type) {
        case 'sync-start':
          setSyncStatus('syncing');
          setSyncProgress(0);
          setLastSyncError(null);
          break;
        case 'sync-progress':
          setSyncProgress(event.progress || 0);
          break;
        case 'sync-complete':
          setSyncStatus('idle');
          setSyncProgress(100);
          loadSyncQueue();
          break;
        case 'sync-error':
          setSyncStatus('error');
          setLastSyncError(event.error || 'Unknown sync error');
          break;
      }
    });

    const loadSyncQueue = async () => {
      try {
        const queue = await offlineManager.getSyncQueue();
        setSyncQueue(queue);
      } catch (error) {
        console.error('Failed to load sync queue:', error);
      }
    };

    loadSyncQueue();

    return unsubscribe;
  }, []);

  const forcSync = useCallback(async () => {
    try {
      await offlineManager.processSyncQueue();
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  }, []);

  const clearQueue = useCallback(async () => {
    try {
      await offlineManager.clearSyncQueue();
      setSyncQueue([]);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }, []);

  return {
    syncStatus,
    syncProgress,
    syncQueue,
    lastSyncError,
    forcSync,
    clearQueue
  };
};

/**
 * Hook for offline storage statistics
 */
export const useOfflineStorage = () => {
  const [stats, setStats] = useState<OfflineStorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const storageStats = await offlineManager.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const clearCache = useCallback(async () => {
    try {
      await offlineManager.clearCache();
      await loadStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [loadStats]);

  const optimizeStorage = useCallback(async () => {
    try {
      await offlineManager.optimizeStorage();
      await loadStats();
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    }
  }, [loadStats]);

  return {
    stats,
    loading,
    loadStats,
    clearCache,
    optimizeStorage
  };
};

/**
 * Hook for offline recipe management
 */
export const useOfflineRecipes = () => {
  const [recipes, setRecipes] = useState<OfflineRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const cachedRecipes = await offlineManager.getCachedRecipes();
      setRecipes(cachedRecipes);
    } catch (error) {
      console.error('Failed to load cached recipes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const cacheRecipe = useCallback(async (recipe: any) => {
    try {
      await offlineManager.cacheRecipe(recipe);
      await loadRecipes();
    } catch (error) {
      console.error('Failed to cache recipe:', error);
    }
  }, [loadRecipes]);

  return {
    recipes,
    loading,
    loadRecipes,
    cacheRecipe
  };
};

/**
 * Hook for PWA installation
 */
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const userChoice = await installPrompt.userChoice;

      if (userChoice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    install
  };
};

/**
 * Hook for service worker updates
 */
export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  }, [registration]);

  return {
    updateAvailable,
    applyUpdate
  };
};

/**
 * Combined offline hook that provides all offline functionality
 */
export const useOffline = () => {
  const connectionStatus = useConnectionStatus();
  const backgroundSync = useBackgroundSync();
  const storage = useOfflineStorage();
  const recipes = useOfflineRecipes();
  const pwaInstall = usePWAInstall();
  const serviceWorkerUpdate = useServiceWorkerUpdate();

  return {
    ...connectionStatus,
    ...backgroundSync,
    storage,
    recipes,
    pwa: pwaInstall,
    serviceWorker: serviceWorkerUpdate
  };
};
