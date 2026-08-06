import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DoctorDetailingStudio from '../Dashboard/DoctorDetailingStudio';
import type { SubmitExamPayload } from '../../types/api';

interface ApplicantExamProps {
  applicant: any;
  onComplete: () => void;
}

const ApplicantExam: React.FC<ApplicantExamProps> = ({ applicant, onComplete }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStudio, setShowStudio] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await api.post('/applicant/exam-questions', { email: applicant.email });
        if (res.data.success) {
          setQuestions(res.data.questions);
          setTimeLeft((res.data.mcqTime + res.data.descTime) * 60);
        }
      } catch (err) {
        console.error("Failed to load exam", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [applicant]);

  useEffect(() => {
    if (loading || submitting) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, submitting]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: SubmitExamPayload = {
        email: applicant.email,
        answers: answers,
        totalQuestions: questions.length
      };
      await api.post('/applicant/submit-exam', payload);
      alert('Exam submitted successfully!');
      onComplete();
    } catch (err) {
      console.error("Submission failed", err);
      alert('Failed to submit exam. Please contact admin.');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>Loading Exam...</div>;
  if (questions.length === 0) return <div style={{textAlign: 'center', padding: '2rem'}}>No exam available.</div>;

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="dash-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Emyris Qualification Exam</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowStudio(!showStudio)}
            className="btn btn-sm btn-outline"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🎙️ {showStudio ? 'Close Detailing Studio' : 'Audio Detailing Guide'}
          </button>
          <div style={{ background: timeLeft < 60 ? '#ef4444' : 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
            ⏱ {m}:{s}
          </div>
        </div>
      </div>

      {showStudio && (
        <div style={{ marginBottom: '2rem' }}>
          <DoctorDetailingStudio onClose={() => setShowStudio(false)} />
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
        {questions.map((q, idx) => (
          <div key={q._id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '1rem' }}>{idx + 1}. {q.text}</h4>
            
            {q.questionType === 'mcq' ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {q.options.map((opt: string, oIdx: number) => (
                  <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name={`q_${q._id}`} 
                      value={opt}
                      checked={answers[q._id] === opt}
                      onChange={() => setAnswers({...answers, [q._id]: opt})}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder="Type your answer here..."
                value={answers[q._id] || ''}
                onChange={(e) => setAnswers({...answers, [q._id]: e.target.value})}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Final Answers'}
        </button>
      </div>
    </div>
  );
};

export default ApplicantExam;
