import React, { useState, useEffect } from 'react';
import './App.css';
import DatabaseConnector from './components/DatabaseConnector';
import QueryPanel from './components/QueryPanel_modern';
import ResultsView from './components/ResultsView';
import MetricsDashboard from './components/MetricsDashboard';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('query');

  // Auto-connect to the sample database on startup
  useEffect(() => {
    const autoConnect = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8001/api/connections');
        const data = await response.json();
        
        if (data.connections && data.connections.length > 0) {
          setConnectionInfo(data.connections[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Auto-connection failed:', error);
      } finally {
        setLoading(false);
      }
    };

    autoConnect();
  }, []);

  const handleConnection = (connInfo) => {
    setConnectionInfo(connInfo);
    setIsConnected(true);
  };

  const handleQueryResults = (results) => {
    setQueryResults(results);
    // Auto-switch to results tab when we get results
    if (results && results.success) {
      setActiveTab('results');
    }
  };

  const tabs = [
    { id: 'query', label: 'Query', icon: '💬', description: 'Ask questions in natural language' },
    { id: 'results', label: 'Results', icon: '📊', description: 'View query results and data', disabled: !queryResults },
    { id: 'analytics', label: 'Analytics', icon: '📈', description: 'Performance metrics and insights' },
    { id: 'database', label: 'Database', icon: '🗄️', description: 'Schema and connection info' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'query':
        return (
          <QueryPanel 
            onQueryResults={handleQueryResults}
            connectionInfo={connectionInfo}
          />
        );
      case 'results':
        return (
          <ResultsView 
            results={queryResults}
            connectionInfo={connectionInfo}
          />
        );
      case 'analytics':
        return <MetricsDashboard />;
      case 'database':
        return <DatabaseConnector onConnection={handleConnection} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-animation">
            <div className="loading-brain">🧠</div>
            <div className="loading-waves">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          </div>
          <h2 className="loading-title">Initializing NLP Query Engine</h2>
          <p className="loading-subtitle">Connecting to intelligent database system...</p>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-modern">
      {/* Modern Header with Glassmorphism */}
      <header className="app-header-modern">
        <div className="header-blur"></div>
        <div className="header-content-modern">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-icon">🧠</div>
              <div className="logo-text">
                <h1 className="brand-title">NLP Query Engine</h1>
                <span className="brand-version">v2.0 Enhanced</span>
              </div>
            </div>
            <div className="brand-tagline">
              Transform thoughts into data insights
            </div>
          </div>
          
          <div className="header-status">
            <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="indicator-pulse"></div>
              <div className="indicator-content">
                <span className="indicator-label">Database</span>
                <span className="indicator-value">
                  {isConnected ? connectionInfo?.name : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <nav className="app-navigation-modern">
        <div className="nav-content">
          <div className="nav-tabs-container">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                className={`nav-tab-modern ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                disabled={tab.disabled}
                title={tab.description}
              >
                <div className="tab-content">
                  <span className="tab-icon">{tab.icon}</span>
                  <div className="tab-text">
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-desc">{tab.description}</span>
                  </div>
                </div>
                <div className="tab-indicator"></div>
              </button>
            ))}
          </div>
          
          <div className="nav-actions-modern">
            <button className="nav-action-btn" title="Help & Documentation">
              <span className="action-icon">❓</span>
            </button>
            <button className="nav-action-btn" title="Settings">
              <span className="action-icon">⚙️</span>
            </button>
            <button className="nav-action-btn premium" title="Upgrade to Pro">
              <span className="action-icon">⭐</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="app-main-modern">
        <div className="main-content-wrapper">
          {!isConnected && activeTab !== 'database' ? (
            <div className="welcome-experience">
              <div className="welcome-hero">
                <div className="hero-animation">
                  <div className="floating-icon">🤖</div>
                  <div className="floating-icon delay-1">📊</div>
                  <div className="floating-icon delay-2">⚡</div>
                </div>
                
                <div className="hero-content">
                  <h1 className="hero-title">
                    Welcome to the Future of
                    <span className="gradient-text">Data Querying</span>
                  </h1>
                  <p className="hero-subtitle">
                    Experience the power of natural language processing combined with 
                    intelligent SQL generation. Ask questions, get insights instantly.
                  </p>
                  
                  <div className="feature-showcase">
                    <div className="feature-item">
                      <div className="feature-icon">🧠</div>
                      <h3>AI-Powered Intelligence</h3>
                      <p>Advanced NLP with machine learning</p>
                    </div>
                    <div className="feature-item">
                      <div className="feature-icon">⚡</div>
                      <h3>Lightning Fast</h3>
                      <p>Instant query generation and execution</p>
                    </div>
                    <div className="feature-item">
                      <div className="feature-icon">🎯</div>
                      <h3>Precision Accuracy</h3>
                      <p>Schema-aware intelligent mapping</p>
                    </div>
                  </div>
                  
                  <button 
                    className="cta-button"
                    onClick={() => setActiveTab('database')}
                  >
                    <span className="cta-icon">🚀</span>
                    Start Your Journey
                    <span className="cta-arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="content-panel">
              <div className="panel-wrapper">
                {renderTabContent()}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="app-footer-modern">
        <div className="footer-content-modern">
          <div className="footer-left">
            <p className="footer-copyright">
              © 2025 NLP Query Engine. Powered by Advanced AI Technology.
            </p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">API Reference</a>
            <a href="#" className="footer-link">Community</a>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;