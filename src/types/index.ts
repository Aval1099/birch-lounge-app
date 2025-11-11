// =============================================================================
// CORE TYPE DEFINITIONS
// =============================================================================

/**
 * Base entity interface with common properties
 */
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Recipe ingredient interface
 */
export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
  optional?: boolean;
}

/**
 * Recipe versioning metadata
 */
export interface RecipeVersionMetadata {
  versionNumber: string; // e.g., "1.0", "1.1", "2.0"
  versionName?: string; // e.g., "Original", "Summer Variation", "Low ABV"
  parentRecipeId?: string; // ID of the original/parent recipe
  baseVersionId?: string; // ID of the version this was branched from
  isMainVersion: boolean; // Whether this is the primary/default version
  versionType: 'original' | 'variation' | 'improvement' | 'seasonal' | 'custom' | 'source';
  changeDescription?: string; // What changed in this version
  createdBy?: string; // Who created this version
  approvedBy?: string; // Who approved this version (for collaborative workflows)
  versionStatus: 'draft' | 'published' | 'archived' | 'deprecated';
  branchReason?: string; // Why this version was created
  mergeableWith?: string[]; // Other version IDs this can be merged with
  sourceAttribution?: {
    sourceName: string; // e.g., "Cocktail Codex", "Birch Lounge", "Death & Co"
    sourceType: 'book' | 'website' | 'bartender' | 'original' | 'ai_generated' | 'user_created';
    sourceUrl?: string; // URL if from a website
    sourceAuthor?: string; // Author or bartender name
    sourcePage?: string; // Page number if from a book
    scrapedAt?: string; // When it was scraped/imported
    confidence?: number; // AI confidence in the scraping accuracy (0-1)
  };
}

/**
 * Recipe version comparison result
 */
export interface RecipeVersionComparison {
  versionA: Recipe;
  versionB: Recipe;
  differences: {
    field: string;
    valueA: any;
    valueB: any;
    changeType: 'added' | 'removed' | 'modified';
  }[];
  similarity: number; // 0-1 similarity score
  recommendedAction?: 'merge' | 'keep_separate' | 'archive_old';
}

/**
 * Recipe version history entry
 */
export interface RecipeVersionHistoryEntry {
  id: string;
  recipeId: string;
  versionId: string;
  action: 'created' | 'modified' | 'published' | 'archived' | 'branched' | 'merged';
  timestamp: string;
  userId?: string;
  changes: string[];
  previousVersionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced Recipe interface with versioning support
 */
export interface Recipe extends BaseEntity {
  name: string;
  version?: string; // Deprecated: use versionMetadata.versionNumber
  versionMetadata: RecipeVersionMetadata;
  category: string;
  description?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  glassware?: string;
  garnish?: string;
  techniques?: string[];
  prepTime?: number; // in minutes
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  abv?: number; // alcohol by volume percentage
  yields?: number; // number of servings
  tags?: string[];
  flavorProfile?: string[];
  source?: string;
  notes?: string;
  isFavorite?: boolean;
  rating?: number; // 1-5 stars
  lastMade?: string;
  timesOrdered?: number;

