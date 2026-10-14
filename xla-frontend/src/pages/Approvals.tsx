import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import TourProgramApproval from '../components/TourProgramApproval';
import ExpenseApproval from '../components/ExpenseApproval';
import CallReportApproval from '../components/CallReportApproval';
import LeaveRequestApproval from '../components/LeaveRequestApproval';
import CallPlanApproval from '../components/CallPlanApproval';
import PerformanceApproval from '../components/PerformanceApproval';
import GenericApproval from '../components/GenericApproval';
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
  { label: 'DELETION REQUEST', path: 'Deletion Request' },
  { label: 'PERFORMANCE KPI', path: 'Performance KPI' }
];

export default function Approvals() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(sessionStorage.getItem('adminApprovalModule') || 'Tour Program');
  const [items, setItems] = useState<any[]>([]);
   // @ts-ignore
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'Pending'|'History'>('Pending');

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
      // setLoading(true);
      const res = await axios.get(`/api/xl/approvals/pending?type=${encodeURIComponent(selectedModule)}&designation=ADMIN&status=${viewMode}`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchPending();
  }, [selectedModule, viewMode]);

  // Handle Keyboard Up/Down Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea (like remarks)
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = sidebarItems.findIndex(i => i.path === selectedModule);
        
        if (e.key === 'ArrowDown' && currentIndex < sidebarItems.length - 1) {
          const p = sidebarItems[currentIndex + 1].path; sessionStorage.setItem('adminApprovalModule', p); setSelectedModule(p);
          setSelectedRows([]);
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          const p = sidebarItems[currentIndex - 1].path; sessionStorage.setItem('adminApprovalModule', p); setSelectedModule(p);
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


  // @ts-ignore
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

  // @ts-ignore
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

  // @ts-ignore
  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // @ts-ignore
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
       <div className="w-52 bg-[#151521] border-r border-[#3b3b5a] flex flex-col h-full shrink-0 shadow-2xl z-10">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center">
             <button 
               onClick={() => navigate('/admin')} 
               className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest text-xs transition-colors"
             >
               <ChevronLeft size={18} /> Approvals
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
             {sidebarItems.map(item => {
                const count = counts[item.path] || 0;
                const isSelected = selectedModule === item.path;
                return (
                  <button 
                    key={item.label}
                    id={`sidebar-item-${item.path}`}
                    onClick={() => { sessionStorage.setItem('adminApprovalModule', item.path); setSelectedModule(item.path); setSelectedRows([]); }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors text-xs font-bold uppercase tracking-wider ${isSelected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-[#27273f] hover:text-slate-200 border border-transparent'}`}
                  >
                     <span className="truncate">{item.label}</span>
                     {count > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                          {count > 99 ? '99+' : count}
                        </span>
                     )}
                  </button>
                );
             })}
          </div>
       </div>

       
       {/* Main Content */}
       {selectedModule === 'Performance KPI' ? (
           <PerformanceApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} viewMode={viewMode} setViewMode={setViewMode} />
       ) : selectedModule === 'Tour Program' ? (
         <TourProgramApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} viewMode={viewMode} setViewMode={setViewMode} />
       ) : selectedModule === 'Expense' ? (
         <ExpenseApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} viewMode={viewMode} setViewMode={setViewMode} />
       ) : selectedModule === 'Call Report' ? (
         <CallReportApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} viewMode={viewMode} setViewMode={setViewMode} />
       ) : selectedModule === 'Leave Request' ? (
         <LeaveRequestApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} viewMode={viewMode} setViewMode={setViewMode} />
       ) : selectedModule === 'Call Plans' ? (
         <CallPlanApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} viewMode={viewMode} setViewMode={setViewMode} />
       ) : (
         <GenericApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} viewMode={viewMode} setViewMode={setViewMode} />
       )}
    </div>
  );
}



