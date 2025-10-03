import React, { useState, useEffect } from 'react';
import './App.css';
import DatabaseConnector from './components/DatabaseConnector';
import QueryPanel from './components/QueryPanel';
import ResultsView from './components/ResultsView';
import MetricsDashboard from './components/MetricsDashboard';
import DocumentUploader from './components/DocumentUploader';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh all components

  // Auto-connect to check current database status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/connections');
        const data = await response.json();
        
        console.log('API connections response:', data);
        
        if (data.connections && data.connections.length > 0) {
          const connInfo = data.connections[0];
          console.log('Setting connection info:', connInfo);
          const safeConnInfo = {
            name: String(connInfo.name || 'No Data Loaded'),
            type: String(connInfo.type || 'Database'),
            status: String(connInfo.status || 'waiting for upload'),
            tables: connInfo.tables || [],
            last_upload: connInfo.last_upload || null
          };
          setConnectionInfo(safeConnInfo);
          setIsConnected(connInfo.status === 'connected');
          
          // Switch to query tab if data is already loaded
          if (connInfo.status === 'connected') {
            setActiveTab('query');
          }
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [refreshKey]); // Add refreshKey dependency

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setUploadSuccess(true);
    setUploadMessage(`Successfully uploaded ${result.table_name} with ${result.rows_processed} rows`);
    
    // Update connection info with new CSV data
    setConnectionInfo({
      name: `Dynamic Database (${result.table_name})`,
      type: 'sqlite',
      status: 'connected',
      tables: [result.table_name],
      columns: result.columns,
      schema: result.schema
    });
    setIsConnected(true);
    
    // Force refresh all components to show new data
    setRefreshKey(prev => prev + 1);
    
    // Clear any previous query results since we have new data
    setQueryResults(null);
    
    // Switch to query tab after successful upload
    setTimeout(() => {
      setActiveTab('query');
    }, 1500);
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
    setUploadSuccess(false);
    setUploadMessage(`Upload failed: ${error}`);
  };

  const handleConnection = (connInfo) => {
    console.log('Handling connection:', connInfo);
    // Ensure safe object structure
    const safeConnInfo = {
      name: String(connInfo?.name || 'Unknown Database'),
      type: String(connInfo?.type || 'Database'),
      status: String(connInfo?.status || 'connected'),
      tables: connInfo?.tables || [],
      last_upload: connInfo?.last_upload || null
    };
    setConnectionInfo(safeConnInfo);
    setIsConnected(true);
  };

  const handleQueryResults = (results) => {
    console.log('Received query results:', results);
    setQueryResults(results);
    // Auto-switch to results tab when we get results
    if (results && results.success) {
      console.log('Query successful, switching to results tab');
      setActiveTab('results');
    } else {
      console.log('Query failed or no success flag:', results);
      // Still switch to results tab to show error
      setActiveTab('results');
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload', icon: '�', description: 'Upload CSV files to analyze' },
    { id: 'query', label: 'Query', icon: '�', description: 'Ask questions in natural language', disabled: !isConnected },
    { id: 'results', label: 'Results', icon: '📊', description: 'View query results and data', disabled: !queryResults },
    { id: 'analytics', label: 'Analytics', icon: '📈', description: 'Performance metrics and insights' },
    { id: 'database', label: 'Database', icon: '🗄️', description: 'Schema and connection info' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div>
            <DocumentUploader 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
            {uploadMessage && (
              <div className={`upload-message ${uploadSuccess ? 'success' : 'error'}`}>
                {uploadSuccess ? '✅' : '❌'} {uploadMessage}
              </div>
            )}
          </div>
        );
      case 'query':
        return (
          <ErrorBoundary>
            <QueryPanel 
              key={refreshKey}
              onQueryResults={handleQueryResults}
              connectionInfo={connectionInfo}
            />
          </ErrorBoundary>
        );
      case 'results':
        return (
          <ErrorBoundary>
            <ResultsView 
              results={queryResults}
              connectionInfo={connectionInfo}
            />
          </ErrorBoundary>
        );
      case 'analytics':
        return <MetricsDashboard />;
      case 'database':
        return (
          <ErrorBoundary>
            <DatabaseConnector 
              key={refreshKey} 
              onConnection={handleConnection} 
              connectionInfo={connectionInfo}
            />
          </ErrorBoundary>
        );
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
                  {isConnected ? String(connectionInfo?.name || 'Database') : 'Disconnected'}
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
                disabled={tab.disabled ? true : false}
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