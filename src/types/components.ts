// =============================================================================
// COMPONENT PROP TYPE DEFINITIONS
// =============================================================================

import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Recipe, Ingredient, Technique, Menu, Theme } from './index';

/**
 * Common component props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Button component props
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  touchOptimized?: boolean;
  icon?: LucideIcon;
}

/**
 * Input component props
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Textarea component props
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  onClick?: () => void;
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

/**
 * Loading spinner props
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * Toast notification props
 */
export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any, errorContext?: any) => void;
  onRetry?: (retryCount: number) => void;
}

/**
 * Recipe modal props
 */
export interface RecipeModalProps {
  recipe?: Recipe | null;
  onClose: () => void;
  onSave?: (recipe: Recipe) => void;
}

/**
 * Recipe grid props
 */
export interface RecipeGridProps {
  recipes?: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
  onRecipeEdit?: (recipe: Recipe) => void;
  onRecipeDelete?: (recipeId: string) => void;
  loading?: boolean;
}

/**
 * Recipe card props
 */
export interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Ingredient manager props
 */
export interface IngredientsManagerProps {
  ingredients?: Ingredient[];
  onIngredientAdd?: (ingredient: Ingredient) => void;
  onIngredientEdit?: (ingredient: Ingredient) => void;
  onIngredientDelete?: (ingredientId: string) => void;
}

/**
 * Technique manager props
 */
export interface TechniquesManagerProps {
  techniques?: Technique[];
  onTechniqueAdd?: (technique: Technique) => void;
  onTechniqueEdit?: (technique: Technique) => void;
  onTechniqueDelete?: (techniqueId: string) => void;
}

/**
 * Menu builder props
 */
export interface MenuBuilderProps {
  menu?: Menu | null;
  recipes?: Recipe[];
  onMenuSave?: (menu: Menu) => void;
  onMenuLoad?: (menu: Menu) => void;
}

/**
 * Search props
 */
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  loading?: boolean;
  debounceMs?: number;
}

/**
 * Filter props
 */
export interface FilterProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiple?: boolean;
}

/**
 * Tab props
 */
export interface TabProps {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType;
  disabled?: boolean;
}

/**
 * Mobile navigation props
 */
export interface MobileNavigationProps {
  tabs: TabProps[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

/**
 * Responsive grid props
 */
export interface ResponsiveGridProps extends BaseComponentProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Skeleton loader props
 */
export interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
  animate?: boolean;
}

/**
 * Autosave indicator props
 */
export interface AutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  hasUnsavedChanges?: boolean;
  error?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * App provider props
 */
export interface AppProviderProps {
  children: ReactNode;
  initialState?: any;
}
