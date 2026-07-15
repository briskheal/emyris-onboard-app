import { useState } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import api from '../../api/client';

interface ExistingStaffModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExistingStaffModal({ onClose, onSuccess }: ExistingStaffModalProps) {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', dob: '', pin: '', city: '', customPin: '', state: '', address: '',
    empCode: '', designation: '', division: '', reportingTo: '', hq: '', actualJoiningDate: '',
    salary: '', epfNumber: '', uanNumber: '', esiNumber: '', bankName: '', accountNumber: '', ifscCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingPin, setFetchingPin] = useState(false);

  const generatePin = () => {
    setFormData({ ...formData, customPin: Math.floor(100000 + Math.random() * 900000).toString() });
  };

  const handlePinChange = async (pinValue: string) => {
    setFormData(prev => ({ ...prev, pin: pinValue }));
    if (pinValue.length === 6 && /^\d{6}$/.test(pinValue)) {
      setFetchingPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinValue}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
          const details = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            pin: pinValue,
            city: prev.city || details.District || details.Name || '',
            state: details.State || prev.state || ''
          }));
        }
      } catch (err) {
        console.warn('Pincode fetch error:', err);
      } finally {
        setFetchingPin(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        targetSalary: formData.salary,
        joinDate: formData.actualJoiningDate,
        customPin: formData.customPin || Math.floor(100000 + Math.random() * 900000).toString(),
        accNo: formData.accountNumber,
        ifsc: formData.ifscCode
      };
      const res = await api.post('/admin/add-existing-staff', payload);
      if (res.data.success) {
        alert('Staff added successfully');
        onSuccess();
      } else {
        alert(res.data.message || 'Failed to add staff');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Network error while adding staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div className="dash-card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Add Existing Staff</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Full Name *</label><input type="text" className="form-input" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
              <div><label className="form-label">Email *</label><input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label className="form-label">Phone *</label><input type="text" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="form-label">DOB</label><input type="date" className="form-input" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
              <div>
                <label className="form-label">Pincode {fetchingPin && <span style={{fontSize:'0.75rem', color:'#10b981'}}>Checking...</span>}</label>
                <input type="text" className="form-input" maxLength={6} placeholder="6-digit PIN" value={formData.pin} onChange={e => handlePinChange(e.target.value)} />
              </div>
              <div><label className="form-label">City / District</label><input type="text" className="form-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}><label className="form-label">State</label><input type="text" className="form-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 4' }}><label className="form-label">Address</label><textarea className="form-input" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Employment Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Employee Code *</label><input type="text" className="form-input" required value={formData.empCode} onChange={e => setFormData({...formData, empCode: e.target.value})} /></div>
              <div><label className="form-label">Designation</label><input type="text" className="form-input" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              <div><label className="form-label">Division</label><input type="text" className="form-input" value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} /></div>
              <div><label className="form-label">Reporting To</label><input type="text" className="form-input" value={formData.reportingTo} onChange={e => setFormData({...formData, reportingTo: e.target.value})} /></div>
              <div><label className="form-label">HQ</label><input type="text" className="form-input" value={formData.hq} onChange={e => setFormData({...formData, hq: e.target.value})} /></div>
              <div><label className="form-label">Date of Joining</label><input type="date" className="form-input" value={formData.actualJoiningDate} onChange={e => setFormData({...formData, actualJoiningDate: e.target.value})} /></div>
              <div><label className="form-label">Annual CTC (Rs)</label><input type="number" className="form-input" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Portal Access PIN (6 Digits)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" className="form-input" value={formData.customPin} onChange={e => setFormData({...formData, customPin: e.target.value})} placeholder="6-digit PIN" />
                  <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }} onClick={generatePin}>
                    <RefreshCw size={16} /> <span>🎲 Auto-Generate PIN</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> {loading ? 'Saving...' : 'Fast-Track Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
