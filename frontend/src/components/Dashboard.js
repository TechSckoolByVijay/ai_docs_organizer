/**
 * Main Dashboard component
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { documentsAPI } from '../api';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import SearchBar from './SearchBar';
import { 
  FileText, 
  LogOut, 
  Moon, 
  Sun, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  BarChart3,
  Folder,
  HardDrive,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
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

  const stats = {
    total: documents.length,
    categories: new Set(documents.map(doc => doc.category)).size,
    totalSize: Math.round(documents.reduce((sum, doc) => sum + doc.file_size, 0) / 1024 / 1024 * 100) / 100,
    recent: documents.filter(doc => {
      const docDate = new Date(doc.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return docDate > weekAgo;
    }).length
  };

  const displayDocuments = searchResults ? searchResults.documents : documents;
  const isSearchActive = searchResults !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      {/* Header */}
      <header className="glass-card border-b border-white/20 dark:border-gray-700/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                  Document Organizer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, {user?.username}! ✨
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 shadow-lg hover:shadow-xl"
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={loadDocuments}
                className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 shadow-lg hover:shadow-xl disabled:opacity-50"
                title="Refresh documents"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-slide-up">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-slide-up">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card-primary animate-fade-in hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-2">Total Documents</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="stat-card-secondary animate-fade-in hover-lift" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-2">Categories</p>
                  <p className="text-3xl font-bold text-white">{stats.categories}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Folder className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="stat-card-accent animate-fade-in hover-lift" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-2">Storage Used</p>
                  <p className="text-3xl font-bold text-white">{stats.totalSize}MB</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <HardDrive className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="stat-card-warning animate-fade-in hover-lift" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-2">This Week</p>
                  <p className="text-3xl font-bold text-white">{stats.recent}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Activity className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Search */}
          <div className="lg:col-span-1 space-y-8">
            {/* Upload Section */}
            <section className="card p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upload Documents
                </h2>
              </div>
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </section>

            {/* Search Section */}
            <section className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Search Documents
                </h2>
                <button
                  onClick={handleProcessPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
                  disabled={loading}
                  title="Process pending documents for better search results"
                >
                  <Activity className="w-4 h-4" />
                  <span>{loading ? 'Processing...' : 'Process Pending'}</span>
                </button>
              </div>
              <SearchBar
                onSearchResults={handleSearchResults}
                onSearchError={handleSearchError}
              />
            </section>
          </div>

          {/* Right Column - Documents */}
          <div className="lg:col-span-2">
            <section className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              {isSearchActive && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                      <p className="text-blue-800 dark:text-blue-200 font-medium">
                        Search Results: {searchResults.total} documents found
                        {searchResults.query && ` for "${searchResults.query}"`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSearchResults(null);
                      }}
                      style={{ pointerEvents: 'auto', zIndex: 10 }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors cursor-pointer"
                    >
                      ← All Documents
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full spin mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
                </div>
              ) : (
                <DocumentList
                  documents={displayDocuments}
                  onDocumentDeleted={handleDocumentDeleted}
                  onRefresh={loadDocuments}
                />
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;