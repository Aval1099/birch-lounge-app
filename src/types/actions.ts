// =============================================================================
// ACTION TYPE DEFINITIONS
// =============================================================================

import type { Recipe, Ingredient, Technique, Theme, TabId, Modal, Notification, Filters, AppState } from './index';

/**
 * Action type constants
 */
export const ActionType = {
  // App initialization
  INITIALIZE_APP: 'INITIALIZE_APP',
  LOAD_HYBRID_DATA: 'LOAD_HYBRID_DATA',
  SET_INITIALIZED: 'SET_INITIALIZED',

  // Theme and UI
  SET_THEME: 'SET_THEME',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_SERVICE_MODE: 'SET_SERVICE_MODE',

  // Modal management
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SET_MODAL: 'SET_MODAL',

  // Notifications
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',

  // Recipe management
  ADD_RECIPE: 'ADD_RECIPE',
  UPDATE_RECIPE: 'UPDATE_RECIPE',
  DELETE_RECIPE: 'DELETE_RECIPE',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  IMPORT_RECIPES: 'IMPORT_RECIPES',

  // Ingredient management
  ADD_INGREDIENT: 'ADD_INGREDIENT',
  UPDATE_INGREDIENT: 'UPDATE_INGREDIENT',
  DELETE_INGREDIENT: 'DELETE_INGREDIENT',
  IMPORT_INGREDIENTS: 'IMPORT_INGREDIENTS',

  // Technique management
  ADD_TECHNIQUE: 'ADD_TECHNIQUE',
  UPDATE_TECHNIQUE: 'UPDATE_TECHNIQUE',
  DELETE_TECHNIQUE: 'DELETE_TECHNIQUE',

  // Filters
  UPDATE_FILTERS: 'UPDATE_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',

  // Comparison
  TOGGLE_COMPARISON_MODE: 'TOGGLE_COMPARISON_MODE',
  TOGGLE_COMPARE_SELECTION: 'TOGGLE_COMPARE_SELECTION',
  CLEAR_COMPARISON: 'CLEAR_COMPARISON',

  // Menu management
  CREATE_MENU: 'CREATE_MENU',
  UPDATE_MENU: 'UPDATE_MENU',
  DELETE_MENU: 'DELETE_MENU',
  LOAD_MENU: 'LOAD_MENU',
  ADD_MENU_ITEM: 'ADD_MENU_ITEM',
  REMOVE_MENU_ITEM: 'REMOVE_MENU_ITEM',
  REORDER_MENU_ITEMS: 'REORDER_MENU_ITEMS',
  SAVE_MENU: 'SAVE_MENU',

  // Batch scaling
  SET_BATCH_RECIPE: 'SET_BATCH_RECIPE',
  SET_BATCH_SERVINGS: 'SET_BATCH_SERVINGS',
  SET_BATCH_NAME: 'SET_BATCH_NAME',
  SAVE_BATCH: 'SAVE_BATCH',
  DELETE_BATCH: 'DELETE_BATCH',
  LOAD_BATCH: 'LOAD_BATCH',

  // API keys
  SET_GEMINI_API_KEY: 'SET_GEMINI_API_KEY',
} as const;

/**
 * Action interfaces
 */
export interface InitializeAppAction {
  type: typeof ActionType.INITIALIZE_APP;
  payload?: Partial<AppState>;
}

export interface LoadHybridDataAction {
  type: typeof ActionType.LOAD_HYBRID_DATA;
  payload: { data: any };
}

export interface SetInitializedAction {
  type: typeof ActionType.SET_INITIALIZED;
  payload: boolean;
}

export interface SetThemeAction {
  type: typeof ActionType.SET_THEME;
  payload: Theme;
}

export interface SetActiveTabAction {
  type: typeof ActionType.SET_ACTIVE_TAB;
  payload: TabId;
}

export interface SetServiceModeAction {
  type: typeof ActionType.SET_SERVICE_MODE;
  payload: boolean;
}

