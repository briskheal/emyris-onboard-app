const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const replacement = `function DesignationsTab() {
  const [dsgs, setDsgs] = useState<any[]>([]);
  const [designationName, setDesignationName] = useState('');
  const [level, setLevel] = useState(1);
  const [targetDoctorCalls, setTargetDoctorCalls] = useState(0);
  const [targetChemistCalls, setTargetChemistCalls] = useState(0);
  const [targetStockistCalls, setTargetStockistCalls] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [editId, setEditId] = useState<string | null>(null);

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
      const res = await axios.post('/api/admin/locations/designations', { designationName, level, targetDoctorCalls, targetChemistCalls, targetStockistCalls });
      if (res.data.success) { 
        setDesignationName(''); setLevel(1); 
        setTargetDoctorCalls(0); setTargetChemistCalls(0); setTargetStockistCalls(0);
        fetchDsgs(); 
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveEdit = async (id: string, newName: string, newLevel: number, newD: number, newC: number, newS: number) => {
    try {
      const res = await axios.put(\`/api/admin/locations/designations/\${id}\`, { designationName: newName.trim(), level: newLevel, targetDoctorCalls: newD, targetChemistCalls: newC, targetStockistCalls: newS });
      if (res.data.success) {
        setEditId(null);
        fetchDsgs();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(\`/api/admin/locations/designations/\${id}\`);
      if (res.data.success) fetchDsgs();
    } catch (e) { console.error(e); }
  };

  const paginated = dsgs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-5xl">
      <h2 className="text-lg font-bold text-white mb-4 tracking-wide uppercase">&lt; CREATE DESIGNATION</h2>
      
      <div className="bg-emerald-900/40 border border-emerald-500/30 p-4 rounded-xl mb-8">
        <h3 className="text-emerald-400 font-bold text-sm mb-2 uppercase">Usage Instructions</h3>
        <p className="text-xs text-emerald-300/80 leading-relaxed">
          The designation Level is based on the hierarchy rank. Level 1 is considered entry level, and higher numbers indicate a higher position in the company hierarchy. An employee can only report to a manager with a higher level number.
          <br/><br/>
          <strong className="text-emerald-200">Call Targets:</strong> Setting Doctor/Chemist/Stockist target calls per day will dynamically compute monthly targets on the dashboard based on working days. Leave as 0 to use system defaults (Level 1-2: 8 calls, Level 3-4: 6 calls, Level 5+: 5 calls).
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-6 gap-6 items-end mb-12">
        <div className="col-span-1">
          <label className="text-xs text-slate-400 font-bold mb-2 block">LEVEL</label>
          <select required value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500">
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 font-bold mb-2 block">DESIGNATION *</label>
          <input required value={designationName} onChange={e => setDesignationName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500" placeholder="e.g. Sales Manager" />
        </div>
        <div className="col-span-1">
          <label className="text-xs text-sky-400 font-bold mb-2 block">DR/DAY</label>
          <input type="number" min="0" value={targetDoctorCalls} onChange={e => setTargetDoctorCalls(Number(e.target.value))} className="w-full bg-sky-900/20 border border-sky-500/30 rounded-xl p-3 text-sky-200 focus:outline-none" />
        </div>
        <div className="col-span-1">
          <label className="text-xs text-amber-400 font-bold mb-2 block">CHM/DAY</label>
          <input type="number" min="0" value={targetChemistCalls} onChange={e => setTargetChemistCalls(Number(e.target.value))} className="w-full bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 text-amber-200 focus:outline-none" />
        </div>
        <div className="col-span-1">
          <label className="text-xs text-rose-400 font-bold mb-2 block">STK/DAY</label>
          <input type="number" min="0" value={targetStockistCalls} onChange={e => setTargetStockistCalls(Number(e.target.value))} className="w-full bg-rose-900/20 border border-rose-500/30 rounded-xl p-3 text-rose-200 focus:outline-none" />
        </div>
        <div className="col-span-6">
          <button disabled={loading} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors">Add Designation</button>
        </div>
      </form>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-[10px] bg-slate-800">Designation</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-[10px] bg-slate-800 text-center">Lvl</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-[10px] bg-slate-800 text-center text-sky-400">Dr</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-[10px] bg-slate-800 text-center text-amber-400">Chm</th>
                <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-[10px] bg-slate-800 text-center text-rose-400">Stk</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d) => {
                const isEdit = editId === d._id;
                return (
                  <tr key={d._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="border-r border-slate-700 p-4 text-white font-bold">
                      {isEdit ? <input id={"nm-"+d._id} defaultValue={d.designationName} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" /> : d.designationName}
                    </td>
                    <td className="border-r border-slate-700 p-4 text-emerald-400 font-bold text-center">
                      {isEdit ? <input type="number" id={"lv-"+d._id} defaultValue={d.level} className="w-12 text-center bg-slate-900 border border-slate-600 rounded px-1 py-1" /> : d.level}
                    </td>
                    <td className="border-r border-slate-700 p-4 text-sky-300 font-bold text-center">
                      {isEdit ? <input type="number" id={"d-"+d._id} defaultValue={d.targetDoctorCalls || 0} className="w-12 text-center bg-slate-900 border border-slate-600 rounded px-1 py-1" /> : (d.targetDoctorCalls || 0)}
                    </td>
                    <td className="border-r border-slate-700 p-4 text-amber-300 font-bold text-center">
                      {isEdit ? <input type="number" id={"c-"+d._id} defaultValue={d.targetChemistCalls || 0} className="w-12 text-center bg-slate-900 border border-slate-600 rounded px-1 py-1" /> : (d.targetChemistCalls || 0)}
                    </td>
                    <td className="border-r border-slate-700 p-4 text-rose-300 font-bold text-center">
                      {isEdit ? <input type="number" id={"s-"+d._id} defaultValue={d.targetStockistCalls || 0} className="w-12 text-center bg-slate-900 border border-slate-600 rounded px-1 py-1" /> : (d.targetStockistCalls || 0)}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      {isEdit ? (
                        <>
                          <button onClick={() => {
                            const nm = (document.getElementById("nm-"+d._id) as HTMLInputElement).value;
                            const lv = parseInt((document.getElementById("lv-"+d._id) as HTMLInputElement).value);
                            const tD = parseInt((document.getElementById("d-"+d._id) as HTMLInputElement).value);
                            const tC = parseInt((document.getElementById("c-"+d._id) as HTMLInputElement).value);
                            const tS = parseInt((document.getElementById("s-"+d._id) as HTMLInputElement).value);
                            saveEdit(d._id, nm, lv, tD, tC, tS);
                          }} className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-lg font-bold text-xs uppercase">Save</button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:bg-slate-700 p-2 rounded-lg font-bold text-xs uppercase">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditId(d._id)} className="text-sky-500 hover:bg-sky-500/10 p-2 rounded-lg"><Edit size={16}/></button>
                          <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg"><Trash2 size={16}/></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {dsgs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No designations found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={dsgs} fileName="Designations" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}`;

const startIndex = content.indexOf('function DesignationsTab() {');
const endIndexStr = `function TADAManageTab() {`;
const endIndex = content.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', before + replacement + '\n\n' + after);
    console.log("Successfully replaced DesignationsTab in ManageUsers.tsx");
} else {
    console.error("Could not find boundaries for replacement.");
}
