// =============================================================================
// FEATURE COMPONENTS EXPORTS
// =============================================================================

// Authentication & User Management
export { default as AuthModal } from './AuthModal';
export { default as KeyRotationModal } from './KeyRotationModal';

// Recipe Management
export { default as RecipeFilters } from './RecipeFilters';
export { default as RecipeGrid } from './RecipeGrid';
export { default as RecipeModal } from './RecipeModal';
export { default as VibrantRecipeCard } from './VibrantRecipeCard';
export { default as VibrantRecipeGrid } from './VibrantRecipeGrid';

// Recipe Versioning & History
export { default as RecipeVersionSelector } from './RecipeVersionSelector';
export { default as VersionComparisonModal } from './VersionComparisonModal';
export { default as VersionHistoryPanel } from './VersionHistoryPanel';
export { default as CreateVersionModal } from './CreateVersionModal';

// Recipe Import & Export
export { default as RecipeImporter } from './RecipeImporter';
export { default as RecipeImportModal } from './RecipeImportModal';

// Comparison & Analysis
export { default as ComparisonModal } from './ComparisonModal';

// Settings & Configuration
export { default as SettingsModal } from './SettingsModal';

// PWA & Offline Features
export { OfflineIndicator } from './OfflineIndicator';
export { PWAInstallPrompt } from './PWAInstallPrompt';
export { OfflineDownloadManager } from './OfflineDownloadManager';
export { PWAUpdateNotification } from './PWAUpdateNotification';
export { AdvancedOfflineManager } from './AdvancedOfflineManager';

// Performance Monitoring
export { PerformanceDashboard } from './PerformanceDashboard';
export { PerformanceChart } from './PerformanceChart';
export { PerformanceMetricCard } from './PerformanceMetricCard';
export { PerformanceAlerts } from './PerformanceAlerts';

// MCP & External Services
export { default as MCPDashboard } from './MCPDashboard';

// Demo Components
export { default as SourceVersionDemo } from './SourceVersionDemo';

// Lazy-loaded Feature Components (imported dynamically)
// - AIAssistant
// - MenuBuilder
// - BatchScalingCalculator
// - IngredientsManager
// - TechniquesManager
// - ServiceMode
