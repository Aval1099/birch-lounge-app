import { memo } from 'react';

/**
 * Simple UI Demo - Basic test to ensure components load
 */
const SimpleUIDemo = memo(() => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🍸 Birch Lounge
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Modern UI Design System
          </p>
        </div>

        {/* Simple Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Modern Buttons
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
              Primary
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
              Accent
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
              Secondary
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
              Success
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
              Danger
            </button>
            <button className="bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105">
              Ghost
            </button>
          </div>
        </div>

        {/* Simple Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Recipe Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recipe Card 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🍸</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Classic Old Fashioned
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                A timeless whiskey cocktail with bitters and orange
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">5 min</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">4.8</span>
                </div>
              </div>
            </div>

            {/* Recipe Card 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="w-full h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🍹</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tropical Mojito
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Refreshing mint and lime cocktail with tropical fruits
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">7 min</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">4.6</span>
                </div>
              </div>
            </div>

            {/* Recipe Card 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="w-full h-32 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🥃</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Smoky Manhattan
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Classic Manhattan with a smoky twist and cherry garnish
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">4 min</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Inputs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Modern Inputs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipe Name
              </label>
              <input
                type="text"
                placeholder="Enter recipe name..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Ingredients
              </label>
              <input
                type="text"
                placeholder="Search ingredients..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Modern UI System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
});

SimpleUIDemo.displayName = 'SimpleUIDemo';

export default SimpleUIDemo;
