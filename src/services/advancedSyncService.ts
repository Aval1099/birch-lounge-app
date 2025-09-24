// =============================================================================
// ADVANCED BACKGROUND SYNC SERVICE
// =============================================================================

import type {
  SyncQueueItem,
  ConflictResolution,
  BackgroundSyncEvent
} from '../types/offline';
import { offlineStorage } from './offlineStorageService';

/**
 * Advanced sync strategies
 */
export type SyncStrategy = 'immediate' | 'batch' | 'scheduled' | 'adaptive';

/**
 * Sync priority levels
 */
export type SyncPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Enhanced sync queue item with advanced metadata
 */
export interface AdvancedSyncItem extends SyncQueueItem {
  priority: SyncPriority;
  strategy: SyncStrategy;
  dependencies: string[];
  estimatedSize: number;
  networkRequirement: 'any' | 'wifi' | 'fast';
  maxRetries: number;
  backoffMultiplier: number;
  scheduledFor?: number; // timestamp
  conflictResolution: ConflictResolution;
}

/**
 * Sync batch for optimized network usage
 */
interface SyncBatch {
  id: string;
  items: AdvancedSyncItem[];
  totalSize: number;
  priority: SyncPriority;
  estimatedDuration: number;
}

/**
 * Network condition assessment
 */
interface NetworkCondition {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  speed: 'slow' | 'medium' | 'fast';
  stability: 'poor' | 'good' | 'excellent';
  cost: 'free' | 'metered' | 'expensive';
}

/**
 * Advanced Background Sync Service
 * Provides intelligent sync strategies, conflict resolution, and network optimization
 */
class AdvancedSyncService {
  private syncQueue: Map<string, AdvancedSyncItem> = new Map();
  private activeBatches: Map<string, SyncBatch> = new Map();
  private eventListeners: Array<(event: BackgroundSyncEvent) => void> = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private networkCondition: NetworkCondition = {
    type: 'unknown',
    speed: 'medium',
    stability: 'good',
    cost: 'free'
  };

  constructor() {
    this.initializeNetworkMonitoring();
    this.startAdaptiveSync();
  }

  /**
   * Initialize network condition monitoring
   */
  private initializeNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateNetworkCondition = () => {
        // Assess connection type
        this.networkCondition.type = connection.type || 'unknown';

        // Assess speed based on effective type
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            this.networkCondition.speed = 'slow';
            break;
          case '3g':
            this.networkCondition.speed = 'medium';
            break;
          case '4g':
          case '5g':
            this.networkCondition.speed = 'fast';
            break;
          default:
            this.networkCondition.speed = 'medium';
        }

        // Assess cost (simplified logic)
        this.networkCondition.cost = connection.type === 'wifi' ? 'free' : 'metered';

