// =============================================================================
// INITIAL DATA FOR APPLICATION
// =============================================================================

import { createIngredient, createRecipe } from '../models';

/**
 * Get initial ingredients for the application
 * @returns {Array} Array of ingredient objects
 */
export const getInitialIngredients = () => [
  createIngredient({
    name: "Bourbon",
    price: 2.25,
    category: "Whiskey"
  }),
  createIngredient({
    name: "Rye Whiskey",
    price: 1.875,
    category: "Whiskey"
  }),
  createIngredient({
    name: "Amaro Nonino",
    price: 5.65,
    category: "Amari"
  }),
  createIngredient({
    name: "Aperol",
    price: 3.33,
    category: "Amari"
  }),
  createIngredient({
    name: "Local IPA",
    price: 0.50,
    category: "Beer"
  }),
  createIngredient({
    name: "Pinot Noir",
    price: 0.75,
    category: "Wine"
  }),
  createIngredient({
    name: "Fresh Lemon Juice",
    price: 0.33,
    category: "Fresh Ingredients"
  }),
  createIngredient({
    name: "Simple Syrup",
    price: 0.08,
    category: "Mixers"
  }),
  createIngredient({
    name: "Egg White",
    price: 0.25,
    category: "Fresh Ingredients"
  }),
  createIngredient({
    name: "Angostura Bitters",
    price: 0.15,
    category: "Bitters"
  }),
  createIngredient({
    name: "Orange Peel",
    price: 0.05,
    category: "Garnish"
  }),
  createIngredient({
    name: "Tonic Water",
    price: 0.25,
    category: "Mixers"
  }),
  createIngredient({
    name: "Hendrick's Gin",
    price: 2.50,
    category: "Gin"
  }),
  createIngredient({
    name: "Bacardi White Rum",
    price: 1.75,
    category: "Rum"
  }),
  createIngredient({
    name: "Grey Goose Vodka",
    price: 3.25,
    category: "Vodka"
  }),
  createIngredient({
    name: "Espolòn Tequila",
    price: 2.00,
    category: "Agave"
  }),
  createIngredient({
    name: "Cointreau",
    price: 4.50,
    category: "Cordials/Liqueur"
  })
];

/**
 * Get initial recipes for the application
 * @returns {Array} Array of recipe objects
 */
export const getInitialRecipes = () => [
  createRecipe({
    name: "Paper Plane",
    version: "Death & Co",
    category: "Whiskey",
    isFavorite: true,
    flavorProfile: ["bitter", "citrusy", "herbal"],
    ingredients: [
      {
        id: 'ing1',
        name: "Rye Whiskey",
        amount: "0.75",
        unit: "oz"
      },
      {
        id: 'ing2',
        name: "Amaro Nonino",
        amount: "0.75",
        unit: "oz"
      },
      {
        id: 'ing3',
        name: "Aperol",
        amount: "0.75",
        unit: "oz"
      },
      {
        id: 'ing4',
        name: "Fresh Lemon Juice",
        amount: "0.75",
        unit: "oz"
      }
    ],
    instructions: "1. Shake all ingredients with ice.\n2. Double strain into a coupe.",
    glassware: "Coupe",
    prepTime: 3
  }),
  createRecipe({
    name: "Whiskey Sour",
    version: "Classic",
    category: "Whiskey",
    isOriginalVersion: true,
    ingredients: [
      {
        id: 'ing5',
        name: "Bourbon",
        amount: "2",
        unit: "oz"
      },
      {
        id: 'ing6',
        name: "Fresh Lemon Juice",
        amount: "0.75",
        unit: "oz"
      },
      {
        id: 'ing7',
        name: "Simple Syrup",
        amount: "0.75",
        unit: "oz"
      },
      {
        id: 'ing8',
        name: "Egg White",
        amount: "1",
        unit: "oz"
      }
    ],
    instructions: "1. Dry shake all ingredients.\n2. Add ice and shake again.\n3. Double strain into a coupe.",
    glassware: "Coupe",
    prepTime: 4,
    flavorProfile: ["citrusy", "smooth", "creamy"]
  }),
  createRecipe({
    name: "Gin & Tonic",
    version: "Classic",
    category: "Gin",
    ingredients: [
      {
        id: 'ing9',
        name: "Hendrick's Gin",
        amount: "2",
        unit: "oz"
      },
      {
        id: 'ing10',
        name: "Tonic Water",
        amount: "4",
        unit: "oz"
      }
    ],
    instructions: "1. Add gin to a highball glass with ice.\n2. Top with tonic water.\n3. Garnish with lime wheel.",
    glassware: "Highball",
    prepTime: 1
  }),
  createRecipe({
    name: "Margarita",
    version: "Classic",
    category: "Tequila",
    isFavorite: true,
    ingredients: [
      {
        id: 'ing11',
        name: "Espolòn Tequila",
        amount: "2",
        unit: "oz"
      },
      {
        id: 'ing12',
        name: "Cointreau",
        amount: "1",
        unit: "oz"
      },
      {
        id: 'ing13',
        name: "Fresh Lime Juice",
        amount: "1",
        unit: "oz"
      }
    ],
    instructions: "1. Shake all ingredients with ice.\n2. Strain into a rocks glass over ice.\n3. Garnish with lime wheel.",
    glassware: "Rocks",
    prepTime: 2
  }),
  createRecipe({
    name: "Moscow Mule",
    version: "Classic",
    category: "Vodka",
    ingredients: [
      {
        id: 'ing14',
        name: "Grey Goose Vodka",
        amount: "2",
        unit: "oz"
      },
      {
        id: 'ing15',
        name: "Fresh Lime Juice",
        amount: "0.5",
        unit: "oz"
      },
      {
        id: 'ing16',
        name: "Ginger Beer",
        amount: "4",
        unit: "oz"
      }
    ],
    instructions: "1. Add vodka and lime juice to a copper mug with ice.\n2. Top with ginger beer.\n3. Garnish with lime wheel.",
    glassware: "Copper Mug",
    prepTime: 1
  })
];

