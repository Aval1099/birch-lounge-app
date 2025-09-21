import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  IngredientSkeleton,
  MenuSkeleton,
  ModalSkeleton,
  RecipeSkeleton,
  SearchSkeleton,
  Skeleton
} from '../../components/ui/SkeletonLoader';

describe('Skeleton Loading Components', () => {
  describe('Base Skeleton Component', () => {
    it('renders with default props', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('[aria-hidden="true"]');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('renders without animation when disabled', () => {
      const { container } = render(<Skeleton animate={false} />);
      const skeleton = container.querySelector('[aria-hidden="true"]');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('applies custom classes', () => {
      const { container } = render(<Skeleton className="custom-class" width="w-32" height="h-8" />);
      const skeleton = container.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveClass('custom-class', 'w-32', 'h-8');
    });
  });

  describe('RecipeSkeleton Component', () => {
    it('renders card variant by default', () => {
      const { container } = render(<RecipeSkeleton count={2} />);
      // Should render a grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('renders list variant', () => {
      const { container } = render(<RecipeSkeleton variant="list" count={2} />);
      // Should render multiple skeleton items
      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(2); // Multiple skeleton elements per item
    });

    it('renders correct number of items', () => {
      const { container } = render(<RecipeSkeleton count={3} />);
      // Count the number of recipe card containers
      const recipeCards = container.querySelectorAll('.bg-white');
      expect(recipeCards).toHaveLength(3);
    });
  });

  describe('IngredientSkeleton Component', () => {
    it('renders correct number of ingredient items', () => {
      const { container } = render(<IngredientSkeleton count={4} />);
      const ingredientItems = container.querySelectorAll('.bg-white');
      expect(ingredientItems).toHaveLength(4);
    });

    it('has proper structure for ingredient items', () => {
      const { container } = render(<IngredientSkeleton count={1} />);
      const ingredientItem = container.querySelector('.bg-white');
      expect(ingredientItem).toBeInTheDocument();
      // Should have flex layout for ingredient structure
      expect(ingredientItem.querySelector('.flex')).toBeInTheDocument();
    });
  });

  describe('SearchSkeleton Component', () => {
    it('renders recipe search skeleton by default', () => {
      const { container } = render(<SearchSkeleton count={2} />);
      // Should have search header and results
      const searchContainer = container.firstChild;
      expect(searchContainer).toHaveClass('space-y-4');
    });

    it('renders ingredient search skeleton', () => {
      const { container } = render(<SearchSkeleton type="ingredients" count={3} />);
      const ingredientItems = container.querySelectorAll('.bg-white');
      expect(ingredientItems).toHaveLength(3);
    });
  });

  describe('MenuSkeleton Component', () => {
    it('renders menu builder skeleton structure', () => {
      const { container } = render(<MenuSkeleton />);
      const menuContainer = container.firstChild;
      expect(menuContainer).toHaveClass('space-y-6');

      // Should have header and grid layout
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('ModalSkeleton Component', () => {
    it('renders recipe modal skeleton by default', () => {
      const { container } = render(<ModalSkeleton />);
      const modalContainer = container.firstChild;
      expect(modalContainer).toHaveClass('space-y-6');
    });

    it('renders generic modal skeleton', () => {
      const { container } = render(<ModalSkeleton type="generic" />);
      const modalContainer = container.firstChild;
      expect(modalContainer).toHaveClass('space-y-4');
    });
  });

  describe('Accessibility', () => {
    it('all skeleton components have aria-hidden attribute', () => {
      const { container } = render(
        <div>
          <Skeleton />
          <RecipeSkeleton count={1} />
          <IngredientSkeleton count={1} />
          <SearchSkeleton count={1} />
          <MenuSkeleton />
          <ModalSkeleton />
        </div>
      );

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(0);
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Performance', () => {
    it('renders large number of skeleton items efficiently', () => {
      const startTime = performance.now();
      const { container } = render(<RecipeSkeleton count={20} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 500ms) and create elements
      expect(endTime - startTime).toBeLessThan(500);
      const skeletonElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });
});
