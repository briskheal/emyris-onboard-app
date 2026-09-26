const fs = require('fs');

let content = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// Add imports
if (!content.includes('CustomUserSelect')) {
  content = content.replace(
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft } from 'lucide-react';",
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, Search, ArrowUp } from 'lucide-react';\nimport CustomUserSelect from '../components/CustomUserSelect';"
  );
}

// Ensure Search and ArrowUp are imported if CustomUserSelect was already there
if (!content.includes('ArrowUp')) {
  content = content.replace(
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft }",
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, Search, ArrowUp }"
  );
}

// Find EditDeleteTab start and end
const editDeleteStart = content.indexOf('const EditDeleteTab = () => {');
const editDeleteEnd = content.indexOf('  // --- DCS LIST MANAGEMENT TAB ---');

if (editDeleteStart === -1 || editDeleteEnd === -1) {
  console.error("Could not find EditDeleteTab boundaries.");
  process.exit(1);
}

const newEditDeleteTab = `const EditDeleteTab = () => {
    const [filterType, setFilterType] = useState('Chemist');
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
    if (filterUser) displayList = displayList.filter(d => d.userAllotted === filterUser || d.employeeId === filterUser);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      displayList = displayList.filter(d => 
        (d.name || d.businessName || '').toLowerCase().includes(q) ||
        (d.proprietorName || '').toLowerCase().includes(q) ||
        (d.address || '').toLowerCase().includes(q) ||
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
        await axios.delete(\`/api/admin/dcs/\${filterType.toLowerCase()}s/\${id}\`);
        fetchData();
      } catch (e) { alert('Error deleting record'); }
    };

    const handleBatchDelete = async () => {
      if (selectedIds.length === 0) return alert('Select records to delete');
      if(!window.confirm(\`Delete \${selectedIds.length} records?\`)) return;
      try {
        for (const id of selectedIds) {
          await axios.delete(\`/api/admin/dcs/\${filterType.toLowerCase()}s/\${id}\`);
        }
        setSelectedIds([]);
        fetchData();
      } catch (e) { alert('Error deleting records'); }
    };

    const ThBase = ({ children, align = 'left', border = true }: { children: React.ReactNode, align?: 'left'|'center', border?: boolean }) => (
      <th className={\`p-4 \${border ? 'border-r border-[#3b3b5a]' : ''} font-bold text-slate-300 text-sm whitespace-nowrap bg-[#252538] text-\${align}\`}>
        {children}
      </th>
    );

    const ThWithIcons = ({ label, searchable, sortable }: { label: string, searchable?: boolean, sortable?: boolean }) => (
      <ThBase>
        <div className="flex items-center justify-center gap-2 w-full">
          {searchable && <Search size={14} className="text-slate-500 shrink-0" />}
          <span className="flex-1 text-center">{label}</span>
          {sortable && <ArrowUp size={14} className="text-slate-500 shrink-0" />}
        </div>
      </ThBase>
    );

    return (
      <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10 flex flex-col bg-[#1e1e2d]">
        <h2 className="text-lg font-bold text-white mb-6 tracking-wide uppercase">EDIT / DELETE</h2>
        
        <div className="bg-[#27273f] rounded-xl border border-[#3b3b5a] overflow-hidden shadow-2xl flex flex-col p-6 flex-1">
          <div className="bg-[#1d9c52] text-white text-sm font-semibold p-4 rounded-lg mb-8 shadow-md">
            Deleting a DCS from here will also remove it from the list.
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">SELECT TYPE</label>
              <select value={filterType} onChange={e=>{setFilterType(e.target.value); setSelectedIds([]);}} className="w-full bg-[#1e1e2d] border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer">
                <option value="Doctor">Doctor</option>
                <option value="Chemist">Chemist</option>
                <option value="Stockist">Stockist</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">SELECT STATE</label>
              <select value={filterState} onChange={e=>setFilterState(e.target.value)} className="w-full bg-[#1e1e2d] border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer">
                <option value="">All States</option>
                {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">SELECT HQ</label>
              <select value={filterHq} onChange={e=>setFilterHq(e.target.value)} className="w-full bg-[#1e1e2d] border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer">
                <option value="">All Headquarters</option>
                {hqs.filter(h => !filterState || h.state === filterState).map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">SELECT USER</label>
              <CustomUserSelect users={users} selectedUser={filterUser} onChange={setFilterUser} />
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-4">
            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">SHOWING ({displayList.length}) ENTRIES</span>
            <button onClick={handleBatchDelete} className="text-rose-500 hover:text-rose-400 hover:scale-110 transition-all p-2" title="Delete Selected">
              <Trash2 size={20} className="fill-current" />
            </button>
          </div>

          <div className="overflow-x-auto border border-[#3b3b5a] rounded-xl mb-4 bg-[#1e1e2d]">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 z-10 shadow-md">
                <tr className="border-b border-[#3b3b5a]">
                  {/* Keep checkbox to enable bulk delete like original functional request, although hidden in user screenshot */}
                  <th className="p-4 border-r border-[#3b3b5a] text-center w-12 bg-[#252538]"><input type="checkbox" onChange={handleSelectAll} checked={displayList.length > 0 && selectedIds.length === displayList.length} className="cursor-pointer accent-sky-500" /></th>
                  
                  <ThBase align="center">Sr no.</ThBase>
                  
                  {filterType === 'Doctor' ? (
                    <>
                      <ThWithIcons label="Doctor Name" searchable sortable />
                      <ThWithIcons label="Degree" searchable sortable />
                      <ThWithIcons label="Specialization" searchable sortable />
                      <ThWithIcons label="Hospital" searchable />
                    </>
                  ) : (
                    <>
                      <ThWithIcons label="Business Name" searchable sortable />
                      <ThWithIcons label="Propreitor Name" searchable sortable />
                      <ThWithIcons label="Address" searchable />
                    </>
                  )}
                  
                  <ThWithIcons label="Mobile Number" searchable />
                  <ThWithIcons label="HQ" searchable sortable />
                  <ThBase align="center" border={false}>Actions</ThBase>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-500 font-medium">No records found.</td></tr>
                ) : displayList.map((d, i) => (
                  <tr key={d._id} className="border-b border-[#3b3b5a]/50 hover:bg-[#252538] text-white text-sm transition-colors">
                    <td className="p-4 border-r border-[#3b3b5a]/50 text-center"><input type="checkbox" checked={selectedIds.includes(d._id)} onChange={() => handleSelectOne(d._id)} className="cursor-pointer accent-sky-500" /></td>
                    <td className="p-4 border-r border-[#3b3b5a]/50 text-center font-medium text-slate-400">{i + 1}</td>
                    
                    {filterType === 'Doctor' ? (
                      <>
                        <td className="p-4 border-r border-[#3b3b5a]/50 font-bold">{d.name}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.degree || '-'}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.specialization || '-'}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.hospital || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 border-r border-[#3b3b5a]/50 font-bold">{d.businessName}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.proprietorName || d.name || '-'}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300 truncate max-w-xs">{d.address || '-'}</td>
                      </>
                    )}
                    
                    <td className="p-4 border-r border-[#3b3b5a]/50">{d.mobile || d.contact || '-'}</td>
                    <td className="p-4 border-r border-[#3b3b5a]/50 font-medium">{d.headquarter || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button className="text-emerald-400 hover:text-emerald-300 hover:scale-110 transition-transform"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(d._id)} className="text-rose-400 hover:text-rose-300 hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
`;

const updatedContent = content.substring(0, editDeleteStart) + newEditDeleteTab + "\n" + content.substring(editDeleteEnd);
fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', updatedContent);
console.log('Successfully patched ManageDCS.tsx');
