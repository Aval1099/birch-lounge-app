/**
 * Recipe Version Selector Component Tests
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeVersionSelector } from '../../components/features/RecipeVersionSelector';
import { recipeVersionService } from '../../services/recipeVersionService';
import { createRecipe, createVersionMetadata } from '../../models/index';

// Mock the recipe version service
vi.mock('../../services/recipeVersionService', () => ({
  recipeVersionService: {
    getVersions: vi.fn()
  }
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  Star: () => <div data-testid="star-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  GitBranch: () => <div data-testid="git-branch-icon" />,
  Archive: () => <div data-testid="archive-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  MoreVertical: () => <div data-testid="more-icon" />
}));

describe('RecipeVersionSelector', () => {
  let mockVersions;
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();

    mockVersions = [
      createRecipe({
        id: 'recipe-1',
        name: 'Classic Gin & Tonic',
        versionMetadata: createVersionMetadata({
          versionNumber: '1.0',
          versionType: 'original',
          isMainVersion: true,
          versionStatus: 'published'
        })
      }),
      createRecipe({
        id: 'recipe-1_v1_1',
        name: 'Classic Gin & Tonic',
        versionMetadata: createVersionMetadata({
          versionNumber: '1.1',
          versionName: 'Low ABV Version',
          versionType: 'variation',
          isMainVersion: false,
          versionStatus: 'published',
          changeDescription: 'Reduced alcohol content'
        })
      }),
      createRecipe({
        id: 'recipe-1_v2_0',
        name: 'Classic Gin & Tonic',
        versionMetadata: createVersionMetadata({
          versionNumber: '2.0',
          versionName: 'Premium Version',
          versionType: 'improvement',
          isMainVersion: false,
          versionStatus: 'draft'
        })
      })
    ];

    mockProps = {
      recipeFamily: 'recipe-1',
      selectedVersionId: 'recipe-1',
      onVersionSelect: vi.fn(),
      onVersionEdit: vi.fn(),
      onVersionCompare: vi.fn(),
      showActions: true,
      compact: false
    };

    recipeVersionService.getVersions.mockResolvedValue(mockVersions);
  });

  describe('rendering', () => {
    it('should render version list with all versions', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Recipe Versions (3)')).toBeInTheDocument();
      });

      expect(screen.getByText('Classic Gin & Tonic')).toBeInTheDocument();
      expect(screen.getByText('Classic Gin & Tonic (Low ABV Version)')).toBeInTheDocument();
      expect(screen.getByText('Classic Gin & Tonic (Premium Version)')).toBeInTheDocument();
    });

    it('should show main version badge', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Main')).toBeInTheDocument();
      });
    });

    it('should show version status badges', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('published')).toHaveLength(2);
        expect(screen.getByText('draft')).toBeInTheDocument();
      });
    });

    it('should show version type icons', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('star-icon')).toBeInTheDocument(); // original
        expect(screen.getByTestId('git-branch-icon')).toBeInTheDocument(); // variation
      });
    });

    it('should show change descriptions', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Reduced alcohol content/)).toBeInTheDocument();
      });
    });
  });

  describe('compact mode', () => {
    beforeEach(() => {
      mockProps.compact = true;
    });

    it('should render compact dropdown', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      });
    });

    it('should show selected version in button', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Classic Gin & Tonic')).toBeInTheDocument();
        expect(screen.getByText('Main')).toBeInTheDocument();
      });
    });

    it('should open dropdown when clicked', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
      });

      expect(screen.getByText('Classic Gin & Tonic (Low ABV Version)')).toBeInTheDocument();
      expect(screen.getByText('Classic Gin & Tonic (Premium Version)')).toBeInTheDocument();
    });

    it('should call onVersionSelect when version is clicked in dropdown', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
      });

      const versionOption = screen.getByText('Classic Gin & Tonic (Low ABV Version)');
      fireEvent.click(versionOption);

      expect(mockProps.onVersionSelect).toHaveBeenCalledWith('recipe-1_v1_1');
    });
  });

  describe('interactions', () => {
    it('should call onVersionSelect when version is clicked', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const versionCard = screen.getByText('Classic Gin & Tonic (Low ABV Version)').closest('div');
        fireEvent.click(versionCard);
      });

      expect(mockProps.onVersionSelect).toHaveBeenCalledWith('recipe-1_v1_1');
    });

    it('should call onVersionEdit when edit button is clicked', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0]);
      });

      expect(mockProps.onVersionEdit).toHaveBeenCalled();
    });

    it('should call onVersionCompare when compare button is clicked', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const compareButton = screen.getByText('Compare');
        fireEvent.click(compareButton);
      });

      expect(mockProps.onVersionCompare).toHaveBeenCalled();
    });

    it('should disable compare button when less than 2 versions', async () => {
      recipeVersionService.getVersions.mockResolvedValue([mockVersions[0]]);
      
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const compareButton = screen.getByText('Compare');
        expect(compareButton).toBeDisabled();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading skeletons', () => {
      recipeVersionService.getVersions.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<RecipeVersionSelector {...mockProps} />);

      expect(screen.getAllByRole('generic').some(el => 
        el.className.includes('animate-pulse')
      )).toBe(true);
    });
  });

  describe('empty state', () => {
    it('should show empty state when no versions exist', async () => {
      recipeVersionService.getVersions.mockResolvedValue([]);
      
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No versions found for this recipe family.')).toBeInTheDocument();
        expect(screen.getByTestId('git-branch-icon')).toBeInTheDocument();
      });
    });
  });

  describe('archived versions', () => {
    beforeEach(() => {
      mockVersions[2].versionMetadata.versionStatus = 'archived';
    });

    it('should show archived indicator', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('This version has been archived')).toBeInTheDocument();
        expect(screen.getByTestId('archive-icon')).toBeInTheDocument();
      });
    });
  });

  describe('version selection highlighting', () => {
    it('should highlight selected version', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const selectedVersion = screen.getByText('Classic Gin & Tonic').closest('div');
        expect(selectedVersion).toHaveClass('border-blue-500');
      });
    });

    it('should not highlight non-selected versions', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const nonSelectedVersion = screen.getByText('Classic Gin & Tonic (Low ABV Version)').closest('div');
        expect(nonSelectedVersion).not.toHaveClass('border-blue-500');
      });
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      recipeVersionService.getVersions.mockRejectedValue(new Error('Service error'));
      
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading versions:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Recipe Versions/ })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation in compact mode', async () => {
      mockProps.compact = true;
      render(<RecipeVersionSelector {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Should be focusable
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });
});
