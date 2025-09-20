/**
 * Fuzzy Search Engine for Advanced Recipe Search
 * Provides intelligent matching for ingredient names, handles misspellings,
 * and implements phonetic matching for spoken ingredient recognition.
 */

/**
 * Comprehensive ingredient synonym mapping for fuzzy matching
 */
const INGREDIENT_SYNONYMS = {
  // Spirits
  'gin': ['gin', 'juniper', 'london dry gin', 'plymouth gin', 'hendricks', 'tanqueray'],
  'vodka': ['vodka', 'potato vodka', 'grain vodka', 'grey goose', 'absolut', 'titos'],
  'whiskey': ['whiskey', 'whisky', 'bourbon', 'rye whiskey', 'scotch', 'irish whiskey', 'jameson', 'jack daniels'],
  'rum': ['rum', 'white rum', 'dark rum', 'spiced rum', 'aged rum', 'bacardi', 'captain morgan'],
  'tequila': ['tequila', 'blanco tequila', 'reposado', 'añejo', 'mezcal', 'patron', 'jose cuervo'],
  'brandy': ['brandy', 'cognac', 'armagnac', 'apple brandy', 'calvados', 'hennessy', 'remy martin'],
  
  // Liqueurs
  'triple sec': ['triple sec', 'cointreau', 'grand marnier', 'orange liqueur', 'curacao'],
  'kahlua': ['kahlua', 'coffee liqueur', 'tia maria', 'baileys'],
  'amaretto': ['amaretto', 'disaronno', 'almond liqueur'],
  'chambord': ['chambord', 'raspberry liqueur', 'framboise'],
  
  // Mixers and Juices
  'lime juice': ['lime juice', 'fresh lime juice', 'lime', 'lime wedge', 'lime wheel'],
  'lemon juice': ['lemon juice', 'fresh lemon juice', 'lemon', 'lemon wedge', 'lemon wheel'],
  'orange juice': ['orange juice', 'fresh orange juice', 'oj', 'orange'],
  'cranberry juice': ['cranberry juice', 'cran juice', 'cranberry'],
  'pineapple juice': ['pineapple juice', 'pineapple', 'pine juice'],
  'grapefruit juice': ['grapefruit juice', 'grapefruit', 'pink grapefruit'],
  
  // Syrups and Sweeteners
  'simple syrup': ['simple syrup', 'sugar syrup', 'syrup', 'sugar', 'gomme syrup'],
  'grenadine': ['grenadine', 'pomegranate syrup', 'rose syrup'],
  'honey': ['honey', 'honey syrup', 'agave', 'agave syrup'],
  
  // Bitters and Aromatics
  'angostura bitters': ['angostura bitters', 'angostura', 'bitters', 'ango'],
  'orange bitters': ['orange bitters', 'orange bitter'],
  'peychauds bitters': ['peychauds bitters', 'peychauds', 'peychaud'],
  
  // Vermouth and Wine
  'dry vermouth': ['dry vermouth', 'white vermouth', 'dolin dry', 'noilly prat'],
  'sweet vermouth': ['sweet vermouth', 'red vermouth', 'carpano antica', 'dolin rouge'],
  'champagne': ['champagne', 'prosecco', 'cava', 'sparkling wine', 'bubbly'],
  
  // Garnishes
  'mint': ['mint', 'fresh mint', 'mint leaves', 'spearmint'],
  'basil': ['basil', 'fresh basil', 'basil leaves'],
  'rosemary': ['rosemary', 'fresh rosemary'],
  'thyme': ['thyme', 'fresh thyme'],
  
  // Common misspellings and phonetic variations
  'jin': ['gin'],
  'wodka': ['vodka'],
  'wisky': ['whiskey'],
  'whisky': ['whiskey'],
  'tequilla': ['tequila'],
  'cointrau': ['cointreau'],
  'vermuth': ['vermouth'],
  'vermout': ['vermouth']
};

/**
 * Common misspelling patterns and corrections
 */
