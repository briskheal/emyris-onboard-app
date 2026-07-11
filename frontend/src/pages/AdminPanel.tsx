import React, { useState } from 'react';
import CompanyProfile from '../components/Admin/CompanyProfile';
import ApplicantManager from '../components/Admin/ApplicantManager';
import SetupAndLetters from '../components/Admin/SetupAndLetters';
import QuestionBank from '../components/Admin/QuestionBank';
import PendingExams from '../components/Admin/PendingExams';
import { Building2, Users, FileSignature, HelpCircle, ClipboardList, LogOut } from 'lucide-react';
import api from '../api/client';

type AdminView = 'company' | 'applicants' | 'setup' | 'questions' | 'pending';

const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('admin_logged_in') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>('applicants');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/admin/login', { username, password });
      if (res.data.success) {
        sessionStorage.setItem('admin_logged_in', 'true');
        setIsLoggedIn(true);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', flexDirection: 'column' }}>
      {/* Mobile Hamburger Header */}
      <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--glass-border)', zIndex: 10 }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span style={{ fontSize: '1.2rem' }}>☰</span>
        </button>
        <h2 style={{ marginLeft: '1rem', color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>Admin Portal</h2>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ 
          width: '240px', 
          background: '#0f172a', 
          borderRight: '1px solid var(--glass-border)', 
          padding: '2rem 1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          height: '100%',
          position: 'sticky',
          top: 0,
          overflowY: 'auto'
        }}>
        <h2 style={{ marginBottom: '0.25rem', paddingLeft: '0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Admin Portal</h2>
        <p style={{ paddingLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2rem' }}>Emyris Biolifesciences</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {[
            { id: 'company', icon: <Building2 size={16} />, label: 'Company Profile' },
            { id: 'applicants', icon: <Users size={16} />, label: 'Applicant Manager' },
            { id: 'setup', icon: <FileSignature size={16} />, label: 'Setup & Letters' },
            { id: 'questions', icon: <HelpCircle size={16} />, label: 'Question Bank' },
            { id: 'pending', icon: <ClipboardList size={16} />, label: 'Test Results' },
          ].map(item => (
            <button
              key={item.id}
              className={`btn ${activeView === item.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveView(item.id as AdminView)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', fontSize: '0.88rem' }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button
          className="btn btn-outline"
          onClick={() => {
            sessionStorage.removeItem('admin_logged_in');
            setIsLoggedIn(false);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', marginTop: 'auto' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeView === 'company' && <CompanyProfile />}
        {activeView === 'applicants' && <ApplicantManager />}
        {activeView === 'setup' && <SetupAndLetters />}
        {activeView === 'questions' && <QuestionBank />}
        {activeView === 'pending' && <PendingExams />}
      </main>
      </div>
    </div>
  );
};

export default AdminPanel;
