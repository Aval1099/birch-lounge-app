import React from 'react';
import { Button, ResponsiveGrid, ResponsiveCard, MobileNavigation } from '../components/ui';
import { ChefHat, Package, FileText, Calculator, Zap, Settings } from 'lucide-react';

export default {
  title: 'Mobile/Optimization',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Mobile-first responsive design components with touch optimization.',
      },
    },
  },
};

// Sample tabs for navigation
const sampleTabs = [
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
  { id: 'ingredients', label: 'Ingredients', icon: Package },
  { id: 'menus', label: 'Menus', icon: FileText },
  { id: 'batch', label: 'Batch', icon: Calculator },
  { id: 'ai', label: 'AI Assistant', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const TouchTargets = () => (
  <div className="p-4 space-y-6">
    <h2 className="text-2xl font-bold mb-4">Touch Target Sizes</h2>
    
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Small (44px minimum - WCAG AA)</h3>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" touchOptimized={true} className="min-h-[44px] min-w-[44px]">Small Button</Button>
          <Button size="sm" variant="primary" touchOptimized={true} className="min-h-[44px] min-w-[44px]">Primary</Button>
          <Button size="sm" variant="danger" touchOptimized={true} className="min-h-[44px] min-w-[44px]">Danger</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Medium (48px recommended)</h3>
        <div className="flex gap-2 flex-wrap">
          <Button size="md" touchOptimized={true} className="min-h-[48px] min-w-[48px]">Medium Button</Button>
          <Button size="md" variant="primary" touchOptimized={true} className="min-h-[48px] min-w-[48px]">Primary</Button>
          <Button size="md" variant="success" touchOptimized={true} className="min-h-[48px] min-w-[48px]">Success</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Large (56px comfortable)</h3>
        <div className="flex gap-2 flex-wrap">
          <Button size="lg" touchOptimized={true} className="min-h-[56px] min-w-[56px]">Large Button</Button>
          <Button size="lg" variant="primary" touchOptimized={true} className="min-h-[56px] min-w-[56px]">Primary</Button>
          <Button size="lg" variant="outline" touchOptimized={true} className="min-h-[56px] min-w-[56px]">Outline</Button>
        </div>
      </div>
    </div>
  </div>
);

export const ResponsiveGridDemo = () => (
  <div className="p-4">
    <h2 className="text-2xl font-bold mb-4">Responsive Grid</h2>
    <p className="text-gray-600 mb-6">
      Grid adapts from 1 column on mobile to 4 columns on desktop
    </p>
    
    <ResponsiveGrid
      cols={{ xs: 1, sm: 2, md: 3, lg: 4 }}
      gap="gap-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <ResponsiveCard key={i} interactive={true}>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Card {i + 1}</h3>
            <p className="text-gray-600 text-sm">
              This card adapts to different screen sizes and provides touch-friendly interactions.
            </p>
          </div>
        </ResponsiveCard>
      ))}
    </ResponsiveGrid>
  </div>
);

export const MobileNavigationDemo = () => (
  <div className="h-screen bg-gray-100">
    <MobileNavigation tabs={sampleTabs} />
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Mobile Navigation</h2>
      <p className="text-gray-600 mb-4">
        Navigation automatically adapts to mobile with hamburger menu and swipe gestures.
      </p>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Hamburger menu on mobile devices</li>
          <li>Swipe left/right to navigate between tabs</li>
          <li>Visual tab indicator with progress bar</li>
          <li>Touch-optimized menu items (48px minimum)</li>
          <li>Smooth animations and transitions</li>
        </ul>
      </div>
    </div>
  </div>
);

