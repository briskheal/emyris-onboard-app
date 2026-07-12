import React, { useState } from 'react';

export const OfferLetterView = ({ applicant, companyData, onBackToDashboard, onRefreshApplicant }) => {
    const [joiningDate, setJoiningDate] = useState(applicant?.actualJoiningDate || applicant?.formData?.joiningDate || '');
    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptedSuccess, setAcceptedSuccess] = useState(applicant?.offerAccepted || false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleAcceptOffer = async (e) => {
        e.preventDefault();
        if (!joiningDate) {
            setErrorMsg("Please select or confirm your actual joining date before accepting.");
            return;
        }

        if (!window.confirm("Do you formally accept the Offer of Employment with the terms detailed above?")) {
            return;
        }

        setIsAccepting(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/accept-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: applicant.email,
                    actualJoiningDate: joiningDate
                })
            });
            const result = await res.json();
            if (result.success || res.ok) {
                setAcceptedSuccess(true);
                if (onRefreshApplicant) await onRefreshApplicant();
            } else {
                setErrorMsg(result.message || "Failed to accept offer. Please try again or contact HR.");
            }
        } catch (err) {
            console.error("Accept offer error:", err);
            setErrorMsg("Network error occurred while submitting your acceptance.");
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button type="button" onClick={onBackToDashboard} style={styles.backBtn}>
                    &larr; Back to Dashboard
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>📜</span>
                    <div>
                        <h2 style={styles.title}>Official Offer of Employment</h2>
                        <p style={styles.subtitle}>{companyData?.companyName || 'Emyris Biolifesciences'}</p>
                    </div>
                </div>
            </div>

            {acceptedSuccess && (
                <div style={styles.successBanner}>
                    <div style={{ fontSize: '2rem' }}>🎉</div>
                    <div>
                        <h3 style={{ margin: '0 0 6px 0', color: '#fff' }}>Offer Formally Accepted!</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#a7f3d0' }}>
                            Your acceptance has been recorded and transmitted to HR. Your confirmed Joining Date is: <strong>{joiningDate || applicant?.actualJoiningDate}</strong>.
                        </p>
                    </div>
                </div>
            )}

            {errorMsg && (
                <div style={styles.errorBanner}>
                    <span>⚠️ {errorMsg}</span>
                    <button onClick={() => setErrorMsg('')} style={styles.closeBtn}>&times;</button>
                </div>
            )}

            {/* Offer Letter Document Viewer */}
            <div style={styles.letterBox}>
                {applicant?.offerLetterData ? (
                    <div 
                        className="letter-content-render" 
                        style={styles.letterContent}
                        dangerouslySetInnerHTML={{ __html: applicant.offerLetterData }} 
                    />
                ) : (
                    <div style={styles.placeholderBox}>
                        <span style={{ fontSize: '2.5rem' }}>⌛</span>
                        <h3 style={{ color: '#fff', margin: '10px 0' }}>Offer Letter Under Preparation</h3>
                        <p style={{ color: '#94a3b8', margin: 0, maxWidth: '400px', textAlign: 'center' }}>
                            HR is currently reviewing your profile and finalizing your formal offer details. Please check back shortly or contact your HR coordinator.
                        </p>
                    </div>
                )}
            </div>

            {/* Acceptance Action Block */}
            {applicant?.offerLetterData && !acceptedSuccess && (
                <form onSubmit={handleAcceptOffer} style={styles.acceptCard}>
                    <h4 style={styles.acceptTitle}>✍️ Formal Acceptance & Confirmation of Joining</h4>
                    <p style={styles.acceptSub}>
                        Please confirm your exact date of reporting and digitally acknowledge acceptance of these employment terms.
                    </p>

                    <div style={styles.formRow}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <label style={styles.label}>Confirmed Date of Joining (ADOJ)*</label>
                            <input 
                                type="date" 
                                value={joiningDate} 
                                onChange={(e) => setJoiningDate(e.target.value)} 
                                required 
                                style={styles.input}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                            <button 
                                type="submit" 
                                disabled={isAccepting || !joiningDate} 
                                style={styles.acceptBtn}
                            >
                                {isAccepting ? "⌛ Recording Acceptance..." : "✅ I Accept This Offer of Employment"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        paddingBottom: '20px'
    },
    backBtn: {
        width: 'fit-content',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        color: '#cbd5e1',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '500',
        transition: 'all 0.2s ease'
    },
    title: {
        fontSize: '1.6rem',
        fontWeight: '800',
        color: '#fff',
        margin: '0 0 4px 0'
    },
    subtitle: {
        fontSize: '0.9rem',
        color: '#94a3b8',
        margin: 0
    },
    successBanner: {
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
        border: '1px solid #10b981',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    errorBanner: {
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid #ef4444',
        color: '#fca5a5',
        padding: '12px 16px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.9rem'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'inherit',
        fontSize: '1.25rem',
        cursor: 'pointer'
    },
    letterBox: {
        background: '#fff',
        color: '#1e293b',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column'
    },
    letterContent: {
        lineHeight: '1.6',
        fontSize: '0.95rem'
    },
    placeholderBox: {
        background: '#0f172a',
        color: '#fff',
        borderRadius: '12px',
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    },
    acceptCard: {
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '16px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    acceptTitle: {
        fontSize: '1.15rem',
        fontWeight: '700',
        color: '#fff',
        margin: 0
    },
    acceptSub: {
        fontSize: '0.88rem',
        color: '#94a3b8',
        margin: 0
    },
    formRow: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        marginTop: '10px'
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#cbd5e1'
    },
    input: {
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        color: '#fff',
        padding: '12px 14px',
        borderRadius: '10px',
        fontSize: '0.95rem',
        outline: 'none'
    },
    acceptBtn: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        border: 'none',
        padding: '13px 26px',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '0.95rem',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
        transition: 'transform 0.1s ease',
        width: '100%'
    }
};
