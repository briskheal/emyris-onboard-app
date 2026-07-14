import React, { useState } from 'react';
import Timeline from './Timeline';
import ApplicantScoreboard from '../Exam/ApplicantScoreboard';
import ApplicantExam from '../Exam/ApplicantExam';
import LetterViewer from './LetterViewer';
import DoctorDetailingStudio from './DoctorDetailingStudio';
import { LogOut } from 'lucide-react';

interface ApplicantDashboardProps {
  applicant: any;
  onLogout: () => void;
}

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ applicant, onLogout }) => {
  const [app] = useState(applicant);
  const [takingExam, setTakingExam] = useState(false);
  const [showStudio, setShowStudio] = useState(false);

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

          {showStudio ? (
            <DoctorDetailingStudio onClose={() => setShowStudio(false)} />
          ) : (
            <div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '14px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: '#6366f1', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    🎙️ Voice Integration Module
                  </span>
                  <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                    Audio Pitch Simulator & Mic Practice Lab
                  </span>
                </div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem' }}>Doctor Detailing Voice Studio</h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Listen to the exact 4-Step In-Clinic MR Pitch (`Text-to-Speech`) and practice your delivery aloud into the microphone (`Speech-to-Text & AI Scorer`).
                </p>
              </div>
              <button
                onClick={() => setShowStudio(true)}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', padding: '12px 24px', fontSize: '1rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)', cursor: 'pointer' }}
              >
                <span>🎙️ Launch Voice Studio</span>
              </button>
            </div>
          )}

          <div className="dash-card">
            <h3>Document Verification Status</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {app.status === 'submitted' ? 'Your documents are under review.' : 
               app.status === 'approved' ? 'All documents verified successfully.' : 'Please check your status.'}
            </p>
          </div>

          <ApplicantScoreboard email={app.email} />

          {app.status === 'approved' && !app.offerLetterData && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setTakingExam(true)} style={{ fontSize: '1.1rem', padding: '15px 30px' }}>
                Launch Qualification Exam
              </button>
            </div>
          )}

          {app.offerLetterData && (
            <LetterViewer 
              title="Your Offer Letter"
              letterData={app.offerLetterData}
              isOffer={true}
              isAccepted={app.offerAccepted}
              applicantEmail={app.email}
              onAcceptSuccess={() => window.location.reload()}
            />
          )}

          {app.apptLetterData && (
            <LetterViewer 
              title="Your Appointment Letter"
              letterData={app.apptLetterData}
              isOffer={false}
            />
          )}

        </div>
      </main>
    </div>
  );
};

export default ApplicantDashboard;
