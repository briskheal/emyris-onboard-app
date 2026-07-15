import React, { useState, useEffect } from 'react';
import { Stage5Documents } from './Stage5Documents';

const OnboardingForm = ({ applicant, companyData, onComplete }) => {
    const [applicantState, setApplicantState] = useState(applicant || {});
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (applicant) {
            setApplicantState(applicant);
            if (applicant.formData) {
                setFormData(applicant.formData);
            }
        }
    }, [applicant]);

    const showToast = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const [fetchingPin, setFetchingPin] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalVal = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalVal }));
    };

    const handlePinChange = async (e) => {
        const pinVal = e.target.value;
        setFormData(prev => ({ ...prev, pin: pinVal }));
        if (pinVal.length === 6 && /^\d{6}$/.test(pinVal)) {
            setFetchingPin(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pinVal}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
                    const details = data[0].PostOffice[0];
                    setFormData(prev => ({
                        ...prev,
                        pin: pinVal,
                        city: prev.city || details.District || details.Name || '',
                        state: details.State || prev.state || ''
                    }));
                    showToast(`📍 Auto-filled: ${details.District}, ${details.State}`);
                }
            } catch (err) {
                console.warn('Pincode fetch error:', err);
            } finally {
                setFetchingPin(false);
            }
        }
    };

    const handleTileSelect = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveDraft = async () => {
        if (!applicantState?.email) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/applicant/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: applicantState.email, formData })
            });
            const result = await res.json();
            if (result.success) {
                showToast("✨ Progress saved safely to cloud draft!");
                if (window.currentApplicant) {
                    window.currentApplicant.formData = formData;
                }
            } else {
                showToast(result.message || "Failed to save draft.", "error");
            }
        } catch (err) {
            showToast("Network error while saving draft.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const refreshApplicantData = async () => {
        if (!applicantState?.email) return;
        try {
            const res = await fetch(`/api/applicant/profile?email=${encodeURIComponent(applicantState.email)}`);
            const data = await res.json();
            if (data.success && data.applicant) {
                setApplicantState(data.applicant);
                if (window.currentApplicant) {
                    window.currentApplicant = data.applicant;
                }
            }
        } catch (err) {
            console.error("Failed to refresh applicant data:", err);
        }
    };

    const handleNext = () => {
        // Trigger background auto-save on transition
        handleSaveDraft();
        setCurrentStep(prev => Math.min(6, prev + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!window.confirm("I declare that all particulars are true and I accept the Data Privacy Consent.")) {
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/submit-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: applicantState.email, formData })
            });
            const result = await res.json();
            if (result.success) {
                showToast("🚀 Application finalized and submitted successfully!");
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 1200);
            } else {
                showToast(result.message || "Submission failed.", "error");
            }
        } catch (err) {
            showToast("Error submitting application.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const stepsInfo = [
        { id: 1, label: "Personal", icon: "👤" },
        { id: 2, label: "Contact", icon: "📍" },
        { id: 3, label: "Professional", icon: "💼" },
        { id: 4, label: "Bank Account", icon: "🏦" },
        { id: 5, label: "Documents", icon: "📁" },
        { id: 6, label: "Final Review", icon: "🚀" }
    ];

    // Formatted CTC calculation helper
    const formatCTC = (val) => {
        const num = parseFloat(val);
        if (!num || isNaN(num)) return null;
        const monthly = Math.round(num / 12);
        const lakhs = (num / 100000).toFixed(2);
        return `₹${monthly.toLocaleString('en-IN')} / Month ≈ ₹${lakhs} Lakhs / Annum`;
    };

    return (
        <div style={styles.container}>
            {/* Toast Notification Banner */}
            {notification && (
                <div style={notification.type === 'error' ? styles.toastError : styles.toastSuccess}>
                    <span>{notification.msg}</span>
                    <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                </div>
            )}

            {/* Header Actions */}
            <div style={styles.headerBox}>
                <div>
                    <h2 style={styles.wizardTitle}>Employee Onboarding Application</h2>
                    <p style={styles.wizardSub}>Complete each stage accurately. Progress saves automatically to your portal PIN.</p>
                </div>
                <button style={styles.saveButton} onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? "⌛ Saving..." : "💾 Save Cloud Draft"}
                </button>
            </div>
            
            {/* Interactive Step Navigation Bar */}
            <div style={styles.stepBar}>
                {stepsInfo.map((s) => {
                    const isActive = currentStep === s.id;
                    const isDone = currentStep > s.id;
                    return (
                        <div 
                            key={s.id} 
                            style={styles.stepItem}
                            onClick={() => {
                                // Jump directly to any step that has been reached or completed
                                if (isDone || isActive) setCurrentStep(s.id);
                            }}
                        >
                            <div style={{
                                ...styles.stepCircle,
                                background: isActive ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isDone ? '#10b981' : 'rgba(255,255,255,0.08)'),
                                borderColor: isActive ? '#60a5fa' : (isDone ? '#34d399' : 'rgba(255,255,255,0.15)'),
                                boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none',
                                cursor: isDone ? 'pointer' : 'default'
                            }}>
                                <span>{isDone ? '✓' : s.icon}</span>
                            </div>
                            <span style={{
                                ...styles.stepLabel,
                                color: isActive ? '#60a5fa' : (isDone ? '#34d399' : '#64748b'),
                                fontWeight: isActive ? '700' : '500'
                            }}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Form Main Body */}
            <form onSubmit={handleSubmit} style={styles.formCard}>
                {currentStep === 1 && (
                    <div className="step-content">
                        <div style={styles.stageHeader}>
                            <h3>Phase 1: Personal Profile</h3>
                            <p style={styles.subtext}>Please provide your legal name and demographic details as per government ID.</p>
                        </div>
                        
                        <div style={styles.grid}>
                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Title / Salutation*</label>
                                <div style={styles.tileGroup}>
                                    {['Mr.', 'Mrs.', 'Ms.', 'Dr.'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            style={formData.title === t ? styles.tileSelected : styles.tileBtn}
                                            onClick={() => handleTileSelect('title', t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>First Name*</label>
                                <input name="firstName" value={formData.firstName || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. Rahul" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Last Name*</label>
                                <input name="lastName" value={formData.lastName || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. Sharma" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Date of Birth*</label>
                                <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} required style={styles.input} />
                            </div>

                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Gender*</label>
                                <div style={styles.tileGroup}>
                                    {[
                                        { val: 'M', label: '👨 Male' },
                                        { val: 'F', label: '👩 Female' },
                                        { val: 'T', label: '🧑 Transgender / Other' }
                                    ].map((g) => (
                                        <button
                                            key={g.val}
                                            type="button"
                                            style={formData.gender === g.val ? styles.tileSelected : styles.tileBtn}
                                            onClick={() => handleTileSelect('gender', g.val)}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Total Years of Work Experience* <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>(Enter 0 if you are a Fresher)</span></label>
                                <input type="number" step="0.1" name="totalExperience" value={formData.totalExperience || ''} onChange={handleChange} required style={styles.input} placeholder="0 for Fresher, 2.5 for experienced..." />
                            </div>
                        </div>

                        <div style={styles.navButtons}>
                            <div></div>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Save & Continue Phase 2 &rarr;</button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="step-content">
                        <div style={styles.stageHeader}>
                            <h3>Phase 2: Contact & Residential Location</h3>
                            <p style={styles.subtext}>Your permanent and current communication address details.</p>
                        </div>

                        <div style={styles.grid}>
                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>
                                    Pincode (Postal Code)* {fetchingPin && <span style={{fontSize:'0.75rem', color:'#10b981'}}>Checking...</span>}
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input name="pin" maxLength="6" value={formData.pin || ''} onChange={handlePinChange} required style={{ ...styles.input, flex: 1 }} placeholder="6-digit PIN e.g. 400001" />
                                    <button 
                                        type="button" 
                                        onClick={() => handlePinChange({ target: { value: formData.pin || '' } })} 
                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        title="Auto-fetch City and State from PIN"
                                    >
                                        📍 Fetch PIN
                                    </button>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>City / Town*</label>
                                <input name="city" value={formData.city || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. Mumbai" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>State / Province*</label>
                                <input name="state" value={formData.state || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. Maharashtra" />
                            </div>
                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Active Mobile Number*</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} required style={styles.input} placeholder="+91 9876543210" />
                            </div>
                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Complete Postal Address (House No, Street, Landmark)</label>
                                <textarea name="address" rows="3" value={formData.address || ''} onChange={handleChange} style={styles.input} placeholder="Type your full residential address here..." />
                            </div>
                        </div>

                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>&larr; Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Save & Continue Phase 3 &rarr;</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="step-content">
                        <div style={styles.stageHeader}>
                            <h3>Phase 3: Professional & Employment Terms</h3>
                            <p style={styles.subtext}>Joining date and annual compensation expectations.</p>
                        </div>

                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Expected Joining Date*</label>
                                <input type="date" name="joiningDate" value={formData.joiningDate || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Negotiated Annual CTC (in INR)*</label>
                                <input type="number" name="salary" value={formData.salary || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. 450000" />
                                {formData.salary && (
                                    <div style={styles.ctcBox}>
                                        💡 <strong>Breakdown Preview:</strong> {formatCTC(formData.salary)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>&larr; Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Save & Continue Phase 4 &rarr;</button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="step-content">
                        <div style={styles.stageHeader}>
                            <h3>Phase 4: Bank Account & Payroll Direct Deposit</h3>
                            <p style={styles.subtext}>Please ensure the bank account belongs to you and IFSC is exact for automated salary disbursement.</p>
                        </div>

                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Bank Name*</label>
                                <input name="bankName" value={formData.bankName || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. HDFC Bank, SBI, ICICI" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Account Number*</label>
                                <input name="accNo" value={formData.accNo || ''} onChange={handleChange} required style={styles.input} placeholder="Enter your bank account number" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>IFSC Code*</label>
                                <input name="ifsc" value={formData.ifsc || ''} onChange={handleChange} required style={styles.input} placeholder="e.g. HDFC0001234" />
                            </div>
                        </div>

                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>&larr; Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Save & Continue Phase 5 &rarr;</button>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <Stage5Documents 
                        applicant={applicantState} 
                        companyData={companyData} 
                        formData={formData} 
                        onPrev={handlePrev} 
                        onNext={handleNext} 
                        onRefreshApplicant={refreshApplicantData} 
                    />
                )}

                {currentStep === 6 && (
                    <div className="step-content">
                        <div style={styles.stageHeader}>
                            <h3>Phase 6: Final Verification & Declaration</h3>
                            <p style={styles.subtext}>Review your profile snapshot and uploaded documents before final lock.</p>
                        </div>

                        {/* Summary Snapshot Card */}
                        <div style={styles.reviewSummaryCard}>
                            <div style={styles.reviewRow}>
                                <span style={styles.reviewKey}>Candidate Name:</span>
                                <strong>{formData.title || ''} {formData.firstName || ''} {formData.lastName || ''}</strong>
                            </div>
                            <div style={styles.reviewRow}>
                                <span style={styles.reviewKey}>Date of Birth:</span>
                                <strong>{formData.dob || 'Not entered'}</strong>
                            </div>
                            <div style={styles.reviewRow}>
                                <span style={styles.reviewKey}>Mobile Number:</span>
                                <strong>{formData.phone || applicantState?.phone || 'Not entered'}</strong>
                            </div>
                            <div style={styles.reviewRow}>
                                <span style={styles.reviewKey}>Location / Address:</span>
                                <strong>{[formData.city, formData.state].filter(Boolean).join(', ') || 'Not entered'}</strong>
                            </div>
                            <div style={styles.reviewRow}>
                                <span style={styles.reviewKey}>Bank details:</span>
                                <strong>{formData.bankName || 'Not entered'} (Acct: {formData.accNo || '***'}, IFSC: {formData.ifsc || '***'})</strong>
                            </div>
                            <div style={styles.reviewRow}>
                                <span style={styles.reviewKey}>Total Uploaded Documents:</span>
                                <strong style={{ color: '#34d399' }}>{(applicantState?.documents || []).length} Files uploaded to cloud</strong>
                            </div>
                            {(applicantState?.documents || []).length > 0 && (
                                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Uploaded Files Summary:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {(applicantState?.documents || []).map((d, idx) => (
                                            <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '4px 8px', borderRadius: '12px', fontSize: '0.78rem' }}>
                                                📄 {d.category}: {d.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={styles.consentBox}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" required style={{ marginTop: '4px', transform: 'scale(1.2)' }} />
                                <span style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                                    I hereby declare that the personal details, academic qualifications, and bank account credentials provided above are genuine to the best of my knowledge. I consent to Emyris Biolifesciences processing my information for onboarding verification and payroll setup.
                                </span>
                            </label>
                        </div>
                        
                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>&larr; Return & Edit Data</button>
                            <button type="submit" style={styles.submitBtn} disabled={isSaving}>
                                {isSaving ? "⌛ Finalizing Application..." : "Finalize & Submit Application 🚀"}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '960px',
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: "'Inter', sans-serif"
    },
    headerBox: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '15px'
    },
    wizardTitle: {
        fontSize: '1.6rem',
        fontWeight: '800',
        color: '#fff',
        margin: '0 0 6px 0',
        background: 'linear-gradient(90deg, #fff, #93c5fd)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    },
    wizardSub: {
        fontSize: '0.88rem',
        color: '#94a3b8',
        margin: 0
    },
    saveButton: {
        background: 'rgba(99, 102, 241, 0.2)',
        color: '#a5b4fc',
        border: '1px solid #6366f1',
        padding: '10px 20px',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
        transition: 'all 0.2s ease'
    },
    toastSuccess: {
        background: 'rgba(16, 185, 129, 0.9)',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: '600',
        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
    },
    toastError: {
        background: 'rgba(239, 68, 68, 0.9)',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: '600',
        boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
    },
    stepBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '30px',
        overflowX: 'auto',
        gap: '12px'
    },
    stepItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        minWidth: 'fit-content'
    },
    stepCircle: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        border: '2px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: '#fff',
        transition: 'all 0.3s ease'
    },
    stepLabel: {
        fontSize: '0.85rem',
        transition: 'color 0.3s ease'
    },
    formCard: {
        background: 'rgba(30, 41, 59, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '36px',
        color: '#fff',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
    },
    stageHeader: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px',
        marginBottom: '26px'
    },
    subtext: {
        color: '#94a3b8',
        fontSize: '0.9rem',
        margin: '6px 0 0 0'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '22px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    formGroupFull: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        gridColumn: '1 / -1'
    },
    label: {
        fontSize: '0.86rem',
        fontWeight: '600',
        color: '#cbd5e1'
    },
    input: {
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        color: '#fff',
        padding: '13px 16px',
        borderRadius: '10px',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s ease'
    },
    tileGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
    },
    tileBtn: {
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        color: '#cbd5e1',
        padding: '10px 20px',
        borderRadius: '10px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    tileSelected: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        border: '1px solid #60a5fa',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '10px',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        cursor: 'pointer'
    },
    ctcBox: {
        background: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#93c5fd',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        marginTop: '6px'
    },
    reviewSummaryCard: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '14px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px'
    },
    reviewRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '8px',
        fontSize: '0.92rem'
    },
    reviewKey: {
        color: '#94a3b8'
    },
    consentBox: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '18px',
        borderRadius: '12px',
        marginBottom: '10px'
    },
    navButtons: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '34px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    },
    secondaryBtn: {
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#cbd5e1',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        padding: '13px 26px',
        borderRadius: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s ease'
    },
    primaryBtn: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff',
        border: 'none',
        padding: '13px 30px',
        borderRadius: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
        transition: 'all 0.2s ease'
    },
    submitBtn: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        border: 'none',
        padding: '14px 34px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '1rem',
        boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
    }
};

export default OnboardingForm;
