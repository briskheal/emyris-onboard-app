import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Registration from './components/Registration';
import Dashboard from './components/Dashboard';
import OnboardingForm from './components/OnboardingForm';

const App = ({ initialApplicant, initialView = 'landing' }) => {
  const [currentView, setCurrentView] = useState(initialApplicant ? 'dashboard' : initialView);
  const [applicant, setApplicant] = useState(initialApplicant || null);
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    // If applicant was passed later, update state
    if (initialApplicant && !applicant) {
      setApplicant(initialApplicant);
      setCurrentView('dashboard');
    }
  }, [initialApplicant]);

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
    </div>
  );
};

export default App;
