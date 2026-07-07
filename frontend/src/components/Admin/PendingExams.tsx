import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ManualGrading from './ManualGrading';

const PendingExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingExam, setGradingExam] = useState<any>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/admin/exam-reports');
        if (res.data.success) {
          // Filter out already graded exams
          const pending = res.data.reports.filter((e: any) => e.status !== 'graded');
          setExams(pending);
        }
      } catch (err) {
        console.error("Failed to load pending exams", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [gradingExam]);

  if (gradingExam) {
    return <ManualGrading exam={gradingExam} onBack={() => setGradingExam(null)} />;
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>Needs Manual Review</h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading pending exams...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 15px' }}>Applicant</th>
                <th style={{ padding: '12px 15px' }}>Submitted</th>
                <th style={{ padding: '12px 15px' }}>Auto-Score (MCQ)</th>
                <th style={{ padding: '12px 15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '15px' }}>{ex.applicantEmail}</td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(ex.submittedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{ex.autoScore} Points</span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => setGradingExam(ex)}>Grade Now</button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>All caught up! No pending exams.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingExams;
