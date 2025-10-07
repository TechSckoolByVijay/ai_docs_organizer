/**
 * Landing Page component for non-authenticated users
 */
import React from 'react';

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: '📄',
      title: 'Smart Organization',
      description: 'Automatically categorize your receipts, medical bills, tax documents, and more with intelligent AI categorization.'
    },
    {
      icon: '🔍',
      title: 'Powerful Search',
      description: 'Find any document instantly with natural language search. Just type what you\'re looking for in plain English.'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Capture documents on the go with camera integration and access your files from any device.'
    },
    {
      icon: '🔒',
      title: 'Secure Storage',
      description: 'Your documents are safely stored with enterprise-grade security and encrypted transmission.'
    },
    {
      icon: '🏷️',
      title: 'Auto-Categorization',
      description: 'Our AI automatically detects document types and organizes them into the right categories for easy retrieval.'
    },
    {
      icon: '☁️',
      title: 'Cloud Sync',
      description: 'Access your documents from anywhere with reliable cloud storage and synchronization.'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Organize Your Important Documents with <span style={styles.highlight}>AI-Powered Intelligence</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Never lose track of receipts, medical bills, tax documents, insurance papers, or warranty cards again. 
            Our smart document organizer uses artificial intelligence to automatically categorize and make your files searchable.
          </p>
          <div style={styles.heroActions}>
            <button onClick={onGetStarted} style={styles.primaryButton}>
              Get Started Free
            </button>
            <button style={styles.secondaryButton}>
              Learn More
            </button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <div style={styles.mockupCard}>
            <div style={styles.mockupHeader}>
              <div style={styles.mockupDots}>
                <span style={styles.dot}></span>
                <span style={styles.dot}></span>
                <span style={styles.dot}></span>
              </div>
            </div>
            <div style={styles.mockupContent}>
              <div style={styles.mockupSearch}>🔍 Search: "medical bills from last month"</div>
              <div style={styles.mockupResults}>
                <div style={styles.mockupResult}>
                  <span style={styles.mockupIcon}>🏥</span>
                  <span>Dr. Smith Invoice - $150.00</span>
                </div>
                <div style={styles.mockupResult}>
                  <span style={styles.mockupIcon}>💊</span>
                  <span>Pharmacy Receipt - $45.99</span>
                </div>
                <div style={styles.mockupResult}>
                  <span style={styles.mockupIcon}>🧾</span>
                  <span>Lab Test Results - $89.50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Why Choose Document Organizer?</h2>
          <p style={styles.sectionSubtitle}>
            Stop wasting time searching through folders and boxes. Our intelligent system makes document management effortless.
          </p>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.howItWorks}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.stepsContainer}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Upload</h3>
              <p style={styles.stepDescription}>
                Drag and drop your documents or take photos with your camera. 
                We support PDFs, images, and common document formats.
              </p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>AI Categorization</h3>
              <p style={styles.stepDescription}>
                Our AI automatically reads and categorizes your documents into 
                the right folders based on content and context.
              </p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>Search & Find</h3>
              <p style={styles.stepDescription}>
                Search using natural language like "tax documents from 2023" 
                and find exactly what you need in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Get Organized?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of users who have simplified their document management with our AI-powered solution.
          </p>
          <button onClick={onGetStarted} style={styles.ctaButton}>
            Start Organizing Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerText}>
            © 2024 Document Organizer. Made with ❤️ for better organization.
          </p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'white',
  },
  hero: {
    padding: '80px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    minHeight: '90vh',
  },
  heroContent: {
    flex: 1,
    maxWidth: '600px',
    marginRight: '40px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    marginBottom: '24px',
  },
  highlight: {
    background: 'linear-gradient(120deg, #a8edea 0%, #fed6e3 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '20px',
    lineHeight: '1.6',
    marginBottom: '32px',
    opacity: 0.9,
  },
  heroActions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '16px 32px',
    backgroundColor: 'white',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    padding: '16px 32px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  heroImage: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '400px',
  },
  mockupHeader: {
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },
  mockupDots: {
    display: 'flex',
    gap: '8px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#d1d5db',
  },
  mockupContent: {
    padding: '24px',
  },
  mockupSearch: {
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '16px',
    color: '#374151',
    fontFamily: 'monospace',
  },
  mockupResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mockupResult: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    color: '#374151',
  },
  mockupIcon: {
    fontSize: '20px',
  },
  features: {
    padding: '80px 24px',
    backgroundColor: '#f9fafb',
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px',
  },
  sectionSubtitle: {
    fontSize: '20px',
    color: '#6b7280',
    marginBottom: '48px',
    maxWidth: '600px',
    margin: '0 auto 48px auto',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  featureCard: {
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  featureDescription: {
    color: '#6b7280',
    lineHeight: '1.6',
  },
  howItWorks: {
    padding: '80px 24px',
    backgroundColor: 'white',
  },
  stepsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '32px',
    flexWrap: 'wrap',
  },
  step: {
    textAlign: 'center',
    maxWidth: '250px',
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 auto 16px auto',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  stepDescription: {
    color: '#6b7280',
    lineHeight: '1.6',
  },
  stepArrow: {
    fontSize: '24px',
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  cta: {
    padding: '80px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textAlign: 'center',
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  ctaSubtitle: {
    fontSize: '20px',
    marginBottom: '32px',
    opacity: 0.9,
  },
  ctaButton: {
    padding: '20px 40px',
    backgroundColor: 'white',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  footer: {
    padding: '40px 24px',
    backgroundColor: '#1f2937',
    color: 'white',
    textAlign: 'center',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerText: {
    margin: 0,
    opacity: 0.8,
  },
};

export default LandingPage;