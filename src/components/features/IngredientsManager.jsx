 
import { Beer, CheckSquare, Edit3, Package, Plus, Search, ShoppingCart, Square, Trash2, Wine, X, Zap } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { ActionType, INGREDIENT_CATEGORIES_FLAT } from '../../constants';
import { useDebouncedSearch, useSelectors } from '../../hooks';
import { useApp } from '../../hooks/useApp';
import { createIngredient, validateIngredient } from '../../models';
import { formatCurrency, generateId } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { IngredientSkeleton } from '../ui/SkeletonLoader';

/**
 * Ingredients Manager Component - Reorganized with categorized inventory and ordering system
 */
const IngredientsManager = memo(() => {
  const { state, dispatch } = useApp();
  const { spiritsAndCordials, otherIngredients } = useSelectors();
  const [activeTab, setActiveTab] = useState('ingredients'); // ingredients, beer, wine, liquor
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showOrderingList, setShowOrderingList] = useState(false);
  const [orderingItems, setOrderingItems] = useState(new Set());

  // Debounced search
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    clearSearch
  } = useDebouncedSearch('', 300);

  // Categorize ingredients by type
  const categorizedIngredients = useMemo(() => {
    const allIngredients = [...spiritsAndCordials, ...otherIngredients];

    const categories = {
      ingredients: [], // Non-alcoholic
      beer: [],
      wine: [],
      liquor: []
    };

    allIngredients.forEach(ingredient => {
      const category = ingredient.category.toLowerCase();

      if (category === 'beer') {
        categories.beer.push(ingredient);
      } else if (category === 'wine') {
        categories.wine.push(ingredient);
      } else if (['whiskey', 'gin', 'rum', 'vodka', 'agave', 'cordials/liqueur', 'amari', 'misc spirits'].includes(category)) { // amari = Italian bitter liqueurs (amaro plural) // cspell:ignore amari amaro
        categories.liquor.push(ingredient);
      } else {
        categories.ingredients.push(ingredient);
      }
    });

    // Sort each category alphabetically
    Object.keys(categories).forEach(key => {
      categories[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return categories;
  }, [spiritsAndCordials, otherIngredients]);

  // Filter current tab's ingredients based on search and category
  const filteredIngredients = useMemo(() => {
    let filtered = categorizedIngredients[activeTab] || [];

    // Category filter (for non-alcoholic ingredients)
    if (activeTab === 'ingredients' && selectedCategory !== 'All') {
      filtered = filtered.filter(ing => ing.category === selectedCategory);
    }

    // Search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(ing =>
        ing.name.toLowerCase().includes(term) ||
        ing.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [categorizedIngredients, activeTab, selectedCategory, debouncedSearchTerm]);

  // Ordering system functions
  const toggleOrderingItem = useCallback((ingredientId) => {
    setOrderingItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  }, []);

  const clearOrderingList = useCallback(() => {
    setOrderingItems(new Set());
  }, []);

  const getOrderingList = useCallback(() => {
    const allIngredients = [...spiritsAndCordials, ...otherIngredients];
    return allIngredients.filter(ing => orderingItems.has(ing.id));
  }, [spiritsAndCordials, otherIngredients, orderingItems]);

  // Get categories for current tab
  const getTabCategories = useCallback(() => {
    switch (activeTab) {
      case 'ingredients':
        return ['All', 'Mixers', 'Fresh Ingredients', 'Garnish', 'Bitters', 'Misc'];
      case 'liquor':
        return ['All', 'Whiskey', 'Gin', 'Rum', 'Vodka', 'Agave', 'Cordials/Liqueur', 'Amari', 'Misc'];
      default:
        return ['All'];
    }
  }, [activeTab]);

  const handleCreateIngredient = useCallback(() => {
    setEditingIngredient(null);
    setShowModal(true);
  }, []);

  const handleEditIngredient = useCallback((ingredient) => {
    setEditingIngredient(ingredient);
    setShowModal(true);
  }, []);

  const handleDeleteIngredient = useCallback((ingredientId, ingredientName) => {
    if (window.confirm(`Are you sure you want to delete "${ingredientName}"?`)) {
      dispatch({
        type: ActionType.DELETE_INGREDIENT,
        payload: ingredientId
      });
    }
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingIngredient(null);
  }, []);



  // Show skeleton loading during app initialization
  if (!state.isInitialized) {
    return <IngredientSkeleton count={8} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bar inventory, pricing, and ordering
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowOrderingList(!showOrderingList)}
            variant={showOrderingList ? "primary" : "secondary"}
            ariaLabel="Toggle ordering list"
          >
            <ShoppingCart className="w-4 h-4" />
            Ordering ({orderingItems.size})
          </Button>
          <Button
            onClick={handleCreateIngredient}
            variant="primary"
            ariaLabel="Add new ingredient"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'ingredients', label: 'Ingredients', icon: Package, count: categorizedIngredients.ingredients.length },
            { id: 'beer', label: 'Beer', icon: Beer, count: categorizedIngredients.beer.length },
            { id: 'wine', label: 'Wine', icon: Wine, count: categorizedIngredients.wine.length },
            { id: 'liquor', label: 'Liquor', icon: Zap, count: categorizedIngredients.liquor.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedCategory('All');
                clearSearch();
              }}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Ordering List Modal */}
      {showOrderingList && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Master Ordering List ({orderingItems.size} items)
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={clearOrderingList}
                variant="secondary"
                size="sm"
                disabled={orderingItems.size === 0}
              >
                Clear All
              </Button>
              <Button
                onClick={() => setShowOrderingList(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {orderingItems.size === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No items in ordering list. Click the cart icon next to items to add them.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getOrderingList().map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleOrderingItem(item.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(item.price || 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingredients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categorizedIngredients.ingredients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Beer</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categorizedIngredients.beer.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wine className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wine</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categorizedIngredients.wine.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Liquor</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categorizedIngredients.liquor.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="pr-10"
              aria-label="Search ingredients"
            />

            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
              </div>
            )}

            {searchTerm && !isSearching && (
              <Button
                onClick={clearSearch}
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                ariaLabel="Clear search"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <Select
            label={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Category`}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            {getTabCategories().map(category => (
              <option key={category} value={category}>
                {category === 'All' ? `All ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : category}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredIngredients.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No ingredients found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {debouncedSearchTerm || selectedCategory !== 'All'
                ? 'Try adjusting your filters to see more ingredients.'
                : 'Get started by adding your first ingredient.'}
            </p>
            <Button
              onClick={handleCreateIngredient}
              variant="primary"
              ariaLabel="Add first ingredient"
            >
              <Plus className="w-4 h-4" />
              Add Ingredient
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price per Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ingredient.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {ingredient.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(ingredient.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {ingredient.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        onClick={() => toggleOrderingItem(ingredient.id)}
                        variant="ghost"
                        size="sm"
                        className={orderingItems.has(ingredient.id)
                          ? "text-green-600 hover:text-green-700"
                          : "text-gray-400 hover:text-gray-600"
                        }
                        ariaLabel={`${orderingItems.has(ingredient.id) ? 'Remove from' : 'Add to'} ordering list`}
                      >
                        {orderingItems.has(ingredient.id) ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleEditIngredient(ingredient)}
                          variant="ghost"
                          size="sm"
                          ariaLabel={`Edit ${ingredient.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteIngredient(ingredient.id, ingredient.name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          ariaLabel={`Delete ${ingredient.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <IngredientModal
          ingredient={editingIngredient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
});

/**
 * Ingredient Modal Component
 */
const IngredientModal = memo(({ ingredient, onClose }) => {
  const { dispatch } = useApp();
  const isEditing = Boolean(ingredient);

  const [formData, setFormData] = useState(() => ({
    id: ingredient?.id || generateId('ing'),
    name: ingredient?.name || '',
    price: ingredient?.price || 0,
    unit: ingredient?.unit || 'oz',
    category: ingredient?.category || 'Other'
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ingredientData = createIngredient(formData);
      const validation = validateIngredient(ingredientData);

      if (!validation.isValid) {
        const fieldErrors = {};
        validation.errors.forEach(error => {
          if (error.includes('name')) fieldErrors.name = error;
          else if (error.includes('price')) fieldErrors.price = error;
          else if (error.includes('unit')) fieldErrors.unit = error;
        });
        setErrors(fieldErrors);
        return;
      }

      dispatch({
        type: ActionType.SAVE_INGREDIENT,
        payload: ingredientData
      });

      onClose();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, dispatch, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Ingredient Name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="e.g., Bourbon"
            maxLength={50}
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            required
          >
            {INGREDIENT_CATEGORIES_FLAT.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price per Unit"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
              error={errors.price}
              placeholder="0.00"
            />

            <Input
              label="Unit"
              value={formData.unit}
              onChange={(e) => handleFieldChange('unit', e.target.value)}
              error={errors.unit}
              required
              placeholder="oz"
              maxLength={10}
            />
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
              disabled={isSubmitting}
            >
              {isEditing ? 'Update' : 'Add'} Ingredient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

IngredientsManager.displayName = 'IngredientsManager';
IngredientModal.displayName = 'IngredientModal';

export default IngredientsManager;
