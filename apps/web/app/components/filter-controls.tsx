'use client';

import { useState, useCallback } from 'react';

export type SortOption = 'newest' | 'source' | 'relevance';

interface FilterControlsProps {
  onFilterChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  onRefreshIntervalChange: (interval: number) => void;
  currentQuery: string;
  currentSort: SortOption;
  currentInterval: number;
  loading: boolean;
  onRefresh: () => void;
}

export function FilterControls({
  onFilterChange,
  onSortChange,
  onRefreshIntervalChange,
  currentQuery,
  currentSort,
  currentInterval,
  loading,
  onRefresh
}: FilterControlsProps) {
  const [localQuery, setLocalQuery] = useState(currentQuery);

  // Debounced filter change
  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
    const timeoutId = setTimeout(() => {
      onFilterChange(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [onFilterChange]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search/Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter Articles
          </label>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search keywords..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort By
          </label>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Latest</option>
            <option value="source">Source</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>

        {/* Refresh Interval */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto Refresh (min)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={currentInterval}
            onChange={(e) => onRefreshIntervalChange(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Refresh Button */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Actions
          </label>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
