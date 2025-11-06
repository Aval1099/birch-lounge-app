/**
 * Version Comparison Engine
 *
 * Advanced comparison engine for recipe versions with:
 * - Detailed field-by-field comparison
 * - Ingredient-level analysis
 * - Instruction diff generation
 * - Semantic similarity scoring
 * - Visual diff formatting
 */

import { recipeVersionService } from './recipeVersionService.js';

class VersionComparisonEngine {
  constructor() {
    this.comparisonWeights = {
      name: 0.1,
      ingredients: 0.4,
      instructions: 0.3,
      techniques: 0.1,
      metadata: 0.1
    };
  }

  /**
   * Perform comprehensive comparison between two recipe versions
   * @param {string} versionAId - First version ID
   * @param {string} versionBId - Second version ID
   * @returns {Promise<Object>} Detailed comparison result
   */
  async compareVersions(versionAId, versionBId) {
    const basicComparison = await recipeVersionService.compareVersions(versionAId, versionBId);

    // Enhance with detailed analysis
    const enhancedComparison = {
      ...basicComparison,
      detailedDifferences: await this.generateDetailedDifferences(
        basicComparison.versionA,
        basicComparison.versionB
      ),
      ingredientAnalysis: this.compareIngredients(
        basicComparison.versionA.ingredients,
        basicComparison.versionB.ingredients
      ),
      instructionDiff: this.compareInstructions(
        basicComparison.versionA.instructions,
        basicComparison.versionB.instructions
      ),
      semanticSimilarity: this.calculateSemanticSimilarity(
        basicComparison.versionA,
        basicComparison.versionB
      ),
      visualDiff: this.generateVisualDiff(
        basicComparison.versionA,
        basicComparison.versionB
      )
    };

    return enhancedComparison;
  }

  /**
   * Generate detailed field-by-field differences
   * @param {Object} versionA - First version
   * @param {Object} versionB - Second version
   * @returns {Promise<Object>} Detailed differences
   */
  async generateDetailedDifferences(versionA, versionB) {
    const differences = {
      metadata: {},
      content: {},
      structure: {}
    };

    // Metadata differences
    const metadataFields = ['name', 'category', 'difficulty', 'prepTime', 'yields', 'abv'];
    metadataFields.forEach(field => {
      if (versionA[field] !== versionB[field]) {
        differences.metadata[field] = {
          before: versionA[field],
          after: versionB[field],
          changeType: this.getChangeType(versionA[field], versionB[field])
        };
      }
    });

    // Content differences
    const contentFields = ['description', 'notes', 'glassware', 'garnish'];
    contentFields.forEach(field => {
      if (versionA[field] !== versionB[field]) {
        differences.content[field] = {
          before: versionA[field],
          after: versionB[field],
          changeType: this.getChangeType(versionA[field], versionB[field]),
          textDiff: this.generateTextDiff(versionA[field] || '', versionB[field] || '')
        };
      }
    });

    // Array field differences
    const arrayFields = ['tags', 'flavorProfile', 'techniques'];
    arrayFields.forEach(field => {
      const arrayDiff = this.compareArrays(versionA[field] || [], versionB[field] || []);
      if (arrayDiff.hasChanges) {
        differences.structure[field] = arrayDiff;
      }
    });

    return differences;
  }

  /**
   * Compare ingredients between versions
   * @param {Array} ingredientsA - First version ingredients
   * @param {Array} ingredientsB - Second version ingredients
   * @returns {Object} Ingredient comparison result
   */
  compareIngredients(ingredientsA = [], ingredientsB = []) {
    const analysis = {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
      totalChanges: 0,
      significantChanges: 0
    };

    // Create maps for easier comparison
    const mapA = new Map(ingredientsA.map(ing => [ing.name?.toLowerCase(), ing]));
    const mapB = new Map(ingredientsB.map(ing => [ing.name?.toLowerCase(), ing]));

    // Find added ingredients
    mapB.forEach((ingredient, name) => {
      if (!mapA.has(name)) {
        analysis.added.push(ingredient);
        analysis.totalChanges++;
      }
    });

    // Find removed and modified ingredients
    mapA.forEach((ingredientA, name) => {
      if (!mapB.has(name)) {
        analysis.removed.push(ingredientA);
        analysis.totalChanges++;
      } else {
        const ingredientB = mapB.get(name);
        const changes = this.compareIngredientDetails(ingredientA, ingredientB);

        if (changes.hasChanges) {
          analysis.modified.push({
            ingredient: ingredientA,
            changes
          });
          analysis.totalChanges++;

          if (changes.isSignificant) {
            analysis.significantChanges++;
          }
        } else {
          analysis.unchanged.push(ingredientA);
        }
      }
    });

    return analysis;
  }

