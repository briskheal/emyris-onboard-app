import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import DCRModal from '../../components/DCRModal';

const USER_EMAIL = 'rep@emyris.in';

export default function Backlog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // DCR Modal State
  const [activeDcrDate, setActiveDcrDate] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`/api/xl/backlog/my?email=${USER_EMAIL}`);
      setRequests(res.data.data || []);
    } catch (e) {
      setError('Failed to fetch backlog requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason) { setError('Date and reason are required.'); return; }
    
    // Ensure date is in the past
    const today = new Date().toISOString().split('T')[0];
    if (date >= today) { setError('Backlog requests are only for past dates.'); return; }

    setSubmitting(true);
    setError('');

    try {
      await axios.post('/api/xl/backlog', { employeeEmail: USER_EMAIL, date, reason });
      await fetchRequests();
      setShowNew(false);
      setDate('');
      setReason('');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Approved': return { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 };
      case 'Rejected': return { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: AlertCircle };
      default: return { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock };
    }
  };

  return (
    <div className="min-h-full bg-slate-800 flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-slate-700 border-b border-slate-700/60 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-600 active:bg-slate-600 flex-shrink-0">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight">Backlog Reporting</h1>
          <p className="text-xs text-slate-200">Unlock missed call reports</p>
        </div>
        {!showNew && (
          <button onClick={() => setShowNew(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-500 active:bg-sky-600 flex-shrink-0">
            <Plus size={20} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4">
        {showNew && (
          <div className="bg-slate-700 rounded-2xl border border-slate-700 p-4 mb-6">
            <h2 className="text-sm font-bold text-white mb-4">Request Unlock</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Missed Date</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Reason for Delay</label>
                <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Why was the report missed?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
              </div>
              {error && <p className="text-rose-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        )}

        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 px-1">Your Requests</h3>
        
        {loading ? (
          <p className="text-center text-sm text-slate-500 mt-10">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-sm text-slate-500 mt-10">No backlog requests found.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const { color, icon: Icon } = getStatusConfig(req.status);
              return (
                <div key={req._id} className="bg-slate-700 rounded-2xl p-4 border border-slate-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-sky-400" />
                      <span className="text-white font-bold text-sm">{new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color}`}>
                      <Icon size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{req.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-1">{req.reason}</p>
                  {req.adminRemarks && <p className="text-xs text-slate-200 mt-2 p-2 bg-slate-800 rounded-lg border border-slate-800">Admin: {req.adminRemarks}</p>}
                  
                  {req.status === 'Approved' && (
                    <button 
                      onClick={() => setActiveDcrDate(req.date)}
                      className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm active:bg-emerald-500/20 transition-colors"
                    >
                      Fill Call Report for {req.date}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeDcrDate && (
        <DCRModal 
          onClose={() => setActiveDcrDate(null)} 
          overrideDate={activeDcrDate} // Pass override date to DCR
        />
      )}
    </div>
  );
}
