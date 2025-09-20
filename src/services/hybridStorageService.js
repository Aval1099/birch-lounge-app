// =============================================================================
// HYBRID STORAGE SERVICE - OFFLINE-FIRST WITH CLOUD SYNC
// =============================================================================

import { storageService } from './storageService';
import { syncService } from './syncService';

/**
 * Hybrid Storage Service - Combines localStorage with cloud sync
 * Maintains offline-first approach while adding cloud backup capabilities
 */
export const hybridStorageService = {
  /**
   * Initialize the hybrid storage system
   */
  init: async () => {
    try {
      // Initialize sync service
      await syncService.init();
      console.log('✅ Hybrid storage service initialized');
    } catch (error) {
      console.warn('⚠️ Hybrid storage init failed, falling back to localStorage only:', error);
    }
  },

  /**
   * Save data using hybrid approach
   * @param {Object} data - Data to save
   * @returns {boolean} Success status
   */
  save: async (data) => {
    try {
      // Always save locally first (offline-first)
      const localSuccess = storageService.save(data);
      
      if (!localSuccess) {
        console.error('Failed to save data locally');
        return false;
      }

      // Attempt cloud sync (non-blocking)
      try {
        await syncService.save(data);
      } catch (syncError) {
        console.warn('Cloud sync failed, data saved locally:', syncError);
        // Don't fail the save operation if cloud sync fails
      }

      return true;
    } catch (error) {
      console.error('Hybrid save failed:', error);
      return false;
    }
  },

  /**
   * Load data using hybrid approach
   * @returns {Object|null} Loaded data
   */
  load: async () => {
    try {
      // Try to load from hybrid sync service (handles local/cloud priority)
      const data = await syncService.load();
      return data;
    } catch (error) {
      console.warn('Hybrid load failed, falling back to localStorage:', error);
      // Fallback to pure localStorage
      return storageService.load();
    }
  },

  /**
   * Clear all data (both local and cloud)
   * @returns {boolean} Success status
   */
  clearAllData: async () => {
    try {
      // Clear local data
      const localSuccess = storageService.clearAllData();
      
      // TODO: Add cloud data clearing when user wants to reset everything
      // For now, we'll just clear local data
      
      return localSuccess;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  },

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats including sync status
   */
  getUsageInfo: () => {
    const localUsage = storageService.getUsageInfo();
    const syncStatus = syncService.getSyncStatus();
    
    return {
      ...localUsage,
      sync: syncStatus
    };
  },

  /**
   * Force sync to cloud (manual trigger)
   * @returns {boolean} Success status
   */
  forceSync: async () => {
    try {
      await syncService.forceSync();
      return true;
    } catch (error) {
      console.error('Force sync failed:', error);
      return false;
    }
  },

  /**
   * Get sync status
   * @returns {Object} Current sync status
   */
  getSyncStatus: () => {
    return syncService.getSyncStatus();
  },

  /**
   * Check if cloud sync is available
   * @returns {boolean} True if cloud sync is configured and available
   */
  isCloudSyncAvailable: () => {
    const status = syncService.getSyncStatus();
    return status.isConfigured && status.isOnline;
  }
};

// Export individual functions for backward compatibility
export const {
  save,
  load,
  clearAllData,
  getUsageInfo,
  forceSync,
  getSyncStatus,
  isCloudSyncAvailable
} = hybridStorageService;

export default hybridStorageService;