  /**
   * Compare individual ingredient details
   * @param {Object} ingredientA - First ingredient
   * @param {Object} ingredientB - Second ingredient
   * @returns {Object} Ingredient detail comparison
   */
  compareIngredientDetails(ingredientA, ingredientB) {
    const changes = {
      hasChanges: false,
      isSignificant: false,
      details: {}
    };

    const fields = ['amount', 'unit', 'notes', 'optional'];

    fields.forEach(field => {
      if (ingredientA[field] !== ingredientB[field]) {
        changes.hasChanges = true;
        changes.details[field] = {
          before: ingredientA[field],
          after: ingredientB[field]
        };

        // Amount changes are considered significant
        if (field === 'amount' && Math.abs((ingredientA[field] || 0) - (ingredientB[field] || 0)) > 0.25) {
          changes.isSignificant = true;
        }
      }
    });

    return changes;
  }

  /**
   * Compare instructions between versions
   * @param {string|Array} instructionsA - First version instructions
   * @param {string|Array} instructionsB - Second version instructions
   * @returns {Object} Instruction comparison result
   */
  compareInstructions(instructionsA, instructionsB) {
    const stepsA = Array.isArray(instructionsA) ? instructionsA : [instructionsA].filter(Boolean);
    const stepsB = Array.isArray(instructionsB) ? instructionsB : [instructionsB].filter(Boolean);

    const diff = {
      hasChanges: false,
      stepChanges: [],
      addedSteps: [],
      removedSteps: [],
      reorderedSteps: []
    };

    let indexA = 0;
    let indexB = 0;

    while (indexA < stepsA.length || indexB < stepsB.length) {
      const stepA = stepsA[indexA];
      const stepB = stepsB[indexB];

      if (stepA === undefined && stepB !== undefined) {
        diff.hasChanges = true;
        diff.addedSteps.push({
          stepNumber: indexB + 1,
          content: stepB
        });
        indexB += 1;
        continue;
      }

      if (stepB === undefined && stepA !== undefined) {
        diff.hasChanges = true;
        diff.removedSteps.push({
          stepNumber: indexA + 1,
          content: stepA
        });
        indexA += 1;
        continue;
      }

      if (stepA === stepB) {
        indexA += 1;
        indexB += 1;
        continue;
      }

      const nextStepA = stepsA[indexA + 1];
      const nextStepB = stepsB[indexB + 1];

      if (stepB !== undefined && nextStepB === stepA) {
        diff.hasChanges = true;
        diff.addedSteps.push({
          stepNumber: indexB + 1,
          content: stepB
        });
        indexB += 1;
        continue;
      }

      if (stepA !== undefined && nextStepA === stepB) {
        diff.hasChanges = true;
        diff.removedSteps.push({
          stepNumber: indexA + 1,
          content: stepA
        });
        indexA += 1;
        continue;
      }

      diff.hasChanges = true;
      diff.stepChanges.push({
        stepNumber: indexA + 1,
        before: stepA,
        after: stepB,
        textDiff: this.generateTextDiff(stepA || '', stepB || '')
      });
      indexA += 1;
      indexB += 1;
    }

    if (
      diff.stepChanges.length === 0 &&
      diff.addedSteps.length === 0 &&
      diff.removedSteps.length === 0 &&
      diff.reorderedSteps.length === 0
    ) {
      diff.hasChanges = false;
    }

    return diff;
  }

  /**
   * Calculate semantic similarity between versions
   * @param {Object} versionA - First version
   * @param {Object} versionB - Second version
   * @returns {Object} Semantic similarity analysis
   */
  calculateSemanticSimilarity(versionA, versionB) {
    const scores = {};
    let weightedTotal = 0;

    // Calculate similarity for each weighted component
    Object.entries(this.comparisonWeights).forEach(([component, weight]) => {
      let similarity = 0;

      switch (component) {
        case 'name':
          similarity = this.calculateTextSimilarity(versionA.name || '', versionB.name || '');
          break;
        case 'ingredients':
          similarity = this.calculateIngredientSimilarity(versionA.ingredients, versionB.ingredients);
          break;
        case 'instructions':
          similarity = this.calculateTextSimilarity(
            Array.isArray(versionA.instructions) ? versionA.instructions.join(' ') : versionA.instructions || '',
            Array.isArray(versionB.instructions) ? versionB.instructions.join(' ') : versionB.instructions || ''
          );
          break;
        case 'techniques':
          similarity = this.calculateArraySimilarity(versionA.techniques || [], versionB.techniques || []);
          break;
        case 'metadata':
          similarity = this.calculateMetadataSimilarity(versionA, versionB);
          break;
      }

      scores[component] = similarity;
      weightedTotal += similarity * weight;
    });

    return {
      overall: weightedTotal,
      components: scores,
      interpretation: this.interpretSimilarity(weightedTotal)
    };
  }

  /**
   * Generate visual diff representation
   * @param {Object} versionA - First version
   * @param {Object} versionB - Second version
   * @returns {Object} Visual diff data
   */
  generateVisualDiff(versionA, versionB) {
    return {
      summary: {
        totalChanges: 0, // Will be calculated
        majorChanges: 0,
        minorChanges: 0
      },
      sections: {
        metadata: this.generateSectionDiff('metadata', versionA, versionB),
        ingredients: this.generateSectionDiff('ingredients', versionA, versionB),
        instructions: this.generateSectionDiff('instructions', versionA, versionB),
        details: this.generateSectionDiff('details', versionA, versionB)
      }
    };
  }

