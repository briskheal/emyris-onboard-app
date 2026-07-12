import React, { useState } from 'react';

const Login = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Direct call to existing Express API
      const res = await fetch('/api/applicant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), pin: pin.trim() })
      });
      const data = await res.json();
      
      if (data.success && data.applicant) {
        // Pass applicant back to App.jsx to decide what view to show
        onLoginSuccess(data.applicant);
      } else {
        setError(data.message || 'Login failed. Invalid Email or PIN.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backButton} onClick={() => onNavigate('landing')}>
            ← Back
          </button>
          <h2 style={styles.title}>Secure Login</h2>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Registered Email</label>
            <input 
              type="email" 
              required 
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Secure PIN</label>
            <input 
              type="password" 
              required 
              style={styles.input}
              placeholder="Enter your 4-6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Verifying...' : 'Login Securely'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <span style={styles.link} onClick={() => onNavigate('register')}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '20px',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '30px'
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0 0 10px 0',
    fontSize: '14px'
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '24px'
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left'
  },
  label: {
    color: '#cbd5e1',
    fontSize: '14px'
  },
  input: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  footerText: {
    color: '#94a3b8',
    marginTop: '20px',
    fontSize: '14px',
    textAlign: 'center'
  },
  link: {
    color: '#3b82f6',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};

export default Login;
