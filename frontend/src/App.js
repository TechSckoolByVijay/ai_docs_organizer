/**
 * Main App component with routing and authentication
 */
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
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

  const handleToggleAuth = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  if (showAuth) {
    return (
      <div>
        <div style={styles.backButton}>
          <button onClick={handleBackToLanding} style={styles.backBtn}>
            ← Back to Home
          </button>
        </div>
        <Auth mode={authMode} onToggle={handleToggleAuth} />
      </div>
    );
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
};

const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    color: '#6b7280',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #d1d5db',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
  },
  backBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
};

export default App;