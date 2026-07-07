import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import PendingExams from './PendingExams';

const ExamManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bank' | 'pending'>('pending');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab !== 'bank') return;
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/admin/questions');
        if (res.data.success) {
          setQuestions(res.data.questions);
        }
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [activeTab]);

  return (
    <div className="dash-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <h2 
            style={{ cursor: 'pointer', color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('pending')}
          >
            Pending Review
          </h2>
          <h2 
            style={{ cursor: 'pointer', color: activeTab === 'bank' ? 'var(--primary)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('bank')}
          >
            Question Bank
          </h2>
        </div>
        {activeTab === 'bank' && <button className="btn btn-sm btn-primary">Add New Question</button>}
      </div>

      {activeTab === 'pending' ? (
        <PendingExams />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading question bank...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 15px' }}>Category</th>
                <th style={{ padding: '12px 15px' }}>Type</th>
                <th style={{ padding: '12px 15px' }}>Question Text</th>
                <th style={{ padding: '12px 15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.slice(0, 10).map((q, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '15px' }}><span className="badge">{q.category}</span></td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{q.questionType.toUpperCase()}</td>
                  <td style={{ padding: '15px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.text}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <button className="btn btn-sm btn-outline">Edit</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No questions found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {questions.length > 10 && <div style={{textAlign: 'center', padding: '10px', color: 'var(--text-muted)'}}>Showing first 10 questions...</div>}
        </div>
      )}
    </div>
  );
};

export default ExamManager;
