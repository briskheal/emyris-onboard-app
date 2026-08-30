import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle } from 'lucide-react';

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
      const key = `${i.employeeId}_${i.date}`;
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
      setSelectedRows(groupedData.map(d => `${d.employeeId}_${d.date}`));
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
          date
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
    const formattedDate = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const doctorCalls = activeGroup?.calls.filter(c => c.entityType === 'Doctor') || [];
    const chemistCalls = activeGroup?.calls.filter(c => c.entityType === 'Chemist') || [];
    const stockistCalls = activeGroup?.calls.filter(c => c.entityType === 'Stockist') || [];

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
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
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Month</div>
                  <div className="text-sm font-bold text-white capitalize">{monthName}</div>
               </div>
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Area Type</div>
                  <div className="text-sm font-bold text-white">{activeGroup?.areaType || '-'}</div>
               </div>
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Work Areas</div>
                  <div className="text-sm font-bold text-sky-400">{activeGroup?.workAreas || '-'}</div>
               </div>
            </div>

            <div className="flex gap-6 mb-6 px-2">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div> <span className="text-xs font-black uppercase tracking-widest text-slate-400">Planned</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"></div> <span className="text-xs font-black uppercase tracking-widest text-slate-400">Unplanned</span></div>
            </div>

            <div className="flex gap-6">
              <div className="flex-1 space-y-6">
                 {/* DOCTOR CALLS */}
                 <div>
                    <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">DOCTOR CALLS</h3>
                    <div className="space-y-2">
                      {doctorCalls.length === 0 ? <div className="text-slate-500 text-sm italic px-2">No calls</div> : doctorCalls.map((c, i) => (
                        <div key={i} className="bg-[#151521] border border-[#3b3b5a] rounded-lg p-4 flex justify-between items-center hover:bg-[#27273f]/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-pink-500' : 'bg-sky-500'}`}></div>
                              <span className="text-sm font-bold text-white">{c.entityName}</span>
                           </div>
                           <ChevronLeft size={16} className="text-slate-500 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* CHEMIST CALLS */}
                 <div>
                    <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">CHEMIST CALLS</h3>
                    <div className="space-y-2">
                      {chemistCalls.length === 0 ? <div className="text-slate-500 text-sm italic px-2">No calls</div> : chemistCalls.map((c, i) => (
                        <div key={i} className="bg-[#151521] border border-[#3b3b5a] rounded-lg p-4 flex justify-between items-center hover:bg-[#27273f]/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-sm font-bold text-white">{c.entityName}</span>
                           </div>
                           <ChevronLeft size={16} className="text-slate-500 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* STOCKIST CALLS */}
                 <div>
                    <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">STOCKIST CALLS</h3>
                    <div className="space-y-2">
                      {stockistCalls.length === 0 ? <div className="text-slate-500 text-sm italic px-2">No calls</div> : stockistCalls.map((c, i) => (
                        <div key={i} className="bg-[#151521] border border-[#3b3b5a] rounded-lg p-4 flex justify-between items-center hover:bg-[#27273f]/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-sm font-bold text-white">{c.entityName}</span>
                           </div>
                           <ChevronLeft size={16} className="text-slate-500 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* IMAGES SIDEBAR */}
              <div className="w-64 shrink-0 bg-[#151521] border border-[#3b3b5a] rounded-xl flex items-center justify-center p-8 min-h-[400px]">
                 <span className="text-xs font-black text-sky-500 uppercase tracking-widest text-center">NO IMAGES<br/>HERE</span>
              </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
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
          </div>

          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div className="flex-1 w-full max-w-sm">
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

       <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3b3b5a] bg-[#1c1c2e]">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SHOWING ({groupedData.length}) ENTRIES</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#3b3b5a] bg-[#151521]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date ↑</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Employee Name ↑</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">Backlog</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">View</th>
                    <th className="p-4 w-16 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Select</span>
                         <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === groupedData.length} onChange={toggleAll} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                       </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Call Reports</td></tr>
                  ) : groupedData.map((d: any, idx: number) => {
                    const rowId = `${d.employeeId}_${d.date}`;
                    const dt = new Date(d.date);
                    return (
                      <tr key={rowId} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-4 text-sm font-bold text-sky-400">{d.employeeName}</td>
                        <td className="px-4 py-4 text-center">
                          {d.isBacklog ? <CheckCircle size={18} className="text-rose-500 mx-auto" /> : <XCircle size={18} className="text-slate-500 mx-auto opacity-30" />}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => setDetailedDateData({employeeId: d.employeeId, date: d.date, name: d.employeeName})} className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                            <Eye size={18} strokeWidth={2.5}/>
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
    </div>
  );
}
