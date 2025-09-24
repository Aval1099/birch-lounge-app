/**
 * Create Version Modal Component
 *
 * Modal for creating new versions of recipes with branching options
 */

import {
  X,
  GitBranch,
  Star,
  Edit3,
  Clock,
  Palette,
  AlertCircle,
  Info,
  BookOpen
} from 'lucide-react';
import React, { useState } from 'react';

import { generateNextVersion } from '../../models/index';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

export const CreateVersionModal = ({
  isOpen,
  onClose,
  baseRecipe,
  onCreateVersion,
  existingVersions = []
}) => {
  const [formData, setFormData] = useState({
    versionType: 'variation',
    versionName: '',
    versionNumber: '',
    changeDescription: '',
    branchReason: '',
    copyIngredients: true,
    copyInstructions: true,
    copyMetadata: true,
    autoPublish: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && baseRecipe) {
      // Auto-generate next version number
      const currentVersion = baseRecipe.versionMetadata?.versionNumber || '1.0';
      const nextVersion = generateNextVersion(currentVersion, 'minor');

      setFormData(prev => ({
        ...prev,
        versionNumber: nextVersion
      }));
    }
  }, [isOpen, baseRecipe]);

  const versionTypes = [
    {
      value: 'variation',
      label: 'Variation',
      description: 'A different take on the original recipe',
      icon: <GitBranch className="w-4 h-4" />
    },
    {
      value: 'improvement',
      label: 'Improvement',
      description: 'Enhanced version with better techniques or ingredients',
      icon: <Star className="w-4 h-4" />
    },
    {
      value: 'seasonal',
      label: 'Seasonal',
      description: 'Adapted for specific seasons or occasions',
      icon: <Clock className="w-4 h-4" />
    },
    {
      value: 'source',
      label: 'Source Version',
      description: 'Version from a specific source (book, website, bartender)',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      value: 'custom',
      label: 'Custom',
      description: 'Personalized version with unique modifications',
      icon: <Palette className="w-4 h-4" />
    }
  ];

  const incrementTypes = [
    { value: 'patch', label: 'Patch (1.0.1)', description: 'Small fixes or tweaks' },
    { value: 'minor', label: 'Minor (1.1.0)', description: 'New features or variations' },
    { value: 'major', label: 'Major (2.0.0)', description: 'Significant changes' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Auto-generate version name based on type
    if (field === 'versionType' && !formData.versionName) {
      const typeConfig = versionTypes.find(t => t.value === value);
      if (typeConfig) {
        setFormData(prev => ({
          ...prev,
          versionName: `${baseRecipe?.name} ${typeConfig.label}`
        }));
      }
    }
  };

  const handleVersionNumberChange = (incrementType) => {
    const currentVersion = baseRecipe?.versionMetadata?.versionNumber || '1.0';
    const nextVersion = generateNextVersion(currentVersion, incrementType);
    setFormData(prev => ({ ...prev, versionNumber: nextVersion }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.versionName.trim()) {
      newErrors.versionName = 'Version name is required';
    }

    if (!formData.versionNumber.trim()) {
      newErrors.versionNumber = 'Version number is required';
    }

    if (!formData.changeDescription.trim()) {
      newErrors.changeDescription = 'Please describe what changed in this version';
    }

    // Check for duplicate version numbers
    const isDuplicate = existingVersions.some(
      v => v.versionMetadata.versionNumber === formData.versionNumber
    );
    if (isDuplicate) {
      newErrors.versionNumber = 'This version number already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const versionData = {
        versionNumber: formData.versionNumber,
        versionName: formData.versionName,
        versionType: formData.versionType,
        changeDescription: formData.changeDescription,
        branchReason: formData.branchReason,
        versionStatus: formData.autoPublish ? 'published' : 'draft',
        isMainVersion: false
      };

      const branchOptions = {
        branchType: formData.versionType,
        branchName: formData.versionName,
        branchDescription: formData.changeDescription,
        copyIngredients: formData.copyIngredients,
        copyInstructions: formData.copyInstructions,
        copyMetadata: formData.copyMetadata,
        autoPublish: formData.autoPublish
      };

      await onCreateVersion(baseRecipe, versionData, branchOptions);
      onClose();
    } catch (error) {
      console.error('Error creating version:', error);
      setErrors({ submit: 'Failed to create version. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create New Version
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Base Recipe Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {baseRecipe?.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Current version: {baseRecipe?.versionMetadata?.versionNumber || '1.0'}</span>
                <Badge variant="blue" size="sm">
                  {baseRecipe?.versionMetadata?.versionType || 'original'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Version Type */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Version Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {versionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('versionType', type.value)}
                    className={`p-3 border rounded-lg text-left transition-colors ${formData.versionType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {type.icon}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {type.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Version Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Version Name *
              </label>
              <Input
                value={formData.versionName}
                onChange={(e) => handleInputChange('versionName', e.target.value)}
                placeholder="e.g., Summer Variation, Low ABV Version"
                error={errors.versionName}
              />
            </div>

            {/* Version Number */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Version Number *
              </label>
              <div className="flex items-center gap-3">
                <Input
                  value={formData.versionNumber}
                  onChange={(e) => handleInputChange('versionNumber', e.target.value)}
                  placeholder="1.1.0"
                  className="flex-1"
                  error={errors.versionNumber}
                />
                <div className="flex gap-1">
                  {incrementTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVersionNumberChange(type.value)}
                      title={type.description}
                    >
                      {type.label.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-3 h-3 inline mr-1" />
                Use semantic versioning: major.minor.patch
              </div>
            </div>

            {/* Change Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                What Changed? *
              </label>
              <Textarea
                value={formData.changeDescription}
                onChange={(e) => handleInputChange('changeDescription', e.target.value)}
                placeholder="Describe the changes made in this version..."
                rows={3}
                error={errors.changeDescription}
              />
            </div>

            {/* Branch Reason */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Why Create This Version?
              </label>
              <Textarea
                value={formData.branchReason}
                onChange={(e) => handleInputChange('branchReason', e.target.value)}
                placeholder="Optional: Explain the motivation for this version..."
                rows={2}
              />
            </div>

            {/* Copy Options */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Copy from Base Recipe
              </label>
              <div className="space-y-2">
                {[
                  { key: 'copyIngredients', label: 'Copy Ingredients' },
                  { key: 'copyInstructions', label: 'Copy Instructions' },
                  { key: 'copyMetadata', label: 'Copy Details (glassware, garnish, etc.)' }
                ].map((option) => (
                  <label key={option.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData[option.key]}
                      onChange={(e) => handleInputChange(option.key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto Publish */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.autoPublish}
                  onChange={(e) => handleInputChange('autoPublish', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Publish immediately (otherwise saved as draft)
                </span>
              </label>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {errors.submit}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  Create Version
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVersionModal;
