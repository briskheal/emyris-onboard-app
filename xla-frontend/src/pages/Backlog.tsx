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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/xl-backlog');
      setRequests(res.data.data || []);
      setSelectedIds(new Set()); // Reset selection
    } catch (e) {
      console.error('Failed to fetch backlog requests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD to DD-MM-YYYY
    }
    return dateStr;
  };

  const handleBatchAction = async (action: 'Approve' | 'Reject') => {
    if (selectedIds.size === 0) return;

    // Validate remarks if rejecting
    if (action === 'Reject') {
      const missingRemarks = Array.from(selectedIds).some(id => !remarksMap[id] || !remarksMap[id].trim());
      if (missingRemarks) {
        alert('Remarks cannot be blank for any of the selected requests when rejecting. Please fill in all remarks.');
        return;
      }
    }

    const confirmMsg = `Are you sure you want to ${action} ${selectedIds.size} selected requests?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const promises = Array.from(selectedIds).map(id => {
        const remarks = remarksMap[id] || '';
        return axios.post(`/api/admin/xl-backlog/${id}/action`, { action, remarks });
      });

      await Promise.all(promises);
      
      // Clear remarks for processed ids
      setRemarksMap(prev => {
        const next = { ...prev };
        Array.from(selectedIds).forEach(id => delete next[id]);
        return next;
      });
      
      fetchRequests(); // Refresh list
    } catch (e) {
      alert('Batch action partially or completely failed.');
      fetchRequests();
    }
  };

  const filtered = requests.filter(r => filter === 'All' || r.status === filter);
  
  if (filter === 'Pending') {
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

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
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 p-1 bg-slate-800 rounded-lg w-max">
            {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setSelectedIds(new Set());
                }}
                className={`px-6 py-2 text-sm font-bold rounded-md transition-colors ${filter === f ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {filter === 'Pending' && selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-300 bg-slate-800 px-4 py-2 rounded-lg">
                {selectedIds.size} Selected
              </span>
              <button 
                onClick={() => handleBatchAction('Approve')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/50 hover:bg-emerald-400 transition-colors"
              >
                <Check size={16} strokeWidth={3} /> Approve Selected
              </button>
              <button 
                onClick={() => handleBatchAction('Reject')}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-900/50 hover:bg-rose-400 transition-colors"
              >
                <X size={16} strokeWidth={3} /> Reject Selected
              </button>
            </div>
          )}
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    {filter === 'Pending' && (
                      <th className="p-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 cursor-pointer accent-sky-500"
                          checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
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
                    <tr key={req._id} className={`hover:bg-slate-700/30 transition-colors ${selectedIds.has(req._id) ? 'bg-sky-900/20' : ''}`}>
                      {filter === 'Pending' && (
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer accent-sky-500"
                            checked={selectedIds.has(req._id)}
                            onChange={() => toggleSelect(req._id)}
                          />
                        </td>
                      )}
                      <td className="p-4 text-slate-400 font-medium">{i + 1}</td>
                      <td className="p-4 font-bold text-white whitespace-nowrap">{formatDate(req.date)}</td>
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
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Select box to action</span>
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
