import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QueryPanel.css';

const QueryPanel = ({ connectionId, onQueryExecuted }) => {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState('auto');
  const [isExecuting, setIsExecuting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [queryHistory, setQueryHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const queryTypes = [
    { value: 'auto', label: 'Auto (Recommended)', description: 'Let the system choose the best approach' },
    { value: 'sql', label: 'Database Query', description: 'Generate and execute SQL queries' },
    { value: 'document', label: 'Document Search', description: 'Search through uploaded documents' },
    { value: 'hybrid', label: 'Hybrid Search', description: 'Combine database and document search' }
  ];

  // Load suggestions and history on component mount
  useEffect(() => {
    loadSuggestions();
    loadQueryHistory();
  }, [connectionId]);

  const loadSuggestions = async () => {
    try {
      const params = connectionId ? { connection_id: connectionId } : {};
      const response = await axios.get('/api/query/suggestions', { params });
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const loadQueryHistory = async () => {
    try {
      const params = {
        limit: 10,
        ...(connectionId && { connection_id: connectionId })
      };
      const response = await axios.get('/api/query/history', { params });
      setQueryHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to load query history:', err);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      return;
    }

    setIsExecuting(true);

    try {
      const payload = {
        query: query.trim(),
        query_type: queryType,
        filters,
        limit: 100
      };

      if (connectionId) {
        payload.connection_id = connectionId;
      }

      const response = await axios.post('/api/query', payload);
      
      // Add to history
      setQueryHistory(prev => [response.data, ...prev.slice(0, 9)]);
      
      // Notify parent component
      if (onQueryExecuted) {
        onQueryExecuted(response.data);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Query execution failed';
      if (onQueryExecuted) {
        onQueryExecuted({
          error: true,
          message: errorMessage,
          query: query
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const explainQuery = async () => {
    if (!query.trim()) return;

    try {
      const payload = {
        query: query.trim(),
        query_type: queryType
      };

      if (connectionId) {
        payload.connection_id = connectionId;
      }

      const response = await axios.post('/api/query/explain', payload);
      
      // Show explanation in a modal or alert (simplified here)
      alert(`Query Explanation:\\n${response.data.explanation.recommended_approach}\\n\\nEstimated time: ${response.data.estimated_execution_time}ms\\n\\nData sources: ${response.data.data_sources.join(', ')}`);
    } catch (err) {
      alert('Failed to explain query: ' + (err.response?.data?.detail || err.message));
    }
  };

  const useSuggestion = (suggestion) => {
    setQuery(suggestion.query);
    setShowSuggestions(false);
    
    // Auto-set query type if specified in suggestion
    if (suggestion.category === 'sql') {
      setQueryType('sql');
    } else if (suggestion.category === 'document') {
      setQueryType('document');
    }
  };

  const useHistoryQuery = (historyItem) => {
    setQuery(historyItem.query);
    setQueryType(historyItem.query_type);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      executeQuery();
    }
  };

  const addFilter = () => {
    const key = prompt('Filter column name:');
    const value = prompt('Filter value:');
    if (key && value) {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const removeFilter = (key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  return (
    <div className="query-panel">
      <div className="query-panel-header">
        <h3>Natural Language Query</h3>
        <div className="panel-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            Suggestions
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Query input */}
      <div className="query-input-section">
        <div className="query-type-selector">
          <label>Query Type:</label>
          <select 
            value={queryType} 
            onChange={(e) => setQueryType(e.target.value)}
            className="form-control"
          >
            {queryTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <small className="query-type-description">
            {queryTypes.find(t => t.value === queryType)?.description}
          </small>
        </div>

        <div className="query-input-wrapper">
          <textarea
            className="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your data... 
Examples:
• How many employees are in the sales department?
• Show me all performance reviews from last quarter
• What are the salary trends by department?
• Find documents about remote work policies"
            rows={4}
            disabled={isExecuting}
          />
          
          <div className="query-actions">
            <button 
              className="btn btn-primary"
              onClick={executeQuery}
              disabled={!query.trim() || isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Execute Query'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={explainQuery}
              disabled={!query.trim() || isExecuting}
            >
              Explain
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => setQuery('')}
              disabled={isExecuting}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="query-help">
          <small>💡 Tip: Use Ctrl+Enter to execute query quickly</small>
        </div>
      </div>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="advanced-options">
          <h4>Advanced Options</h4>
          
          <div className="filters-section">
            <h5>Filters</h5>
            {Object.keys(filters).length === 0 ? (
              <p>No filters applied</p>
            ) : (
              <div className="filter-list">
                {Object.entries(filters).map(([key, value]) => (
                  <div key={key} className="filter-item">
                    <span>{key}: {value}</span>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => removeFilter(key)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-sm btn-secondary" onClick={addFilter}>
              Add Filter
            </button>
          </div>
        </div>
      )}

      {/* Query suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h4>Query Suggestions</h4>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="suggestion-item"
                onClick={() => useSuggestion(suggestion)}
              >
                <div className="suggestion-text">{suggestion.query}</div>
                <div className="suggestion-meta">
                  <span className={`category ${suggestion.category}`}>
                    {suggestion.category}
                  </span>
                  <span className={`complexity ${suggestion.complexity}`}>
                    {suggestion.complexity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query history */}
      {queryHistory.length > 0 && (
        <div className="history-panel">
          <h4>Recent Queries</h4>
          <div className="history-list">
            {queryHistory.slice(0, 5).map((item, index) => (
              <div 
                key={index} 
                className="history-item"
                onClick={() => useHistoryQuery(item)}
              >
                <div className="history-query">{item.query}</div>
                <div className="history-meta">
                  <span className="query-type">{item.query_type}</span>
                  <span className="execution-time">{item.execution_time_ms}ms</span>
                  <span className="result-count">{item.total_results} results</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection status */}
      <div className="connection-status">
        {connectionId ? (
          <span className="status connected">Connected to database</span>
        ) : (
          <span className="status disconnected">No database connection (document search only)</span>
        )}
      </div>
    </div>
  );
};

export default QueryPanel;