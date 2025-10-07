/**
 * Main Dashboard component
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { documentsAPI } from '../api';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import SearchBar from './SearchBar';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.list({ limit: 50 });
      setDocuments(response.data);
    } catch (error) {
      setError('Failed to load documents');
      console.error('Load documents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (document) => {
    setDocuments(prev => [document, ...prev]);
    setSuccess(`Successfully uploaded: ${document.original_filename}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUploadError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleDocumentDeleted = (documentId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    if (searchResults) {
      setSearchResults(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId)
      }));
    }
    setSuccess('Document deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleSearchError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleProcessPending = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.processPending();
      setSuccess(response.data.message);
      // Reload documents to see updated status
      await loadDocuments();
    } catch (error) {
      setError('Failed to process pending documents');
      console.error('Process pending error:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayDocuments = searchResults ? searchResults.documents : documents;
  const isSearchActive = searchResults !== null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>📋 Document Organizer</h1>
            <p style={styles.subtitle}>Welcome back, {user?.username}!</p>
          </div>
          <div style={styles.headerRight}>
            <button onClick={logout} style={styles.logoutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Alerts */}
        {error && (
          <div style={styles.alert.error}>
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div style={styles.alert.success}>
            ✅ {success}
          </div>
        )}

        {/* Upload Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Upload Documents</h2>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </section>

        {/* Search Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Search Documents</h2>
            <button
              onClick={handleProcessPending}
              style={styles.processButton}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Process Pending'}
            </button>
          </div>
          <SearchBar
            onSearchResults={handleSearchResults}
            onSearchError={handleSearchError}
          />
        </section>

        {/* Documents Section */}
        <section style={styles.section}>
          {isSearchActive && (
            <div style={styles.searchInfo}>
              <p style={styles.searchInfoText}>
                Search Results: {searchResults.total} documents found
                {searchResults.query && ` for "${searchResults.query}"`}
              </p>
              <button
                onClick={() => setSearchResults(null)}
                style={styles.clearSearchButton}
              >
                ← Back to All Documents
              </button>
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading documents...</p>
            </div>
          ) : (
            <DocumentList
              documents={displayDocuments}
              onDocumentDeleted={handleDocumentDeleted}
              onRefresh={loadDocuments}
            />
          )}
        </section>

        {/* Stats Section */}
        {!loading && !isSearchActive && (
          <section style={styles.section}>
            <div style={styles.stats}>
              <div style={styles.statCard}>
                <h3 style={styles.statNumber}>{documents.length}</h3>
                <p style={styles.statLabel}>Total Documents</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statNumber}>
                  {new Set(documents.map(doc => doc.category)).size}
                </h3>
                <p style={styles.statLabel}>Categories</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statNumber}>
                  {Math.round(documents.reduce((sum, doc) => sum + doc.file_size, 0) / 1024 / 1024 * 100) / 100}MB
                </h3>
                <p style={styles.statLabel}>Total Size</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 0',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 16px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
  },
  processButton: {
    padding: '8px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  alert: {
    error: {
      padding: '12px 16px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      color: '#dc2626',
      marginBottom: '16px',
    },
    success: {
      padding: '12px 16px',
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '6px',
      color: '#16a34a',
      marginBottom: '16px',
    },
  },
  searchInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  searchInfoText: {
    margin: 0,
    color: '#1e40af',
    fontWeight: '500',
  },
  clearSearchButton: {
    padding: '6px 12px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #d1d5db',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  statNumber: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
  },
};

export default Dashboard;