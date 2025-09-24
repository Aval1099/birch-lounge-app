// =============================================================================
// OFFLINE MANAGER - Coordinates offline functionality
// =============================================================================

import type {
  OfflineManager,
  OfflineManagerConfig,
  ConnectionStatus,
  BackgroundSyncEvent,
  SyncQueueItem,
  ConflictResolutionResult,
  OfflineStorageStats,
  OfflineRecipe,
  OfflineIngredient,
  OfflineTechnique,
  OfflineMenu
} from '../types/offline';
import type { Recipe, Ingredient, Technique, Menu } from '../types';
import { offlineStorage } from './offlineStorageService';

/**
 * Default configuration for offline manager
 */
const DEFAULT_CONFIG: OfflineManagerConfig = {
  enableBackgroundSync: true,
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  conflictResolution: 'manual',
  cacheConfig: {
    maxRecipes: 1000,
    maxIngredients: 500,
    maxTechniques: 200,
    maxMenus: 100,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxTotalSize: 100 * 1024 * 1024, // 100MB
    autoDownload: false,
    downloadOnWifi: true
  }
};

/**
 * Offline Manager Implementation
 * Coordinates all offline functionality including sync, caching, and conflict resolution
 */
class OfflineManagerImpl implements OfflineManager {
  private config: OfflineManagerConfig;
  private connectionStatus: ConnectionStatus = 'online';
  private syncInterval: NodeJS.Timeout | null = null;
  private eventListeners: Array<(event: BackgroundSyncEvent) => void> = [];
  private isInitialized = false;

  constructor(config: Partial<OfflineManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeConnectionMonitoring();
  }

  /**
   * Initialize the offline manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await offlineStorage.initialize();
      this.startBackgroundSync();
      this.isInitialized = true;
      
      this.emitEvent({
        type: 'sync-start',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
      throw error;
    }
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.connectionStatus = 'online';
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.connectionStatus = 'offline';
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionStatus = () => {
        if (!navigator.onLine) {
          this.connectionStatus = 'offline';
        } else if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          this.connectionStatus = 'slow';
        } else {
          this.connectionStatus = 'online';
        }
      };

      connection.addEventListener('change', updateConnectionStatus);
      updateConnectionStatus();
    } else {
      this.connectionStatus = navigator.onLine ? 'online' : 'offline';
    }
  }

  /**
   * Start background sync process
   */
  private startBackgroundSync(): void {
    if (!this.config.enableBackgroundSync || this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (this.isOnline()) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop background sync process
   */
  private stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: BackgroundSyncEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // =============================================================================
  // CONNECTION MANAGEMENT
  // =============================================================================

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isOnline(): boolean {
    return this.connectionStatus === 'online';
  }

  // =============================================================================
  // DATA CACHING
  // =============================================================================

  async cacheRecipe(recipe: Recipe): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.cacheRecipe(recipe, 'synced');
  }

  async cacheIngredient(ingredient: Ingredient): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.cacheIngredient(ingredient, 'synced');
  }

  async cacheTechnique(technique: Technique): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.cacheTechnique(technique, 'synced');
  }

  async cacheMenu(menu: Menu): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.cacheMenu(menu, 'synced');
  }

  // =============================================================================
  // DATA RETRIEVAL
  // =============================================================================

  async getCachedRecipes(): Promise<OfflineRecipe[]> {
    await this.ensureInitialized();
    return offlineStorage.getCachedRecipes();
  }

  async getCachedIngredients(): Promise<OfflineIngredient[]> {
    await this.ensureInitialized();
    return offlineStorage.getCachedIngredients();
  }

  async getCachedTechniques(): Promise<OfflineTechnique[]> {
    await this.ensureInitialized();
    return offlineStorage.getCachedTechniques();
  }

  async getCachedMenus(): Promise<OfflineMenu[]> {
    await this.ensureInitialized();
    return offlineStorage.getCachedMenus();
  }

  // =============================================================================
  // SYNC MANAGEMENT
  // =============================================================================

  async queueSync(item: SyncQueueItem): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.addToSyncQueue(item);
    
    // Try to sync immediately if online
    if (this.isOnline()) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline()) return;

    try {
      const queue = await offlineStorage.getSyncQueue();
      if (queue.length === 0) return;

      this.emitEvent({
        type: 'sync-start',
        data: { queueLength: queue.length },
        timestamp: Date.now()
      });

      let processed = 0;
      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          processed++;
          
          this.emitEvent({
            type: 'sync-progress',
            progress: (processed / queue.length) * 100,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          
          // Update retry count
          item.retryCount++;
          item.lastError = error instanceof Error ? error.message : 'Unknown error';
          
          if (item.retryCount >= this.config.maxRetries) {
            this.emitEvent({
              type: 'sync-error',
              data: { item, error: item.lastError },
              timestamp: Date.now()
            });
            await offlineStorage.removeFromSyncQueue(item.id);
          } else {
            await offlineStorage.addToSyncQueue(item);
          }
        }
      }

      this.emitEvent({
        type: 'sync-complete',
        data: { processed, total: queue.length },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.emitEvent({
        type: 'sync-error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with your actual API service
    // For now, we'll simulate the sync operation
    
    switch (item.operation) {
      case 'create':
        // Call API to create item
        console.log('Syncing create operation:', item);
        break;
      case 'update':
        // Call API to update item
        console.log('Syncing update operation:', item);
        break;
      case 'delete':
        // Call API to delete item
        console.log('Syncing delete operation:', item);
        break;
    }

    // Update local item sync status
    switch (item.type) {
      case 'recipe':
        await offlineStorage.updateRecipeSyncStatus(item.data.id, 'synced');
        break;
      // Add other types as needed
    }
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();
    return offlineStorage.getSyncQueue();
  }

  async clearSyncQueue(): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.clearSyncQueue();
  }

  // =============================================================================
  // CONFLICT RESOLUTION
  // =============================================================================

  async resolveConflict(itemId: string, resolution: ConflictResolutionResult): Promise<void> {
    // Implementation would depend on your specific conflict resolution strategy
    console.log('Resolving conflict for item:', itemId, resolution);
  }

  async getConflicts(): Promise<Array<{ id: string; type: string; local: any; server: any }>> {
    // Implementation would return items with conflict status
    return [];
  }

  // =============================================================================
  // STORAGE MANAGEMENT
  // =============================================================================

  async getStorageStats(): Promise<OfflineStorageStats> {
    await this.ensureInitialized();
    return offlineStorage.getStorageStats();
  }

  async clearCache(): Promise<void> {
    await this.ensureInitialized();
    await offlineStorage.clearAllData();
  }

  async optimizeStorage(): Promise<void> {
    // Implementation would clean up old/unused cached data
    console.log('Optimizing storage...');
  }

  // =============================================================================
  // EVENT HANDLING
  // =============================================================================

  subscribe(callback: (event: BackgroundSyncEvent) => void): () => void {
    this.eventListeners.push(callback);
    
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopBackgroundSync();
    this.eventListeners = [];
    offlineStorage.close();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const offlineManager = new OfflineManagerImpl();
