import React, { useState, useMemo } from 'react';
import {
  Download,
  Check,
  Wifi,
  HardDrive,
  Clock,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import type { DownloadManagerProps } from '../../types/offline';

/**
 * Offline Download Manager Component
 * Allows users to select and download content for offline use
 */
// Advanced download progress tracking
interface DownloadProgress {
  itemId: string;
  progress: number; // 0-100
  status: 'queued' | 'downloading' | 'complete' | 'error' | 'paused';
  speed?: string;
  timeRemaining?: string;
  error?: string;
}

// Smart recommendation types
interface SmartRecommendation {
  id: string;
  type: string;
  name: string;
  reason: string;
  confidence: number; // 0-1
  relatedTo: string[];
}

// Advanced filter options
interface AdvancedFilters {
  type: 'all' | 'recipes' | 'ingredients' | 'techniques';
  category: string;
  size: 'all' | 'small' | 'medium' | 'large';
  popularity: 'all' | 'popular' | 'trending' | 'new';
  cached: 'all' | 'cached' | 'not-cached';
  sortBy: 'name' | 'size' | 'popularity' | 'date' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

export const OfflineDownloadManager: React.FC<DownloadManagerProps> = ({
  isOpen,
  onClose,
  onDownloadSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  // Future feature placeholders - keeping for planned functionality
  const [_downloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [_showAdvancedFilters] = useState(false);
  const [_showRecommendations] = useState(true);
  const [_downloadPreset] = useState<string>('custom');
  const [filters, setFilters] = useState<AdvancedFilters>({
    type: 'all',
    category: 'all',
    size: 'all',
    popularity: 'all',
    cached: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const { storage, isOnline } = useOffline();

  // Mock data - in real implementation, this would come from your app state
  const [availableItems] = useState([
    { id: '1', type: 'recipe', name: 'Classic Martini', category: 'Gin', size: '2.3 KB', cached: true },
    { id: '2', type: 'recipe', name: 'Old Fashioned', category: 'Whiskey', size: '1.8 KB', cached: false },
    { id: '3', type: 'recipe', name: 'Negroni', category: 'Gin', size: '2.1 KB', cached: true },
    { id: '4', type: 'ingredient', name: 'Gin', category: 'Spirits', size: '0.5 KB', cached: false },
    { id: '5', type: 'ingredient', name: 'Vermouth', category: 'Fortified Wine', size: '0.7 KB', cached: true },
    { id: '6', type: 'technique', name: 'Stirring', category: 'Mixing', size: '1.2 KB', cached: false }
  ]);

  // Smart filtering and sorting logic
  const filteredItems = useMemo(() => {
    let items = availableItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === 'all' || item.type === filters.type;
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      const matchesCached = filters.cached === 'all' ||
        (filters.cached === 'cached' && item.cached) ||
        (filters.cached === 'not-cached' && !item.cached);

      // Size filtering
      let matchesSize = true;
      if (filters.size !== 'all') {
        const sizeNum = parseFloat(item.size);
        matchesSize = filters.size === 'small' ? sizeNum < 1 :
                     filters.size === 'medium' ? sizeNum >= 1 && sizeNum < 5 :
                     sizeNum >= 5;
      }

      return matchesSearch && matchesType && matchesCategory && matchesCached && matchesSize;
    });

    // Sorting logic
    items.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = parseFloat(a.size) - parseFloat(b.size);
          break;
        case 'popularity':
          // Mock popularity - in real app would come from usage data
          comparison = (a.name.length % 10) - (b.name.length % 10);
          break;
        case 'date':
          // Mock date - in real app would use actual dates
          comparison = a.id.localeCompare(b.id);
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return items;
  }, [availableItems, searchTerm, filters]);

  // Smart recommendations based on selected items
  const _recommendations = useMemo(() => {
    const recs: SmartRecommendation[] = [];
    const selectedItemsArray = Array.from(selectedItems);

    selectedItemsArray.forEach(itemId => {
      const item = availableItems.find(i => i.id === itemId);
      if (item?.type === 'recipe') {
        // Recommend ingredients for selected recipes
        const relatedIngredients = availableItems.filter(i =>
          i.type === 'ingredient' &&
          !selectedItems.has(i.id) &&
          item.name.toLowerCase().includes(i.name.toLowerCase().split(' ')[0])
        );

        relatedIngredients.forEach(ingredient => {
          recs.push({
            id: ingredient.id,
            type: ingredient.type,
            name: ingredient.name,
            reason: `Required for ${item.name}`,
            confidence: 0.9,
            relatedTo: [itemId]
          });
        });
      }
    });

    return recs.slice(0, 5); // Limit to top 5 recommendations
  }, [selectedItems, availableItems]);

  // Download presets
  const _downloadPresets = {
    'essential': {
      name: 'Essential Collection',
      description: 'Top 10 classic cocktails and basic ingredients',
      items: ['1', '2', '3', '4', '5'],
      size: '12.5 KB'
    },
    'gin-focused': {
      name: 'Gin Cocktails',
      description: 'Complete gin cocktail collection',
      items: ['1', '3', '4'],
      size: '8.2 KB'
    },
    'bartender-pro': {
      name: 'Professional Bartender',
      description: 'Complete collection with techniques',
      items: ['1', '2', '3', '4', '5', '6'],
      size: '18.7 KB'
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleDownload = async () => {
    if (selectedItems.size === 0) return;

    setDownloading(true);
    try {
      const itemsToDownload = Array.from(selectedItems).map(id => {
        const item = availableItems.find(i => i.id === id);
        return { id, type: item?.type || 'recipe' };
      });

      await onDownloadSelected(itemsToDownload);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'recipe':
        return '🍸';
      case 'ingredient':
        return '🥃';
      case 'technique':
        return '🔄';
      default:
        return '📄';
    }
  };

  const selectedSize = Array.from(selectedItems)
    .map(id => availableItems.find(item => item.id === id))
    .filter(Boolean)
    .reduce((total, item) => {
      const sizeNum = parseFloat(item!.size);
      return total + sizeNum;
    }, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Download for Offline Use" size="lg">
      <div className="space-y-6">
        {/* Connection Warning */}
        {!isOnline && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                You're currently offline
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Downloads will start when you're back online.
            </p>
          </div>
        )}

        {/* Storage Stats */}
        {storage.stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <HardDrive className="w-6 h-6 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {storage.stats.totalItems}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Items Cached</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Download className="w-6 h-6 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {(storage.stats.totalSize / 1024).toFixed(1)} KB
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Storage Used</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-6 h-6 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {storage.stats.recipes.pendingSync + storage.stats.ingredients.pendingSync}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Pending Sync</div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-1">
            {['all', 'recipes', 'ingredients', 'techniques'].map((filterType) => (
              <Button
                key={filterType}
                variant={filters.type === filterType ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, type: filterType as any }))}
                className="capitalize"
              >
                {filterType}
              </Button>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        {_showRecommendations && _recommendations.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              Recommended for you
            </h4>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              {_recommendations.length} smart recommendations based on your selection
            </div>
          </div>
        )}

        {/* Download Presets Section */}
        {_downloadPreset !== 'custom' && _downloadPresets[_downloadPreset as keyof typeof _downloadPresets] && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
              {_downloadPresets[_downloadPreset as keyof typeof _downloadPresets].name}
            </h4>
            <div className="text-sm text-green-700 dark:text-green-300">
              {_downloadPresets[_downloadPreset as keyof typeof _downloadPresets].description}
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {/* Select All */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Select All ({filteredItems.length} items)
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedItems.size} selected
            </span>
          </div>

          {/* Items */}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedItems.has(item.id)
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-lg">{getItemIcon(item.type)}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.category} • {item.size}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.cached ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Cached</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Download className="w-4 h-4" />
                    <span className="text-xs">Available</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No items found matching your search.
            </div>
          )}
        </div>

        {/* Download Summary */}
        {selectedItems.size > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedItems.size} items selected
                </span>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Total size: {selectedSize.toFixed(1)} KB
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isOnline && <Wifi className="w-4 h-4 text-yellow-500" />}
                <Button
                  onClick={handleDownload}
                  variant="primary"
                  disabled={downloading || (!isOnline && selectedItems.size > 0)}
                  icon={downloading ? undefined : Download}
                >
                  {downloading ? 'Downloading...' : 'Download Selected'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
