import React, { useState, Suspense, lazy } from 'react';
import { Building2, Users, FileSignature, HelpCircle, ClipboardList, LogOut, FileSpreadsheet, Mic, Award, Menu, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import api from '../api/client';

const CompanyProfile = lazy(() => import('../components/Admin/CompanyProfile'));
const ApplicantManager = lazy(() => import('../components/Admin/ApplicantManager'));
const SetupAndLetters = lazy(() => import('../components/Admin/SetupAndLetters'));
const QuestionBank = lazy(() => import('../components/Admin/QuestionBank'));
const PendingExams = lazy(() => import('../components/Admin/PendingExams'));
const ReportsTab = lazy(() => import('../components/Admin/ReportsTab'));
const DoctorDetailingStudio = lazy(() => import('../components/Dashboard/DoctorDetailingStudio'));
const PayrunSystem = lazy(() => import('../components/Admin/PayrunSystem'));
const LeaveManagement = lazy(() => import('../components/Admin/LeaveManagement'));

type AdminView = 'company' | 'applicants' | 'setup' | 'questions' | 'pending' | 'reports' | 'voice-studio' | 'psychometric' | 'payrun' | 'leave';

const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('admin_logged_in') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>('applicants');
  const [leaveMenuExpanded, setLeaveMenuExpanded] = useState(false);
  const [leaveSubView, setLeaveSubView] = useState('create_type');

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)' }}>
        <div className="dash-card" style={{ width: '400px', padding: '2.5rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>Admin Portal</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Emyris Biolifesciences</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              className="form-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <input
              className="form-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{loginError}</p>}
            <button className="btn btn-primary" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Logging in...' : 'Login'}
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
            { id: 'payrun', icon: <FileSpreadsheet size={16} style={{ flexShrink: 0 }} />, label: 'Payrun & Attendance' },
            { id: 'setup', icon: <FileSignature size={16} style={{ flexShrink: 0 }} />, label: 'Setup & Letters' },
            { id: 'questions', icon: <HelpCircle size={16} style={{ flexShrink: 0 }} />, label: 'Question Bank' },
            { id: 'voice-studio', icon: <Mic size={16} style={{ flexShrink: 0, color: '#a855f7' }} />, label: '🎙️ Voice Studio' },
            { id: 'pending', icon: <ClipboardList size={16} style={{ flexShrink: 0 }} />, label: 'Test Results' },
            { id: 'psychometric', icon: <Award size={16} style={{ flexShrink: 0, color: '#a855f7' }} />, label: '🧠 Psychometric Dossiers' },
            { id: 'reports', icon: <FileSpreadsheet size={16} style={{ flexShrink: 0 }} />, label: 'Reports & Analytics' },
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
                setActiveView(item.id as AdminView);
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

          {/* LEAVE MANAGEMENT ACCORDION */}
          <div style={{ marginTop: '0.2rem' }}>
            <button
              className={`btn ${activeView === 'leave' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setLeaveMenuExpanded(!leaveMenuExpanded)}
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
                <Calendar size={16} style={{ flexShrink: 0 }} />
                Manage Leave
              </div>
              {leaveMenuExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {leaveMenuExpanded && (
              <div style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.4rem' }}>
                {[
                  { id: 'create_type', label: 'Create Leave Type' },
                  { id: 'assign_leave', label: 'Assign Leave' },
                  { id: 'assigned_leaves', label: 'Assigned Leaves' }
                ].map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      setActiveView('leave');
                      setLeaveSubView(subItem.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      padding: '6px 0',
                      background: 'transparent',
                      border: 'none',
                      color: activeView === 'leave' && leaveSubView === subItem.id ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.7rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: activeView === 'leave' && leaveSubView === subItem.id ? 'bold' : 'normal'
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
          {activeView === 'leave' && <LeaveManagement activeSubTab={leaveSubView} setSubTab={setLeaveSubView} />}
        </Suspense>
      </main>
      </div>
    </div>
  );
};

export default AdminPanel;
