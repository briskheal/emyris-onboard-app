import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle } from 'lucide-react';

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

export default function CallReportApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [detailedDateData, setDetailedDateData] = useState<{employeeId: string, date: string, name: string} | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Group by Employee + Date
  const groupedData = useMemo(() => {
    const grouped: Record<string, { employeeId: string, employeeName: string, date: string, calls: any[], isBacklog: boolean, areaType: string, workAreas: string }> = {};
    items.forEach((i: any) => {
      if (selectedUser && i.employeeId !== selectedUser) return;
      const key = `${i.employeeId}_${formatDDMMYYYY(i.date)}`;
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: i.employeeId,
          employeeName: i.employeeName || i.employeeEmail || i.employeeId,
          date: i.date,
          calls: [],
          isBacklog: i.isBacklog || false, // assuming schema handles backlog flag or deduce it
          areaType: 'Local',
          workAreas: '-'
        };
      }
      grouped[key].calls.push(i);
    });
    return Object.values(grouped).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRows.length === groupedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(groupedData.map(d => `${d.employeeId}_${formatDDMMYYYY(d.date)}`));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) return;
    try {
      let successCount = 0;
      for (const rowId of selectedRows) {
        const [employeeId, ...dateParts] = rowId.split('_');
        const date = dateParts.join('_');
        const res = await axios.post('/api/xl/approvals/action', {
          type: 'CallReportGroup',
          action,
          employeeId,
          date,
          approvedBy: (JSON.parse(localStorage.getItem('user') || '{}').employeeId || JSON.parse(localStorage.getItem('user') || '{}').uid || 'Admin')
        });
        if (res.data.success) successCount++;
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

  if (detailedDateData) {
    const activeGroup = groupedData.find(g => g.employeeId === detailedDateData.employeeId && g.date === detailedDateData.date);
    const dt = new Date(detailedDateData.date);
    const monthName = dt.toLocaleString('default', { month: 'long' });
    const formattedDate = formatDDMMYYYY(detailedDateData.date);

    const doctorCalls = activeGroup?.calls.filter(c => c.entityType === 'Doctor') || [];
    const chemistCalls = activeGroup?.calls.filter(c => c.entityType === 'Chemist') || [];
    const stockistCalls = activeGroup?.calls.filter(c => c.entityType === 'Stockist') || [];

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
         <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
            <button onClick={() => setDetailedDateData(null)} className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider hover:text-sky-300 transition-colors">
               <ChevronLeft size={16} /> CALL DETAILS: {detailedDateData.name} ({formattedDate})
            </button>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                {doctorCalls.length + chemistCalls.length + stockistCalls.length} Total Calls
              </span>
              <div className="flex items-center gap-4 border-l border-slate-700/50 pl-4">
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div> <span className="text-[11px] font-bold text-slate-300">Planned</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div> <span className="text-[11px] font-bold text-slate-300">Unplanned</span></div>
              </div>
            </div>
         </div>
         
         <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</div>
                  <div className="text-xs font-bold text-white">{formattedDate}</div>
               </div>
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Month</div>
                  <div className="text-xs font-bold text-white capitalize">{monthName}</div>
               </div>
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Area Type</div>
                  <div className="text-xs font-bold text-white">{activeGroup?.areaType || '-'}</div>
               </div>
               <div className="bg-[#1e2336] border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Areas</div>
                  <div className="text-xs font-bold text-sky-400">{activeGroup?.workAreas || '-'}</div>
               </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-6">
                 {/* DOCTOR CALLS */}
                 <div>
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2.5">DOCTOR CALLS ({doctorCalls.length})</h3>
                    <div className="space-y-2">
                      {doctorCalls.length === 0 ? <div className="text-slate-500 text-xs italic">No calls</div> : doctorCalls.map((c, i) => (
                        <div key={i} className="bg-[#1e2336] border border-slate-700/60 rounded-lg p-3.5 flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-pink-500' : 'bg-sky-500'}`}></div>
                              <span className="text-xs font-bold text-white">{c.entityName}</span>
                           </div>
                           <ChevronLeft size={16} className="text-slate-500 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* CHEMIST CALLS */}
                 <div>
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2.5">CHEMIST CALLS ({chemistCalls.length})</h3>
                    <div className="space-y-2">
                      {chemistCalls.length === 0 ? <div className="text-slate-500 text-xs italic">No calls</div> : chemistCalls.map((c, i) => (
                        <div key={i} className="bg-[#1e2336] border border-slate-700/60 rounded-lg p-3.5 flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-xs font-bold text-white">{c.entityName}</span>
                           </div>
                           <ChevronLeft size={16} className="text-slate-500 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* STOCKIST CALLS */}
                 <div>
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2.5">STOCKIST CALLS ({stockistCalls.length})</h3>
                    <div className="space-y-2">
                      {stockistCalls.length === 0 ? <div className="text-slate-500 text-xs italic">No calls</div> : stockistCalls.map((c, i) => (
                        <div key={i} className="bg-[#1e2336] border border-slate-700/60 rounded-lg p-3.5 flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-xs font-bold text-white">{c.entityName}</span>
                           </div>
                           <ChevronLeft size={16} className="text-slate-500 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* IMAGES SIDEBAR */}
              <div className="w-full lg:w-64 shrink-0 bg-[#1e2336] border border-slate-700/60 rounded-xl flex items-center justify-center p-8 min-h-[300px]">
                 <span className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">NO IMAGES<br/>ATTACHED</span>
              </div>
            </div>
         </div>
      </div>
    );
  }

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
               {groupedData.length} {groupedData.length === 1 ? 'Entry' : 'Entries'}
             </span>
             {/* Status Legend Pills */}
             <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-300">Approved</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-300">Rejected</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div><span className="text-[11px] font-bold text-slate-300">Pending</span></div>
             </div>
          </div>

          <div className="flex items-center gap-3">
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
            
            {selectedRows.length > 0 && (
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
                    DO YOU WANT TO APPROVE THE {selectedRows.length} CALL REPORT{selectedRows.length !== 1 && 'S'}?
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => handleBulkAction('Approved')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleBulkAction('Rejected')} className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
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
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Date ↑</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Day</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Employee Name ↑</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border-r border-slate-700/50">Backlog</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-16 border-r border-slate-700/50">View</th>
                <th className="p-3.5 w-16 text-center">
                   <div className="flex items-center justify-center gap-1.5">
                     <span className="text-[11px] font-bold text-slate-300 uppercase">Select</span>
                     <input 
                       type="checkbox" 
                       checked={selectedRows.length > 0 && selectedRows.length === groupedData.length} 
                       onChange={toggleAll} 
                       className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" 
                     />
                   </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {groupedData.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Call Reports</td></tr>
              ) : groupedData.map((d: any, idx: number) => {
                const rowId = `${d.employeeId}_${formatDDMMYYYY(d.date)}`;
                const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d.date).getDay()];
                return (
                  <tr key={rowId} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                    <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                    <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10 border-r border-slate-700/30">{formatDDMMYYYY(d.date)}</td>
                    <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{dayName}</td>
                    <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{d.employeeName}</td>
                    <td className="p-3 text-center border-r border-slate-700/30">
                      {d.isBacklog ? <CheckCircle size={16} className="text-rose-500 mx-auto" /> : <XCircle size={16} className="text-slate-600 mx-auto opacity-40" />}
                    </td>
                    <td className="p-3 text-center border-r border-slate-700/30">
                      <button onClick={() => setDetailedDateData({employeeId: d.employeeId, date: d.date, name: d.employeeName})} className="p-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                        <Eye size={16} strokeWidth={2.5}/>
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
