import { useState, useMemo } from 'react';
import axios from 'axios';
import { Eye, ChevronLeft, Trash2, Plus, X } from 'lucide-react';

function formatDDMMYYYY(dateStr: string) {
  if (!dateStr) return '-';
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('T')[0].split('-');
      return parts[2].padStart(2, '0') + '-' + parts[1].padStart(2, '0') + '-' + parts[0];
  }
  try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
      }
  } catch (e) {}
  return dateStr;
}

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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
         {showAddModal && (
            <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1c1c2e] rounded-xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Entry - {showAddModal}</h3>
                        <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Area Type</label>
                            <select value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value})} className="w-full bg-[#0b0f19] border border-slate-700/60 rounded-lg p-2.5 text-xs text-white">
                                <option value="HQ">HQ</option><option value="EX-HQ">EX-HQ</option><option value="Out-Station">Out-Station</option><option value="Transit">Transit</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Work Area</label>
                            <input type="text" value={addForm.toMarket} onChange={e => setAddForm({...addForm, toMarket: e.target.value})} className="w-full bg-[#0b0f19] border border-slate-700/60 rounded-lg p-2.5 text-xs text-white" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Activity Type</label>
                            <select value={addForm.activityType} onChange={e => setAddForm({...addForm, activityType: e.target.value})} className="w-full bg-[#0b0f19] border border-slate-700/60 rounded-lg p-2.5 text-xs text-white">
                                <option value="Working">Working</option><option value="Leave">Leave</option><option value="Meeting">Meeting</option>
                            </select>
                        </div>
                        <button onClick={handleAddSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-4">Save Entry</button>
                    </div>
                </div>
            </div>
         )}

         {/* Calendar Detail Top Control Bar */}
         <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-4">
               <button onClick={() => { setDetailedMonthTpId(null); setSelectedRows([]); }} className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider hover:text-sky-300 transition-colors">
                  <ChevronLeft size={16} /> MONTHLY TOUR PROGRAM: {tp.month} {tp.year} ({tp.employeeName || tp.employeeId})
               </button>
               <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                 {calendarDays.length} Days
               </span>
               <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-300">Approved</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-300">Rejected</span></div>
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
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Area Type</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Work Areas</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-center">Status</th>
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
                  const rowId = `${tp._id}_${dateStr}`;
                  
                  if (holiday) {
                      return (
                          <tr key={dateStr} className="border-b border-slate-700/30 bg-rose-500/10">
                              <td className="p-3 text-[13px] font-bold text-rose-400 bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {tp.month.substring(0,3)}</td>
                              <td className="p-3 text-[13px] font-bold text-rose-400 border-r border-slate-700/30">{dayName}</td>
                              <td colSpan={5} className="p-3 text-[12px] font-black text-rose-400 tracking-wider uppercase">HOLIDAY: {holiday.title}</td>
                          </tr>
                      );
                  }
                  if (isSunday && !entry) {
                      return (
                          <tr key={dateStr} className="border-b border-slate-700/30 bg-slate-800/30">
                              <td className="p-3 text-[13px] font-bold text-slate-500 bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {tp.month.substring(0,3)}</td>
                              <td className="p-3 text-[13px] font-bold text-slate-500 border-r border-slate-700/30">{dayName}</td>
                              <td colSpan={5} className="p-3 text-[12px] font-black text-slate-600 tracking-wider uppercase">SUNDAY</td>
                          </tr>
                      );
                  }
                  
                  if (!entry) {
                      return (
                          <tr key={dateStr} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                              <td className="p-3 text-[13px] font-bold text-white bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {tp.month.substring(0,3)}</td>
                              <td className="p-3 text-[13px] font-medium text-slate-400 border-r border-slate-700/30">{dayName}</td>
                              <td colSpan={3} className="p-3 text-[13px] font-medium text-slate-500 italic border-r border-slate-700/30">No entry submitted</td>
                              <td className="p-3 text-center border-r border-slate-700/30">
                                  <button onClick={() => { setAddForm({ type: 'HQ', toMarket: '', remarks: '', activityType: 'Working' }); setShowAddModal(dateStr); }} className="px-2.5 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto transition-colors">
                                      <Plus size={13} /> Add
                                  </button>
                              </td>
                              <td className="p-3 text-center"></td>
                          </tr>
                      );
                  }

                  const status = entry.status || tp.status || 'Pending';
                  const statusColor = status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                      status === 'Rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                      'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                  return (
                    <tr key={dateStr} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-bold text-white bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{d} {tp.month.substring(0,3)}</td>
                      <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{dayName}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{entry.type || entry.areaType || '-'}</td>
                      <td className="p-3 text-[13px] text-sky-400 border-r border-slate-700/30">
                        <div className="flex items-center gap-2">
                            <span>{entry.toMarket || '-'}</span>
                            {entry.isEdited && (
                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                                    Edited
                                </span>
                            )}
                        </div>
                        {entry.activityType && entry.activityType !== 'Working' && (
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase">{entry.activityType}</div>
                        )}
                      </td>
                      <td className="p-3 text-center border-r border-slate-700/30">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-center border-r border-slate-700/30">
                         <button onClick={() => handleDeleteEntry(dateStr)} className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors mx-auto block">
                             <Trash2 size={15} />
                         </button>
                      </td>
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={selectedRows.includes(rowId)} onChange={() => toggleRow(rowId)} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
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


  // Summary / Day-wise Views
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
               {isMonthlyView ? filteredItems.length : dayWiseData.length} {((isMonthlyView ? filteredItems.length : dayWiseData.length) === 1) ? 'Entry' : 'Entries'}
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
              <span className="text-xs font-bold text-slate-300">Monthly TP</span>
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
               <div className="flex items-center gap-2">
                 <button onClick={() => handleBulkAction('Approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow transition-transform active:scale-95">
                   Approve ({selectedRows.length})
                 </button>
                 <button onClick={() => handleBulkAction('Rejected')} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow transition-transform active:scale-95">
                   Reject
                 </button>
               </div>
            )}
          </div>
       </div>

       {/* Full Width Excel Grid Table */}
       <div className="flex-1 overflow-auto custom-scrollbar bg-[#151c2c]">
          <table className="w-full text-left border-collapse relative">
            <thead>
              <tr className="bg-[#242b42] border-b border-slate-700/50 sticky top-0 z-20 shadow-sm">
                <th className="p-3.5 text-[11px] font-bold text-slate-300 text-center w-14 border-r border-slate-700/50">Sr no.</th>
                {isMonthlyView ? (
                  <>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Month ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Year ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Name ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Designation ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Reporting Manager</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-16">View</th>
                  </>
                ) : (
                  <>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Date ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Employee Name ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Designation ↑</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Area Type</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Location</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Remarks</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Activity</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Worked with</th>
                    <th className="p-3.5 w-16 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase">Select</span>
                        <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === dayWiseData.length} onChange={() => {
                          if (selectedRows.length === dayWiseData.length) setSelectedRows([]);
                          else setSelectedRows(dayWiseData.map(d => `${d.tpId}_${formatDDMMYYYY(d.date)}`));
                        }} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
                      </div>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isMonthlyView ? (
                filteredItems.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly TPs</td></tr>
                ) : filteredItems.map((item: any, idx: number) => (
                  <tr key={item._id} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                    <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                    <td className="p-3 text-[13px] font-bold text-white capitalize bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{item.month}</td>
                    <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{item.year}</td>
                    <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{item.employeeName || item.employeeId}</td>
                    <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{item.designation || "-"}</td>
                    <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{item.reportingManager || "-"}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => setDetailedMonthTpId(item._id)} className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                        <Eye size={16} strokeWidth={2.5}/>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                dayWiseData.length === 0 ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Daily TPs</td></tr>
                ) : dayWiseData.map((d: any, idx: number) => {
                  const rowId = `${d.tpId}_${formatDDMMYYYY(d.date)}`;
                  return (
                    <tr key={rowId} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                      <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10 border-r border-slate-700/30">{formatDDMMYYYY(d.date)}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{d.employeeName}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.designation}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.areaType}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.location}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.remarks}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.activity}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.workedWith}</td>
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={selectedRows.includes(rowId)} onChange={() => toggleRow(rowId)} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
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
