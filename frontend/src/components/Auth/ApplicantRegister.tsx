import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../../api/client';

interface ApplicantRegisterProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

const ApplicantRegister: React.FC<ApplicantRegisterProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: 'Mr.',
    name: '',
    email: '',
    phone: '',
    hq: '',
    division: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/applicant/register', formData);
      if (res.data.success) {
        alert(`Registration successful! Your Secure PIN is: ${res.data.pin}`);
        onSuccess(formData.email);
      } else {
        setError(res.data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <div className="login-icon"><Sparkles /></div>
        <h2 className="premium-title">New Application</h2>
        <p>Fill these details to receive your 6-digit Login PIN.</p>
      </div>
      
      {error && <div style={{color: '#ef4444', textAlign: 'center', marginBottom: '1rem'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="registration-grid">
          <div className="form-row-compact">
            <div className="form-group col-title">
              <label>Title</label>
              <select value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
              </select>
            </div>
            <div className="form-group col-name">
              <label>Full Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Enter full name" />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="official@example.com" />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="10-digit number" />
          </div>
        </div>

        <div className="btn-group" style={{marginTop: '2rem'}}>
          <button type="button" className="btn btn-outline" onClick={onBack} disabled={loading}>Back</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Generate Secure PIN'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantRegister;
