const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const accessControlCode = `
function AccessControlTab() {
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedHq, setSelectedHq] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false); // true if we want to unlock all, false to lock all

  useEffect(() => {
    fetchLocations();
    fetchDivisions();
    fetchUsers();
  }, []);

  const fetchLocations = async () => {
    try {
      const [stRes, hqRes] = await Promise.all([
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/locations/hqs')
      ]);
      if (stRes.data.success) setStates(stRes.data.states);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
    } catch (e) { console.error(e); }
  };

  const fetchDivisions = async () => {
    try {
      const res = await axios.get('/api/admin/divisions');
      if (res.data.success) setDivisions(res.data.divisions);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (e) { console.error(e); }
  };

  const filteredUsers = users.filter(u => {
    if (selectedState && u.state !== selectedState && !hqs.find(h => h.hqName === u.hq && h.state === selectedState)) return false;
    if (selectedHq && u.hq !== selectedHq) return false;
    if (selectedDivision && u.division !== selectedDivision) return false;
    return true;
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isUserLocked = (user: any) => {
    let c = user.controls;
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch(e) { return false; } }
    return c?.locked === true;
  };

  const getLockReason = (user: any) => {
    let c = user.controls;
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch(e) { return 'N/A'; } }
    return c?.lockedReason || 'N/A';
  };

  const handleToggleLock = async (user: any) => {
    const currentLock = isUserLocked(user);
    const newLock = !currentLock;
    let currentControls = user.controls || {};
    if (typeof currentControls === 'string') { try { currentControls = JSON.parse(currentControls); } catch(e) { currentControls = {}; } }
    
    const updatedControls = {
      ...currentControls,
      locked: newLock,
      lockedReason: newLock ? 'Locked by Admin' : ''
    };

    try {
      const res = await axios.put('/api/admin/users/' + user._id, { controls: updatedControls });
      if (res.data.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, controls: updatedControls } : u));
      } else {
        alert(res.data.message);
      }
    } catch (e) { alert('Failed to update user lock status.'); }
  };

  const handleBulkLock = async () => {
    if (!selectedHq) return alert("Please select an HQ first.");
    try {
      const res = await axios.put('/api/admin/users/bulk-lock', {
        hq: selectedHq,
        locked: !isUnlocking,
        lockedReason: isUnlocking ? '' : 'Locked by Admin'
      });
      if (res.data.success) {
        fetchUsers();
        setShowConfirm(false);
      } else {
        alert(res.data.message);
      }
    } catch(e) { alert('Bulk lock failed.'); }
  };

  const allFilteredLocked = filteredUsers.length > 0 && filteredUsers.every(u => isUserLocked(u));

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-xl font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
           <ArrowLeft size={20} /> ACCESS CONTROL
        </h2>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select State</label>
            <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedHq(''); setCurrentPage(1); }} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select HQ</label>
            <select value={selectedHq} onChange={e => { setSelectedHq(e.target.value); setCurrentPage(1); }} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="">Select HQ</option>
              {hqs.filter(h => h.state === selectedState || h.stateName === selectedState || !selectedState).map(h => (
                <option key={h._id} value={h.hqName}>{h.hqName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Division</label>
            <select value={selectedDivision} onChange={e => { setSelectedDivision(e.target.value); setCurrentPage(1); }} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="">Select Division</option>
              {divisions.map(d => <option key={d._id} value={d.divisionName}>{d.divisionName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden relative">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Showing ({filteredUsers.length}) Entries</h3>
          {selectedHq && (
             <button 
                onClick={() => { setIsUnlocking(allFilteredLocked); setShowConfirm(true); }} 
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
                {allFilteredLocked ? 'Unlock All Users In HQ' : 'Lock All Users In HQ'}
             </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <th className="p-4 border-b border-slate-700/50 w-20">Sr no.</th>
                <th className="p-4 border-b border-slate-700/50">Name</th>
                <th className="p-4 border-b border-slate-700/50 text-center">Reason</th>
                <th className="p-4 border-b border-slate-700/50 text-center">Lock User</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-300">
              {paginatedUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No users found.</td></tr>
              ) : (
                paginatedUsers.map((u, i) => {
                  const locked = isUserLocked(u);
                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-colors border-b border-slate-700/30 last:border-b-0">
                      <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
                      <td className="p-4 font-bold text-white">{u.firstName} {u.lastName}</td>
                      <td className="p-4 text-center">{getLockReason(u)}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleToggleLock(u)} className={\`w-10 h-5 rounded-full relative transition-colors \${locked ? 'bg-red-500' : 'bg-slate-600'}\`}>
                          <div className={\`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform \${locked ? 'translate-x-5' : 'translate-x-1'}\`}></div>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TableFooter data={filteredUsers} fileName="Users_Access" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setShowConfirm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
               <Trash2 size={20} className="hidden"/>
               <div className="text-lg font-bold">X</div>
            </button>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Confirm Details</h3>
            <p className="text-white font-bold mb-8">
              DO YOU WANT TO {isUnlocking ? 'UNLOCK' : 'LOCK'} ALL USERS IN {selectedHq.toUpperCase()}?
            </p>
            <div className="flex items-center justify-center gap-4">
               <button onClick={handleBulkLock} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                 <Check size={16} /> YES
               </button>
               <button onClick={() => setShowConfirm(false)} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                 <Trash2 size={16} /> NO
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;

c = c.replace('function UploadTargetTab() {', accessControlCode + '\n\nfunction UploadTargetTab() {');

// Now replace the PlaceholderTab call with the actual component call
c = c.replace(
  "{activeTab === 'access_control' && <PlaceholderTab title=\"Access Control\" />}",
  "{activeTab === 'access_control' && <AccessControlTab />}"
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Injected AccessControlTab into ManageUsers.tsx');
