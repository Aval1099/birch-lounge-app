import { memo } from 'react';

/**
 * Base Skeleton Component - Provides animated loading placeholders
 */
const Skeleton = memo(({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  animate = true
}) => {
  const animationClass = animate ? 'animate-pulse' : '';

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${width} ${height} ${rounded} ${animationClass} ${className}`}
      aria-hidden="true"
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * Recipe Card Skeleton - Mimics the structure of a recipe card
 */
export const RecipeSkeleton = memo(({ variant = 'card', count = 1 }) => {
  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              {/* Recipe image placeholder */}
              <Skeleton width="w-16" height="h-16" rounded="rounded-lg" />

              <div className="flex-1 space-y-2">
                {/* Recipe name */}
                <Skeleton width="w-3/4" height="h-5" />

                {/* Recipe details */}
                <div className="flex items-center gap-4">
                  <Skeleton width="w-16" height="h-4" />
                  <Skeleton width="w-20" height="h-4" />
                  <Skeleton width="w-12" height="h-4" />
                </div>

                {/* Recipe description */}
                <Skeleton width="w-full" height="h-4" />
                <Skeleton width="w-2/3" height="h-4" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
                <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Recipe image placeholder */}
          <Skeleton width="w-full" height="h-48" rounded="rounded-none" />

          <div className="p-6 space-y-4">
            {/* Recipe header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton width="w-3/4" height="h-6" />
                <div className="flex items-center gap-2">
                  <Skeleton width="w-16" height="h-4" />
                  <Skeleton width="w-20" height="h-4" rounded="rounded-full" />
                </div>
              </div>
              <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
            </div>

            {/* Recipe stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Skeleton width="w-4" height="h-4" />
                  <Skeleton width="w-12" height="h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton width="w-4" height="h-4" />
                  <Skeleton width="w-16" height="h-4" />
                </div>
              </div>
              <Skeleton width="w-20" height="h-6" />
            </div>

            {/* Recipe description */}
            <div className="space-y-2">
              <Skeleton width="w-full" height="h-4" />
              <Skeleton width="w-4/5" height="h-4" />
              <Skeleton width="w-3/5" height="h-4" />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
                <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
                <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
              </div>
              <Skeleton width="w-20" height="h-8" rounded="rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

RecipeSkeleton.displayName = 'RecipeSkeleton';

/**
 * Ingredient List Skeleton - Mimics ingredient list structure
 */
export const IngredientSkeleton = memo(({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Ingredient icon */}
            <Skeleton width="w-10" height="h-10" rounded="rounded-full" />

            <div className="flex-1 space-y-2">
              {/* Ingredient name */}
              <Skeleton width="w-1/2" height="h-5" />

              {/* Ingredient details */}
              <div className="flex items-center gap-4">
                <Skeleton width="w-16" height="h-4" />
                <Skeleton width="w-20" height="h-4" />
                <Skeleton width="w-24" height="h-4" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
            <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

IngredientSkeleton.displayName = 'IngredientSkeleton';

/**
 * Search Results Skeleton - For search loading states
 */
export const SearchSkeleton = memo(({ type = 'recipes', count = 3 }) => {
  if (type === 'ingredients') {
    return <IngredientSkeleton count={count} />;
  }

  return (
    <div className="space-y-4">
      {/* Search header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton width="w-32" height="h-6" />
        <Skeleton width="w-20" height="h-4" />
      </div>

      {/* Search results */}
      <RecipeSkeleton variant="list" count={count} />
    </div>
  );
});

SearchSkeleton.displayName = 'SearchSkeleton';

/**
 * Menu Builder Skeleton - For menu building interface
 */
export const MenuSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Menu header */}
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        <Skeleton width="w-1/3" height="h-8" />
        <div className="flex items-center gap-4">
          <Skeleton width="w-24" height="h-6" />
          <Skeleton width="w-32" height="h-6" />
          <Skeleton width="w-20" height="h-6" />
        </div>
      </div>
    </div>

    {/* Menu items */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton width="w-32" height="h-6" />
        <RecipeSkeleton variant="list" count={4} />
      </div>

      <div className="space-y-4">
        <Skeleton width="w-40" height="h-6" />
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center justify-between">
              <Skeleton width="w-2/3" height="h-5" />
              <Skeleton width="w-16" height="h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

MenuSkeleton.displayName = 'MenuSkeleton';

/**
 * Modal Content Skeleton - For loading modal content
 */
export const ModalSkeleton = memo(({ type = 'recipe' }) => {
  if (type === 'recipe') {
    return (
      <div className="space-y-6">
        {/* Modal header */}
        <div className="space-y-2">
          <Skeleton width="w-1/2" height="h-8" />
          <Skeleton width="w-1/3" height="h-5" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton width="w-24" height="h-5" />
              <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Skeleton width="w-20" height="h-10" rounded="rounded-lg" />
          <Skeleton width="w-24" height="h-10" rounded="rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Skeleton width="w-full" height="h-32" />
      <Skeleton width="w-3/4" height="h-6" />
      <Skeleton width="w-1/2" height="h-6" />
    </div>
  );
});

ModalSkeleton.displayName = 'ModalSkeleton';

export { Skeleton };
export default Skeleton;
