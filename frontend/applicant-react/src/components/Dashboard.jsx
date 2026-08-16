import React, { useState, useEffect } from 'react';
import MyScoresTable from './MyScoresTable';
import PsychometricAssessment from './PsychometricAssessment';
import ExamRunner from './ExamRunner';
import OnboardingForm from './OnboardingForm';
import { OfferLetterView } from './OfferLetterView';
import VoiceStudio from './VoiceStudio';
import MyLettersView from './MyLettersView';
import ManageLeavePortal from './ManageLeavePortal';

const Dashboard = ({ applicant: initialApplicant, onLogout, companyData }) => {
    const [applicant, setApplicant] = useState(initialApplicant);
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pendingExams, setPendingExams] = useState([]);
    const [completedProducts, setCompletedProducts] = useState([]);
    const [activeExamContext, setActiveExamContext] = useState(null);
    const [isRapidLaunch, setIsRapidLaunch] = useState(false);

    useEffect(() => {
        setApplicant(initialApplicant);
        if (initialApplicant && initialApplicant.pendingExams) {
            try {
                const exams = typeof initialApplicant.pendingExams === 'string'
                    ? JSON.parse(initialApplicant.pendingExams)
                    : initialApplicant.pendingExams;
                setPendingExams(Array.isArray(exams) ? exams : []);
            } catch (e) {
                console.error("Failed to parse pendingExams in React:", e);
                setPendingExams([]);
            }
        }
    }, [initialApplicant]);

    // Auto-deploy Stage 1 & 2 screening upon login if not completed and not existing staff
    useEffect(() => {
        if (!applicant || applicant.isExistingStaff) return;
        if (!applicant.rapidTestCompleted) {
            setActiveExamContext({ targetProduct: 'Phase 1: Rapid Fire Screening' });
            setIsRapidLaunch(true);
            setActiveTab('runningExam');
        } else if (!applicant.psychometricTestCompleted) {
            setActiveTab('runningPsychometric');
        }
    }, [applicant?.email, applicant?.rapidTestCompleted, applicant?.psychometricTestCompleted, applicant?.isExistingStaff]);

    const refreshApplicantProfile = async () => {
        if (!applicant?.email) return null;
        try {
            const res = await fetch(`/api/applicant/profile?email=${encodeURIComponent(applicant.email)}`);
            const data = await res.json();
            if (data.success && data.applicant) {
                setApplicant(data.applicant);
                if (window.currentApplicant) window.currentApplicant = data.applicant;
                return data.applicant;
            }
        } catch (err) {
            console.error("Profile refresh error:", err);
        }
        return null;
    };

    const handleLaunchExam = (exam) => {
        setActiveExamContext(exam);
        setIsRapidLaunch(false);
        setActiveTab('runningExam');
    };

    const handleLaunchRapidFire = () => {
        if (applicant?.rapidTestCompleted) {
            setActiveTab('scores');
            return;
        }
        setActiveExamContext({ targetProduct: 'Phase 1: Rapid Fire Screening' });
        setIsRapidLaunch(true);
        setActiveTab('runningExam');
    };

    const handleExamCompleted = async (data) => {
        const latestApp = await refreshApplicantProfile() || applicant;
        setActiveExamContext(null);
        if (!latestApp?.isExistingStaff && !latestApp?.psychometricTestCompleted) {
            setActiveTab('runningPsychometric');
        } else {
            setActiveTab('scores');
        }
    };

    if (!applicant) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading Applicant Profile...</div>;

    // If currently taking an exam
    if (activeTab === 'runningExam') {
        return (
            <div style={styles.dashboardContainer}>
                <ExamRunner
                    applicant={applicant}
                    examData={activeExamContext}
                    isRapidFire={isRapidLaunch}
                    onComplete={handleExamCompleted}
                    onCancel={() => {
                        setActiveExamContext(null);
                        if (applicant?.rapidTestCompleted && !applicant?.psychometricTestCompleted) {
                            setActiveTab('runningPsychometric');
                        } else {
                            setActiveTab('scores');
                        }
                    }}
                />
            </div>
        );
    }

    // If currently taking psychometric assessment
    if (activeTab === 'runningPsychometric') {
        return (
            <div style={styles.dashboardContainer}>
                <PsychometricAssessment
                    applicant={applicant}
                    onComplete={handleExamCompleted}
                    onCancel={() => setActiveTab('scores')}
                />
            </div>
        );
    }

    // If viewing Digital Onboarding Form full screen
    if (activeTab === 'onboarding') {
        return (
            <div style={styles.dashboardContainer}>
                <div style={{ marginBottom: '16px' }}>
                    <button onClick={() => setActiveTab('overview')} style={styles.backButton}>
                        ← Back to Dashboard Overview
                    </button>
                </div>
                <OnboardingForm
                    applicant={applicant}
                    companyData={companyData}
                    onComplete={() => {
                        refreshApplicantProfile();
                        setActiveTab('overview');
                    }}
                />
            </div>
        );
    }

    // If viewing Offer Letter full screen
    if (activeTab === 'offer') {
        return (
            <div style={styles.dashboardContainer}>
                <div style={{ marginBottom: '16px' }}>
                    <button onClick={() => setActiveTab('overview')} style={styles.backButton}>
                        ← Back to Dashboard Overview
                    </button>
                </div>
                <OfferLetterView
                    applicant={applicant}
                    companyData={companyData}
                    onBackToDashboard={() => setActiveTab('overview')}
                    onRefreshApplicant={refreshApplicantProfile}
                />
            </div>
        );
    }

    // If viewing Manage Leave full screen
    if (activeTab === 'manage-leave') {
        return (
            <div style={styles.dashboardContainer}>
                <div style={{ marginBottom: '16px' }}>
                    <button onClick={() => setActiveTab('overview')} style={styles.backButton}>
                        ⬅️ Back to Dashboard Overview
                    </button>
                </div>
                <ManageLeavePortal applicant={applicant} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', flexDirection: 'column' }}>
            {/* Mobile Hamburger Header */}
            <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
                <button className="btn btn-outline" style={{ padding: '0.5rem', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <span style={{ fontSize: '1.2rem' }}>☰</span>
                </button>
                <h2 style={{ marginLeft: '1rem', color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>Applicant Portal</h2>
            </div>

            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                {/* Sidebar */}
                {(() => {
                    const isScreeningPending = !applicant?.isExistingStaff && (!applicant?.rapidTestCompleted || !applicant?.psychometricTestCompleted);
                    const handleTabClick = (tab) => {
                        if (isScreeningPending && tab !== 'overview' && tab !== 'exams') {
                            alert("⚠️ Stage 1 & 2 Screening and Psychometric Assessments must be completed before accessing other portal features. Please complete your assessments first.");
                            return;
                        }
                        setActiveTab(tab);
                        setMobileMenuOpen(false);
                    };

                    return (
                        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={styles.sidebar}>
                            <h2 style={{ marginBottom: '0.25rem', paddingLeft: '0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Applicant Portal</h2>
                            <p style={{ paddingLeft: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.75rem' }}>Emyris Biolifesciences</p>
                            
                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, width: '100%' }}>
                                <button style={activeTab === 'overview' ? styles.sidebarBtnActive : styles.sidebarBtn} onClick={() => handleTabClick('overview')}>
                                    🏠 <span style={styles.sidebarBtnText}>Profile Overview</span>
                                </button>
                                <button style={activeTab === 'exams' ? styles.sidebarBtnActive : styles.sidebarBtn} onClick={() => handleTabClick('exams')}>
                                    🎯 <span style={styles.sidebarBtnText}>Assigned Tests</span> {pendingExams.length > 0 && <span style={styles.badgeCount}>{pendingExams.length}</span>}
                                </button>
                                <button style={{ ...(activeTab === 'voice-studio' ? styles.sidebarBtnActive : styles.sidebarBtn), opacity: isScreeningPending ? 0.45 : 1, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }} onClick={() => handleTabClick('voice-studio')}>
                                    🎙️ <span style={styles.sidebarBtnText}>Voice Studio (AI)</span> {isScreeningPending ? '🔒' : ''}
                                </button>
                                <button style={{ ...(activeTab === 'scores' ? styles.sidebarBtnActive : styles.sidebarBtn), opacity: isScreeningPending ? 0.45 : 1, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }} onClick={() => handleTabClick('scores')}>
                                    🏆 <span style={styles.sidebarBtnText}>My Exam Scores</span> {isScreeningPending ? '🔒' : ''}
                                </button>
                                <button style={{ ...(activeTab === 'onboarding' ? styles.sidebarBtnActive : styles.sidebarBtn), opacity: isScreeningPending ? 0.45 : 1, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }} onClick={() => handleTabClick('onboarding')}>
                                    📝 <span style={styles.sidebarBtnText}>Digital Onboarding</span> {isScreeningPending ? '🔒' : ''}
                                </button>
                                <button style={{ ...(activeTab === 'offer' ? styles.sidebarBtnActive : styles.sidebarBtn), opacity: isScreeningPending ? 0.45 : 1, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }} onClick={() => handleTabClick('offer')}>
                                    ✍️ <span style={styles.sidebarBtnText}>Offer Letter Hub</span> {applicant?.offerAccepted ? '✅' : ''} {isScreeningPending ? '🔒' : ''}
                                </button>
                                <button style={{ ...(activeTab === 'letters' ? styles.sidebarBtnActive : styles.sidebarBtn), opacity: isScreeningPending ? 0.45 : 1, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }} onClick={() => handleTabClick('letters')}>
                                    📄 <span style={styles.sidebarBtnText}>My Official Letters</span> {isScreeningPending ? '🔒' : ''}
                                </button>
                                <button style={{ ...(activeTab === 'manage-leave' ? styles.sidebarBtnActive : styles.sidebarBtn), opacity: isScreeningPending ? 0.45 : 1, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }} onClick={() => handleTabClick('manage-leave')}>
                                    📅 <span style={styles.sidebarBtnText}>Manage Leave</span> {isScreeningPending ? '🔒' : ''}
                                </button>
                            </nav>
                            {onLogout && (
                                <button onClick={onLogout} style={{ ...styles.sidebarBtn, marginTop: 'auto', color: '#f87171' }}>
                                    🚪 <span style={styles.sidebarBtnText}>Sign Out</span>
                                </button>
                            )}
                        </aside>
                    );
                })()}

                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={styles.dashboardContainer}>
                        {/* Header Card (Details) */}
                        <div style={styles.headerCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h2 style={styles.welcomeText}>Welcome back, {applicant.fullName}!</h2>
                                    <p style={styles.statusText}>
                                        Current Status: <span style={styles.statusBadge}>{applicant.status || 'Registered'}</span>
                                        {applicant.refNo && <span style={{ marginLeft: '12px', color: '#cbd5e1' }}>| Ref: <strong>{applicant.refNo}</strong></span>}
                                    </p>
                                </div>
                            </div>
                            {/* Profile Grid */}
                            <div style={styles.detailsGrid}>
                                <div><span style={{ color: '#94a3b8' }}>Email:</span> <strong>{applicant.email}</strong></div>
                                <div><span style={{ color: '#94a3b8' }}>Phone:</span> <strong>{applicant.phone || 'N/A'}</strong></div>
                                <div><span style={{ color: '#94a3b8' }}>{['Joined (Probation)', 'Confirmed Employee', 'Confirmation Extended', 'joined'].includes(applicant.status) ? 'Role:' : 'Applied Role:'}</span> <strong>{['Joined (Probation)', 'Confirmed Employee', 'Confirmation Extended', 'joined'].includes(applicant.status) ? (applicant.appliedRole || applicant.role || 'Confirmed Employee') : (applicant.appliedRole || applicant.role || 'Onboarding Candidate')}</strong></div>
                                <div><span style={{ color: '#94a3b8' }}>HQ / Location:</span> <strong>{applicant.hq || 'N/A'}</strong></div>
                            </div>
                        </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (() => {
                const isScreeningPending = !applicant?.isExistingStaff && (!applicant?.rapidTestCompleted || !applicant?.psychometricTestCompleted);
                return (
                <div style={styles.tabContentCard}>
                    {isScreeningPending && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '1.8rem' }}>⚠️</span>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', color: '#fef08a', fontSize: '1.1rem' }}>Mandatory Screening Assessments in Progress</h4>
                                    <p style={{ margin: 0, color: '#f3f4f6', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        As a new applicant, **Stage 1 (Rapid Fire Screening)** and **Stage 2 (Psychometric Evaluation)** are mandatory and automatically deployed upon login. All other portal sections (Voice Studio, Onboarding Form, Offer Letter Hub) will unlock as soon as you complete both assessments.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
                                {!applicant?.rapidTestCompleted ? (
                                    <button onClick={handleLaunchRapidFire} style={{ ...styles.actionButtonGreen, fontWeight: 'bold' }}>
                                        ⚡ Launch Stage 1 Rapid Fire Test Now ➔
                                    </button>
                                ) : (
                                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '8px 14px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 'bold' }}>
                                        ✅ Stage 1 Rapid Fire Completed
                                    </span>
                                )}
                                {!applicant?.psychometricTestCompleted ? (
                                    <button onClick={() => setActiveTab('runningPsychometric')} style={{ ...styles.actionButtonPurple, fontWeight: 'bold' }}>
                                        🧠 Launch Stage 2 Psychometric Evaluation Now ➔
                                    </button>
                                ) : (
                                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '8px 14px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 'bold' }}>
                                        ✅ Stage 2 Psychometric Completed
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <h3 style={styles.sectionTitle}>⚡ Immediate Action Items & Milestones</h3>

                    {/* Step 1: Rapid Fire / Psychometric Screening */}
                    <div style={styles.milestoneCard}>
                        <div>
                            <h4 style={styles.milestoneTitle}>Stage 1 & 2: Screening & Psychometric Assessment</h4>
                            <p style={styles.milestoneDesc}>
                                Complete your Rapid Fire screening test and your Phase 2 Candidate Mindset & Psychometric evaluation.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={handleLaunchRapidFire} style={styles.actionButtonGreen}>
                                {applicant.rapidTestCompleted ? '✅ Rapid Fire Completed' : '⚡ Take Rapid Fire Test'}
                            </button>
                            <button onClick={() => setActiveTab('runningPsychometric')} style={styles.actionButtonPurple}>
                                {applicant.psychometricTestCompleted ? '✅ Psychometric Completed' : '🧠 Phase 2 Psychometric'}
                            </button>
                        </div>
                    </div>

                    {/* Voice Studio & Question Bank Milestone */}
                    <div style={{ ...styles.milestoneCard, border: '1px solid #a855f7', background: 'rgba(168, 85, 247, 0.08)', opacity: isScreeningPending ? 0.6 : 1 }}>
                        <div>
                            <h4 style={{ ...styles.milestoneTitle, color: '#d8b4fe' }}>🎙️ Qualification & Training: Doctor Detailing Voice Studio (`AI Lab`)</h4>
                            <p style={styles.milestoneDesc}>
                                Practice standardized detailing pitches, listen to sample female voice audio, and self-modulate your pitch with AI scoring.
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (isScreeningPending) {
                                    alert("⚠️ Please complete Stage 1 & 2 Screening before accessing Voice Studio.");
                                } else {
                                    setActiveTab('voice-studio');
                                }
                            }} 
                            style={{ ...styles.actionButtonPurple, background: isScreeningPending ? '#475569' : 'linear-gradient(135deg, #a855f7, #6366f1)', cursor: isScreeningPending ? 'not-allowed' : 'pointer' }}
                        >
                            🎙️ Open Voice Studio Lab {isScreeningPending ? '🔒' : '➔'}
                        </button>
                    </div>

                    {/* Step 2: Digital Onboarding & KYC */}
                    <div style={{ ...styles.milestoneCard, opacity: isScreeningPending ? 0.6 : 1 }}>
                        <div>
                            <h4 style={styles.milestoneTitle}>Stage 3: Digital Onboarding KYC Form</h4>
                            <p style={styles.milestoneDesc}>
                                {['submitted', 'approved'].includes(applicant.status)
                                    ? '✅ Your KYC onboarding form has been submitted for review. Click to verify details.'
                                    : 'Please complete your personal, educational, bank details and upload mandatory KYC documents.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (isScreeningPending) {
                                    alert("⚠️ Please complete Stage 1 & 2 Screening before accessing Digital Onboarding Form.");
                                } else {
                                    setActiveTab('onboarding');
                                }
                            }} 
                            style={{ ...styles.actionButtonBlue, background: isScreeningPending ? '#475569' : undefined, cursor: isScreeningPending ? 'not-allowed' : 'pointer' }}
                        >
                            {isScreeningPending ? '🔒 Onboarding Locked' : (['submitted', 'approved'].includes(applicant.status) ? '📝 Review Onboarding Data' : '📝 Fill Onboarding Form ➔')}
                        </button>
                    </div>

                    {/* Step 3: Offer Letter */}
                    {(applicant.offerLetterData || applicant.offerAccepted || ['selected', 'joined', 'confirmed'].includes(applicant.status)) && (
                        <div style={styles.milestoneCardOffer}>
                            <div>
                                <h4 style={{ color: '#34d399', margin: '0 0 4px 0', fontSize: '1.1rem' }}>🎉 Stage 4: Official Offer of Employment</h4>
                                <p style={styles.milestoneDesc}>
                                    {applicant.offerAccepted ? '✅ You have formally accepted your offer of employment!' : '📜 Your offer letter and joining terms are ready for review and digital acceptance.'}
                                </p>
                            </div>
                            <button onClick={() => setActiveTab('offer')} style={applicant.offerAccepted ? styles.actionButtonAccepted : styles.actionButtonGreen}>
                                {applicant.offerAccepted ? '👀 View Accepted Offer' : '✍️ Review & Accept Offer 🚀'}
                            </button>
                        </div>
                    )}

                    {/* Step 4: Assigned Division Exams */}
                    {(pendingExams.length > 0 || completedProducts.length > 0) && (
                        <div style={{ marginTop: '24px' }}>
                            <h3 style={styles.sectionTitle}>📚 Assigned Division Assessment Sessions</h3>
                            <div style={{ display: 'grid', gap: '14px' }}>
                                {pendingExams.map((exam, index) => (
                                    <div key={`pending-${index}`} style={styles.examCard}>
                                        <div>
                                            <h4 style={styles.examTitle}>{exam.targetProduct || 'Division Product Assessment'} <span className="status-blink" style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '6px' }}>[Pending]</span></h4>
                                            <p style={styles.examDetail}>Scheduled / Assigned Date: {exam.examDate || 'Today'}</p>
                                        </div>
                                        <button onClick={() => handleLaunchExam(exam)} style={styles.actionButtonGreen}>
                                            🚀 Start Assessment Session
                                        </button>
                                    </div>
                                ))}
                                {completedProducts.map((exam, index) => (
                                    <div key={`completed-${index}`} style={{...styles.examCard, opacity: 0.6}}>
                                        <div>
                                            <h4 style={{...styles.examTitle, color: '#94a3b8'}}>{exam.testedProduct || 'Division Product Assessment'} <span style={{ color: '#10b981', fontSize: '0.85rem', marginLeft: '6px' }}>[Finished]</span></h4>
                                            <p style={styles.examDetail}>Completed On: {new Date(exam.submittedAt || exam.examDate).toLocaleDateString()}</p>
                                        </div>
                                        <button disabled style={{...styles.actionButtonGreen, background: '#334155', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none'}}>
                                            ✅ Assessment Submitted
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                );
            })()}

            {activeTab === 'exams' && (
                <div style={styles.tabContentCard}>
                    <h3 style={styles.sectionTitle}>🎯 Assigned Assessments & Screening Center</h3>

                    <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                        <div style={styles.examCard}>
                            <div>
                                <h4 style={styles.examTitle}>⏱️ Phase 1: Rapid Fire Screening Test {applicant?.rapidTestCompleted ? <span style={{ color: '#10b981', fontSize: '0.85rem', marginLeft: '6px' }}>[Finished]</span> : <span className="status-blink" style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '6px' }}>[Pending]</span>}</h4>
                                <p style={styles.examDetail}>20 screening questions covering logical reasoning, math & english.</p>
                            </div>
                            <button onClick={handleLaunchRapidFire} style={applicant?.rapidTestCompleted ? {...styles.actionButtonGreen, background: '#334155', color: '#94a3b8'} : styles.actionButtonGreen}>
                                {applicant?.rapidTestCompleted ? '✅ Submitted' : 'Launch Rapid Fire Test'}
                            </button>
                        </div>

                        <div style={styles.examCard}>
                            <div>
                                <h4 style={{ color: '#d8b4fe', margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '700' }}>🧠 Phase 2: Candidate Mindset Assessment {applicant?.psychometricTestCompleted ? <span style={{ color: '#10b981', fontSize: '0.85rem', marginLeft: '6px' }}>[Finished]</span> : <span className="status-blink" style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '6px' }}>[Pending]</span>}</h4>
                                <p style={styles.examDetail}>30 situational mindset items generating your 6-dimension competency profile.</p>
                            </div>
                            <button onClick={() => { if (!applicant?.psychometricTestCompleted) setActiveTab('runningPsychometric'); }} style={applicant?.psychometricTestCompleted ? {...styles.actionButtonPurple, background: '#334155', color: '#94a3b8', border: '1px solid #475569'} : styles.actionButtonPurple}>
                                {applicant?.psychometricTestCompleted ? '✅ Submitted' : 'Launch Psychometric Assessment'}
                            </button>
                        </div>
                    </div>

                    <h4 style={{ color: '#fff', fontSize: '1.05rem', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '14px' }}>📚 Division Product Exams ({pendingExams.length + completedProducts.length})</h4>
                    {pendingExams.length === 0 && completedProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed #334155' }}>
                            No division product exams assigned to your profile currently.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '14px' }}>
                            {pendingExams.map((exam, idx) => (
                                <div key={`pending-${idx}`} style={styles.examCard}>
                                    <div>
                                        <h4 style={styles.examTitle}>{exam.targetProduct || 'Assigned Product Exam'} <span className="status-blink" style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '6px' }}>[Pending]</span></h4>
                                        <p style={styles.examDetail}>Assigned Date: {exam.examDate || 'Today'}</p>
                                    </div>
                                    <button onClick={() => handleLaunchExam(exam)} style={styles.actionButtonGreen}>
                                        🚀 Start Assessment
                                    </button>
                                </div>
                            ))}
                            {completedProducts.map((exam, idx) => (
                                <div key={`completed-${idx}`} style={{...styles.examCard, opacity: 0.6}}>
                                    <div>
                                        <h4 style={{...styles.examTitle, color: '#94a3b8'}}>{exam.testedProduct || 'Assigned Product Exam'} <span style={{ color: '#10b981', fontSize: '0.85rem', marginLeft: '6px' }}>[Finished]</span></h4>
                                        <p style={styles.examDetail}>Completed On: {new Date(exam.submittedAt || exam.examDate).toLocaleDateString()}</p>
                                    </div>
                                    <button disabled style={{...styles.actionButtonGreen, background: '#334155', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none'}}>
                                        ✅ Assessment Submitted
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'scores' && (
                <div style={styles.tabContentCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>🏆 My Historical Assessment Scoreboard</h3>
                        <button onClick={refreshApplicantProfile} style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                            🔄 Refresh Scores
                        </button>
                    </div>
                    <MyScoresTable applicant={applicant} />
                </div>
            )}

            {activeTab === 'voice-studio' && (
                <div style={styles.tabContentCard}>
                    <VoiceStudio applicant={applicant} />
                </div>
            )}
            {activeTab === 'letters' && (
                <div style={styles.tabContentCard}>
                    <MyLettersView applicant={applicant} companyData={companyData} />
                </div>
            )}
        </div>
    </main>
</div>
</div>
    );
};

const styles = {
    dashboardContainer: {
        padding: '24px 20px',
        maxWidth: '1100px',
        margin: '0 auto',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    headerCard: {
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '26px',
        marginBottom: '22px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
    },
    welcomeText: {
        margin: '0 0 10px 0',
        fontSize: '1.6rem',
        fontWeight: '800',
        color: '#fff'
    },
    statusText: {
        color: '#94a3b8',
        margin: 0,
        fontSize: '0.92rem'
    },
    statusBadge: {
        background: '#3b82f6',
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginTop: '20px',
        paddingTop: '18px',
        borderTop: '1px solid #334155',
        color: '#f8fafc',
        fontSize: '0.88rem'
    },
    logoutButton: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        padding: '8px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.2s'
    },
    backButton: {
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid #475569',
        padding: '10px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.9rem'
    },
    sidebar: {
        width: '260px',
        minWidth: '260px',
        background: '#0f172a',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        padding: '1.75rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        transition: 'all 0.3s'
    },
    sidebarBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'flex-start',
        textAlign: 'left',
        fontSize: '0.85rem',
        padding: '10px 14px',
        width: '100%',
        background: 'transparent',
        border: 'none',
        color: '#94a3b8',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    sidebarBtnActive: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'flex-start',
        textAlign: 'left',
        fontSize: '0.85rem',
        padding: '10px 14px',
        width: '100%',
        background: '#6366f1',
        border: 'none',
        color: '#fff',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
    },
    sidebarBtnText: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    tabBar: {
        display: 'none',
        gap: '8px',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '6px'
    },
    tabActive: {
        background: '#6366f1',
        color: '#fff',
        border: '1px solid #818cf8',
        padding: '12px 20px',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '0.9rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
    },
    tabInactive: {
        background: '#1e293b',
        color: '#94a3b8',
        border: '1px solid #334155',
        padding: '12px 20px',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '0.9rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s'
    },
    badgeCount: {
        background: '#ef4444',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        marginLeft: '6px',
        fontWeight: '800'
    },
    tabContentCard: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '26px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
    },
    sectionTitle: {
        color: '#fff',
        borderBottom: '1px solid #334155',
        paddingBottom: '12px',
        marginBottom: '20px',
        fontSize: '1.25rem',
        marginTop: 0
    },
    milestoneCard: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '16px'
    },
    milestoneCardOffer: {
        background: 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(15,23,42,0.9))',
        border: '1px solid rgba(16,185,129,0.5)',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '16px'
    },
    milestoneTitle: {
        margin: '0 0 6px 0',
        color: '#fff',
        fontSize: '1.1rem',
        fontWeight: '700'
    },
    milestoneDesc: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '0.88rem'
    },
    examCard: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
    },
    examTitle: {
        margin: '0 0 5px 0',
        color: '#34d399',
        fontSize: '1.1rem',
        fontWeight: '700'
    },
    examDetail: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '0.86rem'
    },
    actionButtonGreen: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '0.88rem',
        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
    },
    actionButtonPurple: {
        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '0.88rem',
        boxShadow: '0 4px 12px rgba(168,85,247,0.3)'
    },
    actionButtonBlue: {
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '0.88rem',
        boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
    },
    actionButtonAccepted: {
        background: 'rgba(16,185,129,0.18)',
        color: '#34d399',
        border: '1px solid rgba(16,185,129,0.5)',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '0.88rem'
    }
};

export default Dashboard;
