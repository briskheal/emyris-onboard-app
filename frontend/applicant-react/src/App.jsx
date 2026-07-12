import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Registration from './components/Registration';
import Dashboard from './components/Dashboard';
import OnboardingForm from './components/OnboardingForm';
import { OfferLetterView } from './components/OfferLetterView';

const App = ({ initialApplicant, initialView = 'landing' }) => {
  const [currentView, setCurrentView] = useState(
    (initialView && initialView !== 'landing') ? initialView : (initialApplicant ? 'dashboard' : 'landing')
  );
  const [applicant, setApplicant] = useState(initialApplicant || null);
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    if (initialApplicant) {
      setApplicant(initialApplicant);
    }
    if (initialView && initialView !== 'landing') {
      setCurrentView(initialView);
    } else if (initialApplicant && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [initialApplicant, initialView]);

  useEffect(() => {
    // Fetch company data on load for Landing/Registration
    const fetchCompany = async () => {
      try {
        const res = await fetch('/api/company-data');
        if (res.ok) {
          const data = await res.json();
          setCompanyData(data);
        }
      } catch (err) {
        console.error("Failed to load company data in React", err);
      }
    };
    fetchCompany();
  }, []);

  const handleLoginSuccess = (applicantData) => {
    setApplicant(applicantData);
    setCurrentView('dashboard');
    
    // Legacy integration: Keep the global currentApplicant updated
    if (window.resumeApplication) {
      window.currentApplicant = applicantData;
      // We don't call resumeApplication() because we handle the dashboard in React now!
    }
  };

  const handleRegistrationSuccess = (pin) => {
    alert(`Registration Successful!\n\nYour Secure PIN is: ${pin}\n\nPlease save this PIN to login later.`);
    setCurrentView('login');
  };

  const handleLogout = () => {
    setApplicant(null);
    setCurrentView('landing');
    if (window.currentApplicant) {
      window.currentApplicant = null;
    }
  };

  const refreshApplicant = async () => {
    if (!applicant?.email) return;
    const pin = applicant.password || applicant.pin || "";
    if (pin) {
      try {
        const res = await fetch('/api/applicant-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: applicant.email, pin })
        });
        const data = await res.json();
        if (data.success && data.applicant) {
          setApplicant(data.applicant);
          if (window.currentApplicant) window.currentApplicant = data.applicant;
        }
      } catch (err) {
        console.error("Refresh error:", err);
      }
    }
  };

  return (
    <div className="react-app-root">
      {currentView === 'landing' && (
        <LandingPage 
          onNavigate={setCurrentView} 
          companyData={companyData} 
        />
      )}
      
      {currentView === 'login' && (
        <Login 
          onNavigate={setCurrentView} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
      
      {currentView === 'register' && (
        <Registration 
          onNavigate={setCurrentView} 
          onRegistrationSuccess={handleRegistrationSuccess} 
          companyData={companyData} 
        />
      )}
      
      {currentView === 'dashboard' && applicant && (
        <Dashboard 
          applicant={applicant} 
          onLogout={handleLogout}
        />
      )}

      {currentView === 'onboardingForm' && applicant && (
        <OnboardingForm 
          applicant={applicant} 
          companyData={companyData}
          onComplete={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'offerLetter' && applicant && (
        <OfferLetterView 
          applicant={applicant} 
          companyData={companyData}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onRefreshApplicant={refreshApplicant}
        />
      )}
    </div>
  );
};

export default App;
