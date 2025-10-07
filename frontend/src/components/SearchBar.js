/**
 * Search Bar component for document search functionality
 */
import React, { useState } from 'react';
import { searchAPI } from '../api';

const SearchBar = ({ onSearchResults, onSearchError }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [category, setCategory] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      return;
    }

    setSearching(true);
    try {
      const searchPayload = {
        query: query.trim(),
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

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'medical', label: 'Medical' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'tax', label: 'Tax' },
    { value: 'financial', label: 'Financial' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'utility', label: 'Utility' },
    { value: 'legal', label: 'Legal' },
    { value: 'employment', label: 'Employment' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'government', label: 'Government' },
    { value: 'business', label: 'Business' },
    { value: 'travel', label: 'Travel' },
    { value: 'education', label: 'Education' },
    { value: 'personal', label: 'Personal' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div style={styles.container}>
      <form onSubmit={handleSearch} style={styles.form}>
        <div style={styles.searchGroup}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documents... (e.g., 'medical bills from last month')"
              style={styles.searchInput}
              disabled={searching}
            />
            <button
              type="submit"
              style={styles.searchButton}
              disabled={searching || !query.trim()}
            >
              {searching ? '⏳' : '🔍'}
            </button>
          </div>
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.categorySelect}
            disabled={searching}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {(query || category) && (
          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearButton}
              disabled={searching}
            >
              Clear Search
            </button>
          </div>
        )}
      </form>

      <div style={styles.examples}>
        <p style={styles.examplesTitle}>Try searching for:</p>
        <div style={styles.exampleTags}>
          {[
            'medical receipts',
            'tax documents',
            'utility bills',
            'insurance papers',
            'warranty cards',
            'bank statements'
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              style={styles.exampleTag}
              disabled={searching}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  inputContainer: {
    display: 'flex',
    flex: '1',
    minWidth: '300px',
  },
  searchInput: {
    flex: '1',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    fontSize: '16px',
    outline: 'none',
    '&:focus': {
      borderColor: '#4f46e5',
    },
  },
  searchButton: {
    padding: '12px 16px',
    background: '#4f46e5',
    color: 'white',
    border: '1px solid #4f46e5',
    borderRadius: '0 6px 6px 0',
    cursor: 'pointer',
    fontSize: '16px',
    '&:disabled': {
      background: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  categorySelect: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    minWidth: '160px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  clearButton: {
    padding: '8px 16px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  examples: {
    marginTop: '16px',
  },
  examplesTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  exampleTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  exampleTag: {
    padding: '4px 8px',
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#4b5563',
    '&:hover': {
      background: '#f3f4f6',
    },
  },
};

export default SearchBar;