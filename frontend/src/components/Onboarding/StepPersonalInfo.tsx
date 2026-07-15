import React, { useState } from 'react';

interface StepProps {
  data: any;
  updateData: (data: any) => void;
}

const StepPersonalInfo: React.FC<StepProps> = ({ data, updateData }) => {
  const [fetchingPin, setFetchingPin] = useState(false);

  const handlePinChange = async (pinVal: string) => {
    updateData({ pin: pinVal });
    if (pinVal.length === 6 && /^\d{6}$/.test(pinVal)) {
      setFetchingPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinVal}`);
        const resData = await res.json();
        if (resData && resData[0] && resData[0].Status === 'Success' && resData[0].PostOffice && resData[0].PostOffice[0]) {
          const details = resData[0].PostOffice[0];
          updateData({
            pin: pinVal,
            city: data.city || details.District || details.Name || '',
            state: details.State || data.state || ''
          });
        }
      } catch (err) {
        console.warn('Pincode fetch error:', err);
      } finally {
        setFetchingPin(false);
      }
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-light)' }}>Personal Details</h3>
      <div className="registration-grid">
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            value={data.fullName || ''} 
            disabled 
            className="form-input" 
            style={{ opacity: 0.7 }}
          />
          <small style={{ color: 'var(--text-muted)' }}>Name cannot be changed after registration.</small>
        </div>
        
        <div className="form-group">
          <label>Date of Birth</label>
          <input 
            type="date" 
            className="form-input" 
            value={data.dob || ''}
            onChange={e => updateData({ dob: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Blood Group</label>
          <select 
            className="form-input" 
            value={data.bloodGroup || ''}
            onChange={e => updateData({ bloodGroup: e.target.value })}
          >
            <option value="">-- Select --</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div className="form-group">
          <label>Marital Status</label>
          <select 
            className="form-input" 
            value={data.maritalStatus || 'Unmarried'}
            onChange={e => updateData({ maritalStatus: e.target.value })}
          >
            <option value="Unmarried">Unmarried</option>
            <option value="Married">Married</option>
          </select>
        </div>

        {data.maritalStatus === 'Married' && (
          <div className="form-group">
            <label>Anniversary Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={data.anniversaryDate || ''}
              onChange={e => updateData({ anniversaryDate: e.target.value })}
            />
          </div>
        )}
      </div>

      <h3 style={{ margin: '2rem 0 1.5rem 0', color: 'var(--primary-light)' }}>Residential Location & Contact</h3>
      <div className="registration-grid">
        <div className="form-group">
          <label>Pincode (Postal Code) * {fetchingPin && <span style={{fontSize:'0.75rem', color:'#10b981'}}>Checking...</span>}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              maxLength={6} 
              className="form-input" 
              value={data.pin || ''}
              onChange={e => handlePinChange(e.target.value)}
              placeholder="6-digit PIN"
            />
            <button 
              type="button" 
              onClick={() => handlePinChange(data.pin || '')} 
              className="btn btn-outline" 
              style={{ padding: '0 12px', whiteSpace: 'nowrap', fontWeight: 'bold' }}
              title="Auto-fetch City and State from PIN"
            >
              📍 Fetch PIN
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>City / Town</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.city || ''}
            onChange={e => updateData({ city: e.target.value })}
            placeholder="City"
          />
        </div>
        <div className="form-group">
          <label>State / Province</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.state || ''}
            onChange={e => updateData({ state: e.target.value })}
            placeholder="State"
          />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label>Complete Postal Address</label>
          <textarea 
            rows={2} 
            className="form-input" 
            value={data.address || ''}
            onChange={e => updateData({ address: e.target.value })}
            placeholder="House No, Street, Landmark"
          />
        </div>
      </div>

      <h3 style={{ margin: '2rem 0 1.5rem 0', color: 'var(--primary-light)' }}>Emergency Contact</h3>
      <div className="registration-grid">
        <div className="form-group">
          <label>Contact Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.emergencyName || ''}
            onChange={e => updateData({ emergencyName: e.target.value })}
            placeholder="Name"
          />
        </div>
        <div className="form-group">
          <label>Contact Number</label>
          <input 
            type="tel" 
            className="form-input" 
            value={data.emergencyPhone || ''}
            onChange={e => updateData({ emergencyPhone: e.target.value })}
            placeholder="10-digit number"
          />
        </div>
      </div>
    </div>
  );
};

export default StepPersonalInfo;
