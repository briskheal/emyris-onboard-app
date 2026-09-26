const fs = require('fs');

try {
    let code = fs.readFileSync('frontend/applicant-react/src/components/Dashboard.jsx', 'utf8');

    // 0. Add import for MyLettersView if missing
    if (!code.includes("import MyLettersView from './MyLettersView';")) {
        code = code.replace("import VoiceStudio from './VoiceStudio';", "import VoiceStudio from './VoiceStudio';\nimport MyLettersView from './MyLettersView';");
    }

    // 1. Add mobileMenuOpen state
    if (!code.includes('const [mobileMenuOpen')) {
        code = code.replace(/const \[activeTab, setActiveTab\] = useState\('overview'\);/, "const [activeTab, setActiveTab] = useState('overview');\n    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);");
    }

    // 2. Identify the boundaries of the main return block
    // Look for the exact string of the main return block
    const mainReturnStartStr = "    return (\r\n        <div style={styles.dashboardContainer}>\r\n            {/* Header Bar */}";
    const mainReturnStartStrN = "    return (\n        <div style={styles.dashboardContainer}>\n            {/* Header Bar */}";
    
    let mainReturnStart = code.indexOf(mainReturnStartStr);
    if (mainReturnStart === -1) mainReturnStart = code.indexOf(mainReturnStartStrN);

    const mainReturnEndStr = "            {/* Tab Contents */}";
    let mainReturnEnd = code.indexOf(mainReturnEndStr, mainReturnStart);

    if (mainReturnStart === -1 || mainReturnEnd === -1) {
        console.log('Could not find main return block boundaries', mainReturnStart, mainReturnEnd);
        process.exit(1);
    }

    const newLayout = `    return (
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
                        <aside className={\`admin-sidebar \${mobileMenuOpen ? 'open' : ''}\`} style={styles.sidebar}>
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
                                <div><span style={{ color: '#94a3b8' }}>Applied Role:</span> <strong>{applicant.appliedRole || applicant.role || 'Onboarding Candidate'}</strong></div>
                                <div><span style={{ color: '#94a3b8' }}>HQ / Location:</span> <strong>{applicant.hq || 'N/A'}</strong></div>
                            </div>
                        </div>

            {/* Tab Contents */}`;
    
    // Use length of the matched str to skip it
    code = code.substring(0, mainReturnStart) + newLayout + code.substring(mainReturnEnd + mainReturnEndStr.length);

    // 3. Replace the closing tags and add the MyLettersView routing
    // Look for the end of the Dashboard component
    const lastClosingStr = "        </div>\r\n    );\r\n};";
    const lastClosingStrN = "        </div>\n    );\n};";
    
    let lastClosing = code.lastIndexOf(lastClosingStr);
    let closingLength = lastClosingStr.length;
    if (lastClosing === -1) {
        lastClosing = code.lastIndexOf(lastClosingStrN);
        closingLength = lastClosingStrN.length;
    }

    if (lastClosing !== -1) {
        code = code.substring(0, lastClosing) + `            {activeTab === 'letters' && (
                <div style={styles.tabContentCard}>
                    <MyLettersView applicant={applicant} />
                </div>
            )}
        </div>
    </main>
</div>
</div>
    );
};` + code.substring(lastClosing + closingLength);
    } else {
        console.log("Could not find closing brackets to replace.");
        process.exit(1);
    }

    // 4. Update the styles block
    const stylesSearchStr = "tabBar: {\r\n        display: 'flex',";
    const stylesSearchStrN = "tabBar: {\n        display: 'flex',";
    let stylesIdx = code.indexOf(stylesSearchStr);
    if (stylesIdx === -1) stylesIdx = code.indexOf(stylesSearchStrN);

    if (stylesIdx !== -1) {
        const newStyles = `sidebar: {
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
        display: 'none',`;
        code = code.substring(0, stylesIdx) + newStyles + code.substring(stylesIdx + stylesSearchStrN.length); // approximate length
    } else {
        console.log('Could not find tabBar styles to replace');
    }

    fs.writeFileSync('frontend/applicant-react/src/components/Dashboard.jsx', code);
    console.log('Successfully refactored Dashboard.jsx');
} catch (error) {
    console.error('Error during refactoring:', error);
}
