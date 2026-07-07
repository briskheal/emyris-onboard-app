import React, { useState, useEffect } from 'react';
import { Sparkles, Building2, Briefcase, MapPin } from 'lucide-react';
import api from '../../api/client';

interface ApplicantRegisterProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

const ApplicantRegister: React.FC<ApplicantRegisterProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: 'Mr.',
    fullName: '',
    email: '',
    phone: '',
    hq: '',
    division: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dynamic Company Data State
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const res = await api.get('/company-data'); // hits /api/company-data
        if (res.data && res.data.divisions) {
          setCompanySettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load company config', err);
      }
    };
    fetchCompanyData();
  }, []);

  // When division changes, update available designations
  const handleDivisionChange = (divisionName: string) => {
    setFormData({ ...formData, division: divisionName, designation: '' });
    if (companySettings && companySettings.divisions) {
      const div = companySettings.divisions.find((d: any) => d.name === divisionName);
      if (div && div.designations) {
        // Map designation objects to their string names
        setAvailableDesignations(div.designations.map((d: any) => {
          if (typeof d === 'string') return d;
          return d.name || d.title || d.designation || 'Unknown Role';
        }));
      } else {
        setAvailableDesignations([]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.division || !formData.designation) {
      setError('Please select a Division and Designation.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/applicant/register', formData);
      if (res.data.success) {
        alert(`Registration successful! Your Secure PIN is: ${res.data.pin}`);
        onSuccess(formData.email);
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card" style={{ maxWidth: '650px', width: '100%', padding: '2.5rem' }}>
      <div className="login-header">
        <div className="login-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}><Sparkles /></div>
        <h2 className="premium-title">New Application</h2>
        <p>Fill these details to receive your 6-digit Login PIN.</p>
      </div>
      
      {error && <div style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.3)'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="registration-grid" style={{ gridTemplateColumns: '1fr' }}>
          
          {/* Row 1: Division & Designation (Crucial Logic) */}
          <div className="form-row-compact" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Building2 size={14}/> Division*</label>
              <select className="form-input" value={formData.division} onChange={e => handleDivisionChange(e.target.value)} required>
                <option value="">-- Select Division --</option>
                {companySettings?.divisions?.map((div: any, idx: number) => (
                  <option key={idx} value={div.name}>{div.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Briefcase size={14}/> Designation*</label>
              <select className="form-input" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required disabled={!formData.division}>
                <option value="">-- Select Designation --</option>
                {availableDesignations.map((desig: string, idx: number) => (
                  <option key={idx} value={desig}>{desig}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Title & Name */}
          <div className="form-row-compact" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Title</label>
              <select className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
              </select>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-input" type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required placeholder="Enter your full name" />
            </div>
          </div>

          {/* Row 3: Contact Info */}
          <div className="form-row-compact" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="official@example.com" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input className="form-input" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="10-digit number" />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14}/> Base HQ</label>
              <input className="form-input" type="text" value={formData.hq} onChange={e => setFormData({...formData, hq: e.target.value})} placeholder="City / Region" />
            </div>
          </div>

        </div>

        <div className="btn-group" style={{marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
          <button type="button" className="btn btn-outline" onClick={onBack} disabled={loading} style={{ padding: '0.8rem 1.5rem' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #a855f7, #ec4899)', border: 'none' }}>
            {loading ? 'Processing...' : 'Register & Generate PIN ✨'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantRegister;
