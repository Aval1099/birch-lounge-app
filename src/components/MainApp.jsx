import {
  BookOpen,
  Calculator,
  ChefHat,
  FileText,
  Moon,
  Package,
  Plus,
  Settings,
  Sun,
  Timer,
  Zap
} from 'lucide-react';
import React, { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';

import { ActionType } from '../constants';
import { useMobileDetection } from '../hooks';
import { useApp } from '../hooks/useApp';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import { cachePerformanceMonitor } from '../services/cachePerformanceMonitor';
import { offlineManager } from '../services/offlineManager';
import { performanceMonitor } from '../services/performanceService';
import { SecurityService } from '../services/securityService';

import {
  AuthModal, ComparisonModal, IngredientsManager,
  RecipeFilters, RecipeGrid, RecipeModal, ServiceMode, SettingsModal, TechniquesManager,
  OfflineIndicator, PWAInstallPrompt, OfflineDownloadManager, PWAUpdateNotification
} from './features';
import { Button, MobileNavigation, PerformanceIndicator, ResponsiveContainer, SyncStatusIndicator, Toast } from './ui';
import EnhancedErrorBoundary from './ui/EnhancedErrorBoundary';

// Lazy load heavy components to reduce initial bundle size
const AIAssistant = lazy(() => import('./features/AIAssistant'));
const MenuBuilder = lazy(() => import('./features/MenuBuilder'));
const BatchScalingCalculator = lazy(() => import('./features/BatchScalingCalculator'));
const AdvancedOfflineManager = lazy(() => import('./features/AdvancedOfflineManager'));
const ModernUIDemo = lazy(() => import('./demo/ModernUIDemo'));





// Memoized tab components to prevent unnecessary re-renders
const RecipesTab = memo(() => (
  <>
    <RecipeFilters />
    <RecipeGrid />
  </>
));
RecipesTab.displayName = 'RecipesTab';

const AITab = memo(() => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
    </div>
  }>
    <AIAssistant />
  </Suspense>
));
AITab.displayName = 'AITab';

// Lazy-loaded tab components with Suspense
const MenuBuilderTab = memo(() => (
  <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>}>
    <MenuBuilder />
  </Suspense>
));
MenuBuilderTab.displayName = 'MenuBuilderTab';

const BatchScalingTab = memo(() => (
  <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>}>
    <BatchScalingCalculator />
  </Suspense>
));
BatchScalingTab.displayName = 'BatchScalingTab';

const ModernUIDemoTab = memo(() => (
  <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
    <ModernUIDemo />
  </Suspense>
));
ModernUIDemoTab.displayName = 'ModernUIDemoTab';

// Memoized tab configuration to prevent unnecessary re-renders
const TABS = [
  { id: 'recipes', label: 'Recipes', icon: ChefHat, component: RecipesTab },
  { id: 'ingredients', label: 'Ingredients', icon: Package, component: IngredientsManager },
  { id: 'menus', label: 'Menus', icon: FileText, component: MenuBuilderTab },
  { id: 'techniques', label: 'Techniques', icon: BookOpen, component: TechniquesManager },
  { id: 'batch', label: 'Batch Scaling', icon: Calculator, component: BatchScalingTab },
  { id: 'service', label: 'Service Mode', icon: Timer, component: ServiceMode },
  { id: 'ai', label: 'AI Assistant', icon: Zap, component: AITab },
  { id: 'demo', label: 'Modern UI', icon: Settings, component: ModernUIDemoTab }
];

