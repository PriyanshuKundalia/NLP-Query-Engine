import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatabaseConnector from './components/DatabaseConnector';
import DocumentUploader from './components/DocumentUploader';
import QueryPanel from './components/QueryPanel';
import ResultsView from './components/ResultsView';
import MetricsDashboard from './components/MetricsDashboard';
import './App.css';

function App() {
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [activeTab, setActiveTab] = useState('query');
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure axios base URL
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load existing connections
      await loadConnections();
      
      // Load system stats
      await loadSystemStats();
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const response = await axios.get('/api/connections');
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await axios.get('/api/system/stats');
      setSystemStats(response.data.system_stats);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    }
  };

  const handleConnectionSuccess = (connection) => {
    setActiveConnection(connection);
    setActiveTab('query'); // Switch to query tab after connection
  };

  const handleQueryExecuted = (result) => {
    setQueryResult(result);
    setActiveTab('results'); // Switch to results tab after query
  };

  const handleUploadComplete = (status) => {
    console.log('Upload completed:', status);
    // Optionally refresh system stats or show notification
    loadSystemStats();
  };

  const handleExportResults = (results, format) => {
    try {
      let content, filename;
      
      if (format === 'csv') {
        const headers = Object.keys(results[0] || {});
        const csvContent = [
          headers.join(','),
          ...results.map(row => headers.map(header => 
            JSON.stringify(row[header] || '')
          ).join(','))
        ].join('\\n');
        
        content = csvContent;
        filename = 'query_results.csv';
      } else if (format === 'json') {
        content = JSON.stringify(results, null, 2);
        filename = 'query_results.json';
      }
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const clearCache = async () => {
    try {
      await axios.post('/api/system/cache/clear');
      alert('Cache cleared successfully');
      loadSystemStats();
    } catch (error) {
      alert('Failed to clear cache: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading NLP Query Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🤖 NLP Query Engine</h1>
            <p>AI-powered natural language queries for employee data</p>
          </div>
          
          <div className="header-right">
            {activeConnection && (
              <div className="active-connection">
                <span className="connection-indicator">📊</span>
                <span>{activeConnection.connection_name}</span>
                <span className="connection-type">({activeConnection.database_type})</span>
              </div>
            )}
            
            <div className="system-actions">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={clearCache}
                title="Clear system cache"
              >
                🗑️
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={loadSystemStats}
                title="Refresh stats"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="app-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            🔗 Connections
          </button>
          <button 
            className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📁 Documents
          </button>
          <button 
            className={`nav-tab ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            🔍 Query
          </button>
          <button 
            className={`nav-tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            📊 Results
            {queryResult && !queryResult.error && (
              <span className="result-count">{queryResult.total_results}</span>
            )}
          </button>
          <button 
            className={`nav-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            📈 Metrics
          </button>
        </div>
        
        {/* System stats summary */}
        {systemStats && (
          <div className="stats-summary">
            <span className="stat">
              📊 {systemStats.total_connections || 0} connections
            </span>
            <span className="stat">
              📄 {systemStats.total_documents || 0} documents
            </span>
            <span className="stat">
              🔍 {systemStats.total_queries || 0} queries
            </span>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="app-main">
        <div className="main-content">
          
          {/* Connections tab */}
          {activeTab === 'connections' && (
            <div className="tab-content">
              <DatabaseConnector 
                onConnectionSuccess={handleConnectionSuccess}
                connections={connections}
                setConnections={setConnections}
              />
            </div>
          )}

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div className="tab-content">
              <DocumentUploader 
                connectionId={activeConnection?.connection_id}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          {/* Query tab */}
          {activeTab === 'query' && (
            <div className="tab-content">
              <QueryPanel 
                connectionId={activeConnection?.connection_id}
                onQueryExecuted={handleQueryExecuted}
              />
            </div>
          )}

          {/* Results tab */}
          {activeTab === 'results' && (
            <div className="tab-content">
              <ResultsView 
                queryResult={queryResult}
                onExport={handleExportResults}
              />
            </div>
          )}

          {/* Metrics tab */}
          {activeTab === 'metrics' && (
            <div className="tab-content">
              <MetricsDashboard 
                activeConnection={activeConnection}
              />
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <p>&copy; 2024 NLP Query Engine - AI Engineering Assignment</p>
          </div>
          <div className="footer-right">
            <span className="api-status">
              🟢 API Connected
            </span>
            {systemStats && (
              <span className="cache-info">
                📋 {systemStats.cache_entries || 0} cached queries
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Quick start guide overlay */}
      {connections.length === 0 && activeTab === 'query' && (
        <div className="quick-start-overlay">
          <div className="quick-start-content">
            <h3>🚀 Quick Start</h3>
            <ol>
              <li>Go to <strong>Connections</strong> tab to connect a database</li>
              <li>Or go to <strong>Documents</strong> tab to upload files</li>
              <li>Then return here to start querying your data!</li>
            </ol>
            <div className="quick-start-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('connections')}
              >
                Connect Database
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab('documents')}
              >
                Upload Documents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;