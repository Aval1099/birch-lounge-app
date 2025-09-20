import {
  Blend,
  BookOpen,
  ChefHat,
  Droplets,
  Flame,
  Plus,
  Scissors,
  Star,
  Thermometer, Timer,
  Zap
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { ActionType } from '../../constants';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { useApp } from '../../hooks/useApp';

/**
 * Techniques Manager Component - Comprehensive bartending techniques library
 */
const TechniquesManager = memo(() => {
  const { state, dispatch } = useApp();
  const { techniques = [] } = state;
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'detail'

  // Advanced search configuration
  const searchOptions = {
    searchFields: ['name', 'description', 'category', 'tags', 'equipment', 'steps.description'],
    delay: 50, // Ultra-fast response <100ms
    fuzzyThreshold: 0.7,
    maxResults: 50,
    enableFuzzy: true,
    enableHighlight: true,
    sortByRelevance: true
  };

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchStats,
    filters,
    updateFilters,
    clearFilters,
    sortBy,
    setSortBy,
    searchHistory,
    clearSearch,
    isSearching
  } = useAdvancedSearch(techniques, searchOptions);

  // Technique categories
  const categories = useMemo(() => [
    'All',
    'Mixing',
    'Shaking',
    'Stirring',
    'Straining',
    'Muddling',
    'Building',
    'Layering',
    'Garnishing',
    'Flaming',
    'Molecular',
    'Temperature',
    'Preparation'
  ], []);

  // Difficulty levels
  const difficultyLevels = useMemo(() => [
    'All',
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ], []);

  // Equipment types
  const equipmentTypes = useMemo(() => [
    'All',
    'Shaker',
    'Strainer',
    'Jigger',
    'Bar Spoon',
    'Muddler',
    'Torch',
    'Thermometer',
    'Centrifuge',
    'Smoking Gun',
    'Immersion Circulator'
  ], []);

  const handleSelectTechnique = useCallback((technique) => {
    setSelectedTechnique(technique);
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedTechnique(null);
    setViewMode('grid');
  }, []);

  const handleAddTechnique = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    updateFilters({ [filterType]: value });
  }, [updateFilters]);

  // Get technique icon based on category
  const getTechniqueIcon = useCallback((category) => {
    const iconMap = {
      'Mixing': Blend,
      'Shaking': Zap,
      'Stirring': Timer,
      'Straining': Droplets,
      'Muddling': Scissors,
      'Building': Plus,
      'Layering': Star,
      'Garnishing': ChefHat,
      'Flaming': Flame,
      'Molecular': Thermometer,
      'Temperature': Thermometer,
      'Preparation': BookOpen
    };
    return iconMap[category] || BookOpen;
  }, []);

  if (viewMode === 'detail' && selectedTechnique) {
    return (
      <TechniqueDetail
        technique={selectedTechnique}
        onBack={handleBackToList}
        getTechniqueIcon={getTechniqueIcon}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Bartending Techniques
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Master the art of cocktail creation with professional techniques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddTechnique}
            variant="primary"
            size="sm"
            ariaLabel="Add new technique"
          >
            <Plus className="w-4 h-4" />
            Add Technique
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search techniques, equipment, or methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="pr-20"
              aria-label="Search techniques"
            />

            {isSearching && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
              </div>
            )}

            {searchTerm && (
              <Button
                onClick={clearSearch}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                ariaLabel="Clear search"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Category"
              value={filters.category || 'All'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              aria-label="Filter by category"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>

            <Select
              label="Difficulty"
              value={filters.difficulty || 'All'}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              aria-label="Filter by difficulty"
            >
              {difficultyLevels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>

            <Select
              label="Equipment"
              value={filters.equipment || 'All'}
              onChange={(e) => handleFilterChange('equipment', e.target.value)}
              aria-label="Filter by equipment"
            >
              {equipmentTypes.map(equipment => (
                <option key={equipment} value={equipment}>
                  {equipment}
                </option>
              ))}
            </Select>

            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort techniques"
            >
              <option value="relevance">Relevance</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="difficulty">Difficulty</option>
              <option value="duration">Duration</option>
            </Select>
          </div>

          {/* Search Stats */}
          {searchStats.lastSearchTerm && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {searchStats.totalResults} results for "{searchStats.lastSearchTerm}"
              </span>
              <span>
                Search completed in {searchStats.searchTime.toFixed(1)}ms
              </span>
            </div>
          )}

          {/* Active Filters */}
          {Object.entries(filters).some(([_, value]) => value && value !== 'All') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === 'All') return null;
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key, 'All')}
                      className="ml-1 hover:text-red-500"
                      aria-label={`Remove ${key} filter`}
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Techniques Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map((technique) => (
          <TechniqueCard
            key={technique.id}
            technique={technique}
            onSelect={handleSelectTechnique}
            getTechniqueIcon={getTechniqueIcon}
          />
        ))}
      </div>

      {/* Empty State */}
      {searchResults.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? 'No techniques found' : 'No techniques available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms or filters'
              : 'Start building your techniques library by adding your first technique'
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleAddTechnique} variant="primary">
              <Plus className="w-4 h-4" />
              Add Your First Technique
            </Button>
          )}
        </div>
      )}

      {/* Add Technique Modal */}
      {showAddModal && (
        <AddTechniqueModal
          onClose={() => setShowAddModal(false)}
          categories={categories.filter(c => c !== 'All')}
          difficultyLevels={difficultyLevels.filter(d => d !== 'All')}
          equipmentTypes={equipmentTypes.filter(e => e !== 'All')}
        />
      )}
    </div>
  );
});

