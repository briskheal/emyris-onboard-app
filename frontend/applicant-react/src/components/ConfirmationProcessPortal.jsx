import React, { useState, useEffect, useMemo } from 'react';

const EVALUATION_PILLARS = [
    {
        id: 'sales',
        title: '1. Sales Performance',
        weight: 40,
        desc: 'Achievement against target (primary & secondary sales), territory growth over predecessor/previous period, focus & new-launch brand volume, new prescribers generated, and control of expiry/returns.'
    },
    {
        id: 'fieldWork',
        title: '2. Field Work & Coverage',
        weight: 20,
        desc: 'Daily doctor call average against company norm (10-12 doctors, 4-6 chemists), coverage of Master Doctor List (MSL >= 90%), call frequency on key doctors, field working days, tour plan adherence, and POB booking.'
    },
    {
        id: 'quality',
        title: '3. Quality of Field Work (Joint Work & RCPA)',
        weight: 15,
        desc: 'Retail Chemist Prescription Audit (RCPA) done regularly & accurately, detailing skills, visual aid product story delivery, handling objections, doctor relationship & prescription conversion.'
    },
    {
        id: 'knowledge',
        title: '4. Product & Detailing Knowledge',
        weight: 10,
        desc: 'Scores in product, disease, and competitor knowledge tests, completion of induction training modules, and Voice Studio detailing pitch certifications.'
    },
    {
        id: 'discipline',
        title: '5. Reporting Discipline & Statutory Compliance',
        weight: 10,
        desc: 'Timely and genuine DCR entries in SFA/CRM app, accurate expense claims, compliance with sample/gift distribution norms, UCPMP code ethics, and meeting punctuality.'
    },
    {
        id: 'attitude',
        title: '6. Attitude, Behaviour & Teamwork',
        weight: 5,
        desc: 'Initiative, coachability, response to feedback, integrity (no fake reporting), communication skills, personal grooming, and professional relationship with stockists.'
    }
];

