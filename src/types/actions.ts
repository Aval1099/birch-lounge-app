// =============================================================================
// ACTION TYPE DEFINITIONS ALIGNED WITH APP STATE
// =============================================================================

import { ActionType } from '../constants';

import type {
  AppState,
  Filters,
  Ingredient,
  MenuState,
  Modal,
  Notification,
  Recipe,
  SavedBatch,
  TabId,
  Technique,
  Theme
} from './index';

/**
 * App initialization actions
 */
export interface InitializeAppAction {
  type: typeof ActionType.INITIALIZE_APP;
}

export interface LoadHybridDataAction {
  type: typeof ActionType.LOAD_HYBRID_DATA;
  payload: { data: Partial<AppState> };
}

/**
 * Theme and navigation actions
 */
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

/**
 * Modal and notification actions
 */
export interface OpenModalAction {
  type: typeof ActionType.OPEN_MODAL;
  payload: { type: Modal['type']; data?: unknown };
}

export interface CloseModalAction {
  type: typeof ActionType.CLOSE_MODAL;
}

export interface SetModalAction {
  type: typeof ActionType.SET_MODAL;
  payload: Modal;
}

export interface SetNotificationAction {
  type: typeof ActionType.SET_NOTIFICATION;
  payload: Notification;
}

export interface ShowNotificationAction {
  type: typeof ActionType.SHOW_NOTIFICATION;
  payload: Notification;
}

/**
 * Recipe actions
 */
export interface AddRecipeAction {
  type: typeof ActionType.ADD_RECIPE;
  payload: Recipe;
}

export interface SaveRecipeAction {
  type: typeof ActionType.SAVE_RECIPE;
  payload: Recipe;
}

export interface DeleteRecipeAction {
  type: typeof ActionType.DELETE_RECIPE;
  payload: string;
}

export interface ToggleFavoriteAction {
  type: typeof ActionType.TOGGLE_FAVORITE;
  payload: string;
}

/**
 * Ingredient actions
 */
export interface SaveIngredientAction {
  type: typeof ActionType.SAVE_INGREDIENT;
  payload: Ingredient;
}

export interface DeleteIngredientAction {
  type: typeof ActionType.DELETE_INGREDIENT;
  payload: string;
}

/**
 * Technique actions
 */
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
  payload: string;
}

export interface ToggleTechniqueFavoriteAction {
  type: typeof ActionType.TOGGLE_TECHNIQUE_FAVORITE;
  payload: { techniqueId: string; isFavorite: boolean };
}

/**
 * Filter and comparison actions
 */
export interface UpdateFiltersAction {
  type: typeof ActionType.UPDATE_FILTERS;
  payload: Partial<Filters>;
}

export interface ToggleComparisonModeAction {
  type: typeof ActionType.TOGGLE_COMPARISON_MODE;
}

export interface ToggleCompareSelectionAction {
  type: typeof ActionType.TOGGLE_COMPARE_SELECTION;
  payload: string;
}

/**
 * Menu actions
 */
export interface UpdateCurrentMenuAction {
  type: typeof ActionType.UPDATE_CURRENT_MENU;
  payload: Partial<MenuState>;
}

export interface AddRecipeToMenuAction {
  type: typeof ActionType.ADD_RECIPE_TO_MENU;
  payload: { menuId: string; recipe: Recipe };
}

export interface RemoveFromMenuAction {
  type: typeof ActionType.REMOVE_FROM_MENU;
  payload: string;
}

export interface ClearCurrentMenuAction {
  type: typeof ActionType.CLEAR_CURRENT_MENU;
}

export interface SaveCurrentMenuAction {
  type: typeof ActionType.SAVE_CURRENT_MENU;
  payload: MenuState;
}

export interface LoadSavedMenuAction {
  type: typeof ActionType.LOAD_SAVED_MENU;
  payload: MenuState;
}

export interface DeleteSavedMenuAction {
  type: typeof ActionType.DELETE_SAVED_MENU;
  payload: string;
}

export interface ReorderMenuItemsAction {
  type: typeof ActionType.REORDER_MENU_ITEMS;
  payload: Recipe[];
}

/**
 * Batch scaling actions
 */
export interface SetBatchRecipeAction {
  type: typeof ActionType.SET_BATCH_RECIPE;
  payload: Recipe | null;
}

export interface UpdateBatchServingsAction {
  type: typeof ActionType.UPDATE_BATCH_SERVINGS;
  payload: number;
}

export interface ClearBatchAction {
  type: typeof ActionType.CLEAR_BATCH;
}

export interface SaveBatchAction {
  type: typeof ActionType.SAVE_BATCH;
  payload: SavedBatch;
}

export interface LoadBatchAction {
  type: typeof ActionType.LOAD_BATCH;
  payload: SavedBatch;
}

export interface DeleteBatchAction {
  type: typeof ActionType.DELETE_BATCH;
  payload: string;
}

/**
 * API key actions
 */
export interface SetGeminiApiKeyAction {
  type: typeof ActionType.SET_GEMINI_API_KEY;
  payload: string | null;
}

/**
 * Union of all supported actions
 */
export type AppAction =
  | InitializeAppAction
  | LoadHybridDataAction
  | SetThemeAction
  | SetActiveTabAction
  | SetServiceModeAction
  | OpenModalAction
  | CloseModalAction
  | SetModalAction
  | SetNotificationAction
  | ShowNotificationAction
  | AddRecipeAction
  | SaveRecipeAction
  | DeleteRecipeAction
  | ToggleFavoriteAction
  | SaveIngredientAction
  | DeleteIngredientAction
  | AddTechniqueAction
  | UpdateTechniqueAction
  | DeleteTechniqueAction
  | ToggleTechniqueFavoriteAction
  | UpdateFiltersAction
  | ToggleComparisonModeAction
  | ToggleCompareSelectionAction
  | UpdateCurrentMenuAction
  | AddRecipeToMenuAction
  | RemoveFromMenuAction
  | ClearCurrentMenuAction
  | SaveCurrentMenuAction
  | LoadSavedMenuAction
  | DeleteSavedMenuAction
  | ReorderMenuItemsAction
  | SetBatchRecipeAction
  | UpdateBatchServingsAction
  | ClearBatchAction
  | SaveBatchAction
  | LoadBatchAction
  | DeleteBatchAction
  | SetGeminiApiKeyAction;

export { ActionType };

