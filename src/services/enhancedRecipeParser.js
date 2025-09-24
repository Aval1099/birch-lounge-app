/**
 * Enhanced Recipe Parser Service
 * Advanced AI-powered recipe parsing with intelligent ingredient recognition,
 * standardization, difficulty scoring, and categorization
 */

import { apiKeyService } from './apiKeyService';
import { geminiService } from './geminiService';

/**
 * Ingredient standardization mappings and patterns
 */
const INGREDIENT_STANDARDIZATION = {
  // Volume conversions to oz
  volumeConversions: {
    'ml': 0.033814,
    'milliliter': 0.033814,
    'milliliters': 0.033814,
    'cl': 0.33814,
    'centiliter': 0.33814,
    'centiliters': 0.33814,
    'l': 33.814,
    'liter': 33.814,
    'liters': 33.814,
    'cup': 8,
    'cups': 8,
    'pint': 16,
    'pints': 16,
    'quart': 32,
    'quarts': 32,
    'gallon': 128,
    'gallons': 128,
    'tbsp': 0.5,
    'tablespoon': 0.5,
    'tablespoons': 0.5,
    'tsp': 0.166667,
    'teaspoon': 0.166667,
    'teaspoons': 0.166667,
    'dash': 0.03125,
    'dashes': 0.03125,
    'splash': 0.25,
    'splashes': 0.25,
    'drop': 0.00208,
    'drops': 0.00208
  },

  // Common ingredient name standardizations
  ingredientNames: {
    'vodka': ['vodka', 'wodka', 'potato vodka', 'grain vodka'],
    'gin': ['gin', 'london dry gin', 'plymouth gin', 'old tom gin'],
    'whiskey': ['whiskey', 'whisky', 'bourbon', 'rye', 'scotch', 'irish whiskey'],
    'rum': ['rum', 'white rum', 'dark rum', 'spiced rum', 'aged rum'],
    'tequila': ['tequila', 'blanco tequila', 'reposado tequila', 'añejo tequila'],
    'brandy': ['brandy', 'cognac', 'armagnac', 'calvados'],
    'vermouth': ['vermouth', 'dry vermouth', 'sweet vermouth', 'blanc vermouth'],
    'simple syrup': ['simple syrup', 'sugar syrup', '1:1 simple syrup', 'simple'],
    'lime juice': ['lime juice', 'fresh lime juice', 'lime', 'lime juice (fresh)'],
    'lemon juice': ['lemon juice', 'fresh lemon juice', 'lemon', 'lemon juice (fresh)'],
    'orange juice': ['orange juice', 'fresh orange juice', 'orange', 'oj'],
    'triple sec': ['triple sec', 'cointreau', 'grand marnier', 'orange liqueur'],
    'angostura bitters': ['angostura bitters', 'angostura', 'ango bitters', 'ango']
  },

  // Difficulty scoring factors
  difficultyFactors: {
    ingredientCount: { easy: [1, 4], medium: [5, 7], hard: [8, 15] },
    techniques: {
      easy: ['shake', 'stir', 'build', 'pour'],
      medium: ['muddle', 'strain', 'float', 'layer'],
      hard: ['clarify', 'fat wash', 'infuse', 'foam', 'molecular']
    },
    glassware: {
      easy: ['rocks', 'highball', 'collins'],
      medium: ['coupe', 'martini', 'nick and nora'],
      hard: ['absinthe', 'snifter', 'specialized']
    }
  },

  // Category classification patterns
  categoryPatterns: {
    'Mocktail': ['mocktail', 'virgin', 'non-alcoholic', 'alcohol-free', 'zero-proof', 'na cocktail', 'sober', 'dry january'],
    'Whiskey': ['whiskey', 'bourbon', 'rye', 'scotch', 'irish'],
    'Gin': ['gin', 'london dry', 'plymouth'],
    'Vodka': ['vodka', 'potato vodka', 'grain vodka'],
    'Rum': ['rum', 'white rum', 'dark rum', 'spiced rum'],
    'Tequila': ['tequila', 'mezcal', 'blanco', 'reposado'],
    'Brandy': ['brandy', 'cognac', 'armagnac', 'calvados'],
    'Aperitif': ['aperol', 'campari', 'cynar', 'suze'],
    'Digestif': ['amaro', 'fernet', 'chartreuse', 'benedictine'],
    'Wine': ['wine', 'champagne', 'prosecco', 'sherry'],
    'Beer': ['beer', 'lager', 'ale', 'stout']
  }
};

