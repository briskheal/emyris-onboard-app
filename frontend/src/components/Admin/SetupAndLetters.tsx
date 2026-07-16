import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Database, FileText, Image as ImageIcon, Send, Eye, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ZoomIn, AlertTriangle, Download, X, Trash2, Scissors } from 'lucide-react';
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
  const [targetApplicantData, setTargetApplicantData] = useState<any>(null);

  useEffect(() => {
    if (targetApplicant) {
      api.get(`/admin/applicant/${targetApplicant}`).then(res => {
        if(res.data.success) setTargetApplicantData(res.data.applicant);
      });
    } else {
      setTargetApplicantData(null);
    }
  }, [targetApplicant]);
  const [livePreview, setLivePreview] = useState(false);
  const [zoom, setZoom] = useState('1.0');
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
  const [fontSize, setFontSize] = useState(11);
  const [companyData, setCompanyData] = useState<any>({});

  // System & Assets State
  const [dbStats, setDbStats] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [activeAssets, setActiveAssets] = useState<{ [key: string]: string }>({});

  const coreTemplates = [
    { id: 'offerLetterBody', label: 'Offer Letter', type: 'offer' },
    { id: 'apptLetterBody', label: 'Appointment Letter', type: 'appt' },
    { id: 'confirmLetterBody', label: 'Confirmation Letter', type: 'confirm' },
    { id: 'confirmDelayedLetterBody', label: 'Confirmation Delayed Letter', type: 'confirm_delayed' },
    { id: 'revisedSalaryBody', label: 'Salary Revision Letter', type: 'revised' },
    { id: 'experienceLetterBody', label: 'Experience Letter', type: 'experience' },
    { id: 'relievingLetterBody', label: 'Relieving Letter', type: 'relieving' },
    { id: 'warningLetterBody', label: 'Warning Letter', type: 'warning' },
    { id: 'showCauseNoticeBody', label: 'Show Cause Notice', type: 'show_cause' },
    { id: 'incentiveCircularBody', label: 'Incentive Circular', type: 'incentive' }
  ];

  const templateOptions = [
    ...coreTemplates,
    ...(companyData?.miscLetters || []).map((m: any) => ({
      id: `misc_${m.id}`,
      label: `📝 ${m.title}`,
      type: `misc_${m.id}`
    }))
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
      
      const allLetters = { ...letters };
      if (comp?.miscLetters) {
        comp.miscLetters.forEach((m: any) => {
          allLetters[`misc_${m.id}`] = m.body || '';
        });
      }
      
      if (allLetters) {
        const newContent = allLetters[activeTemplate] !== undefined ? allLetters[activeTemplate] : '';
        setTemplateContent(newContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = newContent;
        }
      }
      if (comp) {
        setCompanyData(comp);
        setSignatoryName(comp.signatoryName || '');
        setSignatoryDesg(comp.signatoryDesignation || '');
        if (comp.letterFontType) setFontFamily(comp.letterFontType);
        if (comp.letterFontSize) setFontSize(Number(comp.letterFontSize) || 11);
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

  const insertPageBreak = () => {
    const pbHtml = '<div class="hard-page-break" style="height: 20px; border-top: 2px dashed rgba(99,102,241,0.3); margin: 20px 0; pointer-events: none;" contenteditable="false"></div><p><br></p>';
    execCommand('insertHTML', pbHtml);
  };

  const saveTemplate = async () => {
    setSavingTemplate(true);
    try {
      let updatePayload: any = {
        signatoryName,
        signatoryDesignation: signatoryDesg,
        letterFontSize: fontSize,
        letterFontType: fontFamily
      };

      if (activeTemplate.startsWith('misc_')) {
        const miscId = activeTemplate.split('_')[1];
        const newMiscLetters = [...(companyData?.miscLetters || [])];
        const idx = newMiscLetters.findIndex((m: any) => m.id === miscId);
        if (idx > -1) {
          newMiscLetters[idx].body = templateContent;
        }
        updatePayload.miscLetters = newMiscLetters;
      } else {
        updatePayload[activeTemplate] = templateContent;
      }

      await api.post('/company-profile', updatePayload);
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

    let finalContent = fillLetterPlaceholders(templateContent, targetApplicantData || applicant, { ...companyData, signatoryName, signatoryDesignation: signatoryDesg });
    finalContent = `<div style="font-family: ${fontFamily}; font-size: ${fontSize}pt;">${finalContent}</div>`;

    const activeLetterType = templateOptions.find(t => t.id === activeTemplate)?.type || 'offer';    try {
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
      const clone = targetEl.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.width = '210mm';
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.transform = 'none'; // Remove any zoom
      clone.style.margin = '0'; // Remove inherited margins that would increase height artificially
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(clone);

      const canvasW = canvas.width;
      const canvasH = canvas.height;
      // 210mm x 297mm (A4 ratio = ~1.414)
      const A4_PX_H = Math.floor(canvasW * 1.414); 

      const pdf = new jsPDF('p', 'mm', 'a4');
      let cursorY = 0;
      let pageCount = 0;
      // Calculate 25mm bottom padding in pixels relative to canvas width (which represents 210mm)
      const bottomPaddingPx = Math.floor((25 / 210) * canvasW);

      while (cursorY < canvasH - bottomPaddingPx) {
        if (pageCount > 0) pdf.addPage();
        
        const sliceH = Math.min(A4_PX_H, canvasH - cursorY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasW;
        sliceCanvas.height = sliceH;
        
        const sCtx = sliceCanvas.getContext('2d');
        sCtx?.drawImage(canvas, 0, cursorY, canvasW, sliceH, 0, 0, canvasW, sliceH);
        
        const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceH_mm = (sliceH / canvasW) * 210;
        
        pdf.addImage(sliceData, 'PNG', 0, 0, 210, sliceH_mm, undefined, 'FAST');
        
        cursorY += A4_PX_H;
        pageCount++;
      }
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
    reader.onloadend = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        
        // Convert to WebP like the old modal did
        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        
        try {
          await api.post('/admin/upload-asset', {
            category,
            name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            data: webpDataUrl,
            setActive: true
          });
          alert('Asset uploaded successfully!');
          fetchAssets();
          fetchCompanyTemplates();
        } catch (err) {
          alert('Upload failed');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CREATE_NEW') {
      const title = window.prompt("Enter a title for this new Custom Letter (e.g., 'Warning Letter'):");
      if (!title || title.trim() === '') return;
      
      const newId = Date.now().toString(36);
      const newMiscLetters = [...(companyData?.miscLetters || []), { id: newId, title: title.trim(), body: "" }];
      
      api.post('/company-profile', { miscLetters: newMiscLetters }).then(() => {
        setCompanyData({ ...companyData, miscLetters: newMiscLetters });
        setActiveTemplate(`misc_${newId}`);
      }).catch(() => {
        alert("Failed to create new template");
      });
    } else {
      setActiveTemplate(val);
    }
  };

  const handleDeleteCustomTemplate = async () => {
    if (!activeTemplate.startsWith('misc_')) return;
    const confirmDel = window.confirm("Are you sure you want to delete this custom template?");
    if (!confirmDel) return;
    
    const miscId = activeTemplate.split('_')[1];
    const newMiscLetters = (companyData?.miscLetters || []).filter((m: any) => m.id !== miscId);
    
    try {
      await api.post('/company-profile', { miscLetters: newMiscLetters });
      setCompanyData({ ...companyData, miscLetters: newMiscLetters });
      setActiveTemplate('offerLetterBody');
    } catch (e) {
      alert("Failed to delete template");
    }
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
                <select className="form-input" style={{ width: '250px' }} value={activeTemplate} onChange={handleTemplateChange}>
                  {templateOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>➕ Create New Custom Letter...</option>
                </select>
                {activeTemplate.startsWith('misc_') && (
                  <button type="button" className="btn btn-sm" onClick={handleDeleteCustomTemplate} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 12px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer' }}>
                    <Trash2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Delete Custom Letter
                  </button>
                )}
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
                  <button className="btn btn-outline" style={{ padding: '4px 10px', border: 'none', color: 'var(--accent)' }} onClick={insertPageBreak} title="Insert Page Break"><Scissors size={14} /></button>
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
                        style={{ 
                          transform: `scale(${zoom})`, 
                          transformOrigin: 'top center', 
                          pointerEvents: 'none', 
                          background: 'white',
                          fontFamily: fontFamily,
                          fontSize: `${fontSize}pt`,
                          position: 'relative'
                        }}
                      >
                        {activeAssets.letterheadImage && (
                          <img 
                            src={`/api/public/asset/${activeAssets.letterheadImage}`}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.15, pointerEvents: 'none' }}
                            alt="Letterhead"
                            crossOrigin="anonymous"
                          />
                        )}
                        <div 
                          style={{ position: 'relative', zIndex: 1 }}
                          dangerouslySetInnerHTML={{ __html: fillLetterPlaceholders(templateContent, targetApplicantData || (targetApplicant ? applicants.find(a => a.email === targetApplicant) || {} : {
                            title: 'Mr.', fullName: 'Candidate Name', formData: { firstName: 'Candidate', lastName: 'Name', address: '123 Test St', city: 'Testville', state: 'TestState', pin: '123456', phone: '9876543210' },
                            designation: 'Software Engineer', division: 'Engineering', hq: 'Mumbai', reportingTo: 'Jane Smith', empCode: 'EMY/EMPC/999',
                            actualJoiningDate: '2026-07-01', salaryBreakup: { basic: 15000, hra: 5000, special: 3000, conveyance: 2000, medical: 1000, lta: 1000, edu: 1000, fixed: 2000 }
                          }), { ...companyData, signatoryName, signatoryDesignation: signatoryDesg }).replace(/\{\{([^}]+)\}\}/g, '<span style="background:rgba(255,255,0,0.4); color:#000; font-weight:bold; padding:2px 4px; border-radius:3px;">{{$1}}</span>') }}
                        />
                      </div>
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
            <Database size={24} /> System Maintenance & Data Pipeline
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Download a full JSON snapshot of your environment, prune junk files, or permanently clear all data.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Backup Button */}
            <button 
              className="btn btn-outline" 
              onClick={() => window.open(`${api.defaults.baseURL}/admin/export-backup`, '_blank')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1.5rem', height: '120px', borderColor: 'rgba(99, 102, 241, 0.4)', color: 'var(--primary-light)' }}
            >
              <Save size={28} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>Backup Library</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Download JSON</div>
              </div>
            </button>

            {/* Restore Button */}
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                id="importBackupInput" 
                accept=".json" 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      await api.post('/admin/import-backup', { data });
                      alert("Restore successful! Please refresh the page.");
                      window.location.reload();
                    } catch (err) {
                      alert("Failed to parse or restore JSON backup.");
                    }
                  };
                  reader.readAsText(file);
                }} 
              />
              <button 
                className="btn btn-outline" 
                onClick={() => document.getElementById('importBackupInput')?.click()}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1.5rem', height: '120px', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
              >
                <Upload size={28} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold' }}>Restore Library</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Import JSON</div>
                </div>
              </button>
            </div>

            {/* Vacuum Button */}
            <button 
              className="btn btn-outline" 
              onClick={async () => {
                if (!confirm("Are you sure you want to run Asset Vacuum? This will delete unused junk files.")) return;
                try {
                  const res = await api.post('/admin/system/vacuum');
                  alert(res.data.message || "Vacuum complete.");
                } catch (e) {
                  alert("Vacuum failed.");
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1.5rem', height: '120px', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
            >
              <Trash2 size={28} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>Asset Vacuum</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Prune Unused Files</div>
              </div>
            </button>

            {/* Reset Button */}
            <button 
              className="btn btn-outline" 
              onClick={wipeDatabase}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '1.5rem', height: '120px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
            >
              <AlertTriangle size={28} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>System Reset</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Wipe Database</div>
              </div>
            </button>
          </div>
          
          {dbStats && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Database size={16} /> Storage & DB Capacity
                </div>
                
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${dbStats.summary?.usedPercentage || 0}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', transition: 'width 1s ease' }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 700 }}>
                  <span style={{ color: '#fff' }}>{Math.round((dbStats.summary?.totalUsedBytes || 0) / 1024 / 1024)} MB</span>
                  <span style={{ color: 'var(--primary-light)' }}>{dbStats.summary?.usedPercentage || 0}% Used</span>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total Server Disk: {Math.round((dbStats.summary?.limitBytes || 0) / 1024 / 1024 / 1024)} GB
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
