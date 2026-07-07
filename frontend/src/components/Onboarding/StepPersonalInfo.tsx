import React from 'react';

interface StepProps {
  data: any;
  updateData: (data: any) => void;
}

const StepPersonalInfo: React.FC<StepProps> = ({ data, updateData }) => {
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
