import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import PDFGenerator from './PDFGenerator';

const ApplicantManager: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfTask, setPdfTask] = useState<{app: any, type: 'offer' | 'appointment'} | null>(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await api.get('/admin/applicants');
        if (res.data.success) {
          setApplicants(res.data.applicants);
        }
      } catch (err) {
        console.error("Failed to load applicants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Applicant Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search..." className="form-input-sm" style={{ width: '250px' }} />
          <button className="btn btn-sm btn-primary">Add Applicant</button>
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
                      <button className="btn btn-sm btn-outline">View</button>
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
    </div>
  );
};

export default ApplicantManager;