export const TouchInteractions = () => (
  <div className="p-4 space-y-6">
    <h2 className="text-2xl font-bold mb-4">Touch Interactions</h2>
    
    <div className="grid gap-4 md:grid-cols-2">
      <ResponsiveCard 
        interactive={true}
        onClick={() => alert('Card tapped!')}
        className="p-6"
      >
        <h3 className="font-semibold mb-2">Tap Interaction</h3>
        <p className="text-gray-600 text-sm">
          Tap this card to see the touch interaction. On mobile, it provides haptic-like feedback.
        </p>
      </ResponsiveCard>
      
      <ResponsiveCard 
        interactive={true}
        onLongPress={() => alert('Long press detected!')}
        className="p-6"
      >
        <h3 className="font-semibold mb-2">Long Press</h3>
        <p className="text-gray-600 text-sm">
          Long press this card (500ms) to trigger the long press action.
        </p>
      </ResponsiveCard>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-900 mb-2">Touch Guidelines</h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
        <li>Minimum touch target: 44px × 44px (WCAG AA)</li>
        <li>Recommended touch target: 48px × 48px</li>
        <li>Comfortable touch target: 56px × 56px</li>
        <li>Adequate spacing between touch targets</li>
        <li>Visual feedback for all interactions</li>
      </ul>
    </div>
  </div>
);

export const FormOptimization = () => (
  <div className="p-4 max-w-md mx-auto">
    <h2 className="text-2xl font-bold mb-4">Mobile Form Optimization</h2>
    
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipe Name
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
          placeholder="Enter recipe name"
          style={{ fontSize: '16px' }} // Prevents zoom on iOS
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base">
          <option>Select category</option>
          <option>Cocktails</option>
          <option>Mocktails</option>
          <option>Shots</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instructions
        </label>
        <textarea
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base resize-none"
          placeholder="Enter preparation instructions"
          style={{ fontSize: '16px' }} // Prevents zoom on iOS
        />
      </div>
      
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="favorite"
          className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
        />
        <label htmlFor="favorite" className="text-sm font-medium text-gray-700">
          Mark as favorite
        </label>
      </div>
      
      <Button 
        type="submit" 
        variant="primary" 
        size="lg" 
        className="w-full"
        touchOptimized={true}
      >
        Save Recipe
      </Button>
    </form>
    
    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-semibold text-green-900 mb-2">Mobile Form Best Practices</h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
        <li>16px font size prevents zoom on iOS</li>
        <li>Adequate padding for touch targets</li>
        <li>Clear focus states and visual feedback</li>
        <li>Proper input types for better keyboards</li>
        <li>Logical tab order for accessibility</li>
      </ul>
    </div>
  </div>
);

export const BreakpointDemo = () => (
  <div className="p-4">
    <h2 className="text-2xl font-bold mb-4">Responsive Breakpoints</h2>
    
    <div className="grid gap-4">
      <div className="bg-red-100 p-4 rounded-lg block sm:hidden">
        <h3 className="font-semibold text-red-900">Extra Small (&lt; 640px)</h3>
        <p className="text-red-800 text-sm">Mobile phones in portrait mode</p>
      </div>
      
      <div className="bg-orange-100 p-4 rounded-lg hidden sm:block md:hidden">
        <h3 className="font-semibold text-orange-900">Small (640px - 768px)</h3>
        <p className="text-orange-800 text-sm">Mobile phones in landscape, small tablets</p>
      </div>
      
      <div className="bg-yellow-100 p-4 rounded-lg hidden md:block lg:hidden">
        <h3 className="font-semibold text-yellow-900">Medium (768px - 1024px)</h3>
        <p className="text-yellow-800 text-sm">Tablets in portrait mode</p>
      </div>
      
      <div className="bg-green-100 p-4 rounded-lg hidden lg:block xl:hidden">
        <h3 className="font-semibold text-green-900">Large (1024px - 1280px)</h3>
        <p className="text-green-800 text-sm">Tablets in landscape, small laptops</p>
      </div>
      
      <div className="bg-blue-100 p-4 rounded-lg hidden xl:block">
        <h3 className="font-semibold text-blue-900">Extra Large (≥ 1280px)</h3>
        <p className="text-blue-800 text-sm">Desktop computers, large laptops</p>
      </div>
    </div>
    
    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-2">Current Viewport</h3>
      <p className="text-gray-700 text-sm">
        Resize your browser window to see how the layout adapts to different breakpoints.
      </p>
    </div>
  </div>
);