/**
 * Technique Card Component
 */
const TechniqueCard = memo(({ technique, onSelect, getTechniqueIcon }) => {
  const IconComponent = getTechniqueIcon(technique.category);

  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(technique)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <IconComponent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {technique.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {technique.category}
            </p>
          </div>
        </div>

        {technique.isFavorite && (
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
        )}
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {technique.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {technique.duration || 'N/A'}
          </span>
          <Badge variant="outline" size="sm">
            {technique.difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          View Details
        </div>
      </div>
    </Card>
  );
});

/**
 * Technique Detail Component
 */
const TechniqueDetail = memo(({ technique, onBack, getTechniqueIcon }) => {
  const IconComponent = getTechniqueIcon(technique.category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          ariaLabel="Back to techniques list"
        >
          ← Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <IconComponent className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {technique.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {technique.category} • {technique.difficulty}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-700 dark:text-gray-300">
              {technique.description}
            </p>
          </Card>

          {/* Steps */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Steps</h2>
            <div className="space-y-4">
              {technique.steps?.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">
                      {step.description}
                    </p>
                    {step.tip && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        💡 {step.tip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips & Notes */}
          {technique.tips && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Pro Tips</h2>
              <ul className="space-y-2">
                {technique.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Info</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="font-medium">{technique.duration || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                <Badge variant="outline">{technique.difficulty}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <span className="font-medium">{technique.category}</span>
              </div>
            </div>
          </Card>

          {/* Equipment */}
          {technique.equipment && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Required Equipment</h2>
              <div className="space-y-2">
                {technique.equipment.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tags */}
          {technique.tags && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {technique.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Related Videos/Resources */}
          {technique.resources && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Resources</h2>
              <div className="space-y-2">
                {technique.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {resource.type === 'video' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {resource.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Add Technique Modal Component
 */
const AddTechniqueModal = memo(({ onClose, categories, difficultyLevels, equipmentTypes }) => {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: categories[0] || '',
    difficulty: difficultyLevels[0] || '',
    duration: '',
    equipment: [],
    steps: [{ description: '', tip: '' }],
    tips: [''],
    tags: [],
    resources: []
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const newTechnique = {
      id: `technique_${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      isFavorite: false
    };

    dispatch({
      type: ActionType.ADD_TECHNIQUE,
      payload: newTechnique
    });

    onClose();
  }, [formData, dispatch, onClose]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addStep = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { description: '', tip: '' }]
    }));
  }, []);

  const removeStep = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Technique
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            ariaLabel="Close modal"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Technique Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="e.g., Double Strain"
              />

              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Difficulty"
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                required
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>

              <Input
                label="Duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 30 seconds"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Describe the technique..."
                required
              />
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">Steps</label>
                <Button
                  type="button"
                  onClick={addStep}
                  variant="ghost"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Step {index + 1}</span>
                      {formData.steps.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeStep(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[index].description = e.target.value;
                        handleInputChange('steps', newSteps);
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                      rows={2}
                      placeholder="Describe this step..."
                      required
                    />

                    <input
                      type="text"
                      value={step.tip}
                      onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[index].tip = e.target.value;
                        handleInputChange('steps', newSteps);
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Optional tip for this step..."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Add Technique
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default TechniquesManager;
