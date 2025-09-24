/**
 * Recipe Version Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recipeVersionService } from '../../services/recipeVersionService.js';
import { storageService } from '../../services/storageService.js';
import { createRecipe, createVersionMetadata } from '../../models/index.js';

// Mock storage service
vi.mock('../../services/storageService.js', () => ({
  storageService: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe('RecipeVersionService', () => {
  let mockBaseRecipe;
  let mockStorageData;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockBaseRecipe = createRecipe({
      id: 'recipe-1',
      name: 'Classic Gin & Tonic',
      category: 'Highball',
      ingredients: [
        { name: 'Gin', amount: 2, unit: 'oz' },
        { name: 'Tonic Water', amount: 4, unit: 'oz' }
      ],
      instructions: 'Build in glass with ice',
      versionMetadata: createVersionMetadata({
        versionNumber: '1.0',
        isMainVersion: true,
        versionType: 'original'
      })
    });

    mockStorageData = {
      recipe_versions: {
        'recipe-1': mockBaseRecipe
      },
      recipe_families: {
        'recipe-1': {
          id: 'recipe-1',
          name: 'Classic Gin & Tonic',
          mainVersionId: 'recipe-1',
          totalVersions: 1
        }
      },
      version_history: {},
      version_conflicts: {}
    };

    // Setup default mock returns
    storageService.getItem.mockImplementation((key) => {
      return Promise.resolve(mockStorageData[key] || {});
    });
    
    storageService.setItem.mockResolvedValue(undefined);
  });

  describe('createVersion', () => {
    it('should create a new version with proper metadata', async () => {
      const versionData = {
        versionType: 'variation',
        versionName: 'Low ABV Version',
        changeDescription: 'Reduced gin amount for lower alcohol content'
      };

      const recipeChanges = {
        ingredients: [
          { name: 'Gin', amount: 1, unit: 'oz' },
          { name: 'Tonic Water', amount: 5, unit: 'oz' }
        ]
      };

      const newVersion = await recipeVersionService.createVersion(
        mockBaseRecipe,
        versionData,
        recipeChanges
      );

      expect(newVersion).toBeDefined();
      expect(newVersion.id).toMatch(/recipe-1_v1_1/);
      expect(newVersion.versionMetadata.versionType).toBe('variation');
      expect(newVersion.versionMetadata.versionName).toBe('Low ABV Version');
      expect(newVersion.versionMetadata.isMainVersion).toBe(false);
      expect(newVersion.versionMetadata.parentRecipeId).toBe('recipe-1');
      expect(newVersion.ingredients[0].amount).toBe(1);
    });

    it('should update related versions in base recipe', async () => {
      const versionData = { versionType: 'improvement' };
      
      await recipeVersionService.createVersion(mockBaseRecipe, versionData);

      // Check that setItem was called to update the base recipe
      expect(storageService.setItem).toHaveBeenCalledWith(
        'recipe_versions',
        expect.objectContaining({
          'recipe-1': expect.objectContaining({
            relatedVersions: expect.arrayContaining([expect.any(String)])
          })
        })
      );
    });

    it('should record version history entry', async () => {
      const versionData = { versionType: 'seasonal' };
      
      await recipeVersionService.createVersion(mockBaseRecipe, versionData);

      // Check that version history was recorded
      expect(storageService.setItem).toHaveBeenCalledWith(
        'version_history',
        expect.objectContaining({
          [expect.any(String)]: expect.objectContaining({
            action: 'created',
            recipeId: expect.any(String)
          })
        })
      );
    });
  });

  describe('getVersions', () => {
    beforeEach(() => {
      // Add multiple versions to mock data
      mockStorageData.recipe_versions = {
        'recipe-1': mockBaseRecipe,
        'recipe-1_v1_1': createRecipe({
          id: 'recipe-1_v1_1',
          name: 'Classic Gin & Tonic',
          recipeFamily: 'recipe-1',
          versionMetadata: createVersionMetadata({
            versionNumber: '1.1',
            versionType: 'variation',
            isMainVersion: false
          })
        }),
        'recipe-1_v2_0': createRecipe({
          id: 'recipe-1_v2_0',
          name: 'Classic Gin & Tonic',
          recipeFamily: 'recipe-1',
          versionMetadata: createVersionMetadata({
            versionNumber: '2.0',
            versionType: 'improvement',
            isMainVersion: false
          })
        })
      };
    });

    it('should return all versions of a recipe family', async () => {
      const versions = await recipeVersionService.getVersions('recipe-1');

      expect(versions).toHaveLength(3);
      expect(versions[0].versionMetadata.isMainVersion).toBe(true); // Main version first
      expect(versions.map(v => v.versionMetadata.versionNumber)).toEqual(['1.0', '1.1', '2.0']);
    });

    it('should sort versions with main version first', async () => {
      const versions = await recipeVersionService.getVersions('recipe-1');

      expect(versions[0].versionMetadata.isMainVersion).toBe(true);
      expect(versions[0].versionMetadata.versionNumber).toBe('1.0');
    });
  });

  describe('compareVersions', () => {
    let versionA, versionB;

    beforeEach(() => {
      versionA = createRecipe({
        id: 'recipe-1',
        name: 'Classic Gin & Tonic',
        ingredients: [
          { name: 'Gin', amount: 2, unit: 'oz' },
          { name: 'Tonic Water', amount: 4, unit: 'oz' }
        ],
        instructions: 'Build in glass with ice'
      });

      versionB = createRecipe({
        id: 'recipe-1_v1_1',
        name: 'Classic Gin & Tonic',
        ingredients: [
          { name: 'Gin', amount: 1.5, unit: 'oz' },
          { name: 'Tonic Water', amount: 4, unit: 'oz' },
          { name: 'Lime Juice', amount: 0.5, unit: 'oz' }
        ],
        instructions: 'Build in glass with ice, add lime juice'
      });

      mockStorageData.recipe_versions = {
        'recipe-1': versionA,
        'recipe-1_v1_1': versionB
      };
    });

    it('should identify differences between versions', async () => {
      const comparison = await recipeVersionService.compareVersions('recipe-1', 'recipe-1_v1_1');

      expect(comparison.differences).toHaveLength(2); // ingredients and instructions
      expect(comparison.differences.some(d => d.field === 'ingredients')).toBe(true);
      expect(comparison.differences.some(d => d.field === 'instructions')).toBe(true);
    });

    it('should calculate similarity score', async () => {
      const comparison = await recipeVersionService.compareVersions('recipe-1', 'recipe-1_v1_1');

      expect(comparison.similarity).toBeGreaterThan(0);
      expect(comparison.similarity).toBeLessThan(1);
    });

    it('should provide recommended action', async () => {
      const comparison = await recipeVersionService.compareVersions('recipe-1', 'recipe-1_v1_1');

      expect(['merge', 'keep_separate', 'archive_old']).toContain(comparison.recommendedAction);
    });
  });

  describe('setMainVersion', () => {
    beforeEach(() => {
      mockStorageData.recipe_versions = {
        'recipe-1': { ...mockBaseRecipe, versionMetadata: { ...mockBaseRecipe.versionMetadata, isMainVersion: true } },
        'recipe-1_v1_1': createRecipe({
          id: 'recipe-1_v1_1',
          recipeFamily: 'recipe-1',
          versionMetadata: createVersionMetadata({
            versionNumber: '1.1',
            isMainVersion: false
          })
        })
      };
    });

    it('should set new main version and unset old one', async () => {
      await recipeVersionService.setMainVersion('recipe-1_v1_1');

      expect(storageService.setItem).toHaveBeenCalledWith(
        'recipe_versions',
        expect.objectContaining({
          'recipe-1': expect.objectContaining({
            versionMetadata: expect.objectContaining({
              isMainVersion: false
            })
          }),
          'recipe-1_v1_1': expect.objectContaining({
            versionMetadata: expect.objectContaining({
              isMainVersion: true
            })
          })
        })
      );
    });

    it('should update recipe family main version', async () => {
      await recipeVersionService.setMainVersion('recipe-1_v1_1');

      expect(storageService.setItem).toHaveBeenCalledWith(
        'recipe_families',
        expect.objectContaining({
          'recipe-1': expect.objectContaining({
            mainVersionId: 'recipe-1_v1_1'
          })
        })
      );
    });
  });

  describe('archiveVersion', () => {
    beforeEach(() => {
      mockStorageData.recipe_versions = {
        'recipe-1': mockBaseRecipe,
        'recipe-1_v1_1': createRecipe({
          id: 'recipe-1_v1_1',
          versionMetadata: createVersionMetadata({
            versionNumber: '1.1',
            isMainVersion: false,
            versionStatus: 'published'
          })
        })
      };
    });

    it('should archive a non-main version', async () => {
      await recipeVersionService.archiveVersion('recipe-1_v1_1');

      expect(storageService.setItem).toHaveBeenCalledWith(
        'recipe_versions',
        expect.objectContaining({
          'recipe-1_v1_1': expect.objectContaining({
            versionMetadata: expect.objectContaining({
              versionStatus: 'archived'
            })
          })
        })
      );
    });

    it('should throw error when trying to archive main version', async () => {
      await expect(recipeVersionService.archiveVersion('recipe-1')).rejects.toThrow(
        'Cannot archive the main version'
      );
    });

    it('should record archive action in history', async () => {
      await recipeVersionService.archiveVersion('recipe-1_v1_1');

      expect(storageService.setItem).toHaveBeenCalledWith(
        'version_history',
        expect.objectContaining({
          [expect.any(String)]: expect.objectContaining({
            action: 'archived',
            versionId: 'recipe-1_v1_1'
          })
        })
      );
    });
  });

  describe('getVersionHistory', () => {
    beforeEach(() => {
      mockStorageData.version_history = {
        'hist-1': {
          id: 'hist-1',
          recipeId: 'recipe-1',
          action: 'created',
          timestamp: Date.now() - 86400000, // 1 day ago
          changes: ['Initial creation']
        },
        'hist-2': {
          id: 'hist-2',
          recipeId: 'recipe-1',
          action: 'modified',
          timestamp: Date.now() - 3600000, // 1 hour ago
          changes: ['Updated ingredients']
        },
        'hist-3': {
          id: 'hist-3',
          recipeId: 'other-recipe',
          action: 'created',
          timestamp: Date.now(),
          changes: ['Different recipe']
        }
      };
    });

    it('should return history for specific recipe', async () => {
      const history = await recipeVersionService.getVersionHistory('recipe-1');

      expect(history).toHaveLength(2);
      expect(history.every(entry => entry.recipeId === 'recipe-1')).toBe(true);
    });

    it('should sort history by timestamp descending', async () => {
      const history = await recipeVersionService.getVersionHistory('recipe-1');

      expect(history[0].action).toBe('modified'); // Most recent first
      expect(history[1].action).toBe('created');
    });
  });

  describe('getMainVersion', () => {
    beforeEach(() => {
      mockStorageData.recipe_versions = {
        'recipe-1': { ...mockBaseRecipe, versionMetadata: { ...mockBaseRecipe.versionMetadata, isMainVersion: true } },
        'recipe-1_v1_1': createRecipe({
          id: 'recipe-1_v1_1',
          recipeFamily: 'recipe-1',
          versionMetadata: createVersionMetadata({
            versionNumber: '1.1',
            isMainVersion: false
          })
        })
      };
    });

    it('should return the main version of a family', async () => {
      const mainVersion = await recipeVersionService.getMainVersion('recipe-1');

      expect(mainVersion).toBeDefined();
      expect(mainVersion.versionMetadata.isMainVersion).toBe(true);
      expect(mainVersion.id).toBe('recipe-1');
    });

    it('should return first version if no main version set', async () => {
      // Remove main version flag
      mockStorageData.recipe_versions['recipe-1'].versionMetadata.isMainVersion = false;

      const mainVersion = await recipeVersionService.getMainVersion('recipe-1');

      expect(mainVersion).toBeDefined();
      expect(mainVersion.id).toBe('recipe-1'); // First in sorted order
    });

    it('should return null if no versions exist', async () => {
      mockStorageData.recipe_versions = {};

      const mainVersion = await recipeVersionService.getMainVersion('nonexistent');

      expect(mainVersion).toBeNull();
    });
  });
});
