// =============================================================================
// SAMPLE MOCKTAIL RECIPES
// =============================================================================

import { createRecipe } from '../models';

/**
 * Sample mocktail recipes to demonstrate the feature
 */
export const SAMPLE_MOCKTAILS = [
  createRecipe({
    name: 'Virgin Mojito',
    category: 'Mocktail',
    version: 'Classic',
    source: 'Traditional',
    isOriginalVersion: true,
    flavorProfile: ['refreshing', 'citrusy', 'herbal'],
    ingredients: [
      { name: 'Fresh Mint Leaves', amount: '10', unit: 'leaves', notes: 'Muddled gently' },
      { name: 'Fresh Lime Juice', amount: '1', unit: 'oz', notes: 'Freshly squeezed' },
      { name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
      { name: 'Club Soda', amount: '4', unit: 'oz', notes: 'Chilled' },
      { name: 'Ice', amount: '1', unit: 'cup', notes: 'Crushed ice preferred' }
    ],
    instructions: 'Gently muddle mint leaves with lime juice and simple syrup in a highball glass. Fill with crushed ice and top with club soda. Stir gently and garnish with fresh mint sprig.',
    glassware: 'Highball Glass',
    garnish: 'Fresh mint sprig and lime wheel',
    prepTime: 3,
    difficulty: 'Easy',
    notes: 'Perfect refreshing drink for hot summer days',
    tags: ['refreshing', 'summer', 'mint', 'lime', 'classic'],
    yields: 1
  }),

  createRecipe({
    name: 'Shirley Temple',
    category: 'Mocktail',
    version: 'Classic',
    source: 'Traditional',
    isOriginalVersion: true,
    flavorProfile: ['sweet', 'fruity', 'fizzy'],
    ingredients: [
      { name: 'Ginger Ale', amount: '6', unit: 'oz', notes: 'Chilled' },
      { name: 'Grenadine', amount: '0.5', unit: 'oz' },
      { name: 'Fresh Lime Juice', amount: '0.25', unit: 'oz', optional: true },
      { name: 'Ice', amount: '1', unit: 'cup' }
    ],
    instructions: 'Fill a highball glass with ice. Add ginger ale and slowly pour grenadine to create a layered effect. Add a splash of lime juice if desired. Stir gently before drinking.',
    glassware: 'Highball Glass',
    garnish: 'Maraschino cherry and orange slice',
    prepTime: 2,
    difficulty: 'Easy',
    notes: 'A classic kid-friendly cocktail named after the famous child actress',
    tags: ['sweet', 'classic', 'kid-friendly', 'cherry', 'ginger'],
    yields: 1
  }),

  createRecipe({
    name: 'Cucumber Mint Cooler',
    category: 'Mocktail',
    version: 'Modern',
    source: 'House Special',
    isOriginalVersion: true,
    flavorProfile: ['refreshing', 'herbal', 'bright', 'aromatic'],
    ingredients: [
      { name: 'Fresh Cucumber', amount: '4', unit: 'slice', notes: 'Muddled' },
      { name: 'Fresh Mint Leaves', amount: '8', unit: 'leaves', notes: 'Muddled gently' },
      { name: 'Fresh Lime Juice', amount: '0.75', unit: 'oz' },
      { name: 'Agave Syrup', amount: '0.5', unit: 'oz' },
      { name: 'Sparkling Water', amount: '4', unit: 'oz', notes: 'Chilled' },
      { name: 'Ice', amount: '1', unit: 'cup' }
    ],
    instructions: 'Muddle cucumber slices and mint leaves in a shaker. Add lime juice and agave syrup. Shake with ice and double strain into a rocks glass filled with fresh ice. Top with sparkling water.',
    glassware: 'Rocks Glass',
    garnish: 'Cucumber ribbon and mint sprig',
    prepTime: 4,
    difficulty: 'Medium',
    notes: 'Light and refreshing with a spa-like quality',
    tags: ['cucumber', 'mint', 'spa', 'healthy', 'refreshing'],
    yields: 1
  }),

  createRecipe({
    name: 'Tropical Sunset',
    category: 'Mocktail',
    version: 'Signature',
    source: 'House Creation',
    isOriginalVersion: true,
    flavorProfile: ['tropical', 'fruity', 'sweet', 'bright'],
    ingredients: [
      { name: 'Pineapple Juice', amount: '3', unit: 'oz', notes: 'Fresh preferred' },
      { name: 'Orange Juice', amount: '2', unit: 'oz', notes: 'Freshly squeezed' },
      { name: 'Coconut Cream', amount: '1', unit: 'oz' },
      { name: 'Grenadine', amount: '0.5', unit: 'oz', notes: 'For layering' },
      { name: 'Fresh Lime Juice', amount: '0.25', unit: 'oz' },
      { name: 'Ice', amount: '1', unit: 'cup' }
    ],
    instructions: 'Shake pineapple juice, orange juice, coconut cream, and lime juice with ice. Strain into a hurricane glass filled with fresh ice. Slowly pour grenadine down the side to create a sunset effect.',
    glassware: 'Hurricane Glass',
    garnish: 'Pineapple wedge, orange wheel, and cocktail umbrella',
    prepTime: 3,
    difficulty: 'Easy',
    notes: 'Beautiful layered drink that tastes like vacation',
    tags: ['tropical', 'pineapple', 'coconut', 'layered', 'vacation'],
    yields: 1
  }),

  createRecipe({
    name: 'Spiced Apple Cider Mocktail',
    category: 'Mocktail',
    version: 'Seasonal',
    source: 'Fall Special',
    isOriginalVersion: true,
    flavorProfile: ['spicy', 'sweet', 'aromatic', 'rich'],
    ingredients: [
      { name: 'Apple Cider', amount: '6', unit: 'oz', notes: 'Warmed' },
      { name: 'Cinnamon Syrup', amount: '0.5', unit: 'oz' },
      { name: 'Fresh Lemon Juice', amount: '0.25', unit: 'oz' },
      { name: 'Ground Cinnamon', amount: '1', unit: 'dash', notes: 'For garnish' },
      { name: 'Star Anise', amount: '1', unit: 'whole', notes: 'For garnish' }
    ],
    instructions: 'Warm apple cider in a saucepan (do not boil). Stir in cinnamon syrup and lemon juice. Pour into a mug and garnish with a cinnamon stick and star anise.',
    glassware: 'Mug',
    garnish: 'Cinnamon stick, star anise, and apple slice',
    prepTime: 5,
    difficulty: 'Easy',
    notes: 'Perfect warming drink for fall and winter',
    tags: ['hot', 'spiced', 'apple', 'cinnamon', 'fall', 'winter'],
    yields: 1
  }),

  createRecipe({
    name: 'Lavender Lemonade',
    category: 'Mocktail',
    version: 'Artisanal',
    source: 'Garden Fresh',
    isOriginalVersion: true,
    flavorProfile: ['floral', 'citrusy', 'aromatic', 'refreshing'],
    ingredients: [
      { name: 'Fresh Lemon Juice', amount: '2', unit: 'oz', notes: 'Freshly squeezed' },
      { name: 'Lavender Simple Syrup', amount: '1', unit: 'oz', notes: 'Homemade preferred' },
      { name: 'Still Water', amount: '4', unit: 'oz', notes: 'Chilled' },
      { name: 'Ice', amount: '1', unit: 'cup' },
      { name: 'Dried Lavender', amount: '1', unit: 'pinch', notes: 'For garnish' }
    ],
    instructions: 'Combine lemon juice and lavender syrup in a tall glass. Add ice and top with chilled water. Stir gently and garnish with a sprig of fresh lavender or a pinch of dried lavender.',
    glassware: 'Collins Glass',
    garnish: 'Fresh lavender sprig and lemon wheel',
    prepTime: 2,
    difficulty: 'Easy',
    notes: 'Elegant and calming with beautiful floral notes',
    tags: ['floral', 'lavender', 'lemon', 'elegant', 'calming'],
    yields: 1
  })
];

/**
 * Get all sample mocktails
 */
export const getSampleMocktails = () => SAMPLE_MOCKTAILS;

/**
 * Get a random sample mocktail
 */
export const getRandomMocktail = () => {
  const randomIndex = Math.floor(Math.random() * SAMPLE_MOCKTAILS.length);
  return SAMPLE_MOCKTAILS[randomIndex];
};
