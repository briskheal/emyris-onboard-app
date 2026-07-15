import React, { useState, useEffect } from 'react';

const OPTIONAL_DOCS = ["Medical Fitness Certificate", "Passport Photo"];
const EXP_DOCS = [
    "Last Month Salary Slip", 
    "Previous Company Appointment Letter", 
    "Experience Letter - Previous Company", 
    "Relieving Letter - Previous Company"
];

const DEFAULT_REQUIRED_DOCS = [
    "Aadhar Card",
    "PAN Card",
    "10th Certificate",
    "12th Certificate",
    "Degree/Provisional Certificate",
    "Last Month Salary Slip",
    "Previous Company Appointment Letter",
    "Experience Letter - Previous Company",
    "Relieving Letter - Previous Company",
    "Bank Passbook/Cancelled Cheque",
    "Passport Photo",
    "Medical Fitness Certificate",
    "Digital Signature"
];

export const Stage5Documents = ({ applicant, companyData, formData, onPrev, onNext, onRefreshApplicant }) => {
    const [uploadingCategory, setUploadingCategory] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [localDocs, setLocalDocs] = useState(applicant?.documents || []);

    useEffect(() => {
        if (applicant?.documents) {
            setLocalDocs(applicant.documents);
        }
    }, [applicant?.documents]);

    const requiredDocsList = (companyData?.requiredDocs && companyData.requiredDocs.length > 0)
        ? companyData.requiredDocs
        : DEFAULT_REQUIRED_DOCS;

    const existingDocs = localDocs || [];
    const totalExp = parseFloat(formData?.totalExperience || 0);
    const isExperienced = totalExp > 0;

    // Helper: Convert File to Base64 string with data URI scheme
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e, category) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Reset inputs so same file can be chosen again if needed
        e.target.value = '';
        setErrorMsg('');
        setSuccessMsg('');

        // Size check (max 12MB per file)
        for (const file of files) {
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > 12) {
                setErrorMsg(`File "${file.name}" exceeds the 12MB limit (${sizeMB.toFixed(1)}MB).`);
                return;
            }
        }

        setUploadingCategory(category);
        let successCount = 0;
        let lastError = '';

        try {
            for (const file of files) {
                const base64Data = await fileToBase64(file);
                const response = await fetch('/api/applicant/upload-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: applicant.email,
                        category: category,
                        fileName: file.name,
                        fileData: base64Data
                    })
                });

                const result = await response.json();
                if (result.success) {
                    successCount++;
                    if (result.documents && Array.isArray(result.documents)) {
                        setLocalDocs(result.documents);
                    } else {
                        setLocalDocs(prev => [...prev, {
                            category: category,
                            name: file.name,
                            assetId: result.assetId || '#',
                            sizeKB: Math.round(file.size / 1024),
                            uploadedAt: new Date()
                        }]);
                    }
                } else {
                    lastError = result.message || `Failed to upload ${file.name}`;
                }
            }

            if (successCount > 0) {
                setSuccessMsg(`✅ ${successCount} file(s) uploaded successfully to ${category}!`);
                if (onRefreshApplicant) await onRefreshApplicant();
            }
            if (lastError) {
                setErrorMsg(lastError);
            }
        } catch (err) {
            console.error("Upload error:", err);
            setErrorMsg("Network error occurred during document upload.");
        } finally {
            setUploadingCategory(null);
        }
    };

    const handleDeleteDoc = async (assetId, category) => {
        if (!window.confirm(`Are you sure you want to remove this ${category} file?`)) return;

        setDeletingId(assetId);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const response = await fetch('/api/applicant/delete-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: applicant.email,
                    assetId: assetId,
                    category: category
                })
            });
            const result = await response.json();
            if (result.success) {
                setSuccessMsg(`🗑️ Removed document from ${category}`);
                if (result.documents && Array.isArray(result.documents)) {
                    setLocalDocs(result.documents);
                } else {
                    setLocalDocs(prev => prev.filter(d => (d.assetId || d._id) !== assetId));
                }
                if (onRefreshApplicant) await onRefreshApplicant();
            } else {
                setErrorMsg(result.message || "Failed to remove file.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            setErrorMsg("Network error occurred while removing file.");
        } finally {
            setDeletingId(null);
        }
    };

    const truncateFilename = (name, max = 22) => {
        if (!name || name.length <= max) return name;
        const parts = name.split('.');
        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
        const base = parts.join('.');
        return `${base.slice(0, max - ext.length - 3)}...${ext}`;
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerBox}>
                <h3 style={styles.title}>📁 Testimonial & Document Repository</h3>
                <p style={styles.subtitle}>
                    Upload high-resolution scans or PDFs (Max 12MB each). Multiple pages can be uploaded under the same category (e.g. Front & Back).
                </p>

                {/* Fresher vs Experienced Badge */}
                <div style={isExperienced ? styles.bannerWarning : styles.bannerSuccess}>
                    <span style={{ fontSize: '1.4rem' }}>{isExperienced ? '💼' : '🎓'}</span>
                    <div>
                        <strong style={{ color: '#fff' }}>
                            {isExperienced ? `Experienced Candidate (${totalExp} Years Profile)` : 'Fresher Profile Detected'}
                        </strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: isExperienced ? '#fcd34d' : '#86efac' }}>
                            {isExperienced 
                                ? 'Salary slips and previous employment letters are mandatory for your verification.'
                                : 'Previous company salary slips and experience letters have been automatically marked optional.'}
                        </p>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div style={styles.alertError}>
                    <span>⚠️ {errorMsg}</span>
                    <button onClick={() => setErrorMsg('')} style={styles.alertClose}>&times;</button>
                </div>
            )}

            {successMsg && (
                <div style={styles.alertSuccess}>
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} style={styles.alertClose}>&times;</button>
                </div>
            )}

            {/* Document Grid */}
            <div style={styles.grid}>
                {requiredDocsList.map((docName) => {
                    const categoryDocs = existingDocs.filter(d => d.category === docName);
                    const hasFiles = categoryDocs.length > 0;
                    const isUploadingThis = uploadingCategory === docName;

                    let isOptional = OPTIONAL_DOCS.includes(docName);
                    if (EXP_DOCS.includes(docName)) {
                        isOptional = !isExperienced;
                    }

                    const isSignature = docName === "Digital Signature";

                    return (
                        <div 
                            key={docName} 
                            style={{
                                ...styles.docCard,
                                borderColor: hasFiles ? 'rgba(16, 185, 129, 0.4)' : (isOptional ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.3)'),
                                background: hasFiles ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.6)'
                            }}
                        >
                            <div style={styles.cardTop}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.25rem' }}>
                                        {isSignature ? '🖋️' : (hasFiles ? '📄' : '📎')}
                                    </span>
                                    <span style={styles.docName}>{docName}</span>
                                </div>
                                {hasFiles ? (
                                    <span style={styles.badgeSuccess}>✓ {categoryDocs.length} Uploaded</span>
                                ) : isOptional ? (
                                    <span style={styles.badgeOptional}>Optional</span>
                                ) : (
                                    <span style={styles.badgeRequired}>Required *</span>
                                )}
                            </div>

                            {/* Drag & Drop Action Zone */}
                            <label style={isUploadingThis ? styles.dropzoneUploading : styles.dropzone}>
                                <input 
                                    type="file" 
                                    multiple
                                    style={{ display: 'none' }}
                                    accept={isSignature ? "image/*" : "application/pdf,image/*"}
                                    onChange={(e) => handleFileChange(e, docName)}
                                    disabled={isUploadingThis}
                                />
                                {isUploadingThis ? (
                                    <div style={styles.uploadingState}>
                                        <div className="spinner" style={styles.spinner}></div>
                                        <span>Encrypting & Uploading...</span>
                                    </div>
                                ) : (
                                    <div style={styles.dropContent}>
                                        <span style={styles.uploadIcon}>{hasFiles ? '➕' : '⬆️'}</span>
                                        <span style={styles.uploadText}>
                                            {hasFiles ? `Add more files to ${docName} (Multiple allowed)` : `Upload ${docName} (Multiple files supported)`}
                                        </span>
                                        <span style={styles.fileHint}>
                                            {isSignature ? 'PNG, JPG or WEBP' : '📎 Click to Browse or Drag & Drop Multiple Files (Max 12MB each)'}
                                        </span>
                                    </div>
                                )}
                            </label>

                            {/* Uploaded files pill list (shown below the same block serially) */}
                            {hasFiles && (
                                <div style={{ ...styles.fileList, marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 'bold', marginBottom: '4px' }}>
                                        ✅ Uploaded Files ({categoryDocs.length}):
                                    </div>
                                    {categoryDocs.map((doc, idx) => (
                                        <div key={idx} style={styles.filePill}>
                                            <a 
                                                href={doc.assetId || '#'} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                style={styles.fileLink}
                                                title={doc.name}
                                            >
                                                <span>📄 {idx + 1}. {truncateFilename(doc.name, 22)}</span>
                                                {doc.sizeKB && <span style={styles.fileSize}>({doc.sizeKB} KB)</span>}
                                            </a>
                                            <button 
                                                type="button" 
                                                onClick={() => handleDeleteDoc(doc.assetId || doc._id, docName)}
                                                disabled={deletingId === (doc.assetId || doc._id)}
                                                style={styles.deleteBtn}
                                                title="Remove file"
                                            >
                                                {deletingId === (doc.assetId || doc._id) ? '⌛' : '🗑️'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Buttons */}
            <div style={styles.navButtons}>
                <button type="button" onClick={onPrev} style={styles.secondaryBtn}>
                    &larr; Previous Phase
                </button>
                <button type="button" onClick={onNext} style={styles.primaryBtn}>
                    Save & Continue to Final Review &rarr;
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: '#fff'
    },
    headerBox: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '20px'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#fff',
        margin: '0 0 8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    subtitle: {
        fontSize: '0.9rem',
        color: '#94a3b8',
        margin: '0 0 16px 0',
        lineHeight: '1.5'
    },
    bannerWarning: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px',
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px'
    },
    bannerSuccess: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px',
        background: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px'
    },
    alertError: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid #ef4444',
        color: '#fca5a5',
        padding: '12px 16px',
        borderRadius: '10px',
        fontSize: '0.9rem'
    },
    alertSuccess: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(16, 185, 129, 0.2)',
        border: '1px solid #10b981',
        color: '#6ee7b7',
        padding: '12px 16px',
        borderRadius: '10px',
        fontSize: '0.9rem'
    },
    alertClose: {
        background: 'none',
        border: 'none',
        color: 'inherit',
        fontSize: '1.25rem',
        cursor: 'pointer'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
    },
    docCard: {
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    docName: {
        fontWeight: '600',
        fontSize: '0.95rem',
        color: '#f8fafc'
    },
    badgeRequired: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        padding: '3px 8px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: '600',
        border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    badgeOptional: {
        background: 'rgba(148, 163, 184, 0.15)',
        color: '#cbd5e1',
        padding: '3px 8px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: '500'
    },
    badgeSuccess: {
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        padding: '3px 8px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: '600',
        border: '1px solid rgba(16, 185, 129, 0.3)'
    },
    fileList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '280px',
        overflowY: 'auto',
        paddingRight: '4px'
    },
    filePill: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '0.85rem'
    },
    fileLink: {
        color: '#60a5fa',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    fileSize: {
        color: '#64748b',
        fontSize: '0.75rem'
    },
    deleteBtn: {
        background: 'rgba(239, 68, 68, 0.15)',
        border: 'none',
        color: '#f87171',
        width: '26px',
        height: '26px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s ease'
    },
    dropzone: {
        border: '2px dashed rgba(255, 255, 255, 0.18)',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.02)',
        transition: 'all 0.2s ease',
        textAlign: 'center'
    },
    dropzoneUploading: {
        border: '2px dashed #6366f1',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(99, 102, 241, 0.1)',
        cursor: 'wait'
    },
    dropContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
    },
    uploadIcon: {
        fontSize: '1.3rem'
    },
    uploadText: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#e2e8f0'
    },
    fileHint: {
        fontSize: '0.75rem',
        color: '#64748b'
    },
    uploadingState: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#818cf8',
        fontSize: '0.88rem',
        fontWeight: '500'
    },
    spinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(129, 140, 248, 0.3)',
        borderTopColor: '#818cf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    },
    navButtons: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    },
    secondaryBtn: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '12px 24px',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s ease'
    },
    primaryBtn: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff',
        border: 'none',
        padding: '12px 28px',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
        transition: 'transform 0.1s ease'
    }
};
