/**
 * Main App component with routing and authentication
 */
import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleToggleAuth = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={handleBackToLanding} 
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
        <Auth mode={authMode} onToggle={handleToggleAuth} />
      </div>
    );
  }

  return <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;