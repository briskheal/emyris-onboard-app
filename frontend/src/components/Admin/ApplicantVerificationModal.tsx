import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, Download, Save, Eye, Upload } from 'lucide-react';
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

  const [salBasic, setSalBasic] = useState<string>(applicant.salaryBreakup?.basic?.toString() || '0');
  const [salHra, setSalHra] = useState<string>(applicant.salaryBreakup?.hra?.toString() || '0');
  const [salLta, setSalLta] = useState<string>(applicant.salaryBreakup?.lta?.toString() || '0');
  const [salConv, setSalConv] = useState<string>(applicant.salaryBreakup?.conveyance?.toString() || '0');
  const [salMed, setSalMed] = useState<string>(applicant.salaryBreakup?.medical?.toString() || '0');
  const [salEdu, setSalEdu] = useState<string>(applicant.salaryBreakup?.edu?.toString() || '0');
  const [salSpecial, setSalSpecial] = useState<string>(applicant.salaryBreakup?.special?.toString() || '0');
  const [salFixed, setSalFixed] = useState<string>(applicant.salaryBreakup?.fixed?.toString() || '0');

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
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post('/applicant/upload-document', {
        email: applicant.email,
        category,
        fileData: base64Data,
        fileName: file.name,
        isProxy: true
      });
      if (res.data.success) {
        alert('Document uploaded successfully!');
        if (onRefresh) onRefresh();
        else onSuccess(); // Fallback if onRefresh not provided
      } else {
        alert(res.data.message || 'Failed to upload document');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error uploading document: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (assetId: string, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to completely delete this file for ${categoryName}?`)) return;
    setLoading(true);
    try {
      const res = await api.post('/admin/delete-document', { email: applicant.email, assetId });
      if (res.data.success) {
        alert(`${categoryName} deleted successfully!`);
        if (onRefresh) onRefresh();
        else onSuccess();
      } else {
        alert(res.data.error || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting document');
    } finally {
      setLoading(false);
    }
  };

  const autoDistributeSalary = useCallback(() => {
    if (!salary || parseFloat(salary) <= 0) return alert('Please enter an Approved Annual CTC first.');
    const annual = parseFloat(salary);
    const monthly = parseFloat((annual / 12).toFixed(2));
    const basic = parseFloat((monthly * 0.60).toFixed(2));
    const hra = parseFloat((basic * 0.40).toFixed(2));
    const edu = 200.00;
    const conveyance = 1250.00;
    const medical = 1250.00;
    const lta = parseFloat((basic * 0.04).toFixed(2));
    const fixedAllw = 0.00;
    const used = parseFloat((basic + hra + lta + edu + conveyance + medical + fixedAllw).toFixed(2));
    const special = parseFloat((monthly - used).toFixed(2));

    setSalBasic(basic.toFixed(2));
    setSalHra(hra.toFixed(2));
    setSalLta(lta.toFixed(2));
    setSalConv(conveyance.toFixed(2));
    setSalMed(medical.toFixed(2));
    setSalEdu(edu.toFixed(2));
    setSalSpecial(special.toFixed(2));
    setSalFixed(fixedAllw.toFixed(2));
  }, [salary]);

  useEffect(() => {
    if (salary && !salBasic) {
      autoDistributeSalary();
    }
  }, [salary, salBasic, autoDistributeSalary]);

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const salaryBreakup = { 
        basic: parseFloat(salBasic) || 0, 
        hra: parseFloat(salHra) || 0, 
        lta: parseFloat(salLta) || 0, 
        conveyance: parseFloat(salConv) || 0, 
        medical: parseFloat(salMed) || 0, 
        special: parseFloat(salSpecial) || 0, 
        edu: parseFloat(salEdu) || 0, 
        fixed: parseFloat(salFixed) || 0 
      };

      const updateRes = await api.post('/admin/update-workflow-data', {
        email: applicant.email, division, reportingTo, hq, empCode, actualJoiningDate, salaryBreakup
      });
      if (updateRes.data.success) {
        alert('Workouts saved successfully!');
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to save data');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!salary || parseFloat(salary) <= 0) return alert('Please enter Approved Annual CTC');
    if (!division) return alert('Please enter Division');
    if (!reportingTo) return alert('Please enter Reporting To');

    setLoading(true);
    try {
      const salaryBreakup = { 
        basic: parseFloat(salBasic) || 0, 
        hra: parseFloat(salHra) || 0, 
        lta: parseFloat(salLta) || 0, 
        conveyance: parseFloat(salConv) || 0, 
        medical: parseFloat(salMed) || 0, 
        special: parseFloat(salSpecial) || 0, 
        edu: parseFloat(salEdu) || 0, 
        fixed: parseFloat(salFixed) || 0 
      };

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

  const totalMonthly = (
    (parseFloat(salBasic) || 0) +
    (parseFloat(salHra) || 0) +
    (parseFloat(salLta) || 0) +
    (parseFloat(salConv) || 0) +
    (parseFloat(salMed) || 0) +
    (parseFloat(salSpecial) || 0) +
    (parseFloat(salEdu) || 0) +
    (parseFloat(salFixed) || 0)
  ).toFixed(2);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div className="dash-card" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem', background: '#1e293b' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>Uploaded Documents (Testimonials)</h3>
                <label className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <Upload size={14} /> Upload Additional
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadMissingDoc(e)} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {["Aadhaar Card", "PAN Card", "Degree/Provisional Certificate", "Relieving Letter", "Passport Size Photo", "Testimonial"].map(dName => {
                  const categoryFiles = (applicant.documents || []).filter((u: any) => (u.docType || u.category || 'Document') === dName);
                  
                  if (categoryFiles.length === 0) {
                    return (
                      <div key={dName} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{dName}</div>
                          <div style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Missing</div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not uploaded</div>
                        <label className="btn btn-sm" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                          Upload Now
                          <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadMissingDoc(e, dName)} />
                        </label>
                      </div>
                    );
                  }

                  return categoryFiles.map((doc: any, i: number) => {
                    const assetId = doc.assetId || doc.filename || doc.fileName || doc.name || '';
                    const downloadUrl = assetId.startsWith('/') ? assetId : `/api/admin/uploads/${assetId}`;
                    
                    return (
                      <div key={`${dName}-${i}`} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{dName}</div>
                          <div style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Uploaded</div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name || assetId}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                          <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '4px', textAlign: 'center' }} title="View">
                            <Eye size={14} style={{ margin: 'auto' }} />
                          </a>
                          <a href={`${downloadUrl}?download=true`} download className="btn btn-sm" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '4px', textAlign: 'center' }} title="Download">
                            <Download size={14} style={{ margin: 'auto' }} />
                          </a>
                          <label className="btn btn-sm" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '4px', cursor: 'pointer', margin: 0, textAlign: 'center' }} title="Override">
                            <Upload size={14} style={{ margin: 'auto' }} />
                            <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadMissingDoc(e, dName)} />
                          </label>
                          <button type="button" className="btn btn-sm" onClick={() => handleDeleteDocument(assetId, dName)} style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px', border: 'none' }} title="Delete">
                            <X size={14} style={{ margin: 'auto' }} />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Assignment & Salary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Internal Assignment</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '12px', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Assigned Employee Code</label>
                <input type="text" className="form-input" value={empCode} onChange={e => setEmpCode(e.target.value)} />

                <label className="form-label" style={{ margin: 0 }}>Proposed Designation</label>
                <input type="text" className="form-input" value={designation} onChange={e => setDesignation(e.target.value)} />

                <label className="form-label" style={{ margin: 0 }}>Division</label>
                <input type="text" className="form-input" value={division} onChange={e => setDivision(e.target.value)} />

                <label className="form-label" style={{ margin: 0 }}>Reporting To</label>
                <input type="text" className="form-input" value={reportingTo} onChange={e => setReportingTo(e.target.value)} />

                <label className="form-label" style={{ margin: 0 }}>Joining HQ</label>
                <input type="text" className="form-input" value={hq} onChange={e => setHq(e.target.value)} />

                <label className="form-label" style={{ margin: 0 }}>Approved Annual CTC</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" className="form-input" style={{ flex: 1 }} value={salary} onChange={e => setSalary(e.target.value)} />
                  <button type="button" className="btn btn-outline" onClick={autoDistributeSalary} style={{ height: '42px', padding: '0 15px', whiteSpace: 'nowrap' }}>Calculate Breakup</button>
                </div>

                <label className="form-label" style={{ margin: 0 }}>Actual Date of Joining</label>
                <input type="date" className="form-input" value={actualJoiningDate} onChange={e => setActualJoiningDate(e.target.value)} />
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Salary Breakup (Monthly)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label className="form-label">Basic Salary</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salBasic} onChange={e => setSalBasic(e.target.value)} /></div>
                <div><label className="form-label">HRA</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salHra} onChange={e => setSalHra(e.target.value)} /></div>
                <div><label className="form-label">LTA</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salLta} onChange={e => setSalLta(e.target.value)} /></div>
                <div><label className="form-label">Conveyance</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salConv} onChange={e => setSalConv(e.target.value)} /></div>
                <div><label className="form-label">Medical Allw.</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salMed} onChange={e => setSalMed(e.target.value)} /></div>
                <div><label className="form-label">Special Allw.</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salSpecial} onChange={e => setSalSpecial(e.target.value)} /></div>
                <div><label className="form-label">Education</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salEdu} onChange={e => setSalEdu(e.target.value)} /></div>
                <div><label className="form-label">Fixed</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salFixed} onChange={e => setSalFixed(e.target.value)} /></div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total Monthly Calculated:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>₹{totalMonthly}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleReject} disabled={loading}>
                Reject Application
              </button>
              <button type="button" className="btn btn-outline" onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> Save Workouts
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Approve & Generate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
