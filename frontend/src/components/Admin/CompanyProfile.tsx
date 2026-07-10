import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Building2 } from 'lucide-react';
import api from '../../api/client';

export default function CompanyProfile() {
  const [profile, setProfile] = useState<any>({
    name: '',
    website: '',
    phone: '',
    tollFree: '',
    email: '',
    address: '',
    marqueeText: '',
    marqueeColor: '#94a3b8',
    marqueeSpeed: 20,
    designations: [],
    targetProductsList: []
  });

  const [divisions, setDivisions] = useState<{ name: string }[]>([]);
  const [hqs, setHQs] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Temporary state for dynamic lists
  const [newDivision, setNewDivision] = useState('');
  const [newHq, setNewHq] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newDesignationTitle, setNewDesignationTitle] = useState('');
  const [newDesignationDept, setNewDesignationDept] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/company-profile');
      if (res.data) {
        const comp = res.data.company || res.data;
        setProfile({
          ...comp,
          designations: comp.designations || [],
          targetProductsList: comp.targetProductsList || []
        });
        setDivisions(res.data.divisions || comp.divisions || []);
        setHQs(res.data.hqs || comp.hqs || []);
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/company-profile', {
        ...profile,
        divisions,
        hqs
      });
      alert('Company Profile Saved Successfully!');
    } catch (e) {
      console.error('Failed to save profile', e);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addDivision = async () => {
    if (!newDivision.trim()) return;
    try {
      await api.post('/admin/divisions', { name: newDivision.trim() });
      setNewDivision('');
      fetchProfile();
    } catch (e) { alert('Failed to add division'); }
  };

  const removeDivision = async (index: number) => {
    const div = divisions[index] as any;
    try {
      if (div._id) await api.delete(`/admin/divisions/${div._id}`);
      fetchProfile();
    } catch (e) { alert('Failed to remove division'); }
  };

  const addHq = async () => {
    if (!newHq.trim()) return;
    try {
      await api.post('/admin/hqs', { name: newHq.trim() });
      setNewHq('');
      fetchProfile();
    } catch (e) { alert('Failed to add HQ'); }
  };

  const removeHq = async (index: number) => {
    const hq = hqs[index] as any;
    try {
      if (hq._id) await api.delete(`/admin/hqs/${hq._id}`);
      fetchProfile();
    } catch (e) { alert('Failed to remove HQ'); }
  };

  const addProduct = () => {
    if (!newProduct.trim()) return;
    setProfile({ ...profile, targetProductsList: [...profile.targetProductsList, newProduct.trim()] });
    setNewProduct('');
  };

  const removeProduct = (index: number) => {
    setProfile({
      ...profile,
      targetProductsList: profile.targetProductsList.filter((_: any, i: number) => i !== index)
    });
  };

  const addDesignation = () => {
    if (!newDesignationTitle.trim() || !newDesignationDept.trim()) return;
    setProfile({
      ...profile,
      designations: [...profile.designations, { title: newDesignationTitle.trim(), department: newDesignationDept.trim() }]
    });
    setNewDesignationTitle('');
  };

  const removeDesignation = (index: number) => {
    setProfile({
      ...profile,
      designations: profile.designations.filter((_: any, i: number) => i !== index)
    });
  };

  if (loading) return <div>Loading Company Profile...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={24} color="var(--primary)" /> Company Profile
        </h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Basic Identity */}
        <div className="dash-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Core Identity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Company Name</label>
              <input type="text" className="form-input" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Website URL</label>
                <input type="text" className="form-input" value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Contact No</label>
                <input type="text" className="form-input" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Toll Free No</label>
                <input type="text" className="form-input" value={profile.tollFree} onChange={e => setProfile({...profile, tollFree: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="form-label">Registered Address</label>
              <textarea className="form-input" rows={3} value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})}></textarea>
            </div>
          </div>
        </div>

        {/* Marquee Settings */}
        <div className="dash-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Applicant Portal Marquee</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Scrolling Message Text</label>
              <input type="text" className="form-input" value={profile.marqueeText} onChange={e => setProfile({...profile, marqueeText: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Text Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" value={profile.marqueeColor} onChange={e => setProfile({...profile, marqueeColor: e.target.value})} style={{ height: '38px', width: '50px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '4px' }} />
                  <input type="text" className="form-input" value={profile.marqueeColor} onChange={e => setProfile({...profile, marqueeColor: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Scroll Speed (Seconds)</label>
                <input type="number" className="form-input" value={profile.marqueeSpeed} onChange={e => setProfile({...profile, marqueeSpeed: parseInt(e.target.value) || 20})} />
              </div>
            </div>
          </div>
        </div>

        {/* Counters Settings */}
        <div className="dash-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Financial Year & Letter Counters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Offer Counter</label>
              <input type="number" className="form-input" value={profile.offerCounter || 0} onChange={e => setProfile({...profile, offerCounter: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="form-label">Appt Counter</label>
              <input type="number" className="form-input" value={profile.apptCounter || 0} onChange={e => setProfile({...profile, apptCounter: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="form-label">Misc Counter</label>
              <input type="number" className="form-input" value={profile.miscCounter || 0} onChange={e => setProfile({...profile, miscCounter: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="form-label">EmpCode Counter</label>
              <input type="number" className="form-input" value={profile.empCodeCounter || 0} onChange={e => setProfile({...profile, empCodeCounter: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="form-label">Revised Sal Counter</label>
              <input type="number" className="form-input" value={profile.revisedSalaryCounter || 0} onChange={e => setProfile({...profile, revisedSalaryCounter: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        </div>

        {/* Divisions & HQs */}
        <div className="dash-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Operational Structure</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Divisions</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" className="form-input" placeholder="New Division Name" value={newDivision} onChange={e => setNewDivision(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDivision()} />
              <button className="btn btn-primary" onClick={addDivision}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {divisions.map((d, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {d.name} <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeDivision(i)} />
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Headquarters (HQs)</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" className="form-input" placeholder="New HQ Location" value={newHq} onChange={e => setNewHq(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHq()} />
              <button className="btn btn-primary" onClick={addHq}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {hqs.map((hq, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {hq.name} <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeHq(i)} />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Designations & Target Products */}
        <div className="dash-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Roles & Targets</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Designations</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" className="form-input" placeholder="Title" value={newDesignationTitle} onChange={e => setNewDesignationTitle(e.target.value)} />
              <input type="text" className="form-input" placeholder="Department" value={newDesignationDept} onChange={e => setNewDesignationDept(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDesignation()} />
              <button className="btn btn-primary" onClick={addDesignation}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.designations.map((d: any, i: number) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {d.title} ({d.department}) <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeDesignation(i)} />
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Target Products (Test Bank)</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" className="form-input" placeholder="Product Name" value={newProduct} onChange={e => setNewProduct(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProduct()} />
              <button className="btn btn-primary" onClick={addProduct}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.targetProductsList.map((prod: string, i: number) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {prod} <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeProduct(i)} />
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
