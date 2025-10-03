import React, { useState } from 'react';

const ResultsView = ({ results: queryResult, connectionInfo }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table', 'json', 'chart'
  const [selectedRows, setSelectedRows] = useState([]);

  console.log('ResultsView received:', queryResult);

  if (!queryResult) {
    return (
      <div className="results-view">
        <div className="results-container">
          <div className="results-header">
            <div className="header-content">
              <h2 className="results-title">
                <span className="title-icon">📊</span>
                Query Results
              </h2>
              <p className="results-subtitle">Execute a query to see results here</p>
            </div>
          </div>
          
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Query Executed</h3>
            <p>Go to the Query tab and ask a question about your data to see results here.</p>
            <div className="empty-suggestions">
              <div className="suggestion-card">
                <span className="suggestion-icon">💡</span>
                <span>Try: "Show all data"</span>
              </div>
              <div className="suggestion-card">
                <span className="suggestion-icon">�</span>
                <span>Try: "Count total rows"</span>
              </div>
              <div className="suggestion-card">
                <span className="suggestion-icon">💡</span>
                <span>Try: "Show first 5 records"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle the case where query was successful but returned empty results
  const hasData = queryResult.results && queryResult.results.length > 0;
  const hasError = !queryResult.success;

  // Helper functions
  const getColumnType = (data, column) => {
    if (!data || data.length === 0) return 'unknown';
    const value = data[0][column];
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    return 'text';
  };

  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="null-value">NULL</span>;
    }
    if (typeof value === 'boolean') {
      return <span className={`boolean-value ${value}`}>{value.toString()}</span>;
    }
    if (typeof value === 'number') {
      return <span className="number-value">{value.toLocaleString()}</span>;
    }
    return <span className="text-value">{String(value)}</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const exportToCsv = () => {
    if (!hasData) return;
    
    const headers = Object.keys(queryResult.results[0]);
    const csvContent = [
      headers.join(','),
      ...queryResult.results.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderTableView = () => {
    const columns = Object.keys(queryResult.results[0]);

    return (
      <div className="table-wrapper">
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th className="row-number-header">#</th>
                {columns.map((column) => (
                  <th key={column} className="data-header">
                    <div className="header-content">
                      <span className="header-text">{column}</span>
                      <span className="header-type">
                        {getColumnType(queryResult.results, column)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryResult.results.map((row, index) => (
                <tr key={index} className="data-row">
                  <td className="row-number">{index + 1}</td>
                  {columns.map((column) => (
                    <td key={column} className="data-cell">
                      <div className="cell-content">
                        {formatCellValue(row[column])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-summary">
          <span>Showing {queryResult.results.length} rows × {columns.length} columns</span>
        </div>
      </div>
    );
  };

  const renderJsonView = () => {
    return (
      <div className="json-wrapper">
        <div className="json-header">
          <h4>JSON Response</h4>
          <button 
            onClick={() => copyToClipboard(JSON.stringify(queryResult, null, 2))}
            className="copy-btn"
          >
            <span className="btn-icon">📋</span>
            Copy
          </button>
        </div>
        <div className="json-container">
          <pre className="json-output">
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="results-view">
      <div className="results-container">
        {/* Enhanced Header */}
        <div className="results-header">
          <div className="header-content">
            <h2 className="results-title">
              <span className="title-icon">📊</span>
              Query Results
            </h2>
            <div className="query-info">
              <div className="query-text">
                <span className="query-label">Query:</span>
                <span className="query-value">"{queryResult.query}"</span>
              </div>
              {queryResult.sql_generated && (
                <div className="sql-text">
                  <span className="sql-label">SQL:</span>
                  <code className="sql-value">{queryResult.sql_generated}</code>
                </div>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <div className="status-badges">
              <div className={`status-badge ${queryResult.success ? 'success' : 'error'}`}>
                <span className="badge-icon">{queryResult.success ? '✅' : '❌'}</span>
                <span className="badge-text">{queryResult.success ? 'Success' : 'Error'}</span>
              </div>
              {queryResult.confidence && (
                <div className="confidence-badge">
                  <span className="badge-icon">🎯</span>
                  <span className="badge-text">{Math.round(queryResult.confidence * 100)}% Confidence</span>
                </div>
              )}
              {hasData && (
                <div className="count-badge">
                  <span className="badge-icon">📈</span>
                  <span className="badge-text">{queryResult.results.length} rows</span>
                </div>
              )}
            </div>
            
            {hasData && (
              <div className="view-controls">
                <button
                  onClick={() => setViewMode('table')}
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                >
                  <span className="btn-icon">📋</span>
                  Table
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`view-btn ${viewMode === 'json' ? 'active' : ''}`}
                >
                  <span className="btn-icon">🔧</span>
                  JSON
                </button>
                <button
                  onClick={exportToCsv}
                  className="export-btn"
                >
                  <span className="btn-icon">📥</span>
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Content */}
        <div className="results-content">
          {hasError ? (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <h3>Query Error</h3>
              <p>{queryResult.error || 'An unknown error occurred'}</p>
              {queryResult.sql_generated && (
                <div className="error-sql">
                  <h4>Generated SQL:</h4>
                  <code>{queryResult.sql_generated}</code>
                </div>
              )}
            </div>
          ) : !hasData ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Data Found</h3>
              <p>Your query executed successfully but returned no results.</p>
              <div className="query-details">
                <p><strong>Query:</strong> {queryResult.query}</p>
                {queryResult.sql_generated && (
                  <p><strong>SQL:</strong> <code>{queryResult.sql_generated}</code></p>
                )}
              </div>
              <div className="suggestions">
                <h4>Suggestions:</h4>
                <ul>
                  <li>Try a different query</li>
                  <li>Check if your data has been uploaded</li>
                  <li>Use broader search terms</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="data-display">
              {viewMode === 'table' ? renderTableView() : renderJsonView()}
            </div>
          )}
        </div>

        {/* Enhanced Metadata */}
        {queryResult.metadata && (
          <div className="results-footer">
            <div className="metadata-section">
              <div className="metadata-item">
                <span className="metadata-icon">⏱️</span>
                <span className="metadata-label">Execution Time:</span>
                <span className="metadata-value">{queryResult.metadata.execution_time || 'N/A'}</span>
              </div>
              {queryResult.metadata.database && (
                <div className="metadata-item">
                  <span className="metadata-icon">🗄️</span>
                  <span className="metadata-label">Database:</span>
                  <span className="metadata-value">{queryResult.metadata.database}</span>
                </div>
              )}
              {queryResult.metadata.available_tables && Array.isArray(queryResult.metadata.available_tables) && (
                <div className="metadata-item">
                  <span className="metadata-icon">📋</span>
                  <span className="metadata-label">Available Tables:</span>
                  <span className="metadata-value">{queryResult.metadata.available_tables.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsView;