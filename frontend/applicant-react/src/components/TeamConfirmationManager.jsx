import React, { useState, useEffect, useMemo } from 'react';

const formatDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'N/A';
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const parts = s.substring(0, 10).split('-');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    try {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        }
    } catch (e) {}
    return s;
};

const formatCurrency = (val) => {
    const num = Number(val);
    if (!num || isNaN(num)) return '₹0';
    return '₹' + num.toLocaleString('en-IN');
};

const MANAGER_PILLARS = [
    {
        id: 'sales',
        title: '1. Sales Performance',
        weight: 45,
        desc: 'Achievement vs Target (Primary & Secondary sales), Growth over predecessor/prior period, Focus/new-launch brands, New prescribers generated, Stockist/chemist stocking of key brands, Expiry & breakage control.'
    },
    {
        id: 'fieldWork',
        title: '2. Field Work & Coverage',
        weight: 20,
        desc: 'Doctor Call Average (norm 10–12/day) and Chemist Calls (4–6/day), Doctor List (MSL) coverage %, Call frequency adherence on core doctors, Field working days, Tour plan adherence, Chemist/stockist visits & POB.'
    },
    {
        id: 'quality',
        title: '3. Quality of Work',
        weight: 15,
        desc: 'RCPA (Retail Chemist Prescription Audit) regularity & accuracy, Detailing skills & visual aid story delivery, objection handling (judged on joint working days), Doctor relationships & conversion.'
    },
    {
        id: 'knowledge',
        title: '4. Knowledge',
        weight: 10,
        desc: 'Product, disease and competitor knowledge test scores, understanding of pharmacology & therapeutics, timely completion of induction modules.'
    },
    {
        id: 'discipline',
        title: '5. Reporting & Discipline',
        weight: 5,
        desc: 'Timely and genuine DCR entries in CRM/SFA, accuracy of expense claims, compliance with sample & gift distribution norms & UCPMP code, meeting punctuality.'
    },
    {
        id: 'attitude',
        title: '6. Attitude & Behaviour',
        weight: 5,
        desc: 'Initiative, coachability & constructive response to feedback, integrity (no fake calls or misreporting), grooming & communication skills, stockist relationship & teamwork.'
    }
];

