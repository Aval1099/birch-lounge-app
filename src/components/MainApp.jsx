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
  Zap
} from 'lucide-react';
import React, { memo, useState } from 'react';

import { ActionType } from '../constants';
import { useMobileDetection } from '../hooks';
import { useApp } from '../hooks/useApp';

import {
  AIAssistant, AuthModal, BatchScalingCalculator, ComparisonModal, IngredientsManager,
  MenuBuilder,
  RecipeFilters,
  RecipeGrid, RecipeModal, SettingsModal, TechniquesManager
} from './features';
import { Button, ErrorBoundary, MobileNavigation, ResponsiveContainer, SyncStatusIndicator, Toast } from './ui';




const TABS = [
  { id: 'recipes', label: 'Recipes', icon: ChefHat, component: () => <><RecipeFilters /><RecipeGrid /></> },
  { id: 'ingredients', label: 'Ingredients', icon: Package, component: IngredientsManager },
  { id: 'menus', label: 'Menus', icon: FileText, component: MenuBuilder },
  { id: 'techniques', label: 'Techniques', icon: BookOpen, component: TechniquesManager },
  { id: 'batch', label: 'Batch Scaling', icon: Calculator, component: BatchScalingCalculator },
  { id: 'ai', label: 'AI Assistant', icon: Zap, component: AIAssistant }
];

const MainApp = memo(() => {
  const { state, dispatch } = useApp();
  const { theme, activeTab, serviceMode, modal } = state;

  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { isMobile } = useMobileDetection();

  const handleThemeToggle = () => {
    dispatch({
      type: ActionType.SET_THEME,
      payload: theme === 'light' ? 'dark' : 'light'
    });
  };

  const handleCreateRecipe = () => {
    dispatch({
      type: ActionType.SET_MODAL,
      payload: { view: 'recipe', data: null }
    });
  };

  const handleServiceModeToggle = () => {
    dispatch({
      type: ActionType.SET_SERVICE_MODE,
      payload: !serviceMode
    });
  };

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);



  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark'
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
          <ErrorBoundary
            title={`Error in ${TABS.find(t => t.id === activeTab)?.label || 'Unknown'} Tab`}
            message="There was an error loading this section. Please try refreshing or switching to another tab."
          >
            {TABS.find(t => t.id === activeTab)?.component && React.createElement(TABS.find(t => t.id === activeTab).component)}
          </ErrorBoundary>
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

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
});

MainApp.displayName = 'MainApp';

export default MainApp;
