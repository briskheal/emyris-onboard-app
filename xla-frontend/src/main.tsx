import axios from 'axios';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Something went wrong in the React App.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            <summary>Click to view error details</summary>
            <br/>
            {this.state.error && this.state.error.toString()}
            <br/>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}


// Global Axios Interceptor for JWT
axios.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('xl_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error: any) => Promise.reject(error));


// Global Response Interceptor for 401 Unauthorized
axios.interceptors.response.use((response) => response, (error) => {
    if (error.response && (error.response.status === 401)) {
        localStorage.removeItem('xl_token');
        localStorage.removeItem('user');
        localStorage.removeItem('xl_user');
        window.location.href = '/xla/login';
    }
    return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