export default function TeamConfirmationManager({ applicant, onBack }) {
    const [loading, setLoading] = useState(true);
    const [reportees, setReportees] = useState([]);
    const [selectedReportee, setSelectedReportee] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [savingEval, setSavingEval] = useState(false);
    const [evalSuccess, setEvalSuccess] = useState('');
    const [evalError, setEvalError] = useState('');

    const [mgrRatings, setMgrRatings] = useState({
        sales: 0,
        fieldWork: 0,
        quality: 0,
        knowledge: 0,
        discipline: 0,
        attitude: 0
    });
    const [mgrRecommendation, setMgrRecommendation] = useState('confirm');
    const [mgrRemarks, setMgrRemarks] = useState('');

    useEffect(() => {
        fetchTeamReportees();
    }, [applicant?.email]);

    const fetchTeamReportees = async () => {
        if (!applicant?.email && !applicant?.fullName) return;
        setLoading(true);
        try {
            const url = `/api/applicant/team-confirmations?managerEmail=${encodeURIComponent(applicant.email || '')}&managerName=${encodeURIComponent(applicant.fullName || '')}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setReportees(data.reportees || []);
            }
        } catch (e) {
            console.error('Failed to fetch team confirmations:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReportee = (r) => {
        setSelectedReportee(r);
        setEvalSuccess('');
        setEvalError('');

        const conf = r.confirmationData || {};
        const existingMgr = conf.managerRatings || {};
        setMgrRatings({
            sales: existingMgr.sales !== undefined ? existingMgr.sales : 0,
            fieldWork: existingMgr.fieldWork !== undefined ? existingMgr.fieldWork : 0,
            quality: existingMgr.quality !== undefined ? existingMgr.quality : 0,
            knowledge: existingMgr.knowledge !== undefined ? existingMgr.knowledge : 0,
            discipline: existingMgr.discipline !== undefined ? existingMgr.discipline : 0,
            attitude: existingMgr.attitude !== undefined ? existingMgr.attitude : 0
        });
        setMgrRecommendation(conf.managerRecommendation || 'confirm');
        setMgrRemarks(conf.managerRemarks || '');
        setEvaluating(true);
    };

    const handleRatingChange = (field, maxVal, val) => {
        let num = parseInt(val, 10);
        if (isNaN(num)) num = 0;
        if (num < 0) num = 0;
        if (num > maxVal) num = maxVal;
        setMgrRatings(prev => ({ ...prev, [field]: num }));
    };

    const totalMgrScore = useMemo(() => {
        return (Number(mgrRatings.sales) || 0) +
               (Number(mgrRatings.fieldWork) || 0) +
               (Number(mgrRatings.quality) || 0) +
               (Number(mgrRatings.knowledge) || 0) +
               (Number(mgrRatings.discipline) || 0) +
               (Number(mgrRatings.attitude) || 0);
    }, [mgrRatings]);

    const finalGrade = useMemo(() => {
        if (totalMgrScore >= 85) return 'A+';
        if (totalMgrScore >= 75) return 'A';
        if (totalMgrScore >= 60) return 'B';
        if (totalMgrScore >= 50) return 'C';
        return 'D';
    }, [totalMgrScore]);

    const handleSubmitEvaluation = async () => {
        if (!selectedReportee?.email) return;
        setSavingEval(true);
        setEvalError('');
        setEvalSuccess('');

        try {
            const res = await fetch('/api/applicant/evaluate-reportee-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporteeEmail: selectedReportee.email,
                    managerEmail: applicant.email,
                    managerRatings: mgrRatings,
                    managerRecommendation: mgrRecommendation,
                    managerRemarks: mgrRemarks
                })
            });
            const data = await res.json();
            if (data.success) {
                setEvalSuccess(`Manager evaluation for ${selectedReportee.fullName} submitted successfully!`);
                await fetchTeamReportees();
                setSelectedReportee(prev => ({
                    ...prev,
                    confirmationData: data.confirmationData,
                    status: 'manager_evaluated'
                }));
            } else {
                setEvalError(data.message || 'Failed to submit evaluation.');
            }
        } catch (e) {
            setEvalError('Network error while submitting evaluation.');
        } finally {
            setSavingEval(false);
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '100%',
            padding: '16px 24px',
            boxSizing: 'border-box',
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#f8fafc'
        }}>
            {/* Top Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={evaluating ? () => setEvaluating(false) : onBack}
                        style={{
                            background: '#1e293b',
                            border: '1px solid #475569',
                            color: '#94a3b8',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                            fontWeight: 700
                        }}
                    >
                        ← {evaluating ? 'Back to Team List' : 'Back to Dashboard'}
                    </button>
                    <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: 800 }}>
                        👥 Team Confirmation Reviews
                    </h2>
                </div>

                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Manager: <strong style={{ color: '#38bdf8' }}>{applicant?.fullName}</strong> ({applicant?.designation || 'Reporting Manager'})
                </div>
            </div>

            {/* If NOT in evaluation sub-view, show Reportees List */}
            {!evaluating ? (
                <div>
                    {/* Intro Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '22px 26px',
                        marginBottom: '22px'
                    }}>
                        <h3 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                            Reporting Manager Assessment Portal
                        </h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5' }}>
                            Employees who have completed at least 5 months submit their field activity and self-ratings. As their reporting manager, review their 5-month field data, forward 6th-month projection, and rate them across the 6 parameters (out of 100 Marks).
                        </p>
                    </div>

                    {/* Reportees Table */}
                    <div style={{
                        background: '#131b2e',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                                <thead>
                                    <tr style={{ background: '#090e1a', color: '#94a3b8', borderBottom: '1px solid #334155', textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.5px' }}>
                                        <th style={{ padding: '14px 18px' }}>Team Member / Reportee</th>
                                        <th style={{ padding: '14px 14px' }}>Designation &amp; HQ</th>
                                        <th style={{ padding: '14px 14px' }}>ADOJ &amp; Service</th>
                                        <th style={{ padding: '14px 14px', textAlign: 'center' }}>Self Score</th>
                                        <th style={{ padding: '14px 14px', textAlign: 'center' }}>Manager Score</th>
                                        <th style={{ padding: '14px 14px' }}>Status</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                                Loading team reportees...
                                            </td>
                                        </tr>
                                    ) : reportees.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                                No team members found reporting to you.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportees.map((r, idx) => {
                                            const conf = r.confirmationData || {};
                                            const selfScore = conf.totalSelfScore;
                                            const mgrScore = conf.totalManagerScore;
                                            const isPendingMgr = r.status === 'pending_manager_review';
                                            const isEvaluated = r.status === 'manager_evaluated';
                                            const isConfirmed = r.status === 'confirmed';

                                            return (
                                                <tr key={r.email || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.94rem' }}>{r.fullName}</div>
                                                        <div style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, marginTop: '2px' }}>{r.empCode || 'N/A'}</div>
                                                    </td>

                                                    <td style={{ padding: '14px 14px' }}>
                                                        <div style={{ color: '#ffffff', fontWeight: 600 }}>{r.designation || 'Medical Representative'}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>HQ: <strong style={{ color: '#cbd5e1' }}>{r.hq || 'N/A'}</strong></div>
                                                    </td>

                                                    <td style={{ padding: '14px 14px' }}>
                                                        <div style={{ color: '#facc15', fontWeight: 700 }}>{formatDDMMYYYY(r.actualJoiningDate)}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>{r.completedMonths} Months Completed</div>
                                                    </td>

                                                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                                        {selfScore !== undefined && selfScore !== null ? (
                                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>
                                                                {selfScore} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/ 100</span>
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Not rated</span>
                                                        )}
                                                    </td>

                                                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                                        {mgrScore !== undefined && mgrScore !== null ? (
                                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>
                                                                {mgrScore} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/ 100</span>
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Pending</span>
                                                        )}
                                                    </td>

                                                    <td style={{ padding: '14px 14px' }}>
                                                        {isConfirmed ? (
                                                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                                ✓ Confirmed
                                                            </span>
                                                        ) : isEvaluated ? (
                                                            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                                Evaluated (Ready for Admin)
                                                            </span>
                                                        ) : isPendingMgr ? (
                                                            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                                Pending Your Review
                                                            </span>
                                                        ) : (
                                                            <span style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid #475569', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleSelectReportee(r)}
                                                            style={{
                                                                background: isPendingMgr ? 'linear-gradient(135deg, #0ea5e9, #4f46e5)' : '#1e293b',
                                                                color: '#ffffff',
                                                                border: isPendingMgr ? 'none' : '1px solid #475569',
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontWeight: 700,
                                                                fontSize: '0.82rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {isEvaluated ? 'Re-Evaluate / View' : 'Evaluate Reportee ➔'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* Single Reportee Evaluation Mode */
                <div>
                    {/* Header Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '22px 28px',
                        marginBottom: '22px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.35rem', fontWeight: 800 }}>
                                    Evaluating: {selectedReportee?.fullName}
                                </h3>
                                <div style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '4px', display: 'flex', gap: '12px' }}>
                                    <span>Code: <strong style={{ color: '#38bdf8' }}>{selectedReportee?.empCode || 'N/A'}</strong></span>
                                    <span>•</span>
                                    <span>Designation: <strong style={{ color: '#ffffff' }}>{selectedReportee?.designation || 'Medical Representative'}</strong></span>
                                    <span>•</span>
                                    <span>HQ: <strong style={{ color: '#ffffff' }}>{selectedReportee?.hq || 'N/A'}</strong></span>
                                    <span>•</span>
                                    <span>ADOJ: <strong style={{ color: '#facc15' }}>{formatDDMMYYYY(selectedReportee?.actualJoiningDate)}</strong></span>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                textAlign: 'right'
                            }}>
                                <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Manager Score</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399' }}>
                                    {totalMgrScore} <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ 100 (Grade {finalGrade})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {evalSuccess && (
                        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', borderRadius: '10px', marginBottom: '20px', fontWeight: 700 }}>
                            {evalSuccess}
                        </div>
                    )}
                    {evalError && (
                        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '10px', marginBottom: '20px', fontWeight: 700 }}>
                            {evalError}
                        </div>
                    )}

                    {/* Section 1: Candidate's Submitted Field Numbers */}
                    <div style={{
                        background: '#131b2e',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        padding: '22px 26px',
                        marginBottom: '22px'
                    }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1.05rem', fontWeight: 800 }}>
                            📊 Section 1: 5-Month Field Performance (Actuals) &amp; 6th-Month Projection
                        </h4>

                        {selectedReportee?.confirmationData?.months && selectedReportee.confirmationData.months.length > 0 ? (
                            <div style={{ overflowX: 'auto', background: '#090e1a', borderRadius: '12px', border: '1px solid #334155' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                                    <thead>
                                        <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Month</th>
                                            <th style={{ padding: '10px 8px' }}>Days</th>
                                            <th style={{ padding: '10px 8px' }}>Dr Vis</th>
                                            <th style={{ padding: '10px 8px' }}>Calls</th>
                                            <th style={{ padding: '10px 8px' }}>Call Avg</th>
                                            <th style={{ padding: '10px 8px' }}>POB (₹)</th>
                                            <th style={{ padding: '10px 8px' }}>Sec Obj (₹)</th>
                                            <th style={{ padding: '10px 8px' }}>Sec Ach (₹)</th>
                                            <th style={{ padding: '10px 8px', textAlign: 'center' }}>% Sec</th>
                                            <th style={{ padding: '10px 8px' }}>Coll Obj (₹)</th>
                                            <th style={{ padding: '10px 8px' }}>Coll Ach (₹)</th>
                                            <th style={{ padding: '10px 8px', textAlign: 'center' }}>% Coll</th>
                                            <th style={{ padding: '10px 8px' }}>Salary &amp; Exp</th>
                                            <th style={{ padding: '10px 8px' }}>Activity</th>
                                            <th style={{ padding: '10px 8px' }}>LOP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReportee.confirmationData.months.map((m, mIdx) => (
                                            <tr key={mIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: m.isProjection ? 'rgba(56, 189, 248, 0.08)' : 'transparent' }}>
                                                <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: m.isProjection ? '#38bdf8' : '#ffffff' }}>
                                                    {m.monthLabel} {m.isProjection ? '(🎯 Proj)' : ''}
                                                </td>
                                                <td style={{ padding: '10px 8px', color: '#ffffff' }}>{m.daysWorked || 0}</td>
                                                <td style={{ padding: '10px 8px', color: '#ffffff' }}>{m.drVisits || 0}</td>
                                                <td style={{ padding: '10px 8px', color: '#ffffff' }}>{m.totCalls || 0}</td>
                                                <td style={{ padding: '10px 8px', color: '#38bdf8', fontWeight: 700 }}>{m.callAvg || 0}</td>
                                                <td style={{ padding: '10px 8px', color: '#ffffff' }}>{formatCurrency(m.pob)}</td>
                                                <td style={{ padding: '10px 8px', color: '#38bdf8' }}>{formatCurrency(m.secObj)}</td>
                                                <td style={{ padding: '10px 8px', color: '#38bdf8', fontWeight: 700 }}>{formatCurrency(m.secAchieved)}</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'center', color: m.achievementPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                                                    {m.achievementPct || 0}%
                                                </td>
                                                <td style={{ padding: '10px 8px', color: '#34d399' }}>{formatCurrency(m.collObj)}</td>
                                                <td style={{ padding: '10px 8px', color: '#34d399', fontWeight: 700 }}>{formatCurrency(m.collAchieved)}</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'center', color: m.collAchievementPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                                                    {m.collAchievementPct || 0}%
                                                </td>
                                                <td style={{ padding: '10px 8px', color: '#fef08a' }}>{formatCurrency(m.salaryExpense)}</td>
                                                <td style={{ padding: '10px 8px', color: '#fed7aa' }}>{formatCurrency(m.totActivityAmt)}</td>
                                                <td style={{ padding: '10px 8px', color: m.lopDays > 0 ? '#f87171' : '#ffffff' }}>{m.lopDays || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
                                No field performance records submitted yet by this reportee.
                            </div>
                        )}
                    </div>

                    {/* Section 2: Manager Evaluation on the 6 Parameters */}
                    <div style={{
                        background: '#131b2e',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        padding: '24px 28px',
                        marginBottom: '22px'
                    }}>
                        <div style={{ marginBottom: '18px' }}>
                            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                                🎯 Section 2: Reporting Manager Assessment (100 Marks)
                            </h4>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                                Evaluate this reportee across the 6 parameters. Enter whole numbers only (no decimals). Compare against the reportee's self-rating.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            {MANAGER_PILLARS.map(pillar => {
                                const selfVal = selectedReportee?.confirmationData?.selfRatings?.[pillar.id];
                                const mgrVal = mgrRatings[pillar.id] !== undefined ? mgrRatings[pillar.id] : 0;

                                return (
                                    <div
                                        key={pillar.id}
                                        style={{
                                            background: '#090e1a',
                                            border: '1px solid #334155',
                                            borderRadius: '12px',
                                            padding: '18px 22px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '16px'
                                        }}
                                    >
                                        <div style={{ flex: '1 1 340px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <h5 style={{ margin: 0, color: '#ffffff', fontSize: '0.96rem', fontWeight: 700 }}>
                                                    {pillar.title}
                                                </h5>
                                                <span style={{
                                                    background: '#1e293b',
                                                    border: '1px solid #334155',
                                                    color: '#38bdf8',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: '6px'
                                                }}>
                                                    Max {pillar.weight} Marks
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.5' }}>
                                                {pillar.desc}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            {/* Reportee Self Rating */}
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>MR Self-Score</div>
                                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                                                    {selfVal !== undefined ? selfVal : '-'}
                                                </div>
                                            </div>

                                            {/* Manager Rating Input */}
                                            <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', paddingLeft: '18px' }}>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                                                    Manager Rating
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={pillar.weight}
                                                        step="1"
                                                        value={mgrVal}
                                                        onChange={(e) => handleRatingChange(pillar.id, pillar.weight, e.target.value)}
                                                        style={{
                                                            width: '75px',
                                                            height: '40px',
                                                            padding: '6px 8px',
                                                            textAlign: 'center',
                                                            background: '#131b2e',
                                                            border: '1.5px solid #10b981',
                                                            borderRadius: '8px',
                                                            color: '#34d399',
                                                            fontWeight: 900,
                                                            fontSize: '1.1rem',
                                                            fontFamily: 'inherit',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <span style={{ color: '#64748b', fontSize: '0.84rem', fontWeight: 600 }}>/ {pillar.weight}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Manager Recommendation & Remarks */}
                    <div style={{
                        background: '#131b2e',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        padding: '22px 26px',
                        marginBottom: '22px'
                    }}>
                        <h4 style={{ margin: '0 0 14px 0', color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>
                            📝 Section 3: Manager Final Recommendation &amp; Territory Remarks
                        </h4>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.84rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                                Final Recommendation:
                            </label>
                            <select
                                value={mgrRecommendation}
                                onChange={(e) => setMgrRecommendation(e.target.value)}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '10px 14px',
                                    background: '#090e1a',
                                    border: '1.5px solid #334155',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '0.88rem',
                                    fontWeight: 700,
                                    outline: 'none'
                                }}
                            >
                                <option value="confirm">✓ Recommend for Full Confirmation</option>
                                <option value="extend_probation">⏳ Extend Probation Period by 3 Months</option>
                                <option value="not_recommended">✕ Not Recommended for Confirmation</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.84rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                                Detailed Manager Remarks / Field Working Feedback:
                            </label>
                            <textarea
                                rows={3}
                                value={mgrRemarks}
                                onChange={(e) => setMgrRemarks(e.target.value)}
                                placeholder="State your observations from joint working days, product detailing proficiency, doctor conversions, and integrity..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: '#090e1a',
                                    border: '1.5px solid #334155',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '0.88rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '18px 24px',
                        background: '#090e1a',
                        border: '1px solid #334155',
                        borderRadius: '14px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                            Submitting will update the employee's confirmation dossier for Admin Approval.
                        </div>

                        <button
                            onClick={handleSubmitEvaluation}
                            disabled={savingEval}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '12px 28px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.94rem',
                                cursor: savingEval ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)'
                            }}
                        >
                            {savingEval ? 'Submitting Evaluation...' : '✓ Submit Manager Evaluation (100 Marks)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
