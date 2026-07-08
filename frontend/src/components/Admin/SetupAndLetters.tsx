import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Database, FileText, Image as ImageIcon, Send, Eye, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ZoomIn, AlertTriangle, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../../api/client';

export default function SetupAndLetters() {
  const [activeTab, setActiveTab] = useState<'templates' | 'assets' | 'system'>('templates');
  
  // Template State
  const [activeTemplate, setActiveTemplate] = useState('offerLetterBody');
  const [templateContent, setTemplateContent] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Admin Bar State
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesg, setSignatoryDesg] = useState('');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [targetApplicant, setTargetApplicant] = useState('');
  const [livePreview, setLivePreview] = useState(false);
  const [zoom, setZoom] = useState('1.0');

  // System & Assets State
  const [dbStats, setDbStats] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);

  const templateOptions = [
    { id: 'offerLetterBody', label: 'Offer Letter', type: 'offer' },
    { id: 'apptLetterBody', label: 'Appointment Letter', type: 'appt' },
    { id: 'confirmLetterBody', label: 'Confirmation Letter', type: 'confirm' },
    { id: 'revisedSalaryBody', label: 'Salary Revision Letter', type: 'revised' },
    { id: 'experienceLetterBody', label: 'Experience Letter', type: 'experience' },
    { id: 'relievingLetterBody', label: 'Relieving Letter', type: 'relieving' }
  ];

  const placeholders = ['{{FULL_NAME}}', '{{ADDRESS}}', '{{CITY_STATE}}', '{{PIN}}', '{{DESIGNATION}}', '{{JOINING_DATE}}', '{{HQ}}', '{{REPORTING_TO}}', '{{SALARY_MONTHLY}}', '{{SALARY_ANNUAL}}', '{{COMPANY_NAME}}', '{{TODAY_DATE}}'];

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
      const res = await api.get('/admin/assets');
      setAssets(res.data || []);
    } catch (e) {
      console.error('Failed to load assets');
    }
  };

  const fetchCompanyTemplates = async () => {
    try {
      const res = await api.get('/company-profile');
      const comp = res.data.company || res.data;
      if (comp && comp[activeTemplate] !== undefined) {
        setTemplateContent(comp[activeTemplate] || '');
        if (editorRef.current) {
          editorRef.current.innerHTML = comp[activeTemplate] || '';
        }
      }
      if (comp) {
        setSignatoryName(comp.signatoryName || '');
        setSignatoryDesg(comp.signatoryDesignation || '');
      }
    } catch (e) {
      console.error('Failed to load templates');
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
    if (editorRef.current) editorRef.current.focus();
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
    
    // Attempt to parse out the applicant data and replace placeholders before sending
    const applicant = applicants.find(a => a.email === targetApplicant);
    if (!applicant) return;

    let finalContent = templateContent;
    finalContent = finalContent.replace(/{{FULL_NAME}}/g, applicant.fullName || '');
    finalContent = finalContent.replace(/{{ADDRESS}}/g, applicant.address || '');
    finalContent = finalContent.replace(/{{CITY_STATE}}/g, `${applicant.city || ''} ${applicant.state || ''}`);
    finalContent = finalContent.replace(/{{PIN}}/g, applicant.pin || '');
    finalContent = finalContent.replace(/{{DESIGNATION}}/g, applicant.designation || '');
    finalContent = finalContent.replace(/{{HQ}}/g, applicant.hq || '');
    finalContent = finalContent.replace(/{{REPORTING_TO}}/g, applicant.reportingTo || '');
    finalContent = finalContent.replace(/{{TODAY_DATE}}/g, new Date().toLocaleDateString());

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
    if (!editorRef.current) return;
    try {
      // Create a temporary clone for printing without any UI bounds
      const canvas = await html2canvas(editorRef.current, { scale: 2 });
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
    const formData = new FormData();
    formData.append('asset', file);
    formData.append('category', category);
    formData.append('name', file.name);

    try {
      await api.post('/admin/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Asset uploaded successfully!');
      fetchAssets();
    } catch (err) {
      alert('Upload failed');
    }
  };

  const getAssetPreviewUrl = (category: string) => {
    const asset = assets.find(a => a.category === category);
    if (!asset) return null;
    return asset.filename.includes('/api/admin/uploads/') ? asset.filename : `/api/admin/uploads/${asset.filename}`;
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
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', minHeight: '600px' }}>
            
            {/* Sidebar Controls */}
            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Template Type</h3>
              <select className="form-input" value={activeTemplate} onChange={e => setActiveTemplate(e.target.value)}>
                {templateOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>

              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>Tags (Placeholders)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to insert tag at cursor.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '400px', overflowY: 'auto' }}>
                {placeholders.map(ph => (
                  <button 
                    key={ph}
                    onClick={() => insertPlaceholder(ph)}
                    style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-main)', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {ph}
                  </button>
                ))}
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
                  <select className="form-input" style={{ padding: '2px', fontSize: '0.8rem', background: 'transparent', border: 'none' }} onChange={(e) => execCommand('fontName', e.target.value)}>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                  </select>
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
              <div style={{ background: '#e2e8f0', padding: '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', position: 'relative', minHeight: '600px' }}>
                
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
                      className="a4-page-standard"
                      dangerouslySetInnerHTML={{ __html: templateContent }}
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', pointerEvents: 'none', background: 'white' }}
                    />
                  </div>
                )}

                <div 
                  ref={editorRef}
                  className="a4-page-standard"
                  contentEditable={!livePreview}
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  style={{ 
                    transform: `scale(${zoom})`, 
                    transformOrigin: 'top center',
                    display: livePreview ? 'none' : 'block'
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="dash-card">
          <h2 style={{ marginBottom: '2rem' }}>Brand Asset Uploader</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {['Company Logo', 'Company Stamp', 'Authorized Signature', 'Letterhead Base'].map(cat => {
              const previewUrl = getAssetPreviewUrl(cat);
              return (
                <div key={cat} style={{ border: '1px dashed var(--glass-border)', padding: '2rem', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt={cat} style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', marginBottom: '1rem', borderRadius: '4px' }} />
                  ) : (
                    <ImageIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  )}
                  <h4 style={{ marginBottom: '1rem' }}>{cat}</h4>
                  <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', gap: '8px' }}>
                    <Upload size={16} /> {previewUrl ? 'Replace Asset' : 'Upload Asset'}
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleAssetUpload(e, cat)} accept="image/*" />
                  </label>
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
