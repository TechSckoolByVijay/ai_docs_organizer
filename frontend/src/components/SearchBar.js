/**
 * Search Bar component for document search functionality
 */
import React, { useState } from 'react';
import { searchAPI } from '../api';
import { 
  Search, 
  Filter, 
  X, 
  Loader, 
  Sparkles,
  Hash
} from 'lucide-react';

const SearchBar = ({ onSearchResults, onSearchError }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e, searchQuery = null) => {
    if (e) {
      e.preventDefault();
    }
    
    const queryToSearch = searchQuery || query;
    
    if (!queryToSearch.trim()) {
      return;
    }

    setSearching(true);
    try {
      const searchPayload = {
        query: queryToSearch.trim(),
        limit: 20,
        offset: 0,
      };

      if (category) {
        searchPayload.category = category;
      }

      const response = await searchAPI.search(searchPayload);
      
      if (onSearchResults) {
        onSearchResults(response.data);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Search failed';
      if (onSearchError) {
        onSearchError(message);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setCategory('');
    if (onSearchResults) {
      onSearchResults(null); // Clear search results
    }
  };

  const handleSuggestionClick = async (suggestionText) => {
    try {
      setQuery(suggestionText);
      // Trigger search immediately with the suggestion text
      await handleSearch(null, suggestionText);
    } catch (error) {
      console.error('Error handling suggestion click:', error);
      if (onSearchError) {
        onSearchError('Failed to search for suggested term');
      }
    }
  };

  const categories = [
    { value: '', label: 'All Categories', icon: '📁' },
    { value: 'invoice', label: 'Invoice', icon: '🧾' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'insurance', label: 'Insurance', icon: '🛡️' },
    { value: 'tax', label: 'Tax', icon: '💰' },
    { value: 'financial', label: 'Financial', icon: '💳' },
    { value: 'warranty', label: 'Warranty', icon: '🔧' },
    { value: 'utility', label: 'Utility', icon: '⚡' },
    { value: 'legal', label: 'Legal', icon: '⚖️' },
    { value: 'employment', label: 'Employment', icon: '💼' },
    { value: 'automotive', label: 'Automotive', icon: '🚗' },
    { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
    { value: 'subscription', label: 'Subscription', icon: '📱' },
    { value: 'government', label: 'Government', icon: '🏛️' },
    { value: 'business', label: 'Business', icon: '🏢' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'other', label: 'Other', icon: '📄' },
  ];

  const exampleQueries = [
    { text: 'medical receipts', icon: '🏥' },
    { text: 'tax documents', icon: '💰' },
    { text: 'utility bills', icon: '⚡' },
    { text: 'insurance papers', icon: '🛡️' },
    { text: 'warranty cards', icon: '🔧' },
    { text: 'bank statements', icon: '💳' }
  ];

  return (
    <div className="space-y-6">
      {/* Main Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your documents... (e.g., 'medical bills from last month')"
            className="input-field pl-10 pr-24"
            disabled={searching}
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-md transition-colors ${
                showFilters || category
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="p-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-dark-600 text-white rounded-md transition-colors"
            >
              {searching ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                disabled={searching}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filters & Clear Button */}
        {(query || category) && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Active search
                {category && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                    {categories.find(c => c.value === category)?.label}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={searching}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </form>

      {/* Search Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-3">
          <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Try searching for:
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(example.text);
              }}
              disabled={false}
              style={{ pointerEvents: 'auto', zIndex: 10 }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 rounded-full text-sm transition-colors cursor-pointer hover:scale-105 active:scale-95 select-none"
            >
              <span>{example.icon}</span>
              <span>{example.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
        <div className="flex items-start">
          <Hash className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Search Tips
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Use natural language: "medical bills from December"</li>
              <li>• Search by document type: "receipts", "invoices", "statements"</li>
              <li>• Include amounts: "expenses over $100"</li>
              <li>• Search by date: "documents from last month"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;