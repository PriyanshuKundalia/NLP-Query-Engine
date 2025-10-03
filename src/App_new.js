import React, { useState, useEffect } from 'react';
import './App.css';
import DatabaseConnector from './components/DatabaseConnector';
import QueryPanel from './components/QueryPanel';
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
        // Check if sample database is available
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
  };

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
      case 'metrics':
        return <MetricsDashboard />;
      case 'schema':
        return <DatabaseConnector onConnection={handleConnection} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Initializing NLP Query Engine</h2>
          <p>Connecting to sample database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="icon">🧠</span>
              NLP Query Engine
            </h1>
            <span className="version-badge">v2.0 Enhanced</span>
          </div>
          
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {isConnected ? `Connected to ${connectionInfo?.name}` : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="app-navigation">
        <div className="nav-container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'query' ? 'active' : ''}`}
              onClick={() => setActiveTab('query')}
            >
              <span className="tab-icon">💬</span>
              Query
            </button>
            <button 
              className={`nav-tab ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
              disabled={!queryResults}
            >
              <span className="tab-icon">📊</span>
              Results
            </button>
            <button 
              className={`nav-tab ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              <span className="tab-icon">📈</span>
              Analytics
            </button>
            <button 
              className={`nav-tab ${activeTab === 'schema' ? 'active' : ''}`}
              onClick={() => setActiveTab('schema')}
            >
              <span className="tab-icon">🗄️</span>
              Database
            </button>
          </div>
          
          <div className="nav-actions">
            <button className="action-btn help-btn" title="Help & Documentation">
              <span>❓</span>
            </button>
            <button className="action-btn settings-btn" title="Settings">
              <span>⚙️</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        <div className="main-container">
          {!isConnected && activeTab !== 'schema' ? (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h2>Welcome to NLP Query Engine</h2>
                <p>Transform natural language into SQL queries with AI-powered intelligence.</p>
                <div className="welcome-features">
                  <div className="feature-card">
                    <span className="feature-icon">🤖</span>
                    <h3>AI-Powered</h3>
                    <p>Advanced natural language processing</p>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">⚡</span>
                    <h3>Fast Results</h3>
                    <p>Instant query generation and execution</p>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🎯</span>
                    <h3>High Accuracy</h3>
                    <p>Schema-aware intelligent mapping</p>
                  </div>
                </div>
                <button 
                  className="primary-btn large"
                  onClick={() => setActiveTab('schema')}
                >
                  Get Started
                </button>
              </div>
            </div>
          ) : (
            <div className="content-area">
              {renderTabContent()}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2025 NLP Query Engine. Enhanced with Two-Stage SQL Pipeline.</p>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">API Reference</a>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;