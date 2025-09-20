/**
 * Natural Language Processor for Advanced Search
 * Provides intelligent query parsing, semantic understanding, and intent recognition
 * for cocktail recipe searches with natural language support.
 */

/**
 * Cocktail descriptor mappings for semantic understanding
 */
const DESCRIPTOR_MAPPINGS = {
  strength: {
    light: ['light', 'weak', 'mild', 'low-proof', 'session', 'easy-drinking'],
    medium: ['medium', 'moderate', 'balanced', 'standard'],
    strong: ['strong', 'potent', 'powerful', 'high-proof', 'stiff', 'boozy', 'spirit-forward']
  },
  flavor: {
    sweet: ['sweet', 'sugary', 'dessert', 'candy', 'honeyed', 'syrupy'],
    sour: ['sour', 'tart', 'acidic', 'sharp', 'tangy', 'puckering'],
    bitter: ['bitter', 'herbal', 'medicinal', 'earthy', 'vegetal'],
    dry: ['dry', 'crisp', 'clean', 'bone-dry', 'austere'],
    fruity: ['fruity', 'tropical', 'berry', 'stone-fruit', 'orchard'],
    citrusy: ['citrusy', 'citrus', 'zesty', 'bright', 'acidic', 'lemony', 'lime'],
    herbal: ['herbal', 'botanical', 'garden', 'green', 'vegetal', 'grassy'],
    spicy: ['spicy', 'hot', 'peppery', 'warming', 'fiery', 'kick']
  },
  temperature: {
    hot: ['hot', 'warm', 'heated', 'steaming', 'toddy'],
    cold: ['cold', 'chilled', 'iced', 'frozen', 'frosty', 'ice-cold'],
    room: ['room temperature', 'neat', 'straight']
  },
  occasion: {
    casual: ['casual', 'everyday', 'relaxed', 'informal', 'easy'],
    formal: ['formal', 'elegant', 'sophisticated', 'upscale', 'fancy', 'classy'],
    party: ['party', 'crowd', 'batch', 'group', 'celebration', 'festive'],
    brunch: ['brunch', 'morning', 'breakfast', 'daytime', 'mimosa'],
    dinner: ['dinner', 'meal', 'food', 'pairing', 'dining'],
    nightcap: ['nightcap', 'bedtime', 'digestif', 'after-dinner', 'late-night']
  },
  season: {
    spring: ['spring', 'springtime', 'fresh', 'blooming', 'renewal'],
    summer: ['summer', 'hot', 'beach', 'poolside', 'vacation', 'tropical'],
    fall: ['fall', 'autumn', 'harvest', 'cozy', 'warming'],
    winter: ['winter', 'cold', 'holiday', 'festive', 'warming', 'comfort']
  },
  style: {
    classic: ['classic', 'traditional', 'vintage', 'old-school', 'timeless'],
    modern: ['modern', 'contemporary', 'new', 'innovative', 'craft'],
    tropical: ['tropical', 'tiki', 'island', 'exotic', 'rum-based'],
    simple: ['simple', 'easy', 'basic', 'straightforward', 'minimal'],
    complex: ['complex', 'sophisticated', 'elaborate', 'intricate', 'advanced']
  }
};

/**
 * Common ingredient aliases and variations
 */
const INGREDIENT_ALIASES = {
  'gin': ['gin', 'juniper', 'london dry', 'plymouth'],
  'vodka': ['vodka', 'potato vodka', 'grain vodka'],
  'whiskey': ['whiskey', 'whisky', 'bourbon', 'rye', 'scotch', 'irish whiskey'],
  'rum': ['rum', 'white rum', 'dark rum', 'spiced rum', 'aged rum'],
  'tequila': ['tequila', 'blanco', 'reposado', 'añejo', 'mezcal'],
  'brandy': ['brandy', 'cognac', 'armagnac', 'apple brandy', 'calvados'],
  'lime juice': ['lime juice', 'fresh lime juice', 'lime', 'lime wedge'],
  'lemon juice': ['lemon juice', 'fresh lemon juice', 'lemon', 'lemon wedge'],
  'simple syrup': ['simple syrup', 'sugar syrup', 'syrup', 'sugar'],
  'triple sec': ['triple sec', 'cointreau', 'grand marnier', 'orange liqueur'],
  'vermouth': ['vermouth', 'dry vermouth', 'sweet vermouth', 'blanc vermouth']
};

/**
 * Query intent patterns for classification
 */
