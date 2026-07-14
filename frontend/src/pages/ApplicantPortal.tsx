import React, { useState } from 'react';
import ApplicantLogin from '../components/Auth/ApplicantLogin';
import ApplicantRegister from '../components/Auth/ApplicantRegister';
import ApplicantDashboard from '../components/Dashboard/ApplicantDashboard';
import ApplicantOnboarding from '../components/Onboarding/ApplicantOnboarding';
import RapidTestEngine from '../components/Onboarding/RapidTestEngine';
import DoctorDetailingStudio from '../components/Dashboard/DoctorDetailingStudio';

type PortalState = 'landing' | 'login' | 'register' | 'dashboard' | 'onboarding' | 'rapid-test';

const ApplicantPortal: React.FC = () => {
  const [view, setView] = useState<PortalState>('landing');
  const [currentApplicant, setCurrentApplicant] = useState<any>(null);
  const [showPortalStudio, setShowPortalStudio] = useState(false);

  const handleLoginSuccess = (applicant: any) => {
    setCurrentApplicant(applicant);
    if (!applicant.rapidTestCompleted) {
      setView('rapid-test');
    } else if (!applicant.status || applicant.status === 'draft') {
      setView('onboarding');
    } else {
      setView('dashboard');
    }
  };

  const handleRegisterSuccess = (_email: string) => {
    setView('login');
  };

  const renderTopCandidateBar = () => (
    <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderBottom: '1px solid rgba(168, 85, 247, 0.45)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 25px rgba(0,0,0,0.6)', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.4rem' }}>🎙️</span>
        <div>
          <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.3px' }}>Emyris Biolifesciences Portal</span>
          <span style={{ background: 'rgba(168, 85, 247, 0.25)', border: '1px solid #a855f7', color: '#e9d5ff', fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px', marginLeft: '10px', fontWeight: 700 }}>
            {currentApplicant?.name || currentApplicant?.email || 'Candidate Dashboard'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => setShowPortalStudio(!showPortalStudio)}
          className="btn btn-primary btn-sm"
          style={{ background: showPortalStudio ? '#ef4444' : 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', padding: '9px 18px', fontSize: '0.92rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)', cursor: 'pointer' }}
        >
          <span>{showPortalStudio ? '✕ Close Studio Lab' : '🎙️ Voice Studio (`AI Lab`) & Test Bank'}</span>
        </button>
        {view !== 'dashboard' && (
          <button
            onClick={() => {
              setCurrentApplicant(null);
              setView('landing');
            }}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#cbd5e1' }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );

  const renderStudioModal = () => showPortalStudio && (
    <div style={{ background: 'rgba(15, 23, 42, 0.98)', borderBottom: '2px solid #a855f7', padding: '2rem 1rem', position: 'relative', zIndex: 999 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <DoctorDetailingStudio onClose={() => setShowPortalStudio(false)} />
      </div>
    </div>
  );

  if (view === 'rapid-test') {
    return (
      <div className="landing-screen" style={{ overflowY: 'auto', display: 'block' }}>
        {renderTopCandidateBar()}
        {renderStudioModal()}
        <div style={{ padding: '2rem' }}>
          <div className="dash-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <RapidTestEngine 
              applicant={currentApplicant} 
              onComplete={() => {
                const updatedApplicant = { ...currentApplicant, rapidTestCompleted: true };
                setCurrentApplicant(updatedApplicant);
                setView('onboarding');
              }} 
            />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="landing-screen" style={{ overflowY: 'auto', display: 'block' }}>
        {renderTopCandidateBar()}
        {renderStudioModal()}
        <ApplicantDashboard applicant={currentApplicant} onLogout={() => setView('landing')} />
      </div>
    );
  }

  if (view === 'onboarding') {
    return (
      <div className="landing-screen" style={{ overflowY: 'auto', display: 'block' }}>
        {renderTopCandidateBar()}
        {renderStudioModal()}
        <div style={{ padding: '2rem' }}>
          <ApplicantOnboarding 
            applicant={currentApplicant} 
            onComplete={() => setView('dashboard')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="landing-screen">
      <div className="landing-marquee-bar">
        <div className="marquee-inner">Enhancing Life and Excelling in Care</div>
      </div>
      
      {view === 'landing' && (
        <>
          <div className="landing-hero">
            <div className="landing-logo-wrap">
              <div className="landing-logo-fallback">E</div>
            </div>
            <div className="landing-hero-text">
              <h1 className="landing-company-name">Emyris Biolifesciences</h1>
              <p className="landing-tagline">Employee Onboarding Portal</p>
            </div>
          </div>
          <div className="landing-cards">
            <button className="lcard lcard-primary" onClick={() => setView('register')}>
              <div className="lcard-icon">✨</div>
              <h3>Start New Journey</h3>
              <p>Register your profile and generate your Secure PIN</p>
            </button>
            <button className="lcard lcard-success" onClick={() => setView('login')}>
              <div className="lcard-icon">🔑</div>
              <h3>Resume Journey</h3>
              <p>Access your existing profile and continue onboarding</p>
            </button>
          </div>
        </>
      )}

      {view === 'login' && (
        <div className="form-wrapper" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
          <ApplicantLogin onBack={() => setView('landing')} onSuccess={handleLoginSuccess} />
        </div>
      )}

      {view === 'register' && (
        <div className="form-wrapper" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
          <ApplicantRegister onBack={() => setView('landing')} onSuccess={handleRegisterSuccess} />
        </div>
      )}
    </div>
  );
};

export default ApplicantPortal;