  /**
   * Generate section-specific diff
   * @param {string} section - Section name
   * @param {Object} versionA - First version
   * @param {Object} versionB - Second version
   * @returns {Object} Section diff
   */
  generateSectionDiff(section, versionA, versionB) {
    const diff = {
      hasChanges: false,
      changes: [],
      changeCount: 0
    };

    switch (section) {
      case 'metadata':
        ['name', 'category', 'difficulty', 'prepTime', 'yields'].forEach(field => {
          if (versionA[field] !== versionB[field]) {
            diff.hasChanges = true;
            diff.changes.push({
              field,
              type: 'modified',
              before: versionA[field],
              after: versionB[field]
            });
            diff.changeCount++;
          }
        });
        break;

      case 'ingredients': {
        const ingredientDiff = this.compareIngredients(versionA.ingredients, versionB.ingredients);
        diff.hasChanges = ingredientDiff.totalChanges > 0;
        diff.changeCount = ingredientDiff.totalChanges;
        diff.changes = [
          ...ingredientDiff.added.map(ing => ({ type: 'added', ingredient: ing })),
          ...ingredientDiff.removed.map(ing => ({ type: 'removed', ingredient: ing })),
          ...ingredientDiff.modified.map(mod => ({ type: 'modified', ...mod }))
        ];
        break;
      }

      case 'instructions': {
        const instructionDiff = this.compareInstructions(versionA.instructions, versionB.instructions);
        diff.hasChanges = instructionDiff.hasChanges;
        diff.changeCount = instructionDiff.stepChanges.length +
          instructionDiff.addedSteps.length +
          instructionDiff.removedSteps.length;
        diff.changes = [
          ...instructionDiff.stepChanges.map(change => ({ type: 'modified', ...change })),
          ...instructionDiff.addedSteps.map(step => ({ type: 'added', ...step })),
          ...instructionDiff.removedSteps.map(step => ({ type: 'removed', ...step }))
        ];
        break;
      }
    }

    return diff;
  }

  // Helper methods
  getChangeType(valueA, valueB) {
    if (!valueA && valueB) return 'added';
    if (valueA && !valueB) return 'removed';
    return 'modified';
  }

  generateTextDiff(textA, textB) {
    // Simple word-level diff
    const wordsA = textA.split(/\s+/);
    const wordsB = textB.split(/\s+/);

    return {
      added: wordsB.filter(word => !wordsA.includes(word)),
      removed: wordsA.filter(word => !wordsB.includes(word)),
      common: wordsA.filter(word => wordsB.includes(word))
    };
  }

  compareArrays(arrayA, arrayB) {
    const setA = new Set(arrayA);
    const setB = new Set(arrayB);

    return {
      hasChanges: arrayA.length !== arrayB.length ||
        arrayA.some(item => !setB.has(item)),
      added: arrayB.filter(item => !setA.has(item)),
      removed: arrayA.filter(item => !setB.has(item)),
      common: arrayA.filter(item => setB.has(item))
    };
  }

  calculateTextSimilarity(textA, textB) {
    if (!textA && !textB) return 1;
    if (!textA || !textB) return 0;

    const wordsA = new Set(textA.toLowerCase().split(/\s+/));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  calculateIngredientSimilarity(ingredientsA = [], ingredientsB = []) {
    if (ingredientsA.length === 0 && ingredientsB.length === 0) return 1;
    if (ingredientsA.length === 0 || ingredientsB.length === 0) return 0;

    const namesA = new Set(ingredientsA.map(ing => ing.name?.toLowerCase()));
    const namesB = new Set(ingredientsB.map(ing => ing.name?.toLowerCase()));
    const intersection = new Set([...namesA].filter(name => namesB.has(name)));
    const union = new Set([...namesA, ...namesB]);

    return intersection.size / union.size;
  }

  calculateArraySimilarity(arrayA, arrayB) {
    if (arrayA.length === 0 && arrayB.length === 0) return 1;
    if (arrayA.length === 0 || arrayB.length === 0) return 0;

    const setA = new Set(arrayA.map(item => item.toLowerCase()));
    const setB = new Set(arrayB.map(item => item.toLowerCase()));
    const intersection = new Set([...setA].filter(item => setB.has(item)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  calculateMetadataSimilarity(versionA, versionB) {
    const fields = ['category', 'difficulty', 'glassware', 'garnish'];
    let matches = 0;

    fields.forEach(field => {
      if (versionA[field] === versionB[field]) {
        matches++;
      }
    });

    return matches / fields.length;
  }

  interpretSimilarity(score) {
    if (score >= 0.9) return 'Nearly identical';
    if (score >= 0.7) return 'Very similar';
    if (score >= 0.5) return 'Moderately similar';
    if (score >= 0.3) return 'Somewhat different';
    return 'Very different';
  }
}

// Export singleton instance
export const versionComparisonEngine = new VersionComparisonEngine();
export default versionComparisonEngine;
