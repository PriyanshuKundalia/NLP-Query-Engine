import React, { useState, useEffect } from 'react';

const DatabaseConnector = ({ onConnection }) => {
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    loadSchemaInfo();
  }, []);

  const loadSchemaInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/schema');
      const data = await response.json();
      
      // Handle the new server response format
      if (data.waiting_for_upload) {
        setSchemaInfo({
          database_name: 'Dynamic Database (No Data)',
          tables: [],
          message: data.message || 'No CSV file uploaded'
        });
        setConnectionStatus('waiting');
      } else {
        // Transform the schema data to match the expected format
        const transformedData = {
          database_name: data.table_name ? `Dynamic Database (${data.table_name})` : 'Dynamic Database',
          tables: data.table_name ? [{
            name: data.table_name,
            row_count: data.schema ? Object.keys(data.schema).length : 0,
            description: `Uploaded CSV data with ${data.column_count || 0} columns`,
            columns: data.schema ? Object.entries(data.schema).map(([name, info]) => ({
              name: name,
              type: info.type || 'TEXT',
              description: `Sample: ${(info.sample_values && info.sample_values.slice(0, 2).join(', ')) || 'No data'}`
            })) : []
          }] : [],
          success: true
        };
        
        setSchemaInfo(transformedData);
        setConnectionStatus('connected');
        
        // Auto-trigger connection
        if (onConnection) {
          onConnection({
            name: transformedData.database_name,
            type: 'Dynamic Database',
            status: data.table_name ? 'connected' : 'waiting for upload'
          });
        }
      }
    } catch (error) {
      console.error('Failed to load schema:', error);
      setConnectionStatus('disconnected');
      setSchemaInfo({
        database_name: 'Server Disconnected',
        tables: [],
        error: 'Backend server is not responding. Please check if the server is running.',
        serverError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="database-connector loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Connecting to Database</h3>
          <p>Loading schema information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="database-connector">
      <div className="connector-header">
        <h2>
          <span className="header-icon">🗄️</span>
          Database Schema
        </h2>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={loadSchemaInfo}
            disabled={isLoading}
          >
            🔄 Refresh
          </button>
          <div className={`connection-badge ${connectionStatus}`}>
            <span className="badge-dot"></span>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'waiting' ? 'Waiting for Upload' : 
             connectionStatus === 'error' ? 'Error' : 'Disconnected'}
          </div>
        </div>
      </div>

      {schemaInfo && schemaInfo.tables && schemaInfo.tables.length > 0 ? (
        <div className="schema-content">
          <div className="database-info">
            <div className="info-card">
              <div className="card-header">
                <h3>
                  <span className="card-icon">📊</span>
                  {schemaInfo.database_name || 'Database'}
                </h3>
                <span className="table-count">
                  {schemaInfo.tables.length} tables
                </span>
              </div>
              <p className="database-description">
                Dynamic database with uploaded CSV data
              </p>
            </div>
          </div>

          <div className="tables-grid">
            {schemaInfo.tables.map((table, index) => (
              <div key={table.name || index} className="table-card">
                <div className="table-header">
                  <h4>
                    <span className="table-icon">📋</span>
                    {table.name || 'Unknown Table'}
                  </h4>
                  <span className="row-count">{table.row_count || 0} columns</span>
                </div>
                
                <p className="table-description">{table.description || 'No description available'}</p>
                
                <div className="columns-list">
                  <h5>Columns:</h5>
                  <div className="columns-grid">
                    {table.columns && table.columns.map((column, colIndex) => (
                      <div key={column.name || colIndex} className="column-item">
                        <div className="column-header">
                          <span className="column-name">{column.name || 'Unknown Column'}</span>
                          {column.primary_key && (
                            <span className="primary-key-badge">PK</span>
                          )}
                        </div>
                        <span className="column-type">{column.type || 'unknown'}</span>
                        {column.description && (
                          <p className="column-description">{column.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          <div className="no-data-content">
            {schemaInfo?.serverError ? (
              <>
                <h3>🔌 Server Disconnected</h3>
                <p>The backend server is not responding</p>
                <div className="server-status">
                  <p>Please ensure the backend server is running on port 8000</p>
                  <button className="retry-btn" onClick={loadSchemaInfo}>
                    🔄 Retry Connection
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>📁 No Data Uploaded</h3>
                <p>Upload a CSV file to see database schema and start querying</p>
                <div className="upload-hint">
                  <span>💡</span>
                  Go to the Upload tab to get started
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnector;