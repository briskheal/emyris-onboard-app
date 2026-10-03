const fs = require('fs');

let content = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// Ensure Download is imported from lucide-react
if (!content.includes('Download')) {
  content = content.replace(
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, Search, ArrowUp }",
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, Search, ArrowUp, Download }"
  );
}
// Add XLSX import if not exists
if (!content.includes('import * as XLSX from \'xlsx\';')) {
  content = "import * as XLSX from 'xlsx';\n" + content;
}

const editDeleteStart = content.indexOf('const EditDeleteTab = () => {');
const editDeleteEnd = content.indexOf('  // --- UPLOAD DCS TAB ---');

const newEditDeleteTab = `const EditDeleteTab = () => {
    const [filterType, setFilterType] = useState('Chemist');
    const [filterHq, setFilterHq] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
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

    // Reset page when filters change
    useEffect(() => {
      setCurrentPage(1);
    }, [filterType, filterHq, filterState, filterUser, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(displayList.length / itemsPerPage));
    const paginatedList = displayList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedIds(paginatedList.map(d => d._id));
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
    
    const exportToExcel = () => {
      if(displayList.length === 0) return alert('No data to export');
      const ws = XLSX.utils.json_to_sheet(displayList.map((d, i) => {
        if(filterType === 'Doctor') return { 'Sr no.': i+1, Name: d.name, Degree: d.degree, Specialization: d.specialization, Hospital: d.hospital, 'Mobile Number': d.mobile, HQ: d.headquarter };
        else return { 'Sr no.': i+1, 'Business Name': d.businessName, 'Proprietor Name': d.proprietorName || d.name, Address: d.address, 'Mobile Number': d.mobile || d.contact, HQ: d.headquarter };
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, \`\${filterType}s\`);
      XLSX.writeFile(wb, \`\${filterType}_List.xlsx\`);
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
        <button onClick={() => {}} className="text-sky-400 font-bold mb-6 hover:underline flex items-center gap-2 w-fit">
          <ArrowLeft size={16} /> EDIT / DELETE
        </button>
        
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
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Search by name, uid..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-[#1e1e2d] border border-[#3b3b5a] rounded-lg px-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-sky-500" />
              </div>
              <button onClick={handleBatchDelete} className="text-rose-500 hover:text-rose-400 hover:scale-110 transition-all p-2" title="Delete Selected">
                <Trash2 size={20} className="fill-current" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-auto max-h-[50vh] border border-[#3b3b5a] rounded-t-xl bg-[#1e1e2d] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 z-10 shadow-md">
                <tr className="border-b border-[#3b3b5a]">
                  <th className="p-4 border-r border-[#3b3b5a] text-center w-12 bg-[#252538]"><input type="checkbox" onChange={handleSelectAll} checked={paginatedList.length > 0 && selectedIds.length === paginatedList.length} className="cursor-pointer accent-sky-500" /></th>
                  
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
                {paginatedList.length === 0 ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-500 font-medium">No records found.</td></tr>
                ) : paginatedList.map((d, i) => (
                  <tr key={d._id} className="border-b border-[#3b3b5a]/50 hover:bg-[#252538] text-white text-sm transition-colors">
                    <td className="p-4 border-r border-[#3b3b5a]/50 text-center"><input type="checkbox" checked={selectedIds.includes(d._id)} onChange={() => handleSelectOne(d._id)} className="cursor-pointer accent-sky-500" /></td>
                    <td className="p-4 border-r border-[#3b3b5a]/50 text-center font-medium text-slate-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    
                    {filterType === 'Doctor' ? (
                      <>
                        <td className="p-4 border-r border-[#3b3b5a]/50 font-bold">{d.name}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.degree || '-'}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.specialization || '-'}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300 truncate max-w-xs">{d.hospital || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 border-r border-[#3b3b5a]/50 font-bold text-sky-400">{d.businessName}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300">{d.proprietorName || d.name || '-'}</td>
                        <td className="p-4 border-r border-[#3b3b5a]/50 text-slate-300 max-w-[200px] break-words whitespace-normal leading-relaxed">{d.address || '-'}</td>
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

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-4 bg-[#252538] border border-[#3b3b5a] border-t-0 rounded-b-xl mt-[-16px]">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                &lt; Prev
              </button>
              <span className="text-sm text-slate-400 font-medium">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                Next &gt;
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <button onClick={exportToExcel} className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 font-semibold px-4 py-1.5 rounded border border-[#3b3b5a] bg-[#1e1e2d] hover:bg-[#3b3b5a]/50 transition-colors">
                <Download size={16} /> Export
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Show</span>
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1e1e2d] border border-[#3b3b5a] rounded px-2 py-1 text-slate-300 focus:outline-none">
                  {[5, 10, 20, 50, 100, 200, 500, 1000].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };
`;

const updatedContent = content.substring(0, editDeleteStart) + newEditDeleteTab + "\n" + content.substring(editDeleteEnd);
fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', updatedContent);
console.log('Successfully patched ManageDCS.tsx with pagination and footer');
