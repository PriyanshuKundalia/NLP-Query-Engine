import React, { useState, useEffect } from 'react';
import './QueryPanel.css'; // We'll create this for premium styling

const QueryPanel = ({ onQueryResults = () => {}, connectionInfo = null }) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [availableTables, setAvailableTables] = useState([]);
  const [aiMode, setAiMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate dynamic sample queries based on current connection info
  const generateSampleQueries = () => {
    if (!connectionInfo || !connectionInfo.tables || connectionInfo.tables.length === 0) {
      return [
        "Count how many records we have in total",
        "Show me all the data",
        "List all unique values in the first column",
        "What columns are available?",
        "Show me the first 10 rows",
        "Find records with missing values"
      ];
    }

    const table = connectionInfo.tables[0];
    const tableName = table.name || 'data';
    const columns = table.columns || [];
    const queries = [];

    // Check if this is the iris dataset based on column names
    const columnNames = columns.map(col => col.name.toLowerCase());
    const isIrisDataset = columnNames.includes('sepal_length') || 
                         columnNames.includes('petal_length') || 
                         columnNames.includes('species');

    if (isIrisDataset) {
      // Iris-specific intelligent queries
      return [
        "Show all flowers where petal_width > 1",
        "Count how many flowers of each species",
        "Find flowers with sepal_length > 6",
        "Show setosa flowers only",
        "What is the average petal_length?",
        "List all versicolor species",
        "Find flowers with petal_length < 2",
        "Show flowers where sepal_width > 3.5",
        "Count virginica flowers",
        "Show the largest sepal_length values",
        "Find flowers with smallest petal_width",
        "Show all data sorted by species"
      ];
    }

    // Generic dynamic queries for other datasets
    queries.push(`Count how many records we have in ${tableName}`);
    queries.push(`Show me all ${tableName} records`);

    // Generate column-specific queries
    columns.forEach(column => {
      const columnName = column.name;
      const columnLower = columnName.toLowerCase();
      
      // For numeric-sounding columns
      if (columnLower.includes('price') || columnLower.includes('amount') || 
          columnLower.includes('cost') || columnLower.includes('value') ||
          columnLower.includes('length') || columnLower.includes('width') ||
          columnLower.includes('height') || columnLower.includes('size')) {
        queries.push(`Show me records with ${columnName} > 5`);
        queries.push(`What is the average ${columnName}?`);
        queries.push(`Find maximum ${columnName} value`);
      }
      
      // For categorical columns
      if (columnLower.includes('category') || columnLower.includes('type') || 
          columnLower.includes('class') || columnLower.includes('status') ||
          columnLower.includes('species') || columnLower.includes('group')) {
        queries.push(`List all unique ${columnName} values`);
        queries.push(`Count records by ${columnName}`);
      }
      
      // For name/text columns
      if (columnLower.includes('name') || columnLower.includes('title')) {
        queries.push(`Search for records where ${columnName} contains text`);
      }
      
      // For date columns
      if (columnLower.includes('date') || columnLower.includes('time')) {
        queries.push(`Show me recent ${columnName} records`);
      }
    });

    // Add some generic analysis queries
    if (columns.length > 1) {
      queries.push(`Show me summary statistics for all columns`);
      queries.push(`Find records with missing values`);
    }

    return queries.slice(0, 12); // Limit to 12 queries
  };

  const sampleQueries = generateSampleQueries();

  useEffect(() => {
    // Load query history from localStorage
    try {
      const saved = localStorage.getItem('queryHistory');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        if (Array.isArray(parsedHistory)) {
          // Migrate old object format to string format
          const cleanHistory = parsedHistory
            .map(item => typeof item === 'string' ? item : (item?.query || null))
            .filter(item => item && typeof item === 'string');
          setQueryHistory(cleanHistory);
          // Save the cleaned history back
          if (cleanHistory.length !== parsedHistory.length) {
            localStorage.setItem('queryHistory', JSON.stringify(cleanHistory));
          }
        }
      }
    } catch (error) {
      console.error('Error loading query history:', error);
      setQueryHistory([]);
      localStorage.removeItem('queryHistory'); // Clear corrupted data
    }

    // Fetch available tables
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      console.log('Fetching tables from API...');
      const response = await fetch('http://localhost:8000/api/schema');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        // The API returns data in 'tables' array with detailed info
        if (data.tables && Array.isArray(data.tables)) {
          console.log('Found tables with', data.tables.length, 'tables');
          // Filter out empty tables and system tables
          const dataTables = data.tables.filter(table => 
            table && 
            table.row_count > 0 && 
            table.name &&
            !table.name.startsWith('sqlite_') &&
            !['database_connections', 'cache_entries', 'system_metrics', 
              'user_sessions', 'documents', 'query_history', 'ingestion_jobs',
              'schema_metadata', 'document_chunks', 'query_results'].includes(table.name)
          );
          console.log('Filtered tables:', dataTables);
          setAvailableTables(dataTables);
          
          // Auto-select the first table if available and no table is currently selected
          if (dataTables.length > 0 && !selectedTable) {
            setSelectedTable(dataTables[0].name);
          }
        } else {
          console.log('No tables found in response, available keys:', Object.keys(data || {}));
          // Fallback to database.tables if available
          if (data.database && data.database.tables && Array.isArray(data.database.tables)) {
            console.log('Using database.tables as fallback');
            const simpleTables = data.database.tables.filter(table => 
              table &&
              table.rows > 0 &&
              table.name &&
              !table.name.startsWith('sqlite_') &&
              !['database_connections', 'cache_entries', 'system_metrics', 
                'user_sessions', 'documents', 'query_history', 'ingestion_jobs',
                'schema_metadata', 'document_chunks', 'query_results'].includes(table.name)
            );
            // Convert simple format to expected format
            const convertedTables = simpleTables.map(table => ({
              name: table.name,
              row_count: table.rows
            }));
            setAvailableTables(convertedTables);
            
            // Auto-select the first table if available and no table is currently selected
            if (convertedTables.length > 0 && !selectedTable) {
              setSelectedTable(convertedTables[0].name);
            }
          }
        }
      } else {
        console.error('API request failed with status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const saveToHistory = (result) => {
    try {
      const historyArray = Array.isArray(queryHistory) ? queryHistory : [];
      const newHistory = [result, ...historyArray.slice(0, 9)];
      setQueryHistory(newHistory);
      localStorage.setItem('queryHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      return;
    }

    setIsExecuting(true);

    try {
      // Choose endpoint based on AI mode
  // Use AI endpoint when AI mode is enabled, otherwise use rule-based endpoint
  const endpoint = aiMode ? 'http://localhost:8000/api/ai-query' : 'http://localhost:8000/api/query';
      const systemType = aiMode ? 'FREE AI-Powered' : 'Pattern-Based';
      
      console.log('Executing query:', query.trim());
      console.log('Using system:', systemType);
      console.log('Sending to URL:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          connection_id: 'default',
          target_table: selectedTable || null,
          options: { limit: 100 }
        }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Query result:', result);
      
      // Save to history (just the query string)
      saveToHistory(query.trim());

      // Pass results to parent
      if (onQueryResults) {
        onQueryResults(result);
      }

    } catch (error) {
      console.error('Query execution error:', error);
      // Query execution failed
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

  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem('queryHistory');
  };

  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const response = await fetch('http://localhost:8000/');
      const result = await response.json();
      console.log('Backend test result:', result);
      alert(`Backend is working! Available tables: ${result.available_tables?.join(', ') || 'None'}`);
    } catch (error) {
      console.error('Backend test failed:', error);
      alert(`Backend connection failed: ${error.message}`);
    }
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
                <div className="badge-content">
                  <span className="badge-text">{String(connectionInfo?.name || 'Unknown Database')}</span>
                  {connectionInfo?.table_list && Array.isArray(connectionInfo.table_list) && connectionInfo.table_list.length > 0 && (
                    <span className="badge-tables">
                      Tables: {connectionInfo?.table_list?.map((table, index) => 
                        String(typeof table === 'string' ? table : (table?.name || 'unknown'))
                      ).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Query Section */}
        <div className="query-section">
          {/* Premium Table Selection Card */}
          <div className="premium-card" style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px'
              }}>
                📊
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em'
              }}>
                Data Source Selection
              </h3>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              <select 
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                disabled={isExecuting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid var(--border-light)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: 'white',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              >
                {availableTables.length === 0 ? (
                  <option value="">📤 Please upload a CSV file first</option>
                ) : (
                  availableTables.map(table => (
                    <option key={String(table?.name || `table_${Math.random()}`)} value={String(table?.name || 'unknown')}>
                      📋 {String(table?.name || 'Unknown Table')} • {String(table?.row_count || 0)} rows
                    </option>
                  ))
                )}
              </select>
              <button 
                onClick={fetchAvailableTables}
                disabled={isExecuting}
                style={{
                  padding: '12px 20px',
                  border: '2px solid var(--primary-200)',
                  borderRadius: '12px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-100)';
                  e.target.style.borderColor = 'var(--primary-300)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--primary-50)';
                  e.target.style.borderColor = 'var(--primary-200)';
                }}
                title="Refresh available tables"
              >
                🔄 Refresh
              </button>
            </div>
            {availableTables.length > 0 ? (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                ✅ Found {availableTables.length} data table{availableTables.length !== 1 ? 's' : ''} ready for analysis
              </div>
            ) : (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: 'var(--warning-50)',
                border: '1px solid var(--warning-200)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--warning-700)',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>No data loaded. Please go to the <strong>Upload</strong> tab to upload a CSV file first.</span>
              </div>
            )}
          </div>

          {/* Premium AI Mode Toggle Card */}
          <div className="premium-ai-card" style={{
            background: aiMode 
              ? 'linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)' 
              : 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)',
            border: aiMode 
              ? '2px solid var(--primary-300)' 
              : '2px solid var(--border-light)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: aiMode ? 'var(--shadow-lg)' : 'var(--shadow-md)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Premium Background Pattern */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: aiMode 
                ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(148, 163, 184, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: aiMode 
                    ? 'var(--gradient-primary)' 
                    : 'var(--gradient-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  transition: 'all 0.3s ease'
                }}>
                  {aiMode ? '🤖' : '📝'}
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.025em'
                  }}>
                    {aiMode ? 'AI-Powered Intelligence' : 'Pattern-Based Processing'}
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}>
                    {aiMode ? 'Advanced neural language understanding' : 'Fast rule-based query parsing'}
                  </p>
                </div>
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                padding: '16px 20px',
                background: aiMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={aiMode}
                    onChange={(e) => setAiMode(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary-500)'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: aiMode ? 'var(--primary-700)' : 'var(--text-primary)',
                    marginBottom: '4px'
                  }}>
                    {aiMode ? '🚀 AI Mode Active (FREE)' : '⚡ Enable AI Mode (FREE)'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4
                  }}>
                    {aiMode 
                      ? 'Using Groq AI (fast & free) for superior query understanding and flexible natural language processing'
                      : 'Switch to AI mode for intelligent query interpretation, semantic understanding, and support for any phrasing'
                    }
                  </div>
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: aiMode ? 'var(--primary-100)' : 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {aiMode ? '✨' : '🔧'}
                </div>
              </label>
            </div>
          </div>

          {/* Premium Query Input Card */}
          <div className="premium-query-card" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-lg)',
            transition: 'all 0.3s ease'
          }}>
            {/* Card Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--gradient-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                💬
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em'
                }}>
                  Natural Language Query
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Ask questions in plain English about your data
                </p>
              </div>
            </div>

            {/* Premium Input Wrapper */}
            <div style={{
              background: 'white',
              border: '2px solid var(--border-light)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={availableTables.length === 0 ? "Please upload a CSV file first to start querying..." : "Type your question here... (e.g., 'Show me all products with discount > 30%', 'What's the total revenue from Mumbai?')"}
                disabled={isExecuting || availableTables.length === 0}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: '500',
                  background: 'transparent',
                  padding: 0
                }}
                onFocus={(e) => e.target.parentElement.style.borderColor = 'var(--primary-500)'}
                onBlur={(e) => e.target.parentElement.style.borderColor = 'var(--border-light)'}
              />
              
              {/* Character Counter */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '12px',
                fontSize: '12px',
                color: 'var(--text-quaternary)',
                fontWeight: '500'
              }}>
                {query.length} characters
              </div>
            </div>

            {/* Premium Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                onClick={handleExecuteQuery}
                disabled={!query.trim() || isExecuting || availableTables.length === 0}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  background: isExecuting 
                    ? 'var(--gradient-dark)' 
                    : 'var(--gradient-primary)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: (!query.trim() || isExecuting) ? 0.7 : 1,
                  transform: 'translateY(0)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onMouseEnter={(e) => {
                  if (!isExecuting && query.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = 'var(--shadow-lg)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'var(--shadow-md)';
                }}
                title="Execute query (Ctrl+Enter)"
              >
                <span style={{ fontSize: '18px' }}>
                  {isExecuting ? '⏳' : '🚀'}
                </span>
                {isExecuting ? 'Processing Query...' : 'Execute Query'}
              </button>

              <button
                onClick={clearQuery}
                disabled={!query || isExecuting}
                style={{
                  padding: '16px 20px',
                  border: '2px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!query || isExecuting) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (!query || isExecuting) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (query && !isExecuting) {
                    e.target.style.borderColor = 'var(--border-dark)';
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.color = 'var(--text-secondary)';
                }}
                title="Clear query"
              >
                🗑️ Clear
              </button>

              <button
                onClick={testBackendConnection}
                style={{
                  padding: '16px 20px',
                  border: '2px solid var(--primary-200)',
                  borderRadius: '12px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-100)';
                  e.target.style.borderColor = 'var(--primary-300)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--primary-50)';
                  e.target.style.borderColor = 'var(--primary-200)';
                }}
                title="Test backend connection"
              >
                🔧 Test
              </button>
            </div>

            {/* Premium Tips Section */}
            <div style={{
              marginTop: '20px',
              padding: '16px 20px',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 Pro Tips for Better Results
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                <div>✨ Use natural language: "Show me..."</div>
                <div>📊 Specify conditions: "where discount {'>'}  30"</div>
                <div>🎯 Be specific: "Mumbai sales last month"</div>
                <div>🔍 Try variations if first attempt doesn't work</div>
              </div>
            </div>
          </div>

          {/* Premium Sample Queries Card */}
          <div className="premium-samples-card" style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s ease'
          }}>
            {/* Card Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--gradient-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                💡
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em'
                }}>
                  Sample Queries
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Try these example queries to get started
                </p>
              </div>
            </div>

            {/* Premium Sample Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {Array.isArray(sampleQueries) && sampleQueries.map((sample, index) => (
                <div
                  key={index}
                  onClick={() => setQuery(sample)}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = 'var(--shadow-lg)';
                    e.target.style.borderColor = 'var(--primary-300)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'var(--shadow-sm)';
                    e.target.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, 
                      var(--primary-400) 0%, 
                      var(--primary-500) 50%, 
                      var(--primary-600) 100%)`
                  }} />
                  
                  <div style={{
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    "{sample}"
                  </div>
                  
                  <div style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: 'var(--text-quaternary)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>👆</span> Click to use
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium History Card */}
          {Array.isArray(queryHistory) && queryHistory.length > 0 && (
            <div className="premium-history-card" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '28px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.3s ease'
            }}>
              {/* Card Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--gradient-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px'
                  }}>
                    📜
                  </div>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.025em'
                    }}>
                      Query History
                    </h3>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      fontWeight: '500'
                    }}>
                      {queryHistory.length} recent queries
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={clearHistory}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '10px',
                    background: 'white',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--danger-300)';
                    e.target.style.color = 'var(--danger-600)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-medium)';
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                >
                  🗑️ Clear History
                </button>
              </div>

              {/* Premium History List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {Array.isArray(queryHistory) && queryHistory.slice(-5).reverse().map((historyItem, index) => (
                  <div
                    key={index}
                    onClick={() => setQuery(historyItem)}
                    style={{
                      background: 'white',
                      border: '1px solid var(--border-light)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = 'var(--primary-300)';
                      e.target.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'var(--border-light)';
                      e.target.style.boxShadow = 'var(--shadow-xs)';
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary-500)',
                      flexShrink: 0
                    }} />
                    
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                      flex: 1,
                      lineHeight: 1.4
                    }}>
                      {historyItem}
                    </div>
                    
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-quaternary)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Click to use
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryPanel;