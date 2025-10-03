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
      const response = await fetch('http://localhost:8001/api/schema');
      const data = await response.json();
      setSchemaInfo(data);
      setConnectionStatus('connected');
      
      // Auto-trigger connection
      if (onConnection) {
        onConnection({
          name: data.database,
          type: 'Sample Database',
          status: 'connected'
        });
      }
    } catch (error) {
      console.error('Failed to load schema:', error);
      setConnectionStatus('error');
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
        <div className={`connection-badge ${connectionStatus}`}>
          <span className="badge-dot"></span>
          {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {schemaInfo && (
        <div className="schema-content">
          <div className="database-info">
            <div className="info-card">
              <div className="card-header">
                <h3>
                  <span className="card-icon">📊</span>
                  {schemaInfo.database}
                </h3>
                <span className="table-count">{schemaInfo.tables.length} tables</span>
              </div>
              <p className="database-description">
                Sample HR database with employee, department, and project data
              </p>
            </div>
          </div>

          <div className="tables-grid">
            {schemaInfo.tables.map((table, index) => (
              <div key={table.name} className="table-card">
                <div className="table-header">
                  <h4>
                    <span className="table-icon">📋</span>
                    {table.name}
                  </h4>
                  <span className="row-count">{table.row_count} rows</span>
                </div>
                
                <p className="table-description">{table.description}</p>
                
                <div className="columns-list">
                  <h5>Columns:</h5>
                  <div className="columns-grid">
                    {table.columns.map((column) => (
                      <div key={column.name} className="column-item">
                        <div className="column-header">
                          <span className="column-name">{column.name}</span>
                          {column.primary_key && (
                            <span className="primary-key-badge">PK</span>
                          )}
                        </div>
                        <span className="column-type">{column.type}</span>
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

          {schemaInfo.sample_queries && (
            <div className="sample-queries">
              <h3>
                <span className="section-icon">💡</span>
                Try These Sample Queries
              </h3>
              <div className="queries-grid">
                {schemaInfo.sample_queries.map((query, index) => (
                  <div key={index} className="query-card">
                    <span className="query-icon">❓</span>
                    <span className="query-text">{query}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .database-connector {
          padding: 2rem;
          height: 100%;
          overflow-y: auto;
        }

        .database-connector.loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-content {
          text-align: center;
          padding: 3rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .connector-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .connector-header h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .header-icon {
          font-size: 1.75rem;
        }

        .connection-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .connection-badge.connected {
          background: #f0fff4;
          color: #38a169;
          border: 1px solid #c6f6d5;
        }

        .connection-badge.disconnected {
          background: #fff5f5;
          color: #e53e3e;
          border: 1px solid #fed7d7;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .info-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .card-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .card-icon {
          font-size: 1.5rem;
        }

        .table-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .database-description {
          margin: 0;
          opacity: 0.9;
          line-height: 1.5;
        }

        .tables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .table-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }

        .table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .table-header h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .table-icon {
          font-size: 1.25rem;
        }

        .row-count {
          background: #edf2f7;
          color: #4a5568;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .table-description {
          color: #718096;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .columns-list h5 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .columns-grid {
          display: grid;
          gap: 0.75rem;
        }

        .column-item {
          background: #f7fafc;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border-left: 3px solid #667eea;
        }

        .column-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .column-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.875rem;
        }

        .primary-key-badge {
          background: #667eea;
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .column-type {
          color: #718096;
          font-size: 0.75rem;
          font-family: 'Monaco', 'Menlo', monospace;
          background: #edf2f7;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          margin-bottom: 0.25rem;
          display: inline-block;
        }

        .column-description {
          color: #a0aec0;
          font-size: 0.75rem;
          margin: 0;
          line-height: 1.4;
        }

        .sample-queries {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .sample-queries h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .section-icon {
          font-size: 1.25rem;
        }

        .queries-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 0.75rem;
        }

        .query-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .query-card:hover {
          background: #667eea;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .query-icon {
          font-size: 1rem;
          opacity: 0.7;
        }

        .query-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .database-connector {
            padding: 1rem;
          }

          .connector-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .tables-grid {
            grid-template-columns: 1fr;
          }

          .queries-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DatabaseConnector;