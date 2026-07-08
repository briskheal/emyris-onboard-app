import { useState } from 'react';
import { X, CheckCircle, FileText, Download, Save, Ban } from 'lucide-react';
import api from '../../api/client';

interface ApplicantVerificationModalProps {
  applicant: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplicantVerificationModal({ applicant, onClose, onSuccess }: ApplicantVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Local state for internal assignment
  const [empCode, setEmpCode] = useState(applicant.empCode || '');
  const [designation, setDesignation] = useState(applicant.designation || '');
  const [division, setDivision] = useState(applicant.division || '');
  const [reportingTo, setReportingTo] = useState(applicant.reportingTo || '');
  const [hq, setHq] = useState(applicant.hq || '');
  const [salary, setSalary] = useState(applicant.salary || '');

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/admin/applicant/${applicant.email}/approve`, {
        empCode, designation, division, reportingTo, hq, salary
      });
      if (res.data.success) {
        alert('Applicant Approved!');
        onSuccess();
      } else {
        alert(res.data.message || 'Failed to approve');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving applicant');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    setLoading(true);
    try {
      const res = await api.post(`/admin/applicant/${applicant.email}/reject`, { reason });
      if (res.data.success) {
        alert('Applicant Rejected!');
        onSuccess();
      } else {
        alert(res.data.message || 'Failed to reject');
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting applicant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div className="dash-card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={24} /> Applicant Verification
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Left Column: Dossier & Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Dossier</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
                <div><strong>Name:</strong> {applicant.fullName}</div>
                <div><strong>Email:</strong> {applicant.email}</div>
                <div><strong>Phone:</strong> {applicant.phone}</div>
                <div><strong>Status:</strong> <span className={`badge ${applicant.status}`}>{applicant.status}</span></div>
                <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {applicant.address}, {applicant.state} - {applicant.pin}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Uploaded Documents (Testimonials)</h3>
              {(!applicant.documents || applicant.documents.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No documents uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {applicant.documents.map((doc: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <FileText size={16} /> {doc.docType || 'Document'}
                      </div>
                      <a href={`/api/admin/uploads/${doc.filename}?download=true`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Assignment & Salary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Internal Assignment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><label className="form-label">Assigned Employee Code</label><input type="text" className="form-input" value={empCode} onChange={e => setEmpCode(e.target.value)} /></div>
                <div><label className="form-label">Proposed Designation</label><input type="text" className="form-input" value={designation} onChange={e => setDesignation(e.target.value)} /></div>
                <div><label className="form-label">Division</label><input type="text" className="form-input" value={division} onChange={e => setDivision(e.target.value)} /></div>
                <div><label className="form-label">Reporting To</label><input type="text" className="form-input" value={reportingTo} onChange={e => setReportingTo(e.target.value)} /></div>
                <div><label className="form-label">Joining HQ</label><input type="text" className="form-input" value={hq} onChange={e => setHq(e.target.value)} /></div>
                <div><label className="form-label">Approved Annual CTC</label><input type="number" className="form-input" value={salary} onChange={e => setSalary(e.target.value)} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto' }}>
              <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleReject} disabled={loading}>
                <Ban size={16} /> Reject
              </button>
              <button className="btn btn-primary" onClick={handleApprove} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> Approve & Activate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
