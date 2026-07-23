import React, { useState, useEffect } from 'react';
import { X, UserCheck, Award, Target } from 'lucide-react';
import api from '../../api/client';

interface PsychometricDossierModalProps {
  exam: any;
  onClose: () => void;
}

export const PsychometricDossierModal: React.FC<PsychometricDossierModalProps> = ({ exam, onClose }) => {
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

  const answers = exam.answers || {};
  
  // Backwards compatibility for older exams where data was flat
  const isStructured = !!answers.mindsetReport;
  const report = isStructured ? answers.mindsetReport : {
    archetype: answers['Executive Archetype Badge'] || "Unknown Archetype",
    overallPercentile: parseInt(answers['Overall Readiness Index'] || "0", 10),
    traitPercentiles: {
      'Clinical Integrity & Ethics': parseInt(answers['Clinical Integrity & Ethics'] || "0", 10),
      'Resilience & Grit Under Pressure': parseInt(answers['Resilience & Grit Under Pressure'] || "0", 10),
      'Empathy & Relationship Building': parseInt(answers['Empathy & Relationship Building'] || "0", 10),
      'Autonomy & Self-Motivation': parseInt(answers['Autonomy & Self-Motivation'] || "0", 10),
      'Scientific Adaptability': parseInt(answers['Scientific Adaptability'] || "0", 10),
      'Collaborative Communication': parseInt(answers['Collaborative Communication'] || "0", 10)
    },
    coachingTips: answers['Coaching & Mentorship Tips'] ? answers['Coaching & Mentorship Tips'].split(' | ') : []
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34d399'; // Emerald
    if (score >= 60) return '#60a5fa'; // Blue
    if (score >= 40) return '#fbbf24'; // Amber
    return '#f87171'; // Red
  };

  const traitEntries = Object.entries(report.traitPercentiles || {});

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={{...styles.modal, padding: '40px', textAlign: 'center', color: '#fff'}}>
          <h2>Loading Dossier...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              <UserCheck size={24} style={{ color: 'var(--primary)' }} />
              Psychometric Dossier
            </h2>
            <p style={styles.subtitle}>Phase 2 Mindset & Behavioral Assessment for {exam.name}</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>

        <div style={styles.content}>
          <div style={styles.heroSection}>
            <div style={styles.heroCard}>
              <Award size={36} color="#fbbf24" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Archetype Profile</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '5px' }}>{report.archetype}</div>
            </div>
            <div style={styles.heroCard}>
              <Target size={36} color="#60a5fa" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall Readiness</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(report.overallPercentile), marginTop: '5px' }}>
                {report.overallPercentile}%
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>6-Dimension Competency Radar Breakdown</h3>
            <div style={styles.radarContainer}>
              {traitEntries.map(([trait, score]: any) => (
                <div key={trait} style={styles.traitRow}>
                  <div style={styles.traitHeader}>
                    <span style={styles.traitName}>{trait}</span>
                    <span style={{ fontWeight: 600, color: getScoreColor(score) }}>{score}%</span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div 
                      style={{ 
                        ...styles.progressBarFill, 
                        width: `${score}%`, 
                        background: getScoreColor(score),
                        boxShadow: `0 0 10px ${getScoreColor(score)}40`
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Coaching & Mentorship Tips</h3>
            <div style={styles.coachingBox}>
              {report.coachingTips && report.coachingTips.length > 0 ? (
                report.coachingTips.map((tip: string, idx: number) => (
                  <div key={idx} style={styles.coachingTip}>
                    <div style={styles.tipDot} />
                    {tip}
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8' }}>No specific coaching tips generated for this profile.</div>
              )}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Candidate's Situational Responses</h3>
            <div style={styles.questionsList}>
              {questions.filter(q => q.dimension).map((q, idx) => {
                const selectedIdx = answers[q._id];
                const selectedOption = selectedIdx !== undefined ? q.options[selectedIdx] : 'No answer provided';
                
                return (
                  <div key={q._id} style={styles.questionCard}>
                    <div style={styles.questionHeader}>
                      <span style={styles.questionNum}>Situation {idx + 1}</span>
                      <span style={styles.dimensionBadge}>{q.dimension}</span>
                    </div>
                    <p style={styles.questionText}>{q.text}</p>
                    <div style={styles.responseBox}>
                      <span style={styles.responseLabel}>Candidate Action Selected:</span>
                      <p style={styles.responseText}>{selectedOption}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} className="btn btn-primary">Close Dossier</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden'
  },
  header: {
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(15, 23, 42, 0.8)'
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#94a3b8',
    fontSize: '0.9rem'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s'
  },
  content: {
    padding: '32px',
    overflowY: 'auto' as const,
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px'
  },
  heroSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  heroCard: {
    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  sectionTitle: {
    margin: 0,
    color: '#e2e8f0',
    fontSize: '1.15rem',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '10px'
  },
  radarContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    background: 'rgba(30, 41, 59, 0.4)',
    padding: '24px',
    borderRadius: '12px'
  },
  traitRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  traitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  traitName: {
    color: '#cbd5e1',
    fontSize: '0.95rem',
    fontWeight: 500
  },
  progressBarBg: {
    height: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 1s ease-out'
  },
  coachingBox: {
    background: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  coachingTip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    color: '#bfdbfe',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  tipDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#60a5fa',
    marginTop: '8px',
    flexShrink: 0
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  questionCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px'
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  questionNum: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  },
  dimensionBadge: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600
  },
  questionText: {
    margin: '0 0 16px 0',
    color: '#f1f5f9',
    fontSize: '1rem',
    lineHeight: '1.5'
  },
  responseBox: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '16px',
    borderRadius: '8px',
    borderLeft: '4px solid #6366f1'
  },
  responseLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    marginBottom: '6px'
  },
  responseText: {
    margin: 0,
    color: '#fff',
    fontSize: '0.95rem',
    fontStyle: 'italic'
  },
  footer: {
    padding: '20px 32px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'flex-end',
    background: 'rgba(15, 23, 42, 0.8)'
  }
};
