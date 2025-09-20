/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { geminiService } from '../../services/geminiService';
import { 
  validatePDFFile, 
  parseRecipesFromText,
  processPDFRecipeBook 
} from '../../services/pdfService';

// Mock the geminiService
vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generate: vi.fn()
  }
}));

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
  version: '3.11.174'
}));

describe('PDF Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-api-key'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validatePDFFile', () => {
    it('should validate correct PDF file', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validatePDFFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-PDF file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validatePDFFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File must be a PDF');
    });

    it('should reject file without .pdf extension', () => {
      const file = new File(['test'], 'test.doc', { type: 'application/pdf' });
      const result = validatePDFFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File must have .pdf extension');
    });

    it('should reject oversized file', () => {
      // Create a mock file that's too large (over 50MB)
      const largeFile = {
        type: 'application/pdf',
        name: 'large.pdf',
        size: 60 * 1024 * 1024 // 60MB
      };
      
      const result = validatePDFFile(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size must be less than 50MB');
    });
  });

  describe('parseRecipesFromText', () => {
    it('should parse valid recipe JSON from AI response', async () => {
      const mockRecipes = [
        {
          name: 'Old Fashioned',
          category: 'Whiskey',
          ingredients: [
            { name: 'Bourbon', amount: '2', unit: 'oz' },
            { name: 'Simple Syrup', amount: '0.25', unit: 'oz' }
          ],
          instructions: 'Stir with ice and strain',
          glassware: 'Rocks glass',
          garnish: 'Orange peel',
          flavorProfile: ['strong', 'sweet'],
          difficulty: 'Easy',
          prepTime: 3
        }
      ];

      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const result = await parseRecipesFromText('Test recipe text');

      expect(result.success).toBe(true);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Old Fashioned');
      expect(result.recipes[0].id).toBeDefined();
      expect(result.recipes[0].createdAt).toBeDefined();
    });

    it('should handle AI response with wrapped JSON', async () => {
      const mockRecipes = [{ name: 'Test Recipe' }];
      const wrappedResponse = `Here are the recipes:\n${JSON.stringify(mockRecipes)}\nEnjoy!`;

      geminiService.generate.mockResolvedValue(wrappedResponse);

      const result = await parseRecipesFromText('Test recipe text');

      expect(result.success).toBe(true);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Test Recipe');
    });

    it('should handle invalid AI response gracefully', async () => {
      geminiService.generate.mockResolvedValue('Invalid response');

      const result = await parseRecipesFromText('Test recipe text');

      expect(result.success).toBe(true);
      expect(result.recipes).toHaveLength(0);
    });

    it('should handle AI service errors', async () => {
      geminiService.generate.mockRejectedValue(new Error('API Error'));

      const result = await parseRecipesFromText('Test recipe text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(result.recipes).toHaveLength(0);
    });

    it('should call progress callback during processing', async () => {
      const mockRecipes = [{ name: 'Test Recipe' }];
      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const progressCallback = vi.fn();
      await parseRecipesFromText('Short text', progressCallback);

      expect(progressCallback).toHaveBeenCalledWith({
        currentChunk: 1,
        totalChunks: 1,
        progress: 100,
        recipesFound: 1
      });
    });
  });

  describe('processPDFRecipeBook', () => {
    it('should reject invalid PDF file', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      const result = await processPDFRecipeBook(invalidFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File must be a PDF');
      expect(result.recipes).toHaveLength(0);
    });

    it('should call progress callback during processing', async () => {
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const progressCallback = vi.fn();

      // Mock successful PDF extraction to trigger progress callback
      const mockPDFJS = await import('pdfjs-dist');
      mockPDFJS.getDocument.mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [{ str: 'Test recipe content' }]
            })
          })
        })
      });

      // Mock AI service to return valid recipes
      geminiService.generate.mockResolvedValue(JSON.stringify([{
        name: 'Test Recipe',
        ingredients: ['Test ingredient'],
        instructions: 'Test instructions'
      }]));

      await processPDFRecipeBook(validFile, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'extracting'
        })
      );
    });
  });

  describe('Text Processing Utilities', () => {
    // Test the internal splitTextIntoChunks function if it's exported
    // For now, we'll test it through the main functions that use it
    
    it('should handle large text by splitting into chunks', async () => {
      // Create a large text that would exceed token limits
      const largeText = 'word '.repeat(2000); // 10,000 characters
      
      const mockRecipes = [{ name: 'Test Recipe' }];
      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const result = await parseRecipesFromText(largeText);

      // Should have made API calls for chunks (text might be split)
      expect(geminiService.generate).toHaveBeenCalledTimes(3); // Large text gets split into chunks
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clean up progress callback on error', async () => {
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      // Mock PDF extraction to fail
      const mockPDFJS = await import('pdfjs-dist');
      // Create a rejected promise but mark it as handled to avoid global unhandled rejection noise
      const rejected = Promise.reject(new Error('PDF parsing failed'));
      rejected.catch(() => {});
      mockPDFJS.getDocument.mockReturnValue({
        promise: rejected
      });

      const result = await processPDFRecipeBook(validFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF parsing failed');
      expect(window.pdfProgressCallback).toBeNull();
    });

    it('should handle missing API key gracefully', async () => {
      window.localStorage.getItem.mockReturnValue(null);
      
      const result = await parseRecipesFromText('Test text');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Recipe ID Generation', () => {
    it('should generate unique IDs for recipes', async () => {
      const mockRecipes = [
        { name: 'Recipe 1' },
        { name: 'Recipe 2' }
      ];

      geminiService.generate.mockResolvedValue(JSON.stringify(mockRecipes));

      const result = await parseRecipesFromText('Test recipe text');

      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].id).toBeDefined();
      expect(result.recipes[1].id).toBeDefined();
      expect(result.recipes[0].id).not.toBe(result.recipes[1].id);
    });
  });
});