export default function ConfirmationProcessPortal({ applicant, onBack }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [monthsData, setMonthsData] = useState([]);
    const [selfRatings, setSelfRatings] = useState({
        sales: 0,
        fieldWork: 0,
        quality: 0,
        knowledge: 0,
        discipline: 0,
        attitude: 0
    });
    const [managerRatings, setManagerRatings] = useState(null);
    const [managerRecommendation, setManagerRecommendation] = useState('');
    const [status, setStatus] = useState('draft');
    const [submittedAt, setSubmittedAt] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [adminRemarks, setAdminRemarks] = useState('');

    useEffect(() => {
        fetchConfirmationData();
    }, [applicant?.email]);

    const fetchConfirmationData = async () => {
        if (!applicant?.email) return;
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/applicant/confirmation-process?email=${encodeURIComponent(applicant.email)}`);
            const data = await res.json();
            if (data.success) {
                const calcMonths = data.calculatedMonths || [];
                const existing = data.confirmationData || {};

                setStatus(existing.status || 'draft');
                setSubmittedAt(existing.submittedAt || null);
                setRemarks(existing.remarks || '');
                setAdminRemarks(existing.adminRemarks || '');
                setManagerRatings(existing.managerRatings || null);
                setManagerRecommendation(existing.managerRecommendation || '');

                if (existing.selfRatings) {
                    setSelfRatings({
                        sales: Number(existing.selfRatings.sales) || 0,
                        fieldWork: Number(existing.selfRatings.fieldWork) || 0,
                        quality: Number(existing.selfRatings.quality) || 0,
                        knowledge: Number(existing.selfRatings.knowledge) || 0,
                        discipline: Number(existing.selfRatings.discipline) || 0,
                        attitude: Number(existing.selfRatings.attitude) || 0
                    });
                }

                const savedMonthsMap = {};
                if (Array.isArray(existing.months)) {
                    existing.months.forEach(m => {
                        savedMonthsMap[m.monthIndex] = m;
                    });
                }

                const initialList = calcMonths.map((cm, idx) => {
                    const saved = savedMonthsMap[cm.monthIndex || (idx + 1)] || {};
                    const drVisits = saved.drVisits !== undefined ? saved.drVisits : '';
                    const totCalls = saved.totCalls !== undefined ? saved.totCalls : '';
                    const callAvg = saved.callAvg !== undefined ? saved.callAvg : '';
                    const pob = saved.pob !== undefined ? saved.pob : '';
                    const secObj = saved.secObj !== undefined ? saved.secObj : '';
                    const secAchieved = saved.secAchieved !== undefined ? saved.secAchieved : '';

                    return {
                        monthIndex: cm.monthIndex || (idx + 1),
                        monthLabel: cm.monthLabel || `Month ${idx + 1}`,
                        drVisits,
                        totCalls,
                        callAvg,
                        pob,
                        secObj,
                        secAchieved
                    };
                });

                setMonthsData(initialList);
            } else {
                setErrorMsg(data.message || 'Failed to load confirmation details');
            }
        } catch (err) {
            console.error('Fetch confirmation error:', err);
            setErrorMsg('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
        setMonthsData(prev => {
            const updated = [...prev];
            const row = { ...updated[index], [field]: value };

            const dr = parseFloat(field === 'drVisits' ? value : row.drVisits);
            const calls = parseFloat(field === 'totCalls' ? value : row.totCalls);
            if (!isNaN(dr) && dr > 0 && !isNaN(calls) && calls >= 0) {
                row.callAvg = (calls / dr).toFixed(1);
            }

            updated[index] = row;
            return updated;
        });
    };

    const handleRatingChange = (pillarId, maxWeight, value) => {
        let intVal = parseInt(value, 10);
        if (isNaN(intVal) || intVal < 0) intVal = 0;
        if (intVal > maxWeight) intVal = maxWeight;

        setSelfRatings(prev => ({
            ...prev,
            [pillarId]: intVal
        }));
    };

    // Calculate row % and cumulative totals for Part A
    const { rowsCalculated, totals } = useMemo(() => {
        let totalDr = 0;
        let totalCalls = 0;
        let totalPob = 0;
        let totalSecObj = 0;
        let totalSecAch = 0;

        const rows = monthsData.map(m => {
            const dr = parseFloat(m.drVisits) || 0;
            const calls = parseFloat(m.totCalls) || 0;
            const pob = parseFloat(m.pob) || 0;
            const obj = parseFloat(m.secObj) || 0;
            const ach = parseFloat(m.secAchieved) || 0;
            const callAvg = parseFloat(m.callAvg) || (dr > 0 ? parseFloat((calls / dr).toFixed(1)) : 0);

            totalDr += dr;
            totalCalls += calls;
            totalPob += pob;
            totalSecObj += obj;
            totalSecAch += ach;

            const pct = obj > 0 ? ((ach / obj) * 100).toFixed(1) : 0;

            return {
                ...m,
                computedPct: parseFloat(pct)
            };
        });

        const overallCallAvg = totalDr > 0 ? (totalCalls / totalDr).toFixed(1) : 0;
        const overallPct = totalSecObj > 0 ? ((totalSecAch / totalSecObj) * 100).toFixed(1) : 0;

        return {
            rowsCalculated: rows,
            totals: {
                totalDr,
                totalCalls,
                overallCallAvg,
                totalPob,
                totalSecObj,
                totalSecAch,
                overallPct: parseFloat(overallPct)
            }
        };
    }, [monthsData]);

    // Calculate total marks for Part B
    const totalSelfMarks = useMemo(() => {
        return (Number(selfRatings.sales) || 0) +
               (Number(selfRatings.fieldWork) || 0) +
               (Number(selfRatings.quality) || 0) +
               (Number(selfRatings.knowledge) || 0) +
               (Number(selfRatings.discipline) || 0) +
               (Number(selfRatings.attitude) || 0);
    }, [selfRatings]);

    const totalManagerMarks = useMemo(() => {
        if (!managerRatings) return null;
        return (Number(managerRatings.sales) || 0) +
               (Number(managerRatings.fieldWork) || 0) +
               (Number(managerRatings.quality) || 0) +
               (Number(managerRatings.knowledge) || 0) +
               (Number(managerRatings.discipline) || 0) +
               (Number(managerRatings.attitude) || 0);
    }, [managerRatings]);

    const handleSaveOrSubmit = async (isSubmit) => {
        setErrorMsg('');
        setSuccessMsg('');

        if (isSubmit) {
            if (totalSelfMarks === 0) {
                if (!window.confirm("⚠️ You have not assigned yourself marks in the 6 Confirmation Pillars. Do you still wish to submit?")) {
                    return;
                }
            } else {
                if (!window.confirm(`🚀 Submit your 5-month field data and Self-Assessment (${totalSelfMarks}/100) to Reporting Manager for Confirmation Review?`)) {
                    return;
                }
            }
            setSubmitting(true);
        } else {
            setSaving(true);
        }

        try {
            const payload = {
                email: applicant.email,
                months: rowsCalculated,
                selfRatings,
                isSubmit,
                remarks
            };

            const res = await fetch('/api/applicant/confirmation-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMsg(data.message || (isSubmit ? 'Submitted successfully!' : 'Saved draft successfully!'));
                if (data.confirmationData) {
                    setStatus(data.confirmationData.status);
                    setSubmittedAt(data.confirmationData.submittedAt);
                }
            } else {
                setErrorMsg(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setErrorMsg('Network error. Failed to save confirmation process data.');
        } finally {
            setSaving(false);
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        const n = Number(val) || 0;
        return '₹' + n.toLocaleString('en-IN');
    };

    const getPctColor = (pct) => {
        if (pct >= 100) return '#10b981';
        if (pct >= 85) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔄</div>
                <p>Loading Confirmation Evaluation Process...</p>
            </div>
        );
    }

    const isSubmitted = status === 'submitted';

    return (
        <div style={{ maxWidth: '1150px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.8rem' }}>📋</span>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                                Confirmation Evaluation Process
                            </h2>
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.5' }}>
                            5-Month Field Performance records &amp; 100-Mark Dual-Assessment Evaluation (Employee Self-Rating + Reporting Manager Assessment).
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isSubmitted ? (
                            <span style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                Submitted on {submittedAt ? new Date(submittedAt).toLocaleDateString('en-GB') : 'Review'}
                            </span>
                        ) : (
                            <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid #f59e0b',
                                color: '#fbbf24',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                                Draft Mode (Pending Submission)
                            </span>
                        )}
                        {onBack && (
                            <button
                                onClick={onBack}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #475569',
                                    color: '#cbd5e1',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem'
                                }}
                            >
                                ✕ Close
                            </button>
                        )}
                    </div>
                </div>

                {/* Candidate Info Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginTop: '20px',
                    padding: '14px 18px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '0.85rem'
                }}>
                    <div><span style={{ color: '#94a3b8' }}>Employee:</span> <strong style={{ color: '#f8fafc' }}>{applicant?.fullName}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Emp Code:</span> <strong style={{ color: '#38bdf8' }}>{applicant?.empCode || 'N/A'}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Designation:</span> <strong style={{ color: '#f8fafc' }}>{applicant?.designation || 'Medical Representative'}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>HQ:</span> <strong style={{ color: '#f8fafc' }}>{applicant?.hq || 'N/A'}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>ADOJ:</span> <strong style={{ color: '#facc15' }}>{applicant?.actualJoiningDate || 'N/A'}</strong></div>
                </div>

                {/* Dual-Score Comparison Banner (When Manager has evaluated) */}
                {totalManagerMarks !== null && (
                    <div style={{
                        marginTop: '18px',
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                        border: '1px solid #0284c7',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px'
                    }}>
                        <div>
                            <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.95rem' }}>
                                🎯 Final Confirmation Assessment Summary
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px' }}>
                                Recommendation: <strong style={{ color: totalManagerMarks >= 75 ? '#34d399' : '#fbbf24' }}>{managerRecommendation || (totalManagerMarks >= 75 ? 'Confirmed' : 'Probation Extension')}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Self Score</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>{totalSelfMarks} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/100</span></div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Manager Score</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{totalManagerMarks} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/100</span></div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Variance Gap</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: Math.abs(totalSelfMarks - totalManagerMarks) <= 10 ? '#34d399' : '#f87171' }}>
                                    {totalSelfMarks - totalManagerMarks > 0 ? `+${totalSelfMarks - totalManagerMarks}` : totalSelfMarks - totalManagerMarks}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Messages */}
            {successMsg && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#6ee7b7',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '0.9rem'
                }}>
                    ✅ {successMsg}
                </div>
            )}
            {errorMsg && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '0.9rem'
                }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            {/* SECTION 1: 5-Month Field Performance Table */}
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                        📊 Section 1: 5-Month Field Activity &amp; Sales Numbers
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        * Call Avg auto-calculated: Tot Calls / Dr Visits | % Achvmnt: (Sec Achivd / Sec Obj) × 100
                    </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: '780px' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Month</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Dr Visite</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Tot Calls</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Call Avg</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>POB (₹)</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Sec Obj (₹)</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Sec Achivd (₹)</th>
                                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>% of Achvmnt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsCalculated.map((row, idx) => (
                                <tr
                                    key={row.monthIndex || idx}
                                    style={{
                                        borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
                                        background: idx % 2 === 1 ? 'rgba(15, 23, 42, 0.3)' : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                        <div style={{ fontSize: '0.88rem' }}>{row.monthLabel}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Month {idx + 1} of 5</div>
                                    </td>

                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.drVisits}
                                            onChange={(e) => handleFieldChange(idx, 'drVisits', e.target.value)}
                                            placeholder="0"
                                            style={inputStyle}
                                        />
                                    </td>

                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.totCalls}
                                            onChange={(e) => handleFieldChange(idx, 'totCalls', e.target.value)}
                                            placeholder="0"
                                            style={inputStyle}
                                        />
                                    </td>

                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={row.callAvg}
                                            onChange={(e) => handleFieldChange(idx, 'callAvg', e.target.value)}
                                            placeholder="0.0"
                                            style={{ ...inputStyle, background: 'rgba(30, 41, 59, 0.8)', color: '#38bdf8' }}
                                        />
                                    </td>

                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.pob}
                                            onChange={(e) => handleFieldChange(idx, 'pob', e.target.value)}
                                            placeholder="0"
                                            style={inputStyle}
                                        />
                                    </td>

                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.secObj}
                                            onChange={(e) => handleFieldChange(idx, 'secObj', e.target.value)}
                                            placeholder="0"
                                            style={inputStyle}
                                        />
                                    </td>

                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.secAchieved}
                                            onChange={(e) => handleFieldChange(idx, 'secAchieved', e.target.value)}
                                            placeholder="0"
                                            style={inputStyle}
                                        />
                                    </td>

                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            background: `rgba(${row.computedPct >= 100 ? '16, 185, 129' : (row.computedPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.15)`,
                                            color: getPctColor(row.computedPct),
                                            border: `1px solid ${getPctColor(row.computedPct)}`
                                        }}>
                                            {row.computedPct}%
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            <tr style={{ background: '#090d16', borderTop: '2px solid #475569', fontWeight: 800 }}>
                                <td style={{ padding: '14px', color: '#f8fafc', fontSize: '0.92rem' }}>
                                    📈 Cumulative Total
                                </td>
                                <td style={{ padding: '14px 10px', color: '#f8fafc' }}>
                                    {totals.totalDr.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '14px 10px', color: '#f8fafc' }}>
                                    {totals.totalCalls.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '14px 10px', color: '#38bdf8' }}>
                                    {totals.overallCallAvg} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>avg</span>
                                </td>
                                <td style={{ padding: '14px 10px', color: '#f8fafc' }}>
                                    {formatCurrency(totals.totalPob)}
                                </td>
                                <td style={{ padding: '14px 10px', color: '#f8fafc' }}>
                                    {formatCurrency(totals.totalSecObj)}
                                </td>
                                <td style={{ padding: '14px 10px', color: '#f8fafc' }}>
                                    {formatCurrency(totals.totalSecAch)}
                                </td>
                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '5px 12px',
                                        borderRadius: '14px',
                                        fontSize: '0.92rem',
                                        fontWeight: 900,
                                        background: `rgba(${totals.overallPct >= 100 ? '16, 185, 129' : (totals.overallPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.2)`,
                                        color: getPctColor(totals.overallPct),
                                        border: `1px solid ${getPctColor(totals.overallPct)}`
                                    }}>
                                        {totals.overallPct}% Overall
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 2: 6 Core Confirmation Pillars (100 Marks Evaluation) */}
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
                            🎯 Section 2: Confirmation Parameters (100 Marks Evaluation)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                            Rate your performance across the 6 parameters. Marks must be whole numbers without decimals.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(14, 165, 233, 0.15)',
                        border: '1px solid #0284c7',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Self-Score:</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>{totalSelfMarks}</span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ 100</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                    {EVALUATION_PILLARS.map((pillar) => {
                        const val = selfRatings[pillar.id] !== undefined ? selfRatings[pillar.id] : 0;
                        const mgrVal = managerRatings ? managerRatings[pillar.id] : null;

                        return (
                            <div
                                key={pillar.id}
                                style={{
                                    background: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ flex: '1 1 350px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.98rem', fontWeight: 700 }}>
                                            {pillar.title}
                                        </h4>
                                        <span style={{
                                            background: '#334155',
                                            color: '#38bdf8',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            Max {pillar.weight} Marks
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
                                        {pillar.desc}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    {/* MR Self-Rating Input */}
                                    <div style={{ textAlign: 'center' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                            Self Rating
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max={pillar.weight}
                                                step="1"
                                                value={val}
                                                onChange={(e) => handleRatingChange(pillar.id, pillar.weight, e.target.value)}
                                                style={{
                                                    width: '64px',
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                    background: '#1e293b',
                                                    border: '1px solid #475569',
                                                    borderRadius: '8px',
                                                    color: '#f8fafc',
                                                    fontWeight: 800,
                                                    fontSize: '1rem'
                                                }}
                                            />
                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ {pillar.weight}</span>
                                        </div>
                                    </div>

                                    {/* Manager Assigned Rating (if available) */}
                                    {mgrVal !== null && (
                                        <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', paddingLeft: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                Manager Rating
                                            </label>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                                                {mgrVal} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>/{pillar.weight}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Remarks & Notes */}
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
            }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
                    📝 Employee Remarks / Justification (Optional)
                </label>
                <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide any context on sales performance, doctor support, new product feedback, or market opportunities..."
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Action Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '16px 20px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '14px'
            }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {isSubmitted ? (
                        <span>🔒 Submitted for Reporting Manager Evaluation. You can make adjustments and re-save if needed.</span>
                    ) : (
                        <span>💡 Enter both Section 1 (Numbers) and Section 2 (Self-Rating) before submitting to Manager.</span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => handleSaveOrSubmit(false)}
                        disabled={saving || submitting}
                        style={{
                            background: '#334155',
                            color: '#f8fafc',
                            border: '1px solid #475569',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                            fontSize: '0.88rem'
                        }}
                    >
                        {saving ? 'Saving Draft...' : '💾 Save Draft'}
                    </button>

                    <button
                        onClick={() => handleSaveOrSubmit(true)}
                        disabled={saving || submitting}
                        style={{
                            background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 22px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                            fontSize: '0.9rem'
                        }}
                    >
                        {submitting ? 'Submitting...' : '🚀 Submit to Manager for Confirmation Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '0.88rem',
    fontWeight: '600',
    boxSizing: 'border-box'
};
