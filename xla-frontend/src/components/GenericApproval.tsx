import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Eye, XCircle } from 'lucide-react';

const MODULE_CONFIG: Record<string, any> = {
  'Doctors': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'Edited By ↑', key: 'editedBy' },
    { label: 'Name ↑', key: 'name' },
    { label: 'Degree', key: 'degree' },
    { label: 'Visit Days', key: 'visitDays' },
    { label: 'HQ ↑', key: 'headquarter' },
    { label: 'Status ↑', key: 'status' }
  ],
  'Chemists': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'Edited By ↑', key: 'editedBy' },
    { label: 'Business Name', key: 'businessName' },
    { label: 'Proprietor Name', key: 'proprietorName' },
    { label: 'Address', key: 'address' },
    { label: 'HQ', key: 'headquarter' },
    { label: 'Status', key: 'status' }
  ],
  'Stockists': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'Edited By ↑', key: 'editedBy' },
    { label: 'Business Name', key: 'businessName' },
    { label: 'Proprietor Name', key: 'proprietorName' },
    { label: 'Address', key: 'address' },
    { label: 'HQ', key: 'headquarter' },
    { label: 'Status', key: 'status' }
  ],
  'City': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'City ↑', key: 'name' },
    { label: 'HQ', key: 'headquarter' },
    { label: 'State', key: 'state' }
  ],
  'Route': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'From City', key: 'fromCity' },
    { label: 'To City', key: 'toCity' },
    { label: 'Area Type', key: 'areaType' },
    { label: 'Distance', key: 'distance' },
    { label: 'HQ', key: 'headquarter' },
    { label: 'State', key: 'state' },
    { label: 'Status', key: 'status' }
  ],
  'Routes': [
    { label: 'Created By ↑', key: 'employeeName' },
    { label: 'From City', key: 'fromCity' },
    { label: 'To City', key: 'toCity' },
    { label: 'Area Type', key: 'areaType' },
    { label: 'Distance', key: 'distance' },
    { label: 'HQ', key: 'headquarter' },
    { label: 'State', key: 'state' },
    { label: 'Status', key: 'status' }
  ],
  'Secondary Sales': [
    { label: 'Creation Date ↑', key: 'createdAt', isDate: true },
    { label: 'Invoice Number ↑', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month', key: 'month' },
    { label: 'Stockist', key: 'stockist' },
    { label: 'Headquarter', key: 'headquarter' }
  ],
  'Primary Sales': [
    { label: 'Creation Date ↑', key: 'createdAt', isDate: true },
    { label: 'Sales Date ↑', key: 'date', isDate: true },
    { label: 'Invoice Number ↑', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockist' },
    { label: 'Headquarter', key: 'headquarter' },
    
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
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const getColumns = (mod: string) => {
    if (!mod) return [];
    if (MODULE_CONFIG[mod]) return MODULE_CONFIG[mod];
    const modLower = mod.toLowerCase().trim();
    for (const k of Object.keys(MODULE_CONFIG)) {
      const kLower = k.toLowerCase().trim();
      if (kLower === modLower || kLower.replace(/s$/, '') === modLower.replace(/s$/, '')) {
        return MODULE_CONFIG[k];
      }
    }
    return [
      { label: 'Created By ↑', key: 'employeeName' },
      { label: 'From City', key: 'fromCity' },
      { label: 'To City', key: 'toCity' },
      { label: 'Area Type', key: 'areaType' },
      { label: 'Distance', key: 'distance' },
      { label: 'HQ', key: 'headquarter' },
      { label: 'State', key: 'state' },
      { label: 'Status', key: 'status' }
    ];
  };

  const columns = getColumns(selectedModule);

  // Some modules don't have View icon in video
  const hasView = ['Doctors', 'Chemists', 'Stockists', 'Deletion Request'].includes(selectedModule);
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
      const id = i.employeeId || i.userAllotted;
      const name = i.employeeName || i.employeeEmail || id;
      if (id && name) {
        if (!map.has(id)) map.set(id, name);
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
          recordId: id,
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

  const renderCellValue = (item: any, col: any) => {
    if (col.key === 'details') {
      if (item.details) return item.details;
      if (item.fromCity && item.toCity) {
        return `${item.fromCity} → ${item.toCity} (${item.areaType || ''}, ${item.distance ?? 0} KM)`;
      }
      return item.name || item.businessName || '-';
    }
    if (col.key === 'proprietorName') return item.proprietorName || item.name || '-';
    if (col.key === 'employeeName') {
      const name = item.employeeName || item.userAllotted || item.employeeId;
      return (name && name !== '-') ? name : 'Admin';
    }
    if (col.key === 'distance') {
      const d = item.distance;
      if (d === 0 || d === '0') return '0 KM';
      return (d !== undefined && d !== null && d !== '') ? `${d} KM` : '-';
    }
    if (col.key === 'status') {
      const st = item.status || 'Pending';
      const color = st === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    st === 'Rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${color}`}>{st}</span>;
    }
    let val = (item[col.key] !== undefined && item[col.key] !== null && item[col.key] !== '') ? item[col.key] :
      (col.key === 'businessName' ? item.name : undefined) ||
      (col.key === 'name' ? (item.cityName || item.businessName) : undefined) ||
      (col.key === 'headquarter' ? item.hq : undefined) || 
      (col.key === 'hq' ? item.headquarter : undefined) ||
      '-';
    if (col.isDate && val !== '-') {
      try {
        val = new Date(val).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      } catch(e){}
    }
    return val;
  };

  const handleViewItem = (item: any) => {
    if (selectedModule === 'Primary Sales') {
      navigate('/extras/primary-sales/edit/' + item._id);
    } else if (selectedModule === 'Secondary Sales') {
      navigate('/extras/secondary/edit/' + item._id);
    } else if (selectedModule === 'Doctors') {
      navigate('/admin/dcs', {
        state: {
          activeTab: 'create_doctor',
          approvalData: item,
          approvalType: 'Doctor',
          isApprovalView: true
        }
      });
    } else if (selectedModule === 'Chemists') {
      navigate('/admin/dcs', {
        state: {
          activeTab: 'create_chemist',
          approvalData: item,
          approvalType: 'Chemist',
          isApprovalView: true
        }
      });
    } else if (selectedModule === 'Stockists') {
      navigate('/admin/dcs', {
        state: {
          activeTab: 'create_stockist',
          approvalData: item,
          approvalType: 'Stockist',
          isApprovalView: true
        }
      });
    } else {
      alert('View details feature coming soon');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
       {/* Top Control Bar - Excel Header Style matching Expense.tsx */}
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
             </div>
          </div>

          <div className="flex items-center gap-3">
            {hasEntityToggles && (
              <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-lg border border-slate-700/60">
                 {['DOCTORS', 'STOCKISTS', 'CHEMISTS'].map((t) => (
                   <button
                     key={t}
                     onClick={() => setActiveToggle(t)}
                     className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${activeToggle === t ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
                   >
                     {t}
                   </button>
                 ))}
              </div>
            )}

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
                    DO YOU WANT TO APPROVE THE {selectedRows.length} {selectedModule.toUpperCase()}{selectedRows.length !== 1 && !selectedModule.toUpperCase().endsWith('S') ? 'S' : ''}?
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
                {columns.map((col: any, i: number) => (
                  <th key={i} className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">
                    {col.label}
                  </th>
                ))}
                {hasView && (
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 text-center w-16 border-r border-slate-700/50">
                    View
                  </th>
                )}
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
                <tr>
                  <td colSpan={columns.length + 3} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
                    No Records Found
                  </td>
                </tr>
              ) : filteredItems.map((d: any, idx: number) => {
                return (
                  <tr 
                    key={d._id} 
                    onClick={() => {
                      if (['Primary Sales', 'Secondary Sales', 'Doctors', 'Chemists', 'Stockists'].includes(selectedModule)) {
                        handleViewItem(d);
                      }
                    }} 
                    className={`hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group ${['Primary Sales', 'Secondary Sales', 'Doctors', 'Chemists', 'Stockists'].includes(selectedModule) ? 'cursor-pointer' : ''}`}
                  >
                    <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">
                      {idx + 1}
                    </td>
                    {columns.map((col: any, i: number) => (
                      <td key={i} className={`p-3 text-[13px] border-r border-slate-700/30 ${i === 0 ? 'font-bold text-white whitespace-nowrap bg-slate-800/10' : 'font-medium text-slate-300'}`}>
                        {renderCellValue(d, col)}
                      </td>
                    ))}
                    {hasView && (
                      <td className="p-2 text-center border-r border-slate-700/30">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewItem(d);
                          }} 
                          title="View & Review Details" 
                          className="p-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block"
                        >
                          <Eye size={15} strokeWidth={2.5}/>
                        </button>
                      </td>
                    )}
                    <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(d._id)} 
                          onChange={() => toggleRow(d._id)} 
                          className="w-3.5 h-3.5 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500" 
                        />
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

