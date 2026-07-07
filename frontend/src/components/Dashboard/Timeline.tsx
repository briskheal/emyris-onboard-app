import React from 'react';

interface TimelineProps {
  app: any;
}

const Timeline: React.FC<TimelineProps> = ({ app }) => {
  const steps = [
    { label: 'Register', done: true },
    { label: 'Submit', done: !!app.submittedAt || ['submitted', 'approved', 'onboarding', 'joined', 'confirmed', 'rejected'].includes(app.status) },
    { label: 'Verify', done: app.status === 'approved' || !!app.offerLetterData },
    { label: 'Offer', done: !!app.offerLetterData },
    { label: 'Joined', done: !!app.offerAccepted && !!app.actualJoiningDate },
    { label: 'Appointed', done: !!app.apptLetterData },
    { label: 'Confirmed', done: app.status === 'confirmed' }
  ];

  const completedSteps = steps.filter(s => s.done).length;
  const pct = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="dash-card">
      <h3>Onboarding Progress</h3>
      <div className="progress-container">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${pct}%`, transition: 'width 1s ease-in-out' }}></div>
        </div>
        <p className="progress-text">{pct}% Completed</p>
      </div>

      <div className="timeline-container" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {steps.map((s, i) => (
          <div key={i} className={`timeline-item-premium ${s.done ? 'done' : ''}`} style={{ opacity: s.done ? 1 : 0.5 }}>
            <div className="timeline-dot-premium" style={{ background: s.done ? 'var(--primary)' : 'rgba(255,255,255,0.1)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              {s.done ? '✓' : i + 1}
            </div>
            <div className="timeline-label-premium" style={{ textAlign: 'center', fontSize: '0.8rem' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
