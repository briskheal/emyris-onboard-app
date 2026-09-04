import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle, Trash2 } from 'lucide-react';

export default function CallPlanApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [detailedDateData, setDetailedDateData] = useState<{employeeId: string, date: string, name: string} | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [allChemists, setAllChemists] = useState<any[]>([]);
  const [allStockists, setAllStockists] = useState<any[]>([]);

  const [isMonthlyView, setIsMonthlyView] = useState(true);
  const [detailedMonthId, setDetailedMonthId] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch master lists to resolve IDs to names
    const fetchMasters = async () => {
      try {
        const [dRes, cRes, sRes] = await Promise.all([
          axios.get('/api/xl/doctors?designation=ADMIN'),
          axios.get('/api/xl/chemists?designation=ADMIN'),
          axios.get('/api/xl/stockists?designation=ADMIN')
        ]);
        if (dRes.data.success) setAllDoctors(dRes.data.data);
        if (cRes.data.success) setAllChemists(cRes.data.data);
        if (sRes.data.success) setAllStockists(sRes.data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMasters();
    
    axios.get('/api/xl/settings/holidays').then(res => { if(res.data.success) setHolidays(res.data.data) });
    axios.get('/api/admin/users').then(res => { if(res.data.success) setAllUsers(res.data.users) });
  }, []);

  const doctorMap = useMemo(() => new Map(allDoctors.map(d => [d.doctorCode || d._id, d.doctorName])), [allDoctors]);
  const chemistMap = useMemo(() => new Map(allChemists.map(c => [c.chemistCode || c._id, c.chemistName])), [allChemists]);
  const stockistMap = useMemo(() => new Map(allStockists.map(s => [s.stockistCode || s._id, s.stockistName])), [allStockists]);

  // Filter by user
  const filteredItems = useMemo(() => {
    if (!selectedUser) return items;
    return items.filter((i: any) => i.employeeId === selectedUser || (i.employeeName && i.employeeName.includes(selectedUser)));
  }, [items, selectedUser]);

  // Group by Month for the structural shift
  const monthlyGrouped = useMemo(() => {
    const map = new Map<string, any>();
    filteredItems.forEach((i: any) => {
        if (!i.date) return;
        const dt = new Date(i.date);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const monthKey = `${y}-${m}`;
        const id = `${i.employeeId}_${monthKey}`;
        if (!map.has(id)) {
            const tpUser = allUsers.find(u => u.employeeId === i.employeeId);
            map.set(id, {
                _id: id,
                employeeId: i.employeeId,
                employeeName: i.employeeName || i.employeeId,
                designation: tpUser?.designation || '-',
                reportingManager: tpUser?.reportingManager || '-',
                monthKey,
                year: y,
                monthIndex: dt.getMonth(),
                state: tpUser?.state || '',
                entries: []
            });
        }
        map.get(id).entries.push(i);
    });
    return Array.from(map.values()).sort((a,b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredItems, allUsers]);

  // Unique users for dropdown
  const users = useMemo(() => {
    const map = new Map();
    items.forEach((i: any) => {
      const name = i.employeeName || i.employeeEmail || i.employeeId;
      if (!map.has(i.employeeId)) map.set(i.employeeId, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredItems.map((d: any) => d._id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) return;
    try {
      for (const id of selectedRows) {
        await axios.post('/api/xl/approvals/action', {
          type: 'Call Plans',
          action,
          recordId: id
        });
      }
      setShowConfirmModal(false);
      setSelectedRows([]);
      fetchPending();
      fetchCounts();
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
  };

  // --- 1. DETAILED DAY DATA (Deep Dive) ---
  if (detailedDateData) {
    const activeItem = filteredItems.find((i: any) => i.employeeId === detailedDateData.employeeId && i.date === detailedDateData.date);
    const dt = new Date(detailedDateData.date);
    const formattedDate = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let drIds: string[] = [];
    let chIds: string[] = [];
    let stIds: string[] = [];
    try { drIds = JSON.parse(activeItem?.doctors || '[]'); } catch(e){}
    try { chIds = JSON.parse(activeItem?.chemists || '[]'); } catch(e){}
    try { stIds = JSON.parse(activeItem?.stockists || '[]'); } catch(e){}

    const doctorCalls = drIds.map(id => doctorMap.get(id) || `Doctor (${id})`);
    const chemistCalls = chIds.map(id => chemistMap.get(id) || `Chemist (${id})`);
    const stockistCalls = stIds.map(id => stockistMap.get(id) || `Stockist (${id})`);

    return (
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
         <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
            <button onClick={() => setDetailedDateData(null)} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider hover:text-sky-300 transition-colors">
               <ChevronLeft size={20} /> CALL DETAILS
            </button>
         </div>
         
         <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4 mb-8">
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Date</div>
                  <div className="text-sm font-bold text-white">{formattedDate}</div>
               </div>
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Doctors</div>
                  <div className="text-sm font-bold text-white">{doctorCalls.length}</div>
               </div>
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Chemists</div>
                  <div className="text-sm font-bold text-white">{chemistCalls.length}</div>
               </div>
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Stockists</div>
                  <div className="text-sm font-bold text-white">{stockistCalls.length}</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] p-6 shadow-xl">
                 <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest mb-6 border-b border-[#3b3b5a] pb-4">Doctors Planned</h4>
                 {doctorCalls.length === 0 ? <p className="text-slate-500 text-sm italic">No doctors planned</p> : (
                   <div className="space-y-3">
                     {doctorCalls.map((n, i) => <div key={i} className="flex items-center gap-3 bg-[#1c1c2e] p-3 rounded-xl border border-[#3b3b5a] shadow-sm"><div className="w-6 h-6 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center text-xs font-bold">{i+1}</div><span className="text-sm font-bold text-slate-200">{n}</span></div>)}
                   </div>
                 )}
               </div>

               <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] p-6 shadow-xl">
                 <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-6 border-b border-[#3b3b5a] pb-4">Chemists Planned</h4>
                 {chemistCalls.length === 0 ? <p className="text-slate-500 text-sm italic">No chemists planned</p> : (
                   <div className="space-y-3">
                     {chemistCalls.map((n, i) => <div key={i} className="flex items-center gap-3 bg-[#1c1c2e] p-3 rounded-xl border border-[#3b3b5a] shadow-sm"><div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">{i+1}</div><span className="text-sm font-bold text-slate-200">{n}</span></div>)}
                   </div>
                 )}
               </div>

               <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] p-6 shadow-xl">
                 <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-6 border-b border-[#3b3b5a] pb-4">Stockists Planned</h4>
                 {stockistCalls.length === 0 ? <p className="text-slate-500 text-sm italic">No stockists planned</p> : (
                   <div className="space-y-3">
                     {stockistCalls.map((n, i) => <div key={i} className="flex items-center gap-3 bg-[#1c1c2e] p-3 rounded-xl border border-[#3b3b5a] shadow-sm"><div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold">{i+1}</div><span className="text-sm font-bold text-slate-200">{n}</span></div>)}
                   </div>
                 )}
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- 2. DETAILED MONTH CALENDAR VIEW (Structural Shift) ---
  if (detailedMonthId) {
    const grp = monthlyGrouped.find(g => g._id === detailedMonthId);
    if (!grp) {
      setDetailedMonthId(null);
      return null;
    }
    const daysInMonth = new Date(grp.year, grp.monthIndex + 1, 0).getDate();
    const calendarDays: any[] = [];
    const monthShort = new Date(grp.year, grp.monthIndex, 1).toLocaleString('default', { month: 'short' });
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${grp.year}-${String(grp.monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(grp.year, grp.monthIndex, d);
        const isSunday = dateObj.getDay() === 0;
        const holiday = holidays.find(h => h.date === dateStr && (!h.state || h.state === 'All' || h.state === grp.state || h.state === 'N/A' || h.state === ''));
        const entry = grp.entries.find((e: any) => e.date === dateStr);
        calendarDays.push({ d, dateStr, dateObj, isSunday, holiday, entry });
    }

    const handleDeleteEntry = async (entryId: string, dateStr: string) => {
        if (!window.confirm(`Are you sure you want to delete the Call Plan for ${dateStr}?`)) return;
        try {
            // Use Reject action to effectively clear/delete the pending entry for now
            await axios.post('/api/xl/approvals/action', { type: 'Call Plans', action: 'Rejected', recordId: entryId });
            fetchPending();
            fetchCounts();
        } catch(e) {}
    };

    const toggleMonthAll = () => {
      const allIds = calendarDays.filter(d => d.entry).map(d => d.entry._id);
      if (selectedRows.length > 0) setSelectedRows([]);
      else setSelectedRows(allIds);
    };

    return (
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
         <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
            <button onClick={() => { setDetailedMonthId(null); setSelectedRows([]); }} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider mb-4 hover:text-sky-300 transition-colors">
               <ChevronLeft size={20} /> MONTHLY CALL PLAN DETAILS
            </button>
            <div className="flex flex-wrap gap-6 items-center text-xs font-black uppercase tracking-widest text-slate-400">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Pending Call Plans for {grp.employeeName}</div>
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
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Doctors</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Chemists</th>
                     <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Stockists</th>
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
                     
                     if (holiday) {
                         return (
                             <tr key={dateStr} className="border-b border-[#3b3b5a] bg-rose-500/5">
                                 <td className="px-6 py-4 text-sm font-bold text-rose-400">{d} {monthShort}</td>
                                 <td className="px-4 py-4 text-sm font-bold text-rose-400">{dayName}</td>
                                 <td colSpan={5} className="px-4 py-4 text-sm font-black text-rose-500 tracking-widest uppercase">HOLIDAY: {holiday.title}</td>
                             </tr>
                         );
                     }
                     if (isSunday && !entry) {
                         return (
                             <tr key={dateStr} className="border-b border-[#3b3b5a] bg-slate-800/30">
                                 <td className="px-6 py-4 text-sm font-bold text-slate-500">{d} {monthShort}</td>
                                 <td className="px-4 py-4 text-sm font-bold text-slate-500">{dayName}</td>
                                 <td colSpan={5} className="px-4 py-4 text-sm font-black text-slate-600 tracking-widest uppercase">SUNDAY</td>
                             </tr>
                         );
                     }
                     
                     if (!entry) {
                         return (
                             <tr key={dateStr} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30">
                                 <td className="px-6 py-4 text-sm font-bold text-white">{d} {monthShort}</td>
                                 <td className="px-4 py-4 text-sm font-medium text-slate-400">{dayName}</td>
                                 <td colSpan={5} className="px-4 py-4 text-sm font-medium text-slate-600 italic">No Call Plan submitted</td>
                             </tr>
                         );
                     }

                     let dCount = 0, cCount = 0, sCount = 0;
                     try { dCount = JSON.parse(entry.doctors || '[]').length; } catch(e){}
                     try { cCount = JSON.parse(entry.chemists || '[]').length; } catch(e){}
                     try { sCount = JSON.parse(entry.stockists || '[]').length; } catch(e){}

                     return (
                       <tr key={dateStr} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                         <td className="px-6 py-4 text-sm font-bold text-white">{d} {monthShort}</td>
                         <td className="px-4 py-4 text-sm font-medium text-slate-300">{dayName}</td>
                         <td className="px-4 py-4 text-center text-sm font-bold text-emerald-400">{dCount}</td>
                         <td className="px-4 py-4 text-center text-sm font-bold text-emerald-400">{cCount}</td>
                         <td className="px-4 py-4 text-center text-sm font-bold text-emerald-400">{sCount}</td>
                         <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setDetailedDateData({employeeId: entry.employeeId, date: entry.date, name: entry.employeeName})} className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors">
                                    <Eye size={18} />
                                </button>
                                <button onClick={() => handleDeleteEntry(entry._id, dateStr)} className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                         </td>
                         <td className="p-4 text-center">
                           <input type="checkbox" checked={selectedRows.includes(entry._id)} onChange={() => toggleRow(entry._id)} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
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

  // --- 3. MAIN APPROVAL LIST VIEW ---
  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
       <div className="p-6 md:p-8 pb-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                     <CheckCircle size={24} strokeWidth={2.5}/>
                 </div>
                 <div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">APPROVE {selectedModule}</h1>
                 </div>
             </div>
             
             {/* Monthly View Toggle */}
             <div className="flex items-center gap-3 bg-[#151521] px-5 py-3 rounded-xl border border-[#3b3b5a]">
                <div 
                  onClick={() => { setIsMonthlyView(!isMonthlyView); setSelectedRows([]); }} 
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isMonthlyView ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isMonthlyView ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-bold text-slate-300">View Monthly Call Plan</span>
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div className="flex-1 min-w-0 w-full max-w-sm">
              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">Select User</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500">
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            
            {selectedRows.length > 0 && (
               <button onClick={() => setShowConfirmModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95">
                 <CheckCircle size={18} /> Actions
               </button>
            )}
          </div>
       </div>

       {showConfirmModal && (
          <div className="absolute inset-0 bg-[#151521]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-[#1c1c2e] border border-[#3b3b5a] shadow-2xl rounded-2xl w-full max-w-md p-6 relative">
               <div className="flex justify-between items-center mb-6 border-b border-[#3b3b5a] pb-4">
                 <h3 className="text-white font-black uppercase tracking-wider text-sm">CONFIRM DETAILS</h3>
                 <button onClick={() => setShowConfirmModal(false)} className="text-rose-500 hover:text-rose-400"><XCircle size={20} /></button>
               </div>
               <div className="text-center py-4">
                  <p className="text-slate-300 font-bold uppercase tracking-wide text-sm mb-8">
                    DO YOU WANT TO APPROVE THE {selectedRows.length} CALL PLANNING REPORT{selectedRows.length !== 1 && 'S'}?
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => handleBulkAction('Approved')} className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleBulkAction('Rejected')} className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
               </div>
             </div>
          </div>
       )}

       <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3b3b5a] bg-[#1c1c2e]">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SHOWING ({isMonthlyView ? monthlyGrouped.length : filteredItems.length}) ENTRIES</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#3b3b5a] bg-[#151521]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                    {isMonthlyView ? (
                      <>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Month</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Year</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Name</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Designation</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Reporting Manager</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">View</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Day</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Employee Name</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">Doctors</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">Chemists</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">Stockists</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">View</th>
                        <th className="p-4 w-16 text-center">
                           <div className="flex items-center justify-center gap-2">
                             <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Select</span>
                             <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === filteredItems.length} onChange={toggleAll} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                           </div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isMonthlyView ? (
                    monthlyGrouped.length === 0 ? (
                      <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly Call Plans</td></tr>
                    ) : monthlyGrouped.map((item: any, idx: number) => {
                      const dt = new Date(item.year, item.monthIndex, 1);
                      const mName = dt.toLocaleString('default', { month: 'long' });
                      return (
                        <tr key={item._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-4 text-sm font-bold text-white capitalize">{mName}</td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-300">{item.year}</td>
                          <td className="px-4 py-4 text-sm font-bold text-sky-400">{item.employeeName}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{item.designation}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{item.reportingManager}</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => setDetailedMonthId(item._id)} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                              <Eye size={18} strokeWidth={2.5}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    filteredItems.length === 0 ? (
                      <tr><td colSpan={9} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Call Plans</td></tr>
                    ) : filteredItems.map((d: any, idx: number) => {
                      let dCount = 0, cCount = 0, sCount = 0;
                      try { dCount = JSON.parse(d.doctors || '[]').length; } catch(e){}
                      try { cCount = JSON.parse(d.chemists || '[]').length; } catch(e){}
                      try { sCount = JSON.parse(d.stockists || '[]').length; } catch(e){}
                      
                      const dateObj = new Date(d.date);
                      const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()];

                      return (
                        <tr key={d._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-300">{dayName}</td>
                          <td className="px-4 py-4 text-sm font-bold text-sky-400">{d.employeeName || d.employeeId}</td>
                          <td className="px-4 py-4 text-center text-sm font-bold text-emerald-400">{dCount}</td>
                          <td className="px-4 py-4 text-center text-sm font-bold text-emerald-400">{cCount}</td>
                          <td className="px-4 py-4 text-center text-sm font-bold text-emerald-400">{sCount}</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => setDetailedDateData({employeeId: d.employeeId, date: d.date, name: d.employeeName})} className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                              <Eye size={18} strokeWidth={2.5}/>
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <input type="checkbox" checked={selectedRows.includes(d._id)} onChange={() => toggleRow(d._id)} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
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
