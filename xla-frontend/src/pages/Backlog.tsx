import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BacklogRequest {
  _id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  reason: string;
  status: string;
  adminRemarks: string;
  createdAt: string;
}

export default function Backlog() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BacklogRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/xl-backlog');
      setRequests(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch backlog requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'Approve' | 'Reject') => {
    const remarks = window.prompt(`Enter remarks for ${action} (Optional):`);
    if (remarks === null) return; // cancelled

    try {
      await axios.post(`/api/admin/xl-backlog/${id}/action`, { action, remarks });
      fetchRequests(); // Refresh list
    } catch (e) {
      alert('Action failed.');
    }
  };

  const filtered = requests.filter(r => filter === 'All' || r.status === filter);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">BACKLOG APPROVALS</h1>
            <p className="text-[9px] font-bold text-sky-400 tracking-widest uppercase mt-0.5">Manage Unlock Requests</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col flex-1">
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800 rounded-lg overflow-x-auto">
          {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-md transition-colors ${filter === f ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-10">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Check size={48} className="text-slate-600" />
            </div>
            <h2 className="text-lg font-black text-slate-300 tracking-widest uppercase">ALL CAUGHT UP</h2>
            <p className="text-sm font-medium text-slate-500 mt-2 text-center">
              No {filter.toLowerCase()} backlog requests found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => (
              <div key={req._id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{req.employeeName}</h3>
                    <p className="text-xs font-medium text-slate-400">{req.employeeId}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                    req.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                    req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {req.status}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-300 mb-2 bg-slate-900/50 p-2 rounded-lg">
                  <Calendar size={14} className="text-sky-400" />
                  <span className="font-semibold">Requested Date:</span>
                  <span className="text-white font-bold">{req.date}</span>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-lg">
                  <MessageSquare size={14} className="text-slate-400 mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold block mb-1 text-xs text-slate-400 uppercase tracking-wider">Reason provided:</span>
                    <span className="italic text-slate-200">{req.reason || 'No reason provided'}</span>
                  </div>
                </div>

                {req.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/50">
                    <button 
                      onClick={() => handleAction(req._id, 'Reject')}
                      className="flex items-center justify-center gap-2 bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold py-3 rounded-xl transition-all"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction(req._id, 'Approve')}
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/50 transition-all"
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                )}
                
                {req.adminRemarks && req.status !== 'Pending' && (
                  <div className="flex items-start gap-2 text-sm text-slate-300 mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <AlertCircle size={14} className="text-slate-400 mt-1 shrink-0" />
                    <div>
                      <span className="font-semibold block mb-1 text-xs text-slate-400 uppercase tracking-wider">Admin Remarks:</span>
                      <span className="italic text-slate-200">{req.adminRemarks}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
