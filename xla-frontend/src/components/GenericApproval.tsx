import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, XCircle } from 'lucide-react';

const MODULE_CONFIG: Record<string, any> = {
  'Doctors': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'Edited By ↑', key: 'editedBy' },
    { label: 'Name ↑', key: 'name' },
    { label: 'Degree', key: 'degree' },
    { label: 'HQ ↑', key: 'hq' },
    { label: 'Status ↑', key: 'status' }
  ],
  'Chemists': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'Edited By ↑', key: 'editedBy' },
    { label: 'Business Name', key: 'name' },
    { label: 'Proprietor Name', key: 'proprietorName' },
    { label: 'Address', key: 'address' },
    { label: 'HQ', key: 'hq' },
    { label: 'Status', key: 'status' }
  ],
  'Stockists': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'Edited By ↑', key: 'editedBy' },
    { label: 'Business Name', key: 'name' },
    { label: 'Proprietor Name', key: 'proprietorName' },
    { label: 'Address', key: 'address' },
    { label: 'Status', key: 'status' }
  ],
  'City': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'City ↑', key: 'name' },
    { label: 'HQ', key: 'hq' },
    { label: 'State', key: 'state' }
  ],
  'Route': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'From City', key: 'fromCity' },
    { label: 'To City', key: 'toCity' },
    { label: 'Area Type', key: 'areaType' },
    { label: 'Distance ↑', key: 'distance' },
    { label: 'HQ ↑', key: 'hq' },
    { label: 'State', key: 'state' }
  ],
  'Secondary Sales': [
    { label: 'Creation Date ↑', key: 'createdAt', isDate: true },
    { label: 'Invoice Number ↑', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month ↑', key: 'month' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' },
    { label: 'Total Quantity', key: 'totalQty' },
    { label: 'Sales Quantity', key: 'salesQty' }
  ],
  'Primary Sales': [
    { label: 'Creation Date ↑', key: 'createdAt', isDate: true },
    { label: 'Sales Date ↑', key: 'salesDate', isDate: true },
    { label: 'Invoice Number ↑', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' },
    { label: 'Units', key: 'units' },
    { label: 'Quantity', key: 'quantity' },
    { label: 'Free Stock', key: 'freeStock' },
    { label: 'Total Quantity', key: 'totalQty' },
    { label: 'Final Price', key: 'finalPrice' },
    { label: 'Return Value', key: 'returnValue' }
  ],
  'Samples': [
    { label: 'Alloted To ↑', key: 'employeeName' },
    { label: 'Sample ↑', key: 'productName' },
    { label: 'Alloted Qty ↑', key: 'quantity' }
  ],
  'Gifts': [
    { label: 'Alloted To ↑', key: 'employeeName' },
    { label: 'GIFT ↑', key: 'productName' },
    { label: 'Alloted Qty ↑', key: 'quantity' },
    { label: 'Amount ↑', key: 'amount' }
  ],
  'Geo Fencing': [
    { label: 'Name ↑', key: 'entityName' },
    { label: 'Requested By', key: 'employeeName' },
    { label: 'Location ↑', key: 'location' }
  ],
  'Deletion Request': [
    { label: 'Name ↑', key: 'entityName' },
    { label: 'Requested By', key: 'employeeName' }
  ]
};

export default function GenericApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const columns = MODULE_CONFIG[selectedModule] || [
    { label: 'Created By', key: 'employeeName' },
    { label: 'Details', key: 'details' }
  ];

  // Some modules don't have View icon in video
  const hasView = ['Doctors', 'Chemists', 'Stockists', 'Secondary Sales', 'Primary Sales', 'Deletion Request'].includes(selectedModule);
  const hasEntityToggles = ['Geo Fencing', 'Deletion Request'].includes(selectedModule);
  const [activeToggle, setActiveToggle] = useState('DOCTORS');

  // Filter by user
  const filteredItems = useMemo(() => {
    let res = items;
    if (selectedUser) {
      res = res.filter((i: any) => i.employeeId === selectedUser || (i.employeeName && i.employeeName.includes(selectedUser)));
    }
    if (hasEntityToggles) {
      res = res.filter((i: any) => {
        const type = i.entityType || '';
        if (activeToggle === 'DOCTORS' && type === 'Doctor') return true;
        if (activeToggle === 'CHEMISTS' && type === 'Chemist') return true;
        if (activeToggle === 'STOCKISTS' && type === 'Stockist') return true;
        return false;
      });
    }
    return res;
  }, [items, selectedUser, hasEntityToggles, activeToggle]);

  // Unique users for dropdown
  const users = useMemo(() => {
    const map = new Map();
    items.forEach((i: any) => {
      const name = i.employeeName || i.employeeEmail || i.employeeId;
      if (name && i.employeeId) {
        if (!map.has(i.employeeId)) map.set(i.employeeId, name);
      }
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
          type: selectedModule,
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

  const renderCellValue = (item: any, col: any) => {
    if (col.key === 'details') return JSON.stringify(item).substring(0, 50) + '...';
    let val = item[col.key] || '-';
    if (col.isDate && val !== '-') {
      try {
        val = new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch(e){}
    }
    return val;
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
                    DO YOU WANT TO APPROVE THE {selectedRows.length} {selectedModule.toUpperCase()}{selectedRows.length !== 1 && 'S'}?
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
            <div className="p-4 border-b border-[#3b3b5a] bg-[#1c1c2e] flex gap-4">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SHOWING ({filteredItems.length}) ENTRIES</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#3b3b5a] bg-[#151521]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                    {columns.map((col: any, i: number) => (
                      <th key={i} className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">{col.label}</th>
                    ))}
                    {hasView && <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">View</th>}
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
                    <tr><td colSpan={columns.length + 3} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Data Found</td></tr>
                  ) : filteredItems.map((d: any, idx: number) => {
                    return (
                      <tr key={d._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        {columns.map((col: any, i: number) => (
                          <td key={i} className={`px-4 py-4 text-sm font-bold ${i === 0 ? 'text-sky-400' : 'text-slate-300'}`}>
                            {renderCellValue(d, col)}
                          </td>
                        ))}
                        {hasView && (
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => alert('View details feature coming soon')} className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                              <Eye size={18} strokeWidth={2.5}/>
                            </button>
                          </td>
                        )}
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
