import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Database, FileText, Image as ImageIcon, Send, Eye, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ZoomIn, AlertTriangle, Download, X, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../../api/client';
import { fillLetterPlaceholders } from '../../utils/letterUtils';

export default function SetupAndLetters() {
  const [activeTab, setActiveTab] = useState<'templates' | 'assets' | 'system'>('templates');
  
  // Template State
  const [activeTemplate, setActiveTemplate] = useState('offerLetterBody');
  const [templateContent, setTemplateContent] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Admin Bar State
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesg, setSignatoryDesg] = useState('');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [targetApplicant, setTargetApplicant] = useState('');
  const [livePreview, setLivePreview] = useState(false);
  const [zoom, setZoom] = useState('1.0');
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
  const [fontSize, setFontSize] = useState(11);

  // System & Assets State
  const [dbStats, setDbStats] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [activeAssets, setActiveAssets] = useState<{ [key: string]: string }>({});

  const templateOptions = [
    { id: 'offerLetterBody', label: 'Offer Letter', type: 'offer' },
    { id: 'apptLetterBody', label: 'Appointment Letter', type: 'appt' },
    { id: 'confirmLetterBody', label: 'Confirmation Letter', type: 'confirm' },
    { id: 'revisedSalaryBody', label: 'Salary Revision Letter', type: 'revised' },
    { id: 'experienceLetterBody', label: 'Experience Letter', type: 'experience' },
    { id: 'relievingLetterBody', label: 'Relieving Letter', type: 'relieving' }
  ];

  const placeholders = [
    '{{TODAY_DATE}}', '{{REF_NO}}', '{{TITLE}}', '{{TITLE_SHORT}}', '{{FULL_NAME}}', '{{FIRST_NAME}}', '{{FATHER_NAME}}', '{{DOB}}',
    '{{BLOOD_GROUP}}', '{{PAN_NO}}', '{{PHONE}}', '{{ADDRESS}}', '{{CITY_STATE}}', '{{PIN}}', '{{DESIGNATION}}', '{{EMP_CODE}}', 
    '{{DIVISION}}', '{{HQ}}', '{{REPORTING_TO}}', '{{SALARY_MONTHLY}}', '{{SALARY_ANNUAL}}', '{{SALARY_WORDS}}', '{{BANK_NAME}}', 
    '{{BANK_ACC}}', '{{IFSC}}', '{{JOINING_DATE}}', '{{COMPANY_NAME}}', '{{SIGNATORY_NAME}}', '{{SIGNATORY_DESG}}', '{{SAL_BASIC}}', 
    '{{SAL_HRA}}', '{{SAL_LTA}}', '{{SAL_CONV}}', '{{SAL_MED}}', '{{SAL_SPECIAL}}', '{{SAL_EDU}}', '{{SAL_FIXED}}', 
    '{{SAL_GROSS_MONTHLY}}', '{{SAL_GROSS_ANNUAL}}', '{{SALARY_BREAKUP}}'
  ];

  useEffect(() => {
    fetchCompanyTemplates();
    fetchDbStats();
    fetchAssets();
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const res = await api.get('/admin/applicants');
      if (res.data.success) {
        setApplicants(res.data.applicants);
      }
    } catch (e) {
      console.error('Failed to load applicants');
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await api.get('/admin/asset-library');
      if (Array.isArray(res.data)) {
        setAssets(res.data);
      } else if (res.data && res.data.success && Array.isArray(res.data.assets)) {
        setAssets(res.data.assets);
      } else {
        setAssets([]);
      }
    } catch (e) {
      console.error('Failed to load assets');
      setAssets([]);
    }
  };

  const fetchCompanyTemplates = async () => {
    try {
      const [profileRes, lettersRes] = await Promise.all([
        api.get('/company-profile'),
        api.get('/admin/company/letters')
      ]);
      const comp = profileRes.data.company || profileRes.data;
      const letters = lettersRes.data;
      
      if (letters && letters[activeTemplate] !== undefined) {
        if (!editorRef.current?.innerHTML || editorRef.current.innerHTML === '<br>' || editorRef.current.innerHTML === templateContent) {
          setTemplateContent(letters[activeTemplate]);
          if (editorRef.current) {
            editorRef.current.innerHTML = letters[activeTemplate];
          }
        }
      }
      if (comp) {
        setSignatoryName(comp.signatoryName || '');
        setSignatoryDesg(comp.signatoryDesignation || '');
        setActiveAssets({
          logo: comp.activeLogoId || '',
          stamp: comp.activeStampId || '',
          digitalSignature: comp.activeSignatureId || '',
          letterheadImage: comp.activeLetterheadId || ''
        });
      }
    } catch (e) {
      console.error('Failed to load templates');
    }
  };

  const handleResetTemplate = () => {
    if (window.confirm('Are you sure you want to revert to the last saved version? All unsaved changes will be lost.')) {
      fetchCompanyTemplates();
    }
  };

  useEffect(() => {
    fetchCompanyTemplates();
  }, [activeTemplate]);

  const fetchDbStats = async () => {
    try {
      const res = await api.get('/admin/db-stats');
      setDbStats(res.data);
    } catch (e) {
      console.error('Failed to load DB stats');
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setTemplateContent(editorRef.current.innerHTML);
    }
  };

  const execCommand = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      setTemplateContent(editorRef.current.innerHTML);
    }
  };

  const insertPlaceholder = (ph: string) => {
    execCommand('insertText', ph);
  };

  const saveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await api.post('/company-profile', {
        [activeTemplate]: templateContent,
        signatoryName,
        signatoryDesignation: signatoryDesg
      });
      alert('Template Master saved successfully!');
    } catch (e) {
      alert('Error saving template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleHubpush = async () => {
    if (!targetApplicant) {
      alert("Please select a Target Applicant first.");
      return;
    }
    
    const applicant = applicants.find(a => a.email === targetApplicant);
    if (!applicant) return;

    let finalContent = fillLetterPlaceholders(templateContent, applicant, dbStats?.company);

    const activeLetterType = templateOptions.find(t => t.id === activeTemplate)?.type || 'offer';

    try {
      const res = await api.post('/admin/save-letter-snapshot', {
        email: targetApplicant,
        letterType: activeLetterType,
        letterData: finalContent,
        notifyByEmail: true
      });
      if (res.data.success) {
        alert(res.data.message || 'Letter Hubpushed Successfully!');
      } else {
        alert('Failed to publish letter.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to publish letter to hub.');
    }
  };

  const handleDownloadPdf = async () => {
    const targetEl = previewRef.current || editorRef.current;
    if (!targetEl) return;
    try {
      const canvas = await html2canvas(targetEl, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${activeTemplate}_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await api.post('/admin/upload-asset', {
          category,
          name: file.name,
          data: reader.result,
          setActive: true
        });
        alert('Asset uploaded successfully!');
        fetchAssets();
        fetchCompanyTemplates();
      } catch (err) {
        alert('Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const setActiveAsset = async (assetId: string, category: string) => {
    try {
      const res = await api.post('/admin/set-active-asset', { assetId, category });
      if (res.data.success) {
        fetchCompanyTemplates();
      }
    } catch (e) {
      alert('Failed to set active asset');
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!window.confirm("Delete this asset permanently?")) return;
    try {
      const res = await api.post('/admin/delete-asset', { assetId });
      if (res.data.success) {
        fetchAssets();
        fetchCompanyTemplates();
      }
    } catch (e) {
      alert('Failed to delete asset');
    }
  };

  const getAssetDataUrl = (asset: any) => {
    return asset.data || (asset.filename ? (asset.filename.includes('/api/admin/uploads/') ? asset.filename : `/api/admin/uploads/${asset.filename}`) : null);
  };

  const wipeDatabase = async () => {
    if (!window.confirm("WARNING: This will wipe ALL applicant and asset data! Proceed?")) return;
    const pwd = prompt("Enter Admin Password to confirm wipe:");
    if (pwd !== 'admin') { alert("Incorrect password"); return; }
    try {
      await api.post('/admin/system/clear');
      alert("Database wiped successfully.");
      fetchDbStats();
    } catch (e) {
      alert("Failed to wipe database");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('templates')}><FileText size={16} /> Document Templates</button>
        <button className={`btn ${activeTab === 'assets' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('assets')}><ImageIcon size={16} /> Brand Assets</button>
        <button className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('system')}><Database size={16} /> System Maintenance</button>
      </div>

      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* EDITOR ADMIN BAR */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.25rem 2rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
            
            {/* Left: Signatory */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Signatory Name</label>
                <input type="text" className="form-input" style={{ width: '150px', padding: '4px 8px' }} value={signatoryName} onChange={e => setSignatoryName(e.target.value)} placeholder="Enter Name..." />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Designation</label>
                <input type="text" className="form-input" style={{ width: '150px', padding: '4px 8px' }} value={signatoryDesg} onChange={e => setSignatoryDesg(e.target.value)} placeholder="Enter Role..." />
              </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--primary-light)', textTransform: 'uppercase', marginRight: '5px' }}>Target:</label>
                <select className="form-input" style={{ width: '150px', padding: '2px', fontSize: '0.8rem', background: 'transparent', border: 'none' }} value={targetApplicant} onChange={e => setTargetApplicant(e.target.value)}>
                  <option value="">-- Select Applicant --</option>
                  {applicants.map(a => <option key={a.email} value={a.email}>{a.fullName} ({a.email})</option>)}
                </select>
              </div>

              <button className="btn btn-sm btn-primary" onClick={handleHubpush} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, var(--accent), #4f46e5)', border: 'none' }}>
                <Send size={14} /> Generate & Send
              </button>

              <button className="btn btn-sm btn-outline" onClick={() => setLivePreview(!livePreview)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={14} /> {livePreview ? 'Edit Mode' : 'Preview'}
              </button>

              <button className="btn btn-sm btn-outline" onClick={saveTemplate} disabled={savingTemplate} style={{ display: 'flex', alignItems: 'center', gap: '5px', borderColor: '#10b981', color: '#10b981' }}>
                <Save size={14} /> Save Master
              </button>

              <button className="btn btn-sm btn-outline" onClick={handleResetTemplate} style={{ display: 'flex', alignItems: 'center', gap: '5px', borderColor: '#ef4444', color: '#ef4444' }} title="Reset to Saved Master">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px' }}>
            
            {/* Top Controls (Template Type & Tags) */}
            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0, whiteSpace: 'nowrap' }}>Template Type:</h3>
                <select className="form-input" style={{ width: '250px' }} value={activeTemplate} onChange={e => setActiveTemplate(e.target.value)}>
                  {templateOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0, whiteSpace: 'nowrap' }}>Tags (Placeholders):</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {placeholders.map(ph => (
                    <button 
                      key={ph}
                      onClick={() => insertPlaceholder(ph)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Editor Area */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
              
              {/* Full Toolbar */}
              <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                
                <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '6px' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('bold')}><b>B</b></button>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('italic')}><i>I</i></button>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('underline')}><u>U</u></button>
                </div>

                <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '6px' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('justifyLeft')}><AlignLeft size={14} /></button>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('justifyCenter')}><AlignCenter size={14} /></button>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('justifyRight')}><AlignRight size={14} /></button>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('justifyFull')}><AlignJustify size={14} /></button>
                </div>

                <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '6px' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('insertOrderedList')}><List size={14} /></button>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none' }} onClick={() => execCommand('insertUnorderedList')}><List size={14} /></button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                  <Type size={14} color="var(--text-muted)" />
                  <select className="form-input" style={{ padding: '2px', fontSize: '0.8rem', background: 'transparent', border: 'none', maxWidth: '140px' }} value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                    <option value="'Plus Jakarta Sans', Arial, sans-serif">Plus Jakarta Sans</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Outfit', sans-serif">Outfit</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                  </select>
                  <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>
                  <input type="number" className="form-input" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: '50px', padding: '2px 4px', fontSize: '0.8rem', background: 'transparent', border: 'none', textAlign: 'center' }} step="0.5" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pt</span>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ZoomIn size={14} color="var(--text-muted)" />
                  <select className="form-input" style={{ padding: '2px', fontSize: '0.8rem', background: 'transparent', border: 'none' }} value={zoom} onChange={(e) => setZoom(e.target.value)}>
                    <option value="0.75">75%</option>
                    <option value="1.0">100%</option>
                    <option value="1.2">120%</option>
                  </select>
                </div>

              </div>

              {/* Editor Workspace */}
              <div style={{ background: 'rgba(15, 23, 42, 0.2)', padding: '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', position: 'relative', minHeight: '600px', flex: 1 }}>
                <div className="fidelity-desk" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                  
                  {livePreview && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', overflowY: 'auto' }}>
                      
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', alignItems: 'center' }}>
                        <h4 style={{ color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Fidelity Preview</h4>
                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 10px' }}></div>
                        <button className="btn btn-sm btn-primary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', border: 'none' }}>
                          <Download size={14} /> Download Dossier PDF
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => setLivePreview(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: '#ef4444', color: '#ef4444' }}>
                          <X size={14} /> Return to Editor
                        </button>
                      </div>

                      <div 
                        ref={previewRef}
                        className="letter-editor a4-page-standard preview-mode"
                        dangerouslySetInnerHTML={{ __html: fillLetterPlaceholders(templateContent, targetApplicant ? applicants.find(a => a.email === targetApplicant) || {} : {
                          title: 'Mr.', fullName: 'Candidate Name', formData: { firstName: 'Candidate', lastName: 'Name', address: '123 Test St', city: 'Testville', state: 'TestState', pin: '123456', phone: '9876543210' },
                          designation: 'Software Engineer', division: 'Engineering', hq: 'Mumbai', reportingTo: 'Jane Smith', empCode: 'EMY/EMPC/999',
                          actualJoiningDate: '2026-07-01', salaryBreakup: { basic: 15000, hra: 5000, special: 3000, conveyance: 2000, medical: 1000, lta: 1000, edu: 1000, fixed: 2000 }
                        }, dbStats?.company).replace(/\{\{([^}]+)\}\}/g, '<span style="background:rgba(255,255,0,0.4); color:#000; font-weight:bold; padding:2px 4px; border-radius:3px;">{{$1}}</span>') }}
                        style={{ 
                          transform: `scale(${zoom})`, 
                          transformOrigin: 'top center', 
                          pointerEvents: 'none', 
                          background: 'white',
                          fontFamily: fontFamily,
                          fontSize: `${fontSize}pt`
                        }}
                      />
                    </div>
                  )}

                  <div 
                    ref={editorRef}
                    className="letter-editor a4-page-standard"
                    contentEditable={!livePreview}
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center',
                      display: livePreview ? 'none' : 'block',
                      fontFamily: fontFamily,
                      fontSize: `${fontSize}pt`
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="dash-card">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>Brand Assets & Global Artwork</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Upload and manage company logos, digital stamps, and signatures.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {[
              { id: 'logo', label: 'Company Logos' },
              { id: 'stamp', label: 'Company Stamps' },
              { id: 'digitalSignature', label: 'Digital Signatures' },
              { id: 'letterheadImage', label: 'Letterhead Backgrounds' }
            ].map(cat => {
              const categoryAssets = assets.filter(a => a.category === cat.id);
              
              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ border: '2px dashed rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => document.getElementById(`upload-${cat.id}`)?.click()}>
                    <Upload size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.7 }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>Upload to {cat.label}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Click or drag file here</p>
                    <input id={`upload-${cat.id}`} type="file" style={{ display: 'none' }} onChange={(e) => handleAssetUpload(e, cat.id)} accept="image/*" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {categoryAssets.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        No assets uploaded yet.
                      </div>
                    )}
                    {categoryAssets.map(asset => {
                      const isActive = activeAssets[cat.id] === asset._id;
                      const previewUrl = getAssetDataUrl(asset);
                      
                      return (
                        <div key={asset._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
                          <div style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {previewUrl ? (
                              <img src={previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={20} color="var(--text-muted)" />
                            )}
                          </div>
                          
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {isActive ? (
                              <span style={{ fontSize: '0.75rem', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Active</span>
                            ) : (
                              <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1' }} onClick={() => setActiveAsset(asset._id, cat.id)}>Set Active</button>
                            )}
                            <button className="btn btn-sm" style={{ padding: '4px', background: 'transparent', border: 'none', color: '#ef4444' }} onClick={() => deleteAsset(asset._id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="dash-card">
          <h2 style={{ marginBottom: '1.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} /> Danger Zone
          </h2>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '1rem' }}>Factory Reset</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This action will permanently delete all applicants, documents, test results, and assets. It cannot be undone.</p>
            <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={wipeDatabase}>
              Wipe Database Clean
            </button>
          </div>
          
          {dbStats && (
            <div style={{ marginTop: '2rem' }}>
              <h3>System Status</h3>
              <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', marginTop: '1rem', fontSize: '0.85rem' }}>
                {JSON.stringify(dbStats, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