        // Assess stability based on RTT
        this.networkCondition.stability = connection.rtt < 100 ? 'excellent' :
                                         connection.rtt < 300 ? 'good' : 'poor';
      };

      connection.addEventListener('change', updateNetworkCondition);
      updateNetworkCondition();
    }
  }

  /**
   * Start adaptive sync based on network conditions
   */
  private startAdaptiveSync(): void {
    const getInterval = () => {
      if (this.networkCondition.speed === 'fast' && this.networkCondition.cost === 'free') {
        return 10000; // 10 seconds on fast, free networks
      } else if (this.networkCondition.speed === 'medium') {
        return 30000; // 30 seconds on medium networks
      } else {
        return 60000; // 1 minute on slow networks
      }
    };

    const scheduleNext = () => {
      if (this.syncInterval) {
        clearTimeout(this.syncInterval);
      }

      this.syncInterval = setTimeout(() => {
        this.processAdaptiveSync();
        scheduleNext();
      }, getInterval());
    };

    scheduleNext();
  }

  /**
   * Add item to advanced sync queue
   */
  async addToQueue(item: Partial<AdvancedSyncItem>): Promise<void> {
    const advancedItem: AdvancedSyncItem = {
      id: item.id || `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: item.type || 'recipe',
      operation: item.operation || 'update',
      data: item.data,
      timestamp: item.timestamp || Date.now(),
      retryCount: item.retryCount || 0,
      priority: item.priority || 'normal',
      strategy: item.strategy || 'adaptive',
      dependencies: item.dependencies || [],
      estimatedSize: item.estimatedSize || 1024,
      networkRequirement: item.networkRequirement || 'any',
      maxRetries: item.maxRetries || 3,
      backoffMultiplier: item.backoffMultiplier || 2,
      conflictResolution: item.conflictResolution || 'manual',
      lastError: item.lastError
    };

    this.syncQueue.set(advancedItem.id, advancedItem);

    // Store in persistent storage
    await offlineStorage.addToSyncQueue(advancedItem);

    // Trigger immediate sync for critical items
    if (advancedItem.priority === 'critical' && advancedItem.strategy === 'immediate') {
      this.processSingleItem(advancedItem);
    }

    this.emitEvent({
      type: 'sync-start',
      data: { itemAdded: advancedItem.id },
      timestamp: Date.now()
    });
  }

  /**
   * Process adaptive sync based on current conditions
   */
  private async processAdaptiveSync(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;

    this.isProcessing = true;

    try {
      // Load queue from storage
      await this.loadQueueFromStorage();

      // Create optimized batches
      const batches = this.createOptimizedBatches();

      // Process batches based on network conditions
      for (const batch of batches) {
        if (this.shouldProcessBatch(batch)) {
          await this.processBatch(batch);
        }
      }
    } catch (error) {
      console.error('Adaptive sync failed:', error);
      this.emitEvent({
        type: 'sync-error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Load sync queue from persistent storage
   */
  private async loadQueueFromStorage(): Promise<void> {
    const storedItems = await offlineStorage.getSyncQueue();
    this.syncQueue.clear();

    storedItems.forEach(item => {
      const advancedItem = item as AdvancedSyncItem;
      this.syncQueue.set(advancedItem.id, advancedItem);
    });
  }

  /**
   * Create optimized sync batches
   */
  private createOptimizedBatches(): SyncBatch[] {
    const items = Array.from(this.syncQueue.values());
    const batches: SyncBatch[] = [];

    // Group by priority and network requirements
    const groups = new Map<string, AdvancedSyncItem[]>();

    items.forEach(item => {
      const key = `${item.priority}_${item.networkRequirement}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    // Create batches with size and dependency optimization
    groups.forEach((groupItems, key) => {
      const [priority] = key.split('_') as [SyncPriority, string];

      // Sort by dependencies and timestamp
      groupItems.sort((a, b) => {
        if (a.dependencies.length !== b.dependencies.length) {
          return a.dependencies.length - b.dependencies.length;
        }
        return a.timestamp - b.timestamp;
      });

      // Create batches with optimal size
      const maxBatchSize = this.getOptimalBatchSize();
      let currentBatch: AdvancedSyncItem[] = [];
      let currentSize = 0;

      groupItems.forEach(item => {
        if (currentSize + item.estimatedSize > maxBatchSize && currentBatch.length > 0) {
          // Create batch
          batches.push({
            id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            items: [...currentBatch],
            totalSize: currentSize,
            priority,
            estimatedDuration: this.estimateBatchDuration(currentBatch)
          });

          currentBatch = [];
          currentSize = 0;
        }

        currentBatch.push(item);
        currentSize += item.estimatedSize;
      });

      // Add remaining items as final batch
      if (currentBatch.length > 0) {
        batches.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          items: currentBatch,
          totalSize: currentSize,
          priority,
          estimatedDuration: this.estimateBatchDuration(currentBatch)
        });
      }
    });

    // Sort batches by priority and estimated duration
    batches.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return a.estimatedDuration - b.estimatedDuration;
    });

    return batches;
  }

  /**
   * Determine if a batch should be processed based on current conditions
   */
  private shouldProcessBatch(batch: SyncBatch): boolean {
    // Check network requirements
    const hasWifiRequirement = batch.items.some(item => item.networkRequirement === 'wifi');
    const hasFastRequirement = batch.items.some(item => item.networkRequirement === 'fast');

    if (hasWifiRequirement && this.networkCondition.type !== 'wifi') {
      return false;
    }

    if (hasFastRequirement && this.networkCondition.speed === 'slow') {
      return false;
    }

    // Check if batch size is appropriate for current network
    const maxAllowedSize = this.getMaxAllowedBatchSize();
    if (batch.totalSize > maxAllowedSize) {
      return false;
    }

    // Check priority vs network cost
    if (this.networkCondition.cost === 'expensive' && batch.priority === 'low') {
      return false;
    }

    return true;
  }

  /**
   * Process a sync batch
   */
  private async processBatch(batch: SyncBatch): Promise<void> {
    this.activeBatches.set(batch.id, batch);

    this.emitEvent({
      type: 'sync-start',
      data: { batchId: batch.id, itemCount: batch.items.length },
      timestamp: Date.now()
    });

    try {
      let processed = 0;

      for (const item of batch.items) {
        try {
          await this.processSingleItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          this.syncQueue.delete(item.id);
          processed++;

          this.emitEvent({
            type: 'sync-progress',
            progress: (processed / batch.items.length) * 100,
            data: { batchId: batch.id, processed, total: batch.items.length },
            timestamp: Date.now()
          });
        } catch (error) {
          await this.handleSyncError(item, error);
        }
      }

      this.emitEvent({
        type: 'sync-complete',
        data: { batchId: batch.id, processed, total: batch.items.length },
        timestamp: Date.now()
      });
    } catch (error) {
      this.emitEvent({
        type: 'sync-error',
        error: error instanceof Error ? error.message : 'Batch sync failed',
        data: { batchId: batch.id },
        timestamp: Date.now()
      });
    } finally {
      this.activeBatches.delete(batch.id);
    }
  }

  /**
   * Process a single sync item
   */
  private async processSingleItem(item: AdvancedSyncItem): Promise<void> {
    // Simulate API call - replace with actual implementation
    const delay = Math.random() * 1000 + 500; // 0.5-1.5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate potential conflicts
    if (Math.random() < 0.1) { // 10% chance of conflict
      throw new Error('Conflict detected: Server version differs from local version');
    }

    // Simulate network errors
    if (this.networkCondition.stability === 'poor' && Math.random() < 0.2) {
      throw new Error('Network timeout');
    }

    console.log(`Successfully synced ${item.type} ${item.operation}:`, item.data);
  }

  /**
   * Handle sync errors with intelligent retry logic
   */
  private async handleSyncError(item: AdvancedSyncItem, error: any): Promise<void> {
    item.retryCount++;
    item.lastError = error instanceof Error ? error.message : 'Unknown error';

    if (item.retryCount >= item.maxRetries) {
      // Max retries reached - remove from queue or mark for manual resolution
      if (item.lastError?.includes('Conflict')) {
        this.emitEvent({
          type: 'conflict-detected',
          data: { item, error: item.lastError },
          timestamp: Date.now()
        });
      } else {
        await offlineStorage.removeFromSyncQueue(item.id);
        this.syncQueue.delete(item.id);
      }
    } else {
      // Schedule retry with exponential backoff
      const delay = Math.pow(item.backoffMultiplier, item.retryCount) * 1000;
      item.scheduledFor = Date.now() + delay;

      // Update in storage
      await offlineStorage.addToSyncQueue(item);
    }
  }

  /**
   * Get optimal batch size based on network conditions
   */
  private getOptimalBatchSize(): number {
    switch (this.networkCondition.speed) {
      case 'fast':
        return 1024 * 1024; // 1MB
      case 'medium':
        return 512 * 1024; // 512KB
      case 'slow':
        return 128 * 1024; // 128KB
      default:
        return 256 * 1024; // 256KB
    }
  }

  /**
   * Get maximum allowed batch size based on network cost
   */
  private getMaxAllowedBatchSize(): number {
    if (this.networkCondition.cost === 'expensive') {
      return 64 * 1024; // 64KB on expensive networks
    } else if (this.networkCondition.cost === 'metered') {
      return 256 * 1024; // 256KB on metered networks
    } else {
      return 2 * 1024 * 1024; // 2MB on free networks
    }
  }

  /**
   * Estimate batch processing duration
   */
  private estimateBatchDuration(items: AdvancedSyncItem[]): number {
    const baseTime = 500; // Base time per item in ms
    const sizeMultiplier = this.networkCondition.speed === 'fast' ? 0.5 :
                          this.networkCondition.speed === 'medium' ? 1 :
                          2;

    return items.length * baseTime * sizeMultiplier;
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: BackgroundSyncEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }

  /**
   * Subscribe to sync events
   */
  subscribe(callback: (event: BackgroundSyncEvent) => void): () => void {
    this.eventListeners.push(callback);

    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync statistics
   */
  getSyncStats() {
    return {
      queueSize: this.syncQueue.size,
      activeBatches: this.activeBatches.size,
      networkCondition: this.networkCondition,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Force immediate sync of all items
   */
  async forceSync(): Promise<void> {
    if (this.isProcessing) return;

    await this.processAdaptiveSync();
  }

  /**
   * Pause all sync operations
   */
  pauseSync(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Resume sync operations
   */
  resumeSync(): void {
    this.startAdaptiveSync();
  }

  /**
   * Clear all sync queues
   */
  async clearAll(): Promise<void> {
    this.syncQueue.clear();
    this.activeBatches.clear();
    await offlineStorage.clearSyncQueue();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.pauseSync();
    this.eventListeners = [];
    this.syncQueue.clear();
    this.activeBatches.clear();
  }
}

// Export singleton instance
export const advancedSyncService = new AdvancedSyncService();
