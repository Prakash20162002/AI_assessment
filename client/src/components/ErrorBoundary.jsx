import React from 'react';
import { AlertTriangle, RefreshCw, LogIn, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DEVPHOENIX_ERROR_BOUNDARY]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#09090b',
          color: '#f8f8fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: 'rgba(18, 18, 24, 0.95)',
            border: '1px solid rgba(230, 57, 70, 0.3)',
            borderRadius: 24,
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(230, 57, 70, 0.12)',
              border: '1px solid rgba(230, 57, 70, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#e63946'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
              Something Went Wrong
            </h2>

            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
              We encountered an unexpected error while loading this page. Don't worry, your session data is safe.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #e63946, #d62828)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> Try Again
              </button>

              <a
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8f8fa',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <LogIn size={16} /> Back to Login
              </a>

              <a
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 13,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <Home size={14} /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
