import React, { useState } from 'react';
import { Key } from 'lucide-react';
import api from '../../api/client';

interface ApplicantLoginProps {
  onBack: () => void;
  onSuccess: (applicantData: any) => void;
}

const ApplicantLogin: React.FC<ApplicantLoginProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/applicant/login', { email, pin });
      if (res.data.success) {
        onSuccess(res.data.applicant);
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <div className="login-icon"><Key /></div>
        <h2 className="premium-title">Resume Application</h2>
        <p>Enter your Email and 6-digit PIN to continue.</p>
      </div>

      {error && <div style={{color: '#ef4444', textAlign: 'center', marginBottom: '1rem'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            required 
            placeholder="Enter your registered email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Secure PIN</label>
          <input 
            type="password" 
            required 
            placeholder="6-digit PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
          />
        </div>

        <div className="btn-group" style={{marginTop: '2rem'}}>
          <button type="button" className="btn btn-outline" onClick={onBack} disabled={loading}>Back</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantLogin;
