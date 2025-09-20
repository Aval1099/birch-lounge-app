// =============================================================================
// APPLICATION CONSTANTS
// =============================================================================

export const APP_VERSION = '2.3.0-ai-assistant';
export const STORAGE_KEY = 'birch-lounge-app-v2';
export const DEBOUNCE_DELAY = 150; // Faster for service mode
export const MAX_COMPARISON_ITEMS = 3;

// Mobile-First Design Constants
export const TOUCH_TARGET_SIZE = {
  MINIMUM: 44, // 44px minimum touch target (WCAG AA)
  RECOMMENDED: 48, // 48px recommended touch target
  COMFORTABLE: 56 // 56px comfortable touch target
};

export const BREAKPOINTS = {
  SM: 640,   // Small devices (phones)
  MD: 768,   // Medium devices (tablets)
  LG: 1024,  // Large devices (laptops)
  XL: 1280,  // Extra large devices (desktops)
  '2XL': 1536 // 2X large devices (large desktops)
};

export const MOBILE_GESTURES = {
  SWIPE_THRESHOLD: 50, // Minimum distance for swipe detection
  SWIPE_VELOCITY: 0.3, // Minimum velocity for swipe
  TAP_TIMEOUT: 300,    // Maximum time for tap detection
  LONG_PRESS_TIMEOUT: 500 // Minimum time for long press
};

// Ingredient Categories - Reorganized for bar management
export const INGREDIENT_CATEGORIES = {
  // Non-Alcoholic Ingredients
  NON_ALCOHOLIC: {
    'Mixers': ['Juices', 'Syrups', 'Sodas', 'Tonic', 'Club Soda'],
    'Fresh Ingredients': ['Fresh Juices', 'Citrus', 'Herbs', 'Fruits', 'Dairy'],
    'Garnish': ['Olives', 'Cherries', 'Citrus Peels', 'Herbs', 'Salts', 'Sugars'],
    'Bitters': ['Aromatic Bitters', 'Orange Bitters', 'Specialty Bitters'],
    'Misc': ['Ice', 'Water', 'Other Non-Alcoholic']
  },

  // Alcoholic Categories
  ALCOHOLIC: {
    'Beer': ['Lager', 'IPA', 'Stout', 'Wheat Beer', 'Sour Beer', 'Other Beer'],
    'Wine': ['Red Wine', 'White Wine', 'Sparkling Wine', 'Fortified Wine', 'Other Wine'],
    'Liquor': {
      'Whiskey': ['Bourbon', 'Rye', 'Scotch', 'Irish', 'Japanese', 'Other Whiskey'],
      'Gin': ['London Dry', 'Plymouth', 'Old Tom', 'Navy Strength', 'Other Gin'],
      'Rum': ['White Rum', 'Dark Rum', 'Spiced Rum', 'Aged Rum', 'Other Rum'],
      'Vodka': ['Premium Vodka', 'Standard Vodka', 'Flavored Vodka', 'Other Vodka'],
      'Agave': ['Tequila Blanco', 'Tequila Reposado', 'Tequila Añejo', 'Mezcal', 'Other Agave'],
      'Cordials/Liqueur': ['Fruit Liqueurs', 'Herbal Liqueurs', 'Cream Liqueurs', 'Other Liqueurs'],
      'Amari': ['Italian Amari', 'Digestivi', 'Aperitivi', 'Other Amari'],
      'Misc': ['Brandy', 'Cognac', 'Absinthe', 'Vermouth', 'Other Spirits']
    }
  }
};

// Flattened categories for backwards compatibility
export const INGREDIENT_CATEGORIES_FLAT = [
  // Non-Alcoholic
  'Mixers', 'Fresh Ingredients', 'Garnish', 'Bitters', 'Misc',
  // Alcoholic
  'Beer', 'Wine', 'Whiskey', 'Gin', 'Rum', 'Vodka', 'Agave',
  'Cordials/Liqueur', 'Amari', 'Misc Spirits'
];

