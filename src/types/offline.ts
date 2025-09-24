// =============================================================================
// OFFLINE & PWA TYPE DEFINITIONS
// =============================================================================

import type { Recipe, Ingredient, Technique, Menu } from './index';

/**
 * Network connection status
 */
export type ConnectionStatus = 'online' | 'offline' | 'slow';

/**
 * Sync status for individual items
 */
export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

/**
 * Sync operation types
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Offline-enabled recipe with sync metadata
 */
export interface OfflineRecipe extends Recipe {
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
  pendingOperation?: SyncOperation;
  conflictData?: Recipe; // Server version in case of conflict
}

/**
 * Offline-enabled ingredient with sync metadata
 */
export interface OfflineIngredient extends Ingredient {
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
  pendingOperation?: SyncOperation;
  conflictData?: Ingredient;
}

/**
 * Offline-enabled technique with sync metadata
 */
export interface OfflineTechnique extends Technique {
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
  pendingOperation?: SyncOperation;
  conflictData?: Technique;
}

/**
 * Offline-enabled menu with sync metadata
 */
export interface OfflineMenu extends Menu {
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
  pendingOperation?: SyncOperation;
  conflictData?: Menu;
}

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  id: string;
  type: 'recipe' | 'ingredient' | 'technique' | 'menu';
  operation: SyncOperation;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

/**
 * Offline cache configuration
 */
export interface OfflineCacheConfig {
  maxRecipes: number;
  maxIngredients: number;
  maxTechniques: number;
  maxMenus: number;
  maxImageSize: number; // in bytes
  maxTotalSize: number; // in bytes
  autoDownload: boolean;
  downloadOnWifi: boolean;
}

/**
 * Offline storage statistics
 */
export interface OfflineStorageStats {
  totalItems: number;
  totalSize: number; // in bytes
  recipes: {
    count: number;
    size: number;
    pendingSync: number;
  };
  ingredients: {
    count: number;
    size: number;
    pendingSync: number;
  };
  techniques: {
    count: number;
    size: number;
    pendingSync: number;
  };
  menus: {
    count: number;
    size: number;
    pendingSync: number;
  };
  images: {
    count: number;
    size: number;
  };
}

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'local' | 'server' | 'merge' | 'manual';

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult {
  resolution: ConflictResolution;
  resolvedData: any;
  timestamp: number;
}

/**
 * Background sync event
 */
export interface BackgroundSyncEvent {
  type: 'sync-start' | 'sync-progress' | 'sync-complete' | 'sync-error' | 'conflict-detected';
  data?: any;
  progress?: number; // 0-100
  error?: string;
  timestamp: number;
}

/**
 * Offline manager configuration
 */
export interface OfflineManagerConfig {
  enableBackgroundSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // in milliseconds
  conflictResolution: ConflictResolution;
  cacheConfig: OfflineCacheConfig;
}

/**
 * Download progress
 */
export interface DownloadProgress {
  itemId: string;
  itemType: string;
  progress: number; // 0-100
  status: 'downloading' | 'complete' | 'error';
  error?: string;
}

/**
 * Offline manager interface
 */
export interface OfflineManager {
  // Connection management
  getConnectionStatus(): ConnectionStatus;
  isOnline(): boolean;
  
  // Data management
  cacheRecipe(recipe: Recipe): Promise<void>;
  cacheIngredient(ingredient: Ingredient): Promise<void>;
  cacheTechnique(technique: Technique): Promise<void>;
  cacheMenu(menu: Menu): Promise<void>;
  
  // Retrieval
  getCachedRecipes(): Promise<OfflineRecipe[]>;
  getCachedIngredients(): Promise<OfflineIngredient[]>;
  getCachedTechniques(): Promise<OfflineTechnique[]>;
  getCachedMenus(): Promise<OfflineMenu[]>;
  
  // Sync management
  queueSync(item: SyncQueueItem): Promise<void>;
  processSyncQueue(): Promise<void>;
  getSyncQueue(): Promise<SyncQueueItem[]>;
  clearSyncQueue(): Promise<void>;
  
  // Conflict resolution
  resolveConflict(itemId: string, resolution: ConflictResolutionResult): Promise<void>;
  getConflicts(): Promise<Array<{ id: string; type: string; local: any; server: any }>>;
  
  // Storage management
  getStorageStats(): Promise<OfflineStorageStats>;
  clearCache(): Promise<void>;
  optimizeStorage(): Promise<void>;
  
  // Event handling
  subscribe(callback: (event: BackgroundSyncEvent) => void): () => void;
}

/**
 * PWA install prompt interface
 */
export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA update available event
 */
export interface PWAUpdateEvent {
  type: 'update-available' | 'update-ready' | 'update-error';
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * Offline indicator props
 */
export interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  showSyncStatus?: boolean;
}

/**
 * Download manager props
 */
export interface DownloadManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadSelected: (items: Array<{ id: string; type: string }>) => void;
}

/**
 * Sync status props
 */
export interface SyncStatusProps {
  className?: string;
  showProgress?: boolean;
  showQueue?: boolean;
}
