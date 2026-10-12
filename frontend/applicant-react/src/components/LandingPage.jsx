import React, { useState } from 'react';

const LandingPage = ({ onNavigate, companyData }) => {
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Invalid code contact to hradmin@emyrishr.in.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('emyris_reg_access_code', cleanCode);
        onNavigate('register');
      } else {
        setError(data.message || 'Invalid code contact to hradmin@emyrishr.in.');
      }
    } catch (err) {
      setError('Invalid code contact to hradmin@emyrishr.in.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          {companyData?.logo ? (
            <img src={companyData.logo} alt="Logo" style={styles.logo} />
          ) : (
            <div style={styles.logoFallback}>{companyData?.name ? companyData.name[0] : 'E'}</div>
          )}
        </div>
        <h1 style={styles.title}>{companyData?.name || 'Emyris Biolifesciences'}</h1>
        
        {!showAccessForm ? (
          <>
            <p style={styles.subtitle}>Welcome to the Applicant Portal</p>
            
            <div style={styles.buttonGroup}>
              <button 
                style={styles.primaryButton}
                onClick={() => onNavigate('login')}
              >
                Existing User Login
              </button>
              <button 
                style={styles.outlineButton}
                onClick={() => {
                  setError('');
                  setAccessCode('');
                  setShowAccessForm(true);
                }}
              >
                New Applicant Registration
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'left', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <button 
                type="button"
                onClick={() => setShowAccessForm(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
              >
                ← Back
              </button>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>Access Verification</span>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '18px', textAlign: 'center', lineHeight: '1.4' }}>
              Please enter your HR Access Code to proceed with registration.
            </p>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                marginBottom: '16px',
                textAlign: 'center',
                fontWeight: '600',
                lineHeight: '1.4'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                  HR Access Code*
                </label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter HR Access Code"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit" 
                style={{
                  ...styles.primaryButton,
                  width: '100%',
                  opacity: verifying ? 0.7 : 1,
                  cursor: verifying ? 'not-allowed' : 'pointer'
                }}
                disabled={verifying}
              >
                {verifying ? 'Verifying...' : 'Verify & Proceed ➔'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
              Access code is issued by Emyris HR.<br />Need code? Contact <span style={{ color: '#38bdf8' }}>hradmin@emyrishr.in</span>
            </div>
          </div>
        )}
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
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  },
  logoContainer: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center'
  },
  logoFallback: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#fff',
    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
  },
  logo: {
    width: '80px',
    height: '80px',
    objectFit: 'contain'
  },
  title: {
    color: '#fff',
    fontSize: '28px',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#94a3b8',
    marginBottom: '30px'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  outlineButton: {
    background: 'transparent',
    color: '#10b981',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #10b981',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default LandingPage;
