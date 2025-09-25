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
  AuthModal, ComparisonModal, RecipeFilters, VibrantRecipeGrid, RecipeModal, SettingsModal,
  OfflineIndicator, PWAInstallPrompt, OfflineDownloadManager, PWAUpdateNotification
} from './features';
import {
  VibrantButton, VibrantCard, VibrantNavigation, VibrantDesktopNavigation, VibrantHeader,
  ResponsiveContainer, SyncStatusIndicator, Toast, PerformanceIndicator
} from './ui';
import EnhancedErrorBoundary from './ui/EnhancedErrorBoundary';
import LazyLoadingWrapper from './ui/LazyLoadingWrapper';

// Lazy load heavy components
const AIAssistant = lazy(() => import('./features/AIAssistant'));
const MenuBuilder = lazy(() => import('./features/MenuBuilder'));
const BatchScalingCalculator = lazy(() => import('./features/BatchScalingCalculator'));
const IngredientsManager = lazy(() => import('./features/IngredientsManager'));
const TechniquesManager = lazy(() => import('./features/TechniquesManager'));
const ServiceMode = lazy(() => import('./features/ServiceMode'));
const ModernUIDemo = lazy(() => import('./demo/ModernUIDemo'));

// Memoized tab components
const RecipesTab = memo(() => (
  <div className="space-y-4">
    <VibrantCard variant="glass" className="m-4">
      <RecipeFilters />
    </VibrantCard>
    <VibrantRecipeGrid />
  </div>
));
RecipesTab.displayName = 'RecipesTab';

const AITab = memo(() => (
  <LazyLoadingWrapper featureName="AI Assistant">
    <AIAssistant />
  </LazyLoadingWrapper>
));
AITab.displayName = 'AITab';

const MenuBuilderTab = memo(() => (
  <LazyLoadingWrapper featureName="Menu Builder">
    <MenuBuilder />
  </LazyLoadingWrapper>
));
MenuBuilderTab.displayName = 'MenuBuilderTab';

const BatchScalingTab = memo(() => (
  <LazyLoadingWrapper featureName="Batch Scaling Calculator">
    <BatchScalingCalculator />
  </LazyLoadingWrapper>
));
BatchScalingTab.displayName = 'BatchScalingTab';

const IngredientsTab = memo(() => (
  <LazyLoadingWrapper featureName="Ingredients Manager">
    <IngredientsManager />
  </LazyLoadingWrapper>
));
IngredientsTab.displayName = 'IngredientsTab';

const TechniquesTab = memo(() => (
  <LazyLoadingWrapper featureName="Techniques Library">
    <TechniquesManager />
  </LazyLoadingWrapper>
));
TechniquesTab.displayName = 'TechniquesTab';

const ServiceModeTab = memo(() => (
  <LazyLoadingWrapper featureName="Service Mode">
    <ServiceMode />
  </LazyLoadingWrapper>
));
ServiceModeTab.displayName = 'ServiceModeTab';

const ModernUIDemoTab = memo(() => (
  <LazyLoadingWrapper featureName="Modern UI Demo">
    <ModernUIDemo />
  </LazyLoadingWrapper>
));
ModernUIDemoTab.displayName = 'ModernUIDemoTab';

// Tab configuration
const TABS = [
  { id: 'recipes', label: 'Recipes', icon: ChefHat, component: RecipesTab },
  { id: 'ingredients', label: 'Ingredients', icon: Package, component: IngredientsTab },
  { id: 'menus', label: 'Menus', icon: FileText, component: MenuBuilderTab },
  { id: 'techniques', label: 'Techniques', icon: BookOpen, component: TechniquesTab },
  { id: 'batch', label: 'Batch Scaling', icon: Calculator, component: BatchScalingTab },
  { id: 'service', label: 'Service Mode', icon: Timer, component: ServiceModeTab },
  { id: 'ai', label: 'AI Assistant', icon: Zap, component: AITab },
  { id: 'demo', label: 'Modern UI', icon: Settings, component: ModernUIDemoTab }
];

const MainApp = memo(() => {
  const { state, dispatch } = useApp();
  const { theme, activeTab, serviceMode, modal } = state;
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const isMobile = useMobileDetection();

  // Performance monitoring
  usePerformanceMonitoring();

  const currentTabComponent = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab);
    return tab ? <tab.component /> : <RecipesTab />;
  }, [activeTab]);

  return (
    <div
      data-testid="app-container"
      className={`min-h-screen transition-all duration-300 ${theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 text-gray-100'
        : 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 text-gray-900'
        }`}>

      {/* Desktop Header */}
      {!isMobile && (
        <VibrantHeader
          title="Birch Lounge"
          subtitle="Cocktail Recipe Manager"
          theme={theme}
          serviceMode={serviceMode}
          onThemeToggle={() => dispatch({ type: ActionType.TOGGLE_THEME })}
          onServiceModeToggle={() => dispatch({ type: ActionType.TOGGLE_SERVICE_MODE })}
          onNewRecipe={() => dispatch({
            type: ActionType.OPEN_MODAL,
            payload: { type: 'recipe', data: null }
          })}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {/* Desktop Navigation */}
      {!isMobile && (
        <VibrantDesktopNavigation
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => dispatch({ type: ActionType.SET_ACTIVE_TAB, payload: tabId })}
        />
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-white" />
              <h1 className="text-lg font-bold text-white">Birch Lounge</h1>
            </div>
            <div className="flex items-center gap-2">
              <VibrantButton
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: ActionType.TOGGLE_THEME })}
                icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                className="text-white p-2"
              />
              <VibrantButton
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                icon={<Settings className="w-4 h-4" />}
                className="text-white p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${isMobile ? 'pb-20' : ''}`}>
        <ResponsiveContainer>
          <EnhancedErrorBoundary
            title={`Error in ${TABS.find(t => t.id === activeTab)?.label || 'Unknown'} Tab`}
            message="There was an error loading this section. Please try refreshing or switching to another tab."
            enableAutoRetry={true}
            maxAutoRetries={2}
          >
            {currentTabComponent}
          </EnhancedErrorBoundary>
        </ResponsiveContainer>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <VibrantNavigation
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => dispatch({ type: ActionType.SET_ACTIVE_TAB, payload: tabId })}
        />
      )}

      {/* Service Mode Indicator */}
      {serviceMode && (
        <div className="fixed bottom-4 right-4 z-40">
          <VibrantCard variant="vibrant" padding="sm" className="shadow-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Service Mode Active</span>
            </div>
          </VibrantCard>
        </div>
      )}

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}

      {modal.isOpen && modal.type === 'recipe' && (
        <RecipeModal
          recipe={modal.data}
          onClose={() => dispatch({ type: ActionType.CLOSE_MODAL })}
        />
      )}

      {modal.isOpen && modal.type === 'comparison' && (
        <ComparisonModal
          recipes={modal.data}
          onClose={() => dispatch({ type: ActionType.CLOSE_MODAL })}
        />
      )}

      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <OfflineIndicator />
      <OfflineDownloadManager />

      {/* Performance Indicators */}
      <PerformanceIndicator />
      <SyncStatusIndicator />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
});

MainApp.displayName = 'MainApp';

export default MainApp;
