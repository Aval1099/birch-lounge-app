/* eslint-disable unused-imports/no-unused-imports */
import { Calculator, Clock, DollarSign, FileText, Minus, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { ActionType } from '../../constants';
import { useSelectors } from '../../hooks';
import { useApp } from '../../hooks/useApp';
import { formatCurrency, generateId, safeParseInt } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

/**
 * Batch Scaling Calculator Component - Recipe scaling functionality with serving calculations
 */
const BatchScalingCalculator = memo(() => {
  const { state, dispatch } = useApp();
  const { batchScaling, savedBatches } = state;
  const { selectRecipeGroups, scaleRecipe, calculateRecipeCost } = useSelectors();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Get all available recipes
  const allRecipes = useMemo(() => {
    return Object.values(selectRecipeGroups).flat();
  }, [selectRecipeGroups]);

  // Calculate scaled recipe and costs
  const scaledIngredients = useMemo(() => {
    if (!batchScaling.recipe) return [];
    return scaleRecipe(batchScaling.recipe, batchScaling.servings);
  }, [batchScaling.recipe, batchScaling.servings, scaleRecipe]);

  const costs = useMemo(() => {
    if (!batchScaling.recipe) {
      return { originalCost: 0, scaledCost: 0, costPerServing: 0 };
    }

    const originalCost = calculateRecipeCost(batchScaling.recipe.ingredients);
    const scaledCost = calculateRecipeCost(scaledIngredients);
    const costPerServing = scaledCost / Math.max(1, batchScaling.servings);

    return { originalCost, scaledCost, costPerServing };
  }, [batchScaling.recipe, scaledIngredients, batchScaling.servings, calculateRecipeCost]);

  const handleSelectRecipe = useCallback((recipeId) => {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (recipe) {
      dispatch({
        type: ActionType.SET_BATCH_RECIPE,
        payload: recipe
      });
    }
  }, [allRecipes, dispatch]);

  const handleServingsChange = useCallback((servings) => {
    dispatch({
      type: ActionType.UPDATE_BATCH_SERVINGS,
      payload: servings
    });
  }, [dispatch]);

  const handleClearBatch = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the current batch?')) {
      dispatch({
        type: ActionType.CLEAR_BATCH
      });
    }
  }, [dispatch]);

  const handleSaveBatch = useCallback(() => {
    if (!batchScaling.recipe) {
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'Please select a recipe first.',
          type: 'error'
        }
      });
      return;
    }
    setShowSaveModal(true);
  }, [batchScaling.recipe, dispatch]);

  const handleLoadBatch = useCallback(() => {
    setShowLoadModal(true);
  }, []);

  const handlePrintBatch = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Batch Scaling Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Scale recipes for large batches and events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleLoadBatch}
            variant="ghost"
            ariaLabel="Load saved batch"
          >
            <FileText className="w-4 h-4" />
            Load Batch
          </Button>
          <Button
            onClick={handleSaveBatch}
            variant="primary"
            disabled={!batchScaling.recipe}
            ariaLabel="Save current batch"
          >
            <Save className="w-4 h-4" />
            Save Batch
          </Button>
        </div>
      </div>

      {/* Recipe Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recipe Selection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Select Recipe"
            value={batchScaling.recipe?.id || ''}
            onChange={(e) => handleSelectRecipe(e.target.value)}
            placeholder="Choose a recipe to scale"
          >
            <option value="">Select a recipe...</option>
            {allRecipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name} - {recipe.version}
              </option>
            ))}
          </Select>

          {batchScaling.recipe && (
            <div className="flex items-center gap-2 pt-6">
              <Button
                onClick={handleClearBatch}
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                ariaLabel="Clear current batch"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {batchScaling.recipe && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              {batchScaling.recipe.name} - {batchScaling.recipe.version}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <p className="font-medium">{batchScaling.recipe.category}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Original Yield:</span>
                <p className="font-medium">{batchScaling.recipe.yields || 1} serving{(batchScaling.recipe.yields || 1) !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Prep Time:</span>
                <p className="font-medium">{batchScaling.recipe.prepTime || 0} min</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Original Cost:</span>
                <p className="font-medium">{formatCurrency(costs.originalCost)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {batchScaling.recipe && (
        <>
          {/* Scaling Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Batch Scaling
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Servings Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Servings
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleServingsChange(Math.max(1, batchScaling.servings - 1))}
                    variant="ghost"
                    size="sm"
                    disabled={batchScaling.servings <= 1}
                    ariaLabel="Decrease servings"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={batchScaling.servings}
                    onChange={(e) => handleServingsChange(safeParseInt(e.target.value, 1))}
                    className="w-24 text-center"
                    aria-label="Number of servings"
                  />

                  <Button
                    onClick={() => handleServingsChange(batchScaling.servings + 1)}
                    variant="ghost"
                    size="sm"
                    ariaLabel="Increase servings"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Scale factor: {(batchScaling.servings / (batchScaling.recipe.yields || 1)).toFixed(2)}x
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[10, 25, 50, 100].map((preset) => (
                    <Button
                      key={preset}
                      onClick={() => handleServingsChange(preset)}
                      variant={batchScaling.servings === preset ? 'primary' : 'ghost'}
                      size="sm"
                      ariaLabel={`Set to ${preset} servings`}
                    >
                      {preset} servings
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Batch Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Batch Statistics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {batchScaling.servings}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Servings</p>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(costs.scaledCost)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(costs.costPerServing)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cost per Serving</p>
              </div>

              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round((batchScaling.recipe.prepTime || 0) * (batchScaling.servings / (batchScaling.recipe.yields || 1)))}m
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Est. Prep Time</p>
              </div>
            </div>
          </div>

          {/* Scaled Ingredients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Scaled Ingredients
              </h2>
              <Button
                onClick={handlePrintBatch}
                variant="ghost"
                size="sm"
                ariaLabel="Print batch recipe"
              >
                <FileText className="w-4 h-4" />
                Print
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {scaledIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {ingredient.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        (was {batchScaling.recipe.ingredients[index]?.amount} {batchScaling.recipe.ingredients[index]?.unit})
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              {batchScaling.recipe.instructions && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Instructions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {batchScaling.recipe.instructions}
                  </p>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Note: Instructions may need adjustment for batch preparation.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showSaveModal && (
        <SaveBatchModal
          batchScaling={batchScaling}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showLoadModal && (
        <LoadBatchModal
          savedBatches={savedBatches}
          onClose={() => setShowLoadModal(false)}
        />
      )}
    </div>
  );
});

/**
 * Save Batch Modal Component
 */
const SaveBatchModal = memo(({ batchScaling, onClose }) => {
  const { dispatch } = useApp();
  const [batchName, setBatchName] = useState(batchScaling.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!batchName.trim()) return;

    setIsSubmitting(true);

    try {
      const batchToSave = {
        id: generateId('batch'),
        name: batchName.trim(),
        recipe: batchScaling.recipe,
        servings: batchScaling.servings,
        createdAt: Date.now()
      };

      dispatch({
        type: ActionType.SAVE_BATCH,
        payload: batchToSave
      });

      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: `Batch "${batchName}" saved successfully!`,
          type: 'success'
        }
      });

      onClose();
    } catch (error) {
      console.error('Error saving batch:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [batchName, batchScaling, dispatch, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-batch-modal-title"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="save-batch-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Save Batch
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            ariaLabel="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <Input
            label="Batch Name"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            required
            placeholder="e.g., Wedding Reception - 100 servings"
            maxLength={100}
            autoFocus
          />

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Recipe: {batchScaling.recipe.name} ({batchScaling.servings} servings)
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting || !batchName.trim()}
            >
              <Save className="w-4 h-4" />
              Save Batch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

/**
 * Load Batch Modal Component
 */
const LoadBatchModal = memo(({ savedBatches, onClose }) => {
  const { dispatch } = useApp();

  const handleLoadBatch = useCallback((batch) => {
    dispatch({
      type: ActionType.LOAD_BATCH,
      payload: batch
    });

    dispatch({
      type: ActionType.SET_NOTIFICATION,
      payload: {
        message: `Batch "${batch.name}" loaded successfully!`,
        type: 'success'
      }
    });

    onClose();
  }, [dispatch, onClose]);

  const handleDeleteBatch = useCallback((batchId, batchName) => {
    if (window.confirm(`Are you sure you want to delete "${batchName}"?`)) {
      dispatch({
        type: ActionType.DELETE_BATCH,
        payload: batchId
      });
    }
  }, [dispatch]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="load-batch-modal-title"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="load-batch-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Load Saved Batch
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            ariaLabel="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {savedBatches.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No saved batches found. Create and save a batch first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {batch.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {batch.recipe.name} • {batch.servings} servings •
                      Created {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleLoadBatch(batch)}
                      variant="primary"
                      size="sm"
                      ariaLabel={`Load ${batch.name}`}
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => handleDeleteBatch(batch.id, batch.name)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      ariaLabel={`Delete ${batch.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BatchScalingCalculator.displayName = 'BatchScalingCalculator';
SaveBatchModal.displayName = 'SaveBatchModal';
LoadBatchModal.displayName = 'LoadBatchModal';

export default BatchScalingCalculator;
