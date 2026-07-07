import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface StepProps {
  data: any;
  updateData: (data: any) => void;
}

const StepExperience: React.FC<StepProps> = ({ data, updateData }) => {
  const experiences = data.experience || [];
  const salaryBreakup = data.salaryBreakup || { currentCTC: '', expectedCTC: '', inHand: '' };

  const addExperience = () => {
    updateData({ experience: [...experiences, { company: '', designation: '', duration: '' }] });
  };

  const removeExperience = (index: number) => {
    const newExp = [...experiences];
    newExp.splice(index, 1);
    updateData({ experience: newExp });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...experiences];
    newExp[index] = { ...newExp[index], [field]: value };
    updateData({ experience: newExp });
  };

  const updateSalary = (field: string, value: string) => {
    updateData({ salaryBreakup: { ...salaryBreakup, [field]: value } });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--primary-light)', margin: 0 }}>Previous Employment</h3>
        <button className="btn btn-sm btn-outline" onClick={addExperience} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={16} /> Add Experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No previous experience added. (Fresher)</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {experiences.map((exp: any, idx: number) => (
            <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--accent)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Company Name</label>
                  <input type="text" className="form-input-sm" value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Designation</label>
                  <input type="text" className="form-input-sm" value={exp.designation} onChange={e => updateExperience(idx, 'designation', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration (e.g. 2 Years)</label>
                  <input type="text" className="form-input-sm" value={exp.duration} onChange={e => updateExperience(idx, 'duration', e.target.value)} />
                </div>
              </div>
              <button className="btn btn-sm btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => removeExperience(idx)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-light)' }}>Salary Details</h3>
      <div className="registration-grid">
        <div className="form-group">
          <label>Current CTC (₹)</label>
          <input type="number" className="form-input" value={salaryBreakup.currentCTC} onChange={e => updateSalary('currentCTC', e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label>Expected CTC (₹)</label>
          <input type="number" className="form-input" value={salaryBreakup.expectedCTC} onChange={e => updateSalary('expectedCTC', e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label>Current In-Hand Salary (₹)</label>
          <input type="number" className="form-input" value={salaryBreakup.inHand} onChange={e => updateSalary('inHand', e.target.value)} placeholder="0" />
        </div>
      </div>
    </div>
  );
};

export default StepExperience;
