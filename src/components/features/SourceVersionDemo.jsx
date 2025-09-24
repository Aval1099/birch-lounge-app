/**
 * Source Version Demo Component
 * Demonstrates how source-based versioning works for scraped recipes
 */

import { BookOpen, Globe, User, Bot, Plus, GitBranch } from 'lucide-react';
import React, { useState } from 'react';

import { recipeScrapingService } from '../../services/recipeScrapingService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

import { RecipeVersionSelector, RecipeImportModal } from './index';


export const SourceVersionDemo = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);

  // Demo scraped recipes
  const demoScrapedRecipes = [
    {
      name: 'Old Fashioned',
      category: 'Whiskey',
      ingredients: [
        { name: 'Bourbon', amount: '2', unit: 'oz' },
        { name: 'Simple Syrup', amount: '0.25', unit: 'oz' },
        { name: 'Angostura Bitters', amount: '2', unit: 'dashes' },
        { name: 'Orange Peel', amount: '1', unit: 'piece' }
      ],
      instructions: 'Add bourbon, simple syrup, and bitters to mixing glass with ice. Stir until well chilled. Strain into rocks glass over large ice cube. Express orange peel over drink and drop in.',
      sourceInfo: {
        sourceName: 'Cocktail Codex',
        sourceType: 'book',
        sourceAuthor: 'Alex Day, Nick Fauchald, David Kaplan',
        sourcePage: '156',
        confidence: 0.95
      }
    },
    {
      name: 'Old Fashioned',
      category: 'Whiskey',
      ingredients: [
        { name: 'Rye Whiskey', amount: '2', unit: 'oz' },
        { name: 'Demerara Syrup', amount: '0.5', unit: 'oz' },
        { name: 'Angostura Bitters', amount: '2', unit: 'dashes' },
        { name: 'Orange Bitters', amount: '1', unit: 'dash' },
        { name: 'Lemon Peel', amount: '1', unit: 'piece' }
      ],
      instructions: 'Combine rye, demerara syrup, and both bitters in mixing glass. Add ice and stir for 30 seconds. Strain over large ice cube in rocks glass. Express lemon peel and garnish.',
      sourceInfo: {
        sourceName: 'Death & Co',
        sourceType: 'book',
        sourceAuthor: 'David Kaplan, Nick Fauchald, Alex Day',
        sourcePage: '89',
        confidence: 0.92
      }
    },
    {
      name: 'Negroni',
      category: 'Gin',
      ingredients: [
        { name: 'Gin', amount: '1', unit: 'oz' },
        { name: 'Campari', amount: '1', unit: 'oz' },
        { name: 'Sweet Vermouth', amount: '1', unit: 'oz' },
        { name: 'Orange Peel', amount: '1', unit: 'piece' }
      ],
      instructions: 'Combine all ingredients in mixing glass with ice. Stir until chilled. Strain into rocks glass over ice. Garnish with orange peel.',
      sourceInfo: {
        sourceName: 'Liquor.com',
        sourceType: 'website',
        sourceUrl: 'https://www.liquor.com/recipes/negroni/',
        confidence: 0.88
      }
    }
  ];

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'book': return <BookOpen className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      case 'bartender': return <User className="w-4 h-4" />;
      case 'ai_generated': return <Bot className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getSourceColor = (sourceType) => {
    switch (sourceType) {
      case 'book': return 'green';
      case 'website': return 'blue';
      case 'bartender': return 'purple';
      case 'ai_generated': return 'orange';
      default: return 'gray';
    }
  };

  const handleImportDemo = (recipe) => {
    setSelectedDemo(recipe);
    setShowImportModal(true);
  };

  const handleImportComplete = (result) => {
    console.warn('Import completed:', result);
    setShowImportModal(false);
    setSelectedDemo(null);
    // In a real app, you would refresh the recipe list here
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Source-Based Recipe Versioning Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This demonstrates how AI-scraped recipes are handled with versioning. When the AI scrapes
          a recipe from a source like "Cocktail Codex", it creates a new version alongside your
          existing "Birch Lounge" version without overwriting anything.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                How Source Versioning Works
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Each source (book, website, bartender) gets its own version</li>
                <li>• Original recipes are preserved - no overwriting</li>
                <li>• Easy switching between different source versions</li>
                <li>• Source attribution is clearly displayed</li>
                <li>• Confidence scores show AI scraping accuracy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Demo: Scraped Recipes Ready for Import
        </h3>

        {demoScrapedRecipes.map((recipe, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {recipe.name}
                  </h4>
                  <Badge variant="outline" size="sm">
                    {recipe.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(recipe.sourceInfo.sourceType)}
                    <span className="font-medium">{recipe.sourceInfo.sourceName}</span>
                  </div>

                  {recipe.sourceInfo.sourceAuthor && (
                    <span>by {recipe.sourceInfo.sourceAuthor}</span>
                  )}

                  {recipe.sourceInfo.sourcePage && (
                    <span>Page {recipe.sourceInfo.sourcePage}</span>
                  )}

                  <Badge
                    variant={getSourceColor(recipe.sourceInfo.sourceType)}
                    size="xs"
                  >
                    {Math.round(recipe.sourceInfo.confidence * 100)}% confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Ingredients ({recipe.ingredients.length})
                    </h5>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      {recipe.ingredients.slice(0, 3).map((ing, i) => (
                        <li key={i}>
                          {ing.amount} {ing.unit} {ing.name}
                        </li>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <li className="text-gray-500">
                          +{recipe.ingredients.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Instructions
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                      {recipe.instructions}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleImportDemo(recipe)}
                variant="primary"
                size="sm"
                className="ml-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Import Recipe
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          What Happens After Import:
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>✅ Recipe is added as a new source version (e.g., "Old Fashioned (Cocktail Codex)")</p>
          <p>✅ Your existing versions remain untouched</p>
          <p>✅ Easy switching between versions in the recipe editor</p>
          <p>✅ Source attribution is preserved and displayed</p>
          <p>✅ Version comparison shows differences between sources</p>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && selectedDemo && (
        <RecipeImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          scrapedRecipe={selectedDemo}
          sourceInfo={selectedDemo.sourceInfo}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

export default SourceVersionDemo;
