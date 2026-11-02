import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    padding: '20px',
    color: '#fff'
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px'
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 8px 0',
    color: 'var(--primary, #38bdf8)'
  },
  subtitle: {
    color: 'var(--text-muted, #94a3b8)',
    margin: 0,
    fontSize: '1rem'
  },
  badge: {
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600'
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative'
  },
  cardMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '14px'
  },
  cardTitle: {
    margin: '0 0 6px 0',
    fontSize: '1.15rem',
    color: '#fff',
    fontWeight: '600'
  },
  cardDate: {
    margin: '0',
    fontSize: '0.85rem',
    color: 'var(--text-muted, #94a3b8)'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '12px',
    marginTop: 'auto'
  },
  viewBtn: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  deleteBtn: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s'
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
    marginBottom: '15px',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto 15px auto'
  },
  modalActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    fontSize: '1.5rem',
    lineHeight: '1',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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

export default function MyLettersView({ applicant, companyData, onRefresh }) {
  const [lettersList, setLettersList] = useState(applicant?.issuedLetters || []);
  const [viewingLetter, setViewingLetter] = useState(null);
  const [viewingIndex, setViewingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);

  useEffect(() => {
    setLettersList(applicant?.issuedLetters || []);
  }, [applicant?.issuedLetters]);

  const formatType = (type) => {
    if (!type) return 'Document';
    if (type === 'appt') return 'Appointment Letter';
    if (type === 'offer') return 'Offer Letter';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleDeleteLetter = async (e, idx) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const letter = lettersList[idx];
    if (!letter) return;

    const label = formatType(letter.type);
    const dateStr = letter.issuedAt ? new Date(letter.issuedAt).toLocaleDateString() : '';
    const confirmMsg = `Are you sure you want to delete this ${label} (issued on ${dateStr})?\n\nThis will remove this upload permanently from the database to save space.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingIndex(idx);
      const email = applicant?.email;
      const res = await fetch('/api/applicant/delete-issued-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          index: idx,
          issuedAt: letter.issuedAt,
          type: letter.type
        })
      });

      const data = await res.json();
      if (data.success) {
        const updated = lettersList.filter((_, i) => i !== idx);
        setLettersList(updated);
        if (viewingIndex === idx || viewingLetter === letter) {
          setViewingLetter(null);
          setViewingIndex(null);
        } else if (viewingIndex !== null && viewingIndex > idx) {
          setViewingIndex(viewingIndex - 1);
        }
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
      } else {
        alert(data.message || 'Failed to delete letter');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting letter: ' + err.message);
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>My Official Letters</h2>
          <p style={styles.subtitle}>View, download, and manage your official documents and letters issued by HR.</p>
        </div>
        {lettersList.length > 0 && (
          <div style={styles.badge}>
            {lettersList.length} {lettersList.length === 1 ? 'Letter' : 'Letters'} Available
          </div>
        )}
      </div>

      {lettersList.length === 0 ? (
        <div style={styles.emptyBox}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📄</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>No Letters Found</h3>
          <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)' }}>No letters or issued documents are currently in your portal.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {lettersList.map((letter, i) => (
            <div 
              key={i} 
              style={styles.card} 
              onClick={() => { setViewingLetter(letter); setViewingIndex(i); }}
              onMouseOver={e => e.currentTarget.style.borderColor='var(--primary, #38bdf8)'}
              onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
            >
              <div style={styles.cardMain}>
                <div style={{ fontSize: '2.2rem' }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={styles.cardTitle}>{formatType(letter.type)}</h4>
                  <p style={styles.cardDate}>Issued: {letter.issuedAt ? new Date(letter.issuedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button 
                  style={styles.viewBtn}
                  onClick={(e) => { e.stopPropagation(); setViewingLetter(letter); setViewingIndex(i); }}
                >
                  👁️ View Letter
                </button>
                <button
                  style={{
                    ...styles.deleteBtn,
                    opacity: deletingIndex === i ? 0.6 : 1,
                    cursor: deletingIndex === i ? 'not-allowed' : 'pointer'
                  }}
                  disabled={deletingIndex === i}
                  onClick={(e) => handleDeleteLetter(e, i)}
                  title="Delete this letter to free up database storage"
                >
                  {deletingIndex === i ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingLetter && (
        <div style={styles.viewerOverlay}>
          <div style={styles.viewerHeader}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>{formatType(viewingLetter.type)}</h3>
            <div style={styles.modalActionRow}>
              <button
                style={{
                  ...styles.deleteBtn,
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  padding: '7px 14px'
                }}
                onClick={(e) => handleDeleteLetter(e, viewingIndex)}
                title="Delete this document from database"
              >
                🗑️ Delete Letter
              </button>
              <button style={styles.closeBtn} onClick={() => { setViewingLetter(null); setViewingIndex(null); }}>&times;</button>
            </div>
          </div>
          <div style={styles.viewerContent}>
            <style>
              {`
                  .letter-content-render img[style*="100%"][style*="absolute"] {
                      display: none !important;
                  }
              `}
            </style>
            <div style={{ position: 'relative', width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              {companyData?.activeLetterheadId && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(/api/public/asset/${companyData.activeLetterheadId})`,
                    backgroundSize: '100% 297mm',
                    backgroundRepeat: 'repeat-y',
                    backgroundPosition: 'top center',
                    zIndex: 0,
                    opacity: 1,
                    pointerEvents: 'none'
                  }}
                />
              )}
              <div 
                  className="letter-content-render"
                  style={{ 
                    position: 'relative', 
                    zIndex: 1, 
                    padding: `${companyData?.headerHeight !== undefined ? companyData.headerHeight : 65}mm 20mm ${companyData?.footerHeight !== undefined ? companyData.footerHeight : 25}mm` 
                  }}
                  dangerouslySetInnerHTML={{ __html: (viewingLetter.data || '').replace(/<img[^>]+style=["'][^"']*position:\s*absolute[^"']*["'][^>]*>/gi, '') }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
