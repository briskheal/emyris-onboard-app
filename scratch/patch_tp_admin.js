const fs = require('fs');
let code = fs.readFileSync('xla-frontend/src/components/TourProgramApproval.tsx', 'utf8');

// 1. Add imports if needed
if (!code.includes('Trash2')) {
  code = code.replace("import { CheckCircle, Eye, ChevronLeft } from 'lucide-react';", "import { CheckCircle, Eye, ChevronLeft, Trash2, Plus, X } from 'lucide-react';");
}

// 2. Add state for holidays, users, and Add Modal
const stateHook = `const [selectedRows, setSelectedRows] = useState<string[]>([]);`;
const newStates = `const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ type: 'HQ', toMarket: '', remarks: '', activityType: 'Working' });

  // Fetch holidays and users for context
  useMemo(() => {
    // using useMemo as a hacky useEffect to not break hook order if we just inject it
    axios.get('/api/xl/settings/holidays').then(res => { if(res.data.success) setHolidays(res.data.data) });
    axios.get('/api/admin/users').then(res => { if(res.data.success) setAllUsers(res.data.users) });
  }, []);
`;
if (!code.includes('setHolidays')) {
    code = code.replace(stateHook, newStates);
}

// 3. Update the detailedMonthTpId block
const detailedBlockRegex = /\/\/ Detailed Month View Component[\s\S]*?(?=^\s*\/\/ Summary \/ Day-wise Views)/m;

