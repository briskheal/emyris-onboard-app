import React, { useState, useEffect } from 'react';

const Dashboard = ({ applicant, onLogout }) => {
    const [pendingExams, setPendingExams] = useState([]);

    useEffect(() => {
        if (applicant && applicant.pendingExams) {
            try {
                const exams = typeof applicant.pendingExams === 'string' 
                    ? JSON.parse(applicant.pendingExams) 
                    : applicant.pendingExams;
                setPendingExams(exams);
            } catch (e) {
                console.error("Failed to parse pendingExams in React:", e);
            }
        }
    }, [applicant]);

    // Handle exam launch by bridging back to the Vanilla JS function
    const handleLaunchExam = (exam) => {
        if (window.launchOngoingExam) {
            window.launchOngoingExam(exam);
        } else {
            alert("Error: Exam launcher not found.");
        }
    };

    if (!applicant) return <div>Loading...</div>;

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.headerCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={styles.welcomeText}>Welcome back, {applicant.fullName}!</h2>
                        <p style={styles.statusText}>Current Status: <span style={styles.statusBadge}>{applicant.status}</span></p>
                    </div>
                    {onLogout && (
                        <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
                    )}
                </div>
                
                <div style={styles.detailsGrid}>
                    <p><strong>Email:</strong> {applicant.email}</p>
                    <p><strong>Phone:</strong> {applicant.phone}</p>
                    <p><strong>Division:</strong> {applicant.division || 'N/A'}</p>
                    <p><strong>HQ:</strong> {applicant.hq || 'N/A'}</p>
                </div>
            </div>

            <div style={styles.actionSection}>
                <h3 style={styles.sectionTitle}>Your Action Items</h3>
                
                {['draft', 'registered', 'rejected', 'onboarding', 'submitted', 'approved'].includes(applicant.status) && !applicant.offerAccepted && (
                    <div style={styles.formCard}>
                        <div style={styles.examInfo}>
                            <h4 style={styles.examTitle}>Onboarding Profile ({applicant.status.toUpperCase()})</h4>
                            <p style={styles.examDetail}>
                                {['submitted', 'approved'].includes(applicant.status) 
                                    ? 'Your profile has been submitted. You can still review or update your personal information and documents.' 
                                    : 'Please complete your onboarding details and submit.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (window.mountReactApp) window.mountReactApp('onboardingForm', applicant);
                            }}
                            style={styles.formButton}
                        >
                            {['submitted', 'approved'].includes(applicant.status) ? '📝 Update Personal Info & Docs' : '📝 Continue Form'}
                        </button>
                    </div>
                )}

                {(applicant.offerLetterData || applicant.offerAccepted || ['selected', 'joined', 'confirmed'].includes(applicant.status)) && (
                    <div style={styles.offerCard}>
                        <div style={styles.examInfo}>
                            <h4 style={styles.examTitle}>🎉 Official Offer of Employment</h4>
                            <p style={styles.examDetail}>
                                {applicant.offerAccepted ? '✅ You have formally accepted this offer of employment.' : '📜 Your offer letter and joining terms are ready for review and digital signature.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (window.mountReactApp) window.mountReactApp('offerLetter', applicant);
                            }}
                            style={applicant.offerAccepted ? styles.offerAcceptedButton : styles.offerButton}
                        >
                            {applicant.offerAccepted ? '👀 View Accepted Offer Letter' : '✍️ Review & Accept Offer Letter 🚀'}
                        </button>
                    </div>
                )}

                {pendingExams.length === 0 && !applicant.offerLetterData && !applicant.offerAccepted && !['draft', 'registered', 'rejected', 'onboarding', 'selected', 'joined', 'confirmed'].includes(applicant.status) ? (
                    <div style={styles.emptyState}>
                        <p>You have no pending action items at this time.</p>
                    </div>
                ) : null}

                {pendingExams.length > 0 && (
                    <div style={styles.examList}>
                        {pendingExams.map((exam, index) => (
                            <div key={index} style={styles.examCard}>
                                <div style={styles.examInfo}>
                                    <h4 style={styles.examTitle}>{exam.targetProduct} Assessment</h4>
                                    <p style={styles.examDetail}>Scheduled: {exam.examDate}</p>
                                </div>
                                <button 
                                    onClick={() => handleLaunchExam(exam)}
                                    style={styles.examButton}
                                >
                                    🚀 Take Scheduled Exam
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* We will add forms and offers here in future phases */}
        </div>
    );
};

// Inline styles for Phase 1/2 to match the aesthetic without complex setup yet
const styles = {
    dashboardContainer: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif"
    },
    headerCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        backdropFilter: 'blur(10px)'
    },
    welcomeText: {
        margin: '0 0 10px 0',
        fontSize: '24px',
        color: '#fff'
    },
    statusText: {
        color: '#aaa',
        marginBottom: '20px'
    },
    statusBadge: {
        background: '#3b82f6',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        color: '#ddd',
        fontSize: '14px'
    },
    actionSection: {
        marginTop: '30px'
    },
    sectionTitle: {
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px',
        marginBottom: '20px'
    },
    examList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    examCard: {
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    formCard: {
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    examTitle: {
        margin: '0 0 5px 0',
        color: '#10b981',
        fontSize: '18px'
    },
    examDetail: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '14px'
    },
    examButton: {
        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
    },
    formButton: {
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
    },
    offerCard: {
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(16, 185, 129, 0.5)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    offerButton: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
    },
    offerAcceptedButton: {
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    emptyState: {
        background: 'rgba(255,255,255,0.02)',
        padding: '30px',
        textAlign: 'center',
        borderRadius: '12px',
        color: '#64748b',
        border: '1px dashed rgba(255,255,255,0.1)'
    },
    logoutButton: {
        background: 'transparent',
        color: '#ef4444',
        border: '1px solid #ef4444',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer'
    }
};

export default Dashboard;
