import React, { useState } from 'react';
import ApplicantManager from '../components/Admin/ApplicantManager';
import ExamManager from '../components/Admin/ExamManager';
import Settings from '../components/Admin/Settings';
import { Users, FileText, Settings as SettingsIcon, LogOut } from 'lucide-react';

type AdminView = 'dashboard' | 'applicants' | 'exams' | 'settings';

const AdminPanel: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('applicants');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--glass-border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', paddingLeft: '1rem', color: 'var(--primary)' }}>Admin Portal</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button 
            className={`btn ${activeView === 'applicants' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setActiveView('applicants')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}
          >
            <Users size={18} /> Applicant Manager
          </button>
          <button 
            className={`btn ${activeView === 'exams' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setActiveView('exams')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}
          >
            <FileText size={18} /> Exam Center
          </button>
          <button 
            className={`btn ${activeView === 'settings' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setActiveView('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}
          >
            <SettingsIcon size={18} /> Settings
          </button>
        </nav>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', marginTop: 'auto' }}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeView === 'applicants' && <ApplicantManager />}
        {activeView === 'exams' && <ExamManager />}
        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
};

export default AdminPanel;
