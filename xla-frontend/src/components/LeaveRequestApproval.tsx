import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';

export default function LeaveRequestApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
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
                    DO YOU WANT TO APPROVE THE {selectedRows.length} LEAVE REQUEST{selectedRows.length !== 1 && 'S'}?
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
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Start Date ↑</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">End Date ↑</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Employee Name ↑</th>
                    <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Reason For Leave</th>
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
                    <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Leave Requests</td></tr>
                  ) : filteredItems.map((d: any, idx: number) => {
                    const sd = d.startDate || d.date || '';
                    const ed = d.endDate || d.date || '';
                    return (
                      <tr key={d._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{new Date(sd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{new Date(ed).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-4 text-sm font-bold text-sky-400">{d.employeeName || d.employeeId}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{d.reason || d.remarks || '-'}</td>
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
