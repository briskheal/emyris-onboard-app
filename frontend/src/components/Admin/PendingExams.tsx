import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ManualGrading from './ManualGrading';

const PendingExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingExam, setGradingExam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'graded'>('pending');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/exam-reports');
      if (res.data.success) {
        setExams(res.data.results || res.data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load pending exams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [gradingExam]); // Refetch when grading modal is closed

  if (gradingExam) {
    return <ManualGrading exam={gradingExam} onBack={() => { setGradingExam(null); fetchExams(); }} />;
  }

  const pendingExams = exams.filter(e => e.status !== 'graded');
  const gradedExams = exams.filter(e => e.status === 'graded');

  const displayedExams = activeTab === 'pending' ? pendingExams : gradedExams;

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h3 
          style={{ cursor: 'pointer', paddingBottom: '0.5rem', color: activeTab === 'pending' ? '#f59e0b' : 'var(--text-muted)', borderBottom: activeTab === 'pending' ? '2px solid #f59e0b' : 'none' }}
          onClick={() => setActiveTab('pending')}
        >
          Needs Manual Review ({pendingExams.length})
        </h3>
        <h3 
          style={{ cursor: 'pointer', paddingBottom: '0.5rem', color: activeTab === 'graded' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'graded' ? '2px solid var(--primary)' : 'none' }}
          onClick={() => setActiveTab('graded')}
        >
          Graded Results ({gradedExams.length})
        </h3>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading exams...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 15px' }}>Applicant Email</th>
                <th style={{ padding: '12px 15px' }}>Date</th>
                <th style={{ padding: '12px 15px' }}>Auto-Score (MCQ)</th>
                {activeTab === 'graded' && <th style={{ padding: '12px 15px' }}>Manual Score</th>}
                {activeTab === 'graded' && <th style={{ padding: '12px 15px' }}>Total Score</th>}
                <th style={{ padding: '12px 15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedExams.map((ex, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '15px' }}>{ex.email}</td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(ex.submittedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{ex.autoScore} Points</span>
                  </td>
                  {activeTab === 'graded' && <td style={{ padding: '15px' }}>{ex.manualScore || 0} Points</td>}
                  {activeTab === 'graded' && <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>{ex.totalScore || 0} Points</td>}
                  <td style={{ padding: '15px' }}>
                    <button className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setGradingExam(ex)}>
                      {activeTab === 'pending' ? 'Grade Now' : 'View Grade'}
                    </button>
                  </td>
                </tr>
              ))}
              {displayedExams.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'graded' ? 6 : 4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {activeTab === 'pending' ? 'All caught up! No pending exams.' : 'No graded exams found.'}
                  </td>
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
