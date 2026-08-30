import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import TourProgramApproval from '../components/TourProgramApproval';
import ExpenseApproval from '../components/ExpenseApproval';
import CallReportApproval from '../components/CallReportApproval';
import LeaveRequestApproval from '../components/LeaveRequestApproval';
import CallPlanApproval from '../components/CallPlanApproval';
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
  { label: 'DELETION REQUEST', path: 'Deletion Request' }
];

export default function Approvals() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState('Tour Program');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // @ts-ignore
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
       {selectedModule === 'Tour Program' ? (
         <TourProgramApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} />
       ) : selectedModule === 'Expense' ? (
         <ExpenseApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} />
       ) : selectedModule === 'Call Report' ? (
         <CallReportApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} />
       ) : selectedModule === 'Leave Request' ? (
         <LeaveRequestApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} />
       ) : selectedModule === 'Call Plans' ? (
         <CallPlanApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} />
       ) : (
         <GenericApproval items={items} fetchPending={fetchPending} fetchCounts={fetchCounts} selectedModule={selectedModule} />
       )}
    </div>
  );
}