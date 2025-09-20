// =============================================================================
// LOCAL STORAGE SERVICE
// =============================================================================

import { APP_VERSION, STORAGE_KEY } from '../constants';

import { validationService } from './validation';

/**
 * Service for managing localStorage operations with error handling
 */
export const storageService = {
  /**
   * Save data to localStorage
   * @param {Object} data - Data to save
   * @returns {boolean} Success status
   */
  save: (data) => {
    try {
      if (!data || typeof data !== 'object') {
        console.warn('Invalid data provided to storage service');
        return false;
      }

      const serializedData = JSON.stringify({
        ...data,
        version: APP_VERSION,
        lastSaved: Date.now()
      });

      // Check if data is too large (5MB limit for localStorage)
      const sizeInBytes = new Blob([serializedData]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (sizeInBytes > maxSize) {
        console.warn('Data too large for localStorage:', sizeInBytes, 'bytes');
        return false;
      }

      localStorage.setItem(STORAGE_KEY, serializedData);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
        // Could implement cleanup logic here
      }
      
      return false;
    }
  },

  /**
   * Load data from localStorage
   * @returns {Object|null} Loaded data or null if failed
   */
  load: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored);
      
      // Version compatibility check
      if (data.version !== APP_VERSION) {
        console.warn(
          `Storage version mismatch. Expected ${APP_VERSION}, found ${data.version}.`
        );
        // Could implement migration logic here
      }

      return data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  },

  /**
   * Clear all stored data
   * @returns {boolean} Success status
   */
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  },

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getUsageInfo: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const sizeInBytes = stored ? new Blob([stored]).size : 0;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      return {
        sizeInBytes,
        sizeInKB: `${sizeInKB} KB`,
        sizeInMB: `${sizeInMB} MB`,
        lastSaved: stored ? JSON.parse(stored).lastSaved : null
      };
    } catch (error) {
      console.error('Failed to get storage usage info:', error);
      return {
        sizeInBytes: 0,
        sizeInKB: '0 KB',
        sizeInMB: '0 MB',
        lastSaved: null
      };
    }
  },

  /**
   * Check if localStorage is available
   * @returns {boolean} Is localStorage available
   */
  isAvailable: () => {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Backup data to JSON file
   * @returns {boolean} Success status
   */
  exportBackup: () => {
    try {
      const data = storageService.load();
      if (!data) return false;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birch-lounge-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to export backup:', error);
      return false;
    }
  },

  /**
   * Export all application data with validation
   * @returns {Object} Complete application data
   */
  exportData: () => {
    try {
      const data = storageService.load();
      if (!data) {
        return {
          recipes: [],
          ingredients: [],
          menus: [],
          batches: [],
          techniques: [],
          version: APP_VERSION,
          lastSaved: Date.now()
        };
      }

      return {
        recipes: data.recipes || [],
        ingredients: data.ingredients || [],
        menus: data.menus || [],
        batches: data.batches || [],
        techniques: data.techniques || [],
        version: data.version || APP_VERSION,
        lastSaved: data.lastSaved || Date.now()
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Data export failed');
    }
  },

  /**
   * Import data with comprehensive validation and security checks
   * @param {Object} rawData - Raw data to import
   * @returns {boolean} Success status
   */
  importData: (rawData) => {
    try {
      // Validate and sanitize the imported data
      const validation = validationService.validateImportData(rawData);
      
      if (!validation.isValid) {
        console.error('Import validation failed:', validation.errors);
        throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
      }

      // Get current data to preserve any existing data not in import
      const currentData = storageService.load() || {};
      
      // Merge validated data with current data
      const mergedData = {
        ...currentData,
        ...validation.data,
        version: APP_VERSION,
        lastSaved: Date.now()
      };

      // Save the merged data
      return storageService.save(mergedData);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  },

  /**
   * Clear all application data
   * @returns {boolean} Success status
   */
  clearAllData: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }
};
