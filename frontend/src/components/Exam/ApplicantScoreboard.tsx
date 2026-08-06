import React, { useEffect, useState } from 'react';
import api from '../../api/client';

interface ApplicantScoreboardProps {
  email: string;
}

const getFailedDimensions = (mindsetReport: any): string[] => {
  if (!mindsetReport || !mindsetReport.traitPercentiles) return [];
  const traits = mindsetReport.traitPercentiles;
  const failed: string[] = [];
  
  // 1. Critical Ethics Failure
  if (traits['Clinical Integrity & Ethics'] < 45) {
    failed.push('CLINICAL INTEGRITY & ETHICS');
  }
  
  // 2. General Competency Failure
  Object.entries(traits).forEach(([traitName, score]) => {
    if (traitName !== 'Clinical Integrity & Ethics' && (score as number) < 40) {
      failed.push(traitName.toUpperCase());
    }
  });
  
  // 3. Catastrophic Overall Failure (if no specific trait is below threshold but overall is < 40)
  if (failed.length === 0 && mindsetReport.overallPercentile < 40) {
    const sortedTraits = Object.entries(traits).sort((a, b) => (a[1] as number) - (b[1] as number));
    failed.push(sortedTraits[0][0].toUpperCase());
    failed.push(sortedTraits[1][0].toUpperCase());
  }
  
  return failed;
};

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
              <div>
                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem', marginBottom: '4px' }}>
                  {exam.testedProduct || 'Assessment'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Submitted: {new Date(exam.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${exam.status === 'graded' ? 'approved' : 'pending'}`}>
                {exam.status === 'graded' ? 'Graded' : 'Pending Review'}
              </span>
            </div>
            {exam.status === 'graded' ? (
              <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                {((exam.testedProduct || '').toLowerCase().includes('psychometric') || (exam.testedProduct || '').toLowerCase().includes('phase 2'))
                  ? `${exam.totalScore}% Readiness Index`
                  : `${exam.totalScore} / ${(exam.mcqTotal || 0) + (exam.descTotal || 0) || exam.totalQuestions || 20}`
                }
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>
                Auto-Score: {exam.autoScore} (Waiting for Manual Review)
              </div>
            )}
            {((exam.testedProduct || '').toLowerCase().includes('psychometric') || (exam.testedProduct || '').toLowerCase().includes('phase 2')) && exam.answers?.mindsetReport?.riskLevel === 'red' && (() => {
              const failedCategories = getFailedDimensions(exam.answers.mindsetReport);
              const formattedCategories = failedCategories.length > 1 
                ? failedCategories.slice(0, -1).join(', ') + ' and ' + failedCategories[failedCategories.length - 1]
                : failedCategories[0] || 'CRITICAL COMPETENCIES';
              const isPlural = failedCategories.length > 1;

              return (
                <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px' }}>
                  <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>?? Action Required: HR Review</strong>
                  <span style={{ color: '#fca5a5', fontSize: '0.9rem', lineHeight: '1.4', display: 'block' }}>
                    Your Psychometric Analysis on <strong style={{color: '#f87171'}}>{formattedCategories}</strong> needs a proper re-evaluation by an HR Partner. You will be contacted shortly to understand your responses in {isPlural ? 'these categories' : 'this category'}.
                  </span>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicantScoreboard;
