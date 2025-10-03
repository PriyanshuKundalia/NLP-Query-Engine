import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MetricsDashboard.css';

const MetricsDashboard = ({ activeConnection }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      if (response.data.success) {
        setStats(response.data.statistics);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await axios.post('/api/system/cache/clear');
      alert('Cache cleared successfully!');
      loadStats(); // Refresh stats
    } catch (error) {
      alert('Failed to clear cache: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="metrics-dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  const renderMetricCard = (title, value, icon, description, color = 'primary') => (
    <div className={`metric-card ${color}`}>
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {description && <div className="metric-description">{description}</div>}
    </div>
  );

  const queryEngineStats = stats?.query_engine || {};
  const cacheStats = stats?.cache || {};

  return (
    <div className="metrics-dashboard">
      <div className="dashboard-header">
        <h2>📈 System Metrics</h2>
        <div className="dashboard-actions">
          <button onClick={loadStats} className="btn btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={clearCache} className="btn btn-danger">
            🗑️ Clear Cache
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      <div className="metrics-grid">
        {/* Query Engine Metrics */}
        <div className="metrics-section">
          <h3>🔍 Query Engine Performance</h3>
          <div className="metrics-row">
            {renderMetricCard(
              'Total Queries',
              queryEngineStats.total_queries || 0,
              '📊',
              'Queries processed since startup'
            )}
            
            {renderMetricCard(
              'Success Rate',
              `${stats?.success_rate?.toFixed(1) || 0}%`,
              '✅',
              'Percentage of successful queries',
              stats?.success_rate > 80 ? 'success' : stats?.success_rate > 60 ? 'warning' : 'danger'
            )}
            
            {renderMetricCard(
              'Avg Response Time',
              `${(queryEngineStats.avg_execution_time * 1000).toFixed(0) || 0}ms`,
              '⏱️',
              'Average query execution time'
            )}
            
            {renderMetricCard(
              'Cache Hit Rate',
              `${stats?.cache_hit_rate?.toFixed(1) || 0}%`,
              '💾',
              'Percentage of queries served from cache',
              stats?.cache_hit_rate > 20 ? 'success' : 'info'
            )}
          </div>
        </div>

        {/* Cache Metrics */}
        <div className="metrics-section">
          <h3>💾 Pattern Cache Statistics</h3>
          <div className="metrics-row">
            {renderMetricCard(
              'Cache Size',
              cacheStats.cache_size || 0,
              '📦',
              'Number of cached query patterns'
            )}
            
            {renderMetricCard(
              'Cache Hits',
              cacheStats.cache_hits || 0,
              '🎯',
              'Successful cache retrievals'
            )}
            
            {renderMetricCard(
              'Pattern Matches',
              cacheStats.pattern_matches || 0,
              '🔗',
              'Similar pattern matches found'
            )}
            
            {renderMetricCard(
              'Successful Patterns',
              cacheStats.successful_patterns || 0,
              '🏆',
              'Unique successful query patterns',
              'success'
            )}
          </div>
        </div>

        {/* Pipeline Performance */}
        {queryEngineStats.pipeline_stage_times && (
          <div className="metrics-section">
            <h3>🔧 Pipeline Stage Performance</h3>
            <div className="pipeline-times">
              {Object.entries(queryEngineStats.pipeline_stage_times).map(([stage, time]) => (
                <div key={stage} className="pipeline-stage">
                  <span className="stage-name">
                    {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="stage-time">{(time * 1000).toFixed(1)}ms</span>
                  <div className="stage-bar">
                    <div 
                      className="stage-fill" 
                      style={{ width: `${Math.min((time / 0.1) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Health */}
        <div className="metrics-section">
          <h3>🔋 System Health</h3>
          <div className="health-indicators">
            <div className={`health-indicator ${queryEngineStats.total_queries > 0 ? 'healthy' : 'warning'}`}>
              <span className="indicator-icon">
                {queryEngineStats.total_queries > 0 ? '🟢' : '🟡'}
              </span>
              <span className="indicator-text">
                Query Engine: {queryEngineStats.total_queries > 0 ? 'Active' : 'Idle'}
              </span>
            </div>
            
            <div className={`health-indicator ${cacheStats.cache_size > 0 ? 'healthy' : 'info'}`}>
              <span className="indicator-icon">
                {cacheStats.cache_size > 0 ? '🟢' : '🔵'}
              </span>
              <span className="indicator-text">
                Pattern Cache: {cacheStats.cache_size > 0 ? 'Learning' : 'Empty'}
              </span>
            </div>
            
            <div className={`health-indicator ${activeConnection ? 'healthy' : 'warning'}`}>
              <span className="indicator-icon">
                {activeConnection ? '🟢' : '🟡'}
              </span>
              <span className="indicator-text">
                Database: {activeConnection ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Popular Patterns */}
        {stats?.popular_patterns && stats.popular_patterns.length > 0 && (
          <div className="metrics-section full-width">
            <h3>🔥 Popular Query Patterns</h3>
            <div className="popular-patterns">
              {stats.popular_patterns.slice(0, 5).map((pattern, index) => (
                <div key={pattern.pattern_id} className="pattern-item">
                  <div className="pattern-rank">#{index + 1}</div>
                  <div className="pattern-info">
                    <div className="pattern-sql">{pattern.sql_template}</div>
                    <div className="pattern-meta">
                      <span className="usage-count">Used {pattern.success_count} times</span>
                      <span className="confidence">
                        {(pattern.avg_confidence * 100).toFixed(0)}% avg confidence
                      </span>
                      <span className="last-used">
                        Last used: {new Date(pattern.last_used).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboard;