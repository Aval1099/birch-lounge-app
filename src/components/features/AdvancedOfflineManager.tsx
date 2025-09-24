import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
  Check,
  X,
  Wifi,
  HardDrive,
  Clock,
  AlertTriangle,
  Search,
  Star,
  TrendingUp,
  Package,
  Zap,
  Pause,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Layers,
  BarChart3
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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

interface AdvancedOfflineManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadSelected: (items: Array<{ id: string; type: string }>) => void;
}

/**
 * Advanced Offline Manager Component
 * Enhanced download manager with smart recommendations, presets, and advanced filtering
 */
export const AdvancedOfflineManager: React.FC<AdvancedOfflineManagerProps> = ({
  isOpen,
  onClose,
  onDownloadSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [downloadPreset, setDownloadPreset] = useState<string>('custom');
  const [activeTab, setActiveTab] = useState<'browse' | 'presets' | 'progress' | 'analytics'>('browse');
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

  // Mock data - enhanced with more metadata
  const [availableItems] = useState([
    {
      id: '1',
      type: 'recipe',
      name: 'Classic Martini',
      category: 'Gin',
      size: '2.3 KB',
      cached: true,
      popularity: 95,
      lastAccessed: '2024-01-15',
      dependencies: ['gin', 'vermouth'],
      tags: ['classic', 'gin', 'dry']
    },
    {
      id: '2',
      type: 'recipe',
      name: 'Old Fashioned',
      category: 'Whiskey',
      size: '1.8 KB',
      cached: false,
      popularity: 88,
      lastAccessed: '2024-01-10',
      dependencies: ['whiskey', 'bitters'],
      tags: ['classic', 'whiskey', 'sweet']
    },
    {
      id: '3',
      type: 'recipe',
      name: 'Negroni',
      category: 'Gin',
      size: '2.1 KB',
      cached: true,
      popularity: 82,
      lastAccessed: '2024-01-12',
      dependencies: ['gin', 'campari', 'vermouth'],
      tags: ['bitter', 'gin', 'aperitif']
    },
    {
      id: '4',
      type: 'ingredient',
      name: 'Gin',
      category: 'Spirits',
      size: '0.5 KB',
      cached: false,
      popularity: 90,
      lastAccessed: '2024-01-14',
      dependencies: [],
      tags: ['spirit', 'juniper', 'botanical']
    },
    {
      id: '5',
      type: 'ingredient',
      name: 'Vermouth',
      category: 'Fortified Wine',
      size: '0.7 KB',
      cached: true,
      popularity: 75,
      lastAccessed: '2024-01-11',
      dependencies: [],
      tags: ['fortified', 'wine', 'herbal']
    },
    {
      id: '6',
      type: 'technique',
      name: 'Stirring',
      category: 'Mixing',
      size: '1.2 KB',
      cached: false,
      popularity: 70,
      lastAccessed: '2024-01-08',
      dependencies: [],
      tags: ['technique', 'mixing', 'basic']
    }
  ]);

  // Smart filtering and sorting logic
  const filteredItems = useMemo(() => {
    let items = availableItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
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

      // Popularity filtering
      let matchesPopularity = true;
      if (filters.popularity !== 'all') {
        matchesPopularity = filters.popularity === 'popular' ? item.popularity >= 80 :
                           filters.popularity === 'trending' ? item.popularity >= 70 :
                           item.popularity < 70;
      }

      return matchesSearch && matchesType && matchesCategory && matchesCached && matchesSize && matchesPopularity;
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
          comparison = a.popularity - b.popularity;
          break;
        case 'date':
          comparison = new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime();
          break;
        case 'relevance':
          // Calculate relevance based on search term and popularity
          const aRelevance = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ? a.popularity : a.popularity * 0.5;
          const bRelevance = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ? b.popularity : b.popularity * 0.5;
          comparison = aRelevance - bRelevance;
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return items;
  }, [availableItems, searchTerm, filters]);

  // Smart recommendations based on selected items
  const recommendations = useMemo(() => {
    const recs: SmartRecommendation[] = [];
    const selectedItemsArray = Array.from(selectedItems);

    selectedItemsArray.forEach(itemId => {
      const item = availableItems.find(i => i.id === itemId);
      if (item?.type === 'recipe') {
        // Recommend ingredients for selected recipes
        item.dependencies.forEach(dep => {
          const ingredient = availableItems.find(i =>
            i.type === 'ingredient' &&
            i.name.toLowerCase().includes(dep.toLowerCase()) &&
            !selectedItems.has(i.id)
          );

          if (ingredient) {
            recs.push({
              id: ingredient.id,
              type: ingredient.type,
              name: ingredient.name,
              reason: `Required for ${item.name}`,
              confidence: 0.9,
              relatedTo: [itemId]
            });
          }
        });

        // Recommend similar recipes
        const similarRecipes = availableItems.filter(i =>
          i.type === 'recipe' &&
          i.id !== itemId &&
          !selectedItems.has(i.id) &&
          i.category === item.category
        );

        similarRecipes.slice(0, 2).forEach(recipe => {
          recs.push({
            id: recipe.id,
            type: recipe.type,
            name: recipe.name,
            reason: `Similar to ${item.name}`,
            confidence: 0.7,
            relatedTo: [itemId]
          });
        });
      }
    });

    return recs.slice(0, 8); // Limit to top 8 recommendations
  }, [selectedItems, availableItems]);

  // Download presets
  const downloadPresets = {
    'essential': {
      name: 'Essential Collection',
      description: 'Top 10 classic cocktails and basic ingredients',
      items: ['1', '2', '3', '4', '5'],
      size: '12.5 KB',
      icon: <Star className="w-5 h-5 text-yellow-500" />
    },
    'gin-focused': {
      name: 'Gin Cocktails',
      description: 'Complete gin cocktail collection with techniques',
      items: ['1', '3', '4', '6'],
      size: '8.2 KB',
      icon: <Package className="w-5 h-5 text-blue-500" />
    },
    'bartender-pro': {
      name: 'Professional Bartender',
      description: 'Complete collection with all techniques and ingredients',
      items: ['1', '2', '3', '4', '5', '6'],
      size: '18.7 KB',
      icon: <Zap className="w-5 h-5 text-purple-500" />
    },
    'trending': {
      name: 'Trending Now',
      description: 'Most popular recipes this month',
      items: ['1', '2', '3'],
      size: '6.2 KB',
      icon: <TrendingUp className="w-5 h-5 text-green-500" />
    }
  };

  const handleSelectItem = useCallback((itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  }, [selectedItems]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  }, [selectedItems.size, filteredItems]);

  const handlePresetSelect = useCallback((presetKey: string) => {
    const preset = downloadPresets[presetKey as keyof typeof downloadPresets];
    if (preset) {
      setSelectedItems(new Set(preset.items));
      setDownloadPreset(presetKey);
      setActiveTab('browse');
    }
  }, [downloadPresets]);

  const handleDownload = useCallback(async () => {
    if (selectedItems.size === 0) return;

    setDownloading(true);
    try {
      const itemsToDownload = Array.from(selectedItems).map(id => {
        const item = availableItems.find(i => i.id === id);
        return { id, type: item?.type || 'recipe' };
      });

      // Simulate download progress
      const progressMap = new Map<string, DownloadProgress>();
      itemsToDownload.forEach(item => {
        progressMap.set(item.id, {
          itemId: item.id,
          progress: 0,
          status: 'queued',
          speed: '0 KB/s',
          timeRemaining: 'Calculating...'
        });
      });
      setDownloadProgress(progressMap);

      // Simulate progressive download
      for (const item of itemsToDownload) {
        const progress = progressMap.get(item.id)!;
        progress.status = 'downloading';
        setDownloadProgress(new Map(progressMap));

        // Simulate download progress
        for (let i = 0; i <= 100; i += 10) {
          progress.progress = i;
          progress.speed = `${(Math.random() * 500 + 100).toFixed(0)} KB/s`;
          progress.timeRemaining = `${Math.max(0, (100 - i) / 10).toFixed(0)}s`;
          setDownloadProgress(new Map(progressMap));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        progress.status = 'complete';
        progress.speed = undefined;
        progress.timeRemaining = undefined;
        setDownloadProgress(new Map(progressMap));
      }

      await onDownloadSelected(itemsToDownload);
      setSelectedItems(new Set());
      setActiveTab('progress');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  }, [selectedItems, availableItems, onDownloadSelected]);

  const selectedSize = Array.from(selectedItems)
    .map(id => availableItems.find(item => item.id === id))
    .filter(Boolean)
    .reduce((total, item) => {
      const sizeNum = parseFloat(item!.size);
      return total + sizeNum;
    }, 0);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Offline Manager">
      <div className="space-y-6 max-w-4xl">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {[
            { id: 'browse', label: 'Browse', icon: Search },
            { id: 'presets', label: 'Presets', icon: Layers },
            { id: 'progress', label: 'Progress', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: Target }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1"
              icon={tab.icon}
            >
              {tab.label}
            </Button>
          ))}
        </div>

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

        {/* Tab Content */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {/* Search and Basic Filters */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                icon={showAdvancedFilters ? ChevronUp : ChevronDown}
              >
                Advanced
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Size
                    </label>
                    <select
                      value={filters.size}
                      onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="all">All Sizes</option>
                      <option value="small">Small (&lt;1KB)</option>
                      <option value="medium">Medium (1-5KB)</option>
                      <option value="large">Large (&gt;5KB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Popularity
                    </label>
                    <select
                      value={filters.popularity}
                      onChange={(e) => setFilters(prev => ({ ...prev, popularity: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="popular">Popular (80%+)</option>
                      <option value="trending">Trending (70%+)</option>
                      <option value="new">New (&lt;70%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cache Status
                    </label>
                    <select
                      value={filters.cached}
                      onChange={(e) => setFilters(prev => ({ ...prev, cached: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="cached">Cached</option>
                      <option value="not-cached">Not Cached</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sort By
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="name">Name</option>
                        <option value="size">Size</option>
                        <option value="popularity">Popularity</option>
                        <option value="date">Date</option>
                        <option value="relevance">Relevance</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                        }))}
                        className="px-2"
                      >
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Recommendations */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Smart Recommendations
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecommendations(false)}
                    icon={X}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recommendations.map(rec => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getItemIcon(rec.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {rec.name}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {rec.reason}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectItem(rec.id)}
                        disabled={selectedItems.has(rec.id)}
                        className="text-xs"
                      >
                        {selectedItems.has(rec.id) ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  ))}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {item.popularity}%
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category} • {item.size}
                        {item.tags.length > 0 && (
                          <span className="ml-2">
                            {item.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="inline-block bg-gray-200 dark:bg-gray-700 text-xs px-1 rounded mr-1">
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
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
                  No items found matching your criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Download Presets
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pre-configured collections for different use cases
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(downloadPresets).map(([key, preset]) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    downloadPreset === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handlePresetSelect(key)}
                >
                  <div className="flex items-start gap-3">
                    {preset.icon}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {preset.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {preset.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{preset.items.length} items</span>
                        <span>{preset.size}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Download Progress
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your download progress and manage active downloads
              </p>
            </div>

            {downloadProgress.size === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No active downloads
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(downloadProgress.entries()).map(([itemId, progress]) => {
                  const item = availableItems.find(i => i.id === itemId);
                  return (
                    <div key={itemId} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getItemIcon(item?.type || 'recipe')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {item?.name || 'Unknown Item'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            progress.status === 'complete' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            progress.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            progress.status === 'downloading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {progress.status}
                          </span>
                          {progress.status === 'downloading' && (
                            <Button variant="ghost" size="sm" icon={Pause}>
                              Pause
                            </Button>
                          )}
                        </div>
                      </div>

                      {progress.status === 'downloading' && (
                        <>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>{progress.progress}%</span>
                            <span>{progress.speed}</span>
                            <span>{progress.timeRemaining}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Download Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Insights about your offline content usage
              </p>
            </div>

            {/* Storage Stats */}
            {storage.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <HardDrive className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {storage.stats.totalItems}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Items Cached</div>
                </div>

                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Download className="w-8 h-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(storage.stats.totalSize / 1024).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">KB Used</div>
                </div>

                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Clock className="w-8 h-8 mx-auto text-yellow-600 dark:text-yellow-400 mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {storage.stats.recipes.pendingSync + storage.stats.ingredients.pendingSync}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending Sync</div>
                </div>

                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <TrendingUp className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(availableItems.reduce((sum, item) => sum + item.popularity, 0) / availableItems.length)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Popularity</div>
                </div>
              </div>
            )}

            {/* Usage Insights */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Usage Insights</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Most Popular Category:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Gin Cocktails</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">87%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Offline Usage:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">23% of total time</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Storage Efficiency:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">92%</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
