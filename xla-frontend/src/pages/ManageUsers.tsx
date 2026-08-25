import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit, Save, RefreshCw, Key, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

export default function ManageUsers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create_user' | 'create_admin' | 'user_info' | 'admin_info' | 'divisions' | 'designations' | 'ta_da'>('create_user');
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
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
            <button onClick={() => setActiveTab('admin_info')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'admin_info' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>ADMIN INFO</button>
            <button onClick={() => setActiveTab('divisions')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'divisions' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>MANAGE DIVISIONS</button>
            <button onClick={() => setActiveTab('designations')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'designations' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>MANAGE DESIGNATIONS</button>
            <button onClick={() => setActiveTab('ta_da')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'ta_da' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>TA, DA MANAGE</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-900 p-8 overflow-y-auto">
          {activeTab === 'create_user' && <CreateProfileTab isAdmin={false} />}
          {activeTab === 'create_admin' && <CreateProfileTab isAdmin={true} />}
          {activeTab === 'user_info' && <ProfileInfoTab isAdmin={false} />}
          {activeTab === 'admin_info' && <ProfileInfoTab isAdmin={true} />}
          {activeTab === 'divisions' && <DivisionsTab />}
          {activeTab === 'designations' && <DesignationsTab />}
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
        alert('Created successfully!');
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
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE USER PROFILE</h2>
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
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DESIGNATION</label><select name="designation" value={formData.designation || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Designation</option>{designations.map(d => <option key={d._id} value={d.designationName}>{d.designationName} (Lvl {d.level})</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DIVISION</label><select name="division" value={formData.division || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Division</option>{divisions.map(d => <option key={d._id} value={d.divisionName}>{d.divisionName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMPLOYEE ID</label><input name="employeeId" value={formData.employeeId || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DATE OF JOINING</label><input type="date" name="doj" value={formData.doj || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">REPORTING MANAGER</label>
              <select name="reportingManager" value={formData.reportingManager || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Designation</option>
                {eligibleDesignations.map(d => <option key={d._id} value={d.designationName}>{d.designationName} (Lvl {d.level})</option>)}
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

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
          <button type="button" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Save As Draft</button>
          <button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}

function ProfileInfoTab({ isAdmin }: { isAdmin: boolean }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this profile?')) return;
    try {
      const url = isAdmin ? `/api/admin/admins/${id}` : `/api/admin/users/${id}`;
      const res = await axios.delete(url);
      if (res.data.success) fetchProfiles();
    } catch (e) { console.error(e); }
  };

  const paginated = profiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-full">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; {isAdmin ? 'ADMIN' : 'USER'} INFO</h2>
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({profiles.length}) ENTRIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Name</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Division</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">HQ</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Reporting Mgr</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Status</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((p, i) => (
                <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-4 text-white font-bold">{p.firstName} {p.lastName}</td>
                  <td className="border-r border-slate-700 p-4 text-emerald-400 font-bold">{p.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.designation || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.division || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.hq || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.reportingManager || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-center">
                    <button onClick={() => handleToggleStatus(p._id, p.status)} className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {p.status === 'Active' ? 'Activated' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="border-r border-slate-700 p-4 text-center flex justify-center gap-2">
                    <button onClick={() => handleDelete(p._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold">No records found.</td></tr>}
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
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE DIVISION</h2>
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
      <h2 className="text-2xl font-black text-white mb-4 tracking-wide uppercase">&lt; CREATE DESIGNATION</h2>
      
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
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; TA, DA MANAGE</h2>
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
