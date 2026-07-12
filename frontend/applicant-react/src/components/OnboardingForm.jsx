import React, { useState, useEffect } from 'react';

const OnboardingForm = ({ applicant, companyData, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (applicant && applicant.formData) {
            setFormData(applicant.formData);
        }
    }, [applicant]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/applicant/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: applicant.email, formData })
            });
            const result = await res.json();
            if (result.success) {
                alert("Progress saved successfully!");
                // Update global applicant if needed
                if (window.currentApplicant) {
                    window.currentApplicant.formData = formData;
                }
            } else {
                alert(result.message || "Failed to save draft.");
            }
        } catch (err) {
            alert("Error saving draft.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handlePrev = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Ensure consent is checked (simulate for now)
        if (!window.confirm("I declare that all particulars are true and I accept the Data Privacy Consent.")) {
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/submit-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: applicant.email, formData })
            });
            const result = await res.json();
            if (result.success) {
                alert("Application submitted successfully!");
                onComplete && onComplete();
            } else {
                alert(result.message || "Submission failed.");
            }
        } catch (err) {
            alert("Error submitting application.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerActions}>
                <button style={styles.saveButton} onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? "Saving..." : "💾 Save Progress"}
                </button>
            </div>
            
            <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBar, width: `${(currentStep / 6) * 100}%` }}></div>
            </div>

            <form onSubmit={handleSubmit} style={styles.formCard}>
                {currentStep === 1 && (
                    <div className="step-content">
                        <h3>Personal Information</h3>
                        <p style={styles.subtext}>Basic details for your profile.</p>
                        
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label>Title*</label>
                                <select name="title" value={formData.title || ''} onChange={handleChange} required style={styles.input}>
                                    <option value="">Select</option>
                                    <option value="Mr.">Mr.</option>
                                    <option value="Mrs.">Mrs.</option>
                                    <option value="Ms.">Ms.</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>First Name*</label>
                                <input name="firstName" value={formData.firstName || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Last Name*</label>
                                <input name="lastName" value={formData.lastName || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Date of Birth*</label>
                                <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Gender*</label>
                                <select name="gender" value={formData.gender || ''} onChange={handleChange} required style={styles.input}>
                                    <option value="">Select</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="T">Transgender</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Total Yrs of Experience*</label>
                                <input type="number" step="0.1" name="totalExperience" value={formData.totalExperience || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                        </div>

                        <div style={styles.navButtons}>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Next Phase</button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="step-content">
                        <h3>Contact & Location</h3>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label>City*</label>
                                <input name="city" value={formData.city || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>State*</label>
                                <input name="state" value={formData.state || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Phone*</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                        </div>
                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Next Phase</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="step-content">
                        <h3>Professional Details</h3>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label>Expected Joining Date*</label>
                                <input type="date" name="joiningDate" value={formData.joiningDate || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Negotiated Annual CTC*</label>
                                <input type="number" name="salary" value={formData.salary || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                        </div>
                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Next Phase</button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="step-content">
                        <h3>Bank Account</h3>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label>Bank Name*</label>
                                <input name="bankName" value={formData.bankName || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Account Number*</label>
                                <input name="accNo" value={formData.accNo || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label>IFSC Code*</label>
                                <input name="ifsc" value={formData.ifsc || ''} onChange={handleChange} required style={styles.input} />
                            </div>
                        </div>
                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Next Phase</button>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="step-content">
                        <h3>Testimonial Repository</h3>
                        <p style={styles.subtext}>Please switch to the Legacy View to upload documents for now (Phase 4), or skip to Final Review.</p>
                        
                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>Previous</button>
                            <button type="button" onClick={handleNext} style={styles.primaryBtn}>Next Phase</button>
                        </div>
                    </div>
                )}

                {currentStep === 6 && (
                    <div className="step-content">
                        <h3>Final Review</h3>
                        <p style={styles.subtext}>Review your data before submission.</p>
                        
                        <div style={styles.navButtons}>
                            <button type="button" onClick={handlePrev} style={styles.secondaryBtn}>Edit Data</button>
                            <button type="submit" style={styles.submitBtn} disabled={isSaving}>
                                {isSaving ? "Submitting..." : "Finalize Submission 🚀"}
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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: "'Inter', sans-serif"
    },
    headerActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px'
    },
    saveButton: {
        background: 'rgba(99, 102, 241, 0.2)',
        color: '#818cf8',
        border: '1px solid #6366f1',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    progressBarContainer: {
        height: '6px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '3px',
        marginBottom: '30px',
        overflow: 'hidden'
    },
    progressBar: {
        height: '100%',
        background: 'linear-gradient(90deg, #3b82f6, #10b981)',
        transition: 'width 0.3s ease'
    },
    formCard: {
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '30px',
        color: '#fff'
    },
    subtext: {
        color: '#94a3b8',
        marginBottom: '24px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    input: {
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px'
    },
    navButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
    },
    primaryBtn: {
        background: '#3b82f6',
        color: '#fff',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    secondaryBtn: {
        background: 'transparent',
        color: '#94a3b8',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    submitBtn: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};

export default OnboardingForm;
