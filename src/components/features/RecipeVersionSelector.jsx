/**
 * Recipe Version Selector Component
 *
 * Displays all versions of a recipe family and allows selection
 */

import {
  ChevronDown,
  Star,
  Clock,
  GitBranch,
  Archive,
  Eye,
  Edit3,
  MoreVertical
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { getRecipeDisplayName, getSourceDisplayInfo } from '../../models/index';
import { recipeVersionService } from '../../services/recipeVersionService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const RecipeVersionSelector = ({
  recipeFamily,
  selectedVersionId,
  onVersionSelect,
  onVersionEdit,
  onVersionCompare,
  showActions = true,
  compact = false
}) => {
  const [versions, setVersions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const familyVersions = await recipeVersionService.getVersions(recipeFamily);
      setVersions(familyVersions);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  }, [recipeFamily]);

  useEffect(() => {
    if (recipeFamily) {
      loadVersions();
    }
  }, [recipeFamily, loadVersions]);

  const selectedVersion = versions.find(v => v.id === selectedVersionId) || versions[0];

  const getVersionStatusColor = (status) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'yellow';
      case 'archived': return 'gray';
      case 'deprecated': return 'red';
      default: return 'blue';
    }
  };

  const getVersionTypeIcon = (version) => {
    const sourceInfo = getSourceDisplayInfo(version);

    // For source versions, show source icon
    if (version.versionMetadata?.versionType === 'source') {
      return <span className="text-sm">{sourceInfo.icon}</span>;
    }

    // For other version types
    switch (version.versionMetadata?.versionType) {
      case 'original': return <Star className="w-3 h-3" />;
      case 'variation': return <GitBranch className="w-3 h-3" />;
      case 'improvement': return <Edit3 className="w-3 h-3" />;
      case 'seasonal': return <Clock className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          {selectedVersion ? (
            <>
              {getVersionTypeIcon(selectedVersion)}
              <span className="truncate max-w-32">
                {getRecipeDisplayName(selectedVersion)}
              </span>
              {selectedVersion.versionMetadata.isMainVersion && (
                <Badge variant="primary" size="xs">Main</Badge>
              )}
            </>
          ) : (
            'Select Version'
          )}
          <ChevronDown className="w-4 h-4" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-2 max-h-64 overflow-y-auto">
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => {
                    onVersionSelect(version.id);
                    setIsOpen(false);
                  }}
                  className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  {getVersionTypeIcon(version)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {getRecipeDisplayName(version)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {version.versionMetadata?.versionType === 'source'
                        ? getSourceDisplayInfo(version).displayName
                        : `v${version.versionMetadata.versionNumber}`
                      }
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {version.versionMetadata.isMainVersion && (
                      <Badge variant="primary" size="xs">Main</Badge>
                    )}
                    <Badge
                      variant={getVersionStatusColor(version.versionMetadata.versionStatus)}
                      size="xs"
                    >
                      {version.versionMetadata.versionStatus}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recipe Versions ({versions.length})
        </h3>
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVersionCompare && onVersionCompare()}
              disabled={versions.length < 2}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedVersionId === version.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              onClick={() => onVersionSelect(version.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onVersionSelect(version.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select version ${getRecipeDisplayName(version)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getVersionTypeIcon(version)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {getRecipeDisplayName(version)}
                      </h4>
                      {version.versionMetadata.isMainVersion && (
                        <Badge variant="primary" size="sm">Main</Badge>
                      )}
                      <Badge
                        variant={getVersionStatusColor(version.versionMetadata.versionStatus)}
                        size="sm"
                      >
                        {version.versionMetadata.versionStatus}
                      </Badge>
                    </div>

                    {/* Source-specific information */}
                    {version.versionMetadata?.versionType === 'source' && version.versionMetadata?.sourceAttribution ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-2">
                          <span>{getSourceDisplayInfo(version).icon}</span>
                          <span className="font-medium">{version.versionMetadata.sourceAttribution.sourceName}</span>
                          {version.versionMetadata.sourceAttribution.sourceAuthor && (
                            <span>by {version.versionMetadata.sourceAttribution.sourceAuthor}</span>
                          )}
                        </div>
                        {version.versionMetadata.sourceAttribution.sourcePage && (
                          <div className="text-xs text-gray-500 mt-1">
                            Page {version.versionMetadata.sourceAttribution.sourcePage}
                          </div>
                        )}
                        {version.versionMetadata.sourceAttribution.confidence && (
                          <div className="text-xs text-gray-500 mt-1">
                            Confidence: {Math.round(version.versionMetadata.sourceAttribution.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Version {version.versionMetadata.versionNumber} • {version.versionMetadata.versionType}
                        {version.versionMetadata.changeDescription && (
                          <span> • {version.versionMetadata.changeDescription}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Created {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                      {version.versionMetadata.createdBy && (
                        <span>by {version.versionMetadata.createdBy}</span>
                      )}
                      <span>
                        {version.ingredients?.length || 0} ingredients
                      </span>
                    </div>
                  </div>
                </div>

                {showActions && (
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVersionEdit && onVersionEdit(version.id);
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show version menu
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {version.versionMetadata.versionStatus === 'archived' && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Archive className="w-3 h-3" />
                  This version has been archived
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {versions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No versions found for this recipe family.</p>
        </div>
      )}
    </div>
  );
};

export default RecipeVersionSelector;
