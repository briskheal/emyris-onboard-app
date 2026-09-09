import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
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
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

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
    const remarks = remarksMap[id] || '';
    
    if (action === 'Reject' && !remarks.trim()) {
      alert('Remarks cannot be blank when rejecting a request.');
      return;
    }

    try {
      await axios.post(`/api/admin/xl-backlog/${id}/action`, { action, remarks });
      
      // Clear remark for this id
      setRemarksMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      
      fetchRequests(); // Refresh list
    } catch (e) {
      alert('Action failed.');
    }
  };

  const filtered = requests.filter(r => filter === 'All' || r.status === filter);
  
  if (filter === 'Pending') {
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">BACKLOG APPROVALS</h1>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 overflow-auto">
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800 rounded-lg w-max">
          {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 text-sm font-bold rounded-md transition-colors ${filter === f ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
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
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <h2 className="text-xl font-black text-slate-400 tracking-widest uppercase">ALL CAUGHT UP</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">
              No {filter.toLowerCase()} backlog requests found.
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-bold whitespace-nowrap">Srl No.</th>
                    <th className="p-4 font-bold whitespace-nowrap">Backlog Date</th>
                    <th className="p-4 font-bold whitespace-nowrap">Emp ID</th>
                    <th className="p-4 font-bold whitespace-nowrap">Emp Name</th>
                    <th className="p-4 font-bold min-w-[200px]">Reason of Backlog</th>
                    <th className="p-4 font-bold min-w-[200px]">Remarks</th>
                    <th className="p-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {filtered.map((req, i) => (
                    <tr key={req._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 text-slate-400 font-medium">{i + 1}</td>
                      <td className="p-4 font-bold text-white whitespace-nowrap">{req.date}</td>
                      <td className="p-4 text-slate-300 whitespace-nowrap">{req.employeeId}</td>
                      <td className="p-4 font-bold text-sky-400 whitespace-nowrap">{req.employeeName}</td>
                      <td className="p-4 text-slate-300 italic">{req.reason || '-'}</td>
                      <td className="p-4">
                        {req.status === 'Pending' ? (
                          <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            placeholder="Enter remarks..."
                            value={remarksMap[req._id] || ''}
                            onChange={e => setRemarksMap({...remarksMap, [req._id]: e.target.value})}
                          />
                        ) : (
                          <span className="text-slate-400">{req.adminRemarks || '-'}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleAction(req._id, 'Approve')}
                              className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check size={18} strokeWidth={3} />
                            </button>
                            <button 
                              onClick={() => handleAction(req._id, 'Reject')}
                              className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X size={18} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                            req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {req.status}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
