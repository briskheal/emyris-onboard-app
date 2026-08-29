import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { label: 'TOUR PROGRAM', path: 'Tour Program' },
  { label: 'EXPENSE', path: 'Expense' },
  { label: 'CALL REPORT', path: 'Call Report' },
  { label: 'CALL PLANNING', path: 'Call Plans' },
  { label: 'LEAVE REQUEST', path: 'Leave Request' },
  { label: 'DOCTORS', path: 'Doctors' },
  { label: 'CHEMISTS', path: 'Chemists' },
  { label: 'STOCKISTS', path: 'Stockists' },
  { label: 'CITY', path: 'City' },
  { label: 'ROUTE', path: 'Routes' },
  { label: 'SECONDARY SALES', path: 'Secondary Sales' },
  { label: 'PRIMARY SALES', path: 'Primary Sales' },
  { label: 'SAMPLES', path: 'Samples' },
  { label: 'GIFTS', path: 'Gifts' },
  { label: 'GEO FENCING', path: 'Geo Fencing' },
  { label: 'DELETION REQUEST', path: 'Deletion Request' }
];

export default function Approvals() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState('Tour Program');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchCounts = async () => {
    try {
      const res = await axios.get('/api/xl/approvals/counts?designation=ADMIN');
      if (res.data.success) {
        setCounts(res.data.counts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/xl/approvals/pending?type=${encodeURIComponent(selectedModule)}&designation=ADMIN`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchPending();
  }, [selectedModule]);

  // Handle Keyboard Up/Down Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea (like remarks)
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = sidebarItems.findIndex(i => i.path === selectedModule);
        
        if (e.key === 'ArrowDown' && currentIndex < sidebarItems.length - 1) {
          setSelectedModule(sidebarItems[currentIndex + 1].path);
          setSelectedRows([]);
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          setSelectedModule(sidebarItems[currentIndex - 1].path);
          setSelectedRows([]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModule]);

  // Auto-scroll the sidebar when selectedModule changes
  useEffect(() => {
    const el = document.getElementById(`sidebar-item-${selectedModule}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedModule]);


  const handleAction = async (recordId: string, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      const res = await axios.post('/api/xl/approvals/action', {
        recordId,
        type: selectedModule,
        action,
        remarks: ''
      });
      if (res.data.success) {
        setItems(prev => prev.filter(item => item._id !== recordId));
        setSelectedRows(prev => prev.filter(id => id !== recordId));
        fetchCounts(); // refresh sidebar badges instantly
      } else {
        alert(res.data.message || 'Action failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) return alert('Select rows first');
    if (!window.confirm(`Are you sure you want to bulk ${action} ${selectedRows.length} requests?`)) return;
    
    let successCount = 0;
    for (const recordId of selectedRows) {
      try {
        const res = await axios.post('/api/xl/approvals/action', {
          recordId,
          type: selectedModule,
          action,
          remarks: 'Bulk Admin Action'
        });
        if (res.data.success) successCount++;
      } catch (e) { console.error(e); }
    }
    alert(`Successfully processed ${successCount} out of ${selectedRows.length} requests.`);
    setSelectedRows([]);
    fetchPending();
    fetchCounts(); // refresh sidebar badges instantly
  };

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRows.length === items.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(items.map(i => i._id));
    }
  };

  return (
    <div className="flex h-screen bg-[#1e1e2d] text-white overflow-hidden font-sans">
       {/* Sidebar */}
       <div className="w-64 bg-[#151521] border-r border-[#3b3b5a] flex flex-col h-full shrink-0 shadow-2xl z-10">
          <div className="p-5 border-b border-[#3b3b5a] flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#27273f]">
               <ChevronLeft size={24} />
             </button>
             <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400">Approvals</h2>
          </div>
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
             {sidebarItems.map(item => {
                const count = counts[item.path] || 0;
                const isSelected = selectedModule === item.path;
                return (
                  <button 
                    key={item.label}
                    id={`sidebar-item-${item.path}`}
                    onClick={() => { setSelectedModule(item.path); setSelectedRows([]); }}
                    className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-colors ${isSelected ? 'bg-emerald-500/10 text-emerald-400 border-r-[3px] border-emerald-400' : 'text-slate-400 hover:bg-[#27273f] hover:text-slate-200'}`}
                  >
                     <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                     {count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-rose-500/30">
                          {count > 99 ? '99+' : count}
                        </span>
                     )}
                  </button>
                );
             })}
          </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
          <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] flex justify-between items-center bg-[#1c1c2e] shrink-0">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                     <CheckCircle size={24} strokeWidth={2.5}/>
                 </div>
                 <div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">APPROVE {sidebarItems.find(i => i.path === selectedModule)?.label}</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1 tracking-wide">Showing pending requests for {selectedModule}</p>
                 </div>
             </div>
             
             {selectedRows.length > 0 && (
               <div className="flex gap-3 bg-sky-900/30 rounded-xl border border-sky-500/30 items-center px-4 py-2">
                 <span className="text-sky-400 font-bold text-sm hidden md:inline">{selectedRows.length} selected</span>
                 <div className="w-px h-6 bg-sky-500/30 mx-1 hidden md:block"></div>
                 <button onClick={() => handleBulkAction('Approved')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">Approve</button>
                 <button onClick={() => handleBulkAction('Rejected')} className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg">Reject</button>
               </div>
             )}
          </div>

          <div className="p-6 md:p-8 flex-1 overflow-y-auto">
             <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#3b3b5a] bg-[#1c1c2e]">
                        <th className="p-4 w-12 text-center">
                          <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === items.length} onChange={toggleAll} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                        </th>
                        <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Details</th>
                        <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading Data...</td></tr>
                      ) : items.length === 0 ? (
                        <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Approvals</td></tr>
                      ) : items.map(item => (
                        <tr key={item._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                          <td className="p-4 text-center">
                            <input type="checkbox" checked={selectedRows.includes(item._id)} onChange={() => toggleRow(item._id)} className="w-4 h-4 rounded bg-[#27273f] border-[#3b3b5a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#151521]" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-bold text-white">{item.employeeName || item.employeeEmail || item.name || 'Unknown User'}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{item.employeeEmail || 'No Email'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-sky-400">{item.hq || item.entityName || item.date || item.month || '-'}</td>
                          <td className="px-4 py-3"><span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">{item.status}</span></td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-300">{new Date(item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleAction(item._id, 'Approved')} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95" title="Approve">
                                <CheckCircle size={18} strokeWidth={2.5}/>
                              </button>
                              <button onClick={() => handleAction(item._id, 'Rejected')} className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95" title="Reject">
                                <XCircle size={18} strokeWidth={2.5}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
