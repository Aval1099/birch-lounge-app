// =============================================================================
// APP REDUCER AND INITIAL STATE
// =============================================================================

import { ActionType, MAX_COMPARISON_ITEMS } from '../constants';
import { getInitialIngredients, getInitialRecipes, getInitialTechniques } from '../data/initialData';
import { validateRecipe, createIngredient } from '../models';
import { storageService } from '../services/storageService';
import { safeParseInt } from '../utils';

// Initial application state
export const initialAppState = {
  isInitialized: false,
  theme: 'light',
  activeTab: 'recipes',
  modal: {
    isOpen: false,
    type: null,
    data: null
  },
  notification: { 
    message: null, 
    type: null 
  },
  recipes: [],
  ingredients: [],
  techniques: [],
  filters: {
    searchTerm: '',
    category: 'All',
    flavorProfile: 'All',
    favoritesOnly: false
  },
  comparison: {
    isActive: false,
    selectedIds: []
  },
  currentMenu: {
    id: null,
    name: '',
    items: []
  },
  savedMenus: [],
  batchScaling: {
    recipe: null,
    servings: 1,
    name: ''
  },
  savedBatches: [],
  serviceMode: false,
  geminiApiKey: ''
};

/**
 * Main application reducer
 * @param {Object} state - Current state
 * @param {Object} action - Action object with type and payload
 * @returns {Object} New state
 */
