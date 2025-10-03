import React, { useState, useEffect } from 'react';

const QueryPanel = ({ onQueryResults, connectionInfo }) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');

  const sampleQueries = [
    "What is the average salary by department?",
    "Show me all employees in IT department", 
    "Count how many employees we have",
    "Top 10 highest paid employees",
    "Find employees hired in the last year",
    "List all departments",
    "Who are the employees in Marketing?",
    "Show me Finance department employees"
  ];

  useEffect(() => {
    // Load query history from localStorage
    const saved = localStorage.getItem('queryHistory');
    if (saved) {
      setQueryHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (result) => {
    const newHistory = [result, ...queryHistory.slice(0, 9)];
    setQueryHistory(newHistory);
    localStorage.setItem('queryHistory', JSON.stringify(newHistory));
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      return;
    }

    setIsExecuting(true);

    try {
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          connection_id: 'default',
          options: { limit: 100 }
        }),
      });

      const result = await response.json();
      
      // Save to history
      saveToHistory({
        query: query.trim(),
        timestamp: new Date().toISOString(),
        success: result.success,
        confidence: result.confidence
      });

      // Pass results to parent
      if (onQueryResults) {
        onQueryResults(result);
      }

    } catch (error) {
      console.error('Query execution failed:', error);
      const errorResult = {
        success: false,
        query: query.trim(),
        error: error.message,
        sql_generated: '',
        results: [],
        total_results: 0,
        confidence: 0,
        metadata: {}
      };
      
      if (onQueryResults) {
        onQueryResults(errorResult);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSampleClick = (sampleQuery) => {
    setQuery(sampleQuery);
    setSelectedSample(sampleQuery);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleExecuteQuery();
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSelectedSample('');
  };

  return (
    <div className="query-panel">
      <div className="panel-container">
        {/* Header Section */}
        <div className="panel-header">
          <div className="header-content">
            <h2 className="panel-title">
              <span className="title-icon">🔍</span>
              Natural Language Query
            </h2>
            <p className="panel-subtitle">
              Ask questions about your data in plain English
            </p>
          </div>
          
          {connectionInfo && (
            <div className="connection-info">
              <div className="connection-badge">
                <span className="badge-icon">🗄️</span>
                <span className="badge-text">{connectionInfo.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Query Section */}
        <div className="query-section">
          <div className="query-input-container">
            <div className="input-wrapper">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about your data... (e.g., 'What is the average salary by department?')"
                className="query-input"
                rows={4}
                disabled={isExecuting}
              />
              
              <div className="input-actions">
                <button
                  onClick={clearQuery}
                  className="action-btn clear-btn"
                  disabled={!query || isExecuting}
                  title="Clear query"
                >
                  <span className="btn-icon">🗑️</span>
                  Clear
                </button>
                
                <button
                  onClick={handleExecuteQuery}
                  className="action-btn execute-btn"
                  disabled={!query.trim() || isExecuting}
                  title="Execute query (Ctrl+Enter)"
                >
                  <span className="btn-icon">
                    {isExecuting ? '⏳' : '▶️'}
                  </span>
                  {isExecuting ? 'Executing...' : 'Execute Query'}
                </button>
              </div>
            </div>

            <div className="query-tips">
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">Tip: Press Ctrl+Enter to execute query quickly</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">⚠️</span>
                <span className="tip-text">
                  {connectionInfo ? 
                    `Connected to ${connectionInfo.name}` : 
                    'Please connect to a database first before executing queries.'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Queries Section */}
        <div className="samples-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">💡</span>
              Sample Queries
            </h3>
            <p className="section-subtitle">Click any query to try it</p>
          </div>

          <div className="samples-grid">
            {sampleQueries.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSampleClick(sample)}
                className={`sample-card ${selectedSample === sample ? 'selected' : ''}`}
                disabled={isExecuting}
              >
                <span className="sample-icon">❓</span>
                <span className="sample-text">{sample}</span>
                <span className="sample-arrow">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Query History Section */}
        {queryHistory.length > 0 && (
          <div className="history-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📝</span>
                Recent Queries
              </h3>
              <button 
                onClick={() => {
                  setQueryHistory([]);
                  localStorage.removeItem('queryHistory');
                }}
                className="clear-history-btn"
              >
                Clear History
              </button>
            </div>

            <div className="history-list">
              {queryHistory.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  onClick={() => setQuery(item.query)}
                  className={`history-item ${item.success ? 'success' : 'error'}`}
                >
                  <div className="history-content">
                    <span className="history-icon">
                      {item.success ? '✅' : '❌'}
                    </span>
                    <span className="history-query">{item.query}</span>
                    <span className="history-confidence">
                      {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                  <span className="history-time">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .query-panel {
          height: 100%;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          overflow-y: auto;
        }

        .panel-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* Header Section */
        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .header-content {
          flex: 1;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }

        .title-icon {
          font-size: 2.25rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .panel-subtitle {
          color: #718096;
          font-size: 1.125rem;
          margin: 0;
          font-weight: 400;
        }

        .connection-info {
          margin-left: 2rem;
        }

        .connection-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-size: 0.875rem;
        }

        .badge-icon {
          font-size: 1rem;
        }

        /* Query Section */
        .query-section {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .query-input-container {
          width: 100%;
        }

        .input-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .query-input {
          width: 100%;
          min-height: 120px;
          padding: 1.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-family: inherit;
          line-height: 1.6;
          resize: vertical;
          transition: all 0.3s ease;
          background: #fafafa;
        }

        .query-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: white;
        }

        .query-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .clear-btn {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .clear-btn:hover:not(:disabled) {
          background: #edf2f7;
          transform: translateY(-1px);
        }

        .execute-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .execute-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-icon {
          font-size: 1rem;
        }

        .query-tips {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #718096;
        }

        .tip-icon {
          font-size: 1rem;
        }

        /* Samples Section */
        .samples-section {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .section-subtitle {
          color: #718096;
          font-size: 0.875rem;
          margin: 0;
        }

        .section-icon {
          font-size: 1.25rem;
        }

        .samples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .sample-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
        }

        .sample-card:hover:not(:disabled) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
        }

        .sample-card.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }

        .sample-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sample-icon {
          font-size: 1rem;
          opacity: 0.8;
        }

        .sample-text {
          flex: 1;
          line-height: 1.4;
        }

        .sample-arrow {
          font-size: 1rem;
          opacity: 0.6;
          transition: transform 0.2s ease;
        }

        .sample-card:hover .sample-arrow {
          transform: translateX(2px);
        }

        /* History Section */
        .history-section {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .clear-history-btn {
          background: none;
          border: 1px solid #e2e8f0;
          color: #718096;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-history-btn:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .history-item:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
          transform: translateX(4px);
        }

        .history-item.success {
          border-left: 3px solid #48bb78;
        }

        .history-item.error {
          border-left: 3px solid #f56565;
        }

        .history-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .history-icon {
          font-size: 0.875rem;
        }

        .history-query {
          color: #4a5568;
          font-size: 0.875rem;
          font-weight: 500;
          flex: 1;
        }

        .history-confidence {
          background: #edf2f7;
          color: #4a5568;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .history-time {
          color: #a0aec0;
          font-size: 0.75rem;
          margin-left: 1rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .panel-container {
            padding: 1rem;
          }

          .panel-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .connection-info {
            margin-left: 0;
          }

          .query-section {
            padding: 1.5rem;
          }

          .input-actions {
            flex-direction: column;
          }

          .samples-grid {
            grid-template-columns: 1fr;
          }

          .panel-title {
            font-size: 1.5rem;
          }

          .history-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .history-time {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default QueryPanel;