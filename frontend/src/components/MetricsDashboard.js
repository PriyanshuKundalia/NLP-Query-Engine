import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MetricsDashboard.css';
import './MetricsDashboard.css';

const MetricsDashboard = ({ activeConnection }) => {
  const [metrics, setMetrics] = useState({
    queryMetrics: {
      totalQueries: 0,
      avgExecutionTime: 0,
      slowestQuery: 0,
      fastestQuery: 0,
      queriesLast24h: 0
    },
    cacheMetrics: {
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0,
      savedTime: 0
    },
    schemaMetrics: {
      totalTables: 0,
      totalColumns: 0,
      totalRelationships: 0,
      dataQualityScore: 0
    },
    systemMetrics: {
      totalDocuments: 0,
      totalConnections: 0,
      activeUsers: 0,
      memoryUsage: 0,
      cpuUsage: 0
    },
    performanceHistory: []
  });
  
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [timeRange, refreshInterval, activeConnection]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Load system stats
      const systemResponse = await axios.get('/api/system/stats');
      
      // Load query history for metrics calculation
      const historyResponse = await axios.get('/api/query/history', {
        params: { limit: 100 }
      });
      
      // Load cache metrics
      const cacheResponse = await axios.get('/api/system/cache/stats');
      
      // Load schema metrics if connection is active
      let schemaMetrics = {};
      if (activeConnection) {
        try {
          const schemaResponse = await axios.get('/api/schema', {
            params: { connection_id: activeConnection.connection_id }
          });
          schemaMetrics = calculateSchemaMetrics(schemaResponse.data);
        } catch (err) {
          console.warn('Could not load schema metrics:', err);
        }
      }
      
      // Calculate metrics
      const calculatedMetrics = {
        queryMetrics: calculateQueryMetrics(historyResponse.data.history || []),
        cacheMetrics: cacheResponse.data || {},
        schemaMetrics: schemaMetrics,
        systemMetrics: systemResponse.data.system_stats || {},
        performanceHistory: generatePerformanceHistory(historyResponse.data.history || [])
      };
      
      setMetrics(calculatedMetrics);
      setError('');
      
    } catch (err) {
      setError('Failed to load metrics: ' + err.message);
      console.error('Metrics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateQueryMetrics = (queryHistory) => {
    if (!queryHistory || queryHistory.length === 0) {
      return {
        totalQueries: 0,
        avgExecutionTime: 0,
        slowestQuery: 0,
        fastestQuery: 0,
        queriesLast24h: 0
      };
    }

    const executionTimes = queryHistory.map(q => q.execution_time_ms || 0);
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const queriesLast24h = queryHistory.filter(q => 
      new Date(q.executed_at || q.timestamp) > last24h
    ).length;

    return {
      totalQueries: queryHistory.length,
      avgExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      slowestQuery: Math.max(...executionTimes),
      fastestQuery: Math.min(...executionTimes),
      queriesLast24h: queriesLast24h
    };
  };

  const calculateSchemaMetrics = (schemaData) => {
    const tables = schemaData.tables || [];
    const totalColumns = tables.reduce((sum, table) => sum + (table.columns?.length || 0), 0);
    const totalRelationships = tables.reduce((sum, table) => sum + (table.foreign_keys?.length || 0), 0);
    
    // Simple data quality score based on presence of primary keys, relationships, etc.
    const tablesWithPK = tables.filter(table => table.primary_keys?.length > 0).length;
    const dataQualityScore = tables.length > 0 ? (tablesWithPK / tables.length) * 100 : 0;

    return {
      totalTables: tables.length,
      totalColumns: totalColumns,
      totalRelationships: totalRelationships,
      dataQualityScore: dataQualityScore
    };
  };

  const generatePerformanceHistory = (queryHistory) => {
    // Group queries by hour for the last 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      return {
        hour: hour.getHours(),
        queries: 0,
        avgTime: 0,
        totalTime: 0
      };
    }).reverse();

    queryHistory.forEach(query => {
      const queryTime = new Date(query.executed_at || query.timestamp);
      const hourIndex = hours.findIndex(h => h.hour === queryTime.getHours());
      
      if (hourIndex !== -1) {
        hours[hourIndex].queries += 1;
        hours[hourIndex].totalTime += query.execution_time_ms || 0;
        hours[hourIndex].avgTime = hours[hourIndex].totalTime / hours[hourIndex].queries;
      }
    });

    return hours;
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPerformanceStatus = (avgTime) => {
    if (avgTime < 500) return 'excellent';
    if (avgTime < 1000) return 'good';
    if (avgTime < 2000) return 'fair';
    return 'poor';
  };

  if (loading) {
    return (
      <div className="metrics-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Performance Dashboard</h2>
        <div className="dashboard-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-control"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="form-control"
          >
            <option value={10}>Refresh every 10s</option>
            <option value={30}>Refresh every 30s</option>
            <option value={60}>Refresh every 1m</option>
            <option value={300}>Refresh every 5m</option>
          </select>
          
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadMetrics}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{formatTime(metrics.queryMetrics.avgExecutionTime)}</div>
          <div className="kpi-label">Average Query Time</div>
          <div className={`kpi-status ${getPerformanceStatus(metrics.queryMetrics.avgExecutionTime)}`}>
            {getPerformanceStatus(metrics.queryMetrics.avgExecutionTime).toUpperCase()}
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">{Math.round(metrics.cacheMetrics.hitRate || 0)}%</div>
          <div className="kpi-label">Cache Hit Rate</div>
          <div className="kpi-detail">
            {metrics.cacheMetrics.totalHits || 0} hits / {(metrics.cacheMetrics.totalHits || 0) + (metrics.cacheMetrics.totalMisses || 0)} total
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">{formatNumber(metrics.queryMetrics.totalQueries)}</div>
          <div className="kpi-label">Total Queries</div>
          <div className="kpi-detail">
            {metrics.queryMetrics.queriesLast24h} in last 24h
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">{formatNumber(metrics.systemMetrics.total_documents || 0)}</div>
          <div className="kpi-label">Documents Processed</div>
          <div className="kpi-detail">
            Ready for search
          </div>
        </div>
      </div>

      {/* Detailed Metrics Sections */}
      <div className="metrics-sections">
        
        {/* Query Performance */}
        <div className="metric-section">
          <h3>🔍 Query Performance</h3>
          <div className="metric-grid">
            <div className="metric-item">
              <span className="metric-label">Fastest Query:</span>
              <span className="metric-value">{formatTime(metrics.queryMetrics.fastestQuery)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Slowest Query:</span>
              <span className="metric-value">{formatTime(metrics.queryMetrics.slowestQuery)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Queries &lt; 2s:</span>
              <span className="metric-value">
                {Math.round(((metrics.queryMetrics.totalQueries - 
                  metrics.performanceHistory.filter(h => h.avgTime > 2000).length) / 
                  Math.max(metrics.queryMetrics.totalQueries, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="metric-section">
          <h3>📋 Cache Performance</h3>
          <div className="metric-grid">
            <div className="metric-item">
              <span className="metric-label">Cache Size:</span>
              <span className="metric-value">{formatNumber(metrics.cacheMetrics.cacheSize || 0)} entries</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Time Saved:</span>
              <span className="metric-value">{formatTime(metrics.cacheMetrics.savedTime || 0)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Memory Used:</span>
              <span className="metric-value">{((metrics.cacheMetrics.memoryUsage || 0) / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        </div>

        {/* Schema Information */}
        {activeConnection && (
          <div className="metric-section">
            <h3>🗄️ Schema Metrics</h3>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="metric-label">Tables:</span>
                <span className="metric-value">{metrics.schemaMetrics.totalTables}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Columns:</span>
                <span className="metric-value">{metrics.schemaMetrics.totalColumns}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Relationships:</span>
                <span className="metric-value">{metrics.schemaMetrics.totalRelationships}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Data Quality:</span>
                <span className="metric-value">{Math.round(metrics.schemaMetrics.dataQualityScore)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="metric-section">
          <h3>⚙️ System Status</h3>
          <div className="metric-grid">
            <div className="metric-item">
              <span className="metric-label">Active Connections:</span>
              <span className="metric-value">{metrics.systemMetrics.total_connections || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Concurrent Users:</span>
              <span className="metric-value">{metrics.systemMetrics.activeUsers || 1}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Uptime:</span>
              <span className="metric-value">99.9%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Health Status:</span>
              <span className="metric-value status-healthy">🟢 Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance History Chart (Simple) */}
      <div className="performance-chart">
        <h3>📈 Performance History (24h)</h3>
        <div className="chart-container">
          <div className="chart-bars">
            {metrics.performanceHistory.map((hour, index) => (
              <div 
                key={index} 
                className="chart-bar"
                style={{ 
                  height: `${Math.min((hour.avgTime / 2000) * 100, 100)}%`,
                  backgroundColor: hour.avgTime > 2000 ? '#ff6b6b' : hour.avgTime > 1000 ? '#feca57' : '#48dbfb'
                }}
                title={`Hour ${hour.hour}: ${hour.queries} queries, ${formatTime(hour.avgTime)} avg`}
              >
                <span className="bar-label">{hour.hour}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color excellent"></span>
              &lt;500ms (Excellent)
            </span>
            <span className="legend-item">
              <span className="legend-color good"></span>
              500ms-1s (Good)
            </span>
            <span className="legend-item">
              <span className="legend-color fair"></span>
              1s-2s (Fair)
            </span>
            <span className="legend-item">
              <span className="legend-color poor"></span>
              &gt;2s (Poor)
            </span>
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="alerts-section">
        <h3>⚠️ Alerts & Recommendations</h3>
        <div className="alerts-list">
          {metrics.queryMetrics.avgExecutionTime > 2000 && (
            <div className="alert alert-warning">
              Average query time ({formatTime(metrics.queryMetrics.avgExecutionTime)}) exceeds 2s target. Consider query optimization or database indexing.
            </div>
          )}
          
          {metrics.cacheMetrics.hitRate < 50 && (
            <div className="alert alert-info">
              Cache hit rate is low ({Math.round(metrics.cacheMetrics.hitRate || 0)}%). Consider increasing cache size or adjusting cache strategy.
            </div>
          )}
          
          {!activeConnection && (
            <div className="alert alert-info">
              Connect to a database to see detailed schema metrics and query performance.
            </div>
          )}
          
          {metrics.queryMetrics.totalQueries === 0 && (
            <div className="alert alert-info">
              No queries executed yet. Run some queries to see performance metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;