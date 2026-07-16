import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, CheckCircle, Download, Save, Eye, Upload } from 'lucide-react';
import api from '../../api/client';

interface ApplicantVerificationModalProps {
  applicant: any;
  onClose: () => void;
  onSuccess: () => void;
  onRefresh?: () => void;
}

export default function ApplicantVerificationModal({ applicant: initialApplicant, onClose, onSuccess, onRefresh }: ApplicantVerificationModalProps) {
  const [applicant, setApplicant] = useState<any>(initialApplicant);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Local state for internal assignment
  const [empCode, setEmpCode] = useState(initialApplicant.empCode || '');
  const [designation, setDesignation] = useState(initialApplicant.designation || '');
  const [division, setDivision] = useState(initialApplicant.division || '');
  const [reportingTo, setReportingTo] = useState(initialApplicant.reportingTo || '');
  const [hq, setHq] = useState(initialApplicant.hq || '');
  const [salary, setSalary] = useState(initialApplicant.salary || '');
  const [actualJoiningDate, setActualJoiningDate] = useState(() => {
    try {
      return initialApplicant.actualJoiningDate && !isNaN(new Date(initialApplicant.actualJoiningDate).getTime()) 
        ? new Date(initialApplicant.actualJoiningDate).toISOString().split('T')[0] 
        : '';
    } catch { return ''; }
  });

  const [salBasic, setSalBasic] = useState<string>(initialApplicant.salaryBreakup?.basic?.toString() || '0');
  const [salHra, setSalHra] = useState<string>(initialApplicant.salaryBreakup?.hra?.toString() || '0');
  const [salLta, setSalLta] = useState<string>(initialApplicant.salaryBreakup?.lta?.toString() || '0');
  const [salConv, setSalConv] = useState<string>(initialApplicant.salaryBreakup?.conveyance?.toString() || '0');
  const [salMed, setSalMed] = useState<string>(initialApplicant.salaryBreakup?.medical?.toString() || '0');
  const [salEdu, setSalEdu] = useState<string>(initialApplicant.salaryBreakup?.edu?.toString() || '0');
  const [salSpecial, setSalSpecial] = useState<string>(initialApplicant.salaryBreakup?.special?.toString() || '0');
  const [salFixed, setSalFixed] = useState<string>(initialApplicant.salaryBreakup?.fixed?.toString() || '0');
  const [salRoundoff, setSalRoundoff] = useState<string>(initialApplicant.salaryBreakup?.roundoff?.toString() || '0');

  const [epfNumber, setEpfNumber] = useState<string>(initialApplicant.epfNumber || '');
  const [uanNumber, setUanNumber] = useState<string>(initialApplicant.uanNumber || '');
  const [esiNumber, setEsiNumber] = useState<string>(initialApplicant.esiNumber || '');
  const [bankName, setBankName] = useState<string>(initialApplicant.formData?.bankName || '');
  const [accNo, setAccNo] = useState<string>(initialApplicant.formData?.accNo || '');
  const [ifsc, setIfsc] = useState<string>(initialApplicant.formData?.ifsc || '');

  const [tasks, setTasks] = useState({
    offerLetter: initialApplicant.tasks?.offerLetter || false,
    appointmentLetter: initialApplicant.tasks?.appointmentLetter || false,
    appLinkSent: initialApplicant.tasks?.appLinkSent || false,
    loginDetailsSent: initialApplicant.tasks?.loginDetailsSent || false
  });

  const [designationsList, setDesignationsList] = useState<any[]>([]);
  const [divisionsList, setDivisionsList] = useState<any[]>([]);
  const [hqsList, setHqsList] = useState<any[]>([]);
  const [managersList, setManagersList] = useState<any[]>([]);
  const [requiredDocsList, setRequiredDocsList] = useState<string[]>([]);
  
  // Track verified documents
  const [verificationChecks, setVerificationChecks] = useState<Record<string, boolean>>(initialApplicant.verificationChecks || {});

  useEffect(() => {
    setLoadingDetails(true);
    api.get(`/admin/applicant/${initialApplicant.email}`).then(res => {
      const fullApp = (res.data && res.data.applicant) ? res.data.applicant : initialApplicant;
      setApplicant(fullApp);
      
      setSalBasic(fullApp.salaryBreakup?.basic?.toString() || '0');
      setSalHra(fullApp.salaryBreakup?.hra?.toString() || '0');
      setSalLta(fullApp.salaryBreakup?.lta?.toString() || '0');
      setSalConv(fullApp.salaryBreakup?.conveyance?.toString() || '0');
      setSalMed(fullApp.salaryBreakup?.medical?.toString() || '0');
      setSalSpecial(fullApp.salaryBreakup?.special?.toString() || '0');
      setSalEdu(fullApp.salaryBreakup?.edu?.toString() || '0');
      setSalFixed(fullApp.salaryBreakup?.fixed?.toString() || '0');
      setSalRoundoff(fullApp.salaryBreakup?.roundoff?.toString() || '0');
      
      setEmpCode(fullApp.empCode || '');
      setDesignation(fullApp.designation || '');
      setDivision(fullApp.division || '');
      setReportingTo(fullApp.reportingTo || '');
      setHq(fullApp.hq || '');
      setSalary(fullApp.salary || '');
      
      setEpfNumber(fullApp.epfNumber || '');
      setUanNumber(fullApp.uanNumber || '');
      setEsiNumber(fullApp.esiNumber || '');
      setBankName(fullApp.formData?.bankName || '');
      setAccNo(fullApp.formData?.accNo || '');
      setIfsc(fullApp.formData?.ifsc || '');
      setVerificationChecks(fullApp.verificationChecks || {});

      try {
        setActualJoiningDate(fullApp.actualJoiningDate && !isNaN(new Date(fullApp.actualJoiningDate).getTime()) 
          ? new Date(fullApp.actualJoiningDate).toISOString().split('T')[0] 
          : '');
      } catch { setActualJoiningDate(''); }

      setTasks({
        offerLetter: fullApp.tasks?.offerLetter || false,
        appointmentLetter: fullApp.tasks?.appointmentLetter || false,
        appLinkSent: fullApp.tasks?.appLinkSent || false,
        loginDetailsSent: fullApp.tasks?.loginDetailsSent || false
      });
      setLoadingDetails(false);
    }).catch(err => {
      console.error("Failed to load full applicant details:", err);
      setApplicant(initialApplicant);
      setLoadingDetails(false);
    });

    api.get('/admin/company-profile').then(res => {
      if (res.data) {
        const comp = res.data.company || res.data;
        setDesignationsList(comp.designations || []);
        setDivisionsList(comp.divisions || []);
        setHqsList(comp.hqs || []);
        setRequiredDocsList(comp.requiredDocs || []);
      }
    }).catch(console.error);

    api.get('/admin/applicants?month=all&year=all').then(res => {
      if (res.data.success) {
         const joined = res.data.applicants.filter((a: any) => a.status === 'joined' || a.status === 'approved' || a.isExistingStaff);
         setManagersList(joined);
      }
    }).catch(console.error);
  }, [initialApplicant]);

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

  const toggleVerify = (docName: string) => {
    setVerificationChecks(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }));
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
    const exactMonthly = Math.round(monthly);
    const roundoff = parseFloat((exactMonthly - monthly).toFixed(2));

    setSalBasic(basic.toFixed(2));
    setSalHra(hra.toFixed(2));
    setSalLta(lta.toFixed(2));
    setSalConv(conveyance.toFixed(2));
    setSalMed(medical.toFixed(2));
    setSalEdu(edu.toFixed(2));
    setSalSpecial(special.toFixed(2));
    setSalFixed(fixedAllw.toFixed(2));
    setSalRoundoff(roundoff.toFixed(2));
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
        fixed: parseFloat(salFixed) || 0,
        roundoff: parseFloat(salRoundoff) || 0
      };

      const updateRes = await api.post('/admin/update-workflow-data', {
        email: applicant.email, division, reportingTo, hq, empCode, actualJoiningDate, salaryBreakup, detailDesignation: designation,
        epfNumber, uanNumber, esiNumber, bankName, accNo, ifsc, salary, verificationChecks
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
        fixed: parseFloat(salFixed) || 0,
        roundoff: parseFloat(salRoundoff) || 0
      };

      const updateRes = await api.post('/admin/update-workflow-data', {
        email: applicant.email, division, reportingTo, hq, empCode, actualJoiningDate, salaryBreakup, detailDesignation: designation,
        epfNumber, uanNumber, esiNumber, bankName, accNo, ifsc, salary
      });
      if (!updateRes.data.success) throw new Error(updateRes.data.error || 'Failed to update assignment');

      const res = await api.post('/admin/verify-and-activate', {
        email: applicant.email,
        verificationChecks: verificationChecks
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

  const totalMonthly = useMemo(() => {
    return (
      (parseFloat(salBasic) || 0) +
      (parseFloat(salHra) || 0) +
      (parseFloat(salLta) || 0) +
      (parseFloat(salConv) || 0) +
      (parseFloat(salMed) || 0) +
      (parseFloat(salSpecial) || 0) +
      (parseFloat(salEdu) || 0) +
      (parseFloat(salFixed) || 0) +
      (parseFloat(salRoundoff) || 0)
    ).toFixed(2);
  }, [salBasic, salHra, salLta, salConv, salMed, salSpecial, salEdu, salFixed, salRoundoff]);

  if (loadingDetails) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '2rem' }}>
        <div className="dash-card" style={{ width: '460px', padding: '2.5rem', textAlign: 'center', border: '1px solid var(--primary)', background: '#1e293b', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem auto', width: '48px', height: '48px', borderWidth: '4px', borderTopColor: 'var(--primary)' }}></div>
          <h3 style={{ color: '#fff', marginBottom: '0.6rem', fontSize: '1.35rem', fontWeight: 700 }}>Loading Applicant Folder</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.8rem', lineHeight: '1.5' }}>
            Uploading details & documents for <strong style={{ color: 'var(--primary)' }}>{initialApplicant.fullName || initialApplicant.email}</strong>... please wait.
          </p>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: '8px 24px', fontSize: '0.9rem', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgb(15, 23, 42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div className="dash-card" style={{ width: '100%', maxWidth: '1250px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem', background: '#1e293b' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={24} /> Applicant Verification View
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          
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

            {applicant.rapidTestCompleted && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary)' }}>Rapid Test Result</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MCQ Exam Auto-Score</div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4ade80' }}>
                  {applicant.rapidTestScore || 0}
                </div>
              </div>
            )}

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
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>Uploaded Documents (Testimonials)</h3>
                  {(() => {
                    const docsToRender = requiredDocsList.length > 0 ? requiredDocsList : ["Aadhaar Card", "PAN Card", "Degree/Provisional Certificate", "Previous Company Appointment Letter", "Last Month Salary Slip", "Cancel Cheque", "Passport Photo", "Resume"];
                    const verifiedCount = docsToRender.filter(d => verificationChecks[d]).length;
                    const progress = docsToRender.length > 0 ? Math.round((verifiedCount / docsToRender.length) * 100) : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verification Progress: {verifiedCount}/{docsToRender.length}</div>
                        <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--success)', width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <label className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', height: 'fit-content' }}>
                  <Upload size={12} /> Upload Additional
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadMissingDoc(e)} />
                </label>
              </div>
              <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                {(requiredDocsList.length > 0 ? requiredDocsList : ["Aadhaar Card", "PAN Card", "Degree/Provisional Certificate", "Previous Company Appointment Letter", "Last Month Salary Slip", "Cancel Cheque", "Passport Photo", "Resume"]).map(dName => {
                  const categoryFiles = (applicant.documents || []).filter((u: any) => (u.docType || u.category || 'Document') === dName);
                  const isVerified = !!verificationChecks[dName];
                  
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
                    const downloadUrl = assetId.startsWith('/uploads/') ? `/api/admin${assetId}` : (assetId.startsWith('/') ? assetId : `/api/admin/uploads/${assetId}`);
                    
                    return (
                      <div key={`${dName}-${i}`} style={{ background: isVerified ? 'rgba(16,185,129,0.05)' : 'rgba(245, 158, 11, 0.05)', border: isVerified ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245, 158, 11, 0.3)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', paddingRight: '8px' }}>{dName}</div>
                          <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={isVerified} 
                              onChange={() => toggleVerify(dName)} 
                              style={{ opacity: 0, width: 0, height: 0 }} 
                            />
                            <span style={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: isVerified ? '#10b981' : '#475569',
                              transition: '.3s', borderRadius: '20px'
                            }}>
                              <span style={{
                                position: 'absolute', content: '""', height: '14px', width: '14px', left: '3px', bottom: '3px',
                                backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                transform: isVerified ? 'translateX(16px)' : 'translateX(0)'
                              }}></span>
                            </span>
                          </label>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: isVerified ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                          {isVerified ? '✓ Verified' : 'Pending Verification'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Assigned Employee Code</label>
                  <input type="text" className="form-input" value={empCode} onChange={e => setEmpCode(e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Proposed Designation</label>
                  <select className="form-input" value={designation} onChange={e => setDesignation(e.target.value)}>
                    <option value="">Select Designation</option>
                    {designationsList.map((d: any) => (
                      <option key={d.title} value={d.title}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Division</label>
                  <select className="form-input" value={division} onChange={e => setDivision(e.target.value)}>
                    <option value="">Select Division</option>
                    {divisionsList.map((d: any) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Reporting To</label>
                  <select className="form-input" value={reportingTo} onChange={e => setReportingTo(e.target.value)}>
                    <option value="">Select Manager</option>
                    <optgroup label="STAFF (Existing Employees)">
                      {managersList.map((m: any) => (
                        <option key={m.email} value={m.fullName}>{m.fullName} ({m.designation || 'Staff'} - {m.division || 'General'})</option>
                      ))}
                    </optgroup>
                    <optgroup label="ROLE (Designations Fallback)">
                      {designationsList.map((d: any) => (
                        <option key={`role-${d.title}`} value={d.title}>{d.title} (Role Only)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Joining HQ</label>
                  <select className="form-input" value={hq} onChange={e => setHq(e.target.value)}>
                    <option value="">Select HQ</option>
                    {hqsList.map((h: any) => (
                      <option key={h.name} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Actual Date of Joining</label>
                  <input type="date" className="form-input" value={actualJoiningDate} onChange={e => setActualJoiningDate(e.target.value)} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: '10px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Approved Annual CTC</label>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Asked Salary (Expected): <strong style={{ color: 'var(--text)' }}>₹{applicant.formData?.salary || applicant.expectedSalary || 'N/A'}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="number" className="form-input" style={{ flex: 1 }} value={salary} onChange={e => setSalary(e.target.value)} />
                    <button type="button" className="btn btn-outline" onClick={autoDistributeSalary} style={{ height: '42px', padding: '0 15px', whiteSpace: 'nowrap' }}>Calculate Breakup</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Statutory & Bank Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>EPF Number</label>
                  <input type="text" className="form-input" placeholder="e.g. AB/123/456789" value={epfNumber} onChange={e => setEpfNumber(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>UAN Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 100123456789" value={uanNumber} onChange={e => setUanNumber(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>ESI Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 1234567890" value={esiNumber} onChange={e => setEsiNumber(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Bank Name</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Account Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 50100012345" value={accNo} onChange={e => setAccNo(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>IFSC Code</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC0001234" value={ifsc} onChange={e => setIfsc(e.target.value)} />
                </div>
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
                <div><label className="form-label">Roundoff</label><input type="number" className="form-input-sm" style={{ width: '100%' }} value={salRoundoff} onChange={e => setSalRoundoff(e.target.value)} /></div>
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