const INTENT_PATTERNS = {
  ingredient_based: [
    /with\s+(\w+)/gi,
    /(\w+)\s+(cocktails?|drinks?)/gi,
    /using\s+(\w+)/gi,
    /contains?\s+(\w+)/gi
  ],
  style_based: [
    /(light|strong|sweet|sour|bitter|dry)\s+(cocktails?|drinks?)/gi,
    /(classic|modern|tropical|simple)\s+(cocktails?|drinks?)/gi,
    /(refreshing|warming|cooling)\s+(cocktails?|drinks?)/gi
  ],
  occasion_based: [
    /(party|formal|casual|brunch|dinner)\s+(cocktails?|drinks?)/gi,
    /(cocktails?|drinks?)\s+for\s+(party|formal|casual|brunch|dinner)/gi,
    /(celebration|wedding|date)\s+(cocktails?|drinks?)/gi
  ],
  seasonal_based: [
    /(summer|winter|spring|fall)\s+(cocktails?|drinks?)/gi,
    /(cocktails?|drinks?)\s+for\s+(summer|winter|spring|fall)/gi,
    /(hot|cold)\s+weather\s+(cocktails?|drinks?)/gi
  ]
};

/**
 * Normalize and tokenize a search query
 * @param {string} query - Raw search query
 * @returns {Object} Normalized query data
 */
export const normalizeQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return {
      original: query || '',
      normalized: '',
      tokens: [],
      cleanTokens: []
    };
  }

  // Convert to lowercase and trim
  const normalized = query.toLowerCase().trim();
  
  // Tokenize by spaces and punctuation
  const tokens = normalized.split(/[\s,;.!?]+/).filter(token => token.length > 0);
  
  // Remove common stop words but keep cocktail-relevant ones
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const cleanTokens = tokens.filter(token => !stopWords.includes(token) || ['with', 'for', 'of'].includes(token));

  return {
    original: query,
    normalized,
    tokens,
    cleanTokens
  };
};

/**
 * Extract ingredients from query tokens
 * @param {Array} tokens - Query tokens
 * @returns {Array} Extracted ingredients with confidence scores
 */
export const extractIngredients = (tokens) => {
  const ingredients = [];
  
  // Check each token against ingredient aliases
  tokens.forEach(token => {
    for (const [ingredient, aliases] of Object.entries(INGREDIENT_ALIASES)) {
      const matches = aliases.filter(alias => 
        alias.toLowerCase().includes(token) || token.includes(alias.toLowerCase())
      );
      
      if (matches.length > 0) {
        const confidence = matches.some(alias => alias.toLowerCase() === token) ? 1.0 : 0.8;
        ingredients.push({
          ingredient,
          matchedAlias: matches[0],
          confidence,
          token
        });
      }
    }
  });

  // Remove duplicates and sort by confidence
  const uniqueIngredients = ingredients.reduce((acc, curr) => {
    const existing = acc.find(item => item.ingredient === curr.ingredient);
    if (!existing || curr.confidence > existing.confidence) {
      return [...acc.filter(item => item.ingredient !== curr.ingredient), curr];
    }
    return acc;
  }, []);

  return uniqueIngredients.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Extract descriptors from query tokens
 * @param {Array} tokens - Query tokens
 * @returns {Object} Extracted descriptors by category
 */
export const extractDescriptors = (tokens) => {
  const descriptors = {
    strength: [],
    flavor: [],
    temperature: [],
    occasion: [],
    season: [],
    style: []
  };

  tokens.forEach(token => {
    for (const [category, subcategories] of Object.entries(DESCRIPTOR_MAPPINGS)) {
      for (const [subcategory, keywords] of Object.entries(subcategories)) {
        if (keywords.includes(token)) {
          descriptors[category].push({
            subcategory,
            keyword: token,
            confidence: 1.0
          });
        }
      }
    }
  });

  // Remove duplicates within each category
  Object.keys(descriptors).forEach(category => {
    descriptors[category] = descriptors[category].reduce((acc, curr) => {
      const existing = acc.find(item => item.subcategory === curr.subcategory);
      if (!existing) {
        acc.push(curr);
      }
      return acc;
    }, []);
  });

  return descriptors;
};

/**
 * Classify query intent based on patterns
 * @param {string} normalizedQuery - Normalized query string
 * @param {Object} extractedData - Previously extracted ingredients and descriptors
 * @returns {Object} Intent classification with confidence
 */
export const classifyIntent = (normalizedQuery, extractedData) => {
  const intents = [];

  // Check each intent pattern
  for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalizedQuery.match(pattern);
      if (matches) {
        intents.push({
          type: intentType,
          confidence: 0.8,
          matches: matches.length,
          evidence: matches
        });
      }
    }
  }

  // Boost confidence based on extracted data
  if (extractedData.ingredients.length > 0) {
    const ingredientIntent = intents.find(intent => intent.type === 'ingredient_based');
    if (ingredientIntent) {
      ingredientIntent.confidence = Math.min(1.0, ingredientIntent.confidence + 0.2);
    } else {
      intents.push({
        type: 'ingredient_based',
        confidence: 0.6,
        matches: extractedData.ingredients.length,
        evidence: extractedData.ingredients.map(ing => ing.ingredient)
      });
    }
  }

  // Check for style descriptors
  const hasStyleDescriptors = Object.values(extractedData.descriptors).some(arr => arr.length > 0);
  if (hasStyleDescriptors) {
    const styleIntent = intents.find(intent => intent.type === 'style_based');
    if (styleIntent) {
      styleIntent.confidence = Math.min(1.0, styleIntent.confidence + 0.15);
    } else {
      intents.push({
        type: 'style_based',
        confidence: 0.5,
        matches: 1,
        evidence: ['descriptors_present']
      });
    }
  }

  // Sort by confidence and return primary intent
  intents.sort((a, b) => b.confidence - a.confidence);

  return {
    primary: intents[0] || { type: 'general', confidence: 0.3, matches: 0, evidence: [] },
    secondary: intents[1] || null,
    all: intents
  };
};

