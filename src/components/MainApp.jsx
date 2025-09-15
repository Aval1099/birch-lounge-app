import React, { memo, useState } from 'react';
import {
  Plus, Moon, Sun, Package, ChefHat, FileText,
  Calculator, Zap, Settings, BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActionType } from '../constants';
import { Button, ErrorBoundary, Toast, MobileNavigation, ResponsiveContainer } from './ui';
import { useMobileDetection } from '../hooks';
import RecipeGrid from './features/RecipeGrid';
import RecipeFilters from './features/RecipeFilters';
import RecipeModal from './features/RecipeModal';
import IngredientsManager from './features/IngredientsManager';
import MenuBuilder from './features/MenuBuilder';
import BatchScalingCalculator from './features/BatchScalingCalculator';
import AIAssistant from './features/AIAssistant';
import TechniquesManager from './features/TechniquesManager';
import ServiceMode from './features/ServiceMode';
import SettingsModal from './features/SettingsModal';

/**
 * Main Application Component
 * Contains the primary layout and navigation for the cocktail recipe app
 */
const MainApp = memo(() => {
  const { state, dispatch } = useApp();
  const { theme, activeTab, serviceMode, modal } = state;
  const [showSettings, setShowSettings] = useState(false);
  const { isMobile } = useMobileDetection();

  const handleThemeToggle = () => {
    dispatch({
      type: ActionType.SET_THEME,
      payload: theme === 'light' ? 'dark' : 'light'
    });
  };

  const handleTabChange = (tab) => {
    dispatch({
      type: ActionType.SET_ACTIVE_TAB,
      payload: tab
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

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const tabs = [
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'ingredients', label: 'Ingredients', icon: Package },
    { id: 'menus', label: 'Menus', icon: FileText },
    { id: 'techniques', label: 'Techniques', icon: BookOpen },
    { id: 'batch', label: 'Batch Scaling', icon: Calculator },
    { id: 'ai', label: 'AI Assistant', icon: Zap }
  ];

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Header - Desktop Only */}
      {!isMobile && (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
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

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Service Mode Toggle */}
              <Button
                onClick={handleServiceModeToggle}
                variant={serviceMode ? 'primary' : 'ghost'}
                className="hidden sm:flex"
                ariaLabel={serviceMode ? 'Exit service mode' : 'Enter service mode'}
              >
                <Zap className="w-4 h-4" />
                Service Mode
              </Button>

              {/* Create Recipe Button */}
              <Button
                onClick={handleCreateRecipe}
                variant="primary"
                className="hidden sm:flex"
                ariaLabel="Create new recipe"
              >
                <Plus className="w-4 h-4" />
                New Recipe
              </Button>

              {/* Theme Toggle */}
              <Button
                onClick={handleThemeToggle}
                variant="ghost"
                className="p-2"
                ariaLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>

              {/* Settings */}
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

      {/* Navigation */}
      <MobileNavigation tabs={tabs} />

      {/* Main Content */}
      <main>
        <ResponsiveContainer>
        <ErrorBoundary
          title={`Error in ${tabs.find(t => t.id === activeTab)?.label || 'Unknown'} Tab`}
          message="There was an error loading this section. Please try refreshing or switching to another tab."
        >
          {activeTab === 'recipes' && (
            <div>
              <RecipeFilters />
              <RecipeGrid />
            </div>
          )}
          
          {activeTab === 'ingredients' && <IngredientsManager />}

          {activeTab === 'menus' && <MenuBuilder />}

          {activeTab === 'techniques' && <TechniquesManager />}

          {activeTab === 'batch' && <BatchScalingCalculator />}

          {activeTab === 'ai' && <AIAssistant />}

          {activeTab === 'service' && <ServiceMode />}
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

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
});

MainApp.displayName = 'MainApp';

export default MainApp;
