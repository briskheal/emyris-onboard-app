import React, { useState } from 'react';
import ApplicantManager from '../components/Admin/ApplicantManager';
import ExamManager from '../components/Admin/ExamManager';
import ManualGrading from '../components/Admin/ManualGrading';
import PendingExams from '../components/Admin/PendingExams';
import Settings from '../components/Admin/Settings';
import { Users, FileText, Settings as SettingsIcon, LogOut, ClipboardList, BookOpen } from 'lucide-react';
import api from '../api/client';

type AdminView = 'applicants' | 'exams' | 'grading' | 'pending' | 'settings';

const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        setIsLoggedIn(true);
      } else {
        setLoginError(res.data.message || 'Invalid credentials.');
      }
    } catch {
      setLoginError('Login failed. Check server connection.');
    } finally {
      setLoginLoading(false);
    }
  };

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--glass-border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <h2 style={{ marginBottom: '0.25rem', paddingLeft: '0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Admin Portal</h2>
        <p style={{ paddingLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2rem' }}>Emyris Biolifesciences</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {[
            { id: 'applicants', icon: <Users size={16} />, label: 'Applicant Manager' },
            { id: 'pending', icon: <ClipboardList size={16} />, label: 'Pending Exams' },
            { id: 'grading', icon: <BookOpen size={16} />, label: 'Manual Grading' },
            { id: 'exams', icon: <FileText size={16} />, label: 'Exam Center' },
            { id: 'settings', icon: <SettingsIcon size={16} />, label: 'Settings' },
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
          onClick={() => setIsLoggedIn(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', marginTop: 'auto' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeView === 'applicants' && <ApplicantManager />}
        {activeView === 'pending' && <PendingExams />}
        {activeView === 'grading' && <ManualGrading />}
        {activeView === 'exams' && <ExamManager />}
        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
};

export default AdminPanel;
