#!/usr/bin/env node

/**
 * AUTOMATED FRONTEND REBUILD SCRIPT
 *
 * This script will completely rebuild the frontend with vibrant colors
 * and modern design while preserving all backend functionality.
 *
 * Usage: node scripts/automated-frontend-rebuild.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.warn('🚀 Starting Automated Frontend Rebuild...\n');

// Helper function to safely write files
function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.warn(`✅ Created/Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error.message);
  }
}

// Helper function to run commands
function runCommand(command, description) {
  try {
    console.warn(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.warn(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
  }
}

// Phase 1: Update MainApp.jsx with vibrant layout
console.warn('📱 Phase 1: Rebuilding Main Application Layout...');

const mainAppContent = `import {
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
  AuthModal, ComparisonModal, RecipeFilters, RecipeGrid, RecipeModal, SettingsModal,
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
  <VibrantCard variant="glass" className="m-4">
    <RecipeFilters />
    <RecipeGrid />
  </VibrantCard>
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
      className={\`min-h-screen transition-all duration-300 \${theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 text-gray-100'
        : 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 text-gray-900'
        }\`}>

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
      <main className={\`\${isMobile ? 'pb-20' : ''}\`}>
        <ResponsiveContainer>
          <EnhancedErrorBoundary
            title={\`Error in \${TABS.find(t => t.id === activeTab)?.label || 'Unknown'} Tab\`}
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
`;

writeFile('src/components/MainApp.jsx', mainAppContent);

// Phase 2: Create vibrant recipe components
console.warn('🍸 Phase 2: Creating Vibrant Recipe Components...');

const vibrantRecipeCardContent = `import { Heart, Clock, DollarSign, Users, Edit, Trash2 } from 'lucide-react';
import { VibrantCard, VibrantButton } from '../ui';

const VibrantRecipeCard = ({ recipe, onEdit, onFavorite, onAddToMenu, onBatchScale, onDelete }) => {
  const {
    id, name, category, difficulty, prepTime, cost, ingredients = [],
    isFavorite = false, flavorProfile = [], description = ''
  } = recipe;

  return (
    <VibrantCard
      variant="gradient"
      hover={true}
      clickable={true}
      className="group cursor-pointer transform transition-all duration-200"
      onClick={() => onEdit(recipe)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                {category}
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                {difficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(id);
              }}
              icon={<Heart className={\`w-4 h-4 \${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}\`} />}
              className="p-2"
            />
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(recipe);
              }}
              icon={<Edit className="w-4 h-4" />}
              className="p-2 text-gray-400 hover:text-emerald-600"
            />
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              icon={<Trash2 className="w-4 h-4" />}
              className="p-2 text-gray-400 hover:text-red-600"
            />
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {description}
          </p>
        )}

        {/* Flavor Profile */}
        {flavorProfile.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flavorProfile.slice(0, 3).map((flavor) => (
              <span
                key={flavor}
                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"
              >
                {flavor}
              </span>
            ))}
            {flavorProfile.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{flavorProfile.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{prepTime || '5 min'}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>\${cost?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>1</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ingredients ({ingredients.length})
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {ingredients.slice(0, 3).map((ing, index) => (
              <span key={index}>
                {ing.amount} {ing.unit} {ing.name}
                {index < Math.min(2, ingredients.length - 1) && ', '}
              </span>
            ))}
            {ingredients.length > 3 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {' '}and {ingredients.length - 3} more...
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <VibrantButton
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToMenu(recipe);
            }}
            className="flex-1"
          >
            Add to Menu
          </VibrantButton>
          <VibrantButton
            variant="accent"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBatchScale(recipe);
            }}
            className="flex-1"
          >
            Batch Scale
          </VibrantButton>
        </div>
      </div>
    </VibrantCard>
  );
};

export default VibrantRecipeCard;
`;

writeFile('src/components/features/VibrantRecipeCard.jsx', vibrantRecipeCardContent);

// Phase 3: Update RecipeGrid to use VibrantRecipeCard
console.warn('📋 Phase 3: Updating Recipe Grid...');

const vibrantRecipeGridContent = `import { useApp } from '../../hooks/useApp';
import { ActionType } from '../../constants';
import VibrantRecipeCard from './VibrantRecipeCard';
import { VibrantCard } from '../ui';

