import React, { useEffect, useState } from 'react';
import api from '../../api/client';

interface ApplicantScoreboardProps {
  email: string;
}

const ApplicantScoreboard: React.FC<ApplicantScoreboardProps> = ({ email }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get(`/applicant/my-scores/${email}`);
        if (res.data.success) {
          setExams(res.data.exams);
        } else {
          setError('Failed to load scores.');
        }
      } catch (err) {
        setError('Connection failed. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [email]);

  if (loading) return <div style={{textAlign:'center', padding: '30px', color: 'var(--text-muted)'}}>Loading your scores...</div>;
  if (error) return <div style={{textAlign:'center', padding: '30px', color: '#ef4444'}}>{error}</div>;

  if (exams.length === 0) {
    return <div style={{textAlign:'center', padding: '30px', color: 'var(--text-muted)'}}>No past exams found.</div>;
  }

  return (
    <div className="dash-card">
      <h3>🏆 My Exam Scoreboard</h3>
      <div style={{ display: 'grid', gap: '15px', marginTop: '1rem' }}>
        {exams.map((exam, idx) => (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{new Date(exam.submittedAt).toLocaleDateString()}</span>
              <span className={`badge ${exam.status === 'graded' ? 'approved' : 'pending'}`}>
                {exam.status === 'graded' ? 'Graded' : 'Pending Review'}
              </span>
            </div>
            {exam.status === 'graded' ? (
              <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                {exam.totalScore} / {exam.totalQuestions}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>
                Auto-Score: {exam.autoScore} (Waiting for Manual Review)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicantScoreboard;
