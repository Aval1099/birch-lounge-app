/**
 * Version Comparison Engine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { versionComparisonEngine } from '../../services/versionComparisonEngine.js';
import { recipeVersionService } from '../../services/recipeVersionService.js';
import { createRecipe } from '../../models/index.js';

// Mock recipe version service
vi.mock('../../services/recipeVersionService.js', () => ({
  recipeVersionService: {
    compareVersions: vi.fn()
  }
}));

describe('VersionComparisonEngine', () => {
  let versionA, versionB;

  beforeEach(() => {
    vi.clearAllMocks();

    versionA = createRecipe({
      id: 'recipe-1',
      name: 'Classic Gin & Tonic',
      category: 'Highball',
      ingredients: [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ],
      instructions: ['Add gin to glass', 'Top with tonic water', 'Stir gently'],
      techniques: ['building', 'stirring'],
      difficulty: 'Easy',
      prepTime: 2
    });

    versionB = createRecipe({
      id: 'recipe-1_v1_1',
      name: 'Classic Gin & Tonic',
      category: 'Highball',
      ingredients: [
        { name: 'Gin', amount: 1.5, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' },
        { name: 'Lime Juice', amount: 0.5, unit: 'oz' }
      ],
      instructions: ['Add gin to glass', 'Add lime juice', 'Top with tonic water', 'Stir gently'],
      techniques: ['building', 'stirring'],
      difficulty: 'Easy',
      prepTime: 3
    });

    // Mock basic comparison
    recipeVersionService.compareVersions.mockResolvedValue({
      versionA,
      versionB,
      differences: [
        { field: 'ingredients', valueA: versionA.ingredients, valueB: versionB.ingredients, changeType: 'modified' },
        { field: 'instructions', valueA: versionA.instructions, valueB: versionB.instructions, changeType: 'modified' },
        { field: 'prepTime', valueA: versionA.prepTime, valueB: versionB.prepTime, changeType: 'modified' }
      ],
      similarity: 0.75,
      recommendedAction: 'keep_separate'
    });
  });

  describe('compareVersions', () => {
    it('should enhance basic comparison with detailed analysis', async () => {
      const comparison = await versionComparisonEngine.compareVersions('recipe-1', 'recipe-1_v1_1');

      expect(comparison).toHaveProperty('detailedDifferences');
      expect(comparison).toHaveProperty('ingredientAnalysis');
      expect(comparison).toHaveProperty('instructionDiff');
      expect(comparison).toHaveProperty('semanticSimilarity');
      expect(comparison).toHaveProperty('visualDiff');
    });

    it('should call recipe version service for basic comparison', async () => {
      await versionComparisonEngine.compareVersions('recipe-1', 'recipe-1_v1_1');

      expect(recipeVersionService.compareVersions).toHaveBeenCalledWith('recipe-1', 'recipe-1_v1_1');
    });
  });

  describe('compareIngredients', () => {
    it('should identify added ingredients', () => {
      const ingredientsA = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ];
      const ingredientsB = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' },
        { name: 'Lime Juice', amount: 0.5, unit: 'oz' }
      ];

      const analysis = versionComparisonEngine.compareIngredients(ingredientsA, ingredientsB);

      expect(analysis.added).toHaveLength(1);
      expect(analysis.added[0].name).toBe('Lime Juice');
      expect(analysis.totalChanges).toBe(1);
    });

    it('should identify removed ingredients', () => {
      const ingredientsA = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' },
        { name: 'Lime Juice', amount: 0.5, unit: 'oz' }
      ];
      const ingredientsB = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ];

      const analysis = versionComparisonEngine.compareIngredients(ingredientsA, ingredientsB);

      expect(analysis.removed).toHaveLength(1);
      expect(analysis.removed[0].name).toBe('Lime Juice');
      expect(analysis.totalChanges).toBe(1);
    });

    it('should identify modified ingredients', () => {
      const ingredientsA = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ];
      const ingredientsB = [
        { name: 'Gin', amount: 1.5, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ];

      const analysis = versionComparisonEngine.compareIngredients(ingredientsA, ingredientsB);

      expect(analysis.modified).toHaveLength(1);
      expect(analysis.modified[0].ingredient.name).toBe('Gin');
      expect(analysis.modified[0].changes.hasChanges).toBe(true);
      expect(analysis.modified[0].changes.details.amount).toEqual({
        before: 2,
        after: 1.5
      });
    });

    it('should identify unchanged ingredients', () => {
      const ingredientsA = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ];
      const ingredientsB = [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ];

      const analysis = versionComparisonEngine.compareIngredients(ingredientsA, ingredientsB);

      expect(analysis.unchanged).toHaveLength(2);
      expect(analysis.totalChanges).toBe(0);
    });

    it('should mark significant changes for large amount differences', () => {
      const ingredientA = { name: 'Gin', amount: 2, unit: 'oz' };
      const ingredientB = { name: 'Gin', amount: 0.5, unit: 'oz' };

      const changes = versionComparisonEngine.compareIngredientDetails(ingredientA, ingredientB);

      expect(changes.isSignificant).toBe(true);
    });
  });

  describe('compareInstructions', () => {
    it('should detect no changes when instructions are identical', () => {
      const instructionsA = ['Step 1', 'Step 2', 'Step 3'];
      const instructionsB = ['Step 1', 'Step 2', 'Step 3'];

      const diff = versionComparisonEngine.compareInstructions(instructionsA, instructionsB);

      expect(diff.hasChanges).toBe(false);
    });

    it('should detect step modifications', () => {
      const instructionsA = ['Add gin to glass', 'Top with tonic water'];
      const instructionsB = ['Add gin to glass', 'Top with premium tonic water'];

      const diff = versionComparisonEngine.compareInstructions(instructionsA, instructionsB);

      expect(diff.hasChanges).toBe(true);
      expect(diff.stepChanges).toHaveLength(1);
      expect(diff.stepChanges[0].stepNumber).toBe(2);
      expect(diff.stepChanges[0].before).toBe('Top with tonic water');
      expect(diff.stepChanges[0].after).toBe('Top with premium tonic water');
    });

    it('should detect added steps', () => {
      const instructionsA = ['Add gin to glass', 'Top with tonic water'];
      const instructionsB = ['Add gin to glass', 'Add lime juice', 'Top with tonic water'];

      const diff = versionComparisonEngine.compareInstructions(instructionsA, instructionsB);

      expect(diff.hasChanges).toBe(true);
      expect(diff.addedSteps).toHaveLength(1);
      expect(diff.addedSteps[0].content).toBe('Add lime juice');
    });

    it('should detect removed steps', () => {
      const instructionsA = ['Add gin to glass', 'Add lime juice', 'Top with tonic water'];
      const instructionsB = ['Add gin to glass', 'Top with tonic water'];

      const diff = versionComparisonEngine.compareInstructions(instructionsA, instructionsB);

      expect(diff.hasChanges).toBe(true);
      expect(diff.removedSteps).toHaveLength(1);
      expect(diff.removedSteps[0].content).toBe('Add lime juice');
    });

    it('should handle string instructions', () => {
      const instructionsA = 'Add gin to glass and top with tonic water';
      const instructionsB = 'Add gin to glass and top with premium tonic water';

      const diff = versionComparisonEngine.compareInstructions(instructionsA, instructionsB);

      expect(diff.hasChanges).toBe(true);
      expect(diff.stepChanges).toHaveLength(1);
    });
  });

  describe('calculateSemanticSimilarity', () => {
    it('should calculate overall similarity score', () => {
      const similarity = versionComparisonEngine.calculateSemanticSimilarity(versionA, versionB);

      expect(similarity.overall).toBeGreaterThan(0);
      expect(similarity.overall).toBeLessThanOrEqual(1);
      expect(similarity.components).toHaveProperty('name');
      expect(similarity.components).toHaveProperty('ingredients');
      expect(similarity.components).toHaveProperty('instructions');
      expect(similarity.components).toHaveProperty('techniques');
      expect(similarity.components).toHaveProperty('metadata');
    });

    it('should provide interpretation of similarity score', () => {
      const similarity = versionComparisonEngine.calculateSemanticSimilarity(versionA, versionB);

      expect(similarity.interpretation).toMatch(/identical|similar|different/i);
    });

    it('should return high similarity for identical recipes', () => {
      const similarity = versionComparisonEngine.calculateSemanticSimilarity(versionA, versionA);

      expect(similarity.overall).toBeCloseTo(1, 1);
      expect(similarity.interpretation).toBe('Nearly identical');
    });
  });

  describe('generateVisualDiff', () => {
    it('should generate visual diff with sections', () => {
      const visualDiff = versionComparisonEngine.generateVisualDiff(versionA, versionB);

      expect(visualDiff).toHaveProperty('summary');
      expect(visualDiff).toHaveProperty('sections');
      expect(visualDiff.sections).toHaveProperty('metadata');
      expect(visualDiff.sections).toHaveProperty('ingredients');
      expect(visualDiff.sections).toHaveProperty('instructions');
      expect(visualDiff.sections).toHaveProperty('details');
    });

    it('should detect changes in metadata section', () => {
      const versionWithDifferentMeta = {
        ...versionB,
        difficulty: 'Medium',
        prepTime: 5
      };

      const visualDiff = versionComparisonEngine.generateVisualDiff(versionA, versionWithDifferentMeta);

      expect(visualDiff.sections.metadata.hasChanges).toBe(true);
      expect(visualDiff.sections.metadata.changeCount).toBeGreaterThan(0);
    });
  });

  describe('helper methods', () => {
    describe('calculateTextSimilarity', () => {
      it('should return 1 for identical texts', () => {
        const similarity = versionComparisonEngine.calculateTextSimilarity('hello world', 'hello world');
        expect(similarity).toBe(1);
      });

      it('should return 0 for completely different texts', () => {
        const similarity = versionComparisonEngine.calculateTextSimilarity('hello world', 'foo bar');
        expect(similarity).toBe(0);
      });

      it('should return partial similarity for overlapping texts', () => {
        const similarity = versionComparisonEngine.calculateTextSimilarity('hello world', 'hello universe');
        expect(similarity).toBeGreaterThan(0);
        expect(similarity).toBeLessThan(1);
      });

      it('should handle empty strings', () => {
        expect(versionComparisonEngine.calculateTextSimilarity('', '')).toBe(1);
        expect(versionComparisonEngine.calculateTextSimilarity('hello', '')).toBe(0);
        expect(versionComparisonEngine.calculateTextSimilarity('', 'world')).toBe(0);
      });
    });

    describe('calculateArraySimilarity', () => {
      it('should return 1 for identical arrays', () => {
        const similarity = versionComparisonEngine.calculateArraySimilarity(['a', 'b', 'c'], ['a', 'b', 'c']);
        expect(similarity).toBe(1);
      });

      it('should return 0 for completely different arrays', () => {
        const similarity = versionComparisonEngine.calculateArraySimilarity(['a', 'b'], ['x', 'y']);
        expect(similarity).toBe(0);
      });

      it('should handle empty arrays', () => {
        expect(versionComparisonEngine.calculateArraySimilarity([], [])).toBe(1);
        expect(versionComparisonEngine.calculateArraySimilarity(['a'], [])).toBe(0);
        expect(versionComparisonEngine.calculateArraySimilarity([], ['a'])).toBe(0);
      });
    });

    describe('interpretSimilarity', () => {
      it('should interpret high similarity correctly', () => {
        expect(versionComparisonEngine.interpretSimilarity(0.95)).toBe('Nearly identical');
        expect(versionComparisonEngine.interpretSimilarity(0.8)).toBe('Very similar');
      });

      it('should interpret medium similarity correctly', () => {
        expect(versionComparisonEngine.interpretSimilarity(0.6)).toBe('Moderately similar');
        expect(versionComparisonEngine.interpretSimilarity(0.4)).toBe('Somewhat different');
      });

      it('should interpret low similarity correctly', () => {
        expect(versionComparisonEngine.interpretSimilarity(0.2)).toBe('Very different');
        expect(versionComparisonEngine.interpretSimilarity(0.1)).toBe('Very different');
      });
    });
  });
});
