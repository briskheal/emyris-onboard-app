import axios from 'axios';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Axios Interceptor for JWT
axios.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('xl_token');
    if (token && config.headers) {
        config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
}, (error: any) => Promise.reject(error));

axios.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('xl_token');
        localStorage.removeItem('xl_user');
        window.location.href = '/xl/login';
    }
    return Promise.reject(error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
