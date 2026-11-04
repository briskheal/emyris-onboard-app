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

// Format date strictly as DD-MM-YYYY
const formatDDMMYYYY = (dateVal) => {
    if (!dateVal) return 'N/A';
    const s = String(dateVal).trim();
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(s)) {
        return s.replace(/\//g, '-');
    }
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
                    const isProjection = cm.isProjection || idx === 5;
                    const daysWorked = saved.daysWorked !== undefined ? saved.daysWorked : '';
                    const drVisits = saved.drVisits !== undefined ? saved.drVisits : '';
                    const totCalls = saved.totCalls !== undefined ? saved.totCalls : '';
                    const callAvg = saved.callAvg !== undefined ? saved.callAvg : '';
                    const pob = saved.pob !== undefined ? saved.pob : '';
                    const secObj = saved.secObj !== undefined ? saved.secObj : '';
                    const secAchieved = saved.secAchieved !== undefined ? saved.secAchieved : '';
                    const collObj = saved.collObj !== undefined ? saved.collObj : '';
                    const collAchieved = saved.collAchieved !== undefined ? saved.collAchieved : '';
                    const salaryExpense = saved.salaryExpense !== undefined ? saved.salaryExpense : '';
                    const totActivityAmt = saved.totActivityAmt !== undefined ? saved.totActivityAmt : '';
                    const lopDays = saved.lopDays !== undefined ? saved.lopDays : '';

                    return {
                        monthIndex: cm.monthIndex || (idx + 1),
                        monthLabel: cm.monthLabel || `Month ${idx + 1}`,
                        isProjection,
                        daysWorked,
                        drVisits,
                        totCalls,
                        callAvg,
                        pob,
                        secObj,
                        secAchieved,
                        collObj,
                        collAchieved,
                        salaryExpense,
                        totActivityAmt,
                        lopDays
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

    // Calculate row % (Sec + Coll) and separate Actuals (M1-M5) vs Projection (M6) totals
    const { rowsCalculated, actualsTotals, projectionRow, combinedTotals } = useMemo(() => {
        let actDays = 0, actDr = 0, actCalls = 0, actPob = 0, actSecObj = 0, actSecAch = 0, actCollObj = 0, actCollAch = 0, actSalaryExp = 0, actActAmt = 0, actLop = 0;
        let totDays = 0, totDr = 0, totCalls = 0, totPob = 0, totSecObj = 0, totSecAch = 0, totCollObj = 0, totCollAch = 0, totSalaryExp = 0, totActAmt = 0, totLop = 0;
        let projRow = null;

        const rows = monthsData.map((m, idx) => {
            const isProjection = m.isProjection || idx === 5;
            const days = parseFloat(m.daysWorked) || 0;
            const dr = parseFloat(m.drVisits) || 0;
            const calls = parseFloat(m.totCalls) || 0;
            const pob = parseFloat(m.pob) || 0;
            const sObj = parseFloat(m.secObj) || 0;
            const sAch = parseFloat(m.secAchieved) || 0;
            const cObj = parseFloat(m.collObj) || 0;
            const cAch = parseFloat(m.collAchieved) || 0;
            const sExp = parseFloat(m.salaryExpense) || 0;
            const aAmt = parseFloat(m.totActivityAmt) || 0;
            const lop = parseFloat(m.lopDays) || 0;

            const callAvg = parseFloat(m.callAvg) || (dr > 0 ? parseFloat((calls / dr).toFixed(1)) : 0);
            const secPct = sObj > 0 ? ((sAch / sObj) * 100).toFixed(1) : 0;
            const collPct = cObj > 0 ? ((cAch / cObj) * 100).toFixed(1) : 0;

            const calculatedRow = {
                ...m,
                isProjection,
                computedSecPct: parseFloat(secPct),
                computedCollPct: parseFloat(collPct)
            };

            if (isProjection) {
                projRow = calculatedRow;
            } else {
                actDays += days;
                actDr += dr;
                actCalls += calls;
                actPob += pob;
                actSecObj += sObj;
                actSecAch += sAch;
                actCollObj += cObj;
                actCollAch += cAch;
                actSalaryExp += sExp;
                actActAmt += aAmt;
                actLop += lop;
            }

            totDays += days;
            totDr += dr;
            totCalls += calls;
            totPob += pob;
            totSecObj += sObj;
            totSecAch += sAch;
            totCollObj += cObj;
            totCollAch += cAch;
            totSalaryExp += sExp;
            totActAmt += aAmt;
            totLop += lop;

            return calculatedRow;
        });

        const actCallAvg = actDr > 0 ? (actCalls / actDr).toFixed(1) : 0;
        const actSecPct = actSecObj > 0 ? ((actSecAch / actSecObj) * 100).toFixed(1) : 0;
        const actCollPct = actCollObj > 0 ? ((actCollAch / actCollObj) * 100).toFixed(1) : 0;

        const combCallAvg = totDr > 0 ? (totCalls / totDr).toFixed(1) : 0;
        const combSecPct = totSecObj > 0 ? ((totSecAch / totSecObj) * 100).toFixed(1) : 0;
        const combCollPct = totCollObj > 0 ? ((totCollAch / totCollObj) * 100).toFixed(1) : 0;

        return {
            rowsCalculated: rows,
            actualsTotals: {
                totalDays: actDays,
                totalDr: actDr,
                totalCalls: actCalls,
                overallCallAvg: actCallAvg,
                totalPob: actPob,
                totalSecObj: actSecObj,
                totalSecAch: actSecAch,
                overallSecPct: parseFloat(actSecPct),
                totalCollObj: actCollObj,
                totalCollAch: actCollAch,
                overallCollPct: parseFloat(actCollPct),
                totalSalaryExpense: actSalaryExp,
                totalActivityAmt: actActAmt,
                totalLopDays: actLop,
                totalExpense: actSalaryExp + actActAmt,
                actSalesExpRatioStr: (actSalaryExp + actActAmt) > 0 ? (actSecAch / (actSalaryExp + actActAmt)).toFixed(2) + 'x' : (actSecAch > 0 ? '—' : '0.00x'),
                actSalesExpRatioNum: (actSalaryExp + actActAmt) > 0 ? (actSecAch / (actSalaryExp + actActAmt)) : 0
            },
            projectionRow: projRow,
            combinedTotals: {
                totalDays: totDays,
                totalDr: totDr,
                totalCalls: totCalls,
                overallCallAvg: combCallAvg,
                totalPob: totPob,
                totalSecObj: totSecObj,
                totalSecAch: totSecAch,
                overallSecPct: parseFloat(combSecPct),
                totalCollObj: totCollObj,
                totalCollAch: totCollAch,
                overallCollPct: parseFloat(combCollPct),
                totalSalaryExpense: totSalaryExp,
                totalActivityAmt: totActAmt,
                totalLopDays: totLop
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
                if (!window.confirm(`🚀 Submit your 5-month field actuals, 6th-month projection, and Self-Assessment (${totalSelfMarks}/100) to Reporting Manager for Confirmation Review?`)) {
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
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontFamily: "'Montserrat', sans-serif" }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '14px' }}>🔄</div>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Confirmation Evaluation Process...</p>
            </div>
        );
    }

    const isSubmitted = status === 'submitted';

    return (
        <div style={{
            width: '100%',
            maxWidth: '100%',
            margin: '0',
            padding: '12px 20px',
            boxSizing: 'border-box',
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            color: '#e2e8f0'
        }}>
            {/* Remove number input spinner up/down arrows completely */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none !important;
                    margin: 0 !important;
                }
                input[type=number] {
                    -moz-appearance: textfield !important;
                    appearance: textfield !important;
                }
            `}</style>

            {/* Header Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px 28px',
                marginBottom: '22px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.8rem' }}>📋</span>
                            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
                                Confirmation Evaluation Process
                            </h2>
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.5', fontWeight: 500 }}>
                            5-Month Field Performance (Actuals) + 6th-Month Forward Projection (Commitment) with Sales, Collection, Activity Spend &amp; ROI Analysis.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isSubmitted ? (
                            <span style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                padding: '8px 16px',
                                borderRadius: '24px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                letterSpacing: '0.3px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                Submitted on {submittedAt ? formatDDMMYYYY(submittedAt) : 'Review'}
                            </span>
                        ) : (
                            <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid #f59e0b',
                                color: '#fbbf24',
                                padding: '8px 16px',
                                borderRadius: '24px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                letterSpacing: '0.3px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                                Draft Mode (Pending Submission)
                            </span>
                        )}
                        {onBack && (
                            <button
                                onClick={onBack}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid #475569',
                                    color: '#cbd5e1',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                ✕ Close
                            </button>
                        )}
                    </div>
                </div>

                {/* Candidate Info Grid with DD-MM-YYYY ADOJ */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                    marginTop: '20px',
                    padding: '16px 20px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.88rem'
                }}>
                    <div>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Employee: </span>
                        <strong style={{ color: '#ffffff', fontWeight: 700 }}>{applicant?.fullName}</strong>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Emp Code: </span>
                        <strong style={{ color: '#38bdf8', fontWeight: 700 }}>{applicant?.empCode || 'N/A'}</strong>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Designation: </span>
                        <strong style={{ color: '#ffffff', fontWeight: 700 }}>{applicant?.designation || 'Medical Representative'}</strong>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>HQ: </span>
                        <strong style={{ color: '#ffffff', fontWeight: 700 }}>{applicant?.hq || 'N/A'}</strong>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>ADOJ: </span>
                        <strong style={{ color: '#facc15', fontWeight: 700, letterSpacing: '0.5px' }}>
                            {formatDDMMYYYY(applicant?.actualJoiningDate)}
                        </strong>
                    </div>
                </div>

                {/* Dual-Score Comparison Banner (When Manager has evaluated) */}
                {totalManagerMarks !== null && (
                    <div style={{
                        marginTop: '18px',
                        padding: '16px 22px',
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
                            <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.98rem' }}>
                                🎯 Final Confirmation Assessment Summary
                            </div>
                            <div style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '4px' }}>
                                Recommendation: <strong style={{ color: totalManagerMarks >= 75 ? '#34d399' : '#fbbf24' }}>{managerRecommendation || (totalManagerMarks >= 75 ? 'Confirmed' : 'Probation Extension')}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Self Score</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>{totalSelfMarks} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/100</span></div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Manager Score</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{totalManagerMarks} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/100</span></div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Variance Gap</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: Math.abs(totalSelfMarks - totalManagerMarks) <= 10 ? '#34d399' : '#f87171' }}>
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
                    padding: '12px 18px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    fontSize: '0.9rem',
                    fontWeight: 600
                }}>
                    ✅ {successMsg}
                </div>
            )}
            {errorMsg && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    fontSize: '0.9rem',
                    fontWeight: 600
                }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            {/* SECTION 1: 5-Month Actuals + 6th-Month Forward Projection (Full Width with Salary, Activity Spend, LOP Days) */}
            <div style={{
                background: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                width: '100%'
            }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
                            📊 Section 1: 5-Month Field Activity (Actuals) &amp; 6th-Month Projection (Commitment)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.84rem', fontWeight: 500 }}>
                            Complete Performance Dossier: Field Activity, Secondary Sales, Collection Recovery, Salary &amp; Expense, Tot Activity Amt, and LOP Days.
                        </p>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                        * Call Avg: Tot Calls / Dr Visits | % Achvmnt: (Achieved / Objective) × 100
                    </span>
                </div>

                {/* Stable, non-jumping Full-Screen Table with locked column widths */}
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '6px' }}>
                    <table style={{
                        width: '100%',
                        tableLayout: 'fixed',
                        borderCollapse: 'collapse',
                        fontSize: '0.88rem',
                        minWidth: '1500px'
                    }}>
                        <colgroup>
                            <col style={{ width: '160px' }} /> {/* Month */}
                            <col style={{ width: '80px' }} />  {/* Days Worked */}
                            <col style={{ width: '80px' }} />  {/* Dr Visite */}
                            <col style={{ width: '80px' }} />  {/* Tot Calls */}
                            <col style={{ width: '75px' }} />  {/* Call Avg */}
                            <col style={{ width: '95px' }} />  {/* POB (₹) */}
                            {/* Secondary Sales Group */}
                            <col style={{ width: '110px' }} /> {/* Sec Obj (₹) */}
                            <col style={{ width: '110px' }} /> {/* Sec Achivd (₹) */}
                            <col style={{ width: '80px' }} />  {/* % Sec Ach */}
                            {/* Collection / Cash Flow Group */}
                            <col style={{ width: '110px' }} /> {/* Coll Obj (₹) */}
                            <col style={{ width: '110px' }} /> {/* Coll Achvd (₹) */}
                            <col style={{ width: '80px' }} />  {/* % Coll Ach */}
                            {/* Cost & Investment Group */}
                            <col style={{ width: '120px' }} /> {/* Salary & Expense (₹) */}
                            <col style={{ width: '120px' }} /> {/* Tot Activity Amt (₹) */}
                            <col style={{ width: '70px' }} />  {/* LOP Days */}
                            <col style={{ width: '105px' }} /> {/* Sales vs Expense Ratio */}
                        </colgroup>
                        <thead>
                            {/* Grouping Header */}
                            <tr style={{ background: '#090e1a', color: '#94a3b8', borderBottom: '1px solid rgba(51, 65, 85, 0.6)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th colSpan={6} style={{ padding: '8px 12px', borderRight: '1px solid #334155' }}>
                                    Field Activity &amp; Coverage
                                </th>
                                <th colSpan={3} style={{ padding: '8px 12px', borderRight: '1px solid #334155', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.05)' }}>
                                    💼 Secondary Sales
                                </th>
                                <th colSpan={3} style={{ padding: '8px 12px', borderRight: '1px solid #334155', color: '#34d399', background: 'rgba(16, 185, 129, 0.05)' }}>
                                    💰 Collection Recovery
                                </th>
                                <th colSpan={3} style={{ padding: '8px 12px', borderRight: '1px solid #334155', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                                    🏷️ Cost, Activity &amp; Attendance
                                </th>
                                <th colSpan={1} style={{ padding: '8px 12px', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.08)', textAlign: 'center' }}>
                                    📈 ROI RATIO
                                </th>
                            </tr>
                            {/* Column Header */}
                            <tr style={{ background: '#090e1a', color: '#cbd5e1', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '12px 12px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px' }}>MONTH</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px' }}>DAYS WRK</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px' }}>DR VISITE</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px' }}>TOT CALLS</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px' }}>CALL AVG</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', borderRight: '1px solid #334155' }}>POB (₹)</th>
                                
                                {/* Secondary Columns */}
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', color: '#38bdf8' }}>SEC OBJ (₹)</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', color: '#38bdf8' }}>SEC ACH (₹)</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', textAlign: 'center', borderRight: '1px solid #334155', color: '#38bdf8' }}>% SEC</th>

                                {/* Collection Columns */}
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', color: '#34d399' }}>COLL OBJ (₹)</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', color: '#34d399' }}>COLL ACH (₹)</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', textAlign: 'center', borderRight: '1px solid #334155', color: '#34d399' }}>% COLL</th>

                                {/* Cost & Investment Columns */}
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', color: '#f59e0b' }}>SALARY &amp; EXP (₹)</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', color: '#f59e0b' }}>TOT ACTIVITY (₹)</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', textAlign: 'center', borderRight: '1px solid #334155', color: '#f59e0b' }}>LOP DAYS</th>
                                <th style={{ padding: '12px 4px', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.5px', textAlign: 'center', color: '#a78bfa' }}>SALES / EXP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsCalculated.map((row, idx) => {
                                const isProj = row.isProjection || idx === 5;

                                return (
                                    <tr
                                        key={row.monthIndex || idx}
                                        style={{
                                            borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
                                            background: isProj
                                                ? 'rgba(14, 165, 233, 0.08)'
                                                : (idx % 2 === 1 ? 'rgba(15, 23, 42, 0.45)' : 'transparent'),
                                            borderLeft: isProj ? '3px solid #38bdf8' : 'none'
                                        }}
                                    >
                                        {/* Month Header / Type Label */}
                                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                                            <div style={{ fontSize: '0.88rem', color: isProj ? '#38bdf8' : '#ffffff' }}>
                                                {row.monthLabel}
                                            </div>
                                            <div style={{ marginTop: '3px' }}>
                                                {isProj ? (
                                                    <span style={{
                                                        background: 'rgba(56, 189, 248, 0.2)',
                                                        color: '#38bdf8',
                                                        border: '1px solid #0284c7',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.64rem',
                                                        fontWeight: 800,
                                                        letterSpacing: '0.3px'
                                                    }}>
                                                        🌟 6TH MO. PROJ
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                                        Month {idx + 1} of 5 (Actual)
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Days Worked */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="31"
                                                value={row.daysWorked}
                                                onChange={(e) => handleFieldChange(idx, 'daysWorked', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#0284c7' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Target" : "0"}
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #0284c7' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* Dr Visite */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.drVisits}
                                                onChange={(e) => handleFieldChange(idx, 'drVisits', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#0284c7' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Target" : "0"}
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #0284c7' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* Tot Calls */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.totCalls}
                                                onChange={(e) => handleFieldChange(idx, 'totCalls', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#0284c7' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Target" : "0"}
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #0284c7' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* Call Avg */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={row.callAvg}
                                                onChange={(e) => handleFieldChange(idx, 'callAvg', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0.0"
                                                style={{
                                                    ...inputStyle,
                                                    background: '#0c1527',
                                                    color: '#38bdf8',
                                                    fontWeight: '700'
                                                }}
                                            />
                                        </td>

                                        {/* POB */}
                                        <td style={{ padding: '6px 4px', borderRight: '1px solid #334155' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.pob}
                                                onChange={(e) => handleFieldChange(idx, 'pob', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#0284c7' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0"
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #0284c7' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* Sec Obj */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.secObj}
                                                onChange={(e) => handleFieldChange(idx, 'secObj', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#0284c7' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0"
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #0284c7' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* Sec Achivd */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.secAchieved}
                                                onChange={(e) => handleFieldChange(idx, 'secAchieved', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#0284c7' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Commitment" : "0"}
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #0284c7' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* % Sec Ach */}
                                        <td style={{ padding: '8px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 6px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                background: `rgba(${row.computedSecPct >= 100 ? '16, 185, 129' : (row.computedSecPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.15)`,
                                                color: getPctColor(row.computedSecPct),
                                                border: `1px solid ${getPctColor(row.computedSecPct)}`
                                            }}>
                                                {row.computedSecPct}%
                                            </span>
                                        </td>

                                        {/* Coll Obj */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.collObj}
                                                onChange={(e) => handleFieldChange(idx, 'collObj', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#34d399'; e.target.style.boxShadow = '0 0 0 2px rgba(52, 211, 153, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#059669' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0"
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #059669' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* Coll Achvd */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.collAchieved}
                                                onChange={(e) => handleFieldChange(idx, 'collAchieved', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#34d399'; e.target.style.boxShadow = '0 0 0 2px rgba(52, 211, 153, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = isProj ? '#059669' : '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Recovery" : "0"}
                                                style={{
                                                    ...inputStyle,
                                                    border: isProj ? '1.5px solid #059669' : '1.5px solid #334155'
                                                }}
                                            />
                                        </td>

                                        {/* % Coll Ach */}
                                        <td style={{ padding: '8px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 6px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                background: `rgba(${row.computedCollPct >= 100 ? '16, 185, 129' : (row.computedCollPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.15)`,
                                                color: getPctColor(row.computedCollPct),
                                                border: `1px solid ${getPctColor(row.computedCollPct)}`
                                            }}>
                                                {row.computedCollPct}%
                                            </span>
                                        </td>

                                        {/* Salary & Expense */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.salaryExpense}
                                                onChange={(e) => handleFieldChange(idx, 'salaryExpense', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0"
                                                style={{
                                                    ...inputStyle,
                                                    border: '1.5px solid #334155',
                                                    color: '#fef08a'
                                                }}
                                            />
                                        </td>

                                        {/* Tot Activity Amt */}
                                        <td style={{ padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.totActivityAmt}
                                                onChange={(e) => handleFieldChange(idx, 'totActivityAmt', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0"
                                                style={{
                                                    ...inputStyle,
                                                    border: '1.5px solid #334155',
                                                    color: '#fed7aa'
                                                }}
                                            />
                                        </td>

                                        {/* LOP Days */}
                                        <td style={{ padding: '6px 4px', borderRight: '1px solid #334155' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="31"
                                                value={row.lopDays}
                                                onChange={(e) => handleFieldChange(idx, 'lopDays', e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
                                                placeholder="0"
                                                style={{
                                                    ...inputStyle,
                                                    border: '1.5px solid #334155',
                                                    color: row.lopDays > 0 ? '#f87171' : '#ffffff',
                                                    fontWeight: row.lopDays > 0 ? '800' : '600'
                                                }}
                                            />
                                        </td>

                                        {/* Sales vs Exp Ratio */}
                                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '5px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.82rem',
                                                fontWeight: 900,
                                                background: `rgba(${row.salesExpRatioNum >= 3.5 ? '16, 185, 129' : (row.salesExpRatioNum >= 2.0 ? '56, 189, 248' : (row.salesExpRatioNum >= 1.0 ? '245, 158, 11' : '239, 68, 68'))}, 0.2)`,
                                                color: row.salesExpRatioNum >= 3.5 ? '#34d399' : (row.salesExpRatioNum >= 2.0 ? '#38bdf8' : (row.salesExpRatioNum >= 1.0 ? '#fbbf24' : '#f87171')),
                                                border: `1px solid ${row.salesExpRatioNum >= 3.5 ? '#10b981' : (row.salesExpRatioNum >= 2.0 ? '#0284c7' : (row.salesExpRatioNum >= 1.0 ? '#f59e0b' : '#ef4444'))}`
                                            }}>
                                                {row.salesExpRatioStr}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Row 1: 5-Month Actuals Total / Average */}
                            <tr style={{ background: '#090e1a', borderTop: '2px solid #475569', fontWeight: 800 }}>
                                <td style={{ padding: '14px 10px', color: '#f8fafc', fontSize: '0.84rem' }}>
                                    📈 5-Mo. Actuals
                                </td>
                                <td style={{ padding: '14px 4px', color: '#ffffff', textAlign: 'right' }}>
                                    {actualsTotals.totalDays} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>d</span>
                                </td>
                                <td style={{ padding: '14px 4px', color: '#ffffff', textAlign: 'right' }}>
                                    {actualsTotals.totalDr.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '14px 4px', color: '#ffffff', textAlign: 'right' }}>
                                    {actualsTotals.totalCalls.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                    {actualsTotals.overallCallAvg}
                                </td>
                                <td style={{ padding: '14px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #334155' }}>
                                    {formatCurrency(actualsTotals.totalPob)}
                                </td>
                                
                                {/* Secondary Actuals */}
                                <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                    {formatCurrency(actualsTotals.totalSecObj)}
                                </td>
                                <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                    {formatCurrency(actualsTotals.totalSecAch)}
                                </td>
                                <td style={{ padding: '14px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        fontWeight: 900,
                                        background: `rgba(${actualsTotals.overallSecPct >= 100 ? '16, 185, 129' : (actualsTotals.overallSecPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.2)`,
                                        color: getPctColor(actualsTotals.overallSecPct),
                                        border: `1px solid ${getPctColor(actualsTotals.overallSecPct)}`
                                    }}>
                                        {actualsTotals.overallSecPct}%
                                    </span>
                                </td>

                                {/* Collection Actuals */}
                                <td style={{ padding: '14px 4px', color: '#34d399', textAlign: 'right' }}>
                                    {formatCurrency(actualsTotals.totalCollObj)}
                                </td>
                                <td style={{ padding: '14px 4px', color: '#34d399', textAlign: 'right' }}>
                                    {formatCurrency(actualsTotals.totalCollAch)}
                                </td>
                                <td style={{ padding: '14px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        fontWeight: 900,
                                        background: `rgba(${actualsTotals.overallCollPct >= 100 ? '16, 185, 129' : (actualsTotals.overallCollPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.2)`,
                                        color: getPctColor(actualsTotals.overallCollPct),
                                        border: `1px solid ${getPctColor(actualsTotals.overallCollPct)}`
                                    }}>
                                        {actualsTotals.overallCollPct}%
                                    </span>
                                </td>

                                {/* Cost & Activity Investment Actuals */}
                                <td style={{ padding: '14px 4px', color: '#fef08a', textAlign: 'right', fontWeight: 800 }}>
                                    {formatCurrency(actualsTotals.totalSalaryExpense)}
                                </td>
                                <td style={{ padding: '14px 4px', color: '#fed7aa', textAlign: 'right', fontWeight: 800 }}>
                                    {formatCurrency(actualsTotals.totalActivityAmt)}
                                </td>
                                <td style={{ padding: '14px 4px', color: actualsTotals.totalLopDays > 0 ? '#f87171' : '#ffffff', textAlign: 'center', fontWeight: 800 }}>
                                    {actualsTotals.totalLopDays} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>d</span>
                                </td>
                            </tr>

                            {/* Row 2: 6th-Month Forward Commitment Highlight */}
                            {projectionRow && (
                                <tr style={{ background: 'rgba(14, 165, 233, 0.12)', borderTop: '1px solid #0284c7', fontWeight: 800 }}>
                                    <td style={{ padding: '14px 10px', color: '#38bdf8', fontSize: '0.84rem' }}>
                                        🎯 6th-Mo. Commit
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                        {projectionRow.daysWorked || 0} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>d</span>
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                        {projectionRow.drVisits || 0}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                        {projectionRow.totCalls || 0}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                        {projectionRow.callAvg || '0.0'}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right', borderRight: '1px solid #334155' }}>
                                        {formatCurrency(projectionRow.pob)}
                                    </td>
                                    
                                    {/* Secondary Projection */}
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                        {formatCurrency(projectionRow.secObj)}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#38bdf8', textAlign: 'right' }}>
                                        {formatCurrency(projectionRow.secAchieved)}
                                    </td>
                                    <td style={{ padding: '14px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.78rem',
                                            fontWeight: 900,
                                            background: 'rgba(56, 189, 248, 0.25)',
                                            color: '#38bdf8',
                                            border: '1px solid #38bdf8'
                                        }}>
                                            {projectionRow.computedSecPct}%
                                        </span>
                                    </td>

                                    {/* Collection Projection */}
                                    <td style={{ padding: '14px 4px', color: '#34d399', textAlign: 'right' }}>
                                        {formatCurrency(projectionRow.collObj)}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#34d399', textAlign: 'right' }}>
                                        {formatCurrency(projectionRow.collAchieved)}
                                    </td>
                                    <td style={{ padding: '14px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.78rem',
                                            fontWeight: 900,
                                            background: 'rgba(52, 211, 153, 0.25)',
                                            color: '#34d399',
                                            border: '1px solid #34d399'
                                        }}>
                                            {projectionRow.computedCollPct}%
                                        </span>
                                    </td>

                                    {/* Cost & Activity Investment Projection */}
                                    <td style={{ padding: '14px 4px', color: '#fef08a', textAlign: 'right' }}>
                                        {formatCurrency(projectionRow.salaryExpense)}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#fed7aa', textAlign: 'right' }}>
                                        {formatCurrency(projectionRow.totActivityAmt)}
                                    </td>
                                    <td style={{ padding: '14px 4px', color: '#ffffff', textAlign: 'center', borderRight: '1px solid #334155' }}>
                                        {projectionRow.lopDays || 0} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>d</span>
                                    </td>
                                    <td style={{ padding: '14px 4px', textAlign: 'center' }}>
                                        {(() => {
                                            const pExp = (Number(projectionRow.salaryExpense) || 0) + (Number(projectionRow.totActivityAmt) || 0);
                                            const pSec = Number(projectionRow.secAchieved) || 0;
                                            const pRatioStr = pExp > 0 ? (pSec / pExp).toFixed(2) + 'x' : (pSec > 0 ? '—' : '0.00x');
                                            return (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '5px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.84rem',
                                                    fontWeight: 900,
                                                    background: 'rgba(167, 139, 250, 0.25)',
                                                    color: '#c4b5fd',
                                                    border: '1px solid #a78bfa'
                                                }}>
                                                    {pRatioStr}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 2: 6 Core Confirmation Pillars (100 Marks Evaluation) */}
            <div style={{
                background: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '24px 28px',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                width: '100%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
                            🎯 Section 2: Confirmation Parameters (100 Marks Evaluation)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                            Rate your performance across the 6 parameters. Marks must be whole numbers without decimals.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(14, 165, 233, 0.15)',
                        border: '1px solid #0284c7',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '0.86rem', color: '#94a3b8', fontWeight: 600 }}>Total Self-Score:</span>
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8' }}>{totalSelfMarks}</span>
                        <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 700 }}>/ 100</span>
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
                                    background: '#090e1a',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '12px',
                                    padding: '18px 22px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ flex: '1 1 360px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>
                                            {pillar.title}
                                        </h4>
                                        <span style={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            color: '#38bdf8',
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            Max {pillar.weight} Marks
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', lineHeight: '1.5', fontWeight: 500 }}>
                                        {pillar.desc}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                                    {/* MR Self-Rating Input */}
                                    <div style={{ textAlign: 'center' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
                                            Self Rating
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max={pillar.weight}
                                                step="1"
                                                value={val}
                                                onChange={(e) => handleRatingChange(pillar.id, pillar.weight, e.target.value)}
                                                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#475569'; e.target.style.boxShadow = 'none'; }}
                                                style={{
                                                    width: '75px',
                                                    height: '42px',
                                                    padding: '6px 8px',
                                                    textAlign: 'center',
                                                    background: '#131b2e',
                                                    border: '1.5px solid #475569',
                                                    borderRadius: '8px',
                                                    color: '#ffffff',
                                                    fontWeight: 800,
                                                    fontSize: '1.05rem',
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            />
                                            <span style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>/ {pillar.weight}</span>
                                        </div>
                                    </div>

                                    {/* Manager Assigned Rating (if available) */}
                                    {mgrVal !== null && (
                                        <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', paddingLeft: '18px' }}>
                                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#38bdf8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
                                                Manager Rating
                                            </label>
                                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
                                                {mgrVal} <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>/{pillar.weight}</span>
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
                background: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '22px 26px',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                width: '100%'
            }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                    📝 Employee Remarks / Justification &amp; 6th-Month Strategy (Optional)
                </label>
                <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide context on your 5-month sales performance, territory development, key doctor conversions, and your action plan to achieve the 6th-month projection..."
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#090e1a',
                        border: '1.5px solid #334155',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        lineHeight: '1.5',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
                />
            </div>

            {/* Action Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '18px 24px',
                background: '#090e1a',
                border: '1px solid #334155',
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                width: '100%'
            }}>
                <div style={{ fontSize: '0.86rem', color: '#94a3b8', fontWeight: 500 }}>
                    {isSubmitted ? (
                        <span>🔒 Submitted for Reporting Manager Evaluation. You can make adjustments and re-save if needed.</span>
                    ) : (
                        <span>💡 Enter Section 1 (Months 1–5 Actuals + Month 6 Projection) and Section 2 (Self-Rating) before submitting to Manager.</span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                        onClick={() => handleSaveOrSubmit(false)}
                        disabled={saving || submitting}
                        style={{
                            background: '#1e293b',
                            color: '#ffffff',
                            border: '1px solid #475569',
                            padding: '11px 20px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                            fontSize: '0.88rem',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {saving ? 'Saving Draft...' : '💾 Save Draft'}
                    </button>

                    <button
                        onClick={() => handleSaveOrSubmit(true)}
                        disabled={saving || submitting}
                        style={{
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '11px 24px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.45)',
                            fontSize: '0.92rem',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease'
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
    height: '38px',
    padding: '4px 6px',
    background: '#090e1a',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '0.88rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: '600',
    boxSizing: 'border-box',
    textAlign: 'right',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
};