const newDetailedBlock = `// Detailed Month View Component
  if (detailedMonthTpId) {
    const tp = items.find((i: any) => i._id === detailedMonthTpId);
    if (!tp) {
      setDetailedMonthTpId(null);
      return null;
    }
    
    let entries = [];
    try { entries = JSON.parse(tp.entries || '[]'); } catch(e){}
    if (!Array.isArray(entries)) entries = Object.values(entries);
    
    const tpUser = allUsers.find(u => u.employeeId === tp.employeeId);
    const userState = tpUser?.state || '';

    // Calculate days in month
    const monthIndex = new Date(Date.parse(tp.month + " 1, " + tp.year)).getMonth();
    const yearNum = parseInt(tp.year);
    const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
    
    const calendarDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = \`\${yearNum}-\${String(monthIndex + 1).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
        const dateObj = new Date(yearNum, monthIndex, d);
        const isSunday = dateObj.getDay() === 0;
        const holiday = holidays.find(h => h.date === dateStr && (!h.state || h.state === 'All' || h.state === userState || h.state === 'N/A' || h.state === ''));
        const entry = entries.find((e: any) => e.date === dateStr);
        calendarDays.push({ d, dateStr, dateObj, isSunday, holiday, entry });
    }

    const toggleMonthAll = () => {
      const allIds = calendarDays.filter(d => d.entry).map(d => \`\${tp._id}_\${d.dateStr}\`);
      if (selectedRows.length > 0) setSelectedRows([]);
      else setSelectedRows(allIds);
    };

    const handleDeleteEntry = async (dateStr: string) => {
        if (!window.confirm(\`Are you sure you want to delete the Tour Program entry for \${dateStr}?\`)) return;
        const newEntries = entries.filter((e: any) => e.date !== dateStr);
        try {
            await axios.post('/api/xl/tour-program', {
                employeeId: tp.employeeId, employeeName: tp.employeeName, hq: tp.hq, year: tp.year, month: tp.month,
                entries: newEntries, resubmitRemark: 'Admin deleted entry'
            });
            fetchPending();
            fetchCounts();
        } catch(e) {}
    };

    const handleAddSubmit = async () => {
        if (!showAddModal) return;
        const newEntries = [...entries, { date: showAddModal, status: 'Pending', ...addForm }];
        try {
            await axios.post('/api/xl/tour-program', {
                employeeId: tp.employeeId, employeeName: tp.employeeName, hq: tp.hq, year: tp.year, month: tp.month,
                entries: newEntries, resubmitRemark: 'Admin added entry'
            });
            setShowAddModal(null);
            fetchPending();
            fetchCounts();
        } catch(e) {}
    };

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
         {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-[#1c1c2e] rounded-xl border border-[#3b3b5a] p-6 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white uppercase">Add Entry - {showAddModal}</h3>
                        <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Area Type</label>
                            <select value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value})} className="w-full bg-[#151521] border border-[#3b3b5a] rounded-lg p-3 text-white">
                                <option value="HQ">HQ</option><option value="EX-HQ">EX-HQ</option><option value="Out-Station">Out-Station</option><option value="Transit">Transit</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Work Area</label>
                            <input type="text" value={addForm.toMarket} onChange={e => setAddForm({...addForm, toMarket: e.target.value})} className="w-full bg-[#151521] border border-[#3b3b5a] rounded-lg p-3 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Activity Type</label>
                            <select value={addForm.activityType} onChange={e => setAddForm({...addForm, activityType: e.target.value})} className="w-full bg-[#151521] border border-[#3b3b5a] rounded-lg p-3 text-white">
                                <option value="Working">Working</option><option value="Leave">Leave</option><option value="Meeting">Meeting</option>
                            </select>
                        </div>
                        <button onClick={handleAddSubmit} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 rounded-lg uppercase tracking-wider mt-4">Save Entry</button>
                    </div>
                </div>
            </div>
         )}

         <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
            <button onClick={() => { setDetailedMonthTpId(null); setSelectedRows([]); }} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider mb-4 hover:text-sky-300 transition-colors">
               <ChevronLeft size={20} /> MONTHLY TOUR PROGRAM DETAILS
            </button>
            <div className="flex flex-wrap gap-6 items-center text-xs font-black uppercase tracking-widest text-slate-400">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Approved</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Rejected</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Pending</div>
            </div>
         </div>

         {selectedRows.length > 0 && (
            <div className="absolute top-6 right-8 z-20 flex gap-3 bg-sky-900/90 backdrop-blur-md rounded-xl border border-sky-500/50 items-center px-4 py-2 shadow-2xl">
              <span className="text-sky-400 font-bold text-sm">{selectedRows.length} selected</span>
              <div className="w-px h-6 bg-sky-500/30 mx-1"></div>
              <button onClick={() => handleBulkAction('Approved')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">Approve</button>
              <button onClick={() => handleBulkAction('Rejected')} className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">Reject</button>
            </div>
         )}

         <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                   <tr className="border-b border-[#3b3b5a] bg-[#1c1c2e]">
                     <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Day</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Area Type</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Work Areas</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                     <th className="p-4 w-16 text-center">
                       <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === calendarDays.filter(d => d.entry).length} onChange={toggleMonthAll} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                     </th>
                   </tr>
                 </thead>
                 <tbody>
                   {calendarDays.map((dayItem, idx) => {
                     const { d, dateStr, dateObj, isSunday, holiday, entry } = dayItem;
                     const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()];
                     const rowId = \`\${tp._id}_\${dateStr}\`;
                     
                     if (holiday) {
                         return (
                             <tr key={dateStr} className="border-b border-[#3b3b5a] bg-rose-500/5">
                                 <td className="px-6 py-4 text-sm font-bold text-rose-400">{d} {tp.month.substring(0,3)}</td>
                                 <td className="px-4 py-4 text-sm font-bold text-rose-400">{dayName}</td>
                                 <td colSpan={5} className="px-4 py-4 text-sm font-black text-rose-500 tracking-widest uppercase">HOLIDAY: {holiday.title}</td>
                             </tr>
                         );
                     }
                     if (isSunday && !entry) {
                         return (
                             <tr key={dateStr} className="border-b border-[#3b3b5a] bg-slate-800/30">
                                 <td className="px-6 py-4 text-sm font-bold text-slate-500">{d} {tp.month.substring(0,3)}</td>
                                 <td className="px-4 py-4 text-sm font-bold text-slate-500">{dayName}</td>
                                 <td colSpan={5} className="px-4 py-4 text-sm font-black text-slate-600 tracking-widest uppercase">SUNDAY</td>
                             </tr>
                         );
                     }
                     
                     if (!entry) {
                         return (
                             <tr key={dateStr} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30">
                                 <td className="px-6 py-4 text-sm font-bold text-white">{d} {tp.month.substring(0,3)}</td>
                                 <td className="px-4 py-4 text-sm font-medium text-slate-400">{dayName}</td>
                                 <td colSpan={3} className="px-4 py-4 text-sm font-medium text-slate-600 italic">No entry submitted</td>
                                 <td className="px-4 py-4 text-center">
                                     <button onClick={() => { setAddForm({ type: 'HQ', toMarket: '', remarks: '', activityType: 'Working' }); setShowAddModal(dateStr); }} className="px-3 py-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto transition-colors">
                                         <Plus size={14} /> Add
                                     </button>
                                 </td>
                                 <td></td>
                             </tr>
                         );
                     }

                     const status = entry.status || tp.status || 'Pending';
                     return (
                       <tr key={dateStr} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                         <td className="px-6 py-4 text-sm font-bold text-white">{d} {tp.month.substring(0,3)}</td>
                         <td className="px-4 py-4 text-sm font-medium text-slate-300">{dayName}</td>
                         <td className="px-4 py-4 text-sm text-slate-300">{entry.type || entry.areaType || '-'}</td>
                         <td className="px-4 py-4 text-sm text-sky-400">{entry.toMarket || '-'}</td>
                         <td className="px-4 py-4 text-center">
                           <span className={\`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm \${status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}\`}>
                             {status}
                           </span>
                         </td>
                         <td className="px-4 py-4 text-center">
                            <button onClick={() => handleDeleteEntry(dateStr)} className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors mx-auto block">
                                <Trash2 size={16} />
                            </button>
                         </td>
                         <td className="p-4 text-center">
                           <input type="checkbox" checked={selectedRows.includes(rowId)} onChange={() => toggleRow(rowId)} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
         </div>
      </div>
    );
  }
`;

code = code.replace(detailedBlockRegex, newDetailedBlock);

fs.writeFileSync('xla-frontend/src/components/TourProgramApproval.tsx', code);
console.log('Successfully patched TourProgramApproval.tsx');
