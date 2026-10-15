import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, PanelLeftClose, PanelLeftOpen,
  Calendar, Banknote, UserRound, NotebookPen, FileSignature, 
  ShoppingBag, Building2, MapPin, Map, ShieldCheck, Target, 
  Truck, Gift, Compass, Trash2, TrendingUp 
} from 'lucide-react';
import TourProgramApproval from '../components/TourProgramApproval';
import ExpenseApproval from '../components/ExpenseApproval';
import CallReportApproval from '../components/CallReportApproval';
import LeaveRequestApproval from '../components/LeaveRequestApproval';
import CallPlanApproval from '../components/CallPlanApproval';
import PerformanceApproval from '../components/PerformanceApproval';
import GenericApproval from '../components/GenericApproval';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { label: 'Tour Program', path: 'Tour Program', icon: Calendar },
  { label: 'Expense', path: 'Expense', icon: Banknote },
  { label: 'Call Report', path: 'Call Report', icon: UserRound },
  { label: 'Call Planning', path: 'Call Plans', icon: NotebookPen },
  { label: 'Leave Request', path: 'Leave Request', icon: FileSignature },
  { label: 'Doctors', path: 'Doctors', icon: UserRound },
  { label: 'Chemists', path: 'Chemists', icon: ShoppingBag },
  { label: 'Stockists', path: 'Stockists', icon: Building2 },
  { label: 'City', path: 'City', icon: MapPin },
  { label: 'Route', path: 'Routes', icon: Map },
  { label: 'Secondary Sales', path: 'Secondary Sales', icon: ShieldCheck },
  { label: 'Primary Sales', path: 'Primary Sales', icon: Target },
  { label: 'Samples', path: 'Samples', icon: Truck },
  { label: 'Gifts', path: 'Gifts', icon: Gift },
  { label: 'Geo Fencing', path: 'Geo Fencing', icon: Compass },
  { label: 'Deletion Request', path: 'Deletion Request', icon: Trash2 },
  { label: 'Performance KPI', path: 'Performance KPI', icon: TrendingUp }
];

export default function Approvals() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    <div className="flex h-full bg-[#151c2c] text-white overflow-hidden font-sans">
       {/* Sidebar */}
       <div className={`${sidebarCollapsed ? 'w-16' : 'w-48'} bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 shadow-2xl z-10 transition-all duration-200`}>
          <div className="p-3.5 border-b border-slate-800 flex flex-col gap-2.5">
             <button 
               onClick={() => navigate('/admin')} 
               className="text-white hover:text-sky-400 transition-colors flex items-center gap-1.5"
               title="Back to Admin Menu"
             >
               <ArrowLeft size={16} /> 
               {!sidebarCollapsed && (
                 <span className="font-black text-[11px] tracking-widest text-sky-400 uppercase hover:text-white transition-colors truncate">
                   BACK TO ADMIN MENU
                 </span>
               )}
             </button>
             <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
               {!sidebarCollapsed && (
                 <h2 className="text-emerald-400 font-black text-xs tracking-wider uppercase truncate">
                   APPROVALS
                 </h2>
               )}
               <button 
                 onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                 className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                 title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu to Free Space"}
               >
                 {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
               </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
             {sidebarItems.map(item => {
                const count = counts[item.path] || 0;
                const isSelected = selectedModule === item.path;
                const Icon = item.icon;
                return (
                  <button 
                    key={item.label}
                    id={`sidebar-item-${item.path}`}
                    onClick={() => { sessionStorage.setItem('adminApprovalModule', item.path); setSelectedModule(item.path); setSelectedRows([]); }}
                    title={sidebarCollapsed ? `${item.label} (${count})` : undefined}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-xs font-medium relative ${
                      sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'text-left justify-between'
                    } ${
                      isSelected 
                        ? 'bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400 shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                     <div className="flex items-center gap-2 min-w-0">
                       <Icon size={15} className={`shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                       {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                     </div>
                     {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0 ${sidebarCollapsed ? 'absolute top-1 right-1 text-[9px] px-1' : 'ml-1'}`}>
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



