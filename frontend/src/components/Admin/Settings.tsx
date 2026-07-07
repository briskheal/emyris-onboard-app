import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const Settings: React.FC = () => {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get('/admin/company');
        if (res.data.success) {
          setCompany(res.data.company);
        }
      } catch (err) {
        console.error("Failed to load company", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  return (
    <div className="dash-card">
      <h2>Platform Settings</h2>
      
      {loading ? (
        <div style={{ padding: '2rem' }}>Loading configuration...</div>
      ) : (
        <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
          <div className="form-group">
            <label>Company Name</label>
            <input type="text" value={company?.name || ''} readOnly className="form-input-sm" style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input type="email" value={company?.adminEmail || ''} readOnly className="form-input-sm" style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label>Active Exam Product</label>
            <input type="text" value={company?.activeExamProduct || 'General'} readOnly className="form-input-sm" style={{ opacity: 0.7 }} />
          </div>
          
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: 'fit-content' }}>Edit Configuration</button>
        </div>
      )}
    </div>
  );
};

export default Settings;
