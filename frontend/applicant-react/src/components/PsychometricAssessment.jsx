import React, { useState, useEffect, useRef } from 'react';

const PsychometricAssessment = ({ applicant, onComplete, onCancel }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes default
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!applicant?.email) return;

        const loadQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/applicant/psychometric-questions?email=${encodeURIComponent(applicant.email)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: applicant.email })
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
                    setQuestions(data.questions);
                    const timeSec = (data.timeLimitMinutes || 30) * 60;
                    setTimeLeft(timeSec);
                } else {
                    setError('Failed to load psychometric questions or test already completed.');
                }
            } catch (err) {
                console.error('Error loading psychometric questions:', err);
                setError('Connection failed. Please check network connection.');
            } finally {
                setLoading(false);
            }
        };

        loadQuestions();
    }, [applicant]);

    useEffect(() => {
        if (loading || questions.length === 0 || submitting) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, questions, submitting]);

    const handleSelectOption = (qId, optionText) => {
        setAnswers((prev) => ({
            ...prev,
            [qId]: optionText
        }));
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        if (submitting) return;

        const answeredCount = Object.keys(answers).length;
        if (!isAutoSubmit && answeredCount < questions.length && answeredCount < 15) {
            if (!window.confirm(`You have answered ${answeredCount} out of ${questions.length} questions. Are you sure you want to submit now?`)) {
                return;
            }
        }

        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const res = await fetch('/api/applicant/submit-psychometric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: applicant.email, answers })
            });
            const data = await res.json();
            if (data.success) {
                alert('🎉 Phase 2 Candidate Mindset & Psychometric Assessment submitted successfully!');
                setSubmitting(false);
                if (onComplete) onComplete(data);
            } else {
                alert(`Error submitting assessment: ${data.error || 'Unknown error'}`);
                setSubmitting(false);
            }
        } catch (err) {
            console.error('Error submitting psychometric:', err);
            alert('Failed to submit assessment due to network error.');
            setSubmitting(false);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '10px' }}>🧠 Loading Candidate Mindset Assessment...</div>
                <div style={{ fontSize: '0.9rem' }}>Preparing 30 situational & behavioral analysis items.</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '30px', textAlign: 'center', color: '#f8fafc' }}>
                <h3 style={{ color: '#ef4444', marginTop: 0 }}>Assessment Unavailable</h3>
                <p style={{ color: '#94a3b8' }}>{error}</p>
                <button
                    onClick={onCancel}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '14px' }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / questions.length) * 100) || 0;

    return (
        <div style={{ background: '#0f172a', borderRadius: '16px', border: '1px solid #334155', padding: '28px', color: '#f8fafc', maxWidth: '850px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            {/* Header / Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '18px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>🧠 Phase 2: Candidate Mindset Assessment</h2>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                        Answer honestly based on your clinical and professional instincts.
                    </div>
                </div>

                {/* Floating Timer & Progress Badge */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: timeLeft < 300 ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)', border: `1px solid ${timeLeft < 300 ? '#ef4444' : '#6366f1'}`, padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                        <span style={{ fontWeight: '800', fontSize: '1.15rem', color: timeLeft < 300 ? '#f87171' : '#818cf8', fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Save Exit
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '28px', background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: '#cbd5e1', fontWeight: '600' }}>
                    <span>Progress: {answeredCount} / {questions.length} Questions Answered</span>
                    <span style={{ color: '#a855f7' }}>{progressPercent}% Complete</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)', transition: 'width 0.3s' }}></div>
                </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                {questions.map((q, idx) => {
                    const qId = q._id || q.id || `q_${idx}`;
                    const selectedOpt = answers[qId];

                    return (
                        <div key={qId} style={{ background: '#1e293b', border: `1px solid ${selectedOpt ? '#6366f1' : '#334155'}`, borderRadius: '14px', padding: '22px', transition: 'border-color 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                                <div style={{ fontSize: '1.02rem', fontWeight: '700', color: '#fff', lineHeight: '1.5' }}>
                                    <span style={{ color: '#a855f7', marginRight: '8px' }}>Q{idx + 1}.</span>
                                    {q.text || q.question}
                                </div>
                                {q.dimension && (
                                    <span style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        {q.dimension}
                                    </span>
                                )}
                            </div>

                            {/* Options */}
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {(q.options || []).map((opt, oIdx) => {
                                    const optText = typeof opt === 'object' ? opt.text : opt;
                                    const isSelected = selectedOpt === optText;

                                    return (
                                        <div
                                            key={oIdx}
                                            onClick={() => handleSelectOption(qId, optText)}
                                            style={{
                                                background: isSelected ? 'rgba(99,102,241,0.22)' : '#0f172a',
                                                border: `1px solid ${isSelected ? '#818cf8' : '#334155'}`,
                                                padding: '14px 18px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.2s',
                                                color: isSelected ? '#fff' : '#cbd5e1',
                                                fontWeight: isSelected ? '600' : '400'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#818cf8' : '#64748b'}`,
                                                background: isSelected ? '#6366f1' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>}
                                            </div>
                                            <span style={{ fontSize: '0.93rem' }}>{optText}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Submit Button Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #334155', paddingTop: '24px' }}>
                <button
                    onClick={onCancel}
                    disabled={submitting}
                    style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '12px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    style={{
                        background: submitting ? '#475569' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '1rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {submitting ? '⏳ Submitting Assessment...' : '🚀 Submit Assessment & Calculate Index'}
                </button>
            </div>
        </div>
    );
};

export default PsychometricAssessment;
