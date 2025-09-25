import { 
  Clock, 
  Users, 
  Star, 
  Heart, 
  Share2, 
  MoreVertical,
  ChefHat,
  Zap
} from 'lucide-react';
import { memo, useState } from 'react';

import { cn } from '../../utils';

import ModernButton from './ModernButton';
import ModernCard from './ModernCard';

/**
 * Modern Recipe Card - Premium mobile-first design
 * Features: Glassmorphism, interactive elements, smooth animations
 */
const ModernRecipeCard = memo(({ 
  recipe,
  onSelect,
  onFavorite,
  onShare,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const [isLiked, setIsLiked] = useState(recipe?.isFavorite || false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle favorite toggle
  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onFavorite?.(recipe, !isLiked);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  // Handle share
  const handleShare = (e) => {
    e.stopPropagation();
    onShare?.(recipe);
  };

  // Handle card click
  const handleCardClick = () => {
    onSelect?.(recipe);
  };

  // Recipe stats
  const stats = [
    {
      icon: Clock,
      value: recipe?.prepTime || '15 min',
      label: 'Prep time',
    },
    {
      icon: Users,
      value: recipe?.servings || '2',
      label: 'Servings',
    },
    {
      icon: ChefHat,
      value: recipe?.difficulty || 'Easy',
      label: 'Difficulty',
    },
  ];

  return (
    <ModernCard
      variant={variant}
      padding="none"
      interactive
      hover
      onClick={handleCardClick}
      className={cn(
        'group overflow-hidden',
        'transform transition-all duration-300',
        'hover:shadow-xl hover:shadow-primary-500/10',
        className
      )}
      {...props}
    >
      {/* Recipe Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Image placeholder */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200',
          'dark:from-primary-900/20 dark:to-primary-800/20',
          'flex items-center justify-center',
          imageLoaded && 'opacity-0'
        )}>
          <ChefHat className="w-12 h-12 text-primary-400 opacity-50" />
        </div>
        
        {/* Actual image */}
        {recipe?.image && (
          <img
            src={recipe.image}
            alt={recipe.name}
            className={cn(
              'w-full h-full object-cover',
              'transition-all duration-500',
              'group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            className={cn(
              'p-2 rounded-full backdrop-blur-md transition-all duration-200',
              'bg-white/20 hover:bg-white/30',
              'border border-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/50',
              'active:scale-95 transform',
              isLiked && 'bg-error-500/80 hover:bg-error-500'
            )}
          >
            <Heart 
              className={cn(
                'w-4 h-4 transition-colors',
                isLiked ? 'text-white fill-current' : 'text-white'
              )} 
            />
          </button>
          
          {/* Share button */}
          <button
            onClick={handleShare}
            className={cn(
              'p-2 rounded-full backdrop-blur-md transition-all duration-200',
              'bg-white/20 hover:bg-white/30',
              'border border-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/50',
              'active:scale-95 transform'
            )}
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {/* Recipe type badge */}
        {recipe?.type && (
          <div className="absolute top-3 left-3">
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              'bg-white/20 backdrop-blur-md text-white',
              'border border-white/30'
            )}>
              {recipe.type}
            </span>
          </div>
        )}
        
        {/* Rating */}
        {recipe?.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-medium">
              {recipe.rating}
            </span>
          </div>
        )}
      </div>
      
      {/* Recipe Content */}
      <div className="p-4 space-y-3">
        {/* Recipe name */}
        <h3 className={cn(
          'font-semibold text-lg leading-tight',
          'text-neutral-900 dark:text-neutral-100',
          'group-hover:text-primary-600 dark:group-hover:text-primary-400',
          'transition-colors duration-200',
          'line-clamp-2'
        )}>
          {recipe?.name || 'Untitled Recipe'}
        </h3>
        
        {/* Recipe description */}
        {recipe?.description && (
          <p className={cn(
            'text-sm text-neutral-600 dark:text-neutral-400',
            'line-clamp-2 leading-relaxed'
          )}>
            {recipe.description}
          </p>
        )}
        
        {/* Recipe stats */}
        <div className="flex items-center justify-between pt-2">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span className="text-sm text-neutral-600 dark:text-neutral-300">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Ingredients preview */}
        {recipe?.ingredients && recipe.ingredients.length > 0 && (
          <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Ingredients:
              </span>
              <div className="flex gap-1 flex-wrap">
                {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-2 py-1 rounded-md text-xs',
                      'bg-neutral-100 dark:bg-neutral-800',
                      'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    {ingredient.name || ingredient}
                  </span>
                ))}
                {recipe.ingredients.length > 3 && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    +{recipe.ingredients.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5" />
      </div>
    </ModernCard>
  );
});

ModernRecipeCard.displayName = 'ModernRecipeCard';

export default ModernRecipeCard;
