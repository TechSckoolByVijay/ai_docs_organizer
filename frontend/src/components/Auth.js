/**
 * Authentication components for login and signup
 */
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Eye, EyeOff, User, Mail, Lock, Loader, ArrowRight } from 'lucide-react';

const Auth = ({ mode = 'login', onToggle }) => {
  const { login, signup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Debug log to check if onToggle is passed correctly
  React.useEffect(() => {
    console.log('Auth component props:', { mode, onToggle: typeof onToggle });
  }, [mode, onToggle]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted:', { mode, formData }); // Debug log
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        console.log('Attempting login...'); // Debug log
        const result = await login({
          username: formData.username,
          password: formData.password,
        });
        if (!result.success) {
          setError(result.error);
        }
      } else {
        console.log('Attempting signup...'); // Debug log
        const result = await signup(formData);
        console.log('Signup result:', result); // Debug log
        if (result.success) {
          alert('Account created successfully! Please log in.');
          if (onToggle && typeof onToggle === 'function') {
            onToggle();
          }
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('Form submission error:', err); // Debug log
      setError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'login' 
                ? 'Sign in to access your documents' 
                : 'Join to start organizing your documents'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email Field (only for signup) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-slide-up">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center group"
              style={{ 
                pointerEvents: loading ? 'none' : 'auto',
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Please wait...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {mode === 'login' 
                ? "Don't have an account? " 
                : "Already have an account? "
              }
            </p>
            <div
              onClick={() => {
                console.log('Direct onClick triggered!');
                console.log('Current mode:', mode);
                console.log('onToggle function:', onToggle);
                if (onToggle) {
                  console.log('Calling onToggle...');
                  onToggle();
                } else {
                  console.error('onToggle is null/undefined!');
                }
              }}
              className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors cursor-pointer underline hover:no-underline inline-block"
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '16px',
                fontWeight: '600',
                color: '#7c3aed',
                textDecoration: 'underline'
              }}
            >
              {mode === 'login' ? 'Sign up here' : 'Sign in here'}
            </div>
          </div>

          {/* Demo Account Info */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium mb-2">
              Demo Account (for testing):
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500 text-center space-y-1">
              <div>Username: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">testuser2</code></div>
              <div>Password: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">testpassword123</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;