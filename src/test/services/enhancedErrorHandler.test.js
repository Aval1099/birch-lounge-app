// =============================================================================
// ENHANCED ERROR HANDLER TESTS
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { errorHandler } from '../../services/errorHandler.js';

describe('Enhanced Error Handler', () => {
  beforeEach(() => {
    // Reset error statistics before each test
    errorHandler._resetStats();
  });

  describe('Enhanced handle() function', () => {
    it('should provide detailed error information with recovery actions', () => {
      const error = new Error('Network connection failed');
      const result = errorHandler.handle(error, 'Recipe Save');

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('context', 'Recipe Save');
      expect(result).toHaveProperty('message', 'Network connection failed');
      expect(result).toHaveProperty('userMessage');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('recoveryActions');
      expect(result).toHaveProperty('canRetry');
      expect(result).toHaveProperty('isTemporary');
      expect(result).toHaveProperty('metadata');

      expect(result.category).toBe('network');
      expect(result.canRetry).toBe(true);
      expect(result.isTemporary).toBe(true);
      expect(result.recoveryActions).toBeInstanceOf(Array);
      expect(result.recoveryActions.length).toBeGreaterThan(0);
    });

    it('should maintain backward compatibility with handleSimple', () => {
      const error = new Error('Test error');
      const simple = errorHandler.handleSimple(error, 'Test Context');
      const detailed = errorHandler.handle(error, 'Test Context');

      expect(simple).toHaveProperty('timestamp');
      expect(simple).toHaveProperty('context', 'Test Context');
      expect(simple).toHaveProperty('message', 'Test error');
      expect(simple).toHaveProperty('userMessage');
      expect(simple).toHaveProperty('severity');

      // Should not have enhanced properties
      expect(simple).not.toHaveProperty('recoveryActions');
      expect(simple).not.toHaveProperty('category');
      expect(simple).not.toHaveProperty('metadata');

      // Basic properties should match
      expect(simple.context).toBe(detailed.context);
      expect(simple.message).toBe(detailed.message);
      expect(simple.severity).toBe(detailed.severity);
    });
  });

  describe('Error categorization', () => {
    it('should categorize network errors correctly', () => {
      const networkErrors = [
        new Error('Network connection failed'),
        new Error('Fetch request timeout'),
        new Error('Connection refused')
      ];

      networkErrors.forEach(error => {
        const category = errorHandler.getErrorCategory(error, 'Test');
        expect(category).toBe('network');
      });
    });

    it('should categorize storage errors correctly', () => {
      const storageErrors = [
        new Error('Storage quota exceeded'),
        new Error('LocalStorage is full'),
        new Error('Storage limit reached')
      ];

      storageErrors.forEach(error => {
        const category = errorHandler.getErrorCategory(error, 'Test');
        expect(category).toBe('storage');
      });
    });

    it('should categorize auth errors correctly', () => {
      const authErrors = [
        new Error('Unauthorized access'),
        new Error('API key invalid'),
        new Error('Forbidden request')
      ];

      authErrors.forEach(error => {
        const category = errorHandler.getErrorCategory(error, 'Test');
        expect(category).toBe('auth');
      });
    });

    it('should categorize validation errors correctly', () => {
      const validationErrors = [
        new Error('Validation failed'),
        new Error('Invalid input data'),
        new Error('Required field missing')
      ];

      validationErrors.forEach(error => {
        const category = errorHandler.getErrorCategory(error, 'Test');
        expect(category).toBe('validation');
      });
    });

    it('should categorize based on context when message is unclear', () => {
      const error = new Error('Something went wrong');
      
      expect(errorHandler.getErrorCategory(error, 'Recipe Save')).toBe('recipe');
      expect(errorHandler.getErrorCategory(error, 'Ingredient Manager')).toBe('ingredient');
      expect(errorHandler.getErrorCategory(error, 'Data Import')).toBe('import');
      expect(errorHandler.getErrorCategory(error, 'PDF Processing')).toBe('file');
      expect(errorHandler.getErrorCategory(error, 'AI Assistant')).toBe('ai');
    });
  });

  describe('Recovery actions', () => {
    it('should provide network-specific recovery actions', () => {
      const error = new Error('Network connection failed');
      const actions = errorHandler.getRecoveryActions(error, 'Test');

      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);

      const actionTypes = actions.map(action => action.type);
      expect(actionTypes).toContain('retry');
      expect(actionTypes).toContain('check_connection');
      expect(actionTypes).toContain('offline_mode');

      // Should be sorted by priority
      expect(actions[0].priority).toBe('high');
    });

    it('should provide storage-specific recovery actions', () => {
      const error = new Error('Storage quota exceeded');
      const actions = errorHandler.getRecoveryActions(error, 'Test');

      const actionTypes = actions.map(action => action.type);
      expect(actionTypes).toContain('clear_storage');
      expect(actionTypes).toContain('export_data');
    });

    it('should provide auth-specific recovery actions', () => {
      const error = new Error('API key invalid');
      const actions = errorHandler.getRecoveryActions(error, 'Test');

      const actionTypes = actions.map(action => action.type);
      expect(actionTypes).toContain('check_api_key');
      expect(actionTypes).toContain('regenerate_key');

      // Should have external URL for key regeneration
      const regenerateAction = actions.find(action => action.type === 'regenerate_key');
      expect(regenerateAction).toHaveProperty('url');
      expect(regenerateAction.url).toContain('http');
    });

    it('should provide validation-specific recovery actions', () => {
      const error = new Error('Validation failed');
      const actions = errorHandler.getRecoveryActions(error, 'Test');

      const actionTypes = actions.map(action => action.type);
      expect(actionTypes).toContain('fix_validation');
      expect(actionTypes).toContain('reset_form');
    });

    it('should add context-specific actions when options provided', () => {
      const error = new Error('Import failed');
      const actions = errorHandler.getRecoveryActions(error, 'Data Import', { hasBackup: true });

      const actionTypes = actions.map(action => action.type);
      expect(actionTypes).toContain('restore_backup');

      // Backup restore should be high priority and first
      expect(actions[0].type).toBe('restore_backup');
      expect(actions[0].priority).toBe('high');
    });

    it('should sort actions by priority correctly', () => {
      const error = new Error('General error');
      const actions = errorHandler.getRecoveryActions(error, 'Test');

      // Should be sorted high -> medium -> low
      let lastPriorityValue = 3; // high = 3
      actions.forEach(action => {
        const priorityValue = { high: 3, medium: 2, low: 1 }[action.priority];
        expect(priorityValue).toBeLessThanOrEqual(lastPriorityValue);
        lastPriorityValue = priorityValue;
      });
    });
  });

  describe('Retry and temporary error detection', () => {
    it('should correctly identify retryable errors', () => {
      const retryableErrors = [
        new Error('Network timeout'),
        new Error('Fetch failed'),
        { message: 'Server error', status: 500 },
        { message: 'Rate limited', status: 429 }
      ];

      retryableErrors.forEach(error => {
        expect(errorHandler.canRetry(error, 'Test')).toBe(true);
      });
    });

    it('should correctly identify non-retryable errors', () => {
      const nonRetryableErrors = [
        new Error('Validation failed'),
        new Error('Invalid input'),
        new Error('Unauthorized'),
        new Error('Forbidden')
      ];

      nonRetryableErrors.forEach(error => {
        expect(errorHandler.canRetry(error, 'Test')).toBe(false);
      });
    });

    it('should correctly identify temporary errors', () => {
      const temporaryErrors = [
        new Error('Network connection failed'),
        new Error('Connection timeout'),
        { message: 'Server error', status: 500 },
        { message: 'Rate limited', status: 429 }
      ];

      temporaryErrors.forEach(error => {
        expect(errorHandler.isTemporary(error)).toBe(true);
      });
    });

    it('should correctly identify permanent errors', () => {
      const permanentErrors = [
        new Error('Validation failed'),
        new Error('Invalid format'),
        { message: 'Not found', status: 404 },
        { message: 'Unauthorized', status: 401 }
      ];

      permanentErrors.forEach(error => {
        expect(errorHandler.isTemporary(error)).toBe(false);
      });
    });
  });

  describe('Error statistics and tracking', () => {
    it('should track error statistics correctly', () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Validation error');
      const error3 = new Error('Network error');

      errorHandler.handle(error1, 'Recipe Save');
      errorHandler.handle(error2, 'Data Import');
      errorHandler.handle(error3, 'Recipe Save');

      const stats = errorHandler.getStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByContext['Recipe Save']).toBe(2);
      expect(stats.errorsByContext['Data Import']).toBe(1);
      expect(stats.errorsByCategory['network']).toBe(2);
      expect(stats.errorsByCategory['validation']).toBe(1);
      expect(stats.lastError).toBeDefined();
      expect(stats.mostCommonErrors).toBeInstanceOf(Array);
    });

    it('should maintain most common errors list', () => {
      // Generate multiple errors
      for (let i = 0; i < 5; i++) {
        errorHandler.handle(new Error('Network error'), 'Recipe Save');
      }
      for (let i = 0; i < 3; i++) {
        errorHandler.handle(new Error('Validation error'), 'Data Import');
      }

      const stats = errorHandler.getStats();
      expect(stats.mostCommonErrors.length).toBeGreaterThan(0);
      
      // Most common should be first
      expect(stats.mostCommonErrors[0].count).toBe(5);
      expect(stats.mostCommonErrors[0].category).toBe('network');
    });

    it('should reset statistics correctly', () => {
      errorHandler.handle(new Error('Test error'), 'Test');
      expect(errorHandler.getStats().totalErrors).toBe(1);

      errorHandler._resetStats();
      expect(errorHandler.getStats().totalErrors).toBe(0);
    });
  });

  describe('API key URL generation', () => {
    it('should return correct URL for Gemini API errors', () => {
      const url = errorHandler._getApiKeyUrl('Gemini API key invalid');
      expect(url).toContain('aistudio.google.com');
    });

    it('should return correct URL for OpenAI API errors', () => {
      const url = errorHandler._getApiKeyUrl('OpenAI API key invalid');
      expect(url).toContain('platform.openai.com');
    });

    it('should return default URL for unknown API errors', () => {
      const url = errorHandler._getApiKeyUrl('Unknown API error');
      expect(url).toContain('console.developers.google.com');
    });
  });
});
