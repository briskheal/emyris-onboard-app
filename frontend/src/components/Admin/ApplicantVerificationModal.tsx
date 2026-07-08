import { useState } from 'react';
import { X, CheckCircle, FileText, Download, Save, Ban, Eye, Upload } from 'lucide-react';
import api from '../../api/client';

interface ApplicantVerificationModalProps {
  applicant: any;
  onClose: () => void;
  onSuccess: () => void;
  onRefresh?: () => void;
}

export default function ApplicantVerificationModal({ applicant, onClose, onSuccess, onRefresh }: ApplicantVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Local state for internal assignment
  const [empCode, setEmpCode] = useState(applicant.empCode || '');
  const [designation, setDesignation] = useState(applicant.designation || '');
  const [division, setDivision] = useState(applicant.division || '');
  const [reportingTo, setReportingTo] = useState(applicant.reportingTo || '');
  const [hq, setHq] = useState(applicant.hq || '');
  const [salary, setSalary] = useState(applicant.salary || '');
  const [actualJoiningDate, setActualJoiningDate] = useState(() => {
    try {
      return applicant.actualJoiningDate && !isNaN(new Date(applicant.actualJoiningDate).getTime()) 
        ? new Date(applicant.actualJoiningDate).toISOString().split('T')[0] 
        : '';
    } catch { return ''; }
  });

  const [tasks, setTasks] = useState({
    offerLetter: applicant.tasks?.offerLetter || false,
    appointmentLetter: applicant.tasks?.appointmentLetter || false,
    appLinkSent: applicant.tasks?.appLinkSent || false,
    loginDetailsSent: applicant.tasks?.loginDetailsSent || false
  });

  const handleUploadMissingDoc = async (e: React.ChangeEvent<HTMLInputElement>, categoryName?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const category = categoryName || prompt("Enter the document category (e.g. Aadhar, Resume):", "Testimonial");
    if (!category) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Data = ev.target?.result as string;
        const res = await api.post('/admin/upload-applicant-doc', {
          email: applicant.email,
          category,
          base64Data,
          fileName: file.name
        });
        if (res.data.success) {
          alert('Document uploaded successfully!');
          if (onRefresh) onRefresh();
          else onSuccess(); // Fallback if onRefresh not provided
        } else {
          alert(res.data.message || 'Upload failed');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error uploading document');
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskKey: string, value: boolean) => {
    setTasks(prev => ({ ...prev, [taskKey]: value }));
    try {
      await api.post('/admin/update-task', {
        email: applicant.email,
        taskKey,
        value
      });
    } catch (err) {
      console.error("Failed to update task", err);
      // Revert if failed
      setTasks(prev => ({ ...prev, [taskKey]: !value }));
    }
  };

  const handleApprove = async () => {
    if (!salary || parseFloat(salary) <= 0) return alert('Please enter Approved Annual CTC');
    if (!division) return alert('Please enter Division');
    if (!reportingTo) return alert('Please enter Reporting To');

    setLoading(true);
    try {
      const annual = parseFloat(salary);
      const monthly = parseFloat((annual / 12).toFixed(2));
      const basic = parseFloat((monthly * 0.40).toFixed(2));
      const hra = parseFloat((basic * 0.40).toFixed(2));
      const edu = 200.00;
      const conveyance = 3000.00;
      const medical = 1250.00;
      const ltaBase = monthly - (basic + hra);
      const lta = parseFloat((ltaBase * 0.07).toFixed(2));
      const fixedAllw = 0.00;
      const used = parseFloat((basic + hra + lta + edu + conveyance + medical + fixedAllw).toFixed(2));
      const special = parseFloat((monthly - used).toFixed(2));

      const salaryBreakup = { basic, hra, lta, conveyance, medical, special, edu, fixed: fixedAllw };

      const updateRes = await api.post('/admin/update-workflow-data', {
        email: applicant.email, division, reportingTo, hq, empCode, actualJoiningDate, salaryBreakup
      });
      if (!updateRes.data.success) throw new Error(updateRes.data.error || 'Failed to update assignment');

      const res = await api.post('/admin/verify-and-activate', {
        email: applicant.email,
        verificationChecks: {}
      });
      
      if (res.data.success || res.data.message === 'Approved') {
        alert('Applicant Approved & Activated!');
        onSuccess();
      } else {
        alert(res.data.message || res.data.error || 'Failed to approve');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error approving applicant: ' + (err.response?.data?.error || err.message));
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

  const Switch = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '6px' }}>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: checked ? 'var(--accent)' : '#ccc',
          transition: '.4s', borderRadius: '34px'
        }}>
          <span style={{
            position: 'absolute', content: '""', height: '14px', width: '14px',
            left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
            transform: checked ? 'translateX(18px)' : 'translateX(0)'
          }} />
        </span>
      </label>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div className="dash-card" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={24} /> Applicant Verification View
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Left Column: Dossier, Pipeline, & Documents */}
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
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Pipeline Tracking</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Switch label="📨 Offer Letter Sent" checked={tasks.offerLetter} onChange={(v) => handleTaskToggle('offerLetter', v)} />
                <Switch label="📝 Appointment Letter Sent" checked={tasks.appointmentLetter} onChange={(v) => handleTaskToggle('appointmentLetter', v)} />
                <Switch label="📱 App Link Sent to Applicant" checked={tasks.appLinkSent} onChange={(v) => handleTaskToggle('appLinkSent', v)} />
                <Switch label="🔑 Login Details Sent" checked={tasks.loginDetailsSent} onChange={(v) => handleTaskToggle('loginDetailsSent', v)} />
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Uploaded Documents (Testimonials)</h3>
              {(!applicant.documents || applicant.documents.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No documents uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(applicant.documents || []).map((doc: any, i: number) => {
                    const docCat = doc.docType || doc.category || 'Document';
                    const assetId = doc.assetId || doc.filename || doc.fileName || doc.name || '';
                    const downloadUrl = assetId.startsWith('/') ? assetId : `/api/admin/uploads/${assetId}`;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', flex: 1 }}>
                          <FileText size={16} /> {docCat}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <Eye size={14} /> View
                          </a>
                          <a href={`${downloadUrl}?download=true`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <Download size={14} /> Download
                          </a>
                          <label className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                            <Upload size={14} /> Override
                            <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadMissingDoc(e, docCat)} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <label className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <Upload size={14} /> Upload Missing Document Category
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadMissingDoc(e)} />
                </label>
              </div>
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
                <div><label className="form-label">Actual Date of Joining</label><input type="date" className="form-input" value={actualJoiningDate} onChange={e => setActualJoiningDate(e.target.value)} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto' }}>
              <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleReject} disabled={loading}>
                <Ban size={16} /> Reject
              </button>
              <button className="btn btn-primary" onClick={handleApprove} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> Approve & Generate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
