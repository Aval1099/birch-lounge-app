import { memo, useCallback, useEffect, useState } from 'react';

import { ActionType, DIFFICULTY_LEVELS, FLAVOR_PROFILES, INGREDIENT_CATEGORIES_FLAT, UNITS } from '../../constants';
import { useRecipeAutosave } from '../../hooks';
import { useApp } from '../../hooks/useApp';
import { createRecipe, validateRecipe } from '../../models';
import { generateId } from '../../utils';

/**
 * Recipe Modal Component - Create/Edit Recipe Form
 */
const RecipeModal = memo(({ recipe, onClose }) => {
  const { state, dispatch } = useApp();
  const { theme } = state;
  const isEditing = Boolean(recipe);

  // Form state
  const [formData, setFormData] = useState(() => ({
    id: recipe?.id || generateId('recipe'),
    name: recipe?.name || '',
    version: recipe?.version || '',
    category: recipe?.category || '',
    source: recipe?.source || 'Original',
    isOriginalVersion: recipe?.isOriginalVersion || false,
    flavorProfile: recipe?.flavorProfile || [],
    ingredients: recipe?.ingredients || [{ id: generateId('ing'), name: '', amount: '', unit: 'oz' }],
    instructions: recipe?.instructions || '',
    glassware: recipe?.glassware || '',
    garnish: recipe?.garnish || '',
    prepTime: recipe?.prepTime || 0,
    difficulty: recipe?.difficulty || 'Easy',
    notes: recipe?.notes || '',
    anecdotes: recipe?.anecdotes || '',
    history: recipe?.history || '',
    tags: recipe?.tags || [],
    yields: recipe?.yields || 1
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Autosave functionality
  const {
    autosaveStatus,
    lastSaved,
    hasUnsavedChanges,
    error: autosaveError,
    saveNow,
    forceSave,
    resetAutosave,
    loadDraft,
    clearDraft,
    hasDraft
  } = useRecipeAutosave(formData, formData.id, {
    enabled: true,
    skipInitial: true,
    onSaveStart: () => {
      console.log('Autosave started');
    },
    onSaveSuccess: () => {
      console.log('Autosave completed');
    },
    onSaveError: (error) => {
      console.error('Autosave failed:', error);
    }
  });

  // Load draft on component mount if available
  useEffect(() => {
    if (!isEditing && hasDraft()) {
      const draft = loadDraft();
      if (draft && window.confirm('A draft of this recipe was found. Would you like to restore it?')) {
        setFormData(draft);
        resetAutosave();
      }
    }
  }, [isEditing, hasDraft, loadDraft, resetAutosave]);

  // Handle form field changes
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Handle ingredient changes
  const handleIngredientChange = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  }, []);

  // Add new ingredient
  const handleAddIngredient = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        id: generateId('ing'),
        name: '',
        amount: '',
        unit: 'oz'
      }]
    }));
  }, []);

  // Remove ingredient
  const handleRemoveIngredient = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  }, []);

  // Handle flavor profile toggle
  const handleFlavorProfileToggle = useCallback((flavor) => {
    setFormData(prev => ({
      ...prev,
      flavorProfile: prev.flavorProfile.includes(flavor)
        ? prev.flavorProfile.filter(f => f !== flavor)
        : [...prev.flavorProfile, flavor]
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const recipeData = createRecipe(formData);
      const validation = validateRecipe(recipeData);

      if (!validation.isValid) {
        const fieldErrors = {};
        validation.errors.forEach(error => {
          if (error.includes('name')) fieldErrors.name = error;
          else if (error.includes('version')) fieldErrors.version = error;
          else if (error.includes('ingredient')) fieldErrors.ingredients = error;
          else if (error.includes('instructions')) fieldErrors.instructions = error;
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      dispatch({
        type: ActionType.SAVE_RECIPE,
        payload: recipeData
      });

      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: `Recipe "${recipeData.name}" ${isEditing ? 'updated' : 'created'} successfully!`,
          type: 'success'
        }
      });

      // Clear draft after successful save
      clearDraft();

      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'Failed to save recipe. Please try again.',
          type: 'error'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, dispatch, isEditing, onClose, clearDraft]);

  // Handle modal close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [isSubmitting, hasUnsavedChanges, onClose]);

  // Confirm close without saving
  const handleConfirmClose = useCallback(() => {
    clearDraft();
    onClose();
  }, [clearDraft, onClose]);

  // Save and close
  const handleSaveAndClose = useCallback(async () => {
    try {
      await forceSave();
      onClose();
    } catch (error) {
      console.error('Failed to save before closing:', error);
    }
  }, [forceSave, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      }}
      tabIndex={-1}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-modal-title"
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${theme === 'dark' ? 'border border-gray-700' : ''
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 id="recipe-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
            <CompactAutosaveIndicator
              status={autosaveStatus}
              lastSaved={lastSaved}
              hasUnsavedChanges={hasUnsavedChanges}
              error={autosaveError}
            />
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            className="p-2"
            disabled={isSubmitting}
            ariaLabel="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Recipe Name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                error={errors.name}
                required
                placeholder="e.g., Old Fashioned"
                maxLength={100}
              />

              <Input
                label="Version"
                value={formData.version}
                onChange={(e) => handleFieldChange('version', e.target.value)}
                error={errors.version}
                required
                placeholder="e.g., Classic, House Special"
                maxLength={50}
              />
            </div>

            {/* Autosave Status */}
            <DetailedAutosaveIndicator
              status={autosaveStatus}
              lastSaved={lastSaved}
              hasUnsavedChanges={hasUnsavedChanges}
              error={autosaveError}
              onSaveNow={saveNow}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {INGREDIENT_CATEGORIES_FLAT.slice(0, 11).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>

              <Input
                label="Source"
                value={formData.source}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                placeholder="e.g., Death & Co, Original"
                maxLength={50}
              />

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isOriginalVersion"
                  checked={formData.isOriginalVersion}
                  onChange={(e) => handleFieldChange('isOriginalVersion', e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isOriginalVersion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Original Version
                </label>
              </div>
            </div>

            {/* Flavor Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Flavor Profile
              </label>
              <div className="flex flex-wrap gap-2">
                {FLAVOR_PROFILES.map(flavor => (
                  <button
                    key={flavor}
                    type="button"
                    onClick={() => handleFlavorProfileToggle(flavor)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${formData.flavorProfile.includes(flavor)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ingredients
                </label>
                <Button
                  type="button"
                  onClick={handleAddIngredient}
                  variant="ghost"
                  size="sm"
                  ariaLabel="Add ingredient"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </Button>
              </div>

              {errors.ingredients && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600 dark:text-red-400">{errors.ingredients}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="Amount"
                        value={ingredient.amount}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        required
                      >
                        {UNITS.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-1">
                      {formData.ingredients.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          variant="ghost"
                          className="p-2 text-red-600 hover:text-red-700"
                          aria-label="Remove ingredient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <Textarea
              label="Instructions"
              value={formData.instructions}
              onChange={(e) => handleFieldChange('instructions', e.target.value)}
              error={errors.instructions}
              required
              rows={4}
              placeholder="Step-by-step preparation instructions..."
              maxLength={2000}
              showCharCount
            />

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Glassware"
                value={formData.glassware}
                onChange={(e) => handleFieldChange('glassware', e.target.value)}
                placeholder="e.g., Coupe, Rocks Glass"
                maxLength={50}
              />

              <Input
                label="Garnish"
                value={formData.garnish}
                onChange={(e) => handleFieldChange('garnish', e.target.value)}
                placeholder="e.g., Orange Peel, Cherry"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Prep Time (minutes)"
                type="number"
                min="0"
                value={formData.prepTime}
                onChange={(e) => handleFieldChange('prepTime', parseInt(e.target.value) || 0)}
              />

              <Select
                label="Difficulty"
                value={formData.difficulty}
                onChange={(e) => handleFieldChange('difficulty', e.target.value)}
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>

              <Input
                label="Yields (servings)"
                type="number"
                min="1"
                value={formData.yields}
                onChange={(e) => handleFieldChange('yields', parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Optional Fields */}
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about the recipe..."
              maxLength={1000}
              showCharCount
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={handleClose}
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Update Recipe' : 'Create Recipe'}
            </Button>
          </div>
        </form>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Unsaved Changes
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You have unsaved changes to this recipe. What would you like to do?
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setShowUnsavedWarning(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmClose}
                  variant="secondary"
                >
                  Discard Changes
                </Button>
                <Button
                  onClick={handleSaveAndClose}
                  variant="primary"
                >
                  <Save className="w-4 h-4" />
                  Save & Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RecipeModal.displayName = 'RecipeModal';

export default RecipeModal;
