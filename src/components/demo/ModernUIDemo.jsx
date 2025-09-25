import {
  Search,
  Heart,
  Star,
  Clock,
  Users,
  ChefHat,
  Plus,
  Settings
} from 'lucide-react';
import { memo, useState } from 'react';

import ModernMobileLayout from '../layout/ModernMobileLayout';
import {
  ModernButton,
  ModernCard,
  ModernInput,
  ModernRecipeCard,
  ModernHeader,
  ModernMobileNav
} from '../ui';

/**
 * Modern UI Demo - Showcase of the new design system
 */
const ModernUIDemo = memo(() => {
  const [activeTab, setActiveTab] = useState('recipes');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample recipe data
  const sampleRecipes = [
    {
      id: 1,
      name: 'Classic Old Fashioned',
      description: 'A timeless whiskey cocktail with bitters and orange',
      image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
      prepTime: '5 min',
      servings: '1',
      difficulty: 'Easy',
      rating: 4.8,
      type: 'Classic',
      isFavorite: true,
      ingredients: [
        { name: 'Whiskey' },
        { name: 'Bitters' },
        { name: 'Orange' },
        { name: 'Sugar' }
      ]
    },
    {
      id: 2,
      name: 'Mojito',
      description: 'Refreshing mint and lime cocktail with white rum',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
      prepTime: '8 min',
      servings: '1',
      difficulty: 'Medium',
      rating: 4.6,
      type: 'Tropical',
      isFavorite: false,
      ingredients: [
        { name: 'White Rum' },
        { name: 'Mint' },
        { name: 'Lime' },
        { name: 'Soda Water' }
      ]
    },
    {
      id: 3,
      name: 'Espresso Martini',
      description: 'Coffee-forward cocktail perfect for evening',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      prepTime: '10 min',
      servings: '1',
      difficulty: 'Hard',
      rating: 4.9,
      type: 'Modern',
      isFavorite: true,
      ingredients: [
        { name: 'Vodka' },
        { name: 'Espresso' },
        { name: 'Coffee Liqueur' },
        { name: 'Simple Syrup' }
      ]
    }
  ];

  return (
    <ModernMobileLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerProps={{
        title: 'Modern UI Demo',
        subtitle: 'Premium Design System Showcase'
      }}
    >
      {/* Hero Section */}
      <ModernCard variant="gradient" padding="xl" className="text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Modern UI Components
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Premium mobile-first design system with glassmorphism effects
            </p>
          </div>
        </div>
      </ModernCard>

      {/* Button Showcase */}
      <ModernCard variant="elevated" padding="lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Modern Buttons
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ModernButton variant="primary" icon={Plus}>
            Primary
          </ModernButton>
          <ModernButton variant="secondary" icon={Search}>
            Secondary
          </ModernButton>
          <ModernButton variant="accent" icon={Heart}>
            Accent
          </ModernButton>
          <ModernButton variant="glass" icon={Star}>
            Glass
          </ModernButton>
          <ModernButton variant="ghost" icon={Settings}>
            Ghost
          </ModernButton>
          <ModernButton variant="danger" loading>
            Loading
          </ModernButton>
        </div>
      </ModernCard>

      {/* Input Showcase */}
      <ModernCard variant="glass" padding="lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Modern Inputs
        </h2>
        <div className="space-y-4">
          <ModernInput
            label="Search Recipes"
            placeholder="Type to search..."
            leftIcon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ModernInput
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            required
          />
          <ModernInput
            label="Password"
            type="password"
            placeholder="Enter password"
            helperText="Must be at least 8 characters"
          />
          <ModernInput
            label="Success State"
            value="Valid input"
            success
            helperText="This looks good!"
          />
          <ModernInput
            label="Error State"
            value="Invalid input"
            error="This field is required"
          />
        </div>
      </ModernCard>

      {/* Card Variants */}
      <ModernCard variant="default" padding="lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Card Variants
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModernCard variant="default" padding="default" hover>
            <h3 className="font-medium text-gray-900 dark:text-white">Default Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Standard card with subtle shadow
            </p>
          </ModernCard>
          <ModernCard variant="elevated" padding="default" hover>
            <h3 className="font-medium text-gray-900 dark:text-white">Elevated Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enhanced shadow and backdrop blur
            </p>
          </ModernCard>
          <ModernCard variant="glass" padding="default" hover>
            <h3 className="font-medium text-gray-900 dark:text-white">Glass Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Glassmorphism effect with transparency
            </p>
          </ModernCard>
          <ModernCard variant="outlined" padding="default" hover>
            <h3 className="font-medium text-gray-900 dark:text-white">Outlined Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Clean border-only design
            </p>
          </ModernCard>
        </div>
      </ModernCard>

      {/* Recipe Cards */}
      <ModernCard variant="minimal" padding="lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Recipe Cards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleRecipes.map((recipe) => (
            <ModernRecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={(recipe) => console.warn('Selected:', recipe.name)}
              onFavorite={(recipe, isFavorite) =>
                console.warn('Favorite:', recipe.name, isFavorite)
              }
              onShare={(recipe) => console.warn('Share:', recipe.name)}
            />
          ))}
        </div>
      </ModernCard>

      {/* Interactive Elements */}
      <ModernCard variant="gradient" padding="lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Interactive Features
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <span className="text-gray-900 dark:text-white">Haptic Feedback</span>
            <ModernButton variant="primary" size="sm" haptic>
              Try Me
            </ModernButton>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <span className="text-gray-900 dark:text-white">Touch Optimized</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">44px+ targets</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <span className="text-gray-900 dark:text-white">Smooth Animations</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">200ms transitions</span>
          </div>
        </div>
      </ModernCard>

      {/* Design System Info */}
      <ModernCard variant="elevated" padding="xl" className="text-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🎨 Premium Design System
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-gray-900 dark:text-white">Features</div>
              <div className="text-gray-600 dark:text-gray-400">
                • Glassmorphism effects<br />
                • Mobile-first responsive<br />
                • Touch-optimized (44px+)<br />
                • Haptic feedback
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-gray-900 dark:text-white">Technology</div>
              <div className="text-gray-600 dark:text-gray-400">
                • Tailwind CSS v4<br />
                • CSS Custom Properties<br />
                • Modern animations<br />
                • Accessibility ready
              </div>
            </div>
          </div>
        </div>
      </ModernCard>
    </ModernMobileLayout>
  );
});

ModernUIDemo.displayName = 'ModernUIDemo';

export default ModernUIDemo;
