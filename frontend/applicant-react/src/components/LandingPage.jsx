import React from 'react';

const LandingPage = ({ onNavigate, companyData }) => {
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
            onClick={() => onNavigate('register')}
          >
            New Applicant Registration
          </button>
        </div>
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