/**
 * Enhanced recipe parsing with multiple format support
 */
export const parseRecipesWithIntelligence = async (text, progressCallback) => {
  try {
    // Validate API key first
    const apiKey = apiKeyService.getApiKey('gemini');
    if (!apiKey) {
      throw new Error('Invalid or missing Gemini API key');
    }

    // Split text into chunks for processing
    const chunks = splitTextIntoChunks(text, 3500);
    const allRecipes = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Enhanced AI prompt with multiple format support
      const prompt = createEnhancedParsingPrompt(chunk);

      const response = await geminiService.generate(
        apiKey,
        prompt,
        true // Request JSON response
      );

      try {
        const chunkRecipes = Array.isArray(response) ? response : JSON.parse(response);

        if (Array.isArray(chunkRecipes)) {
          // Process each recipe with intelligence enhancements
          const enhancedRecipes = await Promise.all(
            chunkRecipes.map(recipe => enhanceRecipeIntelligence(recipe))
          );

          allRecipes.push(...enhancedRecipes);
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response:', parseError);
        // Fallback parsing logic
        const fallbackRecipes = await fallbackRecipeParsing(response);
        if (Array.isArray(fallbackRecipes)) {
          allRecipes.push(...fallbackRecipes);
        }
      }

      // Report progress
      if (progressCallback) {
        progressCallback({
          currentChunk: i + 1,
          totalChunks: chunks.length,
          progress: Math.round(((i + 1) / chunks.length) * 100),
          recipesFound: allRecipes.length
        });
      }
    }

    // Final processing and validation
    const processedRecipes = allRecipes
      .filter(recipe => validateRecipeQuality(recipe))
      .map(recipe => addRecipeMetadata(recipe));

    return {
      recipes: processedRecipes,
      success: true,
      totalFound: processedRecipes.length,
      qualityScore: calculateOverallQualityScore(processedRecipes)
    };

  } catch (error) {
    return {
      error: error.message,
      success: false,
      recipes: []
    };
  }
};

/**
 * Create enhanced parsing prompt with format detection
 */
const createEnhancedParsingPrompt = (text) => {
  return `
    You are an expert bartender and recipe parser. Extract cocktail recipes from the following text, which may be in various formats:

    1. STRUCTURED FORMAT: Clear recipe cards with organized sections
    2. NARRATIVE FORMAT: Recipes described in paragraph form
    3. INGREDIENT LIST FORMAT: Simple lists with measurements

    For each recipe found, return a JSON object with this EXACT structure:

    {
      "name": "Recipe Name",
      "version": "Classic/House/Modern/etc",
      "category": "Whiskey/Gin/Rum/Vodka/Tequila/Brandy/Other",
      "ingredients": [
        {
          "name": "Standardized Ingredient Name",
          "amount": "2",
          "unit": "oz",
          "originalText": "Original text from source",
          "notes": "Optional preparation notes"
        }
      ],
      "instructions": "Clear step-by-step instructions",
      "glassware": "Specific glass type",
      "garnish": "Garnish description",
      "flavorProfile": ["strong", "sweet", "sour", "bitter", "herbal", "citrus"],
      "techniques": ["shake", "stir", "muddle", "strain"],
      "difficulty": "Easy/Medium/Hard",
      "prepTime": 3,
      "servings": 1,
      "abv": 25.5,
      "source": "PDF Import",
      "notes": "Additional notes or variations",
      "tags": ["classic", "summer", "refreshing"],
      "season": "Spring/Summer/Fall/Winter/Year-round",
      "occasion": "Casual/Formal/Party/Digestif"
    }

    IMPORTANT PARSING RULES:
    - Standardize ingredient names (e.g., "bourbon whiskey" → "whiskey")
    - Convert all measurements to oz when possible
    - Preserve original text for reference
    - Estimate ABV based on ingredients
    - Assign difficulty based on technique complexity
    - Only extract complete recipes with ingredients AND instructions
    - Skip incomplete entries or non-recipe content

    Text to analyze:
    ${text}

    Return ONLY a JSON array of recipe objects, no additional text.
  `;
};

/**
 * Enhance recipe with intelligent analysis
 */
