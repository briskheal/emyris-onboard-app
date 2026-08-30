import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle } from 'lucide-react';

export default function CallPlanApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [detailedDateData, setDetailedDateData] = useState<{employeeId: string, date: string, name: string} | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [allChemists, setAllChemists] = useState<any[]>([]);
  const [allStockists, setAllStockists] = useState<any[]>([]);

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
  }, []);

  const doctorMap = useMemo(() => new Map(allDoctors.map(d => [d.doctorCode || d._id, d.doctorName])), [allDoctors]);
  const chemistMap = useMemo(() => new Map(allChemists.map(c => [c.chemistCode || c._id, c.chemistName])), [allChemists]);
  const stockistMap = useMemo(() => new Map(allStockists.map(s => [s.stockistCode || s._id, s.stockistName])), [allStockists]);

  // Filter by user
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

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredItems.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredItems.map((d: any) => d._id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) return;
    try {
      let successCount = 0;
      for (const id of selectedRows) {
        const res = await axios.post('/api/xl/approvals/action', {
          type: 'Call Plans',
          action,
          recordId: id
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
    const activeItem = filteredItems.find((i: any) => i.employeeId === detailedDateData.employeeId && i.date === detailedDateData.date);
    const dt = new Date(detailedDateData.date);
    const monthName = dt.toLocaleString('default', { month: 'long' });
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
                  <div className="text-sm font-bold text-white">-</div>
               </div>
               <div className="bg-[#151521] border border-[#3b3b5a] rounded-xl p-4 text-center">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Work Areas</div>
                  <div className="text-sm font-bold text-sky-400">-</div>
               </div>
            </div>

            <div className="flex gap-6 mb-6 px-2">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div> <span className="text-xs font-black uppercase tracking-widest text-slate-400">Planned</span></div>
            </div>

            <div className="flex gap-6">
              <div className="flex-1 space-y-6">
                 {/* DOCTOR CALLS */}
                 <div>
                    <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">DOCTOR CALLS</h3>
                    <div className="space-y-2">
                      {doctorCalls.length === 0 ? <div className="text-slate-500 text-sm italic px-2">No doctors planned</div> : doctorCalls.map((name, i) => (
                        <div key={i} className="bg-[#151521] border border-[#3b3b5a] rounded-lg p-4 flex justify-between items-center hover:bg-[#27273f]/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-sm font-bold text-white">{name}</span>
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
                      {chemistCalls.length === 0 ? <div className="text-slate-500 text-sm italic px-2">No chemists planned</div> : chemistCalls.map((name, i) => (
                        <div key={i} className="bg-[#151521] border border-[#3b3b5a] rounded-lg p-4 flex justify-between items-center hover:bg-[#27273f]/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-sm font-bold text-white">{name}</span>
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
                      {stockistCalls.length === 0 ? <div className="text-slate-500 text-sm italic px-2">No stockists planned</div> : stockistCalls.map((name, i) => (
                        <div key={i} className="bg-[#151521] border border-[#3b3b5a] rounded-lg p-4 flex justify-between items-center hover:bg-[#27273f]/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-sm font-bold text-white">{name}</span>
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
                    DO YOU WANT TO APPROVE THE {selectedRows.length} CALL PLANNING REPORT{selectedRows.length !== 1 && 'S'}?
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
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SHOWING ({filteredItems.length}) ENTRIES</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#3b3b5a] bg-[#151521]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date ↑</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Employee Name ↑</th>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Call Plans</td></tr>
                  ) : filteredItems.map((d: any, idx: number) => {
                    let dCount = 0, cCount = 0, sCount = 0;
                    try { dCount = JSON.parse(d.doctors || '[]').length; } catch(e){}
                    try { cCount = JSON.parse(d.chemists || '[]').length; } catch(e){}
                    try { sCount = JSON.parse(d.stockists || '[]').length; } catch(e){}

                    return (
                      <tr key={d._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
       </div>
    </div>
  );
}