/**
 * Generate search parameters from processed query
 * @param {Object} queryData - Processed query data
 * @returns {Object} Search parameters for the search engine
 */
export const generateSearchParameters = (queryData) => {
  const { ingredients, descriptors, intent } = queryData;

  const searchParams = {
    ingredients: ingredients.map(ing => ({
      name: ing.ingredient,
      required: intent.primary.type === 'ingredient_based',
      weight: ing.confidence
    })),
    filters: {},
    sorting: {
      relevance: 1.0,
      popularity: 0.3,
      difficulty: 0.1
    },
    intent: intent.primary.type
  };

  // Convert descriptors to filters
  if (descriptors.strength.length > 0) {
    const strength = descriptors.strength[0].subcategory;
    if (strength === 'light') {
      searchParams.filters.abvRange = [0, 20];
    } else if (strength === 'medium') {
      searchParams.filters.abvRange = [15, 30];
    } else if (strength === 'strong') {
      searchParams.filters.abvRange = [25, 50];
    }
  }

  if (descriptors.occasion.length > 0) {
    searchParams.filters.occasion = descriptors.occasion[0].subcategory;
  }

  if (descriptors.season.length > 0) {
    searchParams.filters.season = descriptors.season[0].subcategory;
  }

  if (descriptors.style.length > 0) {
    const style = descriptors.style[0].subcategory;
    if (style === 'simple') {
      searchParams.filters.maxIngredients = 4;
      searchParams.filters.maxPrepTime = 3;
    } else if (style === 'complex') {
      searchParams.filters.minIngredients = 5;
    }
  }

  return searchParams;
};

/**
 * Main natural language processing function
 * @param {string} query - Raw search query
 * @returns {Object} Processed query with extracted information and search parameters
 */
export const processNaturalLanguageQuery = (query) => {
  const startTime = performance.now();

  try {
    // Step 1: Normalize and tokenize
    const queryData = normalizeQuery(query);
    
    // Step 2: Extract ingredients and descriptors
    const ingredients = extractIngredients(queryData.cleanTokens);
    const descriptors = extractDescriptors(queryData.cleanTokens);
    
    // Step 3: Classify intent
    const intent = classifyIntent(queryData.normalized, { ingredients, descriptors });
    
    // Step 4: Generate search parameters
    const searchParameters = generateSearchParameters({ ingredients, descriptors, intent });

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      query: queryData,
      ingredients,
      descriptors,
      intent,
      searchParameters,
      processingTime,
      confidence: intent.primary.confidence
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: normalizeQuery(query),
      ingredients: [],
      descriptors: {},
      intent: { primary: { type: 'general', confidence: 0.1 } },
      searchParameters: { ingredients: [], filters: {}, sorting: {}, intent: 'general' },
      processingTime: performance.now() - startTime
    };
  }
};
