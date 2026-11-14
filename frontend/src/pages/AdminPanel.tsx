import React, { useState, Suspense, lazy } from 'react';
import { Building2, Users, FileSignature, HelpCircle, ClipboardList, LogOut, FileSpreadsheet, Mic, Award, Menu, X, ChevronDown, ChevronUp, HandCoins, CheckSquare, Share2, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import api from '../api/client';

const CompanyProfile = lazy(() => import('../components/Admin/CompanyProfile'));
const ApplicantManager = lazy(() => import('../components/Admin/ApplicantManager'));
const ConfirmationManager = lazy(() => import('../components/Admin/ConfirmationManager'));
const SetupAndLetters = lazy(() => import('../components/Admin/SetupAndLetters'));
const QuestionBank = lazy(() => import('../components/Admin/QuestionBank'));
const PendingExams = lazy(() => import('../components/Admin/PendingExams'));
const ReportsTab = lazy(() => import('../components/Admin/ReportsTab'));
const DoctorDetailingStudio = lazy(() => import('../components/Dashboard/DoctorDetailingStudio'));
const PayrunSystem = lazy(() => import('../components/Admin/PayrunSystem'));
const LinkedInDesk = lazy(() => import('../components/Admin/LinkedInDesk'));

const SupportManagement = lazy(() => import('../components/Admin/SupportManagement'));

type AdminView = 'company' | 'applicants' | 'confirmations' | 'setup' | 'questions' | 'pending' | 'reports' | 'voice-studio' | 'psychometric' | 'payrun' | 'leave' | 'support' | 'linkedin';

const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('admin_logged_in') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') as AdminView;
      if (tab) return tab;
      const saved = sessionStorage.getItem('admin_active_view') as AdminView;
      if (saved) return saved;
    } catch (e) {}
    return 'applicants';
  });

  const handleSelectView = (view: AdminView) => {
    setActiveView(view);
    try {
      sessionStorage.setItem('admin_active_view', view);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', view);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const [supportMenuExpanded, setSupportMenuExpanded] = useState(false);
  const [supportSubView, setSupportSubView] = useState('loan');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/admin/login', { username, password });
      if (res.data.success) {
        sessionStorage.setItem('admin_logged_in', 'true');
        sessionStorage.setItem('admin_role', res.data.role || 'superadmin');
        setIsLoggedIn(true);
        if (res.data.role === 'subadmin') {
          setActiveView('questions'); // Default allowed tab for subadmin
        }
      } else {
        setLoginError(res.data.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setLoginError('Invalid credentials.');
      } else {
        setLoginError('Login failed. Check server connection.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: '430px', 
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          boxSizing: 'border-box'
        }}>
          {/* Logo / Badge */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.25rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 28px -5px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>EM</span>
            </div>
            <h2 style={{ margin: '0 0 0.35rem 0', color: '#ffffff', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Admin Portal
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
              Emyris Biolifesciences
            </p>
          </div>

          {loginError && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '14px', 
              padding: '12px 14px', 
              color: '#f87171', 
              fontSize: '0.82rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: '1.4' }}>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Username / Email Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Mail 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#64748b',
                  pointerEvents: 'none'
                }} 
              />
              <input
                type="text"
                placeholder="Admin Username or Email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px 0 46px',
                  background: 'rgba(2, 6, 23, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
            </div>

            {/* Password Input with Visibility Toggle */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Lock 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#64748b',
                  pointerEvents: 'none'
                }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 48px 0 46px',
                  background: 'rgba(2, 6, 23, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                height: '52px',
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: '16px',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                opacity: loginLoading ? 0.7 : 1,
                boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.45)',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
            >
              <LogIn size={18} />
              <span>{loginLoading ? 'Logging in...' : 'Login to Admin'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-body)', color: 'var(--text-main)', flexDirection: 'column' }}>
      <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--glass-border)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 style={{ marginLeft: '1rem', color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>Admin Portal</h2>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ 
          width: '260px', 
          minWidth: '260px',
          background: '#0f172a', 
          borderRight: '1px solid var(--glass-border)', 
          padding: '1.75rem 0.85rem', 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          height: '100vh',
          maxHeight: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
        <h2 style={{ marginBottom: '0.25rem', paddingLeft: '0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Admin Portal</h2>
        <p style={{ paddingLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1.75rem' }}>Emyris Biolifesciences</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, width: '100%' }}>
          {[
            { id: 'company', icon: <Building2 size={16} style={{ flexShrink: 0 }} />, label: 'Company Profile' },
            { id: 'applicants', icon: <Users size={16} style={{ flexShrink: 0 }} />, label: 'Applicant Manager' },
            { id: 'confirmations', icon: <CheckSquare size={16} style={{ flexShrink: 0, color: '#38bdf8' }} />, label: 'Confirmation Reviews' },
            { id: 'payrun', icon: <FileSpreadsheet size={16} style={{ flexShrink: 0 }} />, label: 'Payrun & Attendance' },
            { id: 'setup', icon: <FileSignature size={16} style={{ flexShrink: 0 }} />, label: 'Setup & Letters' },
            { id: 'questions', icon: <HelpCircle size={16} style={{ flexShrink: 0 }} />, label: 'Question Bank' },
            { id: 'voice-studio', icon: <Mic size={16} style={{ flexShrink: 0, color: '#a855f7' }} />, label: '🎙️ Voice Studio' },
            { id: 'pending', icon: <ClipboardList size={16} style={{ flexShrink: 0 }} />, label: 'Test Results' },
            { id: 'psychometric', icon: <Award size={16} style={{ flexShrink: 0, color: '#a855f7' }} />, label: '🧠 Psychometric Dossiers' },
            { id: 'reports', icon: <FileSpreadsheet size={16} style={{ flexShrink: 0 }} />, label: 'Reports & Analytics' },
            { id: 'linkedin', icon: <Share2 size={16} style={{ flexShrink: 0, color: '#38bdf8' }} />, label: '💼 Executive LinkedIn Desk' },
          ].map(item => {
            const adminRole = sessionStorage.getItem('admin_role') || 'superadmin';
            const isRestricted = adminRole === 'subadmin' && !['questions', 'voice-studio', 'pending', 'psychometric', 'applicants'].includes(item.id);

            return (
            <button
              key={item.id}
              className={`btn ${activeView === item.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (isRestricted) {
                  alert("Meant for Superadmin Only");
                  return;
                }
                handleSelectView(item.id as AdminView);
                setMobileMenuOpen(false);
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                fontSize: '0.82rem', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '10px 14px',
                width: '100%',
                lineHeight: '1.2',
                opacity: isRestricted ? 0.4 : 1,
                cursor: isRestricted ? 'not-allowed' : 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                {item.icon}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </div>
              {isRestricted && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>🔒</span>}
            </button>
          )})}

          {/* SUPPORT ACCORDION */}
          <div style={{ marginTop: '0.2rem' }}>
            <button
              className={`btn ${activeView === 'support' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSupportMenuExpanded(!supportMenuExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                fontSize: '0.82rem',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HandCoins size={16} style={{ flexShrink: 0 }} />
                Support
              </div>
              {supportMenuExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {supportMenuExpanded && (
              <div style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.4rem' }}>
                {[
                  { id: 'loan', label: 'Loan' },
                  { id: 'adv_salary', label: 'Adv. Salary' }
                ].map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      handleSelectView('support');
                      setSupportSubView(subItem.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      padding: '6px 0',
                      background: 'transparent',
                      border: 'none',
                      color: activeView === 'support' && supportSubView === subItem.id ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.7rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: activeView === 'support' && supportSubView === subItem.id ? 'bold' : 'normal'
                    }}
                  >
                    {subItem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        <button
          className="btn btn-outline"
          onClick={() => {
            sessionStorage.removeItem('admin_logged_in');
            setIsLoggedIn(false);
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            justifyContent: 'flex-start', 
            textAlign: 'left',
            fontSize: '0.82rem',
            padding: '10px 14px',
            width: '100%',
            marginTop: 'auto' 
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} /> <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <div style={{ padding: '2rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h3>Loading Module...</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Please wait while the module is fetched.</p>
            </div>
          </div>
        }>
          {activeView === 'company' && <CompanyProfile />}
          {activeView === 'applicants' && <ApplicantManager />}
          {activeView === 'confirmations' && <ConfirmationManager />}
          {activeView === 'payrun' && <PayrunSystem />}
          {activeView === 'setup' && <SetupAndLetters />}
          {activeView === 'questions' && <QuestionBank />}
          {activeView === 'voice-studio' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <DoctorDetailingStudio isAdmin={true} />
            </div>
          )}
          {activeView === 'pending' && <PendingExams />}
          {activeView === 'psychometric' && <ReportsTab initialTab="psychometric" isStandalone={true} />}
          {activeView === 'reports' && <ReportsTab initialTab="details" isStandalone={false} />}
          {activeView === 'linkedin' && <LinkedInDesk />}

          {activeView === 'support' && <SupportManagement activeSubTab={supportSubView} setSubTab={setSupportSubView} />}
        </Suspense>
      </main>
      </div>
    </div>
  );
};

export default AdminPanel;



