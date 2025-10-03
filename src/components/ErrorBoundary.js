import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          margin: '20px',
          color: '#991b1b'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>🚨 Something went wrong</h2>
            <p style={{ marginBottom: '24px', color: '#7f1d1d' }}>
              There was an error rendering this component. This is usually caused by invalid data.
            </p>
            <details style={{ 
              textAlign: 'left', 
              background: 'white', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #fed7d7'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '12px' }}>
                Error Details (for developers)
              </summary>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.error && this.state.error.toString()}
              </pre>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                padding: '12px 24px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;