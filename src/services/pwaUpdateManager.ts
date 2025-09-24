// =============================================================================
// PWA UPDATE MANAGER - Advanced update handling with seamless transitions
// =============================================================================

/**
 * Update notification types
 */
export type UpdateNotificationType = 'available' | 'ready' | 'error' | 'checking' | 'no-update';

/**
 * Update strategy options
 */
export type UpdateStrategy = 'immediate' | 'on-idle' | 'on-reload' | 'manual' | 'background';

/**
 * Update event data
 */
export interface UpdateEvent {
  type: UpdateNotificationType;
  registration?: ServiceWorkerRegistration;
  error?: Error;
  version?: string;
  size?: number;
  features?: string[];
  timestamp: number;
}

/**
 * Update configuration
 */
interface UpdateConfig {
  strategy: UpdateStrategy;
  checkInterval: number; // in milliseconds
  autoApply: boolean;
  notifyUser: boolean;
  backgroundDownload: boolean;
  rollbackEnabled: boolean;
  maxRetries: number;
}

/**
 * Version information
 */
interface VersionInfo {
  current: string;
  available?: string;
  changelog?: string[];
  releaseNotes?: string;
  size?: number;
  critical?: boolean;
  features?: string[];
}

/**
 * Advanced PWA Update Manager
 * Handles service worker updates with intelligent strategies and user experience optimization
 */
class PWAUpdateManager {
  private registration: ServiceWorkerRegistration | null = null;
  private eventListeners: Array<(event: UpdateEvent) => void> = [];
  private config: UpdateConfig = {
    strategy: 'on-idle',
    checkInterval: 60000, // 1 minute
    autoApply: false,
    notifyUser: true,
    backgroundDownload: true,
    rollbackEnabled: true,
    maxRetries: 3
  };
  private checkInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private retryCount = 0;
  private versionInfo: VersionInfo = { current: '1.0.0' };

  constructor(config?: Partial<UpdateConfig>) {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  /**
   * Initialize the update manager
   */
  private async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Register service worker if not already registered
        this.registration = await navigator.serviceWorker.ready;

        // Set up event listeners
        this.setupEventListeners();

        // Start periodic update checks
        this.startPeriodicChecks();

        // Check for immediate updates
        await this.checkForUpdates();

        console.log('PWA Update Manager initialized');
      } catch (error) {
        console.error('Failed to initialize PWA Update Manager:', error);
        this.emitEvent({
          type: 'error',
          error: error instanceof Error ? error : new Error('Initialization failed'),
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Set up service worker event listeners
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for new service worker installations
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        this.handleNewWorker(newWorker);
      }
    });

