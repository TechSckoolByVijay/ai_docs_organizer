/**
 * Main App component with routing and authentication
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import NotificationComponent from './components/NotificationComponent';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />

      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <AppContent />
              <NotificationComponent />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;