export interface OpenModalAction {
  type: typeof ActionType.OPEN_MODAL;
  payload: { type: Modal['type']; data?: any };
}

export interface CloseModalAction {
  type: typeof ActionType.CLOSE_MODAL;
}

export interface SetModalAction {
  type: typeof ActionType.SET_MODAL;
  payload: { view: Modal['view']; data?: any };
}

export interface SetNotificationAction {
  type: typeof ActionType.SET_NOTIFICATION;
  payload: Notification;
}

export interface ShowNotificationAction {
  type: typeof ActionType.SHOW_NOTIFICATION;
  payload: Notification;
}

export interface ClearNotificationAction {
  type: typeof ActionType.CLEAR_NOTIFICATION;
}

export interface AddRecipeAction {
  type: typeof ActionType.ADD_RECIPE;
  payload: Recipe;
}

export interface UpdateRecipeAction {
  type: typeof ActionType.UPDATE_RECIPE;
  payload: Recipe;
}

export interface DeleteRecipeAction {
  type: typeof ActionType.DELETE_RECIPE;
  payload: string; // recipe id
}

export interface ToggleFavoriteAction {
  type: typeof ActionType.TOGGLE_FAVORITE;
  payload: string; // recipe id
}

export interface ImportRecipesAction {
  type: typeof ActionType.IMPORT_RECIPES;
  payload: Recipe[];
}

export interface AddIngredientAction {
  type: typeof ActionType.ADD_INGREDIENT;
  payload: Ingredient;
}

export interface UpdateIngredientAction {
  type: typeof ActionType.UPDATE_INGREDIENT;
  payload: Ingredient;
}

export interface DeleteIngredientAction {
  type: typeof ActionType.DELETE_INGREDIENT;
  payload: string; // ingredient id
}

export interface ImportIngredientsAction {
  type: typeof ActionType.IMPORT_INGREDIENTS;
  payload: Ingredient[];
}

export interface AddTechniqueAction {
  type: typeof ActionType.ADD_TECHNIQUE;
  payload: Technique;
}

export interface UpdateTechniqueAction {
  type: typeof ActionType.UPDATE_TECHNIQUE;
  payload: Technique;
}

export interface DeleteTechniqueAction {
  type: typeof ActionType.DELETE_TECHNIQUE;
  payload: string; // technique id
}

export interface UpdateFiltersAction {
  type: typeof ActionType.UPDATE_FILTERS;
  payload: Partial<Filters>;
}

export interface ClearFiltersAction {
  type: typeof ActionType.CLEAR_FILTERS;
}

export interface ToggleComparisonModeAction {
  type: typeof ActionType.TOGGLE_COMPARISON_MODE;
}

export interface ToggleCompareSelectionAction {
  type: typeof ActionType.TOGGLE_COMPARE_SELECTION;
  payload: string; // recipe id
}

export interface ClearComparisonAction {
  type: typeof ActionType.CLEAR_COMPARISON;
}

export interface SetGeminiApiKeyAction {
  type: typeof ActionType.SET_GEMINI_API_KEY;
  payload: string | null;
}

/**
 * Union type of all actions
 */
export type AppAction =
  | InitializeAppAction
  | LoadHybridDataAction
  | SetInitializedAction
  | SetThemeAction
  | SetActiveTabAction
  | SetServiceModeAction
  | OpenModalAction
  | CloseModalAction
  | SetModalAction
  | SetNotificationAction
  | ShowNotificationAction
  | ClearNotificationAction
  | AddRecipeAction
  | UpdateRecipeAction
  | DeleteRecipeAction
  | ToggleFavoriteAction
  | ImportRecipesAction
  | AddIngredientAction
  | UpdateIngredientAction
  | DeleteIngredientAction
  | ImportIngredientsAction
  | AddTechniqueAction
  | UpdateTechniqueAction
  | DeleteTechniqueAction
  | UpdateFiltersAction
  | ClearFiltersAction
  | ToggleComparisonModeAction
  | ToggleCompareSelectionAction
  | ClearComparisonAction
  | SetGeminiApiKeyAction;
