import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle, FileText, Trash2, AlertCircle } from 'lucide-react';
import api from '../../api/client';

interface DocumentUploaderProps {
  applicant: any;
  formData: any;
  onNext: () => void;
  onBack: () => void;
}

const OPTIONAL_DOCS = [
  "Passport (Front & Back)",
  "Driving License",
  "Voter ID",
  "UAN Activation Screenshot",
  "Cancelled Cheque / Passbook (If NO existing UAN)",
  "COVID Vaccination Certificate"
];

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ applicant, formData, onNext, onBack }) => {
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>(applicant.documents || []);
  const [loading, setLoading] = useState(false);
  const [isExperienced, setIsExperienced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('');

  useEffect(() => {
    // Determine if experienced
    const exp = formData.experience || [];
    setIsExperienced(exp.length > 0);

    // Fetch company data for required docs
    const fetchCompanyData = async () => {
      try {
        const res = await api.get('/company-data');
        if (res.data && res.data.requiredDocs) {
          setRequiredDocs(res.data.requiredDocs);
        }
      } catch (e) {
        console.error("Failed to load company config", e);
      }
    };
    fetchCompanyData();
  }, [formData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !currentCategory) return;
    
    setLoading(true);
    try {
      for (const file of files) {
        const base64: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = err => reject(err);
        });

        const res = await api.post('/applicant/upload-document', {
          email: applicant.email,
          category: currentCategory,
          fileName: file.name,
          fileData: base64
        });
        
        if (res.data.success && res.data.documents) {
          setUploadedDocs(res.data.documents);
        }
      }
      
      const appRes = await api.get(`/admin/applicant/${applicant.email}`);
      if (appRes.data.success && appRes.data.applicant) {
        setUploadedDocs(appRes.data.applicant.applicant?.documents || appRes.data.applicant.documents || []);
      }
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (category: string) => {
    setCurrentCategory(category);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeDoc = async (assetId: string, category: string) => {
    setLoading(true);
    try {
      await api.delete('/applicant/delete-document', {
        data: { email: applicant.email, assetId, category }
      });
      // Fetch latest applicant
      const appRes = await api.get(`/admin/applicant/${applicant.email}`);
      if (appRes.data.success && appRes.data.applicant) {
        setUploadedDocs(appRes.data.applicant.documents || []);
      }
    } catch (err) {
      alert("Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Document Uploads</h3>
      
      {isExperienced ? (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
          <AlertCircle color="#f59e0b" />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <strong>Note for Experienced Candidate:</strong> Since you have previous experience, uploading your <strong>Last Month Salary Slip</strong> and <strong>Previous Company Appointment/Experience letters</strong> is mandatory.
          </p>
        </div>
      ) : (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
          <CheckCircle color="#10b981" />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <strong>Note for Fresher:</strong> Previous employment documents are optional for you.
          </p>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        multiple
        style={{ display: 'none' }} 
        accept="application/pdf,image/*"
        onChange={handleFileUpload}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {requiredDocs.filter(d => d !== 'Digital Signature').map(docName => {
          const categoryDocs = uploadedDocs.filter(d => d.category === docName);
          const hasFiles = categoryDocs.length > 0;
          
          const expDocs = ["Last Month Salary Slip", "Previous Company Appointment Letter"];
          let isOptional = OPTIONAL_DOCS.includes(docName);
          if (expDocs.includes(docName)) {
            isOptional = !isExperienced;
          }

          return (
            <div key={docName} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {docName} {isOptional ? <span style={{ color: 'var(--text-muted)' }}>(Optional)</span> : <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              
              <div 
                onClick={() => triggerUpload(docName)}
                style={{ 
                  border: '2px dashed rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  textAlign: 'center', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: hasFiles ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.5 : 1
                }}
              >
                <UploadCloud size={24} style={{ color: hasFiles ? '#10b981' : 'var(--text-muted)', margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{hasFiles ? 'Add More Files' : 'Click to Upload (Multiple allowed)'}</div>
              </div>

              {hasFiles && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✅ Uploaded Files ({categoryDocs.length}):</div>
                  {categoryDocs.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileText size={14} color="#10b981" />
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx + 1}. {doc.name}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeDoc(doc.assetId, doc.category)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button type="button" className="btn btn-outline" onClick={onBack} disabled={loading}>Back</button>
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={loading}>Proceed to Exam ✨</button>
      </div>
    </div>
  );
};

export default DocumentUploader;
