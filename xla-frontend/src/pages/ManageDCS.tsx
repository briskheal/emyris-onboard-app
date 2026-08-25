import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManageDCS() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create_doctor' | 'create_chemist' | 'create_stockist' | 'edit_delete' | 'upload_dcs' | 'dcs_list_management'>('create_doctor');
  
  // Data
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docRes, chemRes, stkRes, ctrlRes, usrRes, hqRes, stateRes] = await Promise.all([
        axios.get('/api/admin/dcs/doctors'),
        axios.get('/api/admin/dcs/chemists'),
        axios.get('/api/admin/dcs/stockists'),
        axios.get('/api/admin/dcs/controls'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/locations/hqs'),
        axios.get('/api/admin/locations/states')
      ]);
      if(docRes.data.success) setDoctors(docRes.data.doctors);
      if(chemRes.data.success) setChemists(chemRes.data.chemists);
      if(stkRes.data.success) setStockists(stkRes.data.stockists);
      if(ctrlRes.data.success) setControls(ctrlRes.data.controls);
      if(usrRes.data.success) setUsers(usrRes.data.users);
      if(hqRes.data.success) setHqs(hqRes.data.hqs);
      if(stateRes.data.success) setStates(stateRes.data.states);
    } catch (e) { console.error(e); }
  };

  const getControls = (type: string) => controls.filter(c => c.type === type);

  // --- DOCTOR TAB ---
  const CreateDoctorTab = () => {
    const [formData, setFormData] = useState({
      name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '',
      mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '',
      headquarter: '', workingArea: '', address: '', extraInformation: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/dcs/doctors', formData);
        if(res.data.success) {
          alert('Doctor added successfully');
          fetchData();
          setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''});
        }
      } catch (e) { alert('Error adding doctor'); } finally { setLoading(false); }
    };

    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-wide uppercase">&lt; CREATE DOCTOR...</h2>
          <button className="text-sky-400 text-sm font-bold hover:underline">Do you want to add more Degrees and Specializations?</button>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">NAME *</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Doctor's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DEGREE *</label><select required value={formData.degree} onChange={e=>setFormData({...formData, degree: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Degree</option>{getControls('Degree').map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SPECIALIZATION *</label><select required value={formData.specialization} onChange={e=>setFormData({...formData, specialization: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Specialization</option>{getControls('Specialization').map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">HOSPITAL</label><select value={formData.hospital} onChange={e=>setFormData({...formData, hospital: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Hospital</option>{getControls('Hospital').map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BIRTHDAY</label><input type="date" value={formData.birthday} onChange={e=>setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">MARRIAGE ANNIVERSARY</label><input type="date" value={formData.anniversary} onChange={e=>setFormData({...formData, anniversary: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">MOBILE NUMBER *</label><input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Mobile Number" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CLINICS CONTACT NUMBER</label><input value={formData.clinicContact} onChange={e=>setFormData({...formData, clinicContact: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Alternate Number" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DOCTORS CODE</label><input value={formData.doctorCode} onChange={e=>setFormData({...formData, doctorCode: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Doctor Code" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMAIL</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Email Address" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CATEGORY *</label><select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Category</option>{getControls('Category').map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT USER TO ALLOT *</label><select required value={formData.userAllotted} onChange={e=>setFormData({...formData, userAllotted: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select User</option>{users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}</select></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ *</label><select required value={formData.headquarter} onChange={e=>setFormData({...formData, headquarter: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Headquarter</option>{hqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT WORKING AREA *</label><input required value={formData.workingArea} onChange={e=>setFormData({...formData, workingArea: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Working Area" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CLINICS ADDRESS</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Clinic Address" /></div>
            
            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">EXTRA INFORMATION</label><textarea value={formData.extraInformation} onChange={e=>setFormData({...formData, extraInformation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24" placeholder="Enter Extra Information" /></div>
          </div>
          <div><button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Add Doctor</button></div>
        </form>
      </div>
    );
  };

  // --- CHEMIST TAB ---
  const CreateChemistTab = () => {
    const [formData, setFormData] = useState({
      businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '',
      userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/dcs/chemists', formData);
        if(res.data.success) {
          alert('Chemist added successfully');
          fetchData();
          setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''});
        }
      } catch (e) { alert('Error adding chemist'); } finally { setLoading(false); }
    };

    return (
      <div className="flex-1 overflow-auto p-8">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE CHEMIST</h2>
        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BUSINESS NAME *</label><input required value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Chemist's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">PROPRIETOR NAME</label><input value={formData.proprietorName} onChange={e=>setFormData({...formData, proprietorName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Proprietor's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CERTIFICATIONS/TRADEMARKS</label><input value={formData.certifications} onChange={e=>setFormData({...formData, certifications: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Certification" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BIRTHDAY</label><input type="date" value={formData.birthday} onChange={e=>setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMAIL</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Email Address" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CHEMISTS CONTACT NUMBER *</label><input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Number" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT USER TO ALLOT *</label><select required value={formData.userAllotted} onChange={e=>setFormData({...formData, userAllotted: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select User</option>{users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}</select></div>
            <div className="md:col-span-2"><label className="text-xs text-slate-400 font-bold mb-1 block">CHEMISTS ADDRESS</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Clinic Address" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ *</label><select required value={formData.headquarter} onChange={e=>setFormData({...formData, headquarter: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Headquarter</option>{hqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT WORKING AREA *</label><input required value={formData.workingArea} onChange={e=>setFormData({...formData, workingArea: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Working Area" /></div>
            
            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">EXTRA INFORMATION</label><textarea value={formData.extraInformation} onChange={e=>setFormData({...formData, extraInformation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24" placeholder="Enter Extra Information" /></div>
          </div>
          <div><button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Add Chemist</button></div>
        </form>
      </div>
    );
  };

  // --- STOCKIST TAB ---
  const CreateStockistTab = () => {
    const [formData, setFormData] = useState({
      businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '',
      userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/dcs/stockists', formData);
        if(res.data.success) {
          alert('Stockist added successfully');
          fetchData();
          setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''});
        }
      } catch (e) { alert('Error adding stockist'); } finally { setLoading(false); }
    };

    return (
      <div className="flex-1 overflow-auto p-8">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE STOCKIST</h2>
        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BUSINESS NAME *</label><input required value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Stockist's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">NAME</label><input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Proprietor's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CERTIFICATIONS/TRADEMARKS</label><input value={formData.certifications} onChange={e=>setFormData({...formData, certifications: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Certification" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMAIL</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Email Address" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">GST NUMBER *</label><input required value={formData.gst} onChange={e=>setFormData({...formData, gst: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter GST" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DRUG LICENSE NUMBER *</label><input required value={formData.drugLicense} onChange={e=>setFormData({...formData, drugLicense: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter DL" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DRUG EXPIRY DATE</label><input type="date" value={formData.drugExpiryDate} onChange={e=>setFormData({...formData, drugExpiryDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">ESTABLISHMENT DATE</label><input type="date" value={formData.establishmentDate} onChange={e=>setFormData({...formData, establishmentDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">STOCKISTS CONTACT NUMBER *</label><input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Number" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT USER TO ALLOT *</label><select required value={formData.userAllotted} onChange={e=>setFormData({...formData, userAllotted: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select User</option>{users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}</select></div>
            <div className="md:col-span-2"><label className="text-xs text-slate-400 font-bold mb-1 block">STOCKISTS ADDRESS</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Clinic Address" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ *</label><select required value={formData.headquarter} onChange={e=>setFormData({...formData, headquarter: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Headquarter</option>{hqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT WORKING AREA *</label><input required value={formData.workingArea} onChange={e=>setFormData({...formData, workingArea: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Working Area" /></div>
            
            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">EXTRA INFORMATION</label><textarea value={formData.extraInformation} onChange={e=>setFormData({...formData, extraInformation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24" placeholder="Enter Extra Information" /></div>
          </div>
          <div><button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Add Stockist</button></div>
        </form>
      </div>
    );
  };

  // --- EDIT / DELETE TAB ---
  const EditDeleteTab = () => {
    const [filterType, setFilterType] = useState('Doctor');
    const [filterHq, setFilterHq] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    let displayList: any[] = [];
    if (filterType === 'Doctor') displayList = doctors;
    if (filterType === 'Chemist') displayList = chemists;
    if (filterType === 'Stockist') displayList = stockists;

    if (filterState) {
      const hqsInState = hqs.filter(h => h.state === filterState).map(h => h.hqName);
      displayList = displayList.filter(d => hqsInState.includes(d.headquarter));
    }
    if (filterHq) displayList = displayList.filter(d => d.headquarter === filterHq);
    if (filterUser) displayList = displayList.filter(d => d.userAllotted === filterUser);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      displayList = displayList.filter(d => 
        (d.name || d.businessName || '').toLowerCase().includes(q) ||
        (d.uid || '').toLowerCase().includes(q) ||
        (d.mobile || '').toLowerCase().includes(q)
      );
    }

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedIds(displayList.map(d => d._id));
      else setSelectedIds([]);
    };

    const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
      else setSelectedIds([...selectedIds, id]);
    };

    const handleDelete = async (id: string) => {
      if(!window.confirm('Delete this record?')) return;
      try {
        await axios.delete(`/api/admin/dcs/${filterType.toLowerCase()}s/${id}`);
        fetchData();
      } catch (e) { alert('Error deleting record'); }
    };

    const handleBatchDelete = async () => {
      if (selectedIds.length === 0) return alert('Select records to delete');
      if(!window.confirm(`Delete ${selectedIds.length} records?`)) return;
      try {
        // We delete sequentially for now to simplify
        for (const id of selectedIds) {
          await axios.delete(`/api/admin/dcs/${filterType.toLowerCase()}s/${id}`);
        }
        setSelectedIds([]);
        fetchData();
      } catch (e) { alert('Error deleting records'); }
    };

    return (
      <div className="flex-1 overflow-auto p-8 relative z-10 flex flex-col">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; EDIT / DELETE</h2>
        
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col p-6 flex-1">
          <p className="text-sm text-sky-400 mb-6 font-semibold bg-sky-900/30 p-4 rounded-lg inline-block w-fit">Deleting a DCS from here will also remove it from the list.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT TYPE</label><select value={filterType} onChange={e=>{setFilterType(e.target.value); setSelectedIds([]);}} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="Doctor">Doctor</option><option value="Chemist">Chemist</option><option value="Stockist">Stockist</option></select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT STATE</label><select value={filterState} onChange={e=>setFilterState(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">All States</option>{states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ</label><select value={filterHq} onChange={e=>setFilterHq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">All Headquarters</option>{hqs.filter(h => !filterState || h.state === filterState).map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT USER</label><select value={filterUser} onChange={e=>setFilterUser(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">All Users</option>{users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}</select></div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300">SEARCH:</span>
              <input type="text" placeholder="Search by name, uid..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white" />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[50vh] border border-slate-700 rounded-xl mb-4">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                  <th className="p-3 border-r border-slate-700 text-center w-12"><input type="checkbox" onChange={handleSelectAll} checked={displayList.length > 0 && selectedIds.length === displayList.length} className="cursor-pointer" /></th>
                  <th className="p-3 border-r border-slate-700 font-bold">Sr no.</th>
                  <th className="p-3 border-r border-slate-700 font-bold">Name</th>
                  {filterType === 'Doctor' && <th className="p-3 border-r border-slate-700 font-bold">Degree</th>}
                  {filterType === 'Doctor' && <th className="p-3 border-r border-slate-700 font-bold">Specialization</th>}
                  <th className="p-3 border-r border-slate-700 font-bold">Mobile Number</th>
                  <th className="p-3 border-r border-slate-700 font-bold">HQ</th>
                  <th className="p-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">No data found</td></tr>
                ) : displayList.map((d, i) => (
                  <tr key={d._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 text-white text-sm">
                    <td className="p-3 border-r border-slate-700 text-center"><input type="checkbox" checked={selectedIds.includes(d._id)} onChange={() => handleSelectOne(d._id)} className="cursor-pointer" /></td>
                    <td className="p-3 border-r border-slate-700">{i + 1}</td>
                    <td className="p-3 border-r border-slate-700 font-semibold">{filterType==='Doctor'?d.name:d.businessName}</td>
                    {filterType === 'Doctor' && <td className="p-3 border-r border-slate-700 text-slate-300">{d.degree}</td>}
                    {filterType === 'Doctor' && <td className="p-3 border-r border-slate-700 text-slate-300">{d.specialization}</td>}
                    <td className="p-3 border-r border-slate-700">{d.mobile}</td>
                    <td className="p-3 border-r border-slate-700">{d.headquarter}</td>
                    <td className="p-3 text-center">
                      <button className="text-sky-400 hover:text-sky-300 mx-1"><Edit2 size={16} /></button>
                      <button onClick={()=>handleDelete(d._id)} className="text-rose-400 hover:text-rose-300 mx-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs font-black text-slate-400 tracking-widest">SHOWING ({displayList.length}) ENTRIES</span>
            {selectedIds.length > 0 && (
              <button onClick={handleBatchDelete} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-rose-500/50">
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- UPLOAD DCS TAB ---
  const UploadDCSTab = () => {
    const [uploadType, setUploadType] = useState('Doctor');
    const [uploadHq, setUploadHq] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const handleUpload = async () => {
      if (!uploadHq) return alert('Please select a Headquarter.');
      if (!uploadFile) return alert('Please select an Excel file.');
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', uploadType);
      formData.append('hq', uploadHq);
      
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/dcs/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          alert('Upload successful!');
          fetchData();
        } else {
          alert('Upload failed: ' + res.data.message);
        }
      } catch (e: any) {
        alert('Error uploading file: ' + (e.response?.data?.message || e.message));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex-1 overflow-auto p-8 relative z-10">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; UPLOAD DOCTOR / CHEMIST / STOCKIST / CITY OR AREA</h2>
        
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl p-8 mb-8">
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-4xl bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            The UID is a system-generated unique identifier assigned to each entity (for example, DOC1, HOS1, CTY1). These UIDs are automatically created by the system and are used to uniquely identify records. You can find the UID for a specific entity in its corresponding list or management section within the system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block">SELECT TYPE *</label>
              <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="Doctor">Doctor</option>
                <option value="Chemist">Chemist</option>
                <option value="Stockist">Stockist</option>
                <option value="CityOrArea">CityOrArea</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block">SELECT HQ *</label>
              <select value={uploadHq} onChange={e => setUploadHq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Headquarter</option>
                {hqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block">UPLOAD EXCEL *</label>
              <input type="file" accept=".xlsx,.csv" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30" />
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <button onClick={handleUpload} disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"><Upload size={20}/> Upload List</button>
            <button className="text-emerald-400 font-semibold text-sm hover:underline border border-emerald-500/30 px-6 py-3 rounded-lg hover:bg-emerald-500/10 transition-colors">Download Format</button>
          </div>
        </div>
      </div>
    );
  };

  // --- DCS LIST MANAGEMENT TAB ---
  const ListManagementTab = () => {
    const [subTab, setSubTab] = useState('');
    
    if(!subTab) return (
      <div className="flex-1 overflow-auto p-8 relative z-10">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; DOC / CHEM / STK LIST MANAGEMENT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button onClick={()=>setSubTab('allot')} className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group">
            <div className="w-20 h-20 bg-slate-700 group-hover:bg-sky-500/20 rounded-full flex items-center justify-center transition-colors"><Users size={32} className="text-white group-hover:text-sky-400" /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">ALLOT DCS</h3>
          </button>
          <button onClick={()=>setSubTab('deallot')} className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group">
            <div className="w-20 h-20 bg-slate-700 group-hover:bg-rose-500/20 rounded-full flex items-center justify-center transition-colors"><UserMinus size={32} className="text-white group-hover:text-rose-400" /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">DE-ALLOT DCS</h3>
          </button>
          <button onClick={()=>setSubTab('transfer')} className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group">
            <div className="w-20 h-20 bg-slate-700 group-hover:bg-emerald-500/20 rounded-full flex items-center justify-center transition-colors"><ArrowRightLeft size={32} className="text-white group-hover:text-emerald-400" /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">TRANSFER DCS</h3>
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex-1 overflow-auto p-8 relative z-10">
        <button onClick={()=>setSubTab('')} className="text-sky-400 font-bold mb-8 hover:underline">&lt; BACK TO MANAGEMENT</button>
        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
          <p className="text-slate-400 mb-6">List assignment workflows (Allot, De-allot, Transfer) interface placeholder.</p>
          <div className="flex justify-center gap-6 opacity-50 pointer-events-none">
            <select className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white w-64"><option>Select Source User...</option></select>
            <select className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white w-64"><option>Select Target User...</option></select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
      </div>
      
      <div className="w-80 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl">
        <div className="p-8 border-b border-slate-800 flex flex-col gap-4">
          <button onClick={() => navigate('/admin')} className="text-sky-400 hover:text-white transition-colors flex items-center gap-2 w-fit font-bold text-sm uppercase tracking-wider">
            <ArrowLeft size={18} /> Back to Admin Panel
          </button>
          <h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE DOCTORS, STOCKISTS & CHEMISTS</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4 text-xs font-bold tracking-wider">
            {[
              { id: 'create_doctor', label: 'CREATE DOCTORS' },
              { id: 'create_chemist', label: 'CREATE CHEMISTS' },
              { id: 'create_stockist', label: 'CREATE STOCKISTS' },
              { id: 'edit_delete', label: 'EDIT / DELETE' },
              { id: 'upload_dcs', label: 'UPLOAD DCS CITY / AREA' },
              { id: 'dcs_list_management', label: 'DCS LIST MANAGEMENT' }
            ].map(tab => (
              <li key={tab.id}>
                <button onClick={() => setActiveTab(tab.id as any)} className={`w-full text-left px-5 py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {activeTab === 'create_doctor' && <CreateDoctorTab />}
      {activeTab === 'create_chemist' && <CreateChemistTab />}
      {activeTab === 'create_stockist' && <CreateStockistTab />}
      {activeTab === 'edit_delete' && <EditDeleteTab />}
      {activeTab === 'upload_dcs' && <UploadDCSTab />}
      {activeTab === 'dcs_list_management' && <ListManagementTab />}
    </div>
  );
}