const VibrantRecipeGrid = () => {
  const { state, dispatch } = useApp();
  const { recipes, filters } = state;

  // Filter recipes based on current filters
  const filteredRecipes = recipes.filter(recipe => {
    if (filters.searchTerm && !recipe.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'All' && recipe.category !== filters.category) {
      return false;
    }
    if (filters.flavorProfile !== 'All' && !recipe.flavorProfile?.includes(filters.flavorProfile)) {
      return false;
    }
    if (filters.alcoholContent !== 'All') {
      const isAlcoholic = recipe.category !== 'Mocktail';
      if (filters.alcoholContent === 'Alcoholic' && !isAlcoholic) return false;
      if (filters.alcoholContent === 'Non-Alcoholic' && isAlcoholic) return false;
    }
    if (filters.favoritesOnly && !recipe.isFavorite) {
      return false;
    }
    return true;
  });

  const handleEdit = (recipe) => {
    dispatch({
      type: ActionType.OPEN_MODAL,
      payload: { type: 'recipe', data: recipe }
    });
  };

  const handleFavorite = (recipeId) => {
    dispatch({
      type: ActionType.TOGGLE_FAVORITE,
      payload: recipeId
    });
  };

  const handleAddToMenu = (recipe) => {
    dispatch({
      type: ActionType.ADD_TO_MENU,
      payload: recipe
    });
  };

  const handleBatchScale = (recipe) => {
    dispatch({
      type: ActionType.SET_BATCH_RECIPE,
      payload: recipe
    });
    dispatch({
      type: ActionType.SET_ACTIVE_TAB,
      payload: 'batch'
    });
  };

  const handleDelete = (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      dispatch({
        type: ActionType.DELETE_RECIPE,
        payload: recipeId
      });
    }
  };

  if (filteredRecipes.length === 0) {
    return (
      <VibrantCard variant="glass" className="text-center py-12 m-4">
        <div className="text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">No recipes found</h3>
          <p className="text-sm">Try adjusting your filters or add a new recipe.</p>
        </div>
      </VibrantCard>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <VibrantRecipeCard
            key={recipe.id}
            recipe={recipe}
            onEdit={handleEdit}
            onFavorite={handleFavorite}
            onAddToMenu={handleAddToMenu}
            onBatchScale={handleBatchScale}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default VibrantRecipeGrid;
`;

writeFile('src/components/features/VibrantRecipeGrid.jsx', vibrantRecipeGridContent);

// Phase 4: Update feature exports
console.warn('🔧 Phase 4: Updating Feature Exports...');

const featuresIndexContent = `// =============================================================================
// FEATURE COMPONENTS EXPORTS
// =============================================================================

// Authentication & User Management
export { default as AuthModal } from './AuthModal';

// Recipe Management
export { default as RecipeFilters } from './RecipeFilters';
export { default as RecipeGrid } from './RecipeGrid';
export { default as RecipeModal } from './RecipeModal';
export { default as VibrantRecipeCard } from './VibrantRecipeCard';
export { default as VibrantRecipeGrid } from './VibrantRecipeGrid';

// Comparison & Analysis
export { default as ComparisonModal } from './ComparisonModal';

// Settings & Configuration
export { default as SettingsModal } from './SettingsModal';

// PWA & Offline Features
export { default as OfflineIndicator } from './OfflineIndicator';
export { default as PWAInstallPrompt } from './PWAInstallPrompt';
export { default as OfflineDownloadManager } from './OfflineDownloadManager';
export { default as PWAUpdateNotification } from './PWAUpdateNotification';

// Lazy-loaded Feature Components (imported dynamically)
// - AIAssistant
// - MenuBuilder
// - BatchScalingCalculator
// - IngredientsManager
// - TechniquesManager
// - ServiceMode
`;

writeFile('src/components/features/index.js', featuresIndexContent);

// Phase 5: Run build and validation
console.warn('🏗️ Phase 5: Building and Validating...');

runCommand('npm run build', 'Building application');
runCommand('npm run lint:fix', 'Fixing linting issues');

console.warn('✅ Automated Frontend Rebuild Complete!');
console.warn('🎉 Your Birch Lounge app now has a vibrant, modern interface!');
console.warn('🚀 Run "npm run dev" to see the results.');

// Phase 6: Cleanup unused files (will be done in diagnostic phase)
console.warn('📋 Phase 6: Diagnostic and cleanup will be performed next...');
