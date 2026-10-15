import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';

export default function LeaveRequestApproval({ items, fetchPending, fetchCounts, selectedModule, viewMode = 'Pending', setViewMode = () => {} }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          type: 'Leave Request',
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
               {filteredItems.length} {filteredItems.length === 1 ? 'Entry' : 'Entries'}
             </span>
             {/* Status Legend Pills */}
             <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-300">Approved</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-300">Rejected</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div><span className="text-[11px] font-bold text-slate-300">Pending</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[11px] font-bold text-slate-300">Revoked</span></div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-[#0b0f19] border border-slate-700/60 rounded-lg p-0.5">
                <button onClick={() => { setViewMode('Pending'); setSelectedRows([]); }} className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'Pending' ? 'bg-[#242b42] text-white shadow' : 'text-slate-400 hover:text-white'}`}>Pending</button>
                <button onClick={() => { setViewMode('History'); setSelectedRows([]); }} className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'History' ? 'bg-[#242b42] text-white shadow' : 'text-slate-400 hover:text-white'}`}>History</button>
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
                    DO YOU WANT TO PROCESS {selectedRows.length} {viewMode === 'Pending' ? 'PENDING' : 'HISTORY'} LEAVE REQUEST{selectedRows.length !== 1 && 'S'}?
                  </p>
                  <div className="flex gap-4">
                    {viewMode === 'Pending' ? (
                      <>
                        <button onClick={() => handleBulkAction('Approved')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button onClick={() => handleBulkAction('Rejected')} className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
                          <XCircle size={16} /> Reject
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleBulkAction('Revoked')} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">
                          <XCircle size={16} /> Revoke
                      </button>
                    )}
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
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Start Date ↑</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">End Date ↑</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Employee Name ↑</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Reason For Leave</th>
                <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-center">Status</th>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Leave Requests Found</td></tr>
              ) : filteredItems.map((d: any, idx: number) => {
                const sd = d.startDate || d.date || '';
                const ed = d.endDate || d.date || '';
                const st = d.status || 'Pending';
                const statusColor = st === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    st === 'Rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                    st === 'Revoked' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    'bg-sky-500/20 text-sky-400 border border-sky-500/30';
                return (
                  <tr key={d._id} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                    <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                    <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10 border-r border-slate-700/30">
                      {new Date(sd).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                    </td>
                    <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap border-r border-slate-700/30">
                      {new Date(ed).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                    </td>
                    <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{d.employeeName || d.employeeId}</td>
                    <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.reason || d.remarks || '-'}</td>
                    <td className="p-3 text-center border-r border-slate-700/30">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>
                        {st}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={selectedRows.includes(d._id)} onChange={() => toggleRow(d._id)} className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" />
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