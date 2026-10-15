import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle, Trash2 } from 'lucide-react';

const formatDDMMYYYY = (dStr: any) => {
  if (!dStr) return '-';
  const s = String(dStr).split('T')[0];
  const parts = s.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }
  const dt = new Date(dStr);
  if (isNaN(dt.getTime())) return String(dStr);
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
};

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

  const doctorMap = useMemo(() => new Map(allDoctors.map(d => [d.uid || d._id, d.doctorName])), [allDoctors]);
  const chemistMap = useMemo(() => new Map(allChemists.map(c => [c.uid || c._id, c.chemistName])), [allChemists]);
  const stockistMap = useMemo(() => new Map(allStockists.map(s => [s.uid || s._id, s.stockistName])), [allStockists]);

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
    const formattedDate = dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');

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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
         <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
            <button onClick={() => setDetailedDateData(null)} className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider hover:text-sky-300 transition-colors">
               <ChevronLeft size={16} /> CALL DETAILS: {detailedDateData.name} ({formattedDate})
            </button>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
              {doctorCalls.length + chemistCalls.length + stockistCalls.length} Total Calls
            </span>
         </div>
         
         <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</div>
                  <div className="text-xs font-bold text-white">{formattedDate}</div>
               </div>
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doctors</div>
                  <div className="text-xs font-bold text-emerald-400">{doctorCalls.length}</div>
               </div>
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chemists</div>
                  <div className="text-xs font-bold text-emerald-400">{chemistCalls.length}</div>
               </div>
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stockists</div>
                  <div className="text-xs font-bold text-emerald-400">{stockistCalls.length}</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#1e2336] rounded-xl border border-slate-700/60 p-4">
                 <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">Doctors Planned ({doctorCalls.length})</h4>
                 {doctorCalls.length === 0 ? <p className="text-slate-500 text-xs italic">No doctors planned</p> : (
                   <div className="space-y-2">
                     {doctorCalls.map((n, i) => <div key={i} className="flex items-center gap-2.5 bg-[#151c2c] p-2.5 rounded-lg border border-slate-700/40 text-xs font-bold text-slate-200"><div className="w-5 h-5 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center text-[10px] font-bold">{i+1}</div><span>{n}</span></div>)}
                   </div>
                 )}
               </div>

               <div className="bg-[#1e2336] rounded-xl border border-slate-700/60 p-4">
                 <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">Chemists Planned ({chemistCalls.length})</h4>
                 {chemistCalls.length === 0 ? <p className="text-slate-500 text-xs italic">No chemists planned</p> : (
                   <div className="space-y-2">
                     {chemistCalls.map((n, i) => <div key={i} className="flex items-center gap-2.5 bg-[#151c2c] p-2.5 rounded-lg border border-slate-700/40 text-xs font-bold text-slate-200"><div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">{i+1}</div><span>{n}</span></div>)}
                   </div>
                 )}
               </div>

               <div className="bg-[#1e2336] rounded-xl border border-slate-700/60 p-4">
                 <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">Stockists Planned ({stockistCalls.length})</h4>
                 {stockistCalls.length === 0 ? <p className="text-slate-500 text-xs italic">No stockists planned</p> : (
                   <div className="space-y-2">
                     {stockistCalls.map((n, i) => <div key={i} className="flex items-center gap-2.5 bg-[#151c2c] p-2.5 rounded-lg border border-slate-700/40 text-xs font-bold text-slate-200"><div className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-[10px] font-bold">{i+1}</div><span>{n}</span></div>)}
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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
         <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-4">
               <button onClick={() => { setDetailedMonthId(null); setSelectedRows([]); }} className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider hover:text-sky-300 transition-colors">
                  <ChevronLeft size={16} /> MONTHLY CALL PLAN: {grp.monthKey} ({grp.employeeName || grp.employeeId})
               </button>
               <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                 {calendarDays.length} Days
               </span>
               <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[11px] font-bold text-slate-300">Pending</span></div>
               </div>
            </div>

            {selectedRows.length > 0 && (
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-300">{selectedRows.length} selected</span>
                 <button onClick={() => handleBulkAction('Approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow">Approve</button>
                 <button onClick={() => handleBulkAction('Rejected')} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow">Reject</button>
               </div>
            )}
         </div>

         {/* Calendar Grid Table */}
         <div className="flex-1 overflow-auto custom-scrollbar bg-[#151c2c]">
            <table className="w-full text-left border-collapse relative">
              <thead>
                <tr className="bg-[#242b42] border-b border-slate-700/50 sticky top-0 z-20 shadow-sm">
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Date</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Day</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-center">Doctors</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-center">Chemists</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-center">Stockists</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-center">Actions</th>
                  <th className="p-3.5 w-16 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">Select</span>
                      <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === calendarDays.filter(d => d.entry).length} onChange={toggleMonthAll} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {calendarDays.map((dayItem) => {
                  const { d, dateStr, dateObj, isSunday, holiday, entry } = dayItem;
                  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()];
                  
                  if (holiday) {
                      return (
                          <tr key={dateStr} className="border-b border-slate-700/30 bg-rose-500/10">
                              <td className="p-3 text-[13px] font-bold text-rose-400 bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {monthShort}</td>
                              <td className="p-3 text-[13px] font-bold text-rose-400 border-r border-slate-700/30">{dayName}</td>
                              <td colSpan={5} className="p-3 text-[12px] font-black text-rose-400 tracking-wider uppercase">HOLIDAY: {holiday.title}</td>
                          </tr>
                      );
                  }
                  if (isSunday && !entry) {
                      return (
                          <tr key={dateStr} className="border-b border-slate-700/30 bg-slate-800/30">
                              <td className="p-3 text-[13px] font-bold text-slate-500 bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {monthShort}</td>
                              <td className="p-3 text-[13px] font-bold text-slate-500 border-r border-slate-700/30">{dayName}</td>
                              <td colSpan={5} className="p-3 text-[12px] font-black text-slate-600 tracking-wider uppercase">SUNDAY</td>
                          </tr>
                      );
                  }
                  
                  if (!entry) {
                      return (
                          <tr key={dateStr} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                              <td className="p-3 text-[13px] font-bold text-white bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {monthShort}</td>
                              <td className="p-3 text-[13px] font-medium text-slate-400 border-r border-slate-700/30">{dayName}</td>
                              <td colSpan={5} className="p-3 text-[13px] font-medium text-slate-500 italic">No Call Plan submitted</td>
                          </tr>
                      );
                  }

                  let dCount = 0, cCount = 0, sCount = 0;
                  try { dCount = JSON.parse(entry.doctors || '[]').length; } catch(e){}
                  try { cCount = JSON.parse(entry.chemists || '[]').length; } catch(e){}
                  try { sCount = JSON.parse(entry.stockists || '[]').length; } catch(e){}

                  return (
                    <tr key={dateStr} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-bold text-white bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {monthShort}</td>
                      <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{dayName}</td>
                      <td className="p-3 text-center text-[13px] font-bold text-emerald-400 border-r border-slate-700/30">{dCount}</td>
                      <td className="p-3 text-center text-[13px] font-bold text-emerald-400 border-r border-slate-700/30">{cCount}</td>
                      <td className="p-3 text-center text-[13px] font-bold text-emerald-400 border-r border-slate-700/30">{sCount}</td>
                      <td className="p-3 text-center border-r border-slate-700/30">
                         <div className="flex items-center justify-center gap-2">
                             <button onClick={() => setDetailedDateData({employeeId: entry.employeeId, date: entry.date, name: entry.employeeName})} className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded transition-colors">
                                 <Eye size={16} />
                             </button>
                             <button onClick={() => handleDeleteEntry(entry._id, dateStr)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors">
                                 <Trash2 size={16} />
                             </button>
                         </div>
                      </td>
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={selectedRows.includes(entry._id)} onChange={() => toggleRow(entry._id)} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
         </div>
      </div>
    );
  }

  // --- 3. MAIN APPROVAL LIST VIEW ---
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
       {/* Top Control Bar */}
       <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                 <h1 className="text-sm font-black text-white uppercase tracking-wider">APPROVE {selectedModule}</h1>
             </div>
             <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
               {isMonthlyView ? monthlyGrouped.length : filteredItems.length} {((isMonthlyView ? monthlyGrouped.length : filteredItems.length) === 1) ? 'Entry' : 'Entries'}
             </span>
             {/* Status Legend Pills */}
             <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-300">Approved</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-300">Rejected</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div><span className="text-[11px] font-bold text-slate-300">Pending</span></div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Monthly View Toggle Switch */}
            <div 
              onClick={() => { setIsMonthlyView(!isMonthlyView); setSelectedRows([]); }}
              className="flex items-center gap-2 bg-[#0b0f19] px-2.5 py-1 rounded-lg border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isMonthlyView ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isMonthlyView ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-xs font-bold text-slate-300">Monthly Call Plan</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide hidden sm:inline">User:</span>
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)} 
                className="bg-[#0b0f19] border border-slate-700/60 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-sky-500"
              >
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            
            {selectedRows.length > 0 && !isMonthlyView && (
               <button 
                 onClick={() => setShowConfirmModal(true)} 
                 className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow transition-transform active:scale-95"
               >
                 <CheckCircle size={14} /> Actions ({selectedRows.length})
               </button>
            )}
          </div>
       </div>

       {showConfirmModal && (
          <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-[#1c1c2e] border border-slate-700 shadow-2xl rounded-2xl w-full max-w-md p-6 relative">
               <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
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

       {/* Full Width Excel Grid Table */}
       <div className="flex-1 overflow-auto custom-scrollbar bg-[#151c2c]">
          <table className="w-full text-left border-collapse relative">
            <thead>
              <tr className="bg-[#242b42] border-b border-slate-700/50 sticky top-0 z-20 shadow-sm">
                <th className="p-3.5 text-[11px] font-bold text-slate-300 text-center w-14 border-r border-slate-700/50">Sr no.</th>
                {isMonthlyView ? (
                  <>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Month</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Year</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Name</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Designation</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Reporting Manager</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-16">View</th>
                  </>
                ) : (
                  <>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Date</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Day</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Employee Name</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border-r border-slate-700/50">Doctors</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border-r border-slate-700/50">Chemists</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border-r border-slate-700/50">Stockists</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-16 border-r border-slate-700/50">View</th>
                    <th className="p-3.5 w-16 text-center">
                       <div className="flex items-center justify-center gap-1.5">
                         <span className="text-[11px] font-bold text-slate-300 uppercase">Select</span>
                         <input 
                           type="checkbox" 
                           checked={selectedRows.length > 0 && selectedRows.length === filteredItems.length} 
                           onChange={toggleAll} 
                           className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" 
                         />
                       </div>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isMonthlyView ? (
                monthlyGrouped.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly Call Plans</td></tr>
                ) : monthlyGrouped.map((item: any, idx: number) => {
                  const dt = new Date(item.year, item.monthIndex, 1);
                  const mName = dt.toLocaleString('default', { month: 'long' });
                  return (
                    <tr key={item._id} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                      <td className="p-3 text-[13px] font-bold text-white capitalize bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{mName}</td>
                      <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{item.year}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{item.employeeName}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{item.designation}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{item.reportingManager}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setDetailedMonthId(item._id)} className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                          <Eye size={16} strokeWidth={2.5}/>
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
                    <tr key={d._id} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                      <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10 border-r border-slate-700/30">{formatDDMMYYYY(d.date)}</td>
                      <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{dayName}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{d.employeeName || d.employeeId}</td>
                      <td className="p-3 text-center text-[13px] font-bold text-emerald-400 border-r border-slate-700/30">{dCount}</td>
                      <td className="p-3 text-center text-[13px] font-bold text-emerald-400 border-r border-slate-700/30">{cCount}</td>
                      <td className="p-3 text-center text-[13px] font-bold text-emerald-400 border-r border-slate-700/30">{sCount}</td>
                      <td className="p-3 text-center border-r border-slate-700/30">
                        <button onClick={() => setDetailedDateData({employeeId: d.employeeId, date: d.date, name: d.employeeName})} className="p-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                          <Eye size={16} strokeWidth={2.5}/>
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={selectedRows.includes(d._id)} onChange={() => toggleRow(d._id)} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
}
