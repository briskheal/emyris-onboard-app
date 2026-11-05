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
        sales: '',
        fieldWork: '',
        quality: '',
        knowledge: '',
        discipline: '',
        attitude: ''
    });
    const [managerRatings, setManagerRatings] = useState(null);
    const [managerRecommendation, setManagerRecommendation] = useState('');
    const [status, setStatus] = useState('draft');
    const [submittedAt, setSubmittedAt] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [adminRemarks, setAdminRemarks] = useState('');
    const [activeWordPreview, setActiveWordPreview] = useState(null);

    const numberToWordsIndian = (n) => {
        const num = Math.round(Number(n));
        if (!num || isNaN(num) || num <= 0) return '';
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const count = (x) => {
            if (x < 20) return a[x];
            return b[Math.floor(x / 10)] + (x % 10 > 0 ? ' ' + a[x % 10] : '');
        };

        let words = '';
        let rem = num;
        if (Math.floor(rem / 10000000) > 0) {
            words += count(Math.floor(rem / 10000000)) + ' Crore ';
            rem %= 10000000;
        }
        if (Math.floor(rem / 100000) > 0) {
            words += count(Math.floor(rem / 100000)) + ' Lakh ';
            rem %= 100000;
        }
        if (Math.floor(rem / 1000) > 0) {
            words += count(Math.floor(rem / 1000)) + ' Thousand ';
            rem %= 1000;
        }
        if (Math.floor(rem / 100) > 0) {
            words += count(Math.floor(rem / 100)) + ' Hundred ';
            rem %= 100;
        }
        if (rem > 0) {
            if (words !== '') words += 'and ';
            words += count(rem);
        }
        return words.trim() + ' Rupees Only';
    };

    const handleWordPreview = (monthLabel, fieldLabel, val) => {
        const num = Number(val);
        if (!num || isNaN(num) || num <= 0) {
            setActiveWordPreview(null);
            return;
        }
        setActiveWordPreview({
            month: monthLabel,
            field: fieldLabel,
            value: num,
            words: numberToWordsIndian(num)
        });
    };

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
                        sales: existing.selfRatings.sales !== undefined && existing.selfRatings.sales !== null && existing.selfRatings.sales !== 0 ? existing.selfRatings.sales : (existing.selfRatings.sales === 0 ? '' : ''),
                        fieldWork: existing.selfRatings.fieldWork !== undefined && existing.selfRatings.fieldWork !== null && existing.selfRatings.fieldWork !== 0 ? existing.selfRatings.fieldWork : '',
                        quality: existing.selfRatings.quality !== undefined && existing.selfRatings.quality !== null && existing.selfRatings.quality !== 0 ? existing.selfRatings.quality : '',
                        knowledge: existing.selfRatings.knowledge !== undefined && existing.selfRatings.knowledge !== null && existing.selfRatings.knowledge !== 0 ? existing.selfRatings.knowledge : '',
                        discipline: existing.selfRatings.discipline !== undefined && existing.selfRatings.discipline !== null && existing.selfRatings.discipline !== 0 ? existing.selfRatings.discipline : '',
                        attitude: existing.selfRatings.attitude !== undefined && existing.selfRatings.attitude !== null && existing.selfRatings.attitude !== 0 ? existing.selfRatings.attitude : ''
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
                    const isProjection = cm.isProjection !== undefined ? cm.isProjection : (idx === calcMonths.length - 1);
                    const daysWorked = saved.daysWorked !== undefined ? saved.daysWorked : '';
                    const drVisits = saved.drVisits !== undefined ? saved.drVisits : '';
                    const chemVisits = saved.chemVisits !== undefined ? saved.chemVisits : '';
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
                        chemVisits,
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
            // Remove leading zero if followed by other digits (e.g. "030000" -> "30000", "05" -> "5")
            const cleanVal = typeof value === 'string' ? value.replace(/^0+(?=\d)/, '') : value;
            const row = { ...updated[index], [field]: cleanVal };

            const days = parseFloat(row.daysWorked) || 0;
            const dr = parseFloat(row.drVisits) || 0;
            const chem = parseFloat(row.chemVisits) || 0;

            // Tot Calls is sum of dr + chem
            const totCalls = dr + chem;
            row.totCalls = totCalls;

            // Call avg is total calls / days work
            if (days > 0) {
                row.callAvg = (totCalls / days).toFixed(1);
            } else {
                row.callAvg = '0.0';
            }

            updated[index] = row;
            return updated;
        });
    };

    const handleRatingChange = (pillarId, maxWeight, value) => {
        if (value === '' || value === null || value === undefined) {
            setSelfRatings(prev => ({
                ...prev,
                [pillarId]: ''
            }));
            return;
        }

        // Remove leading zero if followed by other digits (e.g. "030" -> 30, "05" -> 5)
        const cleanStr = String(value).replace(/^0+(?=\d)/, '');
        let intVal = parseInt(cleanStr, 10);
        if (isNaN(intVal) || intVal < 0) intVal = 0;
        if (intVal > maxWeight) intVal = maxWeight;

        setSelfRatings(prev => ({
            ...prev,
            [pillarId]: intVal
        }));
    };

    // Calculate row % (Sec + Coll) and separate Actuals (M1-M5) vs Projection (M6) totals
    const { rowsCalculated, actualsTotals, projectionRow, combinedTotals } = useMemo(() => {
        let actDays = 0, actDr = 0, actChem = 0, actCalls = 0, actPob = 0, actSecObj = 0, actSecAch = 0, actCollObj = 0, actCollAch = 0, actSalaryExp = 0, actActAmt = 0, actLop = 0;
        let totDays = 0, totDr = 0, totChem = 0, totCalls = 0, totPob = 0, totSecObj = 0, totSecAch = 0, totCollObj = 0, totCollAch = 0, totSalaryExp = 0, totActAmt = 0, totLop = 0;
        let projRow = null;

        const rows = monthsData.map((m, idx) => {
            const isProjection = m.isProjection || idx === 5;
            const days = parseFloat(m.daysWorked) || 0;
            const dr = parseFloat(m.drVisits) || 0;
            const chem = parseFloat(m.chemVisits) || 0;
            const calls = dr + chem; // Tot Calls is sum of dr + chem
            const pob = parseFloat(m.pob) || 0;
            const sObj = parseFloat(m.secObj) || 0;
            const sAch = parseFloat(m.secAchieved) || 0;
            const cObj = parseFloat(m.collObj) || 0;
            const cAch = parseFloat(m.collAchieved) || 0;
            const sExp = parseFloat(m.salaryExpense) || 0;
            const aAmt = parseFloat(m.totActivityAmt) || 0;
            const lop = parseFloat(m.lopDays) || 0;

            const callAvg = days > 0 ? parseFloat((calls / days).toFixed(1)) : 0; // Call avg is total calls / days work
            const secPct = sObj > 0 ? ((sAch / sObj) * 100).toFixed(1) : 0;
            const collPct = cObj > 0 ? ((cAch / cObj) * 100).toFixed(1) : 0;

            // Total Field Expense: Salary & Exp + Activity Amount
            const expSum = sExp + aAmt;
            // 6x Minimum Sales Benchmark: Territory must yield at least 6x of expense
            const expectedSales6x = expSum * 6;
            const variance6x = sAch - expectedSales6x; // Actual sales minus (expense * 6)
            const isSurplus6x = variance6x >= 0;
            const variance6xStr = expSum > 0
                ? (isSurplus6x ? `+₹${Math.round(variance6x).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(variance6x)).toLocaleString('en-IN')}`)
                : (sAch > 0 ? `+₹${Math.round(sAch).toLocaleString('en-IN')}` : '₹0');

            const salesExpRatioNum = expSum > 0 ? (sAch / expSum) : 0;
            const salesExpRatioStr = expSum > 0 ? (sAch / expSum).toFixed(2) + 'x' : (sAch > 0 ? '—' : '0.00x');

            const calculatedRow = {
                ...m,
                isProjection,
                drVisits: dr,
                chemVisits: chem,
                totCalls: calls,
                callAvg,
                computedSecPct: parseFloat(secPct),
                computedCollPct: parseFloat(collPct),
                totalExpense: expSum,
                expectedSales6x,
                variance6x,
                variance6xStr,
                isSurplus6x,
                salesExpRatioNum,
                salesExpRatioStr
            };

            if (isProjection) {
                projRow = calculatedRow;
            } else {
                actDays += days;
                actDr += dr;
                actChem += chem;
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
            totChem += chem;
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

        const actCallAvg = actDays > 0 ? (actCalls / actDays).toFixed(1) : 0;
        const actSecPct = actSecObj > 0 ? ((actSecAch / actSecObj) * 100).toFixed(1) : 0;
        const actCollPct = actCollObj > 0 ? ((actCollAch / actCollObj) * 100).toFixed(1) : 0;

        const combCallAvg = totDays > 0 ? (totCalls / totDays).toFixed(1) : 0;
        const combSecPct = totSecObj > 0 ? ((totSecAch / totSecObj) * 100).toFixed(1) : 0;
        const combCollPct = totCollObj > 0 ? ((totCollAch / totCollObj) * 100).toFixed(1) : 0;

        return {
            rowsCalculated: rows,
            actualsTotals: {
                totalDays: actDays,
                totalDr: actDr,
                totalChem: actChem,
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
                actSalesExpRatioNum: (actSalaryExp + actActAmt) > 0 ? (actSecAch / (actSalaryExp + actActAmt)) : 0,
                actExpectedSales6x: (actSalaryExp + actActAmt) * 6,
                actVariance6x: actSecAch - ((actSalaryExp + actActAmt) * 6),
                actVariance6xStr: (actSalaryExp + actActAmt) > 0
                    ? (actSecAch >= (actSalaryExp + actActAmt) * 6 ? `+₹${Math.round(actSecAch - (actSalaryExp + actActAmt) * 6).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(actSecAch - (actSalaryExp + actActAmt) * 6)).toLocaleString('en-IN')}`)
                    : '₹0'
            },
            projectionRow: projRow,
            combinedTotals: {
                totalDays: totDays,
                totalDr: totDr,
                totalChem: totChem,
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
                totalLopDays: totLop,
                totalExpense: totSalaryExp + totActAmt,
                combSalesExpRatioStr: (totSalaryExp + totActAmt) > 0 ? (totSecAch / (totSalaryExp + totActAmt)).toFixed(2) + 'x' : (totSecAch > 0 ? '—' : '0.00x'),
                combSalesExpRatioNum: (totSalaryExp + totActAmt) > 0 ? (totSecAch / (totSalaryExp + totActAmt)) : 0,
                combExpectedSales6x: (totSalaryExp + totActAmt) * 6,
                combVariance6x: totSecAch - ((totSalaryExp + totActAmt) * 6),
                combVariance6xStr: (totSalaryExp + totActAmt) > 0
                    ? (totSecAch >= (totSalaryExp + totActAmt) * 6 ? `+₹${Math.round(totSecAch - (totSalaryExp + totActAmt) * 6).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(totSecAch - (totSalaryExp + totActAmt) * 6)).toLocaleString('en-IN')}`)
                    : '₹0'
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

    const isLocked = ['submitted', 'manager_evaluated', 'confirmed'].includes(status);
    const isReadOnly = isLocked;
    const isSubmitted = isLocked;

    const scrollTable = (direction) => {
        const el = document.getElementById('confirmation-table-container');
        if (el) {
            el.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
        }
    };

    const handleCellKeyDown = (e, rowIdx, colKey) => {
        const EDITABLE_COLS = ['daysWorked', 'drVisits', 'chemVisits', 'pob', 'secObj', 'secAchieved', 'collObj', 'collAchieved', 'salaryExpense', 'totActivityAmt'];
        const curColIdx = EDITABLE_COLS.indexOf(colKey);

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = document.querySelector(`input[data-row="${rowIdx - 1}"][data-col="${colKey}"]`);
            if (prev) {
                prev.focus();
                prev.select?.();
                prev.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            const next = document.querySelector(`input[data-row="${rowIdx + 1}"][data-col="${colKey}"]`);
            if (next) {
                next.focus();
                next.select?.();
                next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        } else if (e.key === 'ArrowRight') {
            if (curColIdx >= 0 && curColIdx < EDITABLE_COLS.length - 1) {
                e.preventDefault();
                const nextCol = EDITABLE_COLS[curColIdx + 1];
                const nextInput = document.querySelector(`input[data-row="${rowIdx}"][data-col="${nextCol}"]`);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select?.();
                    nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            } else if (curColIdx === EDITABLE_COLS.length - 1 && rowIdx < monthsData.length - 1) {
                e.preventDefault();
                const nextRowInput = document.querySelector(`input[data-row="${rowIdx + 1}"][data-col="${EDITABLE_COLS[0]}"]`);
                if (nextRowInput) {
                    nextRowInput.focus();
                    nextRowInput.select?.();
                    nextRowInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
        } else if (e.key === 'ArrowLeft') {
            if (curColIdx > 0) {
                e.preventDefault();
                const prevCol = EDITABLE_COLS[curColIdx - 1];
                const prevInput = document.querySelector(`input[data-row="${rowIdx}"][data-col="${prevCol}"]`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.select?.();
                    prevInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            } else if (curColIdx === 0 && rowIdx > 0) {
                e.preventDefault();
                const prevRowInput = document.querySelector(`input[data-row="${rowIdx - 1}"][data-col="${EDITABLE_COLS[EDITABLE_COLS.length - 1]}"]`);
                if (prevRowInput) {
                    prevRowInput.focus();
                    prevRowInput.select?.();
                    prevRowInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '100%',
            margin: '0',
            padding: '2px',
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
                borderRadius: '12px',
                padding: '12px 18px',
                marginBottom: '14px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.3rem' }}>📋</span>
                            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.18rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
                                Confirmation Dossier: {applicant?.fullName}
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#94a3b8', fontSize: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>Code: <strong style={{ color: '#38bdf8' }}>{applicant?.empCode || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>HQ: <strong style={{ color: '#ffffff' }}>{applicant?.hq || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>ADOJ: <strong style={{ color: '#facc15' }}>{formatDDMMYYYY(applicant?.actualJoiningDate)}</strong></span>
                            <span>•</span>
                            <span>Designation: <strong style={{ color: '#ffffff' }}>{applicant?.designation || 'Medical Representative'}</strong></span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isSubmitted ? (
                            <span style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                Submitted ({submittedAt ? formatDDMMYYYY(submittedAt) : 'Review'})
                            </span>
                        ) : (
                            <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid #f59e0b',
                                color: '#fbbf24',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
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
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    fontFamily: 'inherit'
                                }}
                            >
                                ✕ Close
                            </button>
                        )}
                    </div>
                </div>
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

                {/* Management / Admin Guidance Remarks Banner */}
                {adminRemarks && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(30, 41, 59, 0.7) 100%)',
                        border: '1.5px solid #0284c7',
                        borderRadius: '16px',
                        padding: '18px 24px',
                        marginBottom: '24px',
                        boxShadow: '0 4px 16px rgba(2, 132, 199, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontWeight: 800, fontSize: '1rem', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                            <span>Management / Admin Guidance &amp; Remarks</span>
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '0.94rem', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.55)', padding: '12px 18px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                            "{adminRemarks}"
                        </div>
                    </div>
                )}

                {isReadOnly && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)',
                    border: '1.5px solid #10b981',
                    borderRadius: '14px',
                    padding: '16px 22px',
                    marginBottom: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🔒</span>
                        <div>
                            <div style={{ color: '#34d399', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.2px' }}>
                                Confirmation Dossier Submitted to Manager (Locked • Read-Only)
                            </div>
                            <p style={{ margin: '3px 0 0 0', color: '#cbd5e1', fontSize: '0.84rem' }}>
                                Your 5-month field actuals, 6th-month projection, and self-assessment have been submitted for confirmation review. All inputs are preserved in view mode.
                            </p>
                        </div>
                    </div>
                    <span style={{
                        background: 'rgba(16, 185, 129, 0.25)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 800
                    }}>
                        Status: {status === 'manager_evaluated' ? 'Manager Evaluated' : 'Pending Manager Review'}
                    </span>
                </div>
            )}

            {/* SECTION 1: Field Performance & Forward Projection */}
            <div style={{
                background: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '18px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                width: '100%'
            }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
                            {monthsData.length > 6 ? (
                                `📊 Section 1: Field Performance Actuals (Months 1 to ${monthsData.length - 1}) & Month ${monthsData.length} Projection`
                            ) : (
                                '📊 Section 1: Field Performance & 6th-Month Commitment'
                            )}
                        </h3>
                        <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500 }}>
                            Complete Performance Dossier: Field Activity, Secondary Sales, Collection Recovery, Field Expenses, Total Territory Cost, and ROI Health Multiple.
                        </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                        * Tot Calls: Dr Visited + Chem. Visited | Call Avg: Tot Calls / Days Work | % Achvmnt: (Achieved / Objective) × 100
                    </span>
                </div>

                {/* Stable Navigation & Word Preview */}
                <div style={{ padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b1329', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '8px' }}>
                    {activeWordPreview ? (
                        <div style={{
                            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
                            border: '1.5px solid #38bdf8',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
                        }}>
                            <span style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 800 }}>
                                {activeWordPreview.month} • {activeWordPreview.field}:
                            </span>
                            <span style={{ fontSize: '0.92rem', color: '#fde047', fontWeight: 900 }}>
                                ₹{Number(activeWordPreview.value).toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 700, borderLeft: '1px solid #334155', paddingLeft: '8px' }}>
                                💬 {activeWordPreview.words}
                            </span>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                            💡 Use <strong>Left / Right Arrow keys</strong> to move between inputs. The table header &amp; month names stay frozen while scrolling.
                        </div>
                    )}
                </div>

                <div
                    id="confirmation-table-container"
                    tabIndex={0}
                    style={{
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: '68vh',
                        WebkitOverflowScrolling: 'touch',
                        position: 'relative',
                        background: '#090e1a'
                    }}
                >
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.78rem',
                        textAlign: 'right',
                        background: '#090e1a'
                    }}>
                        <thead>
                            <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1.5px solid #334155' }}>
                                <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 40, background: '#0f172a', padding: '7px 6px', textAlign: 'left', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', whiteSpace: 'nowrap' }}>Month</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Days</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Dr Vis</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Chem Vis</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Tot Calls</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Call Avg</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155' }}>POB (₹)</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Sec Obj</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Sec Ach</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 3px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155' }}>% Sec</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#34d399', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Coll Obj</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#34d399', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Coll Ach</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 3px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155' }}>% Coll</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#fef08a', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Salary &amp; Exp</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#fed7aa', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155' }}>Activity</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', color: '#fde047', fontWeight: 800, borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155' }}>Tot Expense</th>
                                <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a', padding: '7px 4px', textAlign: 'center', color: '#a78bfa', borderBottom: '1.5px solid #334155' }}>6x Variance &amp; ROI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsCalculated.map((row, idx) => {
                                const isProj = row.isProjection !== undefined ? row.isProjection : (idx === rowsCalculated.length - 1);

                                return (
                                    <tr
                                        key={row.monthIndex || idx}
                                        style={{
                                            borderBottom: '1px solid #1e293b',
                                            background: isProj
                                                ? 'rgba(14, 165, 233, 0.08)'
                                                : (idx % 2 === 1 ? '#0d1527' : '#090e1a')
                                        }}
                                    >
                                        {/* Month Header / Type Label */}
                                        <td style={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 12,
                                            background: isProj ? '#0b162c' : (idx % 2 === 1 ? '#0d1527' : '#090e1a'),
                                            padding: '5px 6px',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            color: isProj ? '#38bdf8' : '#ffffff',
                                            whiteSpace: 'nowrap',
                                            borderRight: '1px solid #334155',
                                            borderBottom: '1px solid #1e293b'
                                        }}>
                                            {row.monthLabel} {isProj ? '(🎯 Plan)' : ''}
                                        </td>

                                        {/* Days Worked */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="31"
                                                data-row={idx} data-col="daysWorked" readOnly={isReadOnly} value={row.daysWorked}
                                                onChange={(e) => handleFieldChange(idx, 'daysWorked', e.target.value)}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'daysWorked')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #38bdf8'; }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Target" : "0"}
                                                style={gridInputStyle}
                                            />
                                        </td>

                                        {/* Dr Visited (Input given by MR/User) */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="drVisits" readOnly={isReadOnly} value={row.drVisits}
                                                onChange={(e) => handleFieldChange(idx, 'drVisits', e.target.value)}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'drVisits')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #38bdf8'; }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Target" : "0"}
                                                style={gridInputStyle}
                                            />
                                        </td>

                                        {/* Chem. Visited (Input given by MR/User) */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="chemVisits" readOnly={isReadOnly} value={row.chemVisits !== undefined ? row.chemVisits : ''}
                                                onChange={(e) => handleFieldChange(idx, 'chemVisits', e.target.value)}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'chemVisits')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #38bdf8'; }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; }}
                                                placeholder={isProj ? "Target" : "0"}
                                                style={{ ...gridInputStyle, color: '#38bdf8' }}
                                            />
                                        </td>

                                        {/* Tot Calls (Auto-calculated: Dr Visited + Chem. Visited) */}
                                        <td style={{ padding: '0 6px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '0.8rem', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b', background: 'rgba(15, 23, 42, 0.3)' }}>
                                            {row.totCalls || (Number(row.drVisits || 0) + Number(row.chemVisits || 0))}
                                        </td>

                                        {/* Call Avg (Auto-calculated: Tot Calls / Days Work) */}
                                        <td style={{ padding: '0 6px', textAlign: 'right', fontWeight: 700, color: '#38bdf8', fontSize: '0.8rem', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b', background: 'rgba(15, 23, 42, 0.3)' }}>
                                            {row.callAvg || '0.0'}
                                        </td>

                                        {/* POB */}
                                        <td style={{ padding: 0, borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="pob" readOnly={isReadOnly} value={row.pob}
                                                onChange={(e) => { handleFieldChange(idx, 'pob', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'POB', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'pob')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #38bdf8'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'POB', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder="0"
                                                style={gridInputStyle}
                                            />
                                        </td>

                                        {/* Sec Obj */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="secObj" readOnly={isReadOnly} value={row.secObj}
                                                onChange={(e) => { handleFieldChange(idx, 'secObj', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Secondary Sales Objective', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'secObj')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #38bdf8'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Secondary Sales Objective', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder="0"
                                                style={{ ...gridInputStyle, color: '#38bdf8' }}
                                            />
                                        </td>

                                        {/* Sec Achivd */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="secAchieved" readOnly={isReadOnly} value={row.secAchieved}
                                                onChange={(e) => { handleFieldChange(idx, 'secAchieved', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Secondary Sales Achieved', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'secAchieved')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #38bdf8'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Secondary Sales Achieved', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder={isProj ? "Commitment" : "0"}
                                                style={{ ...gridInputStyle, color: '#38bdf8', fontWeight: 700 }}
                                            />
                                        </td>

                                        {/* % Sec Ach */}
                                        <td style={{ padding: '0 4px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 4px',
                                                borderRadius: '3px',
                                                fontSize: '0.74rem',
                                                fontWeight: 800,
                                                background: `rgba(${row.computedSecPct >= 100 ? '16, 185, 129' : (row.computedSecPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.15)`,
                                                color: getPctColor(row.computedSecPct)
                                            }}>
                                                {row.computedSecPct}%
                                            </span>
                                        </td>

                                        {/* Coll Obj */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="collObj" readOnly={isReadOnly} value={row.collObj}
                                                onChange={(e) => { handleFieldChange(idx, 'collObj', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Collection Objective', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'collObj')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #34d399'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Collection Objective', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder="0"
                                                style={{ ...gridInputStyle, color: '#34d399' }}
                                            />
                                        </td>

                                        {/* Coll Achvd */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="collAchieved" readOnly={isReadOnly} value={row.collAchieved}
                                                onChange={(e) => { handleFieldChange(idx, 'collAchieved', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Collection Achieved', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'collAchieved')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #34d399'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Collection Achieved', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder={isProj ? "Recovery" : "0"}
                                                style={{ ...gridInputStyle, color: '#34d399', fontWeight: 700 }}
                                            />
                                        </td>

                                        {/* % Coll Ach */}
                                        <td style={{ padding: '0 4px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 4px',
                                                borderRadius: '3px',
                                                fontSize: '0.74rem',
                                                fontWeight: 800,
                                                background: `rgba(${row.computedCollPct >= 100 ? '16, 185, 129' : (row.computedCollPct >= 85 ? '245, 158, 11' : '239, 68, 68')}, 0.15)`,
                                                color: getPctColor(row.computedCollPct)
                                            }}>
                                                {row.computedCollPct}%
                                            </span>
                                        </td>

                                        {/* Salary & Expense */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="salaryExpense" readOnly={isReadOnly} value={row.salaryExpense}
                                                onChange={(e) => { handleFieldChange(idx, 'salaryExpense', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Salary & Expense', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'salaryExpense')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #f59e0b'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Salary & Expense', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder="0"
                                                style={{ ...gridInputStyle, color: '#fef08a' }}
                                            />
                                        </td>

                                        {/* Tot Activity Amt */}
                                        <td style={{ padding: 0, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                data-row={idx} data-col="totActivityAmt" readOnly={isReadOnly} value={row.totActivityAmt}
                                                onChange={(e) => { handleFieldChange(idx, 'totActivityAmt', e.target.value); handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Total Activity Amount', e.target.value); }}
                                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'totActivityAmt')}
                                                onFocus={(e) => { e.target.select(); e.target.style.background = '#1e293b'; e.target.style.boxShadow = 'inset 0 0 0 1.5px #f59e0b'; handleWordPreview(row.monthLabel || `Month ${idx + 1}`, 'Total Activity Amount', e.target.value); }}
                                                onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; setActiveWordPreview(null); }}
                                                placeholder="0"
                                                style={{ ...gridInputStyle, color: '#fed7aa' }}
                                            />
                                        </td>

                                        {/* TOT EXPENSE (Auto-calculated: Salary & Exp + Tot Activity) - No Comma, Clean Excel Grid */}
                                        <td style={{ padding: '0 6px', textAlign: 'right', fontWeight: 800, color: '#fde047', fontSize: '0.8rem', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b', background: 'rgba(254, 224, 71, 0.05)' }}>
                                            {Math.round((Number(row.salaryExpense) || 0) + (Number(row.totActivityAmt) || 0)) || 0}
                                        </td>

                                        {/* Sales vs Exp Ratio with Territory Health Diagnosis */}
                                        <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
                                            {(() => {
                                                const exp = (Number(row.salaryExpense) || 0) + (Number(row.totActivityAmt) || 0);
                                                const sAch = Number(row.secAchieved) || 0;
                                                const exp6x = exp * 6;
                                                const diff = sAch - exp6x;
                                                const isPlus = diff >= 0;
                                                const diffText = exp > 0
                                                    ? (isPlus ? '+' + Math.round(diff).toLocaleString('en-IN') : '-' + Math.round(Math.abs(diff)).toLocaleString('en-IN'))
                                                    : (sAch > 0 ? '+' + Math.round(sAch).toLocaleString('en-IN') : '0');
                                                const ratioStr = exp > 0 ? (sAch / exp).toFixed(2) + 'x' : (sAch > 0 ? '—' : '0.00x');

                                                return (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: exp === 0 && sAch === 0 ? 'rgba(51, 65, 85, 0.2)' : (isPlus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                                                        border: `1px solid ${exp === 0 && sAch === 0 ? '#334155' : (isPlus ? '#10b981' : '#ef4444')}`
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.78rem',
                                                            fontWeight: 800,
                                                            color: exp === 0 && sAch === 0 ? '#94a3b8' : (isPlus ? '#34d399' : '#f87171')
                                                        }}>
                                                            {diffText}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.62rem',
                                                            fontWeight: 800,
                                                            color: exp === 0 && sAch === 0 ? '#64748b' : (isPlus ? '#a7f3d0' : '#fca5a5')
                                                        }}>
                                                            ({ratioStr})
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            {/* Row 1: Actuals Total / Average */}
                            <tr style={{ background: '#090e1a', borderTop: '2px solid #475569', fontWeight: 800 }}>
                                <td style={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 14,
                                    background: '#090e1a',
                                    borderRight: '1px solid #334155',
                                    padding: '6px 6px',
                                    textAlign: 'left',
                                    color: '#f8fafc',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {monthsData.length > 6 ? '📈 8-Mo. Actuals Subtotal' : '📈 5-Mo. Actuals Subtotal'}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {actualsTotals.totalDays} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>d</span>
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {actualsTotals.totalDr.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#38bdf8', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {actualsTotals.totalChem.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {actualsTotals.totalCalls.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#38bdf8', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {actualsTotals.overallCallAvg}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1.5px solid #475569' }}>
                                    {formatCurrency(actualsTotals.totalPob)}
                                </td>
                                
                                {/* Secondary Actuals */}
                                <td style={{ padding: '6px 4px', color: '#38bdf8', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(actualsTotals.totalSecObj)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#38bdf8', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(actualsTotals.totalSecAch)}
                                </td>
                                <td style={{ padding: '6px 3px', textAlign: 'center', borderRight: '1.5px solid #475569' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        fontSize: '0.74rem',
                                        fontWeight: 800,
                                        color: getPctColor(actualsTotals.overallSecPct)
                                    }}>
                                        {actualsTotals.overallSecPct}%
                                    </span>
                                </td>

                                {/* Collection Actuals */}
                                <td style={{ padding: '6px 4px', color: '#34d399', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(actualsTotals.totalCollObj)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#34d399', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(actualsTotals.totalCollAch)}
                                </td>
                                <td style={{ padding: '6px 3px', textAlign: 'center', borderRight: '1.5px solid #475569' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        fontSize: '0.74rem',
                                        fontWeight: 800,
                                        color: getPctColor(actualsTotals.overallCollPct)
                                    }}>
                                        {actualsTotals.overallCollPct}%
                                    </span>
                                </td>

                                {/* Cost & Activity Investment Actuals */}
                                <td style={{ padding: '6px 4px', color: '#fef08a', textAlign: 'right', fontWeight: 800, borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(actualsTotals.totalSalaryExpense)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#fed7aa', textAlign: 'right', fontWeight: 800, borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(actualsTotals.totalActivityAmt)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#fde047', textAlign: 'right', fontWeight: 800, borderRight: '1.5px solid #475569' }}>
                                    {Math.round(actualsTotals.totalExpense || 0)}
                                </td>
                                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                    {(() => {
                                        const aExp = actualsTotals.totalExpense;
                                        const aSec = actualsTotals.totalSecAch;
                                        const aExp6x = aExp * 6;
                                        const aDiff = aSec - aExp6x;
                                        const isPlus = aDiff >= 0;
                                        const aDiffText = aExp > 0
                                            ? (isPlus ? '+' + Math.round(aDiff).toLocaleString('en-IN') : '-' + Math.round(Math.abs(aDiff)).toLocaleString('en-IN'))
                                            : '0';
                                        return (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '3px',
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                background: isPlus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                border: `1px solid ${isPlus ? '#10b981' : '#ef4444'}`
                                            }}>
                                                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isPlus ? '#34d399' : '#f87171' }}>
                                                    {aDiffText}
                                                </span>
                                                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isPlus ? '#a7f3d0' : '#fca5a5' }}>
                                                    ({actualsTotals.actSalesExpRatioStr})
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </td>
                            </tr>

                            {/* Row 2: Grand Total Taking Projection Also */}
                            <tr style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)', borderTop: '2px solid #a855f7', fontWeight: 900 }}>
                                <td style={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 14,
                                    background: '#1e1b4b',
                                    borderRight: '1px solid #4338ca',
                                    padding: '6px 6px',
                                    textAlign: 'left',
                                    color: '#c084fc',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {monthsData.length > 6 ? '🌟 9-Mo. Total (6 Mo. + 3 Mo. Plan)' : '🌟 6-Mo. Total (5 Actuals + 6th Plan)'}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {combinedTotals.totalDays} <span style={{ fontSize: '0.62rem', color: '#c084fc' }}>d</span>
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {combinedTotals.totalDr.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#c084fc', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {combinedTotals.totalChem.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {combinedTotals.totalCalls.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#c084fc', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {combinedTotals.overallCallAvg}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#ffffff', textAlign: 'right', borderRight: '1.5px solid #475569' }}>
                                    {formatCurrency(combinedTotals.totalPob)}
                                </td>

                                {/* Secondary Grand Total */}
                                <td style={{ padding: '6px 4px', color: '#c084fc', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(combinedTotals.totalSecObj)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#c084fc', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(combinedTotals.totalSecAch)}
                                </td>
                                <td style={{ padding: '6px 3px', textAlign: 'center', borderRight: '1.5px solid #475569' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        fontSize: '0.74rem',
                                        fontWeight: 900,
                                        color: getPctColor(combinedTotals.overallSecPct)
                                    }}>
                                        {combinedTotals.overallSecPct}%
                                    </span>
                                </td>

                                {/* Collection Grand Total */}
                                <td style={{ padding: '6px 4px', color: '#34d399', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(combinedTotals.totalCollObj)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#34d399', textAlign: 'right', borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(combinedTotals.totalCollAch)}
                                </td>
                                <td style={{ padding: '6px 3px', textAlign: 'center', borderRight: '1.5px solid #475569' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        fontSize: '0.74rem',
                                        fontWeight: 900,
                                        color: getPctColor(combinedTotals.overallCollPct)
                                    }}>
                                        {combinedTotals.overallCollPct}%
                                    </span>
                                </td>

                                {/* Cost & Activity Investment Grand Total */}
                                <td style={{ padding: '6px 4px', color: '#fef08a', textAlign: 'right', fontWeight: 800, borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(combinedTotals.totalSalaryExpense)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#fed7aa', textAlign: 'right', fontWeight: 800, borderRight: '1px solid #1e293b' }}>
                                    {formatCurrency(combinedTotals.totalActivityAmt)}
                                </td>
                                <td style={{ padding: '6px 4px', color: '#fde047', textAlign: 'right', fontWeight: 900, borderRight: '1.5px solid #475569' }}>
                                    {Math.round(combinedTotals.totalExpense || 0)}
                                </td>
                                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                    {(() => {
                                        const cExp = combinedTotals.totalExpense;
                                        const cSec = combinedTotals.totalSecAch;
                                        const cExp6x = cExp * 6;
                                        const cDiff = cSec - cExp6x;
                                        const isPlus = cDiff >= 0;
                                        const cDiffText = cExp > 0
                                            ? (isPlus ? '+' + Math.round(cDiff).toLocaleString('en-IN') : '-' + Math.round(Math.abs(cDiff)).toLocaleString('en-IN'))
                                            : '0';
                                        return (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '3px',
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                background: isPlus ? 'rgba(168, 85, 247, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                                                border: `1px solid ${isPlus ? '#a855f7' : '#ef4444'}`
                                            }}>
                                                <span style={{ fontSize: '0.76rem', fontWeight: 900, color: isPlus ? '#e9d5ff' : '#f87171' }}>
                                                    {cDiffText}
                                                </span>
                                                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isPlus ? '#d8b4fe' : '#fca5a5' }}>
                                                    ({combinedTotals.combSalesExpRatioStr})
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Territory Health & Field ROI Diagnostic Guide */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '20px 24px',
                    margin: '18px 24px 24px 24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>🩺</span>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1.05rem', fontWeight: 800 }}>
                                Territory Health &amp; Field ROI Multiple Diagnostic Standard
                            </h4>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            Formula: ROI Multiple = Secondary Sales Achieved ÷ Total Expense (Salary &amp; Exp + Activity)
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 800, fontSize: '0.88rem' }}>
                                🔴 Ratio &lt; 2.5x — UNHEALTHY (LOSS-MAKING)
                            </div>
                            <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: '1.5' }}>
                                <strong>Diagnosis:</strong> Sales cannot cover MR salary and field activity. Gross margin after COGS/stockist margin is negative. Indicates activity leakage or lack of active prescriber commitment.
                            </p>
                        </div>

                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 800, fontSize: '0.88rem' }}>
                                🟡 Ratio 2.5x to 3.5x — BORDERLINE (GESTATION)
                            </div>
                            <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: '1.5' }}>
                                <strong>Diagnosis:</strong> Territory breaks even at territory cost level. Acceptable only during the first 3-5 months for new product launch or new MR. Requires immediate conversion focus.
                            </p>
                        </div>

                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, fontSize: '0.88rem' }}>
                                🟢 Ratio 3.5x to 5.0x — HEALTHY (PROFITABLE)
                            </div>
                            <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: '1.5' }}>
                                <strong>Diagnosis:</strong> Fully self-sustaining territory. Generates substantial net contribution margin covering company overheads. Ideal benchmark for permanent Confirmation.
                            </p>
                        </div>

                        <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid #8b5cf6', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4b5fd', fontWeight: 800, fontSize: '0.88rem' }}>
                                🌟 Ratio &gt; 5.0x — STAR TERRITORY (HIGH ROI)
                            </div>
                            <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: '1.5' }}>
                                <strong>Diagnosis:</strong> High yield prescriber loyalty, low expense-to-sales ratio (&lt;20%). Prime candidate for territory expansion, merit increment, and manager leadership role.
                            </p>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderLeft: '3px solid #f59e0b', padding: '10px 14px', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.82rem', lineHeight: '1.5' }}>
                        💡 <strong>Case Analysis (₹2.0L Sales with High Expenses):</strong> If a territory achieves ₹2,00,000 monthly sales against ₹65,000 total expense (Salary ₹45k + Activity ₹20k), the ratio is <strong>3.07x</strong>. The field cost consumes <strong>32.5%</strong> of sales. After factoring standard pharma COGS (30%) and distribution margins (30%), net profitability is razor-thin. <em>Actionable Strategy:</em> Re-verify whether activity spend was committed to verified high-yield prescribers, review RCPA at mapped retail chemists, and set the 6th-Month forward commitment at &ge; ₹2,75,000 to bring the ratio to &ge; 4.0x.
                    </div>
                </div>
</div>
            {/* SECTION 2: 100-Mark Dual-Evaluation Comparison */}
            <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '18px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                width: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                    background: '#090e1a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px 16px'
                }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🎯</span> Section 2: 100-Mark Dual-Evaluation Comparison
                        </h4>
                        <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '3px' }}>
                            Rate your performance across the 6 parameters. Marks must be whole numbers without decimals.
                        </div>
                    </div>

                    {/* Dual Total Score Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Total Self Rating Pill */}
                        <div style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1.5px solid #0284c7',
                            borderRadius: '8px',
                            padding: '5px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Self Score:
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8' }}>
                                {totalSelfMarks}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>/ 100</span>
                        </div>

                        {/* Total Manager Score Pill */}
                        <div style={{
                            background: totalManagerMarks !== null ? 'rgba(16, 185, 129, 0.12)' : 'rgba(51, 65, 85, 0.25)',
                            border: `1.5px solid ${totalManagerMarks !== null ? '#10b981' : '#475569'}`,
                            borderRadius: '8px',
                            padding: '5px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Manager Score:
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: totalManagerMarks !== null ? '#34d399' : '#94a3b8' }}>
                                {totalManagerMarks !== null ? totalManagerMarks : '—'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>/ 100</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    {EVALUATION_PILLARS.map((pillar) => {
                        const rawVal = selfRatings[pillar.id];
                        const val = (rawVal !== undefined && rawVal !== null && rawVal !== '') ? rawVal : '';
                        const mgrVal = managerRatings ? managerRatings[pillar.id] : null;

                        return (
                            <div
                                key={pillar.id}
                                style={{
                                    background: '#090e1a',
                                    border: '1px solid #334155',
                                    borderRadius: '10px',
                                    padding: '12px 18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ flex: '1 1 300px' }}>
                                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem' }}>{pillar.title}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '2px' }}>{pillar.desc}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    {/* Self Rating */}
                                    <div style={{ textAlign: 'center', minWidth: '85px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Self Rating</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max={pillar.weight}
                                                step="1"
                                                placeholder="0"
                                                readOnly={isReadOnly}
                                                value={val}
                                                onChange={(e) => !isReadOnly && handleRatingChange(pillar.id, pillar.weight, e.target.value)}
                                                onFocus={(e) => {
                                                    e.target.select();
                                                    e.target.style.borderColor = '#38bdf8';
                                                    e.target.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.25)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#475569';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                                style={{
                                                    width: '56px',
                                                    height: '32px',
                                                    padding: '2px 4px',
                                                    textAlign: 'center',
                                                    background: '#131b2e',
                                                    border: '1.5px solid #475569',
                                                    borderRadius: '6px',
                                                    color: '#38bdf8',
                                                    fontWeight: 800,
                                                    fontSize: '0.98rem',
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>/{pillar.weight}</span>
                                        </div>
                                    </div>

                                    {/* Manager Rating */}
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', paddingLeft: '18px', minWidth: '95px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Manager Score</div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: mgrVal !== null && mgrVal !== undefined ? '#34d399' : '#64748b', marginTop: '2px' }}>
                                            {mgrVal !== null && mgrVal !== undefined ? mgrVal : '-'} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/{pillar.weight}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Overall Cumulative Summary Row */}
                    <div style={{
                        background: 'linear-gradient(90deg, #090e1a 0%, #1e1b4b 100%)',
                        border: '1.5px solid #6366f1',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginTop: '4px'
                    }}>
                        <div>
                            <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🎯</span> Overall 100-Mark Dual Evaluation Cumulative Score
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px' }}>
                                Total cumulative score out of 100 benchmark points (Self vs Manager)
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', minWidth: '85px' }}>
                                <div style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800 }}>Total Self</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                                    {totalSelfMarks} <span style={{ fontSize: '0.74rem', color: '#64748b' }}>/ 100</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', borderLeft: '1px solid #4338ca', paddingLeft: '18px', minWidth: '95px' }}>
                                <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 800 }}>Total Manager</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: totalManagerMarks !== null ? '#34d399' : '#64748b', marginTop: '2px' }}>
                                    {totalManagerMarks !== null ? totalManagerMarks : '-'} <span style={{ fontSize: '0.74rem', color: '#64748b' }}>/ 100</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
                    readOnly={isReadOnly} value={remarks}
                    onChange={(e) => !isReadOnly && setRemarks(e.target.value)}
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

                {isReadOnly ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1.5px solid #10b981',
                            padding: '11px 22px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            ✅ Submitted to Manager • Locked for Editing
                        </span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <button
                            type="button"
                            onClick={() => handleSaveOrSubmit(false)}
                            disabled={saving || submitting}
                            style={{
                                background: '#1e293b',
                                color: '#ffffff',
                                border: '1px solid #475569',
                                padding: '11px 22px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: (saving || submitting) ? 'not-allowed' : 'pointer',
                                fontSize: '0.88rem',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {saving ? 'Saving Draft...' : '💾 Save Draft (Work Later)'}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSaveOrSubmit(true)}
                            disabled={saving || submitting}
                            style={{
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '11px 26px',
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
                )}
            </div>
        </div>
    );
}

const gridInputStyle = {
    width: '100%',
    height: '26px',
    padding: '0 4px',
    background: 'transparent',
    border: 'none',
    borderRadius: '0px',
    color: '#ffffff',
    fontSize: '0.78rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: '600',
    boxSizing: 'border-box',
    textAlign: 'right',
    outline: 'none',
    transition: 'background 0.15s ease, box-shadow 0.15s ease'
};