  // Versioning-specific fields
  recipeFamily?: string; // Groups all versions of the same base recipe
  versionHistory?: RecipeVersionHistoryEntry[];
  relatedVersions?: string[]; // IDs of other versions of this recipe
  conflictsWith?: string[]; // Version IDs that conflict with this one
}

/**
 * Ingredient interface
 */
export interface Ingredient extends BaseEntity {
  name: string;
  category: string;
  price?: number;
  unit?: string;
  inStock?: boolean;
  lowStockThreshold?: number;
  currentStock?: number;
  supplier?: string;
  notes?: string;
  abv?: number; // for alcoholic ingredients
  description?: string;
}

/**
 * Technique interface
 */
export interface Technique extends BaseEntity {
  name: string;
  category: string;
  description: string;
  steps: TechniqueStep[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  equipment: string[];
  tips?: string[];
  warnings?: string[];
  videoUrl?: string;
  estimatedTime?: number; // in minutes
  tags?: string[];
}

/**
 * Technique step interface
 */
export interface TechniqueStep {
  stepNumber: number;
  description: string;
  duration?: number; // in seconds
  temperature?: number; // in celsius
  notes?: string;
}

/**
 * Menu interface
 */
export interface Menu extends BaseEntity {
  name: string;
  description?: string;
  items: MenuRecipe[];
  category?: string;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  tags?: string[];
}

/**
 * Menu recipe interface
 */
export interface MenuRecipe {
  recipeId: string;
  recipe: Recipe;
  price?: number;
  isAvailable?: boolean;
  notes?: string;
  position?: number;
}

/**
 * UI-facing menu state stored in context
 */
export interface MenuState {
  id: string | null;
  name: string;
  items: Recipe[];
  createdAt?: number;
  updatedAt?: number;
  category?: string;
}

/**
 * Batch scaling interface
 */
export interface BatchScaling {
  recipe: Recipe | null;
  servings: number;
  name: string;
}

/**
 * Saved batch interface
 */
export interface SavedBatch extends BaseEntity {
  name: string;
  recipe: Recipe;
  servings: number;
  scaledIngredients: RecipeIngredient[];
  notes?: string;
  cost?: number;
}

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Tab type
 */
export type TabId =
  | 'recipes'
  | 'ingredients'
  | 'menus'
  | 'techniques'
  | 'batch'
  | 'service'
  | 'ai'
  | 'demo';

/**
 * Notification type
 */
export interface Notification {
  message: string | null;
  type: 'success' | 'error' | 'warning' | 'info' | null;
}

/**
 * Modal type
 */
export interface Modal {
  isOpen: boolean;
  type: 'recipe' | 'ingredient' | 'technique' | 'menu' | 'settings' | 'auth' | null;
  view?: 'comparison' | null;
  data?: any;
}

/**
 * Filters interface
 */
export interface Filters {
  searchTerm: string;
  category: string;
  flavorProfile: string;
  alcoholContent: string;
  favoritesOnly: boolean;
  difficulty?: string;
  abvRange?: [number, number];
  prepTimeRange?: [number, number];
}

/**
 * Comparison interface
 */
export interface Comparison {
  isActive: boolean;
  selectedIds: string[];
}

/**
 * Application state interface
 */
export interface AppState {
  isInitialized: boolean;
  theme: Theme;
  activeTab: TabId;
  modal: Modal;
  notification: Notification;
  recipes: Recipe[];
  ingredients: Ingredient[];
  techniques: Technique[];
  filters: Filters;
  comparison: Comparison;
  currentMenu: MenuState;
  savedMenus: MenuState[];
  batchScaling: BatchScaling;
  savedBatches: SavedBatch[];
  serviceMode: boolean;
  geminiApiKey: string | null;
}

/**
 * Recipe version management service interfaces
 */
export interface RecipeVersionService {
  createVersion(baseRecipe: Recipe, versionData: Partial<RecipeVersionMetadata>): Promise<Recipe>;
  getVersions(recipeFamily: string): Promise<Recipe[]>;
  getVersionHistory(recipeId: string): Promise<RecipeVersionHistoryEntry[]>;
  compareVersions(versionAId: string, versionBId: string): Promise<RecipeVersionComparison>;
  mergeVersions(targetVersionId: string, sourceVersionId: string): Promise<Recipe>;
  archiveVersion(versionId: string): Promise<void>;
  setMainVersion(versionId: string): Promise<void>;
  branchVersion(baseVersionId: string, branchData: Partial<RecipeVersionMetadata>): Promise<Recipe>;
}

/**
 * Version conflict resolution
 */
export interface VersionConflict {
  id: string;
  recipeFamily: string;
  conflictingVersions: string[];
  conflictType: 'naming' | 'ingredients' | 'instructions' | 'metadata';
  conflictDetails: {
    field: string;
    values: { versionId: string; value: any }[];
  }[];
  resolutionStrategy?: 'manual' | 'auto_merge' | 'keep_latest' | 'keep_main';
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * Recipe family (group of all versions)
 */
export interface RecipeFamily {
  id: string;
  name: string;
  description?: string;
  mainVersionId: string;
  versions: Recipe[];
  totalVersions: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  category: string;
  isArchived: boolean;
}

/**
 * Version branching options
 */
export interface VersionBranchOptions {
  branchType: 'variation' | 'improvement' | 'seasonal' | 'custom';
  branchName: string;
  branchDescription?: string;
  copyIngredients: boolean;
  copyInstructions: boolean;
  copyMetadata: boolean;
  autoPublish: boolean;
}

// Re-export performance types
export * from './performance';

// Re-export offline types
export * from './offline';

// Re-export action types
export type { AppAction } from './actions';