const MISSPELLING_PATTERNS = [
  // Double letters
  { pattern: /(.)\1+/g, replacement: '$1' },
  // Common letter swaps
  { pattern: /ie/g, replacement: 'ei' },
  { pattern: /ei/g, replacement: 'ie' },
  // Phonetic replacements
  { pattern: /ph/g, replacement: 'f' },
  { pattern: /ck/g, replacement: 'k' },
  { pattern: /qu/g, replacement: 'kw' }
];

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
export const calculateLevenshteinDistance = (str1, str2) => {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  // Initialize first row and column
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  // Fill the matrix
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + substitutionCost  // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Calculate similarity score based on Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export const calculateSimilarityScore = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

/**
 * Generate phonetic code using simplified Soundex algorithm
 * @param {string} str - Input string
 * @returns {string} Phonetic code
 */
export const generatePhoneticCode = (str) => {
  if (!str) return '';
  
  let code = str.toLowerCase().replace(/[^a-z]/g, '');
  if (code.length === 0) return '';
  
  // Keep first letter
  let result = code[0].toUpperCase();
  
  // Replace consonants with digits
  code = code.replace(/[bfpv]/g, '1')
              .replace(/[cgjkqsxz]/g, '2')
              .replace(/[dt]/g, '3')
              .replace(/[l]/g, '4')
              .replace(/[mn]/g, '5')
              .replace(/[r]/g, '6');
  
  // Remove vowels and duplicates
  code = code.substring(1).replace(/[aeiouyhw]/g, '').replace(/(.)\1+/g, '$1');
  
  // Pad or truncate to 4 characters
  result += (`${code  }000`).substring(0, 3);
  
  return result;
};

/**
 * Find fuzzy matches for an ingredient name
 * @param {string} query - Query ingredient name
 * @param {Array} ingredientList - List of available ingredients
 * @param {Object} options - Matching options
 * @returns {Array} Fuzzy matches with scores
 */
export const findFuzzyMatches = (query, ingredientList = [], options = {}) => {
  const {
    maxResults = 10,
    minSimilarity = 0.3,
    includePhonetic = true,
    includeSynonyms = true
  } = options;

  if (!query || !Array.isArray(ingredientList)) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const queryPhonetic = generatePhoneticCode(query);
  const matches = [];

  // Direct and synonym matching
  ingredientList.forEach(ingredient => {
    const ingredientLower = ingredient.toLowerCase();
    
    // Exact match
    if (ingredientLower === queryLower) {
      matches.push({
        ingredient,
        score: 1.0,
        matchType: 'exact',
        confidence: 1.0
      });
      return;
    }

    // Substring match
    if (ingredientLower.includes(queryLower) || queryLower.includes(ingredientLower)) {
      const score = Math.max(queryLower.length, ingredientLower.length) / 
                   Math.min(queryLower.length, ingredientLower.length);
      matches.push({
        ingredient,
        score: Math.min(0.95, score * 0.8),
        matchType: 'substring',
        confidence: 0.9
      });
      return;
    }

    // Levenshtein similarity
    const similarity = calculateSimilarityScore(queryLower, ingredientLower);
    if (similarity >= minSimilarity) {
      matches.push({
        ingredient,
        score: similarity,
        matchType: 'fuzzy',
        confidence: similarity
      });
    }

    // Phonetic matching
    if (includePhonetic) {
      const ingredientPhonetic = generatePhoneticCode(ingredient);
      if (queryPhonetic === ingredientPhonetic && queryPhonetic.length > 1) {
        matches.push({
          ingredient,
          score: 0.7,
          matchType: 'phonetic',
          confidence: 0.7
        });
      }
    }
  });

  // Synonym matching
  if (includeSynonyms) {
    for (const [canonical, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
      synonyms.forEach(synonym => {
        const similarity = calculateSimilarityScore(queryLower, synonym.toLowerCase());
        if (similarity >= minSimilarity) {
          matches.push({
            ingredient: canonical,
            score: similarity * 0.9, // Slightly lower score for synonym matches
            matchType: 'synonym',
            confidence: similarity * 0.9,
            matchedSynonym: synonym
          });
        }
      });
    }
  }

  // Remove duplicates and sort by score
  const uniqueMatches = matches.reduce((acc, match) => {
    const existing = acc.find(m => m.ingredient === match.ingredient);
    if (!existing || match.score > existing.score) {
      return [...acc.filter(m => m.ingredient !== match.ingredient), match];
    }
    return acc;
  }, []);

  return uniqueMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

/**
 * Suggest corrections for misspelled ingredient names
 * @param {string} query - Potentially misspelled query
 * @param {Array} ingredientList - List of available ingredients
 * @returns {Array} Correction suggestions
 */
export const suggestCorrections = (query, ingredientList = []) => {
  if (!query) return [];

  const corrections = [];
  let correctedQuery = query.toLowerCase();

  // Apply common misspelling corrections
  MISSPELLING_PATTERNS.forEach(({ pattern, replacement }) => {
    correctedQuery = correctedQuery.replace(pattern, replacement);
  });

  // If the corrected query is different, find matches for it
  if (correctedQuery !== query.toLowerCase()) {
    const matches = findFuzzyMatches(correctedQuery, ingredientList, {
      maxResults: 5,
      minSimilarity: 0.6
    });

    matches.forEach(match => {
      corrections.push({
        original: query,
        suggestion: match.ingredient,
        confidence: match.score * 0.8,
        reason: 'spelling_correction'
      });
    });
  }

  // Check for common phonetic misspellings
  const phoneticMatches = findFuzzyMatches(query, ingredientList, {
    maxResults: 3,
    minSimilarity: 0.4,
    includePhonetic: true,
    includeSynonyms: false
  });

  phoneticMatches.forEach(match => {
    if (match.matchType === 'phonetic') {
      corrections.push({
        original: query,
        suggestion: match.ingredient,
        confidence: match.confidence,
        reason: 'phonetic_similarity'
      });
    }
  });

  // Remove duplicates and sort by confidence
  const uniqueCorrections = corrections.reduce((acc, correction) => {
    const existing = acc.find(c => c.suggestion === correction.suggestion);
    if (!existing || correction.confidence > existing.confidence) {
      return [...acc.filter(c => c.suggestion !== correction.suggestion), correction];
    }
    return acc;
  }, []);

  return uniqueCorrections
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
};

/**
 * Expand query with synonyms and variations
 * @param {string} query - Original query
 * @returns {Array} Expanded query terms
 */
export const expandQueryWithSynonyms = (query) => {
  if (!query) return [];

  const queryLower = query.toLowerCase().trim();
  const expandedTerms = [query];

  // Check if query matches any canonical ingredient
  for (const [canonical, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (synonyms.some(synonym => synonym.toLowerCase() === queryLower)) {
      // Add canonical form and other synonyms
      expandedTerms.push(canonical);
      synonyms.forEach(synonym => {
        if (synonym.toLowerCase() !== queryLower) {
          expandedTerms.push(synonym);
        }
      });
      break;
    }
  }

  // Remove duplicates
  return [...new Set(expandedTerms)];
};

/**
 * Main fuzzy search function
 * @param {string} query - Search query
 * @param {Array} ingredientList - Available ingredients
 * @param {Object} options - Search options
 * @returns {Object} Fuzzy search results
 */
export const performFuzzySearch = (query, ingredientList = [], options = {}) => {
  const startTime = performance.now();

  try {
    const {
      includeCorrections = true,
      expandSynonyms = true,
      maxResults = 10,
      minSimilarity = 0.3
    } = options;

    // Find direct fuzzy matches
    const matches = findFuzzyMatches(query, ingredientList, {
      maxResults,
      minSimilarity,
      includePhonetic: true,
      includeSynonyms: true
    });

    // Generate corrections if enabled
    const corrections = includeCorrections ? 
      suggestCorrections(query, ingredientList) : [];

    // Expand with synonyms if enabled
    const expandedTerms = expandSynonyms ? 
      expandQueryWithSynonyms(query) : [query];

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      query,
      matches,
      corrections,
      expandedTerms,
      processingTime,
      stats: {
        totalMatches: matches.length,
        exactMatches: matches.filter(m => m.matchType === 'exact').length,
        fuzzyMatches: matches.filter(m => m.matchType === 'fuzzy').length,
        phoneticMatches: matches.filter(m => m.matchType === 'phonetic').length,
        synonymMatches: matches.filter(m => m.matchType === 'synonym').length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      query,
      matches: [],
      corrections: [],
      expandedTerms: [query],
      processingTime: performance.now() - startTime
    };
  }
};
