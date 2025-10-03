import React, { useState, useEffect } from 'react';
import './ResultsView.css';

const ResultsView = ({ queryResult, onExport }) => {
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset to first page when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [queryResult]);

  if (!queryResult) {
    return (
      <div className="results-view empty">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No query executed yet</h3>
          <p>Execute a query to see results here</p>
        </div>
      </div>
    );
  }

  if (queryResult.error) {
    return (
      <div className="results-view error">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>Query Error</h3>
          <p>{queryResult.message}</p>
          <div className="error-details">
            <strong>Query:</strong> {queryResult.query}
          </div>
        </div>
      </div>
    );
  }

  const { results, metadata, execution_time_ms, total_results, query_type, sql_generated } = queryResult;

  // Filter and sort results
  const filteredResults = results.filter(result => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return Object.values(result).some(value => 
      String(value).toLowerCase().includes(searchText)
    );
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    const aValue = a[key];
    const bValue = b[key];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = (format) => {
    if (onExport) {
      onExport(sortedResults, format);
    }
  };

  const renderTableView = () => {
    if (results.length === 0) {
      return (
        <div className="no-results">
          <p>No results found</p>
        </div>
      );
    }

    // Get all unique keys from results
    const allKeys = Array.from(new Set(results.flatMap(Object.keys)));
    
    return (
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              {allKeys.map(key => (
                <th 
                  key={key} 
                  onClick={() => handleSort(key)}
                  className={sortConfig?.key === key ? `sorted ${sortConfig.direction}` : ''}
                >
                  {key}
                  {sortConfig?.key === key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedResults.map((result, index) => (
              <tr key={index}>
                {allKeys.map(key => (
                  <td key={key}>
                    {result[key] !== undefined ? String(result[key]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCardView = () => {
    if (results.length === 0) {
      return (
        <div className="no-results">
          <p>No results found</p>
        </div>
      );
    }

    return (
      <div className="cards-container">
        {paginatedResults.map((result, index) => (
          <div key={index} className="result-card">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="card-field">
                <span className="field-label">{key}:</span>
                <span className="field-value">
                  {value !== undefined ? String(value) : '—'}
                </span>
              </div>
            ))}
            {result.similarity_score && (
              <div className="similarity-score">
                Relevance: {(result.similarity_score * 100).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPageNumbers = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

    if (endPage - startPage + 1 < maxPageNumbers) {
      startPage = Math.max(1, endPage - maxPageNumbers + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="btn btn-sm btn-secondary"
        >
          Previous
        </button>
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={`btn btn-sm ${currentPage === number ? 'btn-primary' : 'btn-secondary'}`}
          >
            {number}
          </button>
        ))}
        
        <button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="btn btn-sm btn-secondary"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="results-view">
      <div className="results-header">
        <div className="results-meta">
          <h3>Query Results</h3>
          <div className="meta-stats">
            <span className="stat">
              <strong>{total_results}</strong> results
            </span>
            <span className="stat">
              <strong>{execution_time_ms}ms</strong> execution time
            </span>
            <span className={`stat query-type ${query_type}`}>
              {query_type.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="results-actions">
          <div className="view-modes">
            <button 
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
          </div>

          <div className="export-options">
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => handleExport('json')}
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* SQL Query Display */}
      {sql_generated && (
        <div className="sql-display">
          <h4>Generated SQL:</h4>
          <pre className="sql-code">{sql_generated}</pre>
        </div>
      )}

      {/* Results controls */}
      <div className="results-controls">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter results..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="form-control filter-input"
          />
        </div>

        <div className="pagination-controls">
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="form-control items-per-page"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Results content */}
      <div className="results-content">
        {viewMode === 'table' ? renderTableView() : renderCardView()}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Results info */}
      <div className="results-info">
        <p>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedResults.length)} of {sortedResults.length} results
          {filterText && ` (filtered from ${results.length} total)`}
        </p>
        
        {metadata && (
          <div className="metadata-info">
            <strong>Data Sources:</strong> {metadata.data_sources?.join(', ') || 'Unknown'}
            {metadata.cached && <span className="cached-indicator">📋 Cached</span>}
          </div>
        )}
      </div>

      {/* Performance metrics */}
      <div className="performance-metrics">
        <h4>Performance Metrics</h4>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">Execution Time</span>
            <span className="metric-value">{execution_time_ms}ms</span>
          </div>
          <div className="metric">
            <span className="metric-label">Query Type</span>
            <span className="metric-value">{query_type}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Results Count</span>
            <span className="metric-value">{total_results}</span>
          </div>
          {queryResult.confidence_score && (
            <div className="metric">
              <span className="metric-label">Confidence</span>
              <span className="metric-value">{(queryResult.confidence_score * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;