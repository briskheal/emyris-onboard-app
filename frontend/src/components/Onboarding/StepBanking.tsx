import React from 'react';

interface StepProps {
  data: any;
  updateData: (data: any) => void;
}

const StepBanking: React.FC<StepProps> = ({ data, updateData }) => {
  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-light)' }}>Banking & Statutory Information</h3>
      
      <div className="registration-grid">
        <div className="form-group">
          <label>Bank Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.bankName || ''}
            onChange={e => updateData({ bankName: e.target.value })}
            placeholder="e.g. HDFC Bank"
          />
        </div>
        <div className="form-group">
          <label>Account Number</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.accountNumber || ''}
            onChange={e => updateData({ accountNumber: e.target.value })}
            placeholder="Account Number"
          />
        </div>
        <div className="form-group">
          <label>IFSC Code</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.ifscCode || ''}
            onChange={e => updateData({ ifscCode: e.target.value })}
            placeholder="IFSC Code"
          />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }}></div>

      <div className="registration-grid">
        <div className="form-group">
          <label>PAN Number</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.panNumber || ''}
            onChange={e => updateData({ panNumber: e.target.value })}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <div className="form-group">
          <label>Aadhar Number</label>
          <input 
            type="text" 
            className="form-input" 
            value={data.aadharNumber || ''}
            onChange={e => updateData({ aadharNumber: e.target.value })}
          />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }}></div>

      <div className="registration-grid">
        <div className="form-group">
          <label>UAN Number (If applicable)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 100123456789"
            value={data.uanNumber || ''}
            onChange={e => updateData({ uanNumber: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>EPF Number (If applicable)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. AB/123/456789"
            value={data.epfNumber || ''}
            onChange={e => updateData({ epfNumber: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>ESI Number (If applicable)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 1234567890"
            value={data.esiNumber || ''}
            onChange={e => updateData({ esiNumber: e.target.value })}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
        <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Almost Done!</h4>
        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0 }}>
          Please review all the information in the previous steps. Once you submit, you will be taken to the Document Upload and Qualification Exam sections.
        </p>
      </div>
    </div>
  );
};

export default StepBanking;
