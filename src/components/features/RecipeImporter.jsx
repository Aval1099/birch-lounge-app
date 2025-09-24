/**
 * Recipe Importer Component - Web-based recipe discovery and import
 * Integrates with MCP Web Fetch Service
 */

import { Download, Globe, Search, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import { useState, useCallback, memo } from 'react';

import { ActionType } from '../../constants';
import { useApp } from '../../hooks/useApp';
import { mcpWebFetchService } from '../../services/mcpWebFetchService';
import { Button, Input, Modal, ProgressBar, Toast } from '../ui';

const RecipeImporter = memo(({ isOpen, onClose }) => {
  const { dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'search'
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  /**
   * Import single recipe from URL
   */
  const handleSingleImport = useCallback(async () => {
    if (!singleUrl.trim()) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const recipe = await mcpWebFetchService.fetchRecipe(singleUrl.trim());
      
      if (recipe) {
        // Add recipe to app state
        dispatch({
          type: ActionType.ADD_RECIPE,
          payload: recipe
        });

        dispatch({
          type: ActionType.SHOW_NOTIFICATION,
          payload: {
            message: `Successfully imported "${recipe.name}"`,
            type: 'success'
          }
        });

        setSingleUrl('');
        onClose();
      }
    } catch (error) {
      setErrors([{ url: singleUrl, error: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  }, [singleUrl, dispatch, onClose]);

  /**
   * Import multiple recipes from URLs
   */
  const handleBatchImport = useCallback(async () => {
    const urls = batchUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) return;

    setIsProcessing(true);
    setErrors([]);
    setResults(null);

    try {
      const result = await mcpWebFetchService.batchFetchRecipes(urls, (progressData) => {
        setProgress(progressData);
      });

      // Add successful recipes to app state
      result.recipes.forEach(recipe => {
        dispatch({
          type: ActionType.ADD_RECIPE,
          payload: recipe
        });
      });

      setResults(result);
      setErrors(result.errors);

      if (result.recipes.length > 0) {
        dispatch({
          type: ActionType.SHOW_NOTIFICATION,
          payload: {
            message: `Successfully imported ${result.recipes.length} recipes`,
            type: 'success'
          }
        });
      }

      if (result.errors.length > 0) {
        dispatch({
          type: ActionType.SHOW_NOTIFICATION,
          payload: {
            message: `${result.errors.length} recipes failed to import`,
            type: 'warning'
          }
        });
      }

    } catch (error) {
      setErrors([{ url: 'batch', error: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  }, [batchUrls, dispatch]);

  /**
   * Search for recipes
   */
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsProcessing(true);
    setSearchResults([]);

    try {
      const results = await mcpWebFetchService.searchRecipes(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      setErrors([{ url: 'search', error: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  }, [searchQuery]);

  /**
   * Import selected recipes from search results
   */
  const handleImportSelected = useCallback(async () => {
    const urlsToImport = Array.from(selectedUrls);
    
    if (urlsToImport.length === 0) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const result = await mcpWebFetchService.batchFetchRecipes(urlsToImport, (progressData) => {
        setProgress(progressData);
      });

      // Add successful recipes to app state
      result.recipes.forEach(recipe => {
        dispatch({
          type: ActionType.ADD_RECIPE,
          payload: recipe
        });
      });

      setResults(result);
      setSelectedUrls(new Set());

      if (result.recipes.length > 0) {
        dispatch({
          type: ActionType.SHOW_NOTIFICATION,
          payload: {
            message: `Successfully imported ${result.recipes.length} recipes`,
            type: 'success'
          }
        });
      }

    } catch (error) {
      setErrors([{ url: 'selected', error: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedUrls, dispatch]);

  /**
   * Toggle URL selection
   */
  const toggleUrlSelection = useCallback((url) => {
    setSelectedUrls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  }, []);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Recipes from Web"
      size="large"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'url'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Import by URL
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search & Import
          </button>
        </div>

        {/* URL Import Tab */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            {/* Single URL Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Single Recipe URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="https://www.liquor.com/recipes/..."
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSingleImport}
                  disabled={!singleUrl.trim() || isProcessing}
                  variant="primary"
                >
                  <Download className="w-4 h-4" />
                  Import
                </Button>
              </div>
            </div>

            {/* Batch URL Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Multiple URLs (one per line)
              </label>
              <textarea
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                placeholder="https://www.liquor.com/recipes/recipe1&#10;https://www.diffordsguide.com/cocktails/recipe2&#10;..."
                rows={6}
                disabled={isProcessing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <Button
                onClick={handleBatchImport}
                disabled={!batchUrls.trim() || isProcessing}
                variant="primary"
                className="mt-2"
              >
                <Download className="w-4 h-4" />
                Import All
              </Button>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search for Recipes
              </label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="margarita, old fashioned, gin cocktails..."
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isProcessing}
                  variant="primary"
                >
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Search Results ({searchResults.length})
                  </h3>
                  <Button
                    onClick={handleImportSelected}
                    disabled={selectedUrls.size === 0 || isProcessing}
                    variant="primary"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Import Selected ({selectedUrls.size})
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(result.url)}
                        onChange={() => toggleUrlSelection(result.url)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.domain}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Processing recipes...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <ProgressBar
              value={(progress.current / progress.total) * 100}
              className="w-full"
            />
            {progress.url && (
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {progress.status}: {progress.url}
              </p>
            )}
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Import Complete
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Successfully imported {results.summary.successful} of {results.summary.total} recipes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  Import Errors
                </h4>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300">
                      <strong>{error.url}:</strong> {error.error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supported Domains Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Supported Websites
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            liquor.com, diffordsguide.com, punchdrink.com, cocktaildb.com, thespruceeats.com, foodnetwork.com
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onClose}
          variant="secondary"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Close'}
        </Button>
      </div>
    </Modal>
  );
});

RecipeImporter.displayName = 'RecipeImporter';

export default RecipeImporter;
