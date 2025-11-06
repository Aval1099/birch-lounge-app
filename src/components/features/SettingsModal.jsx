 
import {
  Activity, AlertTriangle, Check, Database, Download, Key, Moon,
  Save,
  Sun, Trash2, Upload, X, Zap
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { ActionType } from '../../constants';
import { useApp } from '../../hooks/useApp';
import { apiKeyService } from '../../services/apiKeyService';
import { storageService } from '../../services/storageService';
import { validationService } from '../../services/validation';
import CachePerformanceDashboard from '../admin/CachePerformanceDashboard';
import { Button, Input } from '../ui';

/**
 * Settings Modal Component - Application configuration and preferences
 */
const SettingsModal = memo(({ onClose }) => {
  const { state, dispatch } = useApp();
  const { theme, serviceMode, geminiApiKey } = state;
  const [activeTab, setActiveTab] = useState('general');
  const [apiKey, setApiKey] = useState(geminiApiKey || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleThemeChange = useCallback((newTheme) => {
    dispatch({
      type: ActionType.SET_THEME,
      payload: newTheme
    });
  }, [dispatch]);

  const handleServiceModeToggle = useCallback(() => {
    dispatch({
      type: ActionType.SET_SERVICE_MODE,
      payload: !serviceMode
    });
  }, [serviceMode, dispatch]);

  const handleSaveApiKey = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const trimmedKey = apiKey.trim();

      if (trimmedKey) {
        apiKeyService.setApiKey('gemini', trimmedKey);
      } else {
        apiKeyService.removeApiKey('gemini');
      }

      dispatch({
        type: ActionType.SET_GEMINI_API_KEY,
        payload: trimmedKey
      });

      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'API key saved successfully!',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'Failed to save API key.',
          type: 'error'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiKey, dispatch]);

  const handleExportData = useCallback(async () => {
    try {
      setExportStatus('exporting');
      const data = storageService.exportData();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birch-lounge-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  }, []);

  const handleImportData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Step 1: Validate file before reading
    const fileValidation = validationService.validateFile(file);
    if (!fileValidation.isValid) {
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: `File validation failed: ${fileValidation.errors.join(', ')}`,
          type: 'error'
        }
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Step 2: Safely parse JSON with security checks
        const parseResult = validationService.validateImportData(e.target.result);
        if (!parseResult.isValid) {
          throw new Error(parseResult.errors.join(', '));
        }

        const data = parseResult.data;

        // Step 3: Confirm with user
        if (window.confirm('This will replace all current data. Are you sure?')) {
          // Step 4: Import data with validation
          storageService.importData(data);
          dispatch({ type: ActionType.INITIALIZE_APP });

          dispatch({
            type: ActionType.SET_NOTIFICATION,
            payload: {
              message: 'Data imported successfully!',
              type: 'success'
            }
          });
        }
      } catch (error) {
        console.error('Import error:', error);
        let errorMessage = 'Failed to import data.';

        if (error.message.includes('validation failed')) {
          errorMessage = `Import validation failed: ${error.message}`;
        } else if (error.message.includes('JSON parsing failed')) {
          errorMessage = 'Invalid JSON file format.';
        } else if (error.message.includes('File size')) {
          errorMessage = 'File too large. Maximum size is 10MB.';
        } else if (error.message.includes('File type')) {
          errorMessage = 'Invalid file type. Only JSON files are allowed.';
        } else {
          errorMessage = `Import failed: ${error.message}`;
        }

        dispatch({
          type: ActionType.SET_NOTIFICATION,
          payload: {
            message: errorMessage,
            type: 'error'
          }
        });
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  }, [dispatch]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('This will permanently delete all recipes, ingredients, menus, and settings. This action cannot be undone. Are you sure?')) {
      if (window.confirm('Are you absolutely sure? This will delete everything!')) {
        storageService.clearAllData();
        dispatch({ type: ActionType.INITIALIZE_APP });

        dispatch({
          type: ActionType.SET_NOTIFICATION,
          payload: {
            message: 'All data has been cleared.',
            type: 'success'
          }
        });
      }
    }
  }, [dispatch]);

  const tabs = [
    { id: 'general', label: 'General', icon: Sun },
    { id: 'ai', label: 'AI Assistant', icon: Key },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'performance', label: 'Cache Performance', icon: Activity }
  ];

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
      aria-labelledby="settings-modal-title"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="settings-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            ariaLabel="Close settings"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-80px)]">
            {activeTab === 'general' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Appearance
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleThemeChange('light')}
                          variant={theme === 'light' ? 'primary' : 'ghost'}
                          className="flex items-center gap-2"
                        >
                          <Sun className="w-4 h-4" />
                          Light
                        </Button>
                        <Button
                          onClick={() => handleThemeChange('dark')}
                          variant={theme === 'dark' ? 'primary' : 'ghost'}
                          className="flex items-center gap-2"
                        >
                          <Moon className="w-4 h-4" />
                          Dark
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Service Mode
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Bartender Interface
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Streamlined interface for quick recipe lookup during service
                      </p>
                    </div>
                    <Button
                      onClick={handleServiceModeToggle}
                      variant={serviceMode ? 'primary' : 'ghost'}
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      {serviceMode ? 'Active' : 'Inactive'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Gemini AI Configuration
                  </h3>

                  <div className="space-y-4">
                    <Input
                      label="API Key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Gemini API key"
                      maxLength={200}
                    />

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get your API key from{' '}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Google AI Studio
                      </a>
                    </p>

                    <Button
                      onClick={handleSaveApiKey}
                      variant="primary"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save API Key
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Backup & Restore
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Export Data
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Download a backup of all your recipes, ingredients, and settings.
                      </p>
                      <Button
                        onClick={handleExportData}
                        variant="primary"
                        disabled={exportStatus === 'exporting'}
                        className="flex items-center gap-2"
                      >
                        {exportStatus === 'exporting' ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            Exporting...
                          </>
                        ) : exportStatus === 'success' ? (
                          <>
                            <Check className="w-4 h-4" />
                            Exported!
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Export Data
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Import Data
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        Restore data from a previously exported backup file.
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                        <Button
                          as="span"
                          variant="primary"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          Import Data
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Danger Zone
                  </h3>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                          Clear All Data
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                          This will permanently delete all recipes, ingredients, menus, batches, and settings.
                          This action cannot be undone.
                        </p>
                        <Button
                          onClick={handleClearAllData}
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="p-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Cache Performance Monitoring
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Monitor and optimize cache performance for better application responsiveness.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                    <CachePerformanceDashboard />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