const enhanceRecipeIntelligence = async (recipe) => {
  try {
    // Standardize ingredients
    const standardizedIngredients = recipe.ingredients.map(ingredient =>
      standardizeIngredient(ingredient)
    );

    // Calculate intelligent metrics
    const difficultyScore = calculateDifficultyScore(recipe);
    const prepTimeEstimate = estimatePrepTime(recipe);
    const categoryClassification = classifyRecipeCategory(recipe);
    const abvEstimate = calculateABV(standardizedIngredients);

    return {
      ...recipe,
      ingredients: standardizedIngredients,
      difficulty: difficultyScore.level,
      difficultyScore: difficultyScore.score,
      prepTime: prepTimeEstimate,
      category: categoryClassification,
      abv: abvEstimate,
      qualityScore: calculateRecipeQualityScore(recipe),
      intelligenceEnhanced: true
    };
  } catch (error) {
    console.warn('Failed to enhance recipe intelligence:', error);
    return recipe;
  }
};

/**
 * Standardize ingredient measurements and names
 */
export const standardizeIngredient = (ingredient) => {
  const { name, amount, unit, originalText } = ingredient;

  // Standardize unit to oz if possible
  let standardizedAmount = parseFloat(amount) || 0;
  let standardizedUnit = unit?.toLowerCase() || '';

  if (INGREDIENT_STANDARDIZATION.volumeConversions[standardizedUnit]) {
    standardizedAmount *= INGREDIENT_STANDARDIZATION.volumeConversions[standardizedUnit];
    standardizedAmount = Math.round(standardizedAmount * 100000) / 100000; // Round to 5 decimal places
    standardizedUnit = 'oz';
  }

  // Standardize ingredient name
  let standardizedName = name.toLowerCase();
  for (const [standard, variations] of Object.entries(INGREDIENT_STANDARDIZATION.ingredientNames)) {
    if (variations.some(variation => standardizedName.includes(variation))) {
      standardizedName = standard;
      break;
    }
  }

  return {
    ...ingredient,
    name: standardizedName,
    amount: standardizedAmount.toString(),
    unit: standardizedUnit,
    originalText: originalText || `${amount} ${unit} ${name}`,
    standardized: true
  };
};

/**
 * Calculate recipe difficulty score
 */
export const calculateDifficultyScore = (recipe) => {
  let score = 0;
  const factors = INGREDIENT_STANDARDIZATION.difficultyFactors;

  // Ingredient count factor
  const ingredientCount = recipe.ingredients?.length || 0;
  if (ingredientCount <= factors.ingredientCount.easy[1]) score += 1;
  else if (ingredientCount <= factors.ingredientCount.medium[1]) score += 2;
  else score += 3;

  // Technique complexity
  const techniques = recipe.techniques || [];
  const hasHardTechniques = techniques.some(tech =>
    factors.techniques.hard.includes(tech.toLowerCase())
  );
  const hasMediumTechniques = techniques.some(tech =>
    factors.techniques.medium.includes(tech.toLowerCase())
  );

  if (hasHardTechniques) score += 3;
  else if (hasMediumTechniques) score += 2;
  else score += 1;

  // Glassware complexity
  const glassware = recipe.glassware?.toLowerCase() || '';
  if (factors.glassware.hard.some(glass => glassware.includes(glass))) score += 3;
  else if (factors.glassware.medium.some(glass => glassware.includes(glass))) score += 2;
  else score += 1;

  // Convert score to difficulty level
  let level = 'Easy';
  if (score >= 7) level = 'Hard';
  else if (score >= 5) level = 'Medium';

  return { score, level };
};

/**
 * Estimate preparation time based on recipe complexity
 */
export const estimatePrepTime = (recipe) => {
  let baseTime = 2; // Base 2 minutes

  // Add time for ingredient count
  const ingredientCount = recipe.ingredients?.length || 0;
  baseTime += Math.floor(ingredientCount / 2);

  // Add time for complex techniques
  const techniques = recipe.techniques || [];
  if (techniques.includes('muddle')) baseTime += 1;
  if (techniques.includes('strain')) baseTime += 1;
  if (techniques.includes('float')) baseTime += 2;
  if (techniques.includes('clarify')) baseTime += 30;

  return Math.min(baseTime, 45); // Cap at 45 minutes
};

/**
 * Classify recipe category based on primary spirit
 */