/**
 * Get initial techniques for the application
 * @returns {Array} Array of technique objects
 */
export const getInitialTechniques = () => [
  {
    id: 'tech_1',
    name: 'Double Strain',
    category: 'Straining',
    difficulty: 'Intermediate',
    duration: '30 seconds',
    description: 'A technique that uses both a Hawthorne strainer and a fine mesh strainer to remove all ice chips and pulp from a cocktail, resulting in a perfectly smooth drink.',
    steps: [
      {
        description: 'After shaking, place a Hawthorne strainer on your shaker tin.',
        tip: 'Make sure the strainer fits snugly to prevent spillage.'
      },
      {
        description: 'Hold a fine mesh strainer over your serving glass.',
        tip: 'Position it about 2 inches above the glass for best control.'
      },
      {
        description: 'Pour the cocktail through both strainers simultaneously.',
        tip: 'Pour slowly and steadily to avoid splashing.'
      }
    ],
    equipment: ['Hawthorne Strainer', 'Fine Mesh Strainer', 'Shaker'],
    tips: [
      'Essential for cocktails with citrus juice or muddled ingredients',
      'Creates a silky smooth texture in egg white cocktails',
      'Always double strain when serving in a coupe or martini glass'
    ],
    tags: ['straining', 'technique', 'smooth', 'professional'],
    isFavorite: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech_2',
    name: 'Dry Shake',
    category: 'Shaking',
    difficulty: 'Beginner',
    duration: '45 seconds',
    description: 'A shaking technique performed without ice, typically used with egg whites to create maximum foam and emulsification before adding ice for the final shake.',
    steps: [
      {
        description: 'Add all ingredients including egg white to the shaker without ice.',
        tip: 'Make sure the shaker is completely dry before starting.'
      },
      {
        description: 'Shake vigorously for 10-15 seconds without ice.',
        tip: 'This creates the initial emulsification of the egg white.'
      },
      {
        description: 'Add ice and shake again for another 10-15 seconds.',
        tip: 'The second shake chills and further develops the foam.'
      },
      {
        description: 'Double strain into your serving glass.',
        tip: 'The double strain ensures no ice chips break the foam.'
      }
    ],
    equipment: ['Shaker', 'Ice'],
    tips: [
      'Essential for any cocktail containing egg white',
      'Creates a luxurious foam cap on the finished drink',
      'Can also be used with aquafaba for vegan alternatives'
    ],
    tags: ['shaking', 'egg white', 'foam', 'texture'],
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech_3',
    name: 'Muddling',
    category: 'Muddling',
    difficulty: 'Beginner',
    duration: '20 seconds',
    description: 'A technique used to gently crush herbs, fruits, or spices to release their essential oils and flavors into the cocktail.',
    steps: [
      {
        description: 'Place herbs or fruit in the bottom of your mixing glass or shaker.',
        tip: 'Use fresh, high-quality ingredients for best results.'
      },
      {
        description: 'Gently press and twist with a muddler to release oils.',
        tip: 'For herbs, gentle pressure is key - over-muddling creates bitterness.'
      },
      {
        description: 'Add other ingredients and proceed with your recipe.',
        tip: 'Taste as you go to achieve the desired intensity.'
      }
    ],
    equipment: ['Muddler', 'Mixing Glass'],
    tips: [
      'Use gentle pressure for herbs to avoid bitterness',
      'Muddle fruits more aggressively to extract juices',
      'Clean your muddler between different ingredients'
    ],
    tags: ['muddling', 'herbs', 'fruit', 'extraction'],
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech_4',
    name: 'Layering',
    category: 'Layering',
    difficulty: 'Advanced',
    duration: '2 minutes',
    description: 'A technique for creating visually striking cocktails by floating different density liquids on top of each other.',
    steps: [
      {
        description: 'Start with the heaviest (highest sugar content) liquid at the bottom.',
        tip: 'Grenadine and simple syrups work well as base layers.'
      },
      {
        description: 'Pour the next layer slowly over the back of a bar spoon.',
        tip: 'The spoon should touch the surface of the previous layer.'
      },
      {
        description: 'Continue layering from heaviest to lightest density.',
        tip: 'Practice makes perfect - start with simple two-layer drinks.'
      }
    ],
    equipment: ['Bar Spoon', 'Steady Hand'],
    tips: [
      'Temperature affects density - colder liquids are denser',
      'Practice with different spirits to learn their densities',
      'Serve immediately to maintain the layers'
    ],
    tags: ['layering', 'visual', 'density', 'presentation'],
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00Z'
  }
];
