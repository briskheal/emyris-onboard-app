import React, { useState, useEffect } from 'react';

const MyScoresTable = ({ applicant }) => {
    const [exams, setExams] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);

    useEffect(() => {
        if (!applicant?.email) return;
        const fetchScores = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/applicant/my-scores/${applicant.email}`);
                const data = await res.json();
                if (data.success) {
                    setExams(Array.isArray(data.exams) ? data.exams : []);
                    setQuestions(Array.isArray(data.questions) ? data.questions : []);
                } else {
                    setError('Failed to load assessment records.');
                }
            } catch (err) {
                console.error('Error fetching scores:', err);
                setError('Connection failed while loading exam history.');
            } finally {
                setLoading(false);
            }
        };
        fetchScores();
    }, [applicant]);

    const formatCleanDate = (val, fallback) => {
        if (!val && fallback) val = fallback;
        if (!val) return 'Recently';
        if (typeof val === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
                const parts = val.split(/[-T]/);
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            }
            if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(val)) {
                const parts = val.split(/[-/]/);
                const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            }
        }
        const d = new Date(val);
        if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        if (typeof fallback === 'string') return fallback;
        return 'Recently';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>⏳ Loading Assessment Records...</div>
                <div style={{ fontSize: '0.85rem' }}>Synchronizing past exam scores and psychometric indexes.</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '12px', color: '#ef4444' }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                {exams.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', background: 'rgba(0,0,0,0.2)' }}>
                        No historical assessments or questionnaire sessions found.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#e2e8f0', fontSize: '0.92rem' }}>
                            <thead>
                                <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>Questionnaire / Assessment</th>
                                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>Submitted Date</th>
                                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>Score / Badge</th>
                                    <th style={{ padding: '14px 18px', fontWeight: '700', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map((exam, idx) => {
                                    const dStr = formatCleanDate(exam.submittedAt, exam.examDate);
                                    const isGraded = exam.status === 'graded';
                                    const prodName = exam.testedProduct || 'General Assessment';
                                    const isPsychometric = prodName.toLowerCase().includes('psychometric') || prodName.toLowerCase().includes('phase 2');
                                    const isRapid = prodName.toLowerCase().includes('rapid') || prodName.toLowerCase().includes('phase 1');

                                    let scoreElement = null;
                                    if (isPsychometric) {
                                        const badge = exam.answers?.['Executive Archetype Badge'] || '🌟 The Scientific Strategist';
                                        scoreElement = (
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ padding: '3px 10px', background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem' }}>
                                                    Index: {exam.autoScore || 85}%
                                                </span>
                                                <span style={{ padding: '3px 10px', background: 'rgba(236,72,153,0.18)', border: '1px solid rgba(236,72,153,0.4)', color: '#f472b6', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem' }}>
                                                    {badge}
                                                </span>
                                            </div>
                                        );
                                    } else if (isRapid) {
                                        scoreElement = (
                                            <span style={{ padding: '3px 12px', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem' }}>
                                                Score: {exam.autoScore} / {exam.totalQuestions || 20}
                                            </span>
                                        );
                                    } else if (isGraded) {
                                        scoreElement = (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem' }}>
                                                <span style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.4)', padding: '2px 8px', borderRadius: '6px', color: '#818cf8' }}>
                                                    MCQ: <strong>{exam.autoScore}</strong>
                                                </span>
                                                <span style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)', padding: '2px 8px', borderRadius: '6px', color: '#4ade80' }}>
                                                    Desc: <strong>{exam.manualScore}</strong>
                                                </span>
                                                <span style={{ background: '#1e293b', border: '1px solid #475569', padding: '2px 8px', borderRadius: '6px', color: '#fff', fontWeight: '800' }}>
                                                    Total: {exam.totalScore} / {exam.totalQuestions}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        scoreElement = (
                                            <span style={{ padding: '3px 10px', background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.4)', color: '#facc15', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                Pending Review
                                            </span>
                                        );
                                    }

                                    const rowBg = idx % 2 === 0 ? '#0f172a' : '#131d31';
                                    return (
                                        <tr key={exam._id || idx} style={{ background: rowBg, borderBottom: '1px solid #1e293b' }}>
                                            <td style={{ padding: '12px 18px', fontWeight: '600', fontSize: '0.93rem', color: '#f8fafc' }}>{prodName}</td>
                                            <td style={{ padding: '12px 18px', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{dStr}</td>
                                            <td style={{ padding: '12px 18px' }}>{scoreElement}</td>
                                            <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                <button
                                                    onClick={() => setSelectedExam(exam)}
                                                    style={{ background: '#6366f1', border: '1px solid #818cf8', color: '#fff', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(99,102,241,0.25)', cursor: 'pointer' }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Solid Opaque Scorecard Review Modal */}
            {selectedExam && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#0f172a', border: '2px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: '#f8fafc', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>🎯 Assessment Performance Breakdown</h3>
                                <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '4px' }}>{selectedExam.testedProduct || 'General Assessment'}</div>
                            </div>
                            <button
                                onClick={() => setSelectedExam(null)}
                                style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Summary Badges */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            {selectedExam.testedProduct && selectedExam.testedProduct.toLowerCase().includes('psychometric') ? (
                                <>
                                    <div style={{ background: '#18132e', border: '1px solid #a855f7', padding: '12px 20px', borderRadius: '12px', flex: '1 1 200px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '600' }}>Mindset Index</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#d8b4fe' }}>{selectedExam.autoScore || 85}%</div>
                                    </div>
                                    <div style={{ background: '#1f132b', border: '1px solid #ec4899', padding: '12px 20px', borderRadius: '12px', flex: '1 1 200px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '600' }}>Executive Archetype Badge</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f472b6' }}>{selectedExam.answers?.['Executive Archetype Badge'] || '🌟 The Scientific Strategist'}</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 20px', borderRadius: '12px', flex: '1 1 150px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>MCQ Auto-Score</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#818cf8' }}>{selectedExam.autoScore}</div>
                                    </div>
                                    {selectedExam.status === 'graded' && (
                                        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 20px', borderRadius: '12px', flex: '1 1 150px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Descriptive Score</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4ade80' }}>{selectedExam.manualScore}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Radar Chart Breakdown for Psychometric */}
                        {selectedExam.testedProduct && (selectedExam.testedProduct.toLowerCase().includes('psychometric') || selectedExam.testedProduct.toLowerCase().includes('phase 2')) && selectedExam.answers && (
                            <div style={{ background: '#18132e', border: '1px solid #6b21a8', borderRadius: '14px', padding: '18px', marginBottom: '22px' }}>
                                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '700', margin: '0 0 14px 0' }}>📊 6-Dimension Competency Radar Breakdown</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                    {[
                                        'Clinical Integrity & Ethics',
                                        'Resilience & Grit Under Pressure',
                                        'Empathy & Relationship Building',
                                        'Autonomy & Self-Motivation',
                                        'Scientific Adaptability',
                                        'Collaborative Communication'
                                    ].map(dim => {
                                        const num = parseInt(selectedExam.answers[dim] || selectedExam.answers?.traitPercentiles?.[dim] || selectedExam.answers?.mindsetReport?.traitPercentiles?.[dim] || '85') || 85;
                                        return (
                                            <div key={dim} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>{dim}</span>
                                                    <span style={{ color: '#d8b4fe', fontWeight: '800', fontSize: '0.95rem' }}>{num}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${num}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #ec4899)', borderRadius: '3px' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {(selectedExam.answers['Coaching & Mentorship Tips'] || selectedExam.answers?.mindsetReport?.['Coaching & Mentorship Tips']) && (
                                    <>
                                        <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', margin: '14px 0 8px 0' }}>💡 Coaching & Mentorship Tips</h4>
                                        <div style={{ background: '#131929', borderLeft: '4px solid #a855f7', padding: '12px 16px', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            {(selectedExam.answers['Coaching & Mentorship Tips'] || selectedExam.answers?.mindsetReport?.['Coaching & Mentorship Tips']).split(' | ').map((t, i) => (
                                                <div key={i} style={{ marginBottom: '6px' }}>• {t}</div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Detailed Question Answers List */}
                        <h4 style={{ color: '#fff', fontSize: '1.05rem', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '14px' }}>📝 Itemized Answer Review</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(selectedExam.answers || {}).map(([qId, ans], qIdx) => {
                                if (['Overall Readiness Index', 'Executive Archetype Badge', 'Clinical Integrity & Ethics', 'Resilience & Grit Under Pressure', 'Empathy & Relationship Building', 'Autonomy & Self-Motivation', 'Scientific Adaptability', 'Collaborative Communication', 'Coaching & Mentorship Tips', 'mindsetReport', 'traitPercentiles', 'archetype', 'overallPercentile', 'riskLevel', 'isRedFlag', 'completedAt'].includes(qId)) {
                                    return null;
                                }
                                const q = questions.find(qu => qu._id === qId || qu.text === qId);
                                const qText = q?.text || qId;

                                // Determine if this is a psychometric/phase 2 exam — no right/wrong
                                const isPsychometricExam = selectedExam.testedProduct &&
                                    (selectedExam.testedProduct.toLowerCase().includes('psychometric') ||
                                     selectedExam.testedProduct.toLowerCase().includes('phase 2'));

                                const displayAns = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);

                                if (isPsychometricExam) {
                                    // Neutral display for psychometric — no correct/incorrect judgement
                                    return (
                                        <div key={qId} style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #3b82f6' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                                <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.92rem', flex: '1' }}>Q{qIdx + 1}: {qText}</span>
                                                <span style={{ padding: '2px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '700', background: 'rgba(59,130,246,0.18)', color: '#93c5fd', whiteSpace: 'nowrap' }}>
                                                    🎯 Selected Response
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                                                <strong>Your Response:</strong> {displayAns}
                                            </div>
                                        </div>
                                    );
                                }

                                // MCQ exam — show correct/incorrect
                                let isCorrect = true;
                                let idealAnswerText = '';
                                if (q) {
                                    const actualCorrectIndex = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.correctAnswer;
                                    idealAnswerText = q.options ? q.options[actualCorrectIndex] : actualCorrectIndex;
                                    
                                    if (typeof ans === 'number' || !isNaN(parseInt(ans))) {
                                        isCorrect = parseInt(ans) === actualCorrectIndex || q.options?.[actualCorrectIndex] == ans;
                                    } else {
                                        isCorrect = ans === q.options?.[actualCorrectIndex] || parseInt(ans) === actualCorrectIndex;
                                    }
                                }

                                return (
                                    <div key={qId} style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                            <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.92rem', flex: '1' }}>Q{qIdx + 1}: {qText}</span>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: isCorrect ? '#34d399' : '#f87171' }}>
                                                {isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                                            <strong>Your Answer:</strong> {displayAns}
                                        </div>
                                        {q && !isCorrect && idealAnswerText !== undefined && (
                                            <div style={{ fontSize: '0.85rem', color: '#34d399', marginTop: '4px' }}>
                                                <strong>Correct Answer:</strong> {idealAnswerText}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyScoresTable;
