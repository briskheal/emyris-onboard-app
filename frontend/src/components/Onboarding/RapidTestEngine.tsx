import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/client';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>Rapid Assessment</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Attempt all questions. Instant feedback provided.</p>
        </div>
        <div style={{ background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${timeLeft < 300 ? '#ef4444' : '#10b981'}`, color: timeLeft < 300 ? '#ef4444' : '#10b981', padding: '0.5rem 1rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '1.2rem' }}>
          <Clock size={20} />
          {m}:{s}
        </div>
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
                {q.options.map((opt: string, optIdx: number) => {
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
                })}
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
