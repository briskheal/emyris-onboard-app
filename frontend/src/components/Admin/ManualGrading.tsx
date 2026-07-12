import React, { useState, useEffect } from 'react';
import api from '../../api/client';

interface ManualGradingProps {
  exam: any;
  onBack: () => void;
}

const ManualGrading: React.FC<ManualGradingProps> = ({ exam, onBack }) => {
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/admin/questions');
        if (res.data.success) {
          setQuestions(res.data.questions || []);
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // exam.answers is a dictionary: { questionId: "answer text" }
  // We need to find the descriptive questions that were answered.
  const descriptiveAnswers = Object.entries(exam.answers || {})
    .map(([qId, ansText]) => {
      const q = questions.find((qu) => qu._id === qId);
      if (q && q.questionType === 'descriptive') {
        return {
          questionId: qId,
          questionObj: q,
          answerText: typeof ansText === 'object' ? JSON.stringify(ansText) : ansText,
          manualMark: 0 // default
        };
      }
      return null;
    })
    .filter(Boolean);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const totalManualScore = Object.values(marks).reduce((sum, mark) => sum + mark, 0);
      
      const res = await api.post('/admin/grade-exam', {
        examId: exam._id,
        manualScore: totalManualScore
      });
      
      if (res.data.success) {
        alert('Exam graded successfully!');
        onBack();
      }
    } catch (err) {
      console.error('Failed to grade exam', err);
      alert('Error saving grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading exam details...</div>;
  }

  return (
    <div className="dash-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Grading: {exam.name || exam.email}</h2>
        <button className="btn btn-sm btn-outline" onClick={onBack}>Cancel</button>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {descriptiveAnswers.length === 0 ? (
           <div style={{ color: 'var(--text-muted)' }}>No descriptive answers found in this exam.</div>
        ) : (
          descriptiveAnswers.map((ans: any, idx: number) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #a78bfa' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Question (Descriptive)</p>
              <h4 style={{ margin: '10px 0' }}>{ans.questionObj?.text || 'Descriptive Question'}</h4>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', color: '#e2e8f0', marginBottom: '15px' }}>
                {ans.answerText || 'No answer provided'}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label>Assign Mark (0 or 1):</label>
                <input 
                  type="number" 
                  min="0" 
                  max="1" 
                  step="1"
                  className="form-input-sm" 
                  style={{ width: '80px' }}
                  value={marks[ans.questionId] !== undefined ? marks[ans.questionId] : (ans.manualMark || 0)}
                  onChange={(e) => setMarks({...marks, [ans.questionId]: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || descriptiveAnswers.length === 0}>
          {submitting ? 'Saving...' : 'Finalize Grade'}
        </button>
      </div>
    </div>
  );
};

export default ManualGrading;
