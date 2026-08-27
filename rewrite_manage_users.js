const fs = require('fs');
let code = fs.readFileSync('scratch/ManageUsers.tsx', 'utf8');

// 1. Add 'Eye' to lucide-react imports
code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import {, Eye} from 'lucide-react';");

// 2. Replace ProfileInfoTab entirely
const profileInfoRegex = /function ProfileInfoTab\(\{(.*?)\n  \}/s; 
// Actually, let's extract by matching function ProfileInfoTab(...) { ... }
// Since it's a huge function, it's safer to split by function names
const parts = code.split(/function DivisionsTab/);
let topPart = parts[0];
const bottomPart = "function DivisionsTab" + parts[1];

// topPart contains unction ProfileInfoTab inside it.
const topPartsSplit = topPart.split(/function ProfileInfoTab\(\{ isAdmin \}: \{ isAdmin: boolean \}\) \{/);
const beforeProfileInfo = topPartsSplit[0];
// The rest is the body of ProfileInfoTab.

const newProfileInfoTab = unction ProfileInfoTab({ isAdmin }: { isAdmin: boolean }) {
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
      const url = isAdmin ? \/api/admin/admins/\\ : \/api/admin/users/\\;
      const res = await axios.put(url, { status: newStatus });
      if (res.data.success) fetchProfiles();
    } catch (e) { console.error(e); }
  };

  const paginated = profiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (viewUser) {
    return (
      <div className="max-w-4xl">
        <button onClick={() => setViewUser(null)} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
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
              <p className="text-emerald-400 font-bold">{viewUser.uid || '-'}</p>
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
              <p className="text-white font-bold">{viewUser.exAllowance || '0'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">OUT ALLOWANCE</p>
              <p className="text-white font-bold">{viewUser.outAllowance || '0'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">ADDRESS</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">STREET ADDRESS 1</p>
                <p className="text-white font-bold">{viewUser.address1 || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">CITY</p>
                <p className="text-white font-bold">{viewUser.city || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">STREET ADDRESS 2</p>
                <p className="text-white font-bold">{viewUser.address2 || '-'}</p>
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
          <button onClick={() => setActivationMode(false)} className="text-sky-400 hover:text-white font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
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
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Name</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Creation Date</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Reporting Manager</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Headquarter</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Division</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((p, i) => (
                <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-4 text-white font-bold">{p.firstName} {p.lastName}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300 text-center">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-emerald-400 font-bold">{p.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.reportingManager || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.designation || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.hq || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.division || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-center">
                    <button onClick={() => setViewUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg transition-colors">
                      <Eye size={18} />
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

;

code = beforeProfileInfo + newProfileInfoTab + "\n" + bottomPart;

// 3. Render EditDeleteTab instead of PlaceholderTab in the main switch
code = code.replace(/{activeTab === 'edit_delete' && <PlaceholderTab title="Edit \/ Delete" \/>}/, "{activeTab === 'edit_delete' && <EditDeleteTab />}");

// 4. Add EditDeleteTab implementation at the very end
const editDeleteTabCode = 
function EditDeleteTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editUser, setEditUser] = useState<any>(null);

  const fetchProfiles = async () => {
    try {
      const [adminsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/admins'),
        axios.get('/api/admin/users')
      ]);
      let all = [];
      if (adminsRes.data.success) all = [...all, ...adminsRes.data.admins.map((x:any) => ({...x, isAdmin: true}))];
      if (usersRes.data.success) all = [...all, ...usersRes.data.users.map((x:any) => ({...x, isAdmin: false}))];
      setProfiles(all);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleDelete = async (id: string, isAdmin: boolean) => {
    if (!window.confirm('Are you sure you want to completely delete this user?')) return;
    try {
      const url = isAdmin ? \/api/admin/admins/\\ : \/api/admin/users/\\;
      const res = await axios.delete(url);
      if (res.data.success) {
        setEditUser(null);
        fetchProfiles();
      }
    } catch (e) { console.error(e); }
  };

  const paginated = profiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (editUser) {
    return (
      <div className="max-w-4xl">
        <button onClick={() => setEditUser(null)} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
          <ArrowLeft size={16} /> EDIT USER
        </button>
        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">First Name *</label>
              <input value={editUser.firstName || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Middle Name</label>
              <input value={editUser.middleName || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Last Name *</label>
              <input value={editUser.lastName || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
            </div>
          </div>
          <div className="mb-8">
            <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Gender</label>
            <select value={editUser.gender || ''} disabled className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none appearance-none">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="border-t border-slate-700/50 pt-8 mb-8">
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Login Credentials</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Email *</label>
                <input type="email" value={editUser.email || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Phone *</label>
                <input value={editUser.phone || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 mb-8">
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Employee Details</h3>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">DOB</label>
                <input type="date" value={editUser.dob || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">DOJ</label>
                <input type="date" value={editUser.doj || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Headquarter *</label>
                <input value={editUser.hq || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Division *</label>
                <input value={editUser.division || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Employee ID</label>
                <input value={editUser.uid || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Designation *</label>
                <input value={editUser.designation || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Reporting Manager</label>
                <input value={editUser.reportingManager || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Aadhar Number</label>
                <input value={editUser.aadhar || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Pan Number</label>
                <input value={editUser.pan || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 mb-8">
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Address</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Street Address 1</label>
                <input value={editUser.address1 || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">City</label>
                <input value={editUser.city || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Street Address 2</label>
                <input value={editUser.address2 || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">State</label>
                <input value={editUser.state || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button type="button" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-12 rounded-xl transition-colors h-[58px] flex items-center gap-2 uppercase tracking-wide">
              <Edit size={18} /> Edit
            </button>
            <button type="button" onClick={() => handleDelete(editUser._id, editUser.isAdmin)} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-12 rounded-xl transition-colors h-[58px] flex items-center gap-2 uppercase tracking-wide">
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">&lt; EDIT USER</h2>
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({profiles.length}) ENTRIES</h3>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Name</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Headquarter</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Division</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Edit User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((p, i) => (
                <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-4 text-white font-bold">{p.firstName} {p.lastName}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.designation || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.hq || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-slate-300">{p.division || '-'}</td>
                  <td className="border-r border-slate-700 p-4 text-center">
                    <button onClick={() => setEditUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg transition-colors">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={profiles} fileName="AllUsers" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}
;

code = code + "\n" + editDeleteTabCode;

fs.writeFileSync('scratch/ManageUsers.tsx', code, 'utf8');
console.log('Script ran successfully');
