import React, { useState } from 'react';
import ApplicantLogin from '../components/Auth/ApplicantLogin';
import ApplicantRegister from '../components/Auth/ApplicantRegister';
import ApplicantDashboard from '../components/Dashboard/ApplicantDashboard';
import ApplicantOnboarding from '../components/Onboarding/ApplicantOnboarding';
import RapidTestEngine from '../components/Onboarding/RapidTestEngine';

type PortalState = 'landing' | 'login' | 'register' | 'dashboard' | 'onboarding' | 'rapid-test';

const ApplicantPortal: React.FC = () => {
  const [view, setView] = useState<PortalState>('landing');
  const [currentApplicant, setCurrentApplicant] = useState<any>(null);

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

  if (view === 'rapid-test') {
    return (
      <div className="landing-screen" style={{ padding: '2rem', overflowY: 'auto', display: 'block' }}>
        <div className="dash-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <RapidTestEngine 
            applicant={currentApplicant} 
            onComplete={() => {
              // Once Rapid Test is done, take them to onboarding wizard
              const updatedApplicant = { ...currentApplicant, rapidTestCompleted: true };
              setCurrentApplicant(updatedApplicant);
              setView('onboarding');
            }} 
          />
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return <ApplicantDashboard applicant={currentApplicant} onLogout={() => setView('landing')} />;
  }

  if (view === 'onboarding') {
    return (
      <div className="landing-screen" style={{ padding: '2rem', overflowY: 'auto', display: 'block' }}>
        <ApplicantOnboarding 
          applicant={currentApplicant} 
          onComplete={() => setView('dashboard')} 
        />
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
