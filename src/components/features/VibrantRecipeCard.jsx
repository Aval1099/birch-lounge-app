import { Heart, Clock, DollarSign, Users, Edit, Trash2 } from 'lucide-react';

import { VibrantCard, VibrantButton } from '../ui';

const VibrantRecipeCard = ({ recipe, onEdit, onFavorite, onAddToMenu, onBatchScale, onDelete }) => {
  const {
    id, name, category, difficulty, prepTime, cost, ingredients = [],
    isFavorite = false, flavorProfile = [], description = ''
  } = recipe;

  return (
    <VibrantCard
      variant="gradient"
      hover={true}
      clickable={true}
      className="group cursor-pointer transform transition-all duration-200"
      onClick={() => onEdit(recipe)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                {category}
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                {difficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(id);
              }}
              icon={<Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />}
              className="p-2"
            />
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(recipe);
              }}
              icon={<Edit className="w-4 h-4" />}
              className="p-2 text-gray-400 hover:text-emerald-600"
            />
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              icon={<Trash2 className="w-4 h-4" />}
              className="p-2 text-gray-400 hover:text-red-600"
            />
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {description}
          </p>
        )}

        {/* Flavor Profile */}
        {flavorProfile.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flavorProfile.slice(0, 3).map((flavor) => (
              <span
                key={flavor}
                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"
              >
                {flavor}
              </span>
            ))}
            {flavorProfile.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{flavorProfile.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{prepTime || '5 min'}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>${cost?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>1</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ingredients ({ingredients.length})
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {ingredients.slice(0, 3).map((ing, index) => (
              <span key={index}>
                {ing.amount} {ing.unit} {ing.name}
                {index < Math.min(2, ingredients.length - 1) && ', '}
              </span>
            ))}
            {ingredients.length > 3 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {' '}and {ingredients.length - 3} more...
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <VibrantButton
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToMenu(recipe);
            }}
            className="flex-1"
          >
            Add to Menu
          </VibrantButton>
          <VibrantButton
            variant="accent"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBatchScale(recipe);
            }}
            className="flex-1"
          >
            Batch Scale
          </VibrantButton>
        </div>
      </div>
    </VibrantCard>
  );
};

export default VibrantRecipeCard;
