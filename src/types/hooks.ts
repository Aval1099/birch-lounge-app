/**
 * Type definitions for custom hooks
 * Centralized type definitions to resolve TypeScript errors
 */

// Advanced Search Hook Types
export interface AdvancedSearchOptions {
  searchFields?: string[];
  delay?: number;
  fuzzyThreshold?: number;
  maxResults?: number;
  enableFuzzy?: boolean;
  enableHighlight?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  sortByRelevance?: boolean;
}

export type SearchResult<T = any> = T & {
  _relevanceScore: number;
  _highlightedFields?: Record<string, string>;
};

export interface SearchHistory {
  term: string;
  timestamp: number;
  resultCount: number;
}

// Autosave Hook Types
export interface AutosaveOptions {
  delay?: number;
  enabled?: boolean;
  skipInitial?: boolean;
  onSaveStart?: (() => void) | null;
  onSaveSuccess?: (() => void) | null;
  onSaveError?: ((error: Error) => void) | null;
}

export interface AutosaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  hasUnsavedChanges: boolean;
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Local Storage Types
export interface LocalStorageOptions {
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

// Bottom Sheet Hook Types
export interface BottomSheetOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  forceDesktop?: boolean;
}

export interface BottomSheetState {
  isOpen: boolean;
  isDesktop: boolean;
  shouldUseModal: boolean;
}

// Loading State Hook Types
export interface LoadingStateOptions {
  initialLoading?: boolean;
  minLoadingTime?: number;
  showSkeleton?: boolean;
  skeletonType?: string;
  skeletonCount?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  loadingStartTime: number | null;
  canShowContent: boolean;
}

export interface OptimisticLoadingOptions {
  showLoading?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

// Mobile Hook Types
export interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocity?: number;
}

export interface TouchPosition {
  x: number;
  y: number;
}

export interface TapOptions {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface MobileDetection {
  isMobile: boolean;
  isTouch: boolean;
  screenSize: ScreenSize;
}

// Local Storage Hook Types
export interface LocalStorageState<T> {
  value: T;
  error: Error | null;
  isLoading: boolean;
}

export interface ApiKeyState {
  apiKey: string;
  isValid: boolean;
  error: Error | null;
}

// Debounce Hook Types
export type DebouncedCallback<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

// Event Handler Types
export type TouchEventHandler = (e: TouchEvent) => void;
export type MouseEventHandler = (e: MouseEvent) => void;
export type KeyboardEventHandler = (e: KeyboardEvent) => void;

// Generic Utility Types
export type AsyncOperation<T = any> = () => Promise<T>;
export type SaveFunction<T = any> = (data: T) => Promise<void>;
export type ValidatorFunction<T = any> = (value: T) => boolean;

// Recipe and App Specific Types (for selectors)
export interface RecipeGroup {
  [key: string]: any[];
}

export interface IngredientCategory {
  spiritsAndCordials: any[];
  otherIngredients: any[];
}

export interface AppStats {
  totalRecipes: number;
  favoriteRecipes: number;
  categories: number;
  averageRating: number;
}
