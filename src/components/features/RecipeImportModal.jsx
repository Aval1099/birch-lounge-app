/**
 * Recipe Import Modal - Handle scraped recipe imports with version conflicts
 */

import { AlertTriangle, BookOpen, Globe, User, Bot, X, Check, GitBranch } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { getSourceDisplayInfo } from '../../models/index';
import { recipeScrapingService } from '../../services/recipeScrapingService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const RecipeImportModal = ({
  isOpen,
  onClose,
  scrapedRecipe,
  sourceInfo,
  onImportComplete
}) => {
  const [importSuggestions, setImportSuggestions] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadImportSuggestions = useCallback(async () => {
    try {
      const suggestions = await recipeScrapingService.getImportSuggestions(scrapedRecipe, sourceInfo);
      setImportSuggestions(suggestions);

      // Auto-select default action
      if (suggestions.action === 'create_new') {
        setSelectedAction('create_new_family');
      } else if (suggestions.action === 'add_version') {
        setSelectedAction('add_as_source_version');
      }
    } catch (error) {
      console.error('Error loading import suggestions:', error);
    }
  }, [scrapedRecipe, sourceInfo]);

  useEffect(() => {
    if (isOpen && scrapedRecipe && sourceInfo) {
      loadImportSuggestions();
    }
  }, [isOpen, scrapedRecipe, sourceInfo, loadImportSuggestions]);



  const handleImport = async () => {
    if (!selectedAction) return;

    setIsImporting(true);
    try {
      const options = {
        overwriteExisting: selectedAction === 'overwrite_existing',
        setAsMain: selectedAction === 'set_as_main_version',
        mergeWithExisting: selectedAction === 'merge_changes'
      };

      const result = await recipeScrapingService.importScrapedRecipe(
        scrapedRecipe,
        sourceInfo,
        options
      );

      setImportResult(result);

      if (result.success) {
        onImportComplete?.(result);
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getActionDescription = (action) => {
    switch (action) {
      case 'create_new_family':
        return 'Create a new recipe family with this as the first version';
      case 'add_as_source_version':
        return `Add as a new "${sourceInfo.sourceName}" version to the existing recipe`;
      case 'add_as_variation':
        return 'Add as a variation of the existing recipe';
      case 'set_as_main_version':
        return 'Add as new version and set it as the main version';
      case 'overwrite_existing':
        return `Replace the existing "${sourceInfo.sourceName}" version`;
      case 'skip_import':
        return 'Skip importing this recipe';
      default:
        return '';
    }
  };

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'book': return <BookOpen className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      case 'bartender': return <User className="w-4 h-4" />;
      case 'ai_generated': return <Bot className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              {getSourceIcon(sourceInfo.sourceType)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Import Recipe
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                From {sourceInfo.sourceName}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Recipe Preview */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              {scrapedRecipe.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{scrapedRecipe.ingredients?.length || 0} ingredients</span>
              <span>{scrapedRecipe.category || 'Uncategorized'}</span>
              {sourceInfo.sourceAuthor && (
                <span>by {sourceInfo.sourceAuthor}</span>
              )}
            </div>
          </div>

          {/* Import Status/Suggestions */}
          {importSuggestions && (
            <div className="mb-6">
              {importSuggestions.action === 'source_exists' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Version Conflict
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {importSuggestions.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {importSuggestions.action === 'add_version' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Add to Existing Recipe
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {importSuggestions.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Choose Import Action:
                </h4>

                {importSuggestions.options.map((option) => (
                  <label
                    key={option}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAction === option
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <input
                      type="radio"
                      name="importAction"
                      value={option}
                      checked={selectedAction === option}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {getActionDescription(option)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`p-4 rounded-lg mb-4 ${importResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-medium ${importResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                    }`}>
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${importResult.success
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                    }`}>
                    {importResult.success
                      ? `Recipe imported as ${importResult.action.replace(/_/g, ' ')}`
                      : importResult.error || 'An error occurred during import'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isImporting}
          >
            {importResult?.success ? 'Close' : 'Cancel'}
          </Button>

          {!importResult?.success && (
            <Button
              onClick={handleImport}
              variant="primary"
              disabled={!selectedAction || isImporting}
              loading={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Recipe'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeImportModal;
