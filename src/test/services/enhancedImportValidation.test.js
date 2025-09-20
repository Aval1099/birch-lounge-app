// =============================================================================
// ENHANCED IMPORT VALIDATION TESTS
// =============================================================================

import { describe, it, expect } from 'vitest';

import { validationService } from '../../services/validation.js';

describe('Enhanced Import Validation', () => {
  describe('validateImportDataDetailed', () => {
    describe('JSON Parsing and Structure Validation', () => {
      it('should handle valid JSON with all sections', () => {
        const validData = JSON.stringify({
          recipes: [
            {
              name: 'Test Recipe',
              version: '1.0',
              ingredients: [
                { name: 'Vodka', amount: '2', unit: 'oz' }
              ],
              instructions: 'Mix well'
            }
          ],
          ingredients: [
            { name: 'Vodka', category: 'Liquor', price: 25.00, unit: 'bottle' }
          ],
          savedMenus: [
            { name: 'Test Menu', items: [] }
          ],
          savedBatches: [
            { name: 'Test Batch', recipes: [] }
          ],
          techniques: [
            { name: 'Stirring', description: 'Stir gently' }
          ]
        });

        const result = validationService.validateImportDataDetailed(validData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.fieldErrors).toHaveLength(0);
        expect(result.data).toBeDefined();
        expect(result.summary.recipesImported).toBe(1);
        expect(result.summary.ingredientsImported).toBe(1);
        expect(result.validationReport.validFields).toBeGreaterThan(0);
      });

      it('should provide detailed JSON syntax error information', () => {
        const invalidJson = '{ "recipes": [ { "name": "Test" } '; // Missing closing brackets

        const result = validationService.validateImportDataDetailed(invalidJson);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('JSON Parse Error');
        expect(result.fieldErrors).toHaveLength(1);
        expect(result.fieldErrors[0].field).toBe('root');
        expect(result.fieldErrors[0].error).toContain('JSON Parse Error');
        expect(result.fieldErrors[0].line).toBe(1);
        expect(result.fieldErrors[0].column).toBeGreaterThan(0);
        expect(result.fieldErrors[0].suggestion).toBeDefined();
        expect(result.recoveryActions).toHaveLength(1);
        expect(result.recoveryActions[0].type).toBe('json_syntax');
      });

      it('should handle root data structure validation', () => {
        const arrayData = JSON.stringify([{ name: 'Recipe' }]);

        const result = validationService.validateImportDataDetailed(arrayData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Root data must be an object');
        expect(result.fieldErrors[0].error).toContain('Expected object, got array');
        expect(result.fieldErrors[0].suggestion).toContain('Wrap your data in an object');
      });

      it('should handle file size validation', () => {
        const largeData = 'x'.repeat(validationService.MAX_STRING_LENGTH + 1);

        const result = validationService.validateImportDataDetailed(largeData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File content too large');
        expect(result.recoveryActions[0].type).toBe('file_size');
        expect(result.recoveryActions[0].suggestion).toContain('Maximum allowed size');
      });
    });

    describe('Recipe Validation with Field-Level Errors', () => {
      it('should validate recipes array structure', () => {
        const invalidRecipesData = JSON.stringify({
          recipes: "not an array"
        });

        const result = validationService.validateImportDataDetailed(invalidRecipesData);

        expect(result.fieldErrors).toContainEqual(
          expect.objectContaining({
            field: 'recipes',
            error: 'Expected array, got string',
            suggestion: 'Recipes should be an array: "recipes": [...]'
          })
        );
      });

      it('should validate individual recipe objects', () => {
        const invalidRecipeData = JSON.stringify({
          recipes: [
            "not an object",
            { name: 'Valid Recipe', version: '1.0', ingredients: [{ name: 'Test', amount: '1', unit: 'oz' }], instructions: 'Test' },
            { /* missing required fields */ }
          ]
        });

        const result = validationService.validateImportDataDetailed(invalidRecipeData);

        // Should have field errors for invalid recipe objects
        const recipeErrors = result.fieldErrors.filter(error => error.field.startsWith('recipes['));
        expect(recipeErrors.length).toBeGreaterThan(0);
        
        // Should have specific error for non-object recipe
        expect(result.fieldErrors).toContainEqual(
          expect.objectContaining({
            field: 'recipes[0]',
            error: 'Expected object, got string'
          })
        );
      });

      it('should provide specific suggestions for recipe validation errors', () => {
        const incompleteRecipeData = JSON.stringify({
          recipes: [
            { name: 'Recipe without ingredients' },
            { ingredients: [{ name: 'Test', amount: '1', unit: 'oz' }] }, // missing name
            { name: 'Recipe', ingredients: [], instructions: 'Test' } // missing version
          ]
        });

        const result = validationService.validateImportDataDetailed(incompleteRecipeData);

        // Should have warnings for incomplete recipes
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('Recipe'))).toBe(true);
      });
    });

    describe('Ingredient Validation with Field-Level Errors', () => {
      it('should validate ingredients array structure', () => {
        const invalidIngredientsData = JSON.stringify({
          ingredients: { name: 'Not an array' }
        });

        const result = validationService.validateImportDataDetailed(invalidIngredientsData);

        expect(result.fieldErrors).toContainEqual(
          expect.objectContaining({
            field: 'ingredients',
            error: 'Expected array, got object',
            suggestion: 'Ingredients should be an array: "ingredients": [...]'
          })
        );
      });

      it('should validate individual ingredient objects', () => {
        const invalidIngredientData = JSON.stringify({
          ingredients: [
            null,
            { name: 'Valid Ingredient', category: 'Liquor', unit: 'bottle' },
            { category: 'Liquor' } // missing name
          ]
        });

        const result = validationService.validateImportDataDetailed(invalidIngredientData);

        // Should have field errors for invalid ingredients
        const ingredientErrors = result.fieldErrors.filter(error => error.field.startsWith('ingredients['));
        expect(ingredientErrors.length).toBeGreaterThan(0);
      });
    });

    describe('Menu, Batch, and Technique Validation', () => {
      it('should validate savedMenus structure and content', () => {
        const menuData = JSON.stringify({
          savedMenus: [
            { name: 'Valid Menu', items: [] },
            { items: [] }, // missing name
            "invalid menu"
          ]
        });

        const result = validationService.validateImportDataDetailed(menuData);

        const menuErrors = result.fieldErrors.filter(error => error.field.startsWith('savedMenus['));
        expect(menuErrors.length).toBeGreaterThan(0);
      });

      it('should validate savedBatches structure and content', () => {
        const batchData = JSON.stringify({
          savedBatches: [
            { name: 'Valid Batch', recipes: [] },
            { recipes: [] } // missing name
          ]
        });

        const result = validationService.validateImportDataDetailed(batchData);

        const batchErrors = result.fieldErrors.filter(error => error.field.startsWith('savedBatches['));
        expect(batchErrors.length).toBeGreaterThan(0);
      });

      it('should validate techniques structure and content', () => {
        const techniqueData = JSON.stringify({
          techniques: [
            { name: 'Valid Technique', description: 'Test' },
            { description: 'Test' } // missing name
          ]
        });

        const result = validationService.validateImportDataDetailed(techniqueData);

        const techniqueErrors = result.fieldErrors.filter(error => error.field.startsWith('techniques['));
        expect(techniqueErrors.length).toBeGreaterThan(0);
      });
    });

    describe('Recovery Actions and Suggestions', () => {
      it('should generate appropriate recovery actions for different error types', () => {
        const mixedErrorData = JSON.stringify({
          recipes: "not an array",
          ingredients: [{ category: 'Liquor' }], // missing name
          savedMenus: [{ items: [] }] // missing name
        });

        const result = validationService.validateImportDataDetailed(mixedErrorData);

        expect(result.recoveryActions.length).toBeGreaterThan(0);
        
        // Should have recovery actions for different error types
        const actionTypes = result.recoveryActions.map(action => action.type);
        expect(actionTypes).toContain('array_structure');
      });

      it('should provide specific suggestions for common validation errors', () => {
        const errorData = JSON.stringify({
          recipes: [
            { ingredients: [] } // missing name and other required fields
          ]
        });

        const result = validationService.validateImportDataDetailed(errorData);

        // Should have warnings with suggestions
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('Validation Report and Statistics', () => {
      it('should provide detailed validation statistics', () => {
        const mixedData = JSON.stringify({
          recipes: [
            { name: 'Valid Recipe', version: '1.0', ingredients: [{ name: 'Test', amount: '1', unit: 'oz' }], instructions: 'Test' },
            { name: 'Invalid Recipe' } // missing required fields
          ],
          ingredients: [
            { name: 'Valid Ingredient', category: 'Liquor', unit: 'bottle' },
            { category: 'Liquor' } // missing name
          ]
        });

        const result = validationService.validateImportDataDetailed(mixedData);

        expect(result.validationReport).toBeDefined();
        expect(result.validationReport.totalFields).toBeGreaterThan(0);
        expect(result.validationReport.validFields).toBeGreaterThan(0);
        expect(result.validationReport.invalidFields).toBeGreaterThan(0);
      });
    });

    describe('Backward Compatibility', () => {
      it('should maintain compatibility with original validateImportData', () => {
        const validData = JSON.stringify({
          recipes: [
            { name: 'Test Recipe', version: '1.0', ingredients: [{ name: 'Test', amount: '1', unit: 'oz' }], instructions: 'Test' }
          ]
        });

        const originalResult = validationService.validateImportData(validData);
        const detailedResult = validationService.validateImportDataDetailed(validData);

        // Original function should still work and return expected structure
        expect(originalResult.isValid).toBe(true);
        expect(originalResult.data).toBeDefined();
        expect(originalResult.summary).toBeDefined();
        
        // Results should be consistent
        expect(originalResult.isValid).toBe(detailedResult.isValid);
        expect(originalResult.summary.recipesImported).toBe(detailedResult.summary.recipesImported);
      });
    });
  });
});
