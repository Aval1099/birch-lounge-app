/**
 * Version History Panel Component
 *
 * Displays chronological history of recipe version changes
 */

import {
  Clock,
  User,
  GitBranch,
  Edit3,
  Archive,
  Star,
  Plus,
  Merge,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { recipeVersionService } from '../../services/recipeVersionService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const VersionHistoryPanel = ({
  recipeId,
  onVersionSelect,
  onCompareVersions,
  compact = false
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState(new Set());

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const versionHistory = await recipeVersionService.getVersionHistory(recipeId);
      setHistory(versionHistory);
    } catch (error) {
      console.error('Error loading version history:', error);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (recipeId) {
      loadHistory();
    }
  }, [recipeId, loadHistory]);

  const toggleExpanded = (entryId) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return <Plus className="w-4 h-4" />;
      case 'modified': return <Edit3 className="w-4 h-4" />;
      case 'published': return <Star className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      case 'branched': return <GitBranch className="w-4 h-4" />;
      case 'merged': return <Merge className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'green';
      case 'modified': return 'blue';
      case 'published': return 'purple';
      case 'archived': return 'gray';
      case 'branched': return 'yellow';
      case 'merged': return 'indigo';
      default: return 'gray';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Recent Changes
        </h4>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className={`text-${getActionColor(entry.action)}-500`}>
                  {getActionIcon(entry.action)}
                </div>
                <span className="capitalize">{entry.action}</span>
                <span>•</span>
                <span>{formatTimestamp(entry.timestamp)}</span>
                {entry.userId && (
                  <>
                    <span>•</span>
                    <span>{entry.userId}</span>
                  </>
                )}
              </div>
            ))}
            {history.length > 5 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{history.length - 5} more changes
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Version History
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          disabled={loading}
        >
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Timeline line */}
              {index < history.length - 1 && (
                <div className="absolute left-4 top-8 w-px h-full bg-gray-200 dark:bg-gray-700"></div>
              )}

              <div className="flex items-start gap-3">
                {/* Action icon */}
                <div className={`w-8 h-8 rounded-full bg-${getActionColor(entry.action)}-100 dark:bg-${getActionColor(entry.action)}-900/30 flex items-center justify-center text-${getActionColor(entry.action)}-600 dark:text-${getActionColor(entry.action)}-400 relative z-10`}>
                  {getActionIcon(entry.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={getActionColor(entry.action)}
                      size="sm"
                      className="capitalize"
                    >
                      {entry.action}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    {entry.userId && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        {entry.userId}
                      </div>
                    )}
                  </div>

                  {/* Changes summary */}
                  {entry.changes && entry.changes.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => toggleExpanded(entry.id)}
                        className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        {expandedEntries.has(entry.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        {entry.changes.length} change{entry.changes.length !== 1 ? 's' : ''}
                      </button>

                      {expandedEntries.has(entry.id) && (
                        <div className="mt-2 pl-5 space-y-1">
                          {entry.changes.map((change, changeIndex) => (
                            <div key={changeIndex} className="text-sm text-gray-600 dark:text-gray-400">
                              • {change}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous version link */}
                  {entry.previousVersionId && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>From version:</span>
                      <button
                        onClick={() => onVersionSelect && onVersionSelect(entry.previousVersionId)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {entry.previousVersionId.split('_').pop()}
                      </button>
                      {onCompareVersions && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onCompareVersions(entry.previousVersionId, entry.versionId)}
                        >
                          Compare
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="capitalize">{key.replace('_', ' ')}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No version history available.</p>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryPanel;
