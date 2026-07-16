import React, { useState } from 'react';

const styles = {
  container: {
    padding: '20px',
    color: '#fff'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 10px 0',
    color: 'var(--primary)'
  },
  subtitle: {
    color: 'var(--text-muted)',
    margin: 0,
    fontSize: '1.1rem'
  },
  emptyBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '50px 20px',
    textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cardTitle: {
    margin: '0 0 10px 0',
    fontSize: '1.2rem',
    color: '#fff'
  },
  cardDate: {
    margin: '0',
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  },
  viewerOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px'
  },
  viewerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '2rem',
    cursor: 'pointer'
  },
  viewerContent: {
    flex: 1,
    background: '#fff',
    borderRadius: '8px',
    overflowY: 'auto',
    padding: '40px',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    color: '#000'
  }
};

export default function MyLettersView({ applicant }) {
  const [viewingLetter, setViewingLetter] = useState(null);

  const letters = applicant?.issuedLetters || [];

  const formatType = (type) => {
    if (!type) return 'Document';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Official Letters</h2>
        <p style={styles.subtitle}>View and download your official documents and letters issued by HR.</p>
      </div>

      {letters.length === 0 ? (
        <div style={styles.emptyBox}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📄</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>No Letters Issued Yet</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Your official documents will appear here once HR publishes them.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {letters.map((letter, i) => (
            <div key={i} style={styles.card} onClick={() => setViewingLetter(letter)}
                 onMouseOver={e => e.currentTarget.style.borderColor='var(--primary)'}
                 onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ fontSize: '2rem' }}>📄</div>
                <div>
                  <h4 style={styles.cardTitle}>{formatType(letter.type)}</h4>
                  <p style={styles.cardDate}>Issued: {new Date(letter.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingLetter && (
        <div style={styles.viewerOverlay}>
          <div style={styles.viewerHeader}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>{formatType(viewingLetter.type)}</h3>
            <button style={styles.closeBtn} onClick={() => setViewingLetter(null)}>&times;</button>
          </div>
          <div style={styles.viewerContent}>
            <style>
              {`
                  .letter-content-render img[style*="100%"][style*="absolute"] {
                      display: none !important;
                  }
              `}
            </style>
            <div 
                className="letter-content-render"
                dangerouslySetInnerHTML={{ __html: (viewingLetter.data || '').replace(/<img[^>]+style=["'][^"']*position:\s*absolute[^"']*["'][^>]*>/gi, '') }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
