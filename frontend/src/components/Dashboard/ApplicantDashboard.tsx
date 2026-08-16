import React, { useState } from 'react';
import Timeline from './Timeline';
import ApplicantScoreboard from '../Exam/ApplicantScoreboard';
import ApplicantExam from '../Exam/ApplicantExam';
import LetterViewer from './LetterViewer';
import DoctorDetailingStudio from './DoctorDetailingStudio';
import ManageLeavePortal from './ManageLeavePortal';
import { LogOut, Calendar } from 'lucide-react';

interface ApplicantDashboardProps {
  applicant: any;
  onLogout: () => void;
}

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ applicant, onLogout }) => {
  const [app] = useState(applicant);
  const [takingExam, setTakingExam] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showLeavePortal, setShowLeavePortal] = useState(false);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className={`btn btn-sm ${showLeavePortal ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setShowLeavePortal(!showLeavePortal); setShowStudio(false); }} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showLeavePortal ? 'var(--primary)' : 'transparent', color: showLeavePortal ? '#fff' : 'var(--primary)', borderColor: 'var(--primary)', fontWeight: 600 }}
            >
              <Calendar size={16} /> Manage Leave
            </button>
            <button 
              className={`btn btn-sm ${showStudio ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setShowStudio(!showStudio); setShowLeavePortal(false); }} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showStudio ? 'var(--primary)' : 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', color: '#fff', fontWeight: 600 }}
            >
              🎙️ {showStudio ? 'Close Voice Studio' : 'Voice Studio (`AI Lab`)'}
            </button>
            <button className="btn btn-sm btn-outline" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="form-wrapper">
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {showLeavePortal ? (
            <ManageLeavePortal email={app.email} />
          ) : (
            <>
              <Timeline app={app} />

              <div className="dash-card">
                <h3>Document Verification Status</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  {app.status === 'submitted' ? 'Your documents are under review.' : 
                   app.status === 'approved' ? 'All documents verified successfully.' : 'Please check your status.'}
                </p>
              </div>

          {/* Unified Test Question Block & Voice Studio Block */}
          <div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ background: '#a855f7', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎓 Qualification & Training Center
                </span>
                <h2 style={{ margin: '8px 0 0 0', color: '#f8fafc', fontSize: '1.4rem' }}>Test Question Bank & Voice Detailing Studio</h2>
              </div>
            </div>

            {showStudio ? (
              <div style={{ marginBottom: '2rem' }}>
                <DoctorDetailingStudio onClose={() => setShowStudio(false)} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* Test Question Block */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>📝</span>
                      <h3 style={{ margin: 0, color: '#6366f1', fontSize: '1.15rem' }}>Test Question Block</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                      Access the official product question bank including Alomos Gold MCQs and descriptive detailing questions. Review your test attempt scores and launch your qualification exam.
                    </p>
                    <div style={{ margin: '1rem 0' }}>
                      <ApplicantScoreboard email={app.email} />
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    {app.status === 'approved' && !app.offerLetterData ? (
                      <button className="btn btn-primary" onClick={() => setTakingExam(true)} style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                        🚀 Launch Official Qualification Exam
                      </button>
                    ) : (
                      <button className="btn btn-outline" onClick={() => setTakingExam(true)} style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, borderColor: '#6366f1', color: '#818cf8' }}>
                        📝 Launch Practice Test & Question Bank
                      </button>
                    )}
                  </div>
                </div>

                {/* Voice Studio Block */}
                <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(99, 102, 241, 0.12))', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '12px', padding: '1.4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>🎙️</span>
                      <h3 style={{ margin: 0, color: '#c084fc', fontSize: '1.15rem' }}>Voice Detailing Studio</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                      Listen to the full word pronunciation of <strong style={{ color: '#fff' }}>Alomos Gold</strong> (`4-Step In-Clinic MR Pitch`) at adjustable speeds, then practice speaking aloud into your microphone for real-time AI scoring.
                    </p>
                    <ul style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: '1rem 0', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                      <li>🔊 Title-cased Text-to-Speech audio pitch player</li>
                      <li>🎙️ Live Speech-to-Text transcription right in your browser</li>
                      <li>🎯 Instant keyword accuracy scoring against clinical targets</li>
                    </ul>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      onClick={() => setShowStudio(true)}
                      className="btn btn-primary"
                      style={{ width: '100%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', padding: '12px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)' }}
                    >
                      <span>🎙️ Open Voice Studio Lab</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

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
          </>
          )}

        </div>
      </main>
    </div>
  );
};

export default ApplicantDashboard;
