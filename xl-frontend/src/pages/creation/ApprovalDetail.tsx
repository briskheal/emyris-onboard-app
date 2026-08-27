import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Filter, CheckCircle, XCircle } from 'lucide-react';

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { type } = useParams(); // e.g. "Tour Program"
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const storedUser = localStorage.getItem('xl_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const managerDesignation = user?.designation || '';

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/xl/approvals/pending?type=${encodeURIComponent(type || '')}&designation=${encodeURIComponent(managerDesignation)}`);
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
    fetchPending();
  }, [type]);

  const handleAction = async (recordId: string, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      const res = await axios.post('/api/xl/approvals/action', {
        recordId,
        type,
        action,
        remarks: ''
      });
      if (res.data.success) {
        setItems(prev => prev.filter(item => item._id !== recordId));
      } else {
        alert(res.data.message || 'Action failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sky-400 font-medium">← Back</button>
          <h1 className="text-xl font-bold text-white">Approve {type}</h1>
        </div>
        <button className="text-slate-300 active:text-white">
          <Filter size={20} />
        </button>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <p className="text-slate-300 text-center py-10">Loading...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-80">
            <h2 className="text-7xl font-black text-white drop-shadow-2xl mb-4 tracking-tighter">404</h2>
            <div className="bg-sky-500 rounded-full w-24 h-1 mb-4"></div>
            <p className="text-xs font-bold text-slate-300 tracking-widest uppercase">NO RESULTS FOUND!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item._id} className="bg-slate-700 border border-slate-600 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-bold text-sm">{item.employeeName || item.employeeEmail || item.name || 'Unknown Rep'}</h3>
                    <p className="text-xs text-slate-300">{item.hq || item.entityName || item.date || item.month || 'Pending Approval'}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.status}</span>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-600/50">
                  <button onClick={() => handleAction(item._id, 'Rejected')} className="flex-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl py-2 flex items-center justify-center gap-2 text-xs font-bold active:bg-rose-500/20">
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => handleAction(item._id, 'Approved')} className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl py-2 flex items-center justify-center gap-2 text-xs font-bold active:bg-emerald-500/20">
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