const MainApp = memo(() => {
  const { state, dispatch } = useApp();
  const { theme, activeTab, serviceMode, modal } = state;

  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [showAdvancedOfflineManager, setShowAdvancedOfflineManager] = useState(false);
  const { isMobile } = useMobileDetection();

  // Initialize performance monitoring
  const {
    webVitals: _webVitals,
    customMetrics: _customMetrics,
    alerts: _alerts,
    isMonitoring: _isMonitoring,
    measureApiCall: _measureApiCall,
    measureSearch: _measureSearch,
    measureModal: _measureModal,
    measureNavigation: _measureNavigation
  } = usePerformanceMonitoring({
    enabled: true,
    sampling: {
      webVitals: true,
      customMetrics: true,
      memoryMonitoring: true,
      networkMonitoring: true
    },
    alerts: {
      enabled: true,
      showNotifications: false,
      logToConsole: process.env.NODE_ENV === 'development'
    }
  });

  // Initialize security service
  React.useEffect(() => {
    const securityService = new SecurityService();
    securityService.initialize();

    return () => {
      securityService.destroy();
    };
  }, []);

  // Initialize cache performance monitoring
  React.useEffect(() => {
    // Start cache performance monitoring
    cachePerformanceMonitor.startMonitoring();

    // Initialize performance monitoring for production
    if (process.env.NODE_ENV === 'production') {
      performanceMonitor.initialize({
        enabled: true,
        sampling: {
          webVitals: true,
          customMetrics: true,
          memoryMonitoring: true,
          networkMonitoring: true
        },
        alerts: {
          enabled: true,
          showNotifications: false,
          logToConsole: false
        }
      });
    }

    return () => {
      cachePerformanceMonitor.stopMonitoring();
    };
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleThemeToggle = useCallback(() => {
    dispatch({
      type: ActionType.SET_THEME,
      payload: theme === 'light' ? 'dark' : 'light'
    });
  }, [dispatch, theme]);

  const handleCreateRecipe = useCallback(() => {
    dispatch({
      type: ActionType.SET_MODAL,
      payload: { view: 'recipe', data: null }
    });
  }, [dispatch]);

  const handleServiceModeToggle = useCallback(() => {
    dispatch({
      type: ActionType.SET_SERVICE_MODE,
      payload: !serviceMode
    });
  }, [dispatch, serviceMode]);

  // Memoized current tab component to prevent unnecessary re-renders
  const currentTabComponent = useMemo(() => {
    const currentTab = TABS.find(t => t.id === activeTab);
    return currentTab ? React.createElement(currentTab.component) : null;
  }, [activeTab]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Initialize offline manager
  React.useEffect(() => {
    offlineManager.initialize().catch(error => {
      console.error('Failed to initialize offline manager:', error);
    });

    return () => {
      offlineManager.destroy();
    };
  }, []);



  return (
    <div
      data-testid="app-container"
      className={`min-h-screen transition-colors ${theme === 'dark'
        ? 'bg-gray-900 text-gray-100'
        : 'bg-gray-100 text-gray-900'
        }`}>
      {!isMobile && (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Birch Lounge
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Cocktail Recipe Manager
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <OfflineIndicator className="hidden md:flex" showDetails={true} />
                <PerformanceIndicator className="hidden lg:flex" />
                <SyncStatusIndicator
                  onAuthClick={() => setShowAuth(true)}
                  className="hidden sm:block"
                />
                <Button
                  onClick={handleServiceModeToggle}
                  variant={serviceMode ? 'primary' : 'ghost'}
                  className="hidden sm:flex"
                  ariaLabel={serviceMode ? 'Exit service mode' : 'Enter service mode'}
                >
                  <Zap className="w-4 h-4" />
                  Service Mode
                </Button>
                <Button
                  onClick={handleCreateRecipe}
                  variant="primary"
                  className="hidden sm:flex"
                  ariaLabel="Create new recipe"
                >
                  <Plus className="w-4 h-4" />
                  New Recipe
                </Button>
                <Button
                  onClick={handleThemeToggle}
                  variant="ghost"
                  className="p-2"
                  ariaLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  className="p-2"
                  ariaLabel="Open settings"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <MobileNavigation tabs={TABS} />

      <main>
        <ResponsiveContainer>
          <EnhancedErrorBoundary
            title={`Error in ${TABS.find(t => t.id === activeTab)?.label || 'Unknown'} Tab`}
            message="There was an error loading this section. Please try refreshing or switching to another tab."
            enableAutoRetry={true}
            maxAutoRetries={2}
            onRetry={(retryCount) => console.warn(`Tab retry attempt ${retryCount}`)}
          >
            {currentTabComponent}
          </EnhancedErrorBoundary>
        </ResponsiveContainer>
      </main>

      {/* Service Mode Indicator */}
      {serviceMode && (
        <div className="fixed bottom-4 right-4 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Service Mode Active</span>
          </div>
        </div>
      )}

      {/* Modal Rendering */}
      {modal.isOpen && modal.type === 'recipe' && (
        <RecipeModal
          recipe={modal.data}
          onClose={() => dispatch({ type: ActionType.CLOSE_MODAL })}
        />
      )}

      {modal.isOpen && modal.view === 'comparison' && (
        <ComparisonModal />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={() => {
          setShowAuth(false);
        }}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt
        isOpen={showPWAInstall}
        onClose={() => setShowPWAInstall(false)}
      />

      {/* Offline Download Manager */}
      <OfflineDownloadManager
        isOpen={showDownloadManager}
        onClose={() => setShowDownloadManager(false)}
        onDownloadSelected={() => {
          setShowDownloadManager(false);
        }}
      />

      {/* Advanced Offline Manager */}
      {showAdvancedOfflineManager && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
          <AdvancedOfflineManager
            isOpen={showAdvancedOfflineManager}
            onClose={() => setShowAdvancedOfflineManager(false)}
            onDownloadSelected={() => {
              setShowAdvancedOfflineManager(false);
            }}
          />
        </Suspense>
      )}

      {/* PWA Update Notification */}
      <PWAUpdateNotification />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
});

MainApp.displayName = 'MainApp';

export default MainApp;
