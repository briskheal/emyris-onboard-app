import React, { useState, useEffect, useRef } from 'react';

const ExamRunner = ({ applicant, examData, isRapidFire = false, onComplete, onCancel }) => {
    const [questions, setQuestions] = useState([]);
    const [mcqAnswers, setMcqAnswers] = useState({});
    const [descAnswers, setDescAnswers] = useState({});
    const [phase, setPhase] = useState(1); // 1 = MCQ, 2 = Descriptive
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [mcqTimeLimit, setMcqTimeLimit] = useState(15 * 60);
    const [descTimeLimit, setDescTimeLimit] = useState(15 * 60);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!applicant?.email) return;

        const loadExam = async () => {
            setLoading(true);
            setError(null);
            try {
                if (isRapidFire) {
                    const res = await fetch(`/api/applicant/start-rapid-fire/${applicant.email}`);
                    const data = await res.json();
                    if (data.success && Array.isArray(data.questions)) {
                        setQuestions(data.questions);
                        const timeLimitSec = (data.timeLimitMinutes || 20) * 60;
                        setMcqTimeLimit(timeLimitSec);
                        setTimeLeft(timeLimitSec);
                    } else {
                        setError(data.error || 'Rapid Fire screening test is currently unavailable or already completed.');
                    }
                } else {
                    const res = await fetch('/api/applicant/exam-questions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: applicant.email, targetProduct: examData?.targetProduct || undefined })
                    });
                    const data = await res.json();
                    if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
                        setQuestions(data.questions);
                        const mTime = (data.mcqTime || 15) * 60;
                        const dTime = (data.descTime || 15) * 60;
                        setMcqTimeLimit(mTime);
                        setDescTimeLimit(dTime);
                        setTimeLeft(mTime);
                    } else {
                        setError(data.error || 'No active exam questions found for your profile.');
                    }
                }
            } catch (err) {
                console.error('Error starting exam:', err);
                setError('Connection failed while initializing examination.');
            } finally {
                setLoading(false);
            }
        };

        loadExam();
    }, [applicant, examData, isRapidFire]);

    useEffect(() => {
        if (loading || questions.length === 0 || submitting) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handlePhaseEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, questions, submitting, phase]);

    const mcqQuestions = questions.filter(q => q.type !== 'descriptive');
    const descQuestions = questions.filter(q => q.type === 'descriptive');

    const handlePhaseEnd = () => {
        if (isRapidFire || descQuestions.length === 0 || phase === 2) {
            handleSubmitFinal(true);
        } else if (phase === 1 && descQuestions.length > 0) {
            alert("⏰ MCQ phase time has expired! Moving automatically to the Descriptive Phase.");
            setPhase(2);
            setTimeLeft(descTimeLimit);
        }
    };

    const handleSelectMcq = (qIdx, optIndexOrValue) => {
        setMcqAnswers(prev => ({
            ...prev,
            [qIdx]: optIndexOrValue
        }));
    };

    const handleTypeDesc = (qIdx, text) => {
        setDescAnswers(prev => ({
            ...prev,
            [qIdx]: text
        }));
    };

    const handleNextPhaseOrSubmit = () => {
        if (phase === 1 && !isRapidFire && descQuestions.length > 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase(2);
            setTimeLeft(descTimeLimit);
        } else {
            handleSubmitFinal(false);
        }
    };

    const handleSubmitFinal = async (isAutoSubmit = false) => {
        if (submitting) return;

        if (!isAutoSubmit) {
            const totalQs = phase === 1 ? mcqQuestions.length : (mcqQuestions.length + descQuestions.length);
            const answeredCount = Object.keys(mcqAnswers).length + Object.keys(descAnswers).length;
            if (answeredCount < totalQs && !window.confirm(`You have unanswered questions (${answeredCount}/${totalQs} completed). Are you sure you want to submit?`)) {
                return;
            }
        }

        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const payloadAnswers = {};
        mcqQuestions.forEach((q, idx) => {
            payloadAnswers[q._id || `mcq_${idx}`] = mcqAnswers[idx] !== undefined ? mcqAnswers[idx] : null;
        });
        descQuestions.forEach((q, idx) => {
            payloadAnswers[q._id || `desc_${idx}`] = descAnswers[idx] !== undefined ? descAnswers[idx] : null;
        });

        try {
            const endpoint = isRapidFire ? '/api/applicant/submit-rapid-fire' : '/api/applicant/submit-test';
            const bodyData = isRapidFire
                ? { email: applicant.email, answers: payloadAnswers }
                : {
                    email: applicant.email,
                    testedProduct: examData?.targetProduct || 'Assigned Assessment',
                    answers: payloadAnswers,
                    mcqScore: calculateLocalAutoScore()
                };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            const data = await res.json();
            if (data.success) {
                alert('🎉 Assessment submitted successfully! You can review your detailed breakdown under "My Exam Scores".');
                if (onComplete) onComplete(data);
            } else {
                alert(`Error submitting exam: ${data.error || 'Please contact HR team.'}`);
                setSubmitting(false);
            }
        } catch (err) {
            console.error('Submission failed:', err);
            alert('Failed to submit exam due to network error.');
            setSubmitting(false);
        }
    };

    const calculateLocalAutoScore = () => {
        let score = 0;
        mcqQuestions.forEach((q, idx) => {
            if (mcqAnswers[idx] !== undefined && (mcqAnswers[idx] === q.correctAnswer || mcqAnswers[idx] === parseInt(q.correctAnswer))) {
                score++;
            }
        });
        return score;
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '10px' }}>🚀 Initializing Secure Examination Chamber...</div>
                <div style={{ fontSize: '0.9rem' }}>Encrypting assessment items and setting up session timer.</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '30px', textAlign: 'center', color: '#f8fafc', maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{ color: '#ef4444', marginTop: 0 }}>Cannot Launch Examination</h3>
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

    const currentQs = phase === 1 ? mcqQuestions : descQuestions;

    return (
        <div style={{ background: '#0f172a', borderRadius: '16px', border: '1px solid #334155', padding: '28px', color: '#f8fafc', maxWidth: '850px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            {/* Header / Timer Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '18px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>
                        {isRapidFire ? '⚡ Phase 1: Rapid Fire Screening Test' : `📋 ${examData?.targetProduct || 'Assigned Examination'} (${phase === 1 ? 'Part I: MCQ' : 'Part II: Descriptive'})`}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                        {phase === 1 ? 'Select the single most appropriate answer for each question.' : 'Provide comprehensive, structured explanations for clinical/field scenarios.'}
                    </div>
                </div>

                {/* Floating Timer */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: timeLeft < 180 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', border: `1px solid ${timeLeft < 180 ? '#ef4444' : '#10b981'}`, padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                        <span style={{ fontWeight: '800', fontSize: '1.15rem', color: timeLeft < 180 ? '#f87171' : '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Abort Exam
                    </button>
                </div>
            </div>

            {/* Questions Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                {currentQs.map((q, idx) => {
                    return (
                        <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', marginBottom: '16px', lineHeight: '1.5' }}>
                                <span style={{ color: '#6366f1', marginRight: '8px' }}>Q{idx + 1}.</span>
                                {q.text || q.question}
                            </div>

                            {phase === 1 ? (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {(q.options || []).map((opt, oIdx) => {
                                        const optText = typeof opt === 'object' ? opt.text : opt;
                                        const isSelected = mcqAnswers[idx] === oIdx || mcqAnswers[idx] === optText;

                                        return (
                                            <div
                                                key={oIdx}
                                                onClick={() => handleSelectMcq(idx, optText)}
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
                            ) : (
                                <div>
                                    <textarea
                                        rows={5}
                                        value={descAnswers[idx] || ''}
                                        onChange={(e) => handleTypeDesc(idx, e.target.value)}
                                        placeholder="Type your structured descriptive response here..."
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '10px', padding: '14px', color: '#f8fafc', fontSize: '0.92rem', resize: 'vertical', outline: 'none' }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #334155', paddingTop: '24px' }}>
                <button
                    onClick={onCancel}
                    disabled={submitting}
                    style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '12px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleNextPhaseOrSubmit}
                    disabled={submitting}
                    style={{
                        background: submitting ? '#475569' : 'linear-gradient(135deg, #10b981, #3b82f6)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '1rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.4)'
                    }}
                >
                    {submitting ? '⏳ Submitting...' : (phase === 1 && !isRapidFire && descQuestions.length > 0 ? 'Proceed to Descriptive Part II ➔' : '🚀 Final Submit Exam')}
                </button>
            </div>
        </div>
    );
};

export default ExamRunner;