export const classifyRecipeCategory = (recipe) => {
  const ingredients = recipe.ingredients || [];
  const allIngredients = ingredients.map(ing => ing.name.toLowerCase()).join(' ');

  for (const [category, patterns] of Object.entries(INGREDIENT_STANDARDIZATION.categoryPatterns)) {
    if (patterns.some(pattern => allIngredients.includes(pattern))) {
      return category;
    }
  }

  return recipe.category || 'Other';
};

/**
 * Determine if a recipe is alcoholic or non-alcoholic
 */
export const getRecipeAlcoholContent = (recipe) => {
  const ingredients = recipe.ingredients || [];

  // Check if explicitly marked as mocktail
  if (recipe.category?.toLowerCase() === 'mocktail') {
    return 'non_alcoholic';
  }

  // Check for alcoholic ingredients
  const alcoholicCategories = [
    'whiskey', 'gin', 'rum', 'vodka', 'tequila', 'brandy', 'wine', 'beer',
    'cordials/liqueur', 'amari', 'aperitif', 'digestif'
  ];

  const hasAlcohol = ingredients.some(ingredient => {
    const name = ingredient.name.toLowerCase();
    const category = ingredient.category?.toLowerCase() || '';

    // Check ingredient category
    if (alcoholicCategories.includes(category)) {
      return true;
    }

    // Check ingredient name for alcohol indicators
    const alcoholKeywords = [
      'whiskey', 'bourbon', 'rye', 'scotch', 'gin', 'vodka', 'rum', 'tequila',
      'wine', 'beer', 'brandy', 'cognac', 'liqueur', 'amaro', 'aperol', 'campari',
      'vermouth', 'sherry', 'port', 'champagne', 'prosecco'
    ];

    return alcoholKeywords.some(keyword => name.includes(keyword));
  });

  return hasAlcohol ? 'alcoholic' : 'non_alcoholic';
};

/**
 * Calculate estimated ABV
 */
export const calculateABV = (ingredients) => {
  let totalAlcohol = 0;
  let totalVolume = 0;

  // Simplified ABV calculation based on common spirits
  const spiritABV = {
    'vodka': 40, 'gin': 40, 'whiskey': 40, 'rum': 40, 'tequila': 40,
    'brandy': 40, 'vermouth': 18, 'triple sec': 40, 'liqueur': 25
  };

  ingredients.forEach(ingredient => {
    const amount = parseFloat(ingredient.amount) || 0;
    if (ingredient.unit === 'oz' && amount > 0) {
      totalVolume += amount;

      for (const [spirit, abv] of Object.entries(spiritABV)) {
        if (ingredient.name.includes(spirit)) {
          totalAlcohol += (amount * abv / 100);
          break;
        }
      }
    }
  });

  return totalVolume > 0 ? Math.round((totalAlcohol / totalVolume) * 100 * 10) / 10 : 0;
};

/**
 * Additional utility functions
 */
const splitTextIntoChunks = (text, maxChunkSize) => {
  const chunks = [];
  const sentences = text.split(/[.!?]+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = `${sentence}. `;
    } else {
      currentChunk += `${sentence}. `;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
};

const validateRecipeQuality = (recipe) => {
  return recipe.name &&
    recipe.ingredients &&
    recipe.ingredients.length > 0 &&
    recipe.instructions;
};

export const calculateRecipeQualityScore = (recipe) => {
  let score = 0;
  if (recipe.name) score += 20;
  if (recipe.ingredients?.length > 0) score += 30;
  if (recipe.instructions) score += 30;
  if (recipe.garnish) score += 10;
  if (recipe.glassware) score += 10;
  return score;
};

const calculateOverallQualityScore = (recipes) => {
  if (recipes.length === 0) return 0;
  const totalScore = recipes.reduce((sum, recipe) => sum + (recipe.qualityScore || 0), 0);
  return Math.round(totalScore / recipes.length);
};

const addRecipeMetadata = (recipe) => ({
  ...recipe,
  id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  isOriginalVersion: true,
  isFavorite: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  yields: recipe.servings || 1,
  source: 'Enhanced PDF Import'
});

const fallbackRecipeParsing = async (response) => {
  // Implement fallback parsing logic for malformed responses
  try {
    if (typeof response === 'string') {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.warn('Fallback parsing failed:', error);
  }
  return [];
};
