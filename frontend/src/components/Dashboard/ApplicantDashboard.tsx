import React, { useState } from 'react';
import Timeline from './Timeline';
import ApplicantScoreboard from '../Exam/ApplicantScoreboard';
import ApplicantExam from '../Exam/ApplicantExam';
import RapidTestEngine from '../Onboarding/RapidTestEngine';
import { LogOut } from 'lucide-react';

interface ApplicantDashboardProps {
  applicant: any;
  onLogout: () => void;
}

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ applicant, onLogout }) => {
  const [app] = useState(applicant);
  const [takingExam, setTakingExam] = useState(false);
  const [takingRapidTest, setTakingRapidTest] = useState(false);

  if (takingRapidTest) {
    return (
      <div className="app-container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div className="dash-card" style={{ width: '100%', maxWidth: '900px' }}>
          <RapidTestEngine applicant={app} onComplete={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (takingExam) {
    return <ApplicantExam applicant={app} onComplete={() => setTakingExam(false)} />;
  }

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-main-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="logo-icon">
              <span>{app.fullName ? app.fullName[0].toUpperCase() : 'U'}</span>
            </div>
            <h2>Welcome, {app.fullName}</h2>
          </div>
          <button className="btn btn-sm btn-outline" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="form-wrapper">
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          <Timeline app={app} />

          <div className="dash-card">
            <h3>Document Verification Status</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {app.status === 'submitted' ? 'Your documents are under review.' : 
               app.status === 'approved' ? 'All documents verified successfully.' : 'Please check your status.'}
            </p>
          </div>

          {!app.rapidTestCompleted && app.status === 'submitted' && (
            <div className="dash-card" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>Pending Action: Rapid Assessment</h3>
              <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                You have submitted your application, but you still need to complete the mandatory 25-minute Rapid Assessment before HR can review your file.
              </p>
              <button className="btn btn-primary" onClick={() => setTakingRapidTest(true)} style={{ fontSize: '1.1rem', padding: '12px 24px', background: '#f59e0b', border: 'none', color: '#000' }}>
                Start Rapid Assessment Now ✨
              </button>
            </div>
          )}

          <ApplicantScoreboard email={app.email} />

          {app.status === 'approved' && !app.offerLetterData && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setTakingExam(true)} style={{ fontSize: '1.1rem', padding: '15px 30px' }}>
                Launch Qualification Exam
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ApplicantDashboard;