// Ordering System Constants
export const ORDERING_CATEGORIES = [
  'ingredients', // Non-alcoholic ingredients
  'beer',        // Beer inventory
  'wine',        // Wine inventory
  'liquor'       // All spirits and liquors
];

export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  NEED_TO_ORDER: 'need_to_order',
  ORDERED: 'ordered'
};

export const FLAVOR_PROFILES = [
  'bitter', 'sweet', 'citrusy', 'smoky', 'herbal', 'spicy', 'fruity', 
  'floral', 'earthy', 'rich', 'bright', 'smooth', 'complex', 'approachable'
];

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Advanced'];

export const UNITS = [
  'oz', 'ml', 'dash', 'dashes', 'barspoon', 'tbsp', 'tsp', 'sprig', 
  'wedge', 'slice', 'peel', 'leaf', 'whole', 'rim'
];

export const BASE_SPIRITS = [
  'All', 'Whiskey', 'Gin', 'Rum', 'Tequila', 'Vodka', 'Brandy', 
  'Amari', 'Wine', 'Beer', 'Liqueur/Other'
];

// Action Types for State Management
export const ActionType = {
  INITIALIZE_APP: 'INITIALIZE_APP',
  LOAD_HYBRID_DATA: 'LOAD_HYBRID_DATA',
  SET_THEME: 'SET_THEME',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_MODAL: 'SET_MODAL',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  UPDATE_FILTERS: 'UPDATE_FILTERS',
  SAVE_RECIPE: 'SAVE_RECIPE',
  DELETE_RECIPE: 'DELETE_RECIPE',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  SAVE_INGREDIENT: 'SAVE_INGREDIENT',
  DELETE_INGREDIENT: 'DELETE_INGREDIENT',
  TOGGLE_COMPARISON_MODE: 'TOGGLE_COMPARISON_MODE',
  TOGGLE_COMPARE_SELECTION: 'TOGGLE_COMPARE_SELECTION',
  UPDATE_CURRENT_MENU: 'UPDATE_CURRENT_MENU',
  ADD_TO_MENU: 'ADD_TO_MENU',
  REMOVE_FROM_MENU: 'REMOVE_FROM_MENU',
  SAVE_CURRENT_MENU: 'SAVE_CURRENT_MENU',
  LOAD_SAVED_MENU: 'LOAD_SAVED_MENU',
  DELETE_SAVED_MENU: 'DELETE_SAVED_MENU',
  CLEAR_CURRENT_MENU: 'CLEAR_CURRENT_MENU',
  REORDER_MENU_ITEMS: 'REORDER_MENU_ITEMS',
  SET_BATCH_RECIPE: 'SET_BATCH_RECIPE',
  UPDATE_BATCH_SERVINGS: 'UPDATE_BATCH_SERVINGS',
  CLEAR_BATCH: 'CLEAR_BATCH',
  ADD_RECIPE_TO_MENU: 'ADD_RECIPE_TO_MENU',
  SAVE_BATCH: 'SAVE_BATCH',
  LOAD_BATCH: 'LOAD_BATCH',
  DELETE_BATCH: 'DELETE_BATCH',
  SET_SERVICE_MODE: 'SET_SERVICE_MODE',
  SET_GEMINI_API_KEY: 'SET_GEMINI_API_KEY',
  SAVE_RECIPE_DRAFT: 'SAVE_RECIPE_DRAFT',
  LOAD_RECIPE_DRAFT: 'LOAD_RECIPE_DRAFT',
  CLEAR_RECIPE_DRAFT: 'CLEAR_RECIPE_DRAFT',

  // Techniques Management
  ADD_TECHNIQUE: 'ADD_TECHNIQUE',
  UPDATE_TECHNIQUE: 'UPDATE_TECHNIQUE',
  DELETE_TECHNIQUE: 'DELETE_TECHNIQUE',
  TOGGLE_TECHNIQUE_FAVORITE: 'TOGGLE_TECHNIQUE_FAVORITE'
};
