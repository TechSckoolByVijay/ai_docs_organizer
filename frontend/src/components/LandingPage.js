/**
 * Landing Page component for non-authenticated users
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { 
  FileText, 
  Search, 
  Smartphone, 
  Shield, 
  Tag, 
  Cloud, 
  Upload, 
  Brain, 
  Zap, 
  Moon, 
  Sun,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const LandingPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Navigation handlers
  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
  };
  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Smart Organization',
      description: 'Automatically categorize your receipts, medical bills, tax documents, and more with intelligent AI categorization.',
      color: 'text-blue-500'
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Powerful Search',
      description: 'Find any document instantly with natural language search. Just type what you\'re looking for in plain English.',
      color: 'text-green-500'
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Mobile Friendly',
      description: 'Capture documents on the go with camera integration and access your files from any device.',
      color: 'text-purple-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Storage',
      description: 'Your documents are safely stored with enterprise-grade security and encrypted transmission.',
      color: 'text-red-500'
    },
    {
      icon: <Tag className="w-8 h-8" />,
      title: 'Auto-Categorization',
      description: 'Our AI automatically detects document types and organizes them into the right categories for easy retrieval.',
      color: 'text-orange-500'
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: 'Cloud Sync',
      description: 'Access your documents from anywhere with reliable cloud storage and synchronization.',
      color: 'text-cyan-500'
    }
  ];

  const howItWorksSteps = [
    {
      icon: <Upload className="w-12 h-12" />,
      title: 'Upload',
      description: 'Drag and drop your documents or take photos with your camera. We support PDFs, images, and common document formats.',
      color: 'bg-gradient-to-r from-primary-500 to-primary-600'
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: 'AI Categorization',
      description: 'Our AI automatically reads and categorizes your documents into the right folders based on content and context.',
      color: 'bg-gradient-to-r from-secondary-500 to-secondary-600'
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: 'Search & Find',
      description: 'Search using natural language like "tax documents from 2023" and find exactly what you need in seconds.',
      color: 'bg-gradient-to-r from-accent-500 to-accent-600'
    }
  ];

  const benefits = [
    'No setup fees or hidden costs',
    'Enterprise-grade security',
    '24/7 customer support',
    'Mobile app included',
    'Unlimited document storage',
    'Advanced AI categorization'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-400/15 to-yellow-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-200/10 via-transparent to-transparent rounded-full animate-pulse"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '2.5s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-4 py-6 lg:px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-3">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              DocOrganizer
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 shadow-lg hover:shadow-xl"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignIn}
              className="px-6 py-3 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-white/80 dark:hover:bg-indigo-900/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-indigo-200 dark:border-indigo-700 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Sign Up</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-16 lg:py-24 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Organize Your Documents
              <span className="block bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 bg-clip-text text-transparent">with AI Intelligence</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your document management experience. Upload, categorize, and find any document 
              in seconds using the power of artificial intelligence. Perfect for receipts, medical bills, 
              tax documents, insurance papers, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="text-lg px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative flex items-center"
              >
                <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                Create Free Account
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              
              <button
                onClick={handleSignIn}
                className="text-lg px-8 py-4 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transform hover:scale-105 transition-all duration-300"
              >
                Sign In to Existing Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-4 py-16 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to manage your documents efficiently and securely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group card-highlight p-8 hover-lift"
                style={{
                  animation: 'slideUp 0.6s ease-out',
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} bg-gray-50 dark:bg-gray-800/50 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-gradient-primary transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-4 py-16 lg:px-8 bg-gradient-to-r from-primary-50/50 to-purple-50/50 dark:from-gray-800/30 dark:to-purple-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get organized in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div
                key={step.title}
                className="text-center group"
                style={{
                  animation: 'bounceIn 0.8s ease-out',
                  animationDelay: `${index * 0.2}s`,
                  animationFillMode: 'both'
                }}
              >
                <div className={`inline-flex items-center justify-center w-24 h-24 ${step.color} rounded-3xl mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 text-white`}>
                  {step.icon}
                </div>
                
                <div className="relative">
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent"></div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gradient-primary mb-4">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 px-4 py-16 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-8">
                Why Choose DocOrganizer?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Join thousands of users who have simplified their document management with our AI-powered solution.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className="flex items-center space-x-4 group"
                    style={{
                      animation: 'slideRight 0.6s ease-out',
                      animationDelay: `${index * 0.1}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg text-gray-700 dark:text-gray-300 group-hover:text-gradient-primary transition-colors duration-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="glass-card p-8 shadow-2xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl mb-6 shadow-xl">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gradient-primary mb-4">
                    Ready to Get Organized?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Join thousands of users who have simplified their document management with our AI-powered solution.
                  </p>
                  
                  <button
                    onClick={handleGetStarted}
                    className="btn-primary w-full text-lg py-4 shadow-xl hover:shadow-2xl group"
                  >
                    <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                    Create Free Account
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 lg:px-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">
                DocOrganizer
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
              <a href="#" className="nav-link">Privacy Policy</a>
              <a href="#" className="nav-link">Terms of Service</a>
              <a href="#" className="nav-link">Contact Support</a>
              <a href="#" className="nav-link">Documentation</a>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mt-4 md:mt-0">
              © 2025 DocOrganizer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;