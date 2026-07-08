import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import PDFGenerator from './PDFGenerator';
import ExistingStaffModal from './ExistingStaffModal';
import ApplicantVerificationModal from './ApplicantVerificationModal';

const ApplicantManager: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfTask, setPdfTask] = useState<{app: any, type: 'offer' | 'appointment'} | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [verificationApp, setVerificationApp] = useState<any | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/applicants?month=${filterMonth}&year=${filterYear}`);
      if (res.data.success) {
        setApplicants(res.data.applicants);
        setVerificationApp((prev: any) => {
          if (!prev) return prev;
          const updated = res.data.applicants.find((a: any) => a.email === prev.email);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error("Failed to load applicants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [filterMonth, filterYear]);



  const handleDelete = async (email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete applicant ${email}?`)) return;
    try {
      const res = await api.delete(`/admin/applicant/${email}`);
      if (res.data.success) {
        setApplicants(applicants.filter(app => app.email !== email));
        alert('Applicant deleted successfully');
      } else {
        alert(res.data.error || 'Failed to delete applicant');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Error deleting applicant');
    }
  };

  if (pdfTask) {
    return (
      <PDFGenerator 
        applicant={pdfTask.app} 
        type={pdfTask.type} 
        onCancel={() => setPdfTask(null)}
        onComplete={() => setPdfTask(null)}
      />
    );
  }

  return (
    <div className="dash-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Applicant Management</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select className="form-input-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Months</option>
            {Array.from({length: 12}).map((_, i) => (
              <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select className="form-input-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Years</option>
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <input type="text" placeholder="Search..." className="form-input-sm" style={{ width: '200px' }} />
          <button className="btn btn-sm btn-primary" onClick={() => setShowStaffModal(true)}>Add Existing Staff</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading applicants...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 15px' }}>Name</th>
                <th style={{ padding: '12px 15px' }}>Status</th>
                <th style={{ padding: '12px 15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '15px' }}>
                    <div>{app.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.email}</div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span className={`badge ${app.status || 'pending'}`}>{app.status || 'Draft'}</span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setVerificationApp(app)}>Review / View</button>
                      <button className="btn btn-sm btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDelete(app.email)}>Delete</button>
                      {app.status === 'approved' && !app.offerLetterData && (
                        <button className="btn btn-sm btn-primary" onClick={() => setPdfTask({app, type: 'offer'})}>Offer Letter</button>
                      )}
                      {app.status === 'joined' && !app.apptLetterData && (
                        <button className="btn btn-sm btn-primary" style={{background: '#10b981', color: 'white'}} onClick={() => setPdfTask({app, type: 'appointment'})}>Appt Letter</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {applicants.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No applicants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showStaffModal && (
        <ExistingStaffModal 
          onClose={() => setShowStaffModal(false)} 
          onSuccess={() => { setShowStaffModal(false); fetchApplicants(); }} 
        />
      )}

      {verificationApp && (
        <ApplicantVerificationModal 
          applicant={verificationApp} 
          onClose={() => setVerificationApp(null)} 
          onSuccess={() => { setVerificationApp(null); fetchApplicants(); }} 
          onRefresh={() => fetchApplicants()}
        />
      )}
    </div>
  );
};

export default ApplicantManager;
