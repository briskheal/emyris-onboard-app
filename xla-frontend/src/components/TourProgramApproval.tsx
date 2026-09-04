import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, Trash2, Plus, X } from 'lucide-react';

export default function TourProgramApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [detailedMonthTpId, setDetailedMonthTpId] = useState<string | null>(null);
  
  // selectedRows for day-wise stores strings like "tpId_date"
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
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


  // Derived data
  const filteredItems = useMemo(() => {
    if (!selectedUser) return items;
    return items.filter((i: any) => i.employeeId === selectedUser || (i.employeeName && i.employeeName.includes(selectedUser)));
  }, [items, selectedUser]);

  // Unique users for dropdown
  const users = useMemo(() => {
    const map = new Map();
    items.forEach((i: any) => {
      const name = i.employeeName || i.employeeEmail || i.employeeId;
      if (!map.has(i.employeeId)) map.set(i.employeeId, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Flatten for day-wise view
  const dayWiseData = useMemo(() => {
    const flattened: any[] = [];
    filteredItems.forEach((tp: any) => {
      let entries = [];
      try { entries = JSON.parse(tp.entries || '[]'); } catch(e){}
      if (!Array.isArray(entries)) entries = Object.values(entries);
      
      entries.forEach((e: any) => {
        if (!e.status || e.status === 'Pending' || e.status === 'Submitted') {
          flattened.push({
            tpId: tp._id,
            date: e.date,
            employeeName: tp.employeeName || tp.employeeEmail,
            designation: tp.designation || '-',
            areaType: e.type || e.areaType || '-',
            location: e.toMarket || '-',
            remarks: e.remarks || '-',
            activity: e.activityType || 'Working',
            workedWith: '-'
          });
        }
      });
    });
    // Sort by date
    return flattened.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredItems]);

  
  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) return;
    // Group selected rows by tpId
    const grouped: Record<string, string[]> = {};
    selectedRows.forEach(row => {
      const [tpId, date] = row.split('_');
      if (!grouped[tpId]) grouped[tpId] = [];
      grouped[tpId].push(date);
    });

    if (!window.confirm(`Are you sure you want to ${action} these days?`)) return;

    let success = 0;
    for (const [tpId, dates] of Object.entries(grouped)) {
      try {
        const res = await axios.post('/api/xl/approvals/action', {
          recordId: tpId,
          type: 'Tour Program',
          action,
          dates
        });
        if (res.data.success) success++;
      } catch (e) {}
    }
    setSelectedRows([]);
    fetchPending();
    fetchCounts();
  };

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(r => r !== id));
    else setSelectedRows([...selectedRows, id]);
  };

  // Detailed Month View Component
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
    
    const calendarDays: any[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${yearNum}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(yearNum, monthIndex, d);
        const isSunday = dateObj.getDay() === 0;
        const holiday = holidays.find(h => h.date === dateStr && (!h.state || h.state === 'All' || h.state === userState || h.state === 'N/A' || h.state === ''));
        const entry = entries.find((e: any) => e.date === dateStr);
        calendarDays.push({ d, dateStr, dateObj, isSunday, holiday, entry });
    }

    const toggleMonthAll = () => {
      const allIds = calendarDays.filter(d => d.entry).map(d => `${tp._id}_${d.dateStr}`);
      if (selectedRows.length > 0) setSelectedRows([]);
      else setSelectedRows(allIds);
    };

    const handleDeleteEntry = async (dateStr: string) => {
        if (!window.confirm(`Are you sure you want to delete the Tour Program entry for ${dateStr}?`)) return;
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
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
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
                   {calendarDays.map((dayItem) => {
                     const { d, dateStr, dateObj, isSunday, holiday, entry } = dayItem;
                     const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()];
                     const rowId = `${tp._id}_${dateStr}`;
                     
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
                           <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm ${status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
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


  // Summary / Day-wise Views
  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
       {/* Top Control Bar */}
       <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
          <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                     <CheckCircle size={24} strokeWidth={2.5}/>
                 </div>
                 <div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">APPROVE {selectedModule}</h1>
                 </div>
             </div>
             {selectedRows.length > 0 && !isMonthlyView && (
               <div className="flex gap-3 bg-sky-900/30 rounded-xl border border-sky-500/30 items-center px-4 py-2 shadow-xl">
                 <span className="text-sky-400 font-bold text-sm hidden md:inline">{selectedRows.length} selected</span>
                 <div className="w-px h-6 bg-sky-500/30 mx-1 hidden md:block"></div>
                 <button onClick={() => handleBulkAction('Approved')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">Approve</button>
                 <button onClick={() => handleBulkAction('Rejected')} className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">Reject</button>
               </div>
             )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">Select User</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full max-w-sm bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500">
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 bg-[#151521] px-5 py-3 rounded-xl border border-[#3b3b5a]">
              <div 
                onClick={() => { setIsMonthlyView(!isMonthlyView); setSelectedRows([]); }} 
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isMonthlyView ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isMonthlyView ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-sm font-bold text-slate-300">View Monthly Tour Program</span>
            </div>
          </div>
       </div>

       <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3b3b5a] bg-[#1c1c2e]">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SHOWING ({isMonthlyView ? filteredItems.length : dayWiseData.length}) ENTRIES</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#3b3b5a] bg-[#151521]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                    {isMonthlyView ? (
                      <>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Month ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Year ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Name ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Designation ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Reporting Manager</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">View</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Employee Name ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Designation ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Area Type</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Location</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Remarks</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Activity</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Worked with</th>
                        <th className="p-4 w-12 text-center">
                          <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === dayWiseData.length} onChange={() => {
                            if (selectedRows.length === dayWiseData.length) setSelectedRows([]);
                            else setSelectedRows(dayWiseData.map(d => `${d.tpId}_${d.date}`));
                          }} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isMonthlyView ? (
                    filteredItems.length === 0 ? (
                      <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly TPs</td></tr>
                    ) : filteredItems.map((item: any, idx: number) => (
                      <tr key={item._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white capitalize">{item.month}</td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-300">{item.year}</td>
                        <td className="px-4 py-4 text-sm font-bold text-sky-400">{item.employeeName || item.employeeId}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{item.designation || "-"}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{item.reportingManager || "-"}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => setDetailedMonthTpId(item._id)} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                            <Eye size={18} strokeWidth={2.5}/>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    dayWiseData.length === 0 ? (
                      <tr><td colSpan={10} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Daily TPs</td></tr>
                    ) : dayWiseData.map((d: any, idx: number) => {
                      const rowId = `${d.tpId}_${d.date}`;
                      return (
                        <tr key={rowId} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{new Date(d.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-4 text-sm font-bold text-sky-400">{d.employeeName}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{d.designation}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{d.areaType}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{d.location}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{d.remarks}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{d.activity}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{d.workedWith}</td>
                          <td className="p-4 text-center">
                            <input type="checkbox" checked={selectedRows.includes(rowId)} onChange={() => toggleRow(rowId)} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
       </div>
    </div>
  );
}
