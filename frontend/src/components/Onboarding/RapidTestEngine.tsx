import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/client';
import DoctorDetailingStudio from '../Dashboard/DoctorDetailingStudio';

interface RapidTestEngineProps {
  applicant: any;
  onComplete: () => void;
}

const RapidTestEngine: React.FC<RapidTestEngineProps> = ({ applicant, onComplete }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/applicant/test-questions');
        if (res.data.success) {
          setQuestions(res.data.questions);
          startTimer(25 * 60);
        } else {
          alert('Failed to load test questions.');
        }
      } catch (err) {
        alert('Error loading test.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = (seconds: number) => {
    let current = seconds;
    setTimeLeft(current);
    timerRef.current = setInterval(() => {
      current -= 1;
      setTimeLeft(current);
      if (current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleSubmitTest();
      }
    }, 1000);
  };

  const handleSelectAnswer = (qId: string, selectedIdx: number) => {
    if (answers[qId] !== undefined) return; // Prevent re-answering
    setAnswers(prev => ({ ...prev, [qId]: selectedIdx }));
  };

  const handleSubmitTest = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await api.post('/applicant/submit-test', {
        email: applicant.email,
        answers
      });
      if (res.data.success) {
        alert(`Assessment Complete!\n\nYour Score: ${res.data.score} / 20\n\nThank you. You will now be forwarded to your onboarding dashboard.`);
        onComplete();
      } else {
        alert(res.data.error || "Failed to submit test.");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Error submitting test.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-main)' }}>
        Loading Rapid Assessment...
      </div>
    );
  }

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>Rapid Assessment</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Attempt all questions. Instant feedback provided.</p>
        </div>
        <div style={{ background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${timeLeft < 300 ? '#ef4444' : '#10b981'}`, color: timeLeft < 300 ? '#ef4444' : '#10b981', padding: '0.5rem 1rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '1.2rem' }}>
          <Clock size={20} />
          {m}:{s}
        </div>
      </div>

      {/* Test Question Bank & Doctor Detailing Voice Studio (`Qualification & Training Center`) for Rapid Assessment Candidates */}
      <div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '16px', padding: '1.4rem', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showStudio ? '1.5rem' : '0', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#a855f7', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎓 Qualification & Training Center
              </span>
              <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                Test Bank & Audio Pitch Lab
              </span>
            </div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>Doctor Detailing Voice Studio & Question Bank</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              Listen to the 4-Step MR Pitch and practice speaking into the microphone with audio playback right while completing your assessment!
            </p>
          </div>
          <button
            onClick={() => setShowStudio(!showStudio)}
            className={`btn ${showStudio ? 'btn-outline' : 'btn-primary'}`}
            style={{ background: showStudio ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #a855f7, #6366f1)', border: showStudio ? '1px solid #a855f7' : 'none', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)' }}
          >
            <span>{showStudio ? '✕ Close Studio Lab' : '🎙️ Open Voice Studio & Test Bank'}</span>
          </button>
        </div>

        {showStudio && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <DoctorDetailingStudio onClose={() => setShowStudio(false)} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, idx) => {
          const answered = answers[q._id] !== undefined;
          const selectedIdx = answers[q._id];
          const isCorrect = answered && selectedIdx === q.correctAnswerIndex;
          
          return (
            <div key={q._id} style={{ 
              background: 'rgba(0,0,0,0.25)', 
              padding: '1.2rem', 
              borderRadius: '12px', 
              border: `1px solid ${answered ? (isCorrect ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)') : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.3s ease'
            }}>
              <h4 style={{ marginBottom: '1rem', color: '#fff', fontSize: '1.05rem', lineHeight: '1.4' }}>
                Q{idx + 1}. {q.text}
              </h4>
              <div style={{ pointerEvents: answered ? 'none' : 'auto' }}>
                {q.questionType === 'descriptive' ? (
                  <div style={{ padding: '10px' }}>
                    <textarea 
                      className="form-input" 
                      rows={4} 
                      placeholder="Type your descriptive answer here..."
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q._id]: e.target.value as any }))}
                    ></textarea>
                    {answered && <div style={{ marginTop: '10px', color: 'var(--primary)', fontSize: '0.9rem' }}><CheckCircle size={14} style={{ display: 'inline' }} /> Answer recorded for manual grading</div>}
                  </div>
                ) : (
                  q.options.map((opt: string, optIdx: number) => {
                    const isThisSelected = selectedIdx === optIdx;
                    const isThisCorrect = q.correctAnswerIndex === optIdx;
                    
                    let bg = 'rgba(255,255,255,0.02)';
                    let borderColor = 'rgba(255,255,255,0.06)';
                    let color = 'var(--text-secondary)';
                    let icon = null;

                    if (answered) {
                      if (isThisCorrect) {
                        bg = 'rgba(34, 197, 94, 0.15)';
                        borderColor = 'rgba(34, 197, 94, 0.6)';
                        color = '#4ade80';
                        icon = <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Correct Answer</span>;
                      } else if (isThisSelected && !isThisCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        borderColor = 'rgba(239, 68, 68, 0.6)';
                        color = '#f87171';
                        icon = <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Incorrect</span>;
                      }
                    }

                    return (
                      <div key={optIdx} style={{ 
                        marginBottom: '8px', 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        border: `1px solid ${borderColor}`, 
                        background: bg, 
                        color: color,
                        transition: 'all 0.2s ease',
                        cursor: answered ? 'default' : 'pointer'
                      }} onClick={() => handleSelectAnswer(q._id, optIdx)}>
                        <label style={{ cursor: answered ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.95rem', margin: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                              type="radio" 
                              name={`qt_${q._id}`} 
                              checked={isThisSelected}
                              readOnly
                              style={{ accentColor: 'var(--primary)', cursor: answered ? 'default' : 'pointer' }} 
                            />
                            <span>{opt}</span>
                          </div>
                          {icon}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSubmitTest}
          disabled={submitting}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 2rem', fontSize: '1.1rem' }}
        >
          {submitting ? 'Evaluating...' : 'Submit Assessment'} <CheckCircle size={20} />
        </button>
      </div>
    </div>
  );
};

export default RapidTestEngine;
