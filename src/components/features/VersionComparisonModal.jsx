/**
 * Version Comparison Modal Component
 *
 * Side-by-side comparison of recipe versions with detailed diff view
 */

import {
  X,
  GitCompare,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { getRecipeDisplayName } from '../../models/index';
import { versionComparisonEngine } from '../../services/versionComparisonEngine';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const VersionComparisonModal = ({
  isOpen,
  onClose,
  versionAId,
  versionBId,
  onMergeVersions,
  onSelectVersion
}) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadComparison = useCallback(async () => {
    setLoading(true);
    try {
      const result = await versionComparisonEngine.compareVersions(versionAId, versionBId);
      setComparison(result);
    } catch (error) {
      console.error('Error loading comparison:', error);
    } finally {
      setLoading(false);
    }
  }, [versionAId, versionBId]);

  useEffect(() => {
    if (isOpen && versionAId && versionBId) {
      loadComparison();
    }
  }, [isOpen, versionAId, versionBId, loadComparison]);

  if (!isOpen) return null;

  const renderDiffBadge = (changeType) => {
    const config = {
      added: { icon: Plus, color: 'green', label: 'Added' },
      removed: { icon: Minus, color: 'red', label: 'Removed' },
      modified: { icon: Edit3, color: 'yellow', label: 'Modified' }
    };

    const { icon: Icon, color, label } = config[changeType] || config.modified;

    return (
      <Badge variant={color} size="sm" className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const renderSimilarityScore = (score) => {
    const percentage = Math.round(score * 100);
    const color = score >= 0.8 ? 'green' : score >= 0.5 ? 'yellow' : 'red';

    return (
      <div className="flex items-center gap-2">
        <div className={`w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
          <div
            className={`h-full bg-${color}-500 transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-sm font-medium text-${color}-600 dark:text-${color}-400`}>
          {percentage}%
        </span>
      </div>
    );
  };

  const renderIngredientComparison = () => {
    if (!comparison?.ingredientAnalysis) return null;

    const { added, removed, modified, unchanged } = comparison.ingredientAnalysis;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Ingredient Changes ({added.length + removed.length + modified.length} total)
        </h4>

        {added.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {renderDiffBadge('added')}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {added.length} ingredient(s) added
              </span>
            </div>
            <div className="pl-4 space-y-1">
              {added.map((ingredient, index) => (
                <div key={index} className="text-sm text-green-700 dark:text-green-300">
                  + {ingredient.amount} {ingredient.unit} {ingredient.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {removed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {renderDiffBadge('removed')}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {removed.length} ingredient(s) removed
              </span>
            </div>
            <div className="pl-4 space-y-1">
              {removed.map((ingredient, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300 line-through">
                  - {ingredient.amount} {ingredient.unit} {ingredient.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {modified.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {renderDiffBadge('modified')}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {modified.length} ingredient(s) modified
              </span>
            </div>
            <div className="pl-4 space-y-2">
              {modified.map((mod, index) => (
                <div key={index} className="space-y-1">
                  <div className="font-medium text-sm">{mod.ingredient.name}</div>
                  {Object.entries(mod.changes.details).map(([field, change]) => (
                    <div key={field} className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                      {field}:
                      <span className="text-red-600 dark:text-red-400 line-through ml-1">
                        {change.before}
                      </span>
                      <ArrowRight className="w-3 h-3 inline mx-1" />
                      <span className="text-green-600 dark:text-green-400">
                        {change.after}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {unchanged.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {unchanged.length} ingredient(s) unchanged
          </div>
        )}
      </div>
    );
  };

  const renderInstructionComparison = () => {
    if (!comparison?.instructionDiff) return null;

    const { stepChanges, addedSteps, removedSteps } = comparison.instructionDiff;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Instruction Changes
        </h4>

        {stepChanges.map((change, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {renderDiffBadge('modified')}
              <span className="text-sm font-medium">Step {change.stepNumber}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                - {change.before}
              </div>
              <div className="text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                + {change.after}
              </div>
            </div>
          </div>
        ))}

        {addedSteps.map((step, index) => (
          <div key={index} className="border border-green-200 dark:border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {renderDiffBadge('added')}
              <span className="text-sm font-medium">Step {step.stepNumber}</span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
              + {step.content}
            </div>
          </div>
        ))}

        {removedSteps.map((step, index) => (
          <div key={index} className="border border-red-200 dark:border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {renderDiffBadge('removed')}
              <span className="text-sm font-medium">Step {step.stepNumber}</span>
            </div>
            <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded line-through">
              - {step.content}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitCompare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Version Comparison
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Analyzing versions...</p>
          </div>
        ) : comparison ? (
          <div className="flex flex-col h-full">
            {/* Version Headers */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {getRecipeDisplayName(comparison.versionA)}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="blue" size="sm">
                    v{comparison.versionA.versionMetadata.versionNumber}
                  </Badge>
                  {comparison.versionA.versionMetadata.isMainVersion && (
                    <Badge variant="primary" size="sm">Main</Badge>
                  )}
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {getRecipeDisplayName(comparison.versionB)}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="blue" size="sm">
                    v{comparison.versionB.versionMetadata.versionNumber}
                  </Badge>
                  {comparison.versionB.versionMetadata.isMainVersion && (
                    <Badge variant="primary" size="sm">Main</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Similarity Score */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Overall Similarity: {comparison.semanticSimilarity?.interpretation}
                  </span>
                </div>
                {renderSimilarityScore(comparison.semanticSimilarity?.overall || 0)}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'ingredients', label: 'Ingredients' },
                { id: 'instructions', label: 'Instructions' },
                { id: 'metadata', label: 'Details' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {comparison.ingredientAnalysis?.added?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Added</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {comparison.ingredientAnalysis?.removed?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Removed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {comparison.ingredientAnalysis?.modified?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Modified</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Recommended Action
                    </h4>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 dark:text-blue-200 capitalize">
                        {comparison.recommendedAction?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ingredients' && renderIngredientComparison()}
              {activeTab === 'instructions' && renderInstructionComparison()}

              {activeTab === 'metadata' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Recipe Details
                  </h4>
                  {comparison.differences?.map((diff, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {renderDiffBadge(diff.changeType)}
                        <span className="text-sm font-medium capitalize">{diff.field}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Version A</div>
                          <div className="text-gray-900 dark:text-gray-100">
                            {diff.valueA || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Version B</div>
                          <div className="text-gray-900 dark:text-gray-100">
                            {diff.valueB || 'Not set'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onSelectVersion && onSelectVersion(comparison.versionA.id)}
                >
                  Use Version A
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onSelectVersion && onSelectVersion(comparison.versionB.id)}
                >
                  Use Version B
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {onMergeVersions && (
                  <Button
                    variant="primary"
                    onClick={() => onMergeVersions(comparison.versionA.id, comparison.versionB.id)}
                  >
                    Merge Versions
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Failed to load version comparison. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionComparisonModal;
