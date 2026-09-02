import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit, Save, RefreshCw, Key, Mail , Eye, ArrowRightLeft, Check, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TransferDataModal from '../components/TransferDataModal';

// Reusable Table Footer Component
function TableFooter({ data, fileName, currentPage, setCurrentPage, pageSize, setPageSize }: any) {
  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const handleExport = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter(k => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k));
    const csvContent = [
      keys.join(','),
      ...data.map((row: any) => keys.map(k => `"${row[k] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  return (
    <div className="flex flex-wrap items-center justify-between bg-slate-800 p-4 border-t border-slate-700">
      <div className="flex items-center gap-4">
        <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">Export to CSV</button>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
          <span>Show</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 focus:outline-none">
            {[10, 25, 50, 100, 1000].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>records</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">&lt; Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">Next &gt;</button>
      </div>
    </div>
  );
}

// Placeholder for missing tabs
function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
      <h2 className="text-xl font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</h2>
      <p className="text-slate-400 uppercase tracking-wider text-sm">Module in Development</p>
    </div>
  );
}

export default function ManageUsers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'create_user' | 'create_admin' | 'user_info' | 'edit_delete' | 'admin_info' | 
    'divisions' | 'designations' | 'set_target' | 'upload_target' | 
    'access_control' | 'user_devices' | 'ta_da'
  >('create_user');
  
  return (
    <div className="h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
      <div className="flex items-center gap-4 px-8 py-5 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
          <ArrowLeft size={24} /> <span className="font-bold text-lg tracking-wide uppercase">Back to Admin Menu</span>
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 bg-slate-800/50 border-r border-slate-800 flex flex-col py-6 overflow-y-auto">
          <h2 className="px-6 text-emerald-400 font-black text-xl tracking-wider mb-6 uppercase">Manage Users</h2>
          <div className="flex flex-col space-y-2 px-4">
            <button onClick={() => setActiveTab('create_user')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'create_user' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>CREATE USER</button>
            <button onClick={() => setActiveTab('create_admin')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'create_admin' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>CREATE ADMIN</button>
            <button onClick={() => setActiveTab('user_info')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'user_info' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>USER INFO</button>
            <button onClick={() => setActiveTab('edit_delete')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'edit_delete' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>EDIT / DELETE</button>
            <button onClick={() => setActiveTab('admin_info')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'admin_info' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>ADMIN INFO</button>
            <button onClick={() => setActiveTab('divisions')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'divisions' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>MANAGE DIVISIONS</button>
            <button onClick={() => setActiveTab('designations')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'designations' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>MANAGE DESIGNATIONS</button>
            <button onClick={() => setActiveTab('set_target')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'set_target' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>SET USER TARGET</button>
            <button onClick={() => setActiveTab('upload_target')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'upload_target' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>UPLOAD TARGET</button>
            <button onClick={() => setActiveTab('access_control')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'access_control' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>ACCESS CONTROL</button>
            <button onClick={() => setActiveTab('user_devices')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'user_devices' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>USER DEVICES</button>
            <button onClick={() => setActiveTab('ta_da')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'ta_da' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>TA, DA MANAGE</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-900 p-8 overflow-y-auto">
          {activeTab === 'create_user' && <CreateProfileTab isAdmin={false} />}
          {activeTab === 'create_admin' && <CreateProfileTab isAdmin={true} />}
          {activeTab === 'user_info' && <ProfileInfoTab isAdmin={false} />}
          {activeTab === 'edit_delete' && <EditDeleteTab />}
          {activeTab === 'admin_info' && <ProfileInfoTab isAdmin={true} />}
          {activeTab === 'divisions' && <DivisionsTab />}
          {activeTab === 'designations' && <DesignationsTab />}
          {activeTab === 'set_target' && <SetTargetTab />}
          {activeTab === 'upload_target' && <PlaceholderTab title="Upload Target" />}
          {activeTab === 'access_control' && <PlaceholderTab title="Access Control" />}
          {activeTab === 'user_devices' && <PlaceholderTab title="User Devices" />}
          {activeTab === 'ta_da' && <TADAManageTab />}
        </div>
      </div>
    </div>
  );
}

function CreateProfileTab({ isAdmin }: { isAdmin: boolean }) {
  const [formData, setFormData] = useState<any>({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });
  const [hqs, setHqs] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/locations/hqs'),
      axios.get('/api/admin/locations/designations'),
      axios.get('/api/admin/locations/divisions'),
      axios.get('/api/admin/applicants'),
      axios.get('/api/admin/users'),
      axios.get('/api/admin/admins')
    ]).then(([hqRes, dsgRes, divRes, appRes, usersRes, adminsRes]) => {
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
      if (dsgRes.data.success) setDesignations(dsgRes.data.designations);
      if (divRes.data.success) setDivisions(divRes.data.divisions);
      
      let existingEmails = new Set();
      if (usersRes?.data?.success && usersRes.data.users) usersRes.data.users.forEach((u: any) => existingEmails.add(u.email));
      if (adminsRes?.data?.success && adminsRes.data.admins) adminsRes.data.admins.forEach((u: any) => existingEmails.add(u.email));

      if (appRes?.data?.success) {
          setApplicants(appRes.data.applicants.filter((a: any) => (a.empCode || a.offerAccepted) && !existingEmails.has(a.email)));
      }
    }).catch(console.error);
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    
    // Auto-fill TA/DA based on Designation
    if (name === 'designation') {
      const selectedDsg = designations.find(d => d.designationName === value);
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
        dailyAllowance: selectedDsg?.dailyAllowance || prev.dailyAllowance || '',
        exStationAllowance: selectedDsg?.exStationAllowance || prev.exStationAllowance || '',
        outStationAllowance: selectedDsg?.outStationAllowance || prev.outStationAllowance || ''
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isAdmin ? '/api/admin/admins' : '/api/admin/users';
      const res = await axios.post(url, formData);
      if (res.data.success) {
        if (sendEmail && formData.email && formData.password) {
            alert(`LOGIN CREDENTIALS SHARED!\n\nCOMPANY: EMYRIS\nEMAIL: ${formData.email}\nPW: ${formData.password}\n\n(These are required to login to emyrishr.in/xl mobile portal)`);
        } else {
            alert('Created successfully!');
        }
        setFormData({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
    let pwd = "";
    for(let i=0; i<8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData((prev: any) => ({ ...prev, password: pwd }));
  };


  const handleImport = async (e: any) => {
    const email = e.target.value;
    if (!email) {
        setFormData({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });
        return;
    }
    try {
      const res = await axios.get('/api/admin/applicant/' + email);
      if (res.data.success) {
        const app = res.data.applicant;
        
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
        let pwd = "";
        for(let i=0; i<8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));

        const nameParts = (app.fullName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
        
        const rawHq = (app.hq || app.formData?.hq || '').trim();
        const matchedHq = hqs.find(h => h.hqName?.toLowerCase() === rawHq.toLowerCase())?.hqName || rawHq;

        const rawDsg = (app.designation || app.formData?.designation || '').trim();
        const matchedDsg = designations.find(d => d.designationName?.toLowerCase() === rawDsg.toLowerCase())?.designationName || rawDsg;

        const rawDiv = (app.division || app.formData?.division || '').trim();
        const matchedDiv = divisions.find(d => d.divisionName?.toLowerCase() === rawDiv.toLowerCase())?.divisionName || rawDiv;

        const rawRep = (app.reportingTo || app.formData?.reportingTo || '').trim();
        const matchedRep = designations.find(d => d.designationName?.toLowerCase() === rawRep.toLowerCase())?.designationName || rawRep;

        let da = '', ex = '', out = '';
        if (matchedDsg) {
            const dsg = designations.find(d => d.designationName === matchedDsg);
            if (dsg) {
                da = dsg.dailyAllowance || '';
                ex = dsg.exStationAllowance || '';
                out = dsg.outStationAllowance || '';
            }
        }

        setFormData((prev: any) => ({
            ...prev,
            firstName,
            middleName,
            lastName,
            email: app.email || '',
            phone: app.phone || '',
            dob: app.dob || app.formData?.dob || '',
            hq: matchedHq,
            designation: matchedDsg,
            division: matchedDiv,
            reportingManager: matchedRep,
            employeeId: app.empCode || app.formData?.empCode || '',
            doj: app.actualJoiningDate || app.formData?.joiningDate || '',
            streetAddress1: app.address || app.formData?.address || '',
            city: app.city || app.formData?.city || '',
            state: app.state || app.formData?.state || '',
            aadhar: app.formData?.aadharNumber || '',
            pan: app.formData?.panNumber || '',
            password: pwd,
            dailyAllowance: da || '',
            exStationAllowance: ex || '',
            outStationAllowance: out || ''
        }));
        
        alert('Applicant Data Imported Successfully! Please review and save.');
      }
    } catch(err) {
      console.error(err);
      alert('Failed to import applicant');
    }
  };

  // Hierarchy Logic: Level 1 is entry, Level 9 is higher.
  // Meaning Employee Level N can only report to Manager Level M where M > N
  const selectedLevel = designations.find(d => d.designationName === formData.designation)?.level || 0;
  const eligibleDesignations = designations.filter(d => d.level > selectedLevel);

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">&lt; CREATE USER PROFILE</h2>
      <form onSubmit={handleSubmit} className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-xl">

        {/* Import HR Applicant */}
        <div className="mb-10 bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-xl">
          <label className="text-xs text-emerald-400 font-bold mb-2 block flex items-center gap-2">
            IMPORT FROM HR SYSTEM (AUTO-FILL)
          </label>
          <select onChange={handleImport} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors">
            <option value="">-- Select Approved Applicant --</option>
            {applicants.map(a => <option key={a._id} value={a.email}>{a.fullName} ({a.email})</option>)}
          </select>
          <p className="text-xs text-emerald-300/70 mt-2">Selecting an applicant will instantly auto-fill their Name, Email, DOB, Phone, Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>
        </div>

        {/* Basic Info */}

        <div className="mb-10">
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">FIRST NAME *</label><input required name="firstName" value={formData.firstName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">MIDDLE NAME</label><input name="middleName" value={formData.middleName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">LAST NAME</label><input name="lastName" value={formData.lastName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">GENDER</label><select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">PHONE NUMBER *</label><input required name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
          </div>
        </div>

        {/* Login Credentials */}
        <div className="mb-10 bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
            <h3 className="text-amber-400 font-bold uppercase tracking-wider text-sm">Login Credentials</h3>
            <button type="button" onClick={generatePassword} className="text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1">
              <RefreshCw size={14} /> Auto-Generate
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 flex items-center gap-2">
                <Mail size={14} className="text-slate-500"/> LOGIN ID (EMAIL) *
              </label>
              <input type="email" required name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors" placeholder="user@company.com" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 flex items-center gap-2">
                <Key size={14} className="text-slate-500"/> PASSWORD *
              </label>
              <input type="text" required name="password" value={formData.password || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-amber-400 font-mono focus:border-amber-500 focus:outline-none transition-colors" placeholder="Click Auto-Generate" />
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="mb-10">
          <h3 className="text-sky-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DATE OF BIRTH</label><input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">HEADQUARTER</label><select name="hq" value={formData.hq || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select HQ</option>{hqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DESIGNATION</label><select name="designation" value={formData.designation || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Designation</option>{designations.map(d => <option key={d._id} value={d.designationName}>{d.designationName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DIVISION</label><select name="division" value={formData.division || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Division</option>{divisions.map(d => <option key={d._id} value={d.divisionName}>{d.divisionName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMPLOYEE ID</label><input name="employeeId" value={formData.employeeId || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DATE OF JOINING</label><input type="date" name="doj" value={formData.doj || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">REPORTING MANAGER</label>
              <select name="reportingManager" value={formData.reportingManager || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Designation</option>
                {eligibleDesignations.map(d => <option key={d._id} value={d.designationName}>{d.designationName}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">AADHAR NUMBER</label><input name="aadhar" value={formData.aadhar || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">PAN NUMBER</label><input name="pan" value={formData.pan || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
          </div>
        </div>

        {/* Allowances */}
        <div>
          <h3 className="text-emerald-400 font-bold mb-4 uppercase text-sm tracking-wider border-b border-slate-700 pb-2">Allowances</h3>
          <div className="grid grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DAILY ALLOWANCE</label><input type="number" name="dailyAllowance" value={formData.dailyAllowance || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EX-STATION ALLOWANCE</label><input type="number" name="exStationAllowance" value={formData.exStationAllowance || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">OUT-STATION ALLOWANCE</label><input type="number" name="outStationAllowance" value={formData.outStationAllowance || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-emerald-400 font-bold mb-4 uppercase text-sm tracking-wider border-b border-slate-700 pb-2">Address</h3>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">STREET ADDRESS 1</label><input name="streetAddress1" value={formData.streetAddress1 || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">STREET ADDRESS 2</label><input name="streetAddress2" value={formData.streetAddress2 || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CITY</label><input name="city" value={formData.city || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">STATE</label><input name="state" value={formData.state || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full pt-4 border-t border-slate-700">
            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <input type="checkbox" id="sendEmail" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-5 h-5 accent-sky-500 cursor-pointer" />
              <label htmlFor="sendEmail" className="text-sm font-bold text-sky-400 cursor-pointer select-none tracking-wide">
                Send Login Details to Employee's Email ?
              </label>
            </div>
            <div className="flex gap-4">
          <button type="button" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Save As Draft</button>
          <button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
        </div>
      </form>
    </div>
  );
}

function ProfileInfoTab({ isAdmin }: { isAdmin: boolean }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewUser, setViewUser] = useState<any>(null);
  const [activationMode, setActivationMode] = useState(false);

  const fetchProfiles = async () => {
    try {
      const url = isAdmin ? '/api/admin/admins' : '/api/admin/users';
      const res = await axios.get(url);
      if (res.data.success) setProfiles(isAdmin ? res.data.admins : res.data.users);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
      const url = isAdmin ? `/api/admin/admins/${id}` : `/api/admin/users/${id}`;
      const res = await axios.put(url, { status: newStatus });
      if (res.data.success) fetchProfiles();
    } catch (e) { console.error(e); }
  };

  const paginated = profiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (viewUser) {
    return (
      <div className="max-w-4xl">
        <button onClick={() => setViewUser(null)} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm transition-colors">
          <ArrowLeft size={16} /> USER DETAILS
        </button>
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden p-8">
          <div className="grid grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-700/50">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">FIRST NAME</p>
              <p className="text-white font-bold">{viewUser.firstName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">MIDDLE NAME</p>
              <p className="text-white font-bold">{viewUser.middleName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">LAST NAME</p>
              <p className="text-white font-bold">{viewUser.lastName || '-'}</p>
            </div>
            <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">EMAIL ADDRESS</p>
                <p className="text-sky-400 font-bold break-all">{viewUser.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">PASSWORD</p>
                <p className="text-amber-400 font-mono font-bold break-all">{viewUser.password || '-'}</p>
              </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">PHONE NUMBER</p>
              <p className="text-white font-bold">{viewUser.phone || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-700/50">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">DATE OF BIRTH</p>
              <p className="text-white font-bold">{viewUser.dob || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">DATE OF JOINING</p>
              <p className="text-white font-bold">{viewUser.doj || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">HEADQUARTER</p>
              <p className="text-white font-bold">{viewUser.hq || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">DIVISION</p>
              <p className="text-white font-bold">{viewUser.division || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">EMPLOYEE ID</p>
              <p className="text-emerald-400 font-bold">{viewUser.employeeId || viewUser.uid || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">DESIGNATION</p>
              <p className="text-white font-bold">{viewUser.designation || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">REPORTING MANAGER</p>
              <p className="text-white font-bold">{viewUser.reportingManager || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">AADHAR NUMBER</p>
              <p className="text-white font-bold">{viewUser.aadhar || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">PAN NUMBER</p>
              <p className="text-white font-bold">{viewUser.pan || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">DAILY ALLOWANCE</p>
              <p className="text-white font-bold">{viewUser.dailyAllowance || '0'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">EX ALLOWANCE</p>
              <p className="text-white font-bold">{viewUser.exStationAllowance || '0'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">OUT ALLOWANCE</p>
              <p className="text-white font-bold">{viewUser.outStationAllowance || '0'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">ADDRESS</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">STREET ADDRESS 1</p>
                <p className="text-white font-bold">{viewUser.streetAddress1 || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">CITY</p>
                <p className="text-white font-bold">{viewUser.city || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">STREET ADDRESS 2</p>
                <p className="text-white font-bold">{viewUser.streetAddress2 || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">STATE</p>
                <p className="text-white font-bold">{viewUser.state || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activationMode) {
    return (
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setActivationMode(false)} className="text-sky-400 hover:text-white font-bold flex items-center gap-2 uppercase tracking-wider text-sm transition-colors">
            <ArrowLeft size={16} /> ACTIVATION CONTROL
          </button>
        </div>
        <div className="bg-sky-900/30 border border-sky-500/30 p-4 rounded-xl mb-6">
          <p className="text-sm text-sky-200/80 leading-relaxed">
            Using this feature the admin can de-activate any user's account. The Deactivated account user cannot login into the account but the admin and other managers will still be able to access his data. The de-activated accounts will not charged by Medorn, however, the admin cannot activate an account within 30 days before the de-activation date.
          </p>
        </div>
        <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({profiles.length}) ENTRIES</h3>
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse relative whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                <tr className="border-b border-slate-700/50 text-slate-300">
                  <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr No.</th>
                  <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Name</th>
                  <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">De-Activate User</th>
                  <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Reason</th>
                  <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">De-activated Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map((p, i) => (
                  <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="border-r border-slate-700 p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="border-r border-slate-700 p-4 text-white font-bold">{p.firstName} {p.lastName}</td>
                    <td className="border-r border-slate-700 p-4 text-center">
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={p.status === 'Active'} onChange={() => handleToggleStatus(p._id, p.status)} />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </td>
                    <td className="border-r border-slate-700 p-4 text-slate-400 text-center text-sm">{p.status === 'Deactivated' ? (p.deactivateReason || 'N/A') : 'N/A'}</td>
                    <td className="border-r border-slate-700 p-4 text-slate-400 text-center text-sm">{p.status === 'Deactivated' ? (p.deactivateDate || 'N/A') : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableFooter data={profiles} fileName={isAdmin ? "Admins" : "Users"} currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-white tracking-wide uppercase">&lt; {isAdmin ? 'ADMIN' : 'USER'} INFO</h2>
        <button onClick={() => setActivationMode(true)} className="text-sky-400 hover:text-white font-bold text-sm tracking-wide transition-colors">User Activation Control ?</button>
      </div>
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({profiles.length}) ENTRIES</h3>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                <tr className="border-b border-slate-700 text-slate-300">
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800 sticky left-0 z-20">Sr No.</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800 sticky left-[50px] z-20">Name</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Employee ID</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Email Address</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Password</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Phone</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Designation</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Division</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Headquarter</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Reporting Manager</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">DOJ</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">DOB</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Daily DA</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Ex-Station DA</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Out-Station DA</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">PAN No.</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Aadhar No.</th>
                  <th className="border-r border-slate-700 p-3 font-bold uppercase tracking-wider text-[11px] bg-slate-800 text-center sticky right-0 z-20">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginated.map((p, i) => (
                  <tr key={p._id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors text-xs">
                    <td className="border-r border-slate-700 p-3 text-slate-300 bg-slate-800/90 sticky left-0 z-10">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="border-r border-slate-700 p-3 text-white font-bold bg-slate-800/90 sticky left-[50px] z-10">{p.firstName} {p.lastName}</td>
                    <td className="border-r border-slate-700 p-3 text-emerald-400 font-bold">{p.employeeId || p.uid || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-sky-400 font-bold">{p.email || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-amber-400 font-mono font-bold">{p.password || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-white font-bold">{p.phone || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.designation || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.division || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.hq || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.reportingManager || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.doj || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.dob || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.dailyAllowance || '0'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.exStationAllowance || '0'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.outStationAllowance || '0'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300 uppercase">{p.pan || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-slate-300">{p.aadhar || '-'}</td>
                    <td className="border-r border-slate-700 p-3 text-center bg-slate-800/90 sticky right-0 z-10">
                      <button onClick={() => setViewUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-1.5 rounded transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && <tr><td colSpan={18} className="p-8 text-center text-slate-500 font-bold text-sm">No records found.</td></tr>}
              </tbody>
          </table>
        </div>
        <TableFooter data={profiles} fileName={isAdmin ? "Admins" : "Users"} currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function DivisionsTab() {
  const [divs, setDivs] = useState<any[]>([]);
  const [divisionName, setDivisionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchDivs = async () => {
    try {
      const res = await axios.get('/api/admin/locations/divisions');
      if (res.data.success) setDivs(res.data.divisions);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDivs(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/divisions', { divisionName });
      if (res.data.success) { setDivisionName(''); fetchDivs(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit Division Name:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/locations/divisions/${id}`, { divisionName: newName.trim() });
      if (res.data.success) fetchDivs();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/divisions/${id}`);
      if (res.data.success) fetchDivs();
    } catch (e) { console.error(e); }
  };

  const paginated = divs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">&lt; CREATE DIVISION</h2>
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER DIVISION *</label>
          <input required value={divisionName} onChange={e => setDivisionName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Division Name" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">Add Division</button>
      </form>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Division</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d, i) => (
                <tr key={d._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">{d.divisionName}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{d.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(d._id, d.divisionName)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
              {divs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No divisions found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={divs} fileName="Divisions" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function DesignationsTab() {
  const [dsgs, setDsgs] = useState<any[]>([]);
  const [designationName, setDesignationName] = useState('');
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchDsgs = async () => {
    try {
      const res = await axios.get('/api/admin/locations/designations');
      if (res.data.success) setDsgs(res.data.designations);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDsgs(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/designations', { designationName, level });
      if (res.data.success) { setDesignationName(''); setLevel(1); fetchDsgs(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string, currentLevel: number) => {
    const newName = window.prompt("Edit Designation Name:", currentName);
    if (!newName || newName.trim() === '') return;
    const newLevelStr = window.prompt("Edit Level:", currentLevel.toString());
    const newLevel = parseInt(newLevelStr || '0', 10);
    if (!newLevel) return;
    try {
      const res = await axios.put(`/api/admin/locations/designations/${id}`, { designationName: newName.trim(), level: newLevel });
      if (res.data.success) fetchDsgs();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/designations/${id}`);
      if (res.data.success) fetchDsgs();
    } catch (e) { console.error(e); }
  };

  const paginated = dsgs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold text-white mb-4 tracking-wide uppercase">&lt; CREATE DESIGNATION</h2>
      
      <div className="bg-emerald-900/40 border border-emerald-500/30 p-4 rounded-xl mb-8">
        <h3 className="text-emerald-400 font-bold text-sm mb-2 uppercase">Usage Instructions</h3>
        <p className="text-xs text-emerald-300/80 leading-relaxed">
          The designation Level is based on the hierarchy rank. Level 1 is considered entry level, and higher numbers (e.g. Level 9) indicate a higher position in the company hierarchy. An employee can only report to a manager with a higher level number.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT LEVEL *</label>
          <select required value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex-[2]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER DESIGNATION *</label>
          <input required value={designationName} onChange={e => setDesignationName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="e.g. Sales Manager" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">Add Designation</button>
      </form>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">Level</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d, i) => (
                <tr key={d._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">{d.designationName}</td>
                  <td className="border-r border-slate-700 p-5 text-emerald-400 font-bold text-center">{d.level}</td>
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(d._id, d.designationName, d.level)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
              {dsgs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No designations found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={dsgs} fileName="Designations" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function TADAManageTab() {
  const [dsgs, setDsgs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchDsgs = async () => {
    try {
      const res = await axios.get('/api/admin/locations/designations');
      if (res.data.success) setDsgs(res.data.designations);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDsgs(); }, []);

  const handleChange = (id: string, field: string, value: string) => {
    setDsgs(prev => prev.map(d => d._id === id ? { ...d, [field]: value } : d));
  };

  const handleSave = async (d: any) => {
    try {
      const res = await axios.put(`/api/admin/locations/designations/${d._id}`, {
        dailyAllowance: Number(d.dailyAllowance || 0),
        exStationAllowance: Number(d.exStationAllowance || 0),
        outStationAllowance: Number(d.outStationAllowance || 0)
      });
      if (res.data.success) {
        alert(`${d.designationName} allowances saved successfully!`);
      }
    } catch (e) { console.error(e); }
  };

  const paginated = dsgs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">&lt; TA, DA MANAGE</h2>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Level</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Daily Allowance</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Ex-Station Allowance</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Out-Station Allowance</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d) => (
                <tr key={d._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-4 text-white font-bold">{d.designationName}</td>
                  <td className="border-r border-slate-700 p-4 text-emerald-400 font-bold text-center">{d.level}</td>
                  <td className="border-r border-slate-700 p-4">
                    <input type="number" value={d.dailyAllowance || ''} onChange={e => handleChange(d._id, 'dailyAllowance', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                  </td>
                  <td className="border-r border-slate-700 p-4">
                    <input type="number" value={d.exStationAllowance || ''} onChange={e => handleChange(d._id, 'exStationAllowance', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                  </td>
                  <td className="border-r border-slate-700 p-4">
                    <input type="number" value={d.outStationAllowance || ''} onChange={e => handleChange(d._id, 'outStationAllowance', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                  </td>
                  <td className="border-r border-slate-700 p-4 text-center">
                    <button onClick={() => handleSave(d)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 mx-auto transition-colors">
                      <Save size={16} /> Save
                    </button>
                  </td>
                </tr>
              ))}
              {dsgs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No designations found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={dsgs} fileName="Allowances" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}


function EditDeleteTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editUser, setEditUser] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfiles = async () => {
    try {
      const [adminsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/admins'),
        axios.get('/api/admin/users')
      ]);
      let all: any[] = [];
      if (adminsRes.data && adminsRes.data.success) all = [...all, ...adminsRes.data.admins.map((x:any) => ({...x, isAdmin: true}))];
      if (usersRes.data && usersRes.data.success) all = [...all, ...usersRes.data.users.map((x:any) => ({...x, isAdmin: false}))];
      setProfiles(all);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleDelete = async (id: string, isAdmin: boolean) => {
    if (!window.confirm('Are you sure you want to completely delete this user?')) return;
    try {
      const url = isAdmin ? `/api/admin/admins/${id}` : `/api/admin/users/${id}`;
      const res = await axios.delete(url);
      if (res.data.success) {
        setEditUser(null);
        fetchProfiles();
      }
    } catch (e) { alert('Failed to delete'); }
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const url = editUser.isAdmin ? `/api/admin/admins/${editUser._id}` : `/api/admin/users/${editUser._id}`;
      const res = await axios.put(url, editUser);
      if (res.data.success) {
        alert('User details updated successfully!');
        setEditUser(null);
        fetchProfiles();
      } else {
        alert(res.data.message || 'Failed to update user');
      }
    } catch (e) {
      alert('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const s = searchQuery.toLowerCase();
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    return fullName.includes(s) || 
           (p.designation && p.designation.toLowerCase().includes(s)) ||
           (p.hq && p.hq.toLowerCase().includes(s)) ||
           (p.division && p.division.toLowerCase().includes(s)) ||
           (p.email && p.email.toLowerCase().includes(s));
  });

  const totalPages = Math.ceil(filteredProfiles.length / pageSize) || 1;
  const paginated = filteredProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (editUser) {
    return (
        <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700 relative shadow-xl max-w-4xl mx-auto">
          <button onClick={() => setEditUser(null)} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm transition-colors">
            <ArrowLeft size={16} /> Back to List
          </button>
          
          <h2 className="text-2xl font-black text-white mb-8 tracking-wider uppercase">Edit User Profile</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">First Name</label>
              <input value={editUser.firstName || ''} onChange={e => setEditUser({...editUser, firstName: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Middle Name</label>
              <input value={editUser.middleName || ''} onChange={e => setEditUser({...editUser, middleName: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Last Name</label>
              <input value={editUser.lastName || ''} onChange={e => setEditUser({...editUser, lastName: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Email Address</label>
              <input type="email" value={editUser.email || ''} onChange={e => setEditUser({...editUser, email: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Password</label>
              <input type="text" value={editUser.password || ''} onChange={e => setEditUser({...editUser, password: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-amber-400 focus:outline-none focus:border-sky-500 font-mono" />
            </div>
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Phone Number</label>
              <input value={editUser.phone || ''} onChange={e => setEditUser({...editUser, phone: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8 mb-8">
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Professional Details</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Designation</label>
                <input value={editUser.designation || ''} onChange={e => setEditUser({...editUser, designation: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Division</label>
                <input value={editUser.division || ''} onChange={e => setEditUser({...editUser, division: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Headquarter (HQ)</label>
                <input value={editUser.hq || ''} onChange={e => setEditUser({...editUser, hq: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Reporting Manager</label>
                <input value={editUser.reportingManager || ''} onChange={e => setEditUser({...editUser, reportingManager: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Aadhar Number</label>
                <input value={editUser.aadhar || ''} onChange={e => setEditUser({...editUser, aadhar: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Pan Number</label>
                <input value={editUser.pan || ''} onChange={e => setEditUser({...editUser, pan: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="border-t border-slate-700/50 pt-8 mb-8 mt-8">
              <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Allowances</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Daily Allowance</label>
                  <input value={editUser.dailyAllowance || ''} onChange={e => setEditUser({...editUser, dailyAllowance: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Ex Allowance</label>
                  <input value={editUser.exStationAllowance || ''} onChange={e => setEditUser({...editUser, exStationAllowance: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Out Allowance</label>
                  <input value={editUser.outStationAllowance || ''} onChange={e => setEditUser({...editUser, outStationAllowance: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 mb-8">
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Address</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Street Address 1</label>
                <input value={editUser.streetAddress1 || ''} onChange={e => setEditUser({...editUser, streetAddress1: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">City</label>
                <input value={editUser.city || ''} onChange={e => setEditUser({...editUser, city: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Street Address 2</label>
                <input value={editUser.streetAddress2 || ''} onChange={e => setEditUser({...editUser, streetAddress2: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">State</label>
                <input value={editUser.state || ''} onChange={e => setEditUser({...editUser, state: e.target.value})} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-4">
              <button type="button" onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-12 rounded-xl transition-colors flex items-center gap-2 uppercase tracking-wide">
                <Check size={18} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setShowTransferModal(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-12 rounded-xl transition-colors flex items-center gap-2 uppercase tracking-wide">
                <ArrowRightLeft size={18} /> Transfer Data
              </button>
              <button type="button" onClick={() => handleDelete(editUser._id, editUser.isAdmin)} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-12 rounded-xl transition-colors flex items-center gap-2 uppercase tracking-wide">
                <Trash2 size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white tracking-wide uppercase">EDIT / DELETE Users</h2>
          <div className="relative w-72">
              <Search size={18} className="absolute left-3 top-3 text-slate-500" />
              <input 
                  type="text"
                  placeholder="Search name, hq, email..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500"
              />
          </div>
      </div>
      <h3 className="text-sm font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({filteredProfiles.length}) ENTRIES</h3>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Name</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Headquarter</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Division</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((p, i) => (
                <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-4 text-slate-400">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-4 text-white font-bold">{p.firstName} {p.lastName}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.designation || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.hq || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.division || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-center">
                    <button onClick={() => setEditUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto">
                      <Edit size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProfiles.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <TableFooter data={filteredProfiles} fileName="Users_List" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
      {showTransferModal && <TransferDataModal onClose={() => setShowTransferModal(false)} />}
    </div>
  );
}


// -------------------------------------------------------------
// SET TARGET TAB
// -------------------------------------------------------------
function SetTargetTab() {
  const [mode, setMode] = useState<'main' | 'add' | 'list'>('main');
  const [targetPeriod, setTargetPeriod] = useState<'Monthly' | 'Yearly'>('Monthly');
  
  // Data state
  const [users, setUsers] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Filters
  const [stateName, setStateName] = useState('');
  const [hqName, setHqName] = useState('');
  
  // Fetching data
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [uRes, sRes, hRes, pRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/locations/states'),
          axios.get('/api/admin/locations/hqs'),
          axios.get('/api/admin/products')
        ]);
        if (uRes.data.success) setUsers(uRes.data.users);
        if (sRes.data.success) setStates(sRes.data.states);
        if (hRes.data.success) setHqs(hRes.data.hqs);
        if (pRes.data.success) setProducts(pRes.data.products);
      } catch (e) { console.error(e); }
    };
    fetchInitial();
  }, []);

  const filteredHqs = hqs.filter(h => h.stateName === stateName);
  const filteredUsers = users.filter(u => (!stateName || u.state === stateName) && (!hqName || u.hq === hqName));

  // Pagination for main table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selected for assignment
  const [selectedUser, setSelectedUser] = useState<any>(null);

  if (mode === 'add' && selectedUser) {
    return <AddTargetView user={selectedUser} products={products} onBack={() => setMode('main')} />;
  }

  if (mode === 'list') {
    return <TargetsListView period={targetPeriod} onBack={() => setMode('main')} />;
  }

  return (
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-6 tracking-wide uppercase flex items-center gap-2">
        <ArrowLeft size={20} className="cursor-pointer hover:text-sky-400" onClick={() => {}} /> SET USER TARGET
      </h2>
      
      <div className="flex flex-wrap gap-6 items-end mb-8">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">SELECT STATE</label>
          <select value={stateName} onChange={e => { setStateName(e.target.value); setHqName(''); setCurrentPage(1); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">SELECT HQ</label>
          <select value={hqName} onChange={e => { setHqName(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
            <option value="">Select Headquarter</option>
            {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
          </select>
        </div>
        <button className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors border border-sky-400">Filter</button>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => { setTargetPeriod('Monthly'); setMode('list'); }} className="border border-sky-500 text-sky-400 hover:bg-sky-500/10 font-bold py-2 px-6 rounded-lg transition-colors text-sm">Monthly Targets</button>
        <button onClick={() => { setTargetPeriod('Yearly'); setMode('list'); }} className="border border-sky-500 text-sky-400 hover:bg-sky-500/10 font-bold py-2 px-6 rounded-lg transition-colors text-sm">Yearly Targets</button>
      </div>

      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">SHOWING ({filteredUsers.length}) TARGETS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs tracking-wider border-b border-slate-700">
                <th className="p-4 font-bold border-r border-slate-700">Sr no.</th>
                <th className="p-4 font-bold border-r border-slate-700">Name ↑</th>
                <th className="p-4 font-bold border-r border-slate-700">Designation</th>
                <th className="p-4 font-bold border-r border-slate-700">Headquarter ↑</th>
                <th className="p-4 font-bold border-r border-slate-700">Division</th>
                <th className="p-4 font-bold text-center">Add Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedUsers.map((u, i) => (
                <tr key={u._id} className="hover:bg-slate-700/30">
                  <td className="p-4 text-slate-300 border-r border-slate-700">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-4 text-white font-bold border-r border-slate-700">{u.firstName} {u.lastName}</td>
                  <td className="p-4 text-slate-300 border-r border-slate-700">{u.designation}</td>
                  <td className="p-4 text-slate-300 border-r border-slate-700">{u.hq}</td>
                  <td className="p-4 text-slate-300 border-r border-slate-700">{u.division}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => { setSelectedUser(u); setMode('add'); }} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 p-2 rounded-full inline-flex items-center justify-center h-8 w-8 transition-colors">
                      <span className="font-bold text-xl leading-none block -mt-1">+</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-rose-400">No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddTargetView({ user, products, onBack }: any) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear+2, currentYear+1, currentYear, currentYear-1, currentYear-2, currentYear-3, currentYear-4];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const [month, setMonth] = useState('');
  const [year, setYear] = useState(currentYear.toString());
  const [targetType, setTargetType] = useState('Qty * Amount');
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(0);
  
  // Filter products by division
  const divisionProducts = products.filter((p: any) => p.division === user.division || !user.division);
  
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const handleQtyChange = (id: string, qty: number) => {
    setProductQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const handleAllot = async () => {
    if (targetType === 'Qty * Amount' && !month) { alert('Please select a month'); return; }
    
    setLoading(true);
    let productTargets: any[] = [];
    let totalProductAmount = 0;
    
    if (targetType === 'Qty * Amount') {
      divisionProducts.forEach((p: any) => {
        const qty = productQuantities[p._id] || 0;
        if (qty > 0) {
          const amount = qty * (p.ptr || 0);
          productTargets.push({ productId: p._id, productName: p.productName, ptr: p.ptr || 0, qty, totalAmount: amount });
          totalProductAmount += amount;
        }
      });
    }

    try {
      const res = await axios.post('/api/admin/targets', {
        userEmail: user.email,
        userName: user.firstName + ' ' + (user.lastName || ''),
        targetPeriod: 'Monthly',
        month,
        year,
        allocationType: targetType,
        lumpSumAmount,
        productTargets,
        totalProductAmount
      });
      if (res.data.success) {
        alert('User Target Successfully Set');
        onBack();
      } else alert(res.data.message);
    } catch (e) {
      console.error(e);
      alert('Error saving target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-6 tracking-wide uppercase flex items-center gap-2">
        <ArrowLeft size={20} className="cursor-pointer hover:text-sky-400 transition-colors" onClick={onBack} /> 
        SET TARGET FOR {user.firstName.toUpperCase()} {user.lastName?.toUpperCase()}
      </h2>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">SELECT MONTH</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
            <option value="">Select Month</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">SELECT YEAR</label>
          <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
            <option value="">Select Year</option>
            {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">SELECT TARGET TYPE</label>
          <select value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
            <option value="Qty * Amount">Qty * Amount</option>
            <option value="Lump-Sum">Lump-Sum</option>
          </select>
        </div>
      </div>

      {targetType === 'Lump-Sum' && (
        <div className="mb-8 w-1/3">
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">LUMP-SUM AMOUNT</label>
          <input type="number" value={lumpSumAmount || ''} onChange={e => setLumpSumAmount(Number(e.target.value))} placeholder="Enter Amount" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500" />
          
          <div className="mt-8 flex justify-center">
            <button disabled={loading} onClick={handleAllot} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-10 rounded-lg transition-colors flex items-center gap-2">
              <span className="text-sm font-bold">Allot Target</span>
            </button>
          </div>
        </div>
      )}

      {targetType === 'Qty * Amount' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mb-8">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">PRODUCT DETAILS</h3>
          </div>
          <div className="overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left relative">
              <thead className="sticky top-0 bg-slate-900/90 z-10">
                <tr className="text-slate-400 text-xs tracking-wider border-b border-slate-700">
                  <th className="p-4 font-bold border-r border-slate-700">Sr no.</th>
                  <th className="p-4 font-bold border-r border-slate-700">Product Name ↑</th>
                  <th className="p-4 font-bold border-r border-slate-700">PTR</th>
                  <th className="p-4 font-bold border-r border-slate-700 text-center w-32">Quantity ↑</th>
                  <th className="p-4 font-bold text-center">Actions ↑</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {divisionProducts.map((p: any, i: number) => (
                  <tr key={p._id} className="hover:bg-slate-700/30">
                    <td className="p-4 text-slate-300 border-r border-slate-700">{i + 1}</td>
                    <td className="p-4 text-white font-bold border-r border-slate-700">{p.productName}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700">{p.ptr || '0.00'}</td>
                    <td className="p-4 border-r border-slate-700">
                      <input type="number" value={productQuantities[p._id] === undefined ? 0 : productQuantities[p._id]} onChange={e => handleQtyChange(p._id, Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-center text-white focus:outline-none focus:border-sky-500" />
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={handleAllot} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 p-2 rounded transition-colors" title="Save Target">
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TargetsListView({ period, onBack }: any) {
  const currentYear = new Date().getFullYear();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const [month, setMonth] = useState('August');
  const [year] = useState(currentYear.toString());
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const url = period === 'Monthly' 
        ? `/api/admin/targets?period=Monthly&month=${month}&year=${year}` 
        : `/api/admin/targets?period=Yearly&year=${year}`;
      const res = await axios.get(url);
      if (res.data.success) setTargets(res.data.targets);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTargets(); }, [month, year, period]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("DELETE ALLOTTED TARGET\nTHIS WILL PERMANENTLY DELETE THE ALLOTTED TARGET!\nYes / No")) return;
    try {
      const res = await axios.delete('/api/admin/targets/' + id);
      if (res.data.success) {
        alert("Allotment deleted successfully");
        fetchTargets();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-6 tracking-wide uppercase flex items-center gap-2">
        <ArrowLeft size={20} className="cursor-pointer hover:text-sky-400 transition-colors" onClick={onBack} /> 
        {period.toUpperCase()} TARGETS
      </h2>

      {period === 'Monthly' && (
        <div className="mb-8 w-64">
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">Select Month*</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">SHOWING ({targets.length}) ENTRIES</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs tracking-wider border-b border-slate-700">
                <th className="p-4 font-bold border-r border-slate-700">Sr no.</th>
                <th className="p-4 font-bold border-r border-slate-700">Employee ↑</th>
                <th className="p-4 font-bold border-r border-slate-700">Lump Amount ↑</th>
                <th className="p-4 font-bold border-r border-slate-700">Product Amount ↑</th>
                <th className="p-4 font-bold text-center">Delete ↑</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {targets.map((t, i) => (
                <tr key={t._id} className="hover:bg-slate-700/30">
                  <td className="p-4 text-slate-300 border-r border-slate-700">{i + 1}</td>
                  <td className="p-4 text-white font-bold border-r border-slate-700">{t.userName || t.userEmail}</td>
                  <td className="p-4 text-slate-300 border-r border-slate-700">{t.lumpSumAmount || 0}</td>
                  <td className="p-4 text-slate-300 border-r border-slate-700">{t.totalProductAmount || 0}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(t._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {targets.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
