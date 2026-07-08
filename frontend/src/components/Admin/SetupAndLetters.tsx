import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Database, AlertTriangle, FileText, Image as ImageIcon, History } from 'lucide-react';
import api from '../../api/client';

export default function SetupAndLetters() {
  const [activeTab, setActiveTab] = useState<'templates' | 'assets' | 'system'>('templates');
  
  // Template State
  const [activeTemplate, setActiveTemplate] = useState('offerLetterBody');
  const [templateContent, setTemplateContent] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // System State
  const [dbStats, setDbStats] = useState<any>(null);

  const templateOptions = [
    { id: 'offerLetterBody', label: 'Offer Letter' },
    { id: 'apptLetterBody', label: 'Appointment Letter' },
    { id: 'confirmLetterBody', label: 'Confirmation Letter' },
    { id: 'revisedSalaryBody', label: 'Salary Revision Letter' },
    { id: 'experienceLetterBody', label: 'Experience Letter' },
    { id: 'relievingLetterBody', label: 'Relieving Letter' }
  ];

  const placeholders = ['{{FULL_NAME}}', '{{ADDRESS}}', '{{CITY_STATE}}', '{{PIN}}', '{{DESIGNATION}}', '{{JOINING_DATE}}', '{{HQ}}', '{{REPORTING_TO}}', '{{SALARY_MONTHLY}}', '{{SALARY_ANNUAL}}', '{{COMPANY_NAME}}', '{{TODAY_DATE}}'];

  useEffect(() => {
    fetchCompanyTemplates();
    fetchDbStats();
  }, []);

  const fetchCompanyTemplates = async () => {
    try {
      const res = await api.get('/company-profile');
      if (res.data.company) {
        setTemplateContent(res.data.company[activeTemplate] || '');
        if (editorRef.current) {
          editorRef.current.innerHTML = res.data.company[activeTemplate] || '';
        }
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
        [activeTemplate]: templateContent
      });
      alert('Template saved successfully!');
    } catch (e) {
      alert('Error saving template');
    } finally {
      setSavingTemplate(false);
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
    } catch (err) {
      alert('Upload failed');
    }
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', minHeight: '600px' }}>
          
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select className="form-input" value={activeTemplate} onChange={e => setActiveTemplate(e.target.value)} style={{ width: '300px' }}>
                {templateOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline"><History size={16} /> History</button>
                <button className="btn btn-primary" onClick={saveTemplate} disabled={savingTemplate}><Save size={16} /> Save Template</button>
              </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('bold')}><b>B</b></button>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('italic')}><i>I</i></button>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('underline')}><u>U</u></button>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('insertOrderedList')}>1.</button>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('insertUnorderedList')}>•</button>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('justifyLeft')}>Left</button>
              <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => execCommand('justifyCenter')}>Center</button>
            </div>

            {/* Editor */}
            <div 
              ref={editorRef}
              onInput={handleEditorInput}
              contentEditable
              style={{
                flex: 1,
                background: '#fff',
                color: '#000',
                padding: '20px',
                borderRadius: '4px',
                border: '1px solid var(--glass-border)',
                outline: 'none',
                overflowY: 'auto',
                fontFamily: 'Helvetica, Arial, sans-serif'
              }}
            />
          </div>

          <div className="dash-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Dynamic Placeholders</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Click to insert into template.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="dash-card">
          <h2 style={{ marginBottom: '2rem' }}>Brand Asset Uploader</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {['Company Logo', 'Company Stamp', 'Authorized Signature', 'Letterhead Base'].map(cat => (
              <div key={cat} style={{ border: '1px dashed var(--glass-border)', padding: '2rem', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <ImageIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h4 style={{ marginBottom: '1rem' }}>{cat}</h4>
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', gap: '8px' }}>
                  <Upload size={16} /> Upload New
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleAssetUpload(e, cat)} />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="dash-card" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>System Maintenance</h2>
          {dbStats && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <p><strong>Total Storage Used:</strong> {(dbStats.totalStorageMB || 0).toFixed(2)} MB</p>
              <p><strong>DB Size:</strong> {(dbStats.dbSizeMB || 0).toFixed(2)} MB</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="/api/admin/system/export" download className="btn btn-outline" style={{ textAlign: 'center' }}>Download Database Backup (JSON)</a>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={wipeDatabase}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Wipe Database (Factory Reset)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
