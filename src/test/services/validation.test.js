// =============================================================================
// VALIDATION SERVICE TESTS
// =============================================================================

import { describe, it, expect } from 'vitest';

import { validationService } from '../../services/validation';

describe('Validation Service', () => {
  describe('validateEnvironment', () => {
    it('should return validation results for environment', () => {
      const result = validationService.validateEnvironment();
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('gemini');
      expect(result).toHaveProperty('supabase');
    });
  });

  describe('validateFile', () => {
    it('should accept valid JSON files', () => {
      const validFile = new File(['{"test": "data"}'], 'valid.json', {
        type: 'application/json'
      });
      
      const result = validationService.validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.json', {
        type: 'application/json'
      });
      
      const result = validationService.validateFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('File too large');
    });

    it('should reject non-JSON files', () => {
      const invalidFile = new File(['test'], 'test.txt', {
        type: 'text/plain'
      });
      
      const result = validationService.validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid file type');
    });
  });

  describe('validateImportData', () => {
    it('should validate valid JSON data', () => {
      const validData = JSON.stringify({
        recipes: [{
          name: 'Test Recipe',
          version: '1.0',
          ingredients: [{ name: 'Test Ingredient', amount: '1', unit: 'oz' }],
          instructions: 'Test instructions'
        }],
        ingredients: [{
          name: 'Test Ingredient',
          category: 'Test',
          price: 10.50,
          unit: 'oz'
        }]
      });
      
      const result = validationService.validateImportData(validData);
      expect(result.isValid).toBe(true);
      expect(result.data.recipes).toHaveLength(1);
      expect(result.data.ingredients).toHaveLength(1);
    });

    it('should handle invalid JSON', () => {
      const invalidJson = '{"invalid": json}';
      
      const result = validationService.validateImportData(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Invalid JSON format');
    });

    it('should handle oversized content', () => {
      const oversizedData = 'x'.repeat(validationService.MAX_STRING_LENGTH + 1);
      
      const result = validationService.validateImportData(oversizedData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('File content too large');
    });

    it('should provide summary of imported data', () => {
      const validData = JSON.stringify({
        recipes: [
          { name: 'Recipe 1', version: '1.0', ingredients: [{ name: 'Ing 1', amount: '1', unit: 'oz' }], instructions: 'Test' },
          { name: 'Recipe 2', version: '1.0', ingredients: [{ name: 'Ing 2', amount: '1', unit: 'oz' }], instructions: 'Test' }
        ],
        ingredients: [{ name: 'Ingredient 1', unit: 'oz' }]
      });
      
      const result = validationService.validateImportData(validData);
      expect(result.summary.recipesImported).toBe(2);
      expect(result.summary.ingredientsImported).toBe(1);
    });
  });

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const sanitized = validationService.sanitizeString(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove javascript: protocol', () => {
      const malicious = 'javascript:alert("xss")';
      const sanitized = validationService.sanitizeString(malicious);
      
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const malicious = 'onclick="alert()" onload="evil()"';
      const sanitized = validationService.sanitizeString(malicious);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onload');
    });

    it('should handle non-string input', () => {
      expect(validationService.sanitizeString(null)).toBe('');
      expect(validationService.sanitizeString(undefined)).toBe('');
      expect(validationService.sanitizeString(123)).toBe('');
    });

    it('should trim and limit length', () => {
      const longString = `  ${  'x'.repeat(validationService.MAX_STRING_LENGTH + 100)  }  `;
      const sanitized = validationService.sanitizeString(longString);
      
      expect(sanitized.length).toBeLessThanOrEqual(validationService.MAX_STRING_LENGTH);
      expect(sanitized).not.toMatch(/^\s/); // Should not start with whitespace
      expect(sanitized).not.toMatch(/\s$/); // Should not end with whitespace
    });
  });

  describe('validateApiKeyFormat', () => {
    it('should validate Gemini API key format', () => {
      expect(validationService.validateApiKeyFormat('gemini', 'AIzaSyDummyKeyForTesting123456789')).toBe(true);
      expect(validationService.validateApiKeyFormat('gemini', 'invalid-key')).toBe(false);
      expect(validationService.validateApiKeyFormat('gemini', '')).toBe(false);
    });

    it('should validate OpenAI API key format', () => {
      expect(validationService.validateApiKeyFormat('openai', 'sk-1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(true);
      expect(validationService.validateApiKeyFormat('openai', 'invalid-key')).toBe(false);
      expect(validationService.validateApiKeyFormat('openai', '')).toBe(false);
    });

    it('should handle unknown service types', () => {
      expect(validationService.validateApiKeyFormat('unknown', 'some-long-key-here')).toBe(true);
      expect(validationService.validateApiKeyFormat('unknown', 'short')).toBe(false);
    });
  });

  describe('getRecommendations', () => {
    it('should return array of recommendations', () => {
      const recommendations = validationService.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('message');
        expect(rec).toHaveProperty('action');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const result = validationService.validateImportData('{}');
      expect(result.isValid).toBe(true);
      expect(result.data.recipes).toEqual([]);
      expect(result.data.ingredients).toEqual([]);
    });

    it('should handle malformed recipe data', () => {
      const malformedData = JSON.stringify({
        recipes: [
          { name: 'Valid Recipe', ingredients: [] },
          { /* missing name */ ingredients: [] },
          'not an object'
        ]
      });
      
      const result = validationService.validateImportData(malformedData);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle malformed ingredient data', () => {
      const malformedData = JSON.stringify({
        ingredients: [
          { name: 'Valid Ingredient', category: 'Test' },
          { /* missing name */ category: 'Test' },
          'not an object'
        ]
      });
      
      const result = validationService.validateImportData(malformedData);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