export const appReducer = (state, action) => {
  switch (action.type) {
    case ActionType.INITIALIZE_APP: {
      // Note: We'll load data asynchronously in the AppProvider
      // This action just sets up the initial state structure
      const savedData = storageService.load(); // Fallback to localStorage for immediate load
      return {
        ...initialAppState,
        ...(savedData || {}),
        recipes: savedData?.recipes || getInitialRecipes(),
        ingredients: savedData?.ingredients || getInitialIngredients(),
        techniques: savedData?.techniques || getInitialTechniques(),
        savedBatches: savedData?.savedBatches || [],
        isInitialized: true
      };
    }

    case ActionType.LOAD_HYBRID_DATA: {
      // Action to load data from hybrid storage (async)
      const { data } = action.payload;
      return {
        ...state,
        recipes: data?.recipes || state.recipes,
        ingredients: data?.ingredients || state.ingredients,
        techniques: data?.techniques || state.techniques,
        savedMenus: data?.savedMenus || state.savedMenus,
        savedBatches: data?.savedBatches || state.savedBatches,
        theme: data?.theme || state.theme,
        isInitialized: true
      };
    }

    case ActionType.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };

    case ActionType.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      };

    case ActionType.SET_MODAL:
      return {
        ...state,
        modal: action.payload
      };

    case ActionType.OPEN_MODAL:
      return {
        ...state,
        modal: {
          isOpen: true,
          type: action.payload.type,
          data: action.payload.data
        }
      };

    case ActionType.CLOSE_MODAL:
      return {
        ...state,
        modal: {
          isOpen: false,
          type: null,
          data: null
        }
      };

    case ActionType.SET_NOTIFICATION:
      return {
        ...state,
        notification: action.payload
      };

    case ActionType.UPDATE_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case ActionType.SAVE_RECIPE: {
      const recipe = action.payload;
      const { isValid, errors } = validateRecipe(recipe);
      
      if (!isValid) {
        return {
          ...state,
          notification: {
            message: errors.join(', '),
            type: 'error'
          }
        };
      }

      const recipeExists = state.recipes.some(r => r.id === recipe.id);
      
      return {
        ...state,
        notification: { message: null, type: null },
        recipes: recipeExists
          ? state.recipes.map(r => r.id === recipe.id ? recipe : r)
          : [...state.recipes, recipe]
      };
    }

    case ActionType.DELETE_RECIPE:
      return {
        ...state,
        recipes: state.recipes.filter(r => r.id !== action.payload)
      };

    case ActionType.TOGGLE_FAVORITE:
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.payload.recipeId
            ? { ...r, isFavorite: action.payload.isFavorite }
            : r
        )
      };

    case ActionType.SAVE_INGREDIENT: {
      const ingredient = createIngredient(action.payload);
      
      if (!ingredient.name) {
        return {
          ...state,
          notification: {
            message: "Ingredient name is required.",
            type: 'error'
          }
        };
      }

      const ingredientExists = state.ingredients.some(i => i.id === ingredient.id);
      const nameCollision = state.ingredients.some(i =>
        i.name.toLowerCase() === ingredient.name.toLowerCase() && 
        i.id !== ingredient.id
      );

      if (nameCollision) {
        return {
          ...state,
          notification: {
            message: `An ingredient named "${ingredient.name}" already exists.`,
            type: 'error'
          }
        };
      }

      return {
        ...state,
        notification: {
          message: `${ingredient.name} saved.`,
          type: 'success'
        },
        ingredients: ingredientExists
          ? state.ingredients.map(i => i.id === ingredient.id ? ingredient : i)
          : [...state.ingredients, ingredient]
      };
    }

    case ActionType.DELETE_INGREDIENT:
      return {
        ...state,
        ingredients: state.ingredients.filter(i => i.id !== action.payload)
      };

    case ActionType.TOGGLE_COMPARISON_MODE:
      return {
        ...state,
        comparison: {
          ...state.comparison,
          isActive: !state.comparison.isActive,
          selectedIds: state.comparison.isActive ? [] : state.comparison.selectedIds
        }
      };

    case ActionType.TOGGLE_COMPARE_SELECTION: {
      const id = action.payload;
      const currentIds = state.comparison.selectedIds;
      
      let newIds;
      if (currentIds.includes(id)) {
        newIds = currentIds.filter(i => i !== id);
      } else {
        newIds = [...currentIds, id];
      }

      // Limit to maximum comparison items
      if (newIds.length > MAX_COMPARISON_ITEMS) {
        return state;
      }

      return {
        ...state,
        comparison: {
          ...state.comparison,
          selectedIds: newIds
        }
      };
    }

    case ActionType.UPDATE_CURRENT_MENU:
      return {
        ...state,
        currentMenu: {
          ...state.currentMenu,
          ...action.payload
        }
      };

    case ActionType.ADD_RECIPE_TO_MENU: {
      const { menuId, recipe } = action.payload;
      
      if (menuId === 'current') {
        // Check if recipe already exists in current menu
        if (state.currentMenu.items.some(i => i.id === recipe.id)) {
          return state;
        }
        
        return {
          ...state,
          currentMenu: {
            ...state.currentMenu,
            items: [...state.currentMenu.items, recipe]
          }
        };
      } else {
        // Add to saved menu
        const menuIndex = state.savedMenus.findIndex(m => m.id === menuId);
        if (menuIndex === -1) return state;

        const targetMenu = state.savedMenus[menuIndex];
        if (targetMenu.items.some(i => i.id === recipe.id)) {
          return state;
        }

        const updatedMenu = {
          ...targetMenu,
          items: [...targetMenu.items, recipe]
        };

        const updatedSavedMenus = [...state.savedMenus];
        updatedSavedMenus[menuIndex] = updatedMenu;

        return {
          ...state,
          savedMenus: updatedSavedMenus
        };
      }
    }

    case ActionType.REMOVE_FROM_MENU:
      return {
        ...state,
        currentMenu: {
          ...state.currentMenu,
          items: state.currentMenu.items.filter(i => i.id !== action.payload)
        }
      };

    case ActionType.CLEAR_CURRENT_MENU:
      return {
        ...state,
        currentMenu: {
          id: null,
          name: '',
          items: []
        }
      };

    case ActionType.SAVE_CURRENT_MENU: {
      const menuToSave = action.payload;
      const menuExists = state.savedMenus.some(m => m.id === menuToSave.id);

      return {
        ...state,
        notification: { message: null, type: null },
        savedMenus: menuExists
          ? state.savedMenus.map(m => m.id === menuToSave.id ? menuToSave : m)
          : [...state.savedMenus, menuToSave],
        currentMenu: {
          id: null,
          name: '',
          items: []
        }
      };
    }

    case ActionType.LOAD_SAVED_MENU:
      return {
        ...state,
        currentMenu: { ...action.payload }
      };

    case ActionType.DELETE_SAVED_MENU:
      return {
        ...state,
        savedMenus: state.savedMenus.filter(m => m.id !== action.payload)
      };

    case ActionType.REORDER_MENU_ITEMS:
      return {
        ...state,
        currentMenu: {
          ...state.currentMenu,
          items: action.payload
        }
      };

    case ActionType.SET_BATCH_RECIPE:
      return {
        ...state,
        batchScaling: {
          recipe: action.payload,
          servings: 1,
          name: ''
        }
      };

    case ActionType.UPDATE_BATCH_SERVINGS:
      return {
        ...state,
        batchScaling: {
          ...state.batchScaling,
          servings: Math.max(1, safeParseInt(action.payload, 1))
        }
      };

    case ActionType.CLEAR_BATCH:
      return {
        ...state,
        batchScaling: {
          recipe: null,
          servings: 1,
          name: ''
        }
      };

    case ActionType.SAVE_BATCH: {
      const batchToSave = action.payload;
      const batchExists = state.savedBatches.some(b => b.id === batchToSave.id);

      const updatedSavedBatches = batchExists
        ? state.savedBatches.map(b => b.id === batchToSave.id ? batchToSave : b)
        : [...state.savedBatches, batchToSave];

      return {
        ...state,
        savedBatches: updatedSavedBatches
      };
    }

    case ActionType.LOAD_BATCH: {
      const batchToLoad = action.payload;
      return {
        ...state,
        batchScaling: {
          recipe: batchToLoad.recipe,
          servings: batchToLoad.servings,
          name: batchToLoad.name
        }
      };
    }

    case ActionType.DELETE_BATCH:
      return {
        ...state,
        savedBatches: state.savedBatches.filter(b => b.id !== action.payload)
      };

    case ActionType.SET_SERVICE_MODE:
      return {
        ...state,
        serviceMode: action.payload
      };

    case ActionType.SET_GEMINI_API_KEY:
      return {
        ...state,
        geminiApiKey: action.payload
      };

    // Techniques Management Actions
    case ActionType.ADD_TECHNIQUE: {
      const technique = action.payload;

      if (!technique.name) {
        return {
          ...state,
          notification: {
            message: "Technique name is required.",
            type: 'error'
          }
        };
      }

      const nameCollision = state.techniques.some(t =>
        t.name.toLowerCase() === technique.name.toLowerCase()
      );

      if (nameCollision) {
        return {
          ...state,
          notification: {
            message: `A technique named "${technique.name}" already exists.`,
            type: 'error'
          }
        };
      }

      return {
        ...state,
        notification: {
          message: `${technique.name} technique added.`,
          type: 'success'
        },
        techniques: [...state.techniques, technique]
      };
    }

    case ActionType.UPDATE_TECHNIQUE: {
      const updatedTechnique = action.payload;

      const techniqueExists = state.techniques.some(t => t.id === updatedTechnique.id);
      if (!techniqueExists) {
        return {
          ...state,
          notification: {
            message: "Technique not found.",
            type: 'error'
          }
        };
      }

      return {
        ...state,
        notification: {
          message: `${updatedTechnique.name} technique updated.`,
          type: 'success'
        },
        techniques: state.techniques.map(t =>
          t.id === updatedTechnique.id ? updatedTechnique : t
        )
      };
    }

    case ActionType.DELETE_TECHNIQUE:
      return {
        ...state,
        techniques: state.techniques.filter(t => t.id !== action.payload),
        notification: {
          message: "Technique deleted.",
          type: 'success'
        }
      };

    case ActionType.TOGGLE_TECHNIQUE_FAVORITE:
      return {
        ...state,
        techniques: state.techniques.map(t =>
          t.id === action.payload.techniqueId
            ? { ...t, isFavorite: action.payload.isFavorite }
            : t
        )
      };

    default:
      return state;
  }
};