    // Listen for controller changes (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.handleControllerChange();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Handle new service worker installation
   */
  private handleNewWorker(worker: ServiceWorker): void {
    this.emitEvent({
      type: 'available',
      timestamp: Date.now()
    });

    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is installed and ready
        this.emitEvent({
          type: 'ready',
          timestamp: Date.now()
        });

        // Apply update based on strategy
        this.handleUpdateStrategy();
      }
    });
  }

  /**
   * Handle controller change (new SW activated)
   */
  private handleControllerChange(): void {
    if (this.config.strategy === 'immediate') {
      // Reload immediately for immediate strategy
      window.location.reload();
    } else {
      // Notify that update is complete
      this.emitEvent({
        type: 'ready',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'UPDATE_AVAILABLE':
        this.versionInfo.available = data.version;
        this.versionInfo.size = data.size;
        this.versionInfo.features = data.features;
        this.emitEvent({
          type: 'available',
          version: data.version,
          size: data.size,
          features: data.features,
          timestamp: Date.now()
        });
        break;

      case 'UPDATE_DOWNLOADED':
        this.emitEvent({
          type: 'ready',
          timestamp: Date.now()
        });
        break;

      case 'UPDATE_ERROR':
        this.emitEvent({
          type: 'error',
          error: new Error(data.message),
          timestamp: Date.now()
        });
        break;
    }
  }

  /**
   * Handle update strategy
   */
  private async handleUpdateStrategy(): Promise<void> {
    switch (this.config.strategy) {
      case 'immediate':
        await this.applyUpdate();
        break;
      case 'on-idle':
        this.scheduleIdleUpdate();
        break;
      case 'on-reload':
        // Wait for user to reload
        break;
      case 'background':
        await this.backgroundUpdate();
        break;
      case 'manual':
        // Wait for manual trigger
        break;
    }
  }

  /**
   * Schedule update during idle time
   */
  private scheduleIdleUpdate(): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.applyUpdate();
      }, { timeout: 30000 }); // 30 second timeout
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.applyUpdate();
      }, 5000);
    }
  }

  /**
   * Perform background update
   */
  private async backgroundUpdate(): Promise<void> {
    try {
      // Download update in background
      if (this.config.backgroundDownload) {
        await this.downloadUpdate();
      }

      // Apply update when appropriate
      if (this.config.autoApply) {
        await this.applyUpdate();
      }
    } catch (error) {
      console.error('Background update failed:', error);
    }
  }

  /**
   * Download update without applying
   */
  private async downloadUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;

    // Trigger download by messaging the service worker
    this.registration.waiting.postMessage({ type: 'DOWNLOAD_UPDATE' });
  }

  /**
   * Start periodic update checks
   */
  private startPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.config.checkInterval);
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration || this.isUpdating) {
      return false;
    }

    try {
      this.emitEvent({
        type: 'checking',
        timestamp: Date.now()
      });

      // Trigger update check
      await this.registration.update();

      // Check if there's a waiting service worker
      if (this.registration.waiting) {
        this.emitEvent({
          type: 'ready',
          timestamp: Date.now()
        });
        return true;
      }

      // Check if there's an installing service worker
      if (this.registration.installing) {
        this.emitEvent({
          type: 'available',
          timestamp: Date.now()
        });
        return true;
      }

      this.emitEvent({
        type: 'no-update',
        timestamp: Date.now()
      });
      return false;
    } catch (error) {
      console.error('Update check failed:', error);
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error('Update check failed'),
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Apply pending update
   */
  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting || this.isUpdating) {
      return;
    }

    this.isUpdating = true;

    try {
      // Create backup point for rollback
      if (this.config.rollbackEnabled) {
        await this.createBackupPoint();
      }

      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // The controllerchange event will handle the reload
    } catch (error) {
      console.error('Failed to apply update:', error);
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error('Update application failed'),
        timestamp: Date.now()
      });

      // Attempt rollback if enabled
      if (this.config.rollbackEnabled) {
        await this.rollback();
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Create backup point for rollback
   */
  private async createBackupPoint(): Promise<void> {
    try {
      const backupData = {
        version: this.versionInfo.current,
        timestamp: Date.now(),
        userData: await this.exportUserData()
      };

      localStorage.setItem('pwa_backup', JSON.stringify(backupData));
    } catch (error) {
      console.error('Failed to create backup point:', error);
    }
  }

  /**
   * Export user data for backup
   */
  private async exportUserData(): Promise<any> {
    // This would export critical user data
    // Implementation depends on your app's data structure
    return {
      preferences: localStorage.getItem('user_preferences'),
      settings: localStorage.getItem('app_settings')
    };
  }

  /**
   * Rollback to previous version
   */
  private async rollback(): Promise<void> {
    try {
      const backupData = localStorage.getItem('pwa_backup');
      if (backupData) {
        const backup = JSON.parse(backupData);

        // Restore user data
        await this.restoreUserData(backup.userData);

        // Clear current cache and force reload
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // Unregister current service worker
        if (this.registration) {
          await this.registration.unregister();
        }

        // Force reload to previous version
        window.location.reload();
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  /**
   * Restore user data from backup
   */
  private async restoreUserData(userData: any): Promise<void> {
    if (userData.preferences) {
      localStorage.setItem('user_preferences', userData.preferences);
    }
    if (userData.settings) {
      localStorage.setItem('app_settings', userData.settings);
    }
  }

  /**
   * Get current version information
   */
  getVersionInfo(): VersionInfo {
    return { ...this.versionInfo };
  }

  /**
   * Get update configuration
   */
  getConfig(): UpdateConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart periodic checks if interval changed
    if (newConfig.checkInterval) {
      this.startPeriodicChecks();
    }
  }

  /**
   * Force immediate update check
   */
  async forceUpdate(): Promise<void> {
    const hasUpdate = await this.checkForUpdates();
    if (hasUpdate) {
      await this.applyUpdate();
    }
  }

  /**
   * Skip waiting and apply update immediately
   */
  async skipWaiting(): Promise<void> {
    await this.applyUpdate();
  }

  /**
   * Dismiss current update
   */
  dismissUpdate(): void {
    // Mark update as dismissed for this session
    sessionStorage.setItem('update_dismissed', 'true');
  }

  /**
   * Check if update was dismissed
   */
  isUpdateDismissed(): boolean {
    return sessionStorage.getItem('update_dismissed') === 'true';
  }

  /**
   * Get update status
   */
  getUpdateStatus(): {
    hasUpdate: boolean;
    isReady: boolean;
    isUpdating: boolean;
    version?: string;
  } {
    return {
      hasUpdate: !!this.registration?.waiting || !!this.registration?.installing,
      isReady: !!this.registration?.waiting,
      isUpdating: this.isUpdating,
      version: this.versionInfo.available
    };
  }

  /**
   * Subscribe to update events
   */
  subscribe(callback: (event: UpdateEvent) => void): () => void {
    this.eventListeners.push(callback);

    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: UpdateEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in update event listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.eventListeners = [];
    this.registration = null;
  }
}

// Export singleton instance
export const pwaUpdateManager = new PWAUpdateManager();
