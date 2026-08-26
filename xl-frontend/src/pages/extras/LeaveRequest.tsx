import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock, CheckCircle2, AlertCircle, CalendarRange } from 'lucide-react';
import axios from 'axios';

const USER_EMAIL = 'rep@emyris.in';
const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Paid Leave'];

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [reason, setReason] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`/api/xl/leave/my?email=${USER_EMAIL}`);
      setLeaves(res.data.data || []);
    } catch (e) {
      setError('Failed to fetch leave history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) { setError('All fields are required.'); return; }
    if (endDate < startDate) { setError('End date cannot be before start date.'); return; }

    setSubmitting(true);
    setError('');

    try {
      await axios.post('/api/xl/leave', { 
        employeeEmail: USER_EMAIL, 
        startDate, endDate, leaveType, reason 
      });
      await fetchLeaves();
      setShowNew(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to submit leave request.');
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
    <div className="min-h-full bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-slate-700 border-b border-slate-700/60 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-600 active:bg-slate-600 flex-shrink-0">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight">Leave Request</h1>
          <p className="text-xs text-slate-200">Apply & track leaves</p>
        </div>
        {!showNew && (
          <button onClick={() => setShowNew(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-500 active:bg-sky-600 flex-shrink-0">
            <Plus size={20} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4">
        {showNew && (
          <div className="bg-slate-700 rounded-2xl border border-slate-700 p-4 mb-6 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-4">New Leave Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none appearance-none">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Explain briefly..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
              </div>

              {error && <p className="text-rose-400 text-sm bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm active:bg-slate-600">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm disabled:opacity-50 active:bg-sky-600">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        )}

        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 px-1">Leave History</h3>
        
        {loading ? (
          <p className="text-center text-sm text-slate-500 mt-10">Loading history...</p>
        ) : leaves.length === 0 ? (
          <p className="text-center text-sm text-slate-500 mt-10">No past leaves found.</p>
        ) : (
          <div className="space-y-3 pb-6">
            {leaves.map(leave => {
              const { color, icon: Icon } = getStatusConfig(leave.status);
              
              // Formatting dates
              const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
              const start = new Date(leave.startDate).toLocaleDateString('en-IN', formatOptions);
              const end = new Date(leave.endDate).toLocaleDateString('en-IN', formatOptions);
              const isSameDay = leave.startDate === leave.endDate;

              return (
                <div key={leave._id} className="bg-slate-700 rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarRange size={14} className="text-sky-400" />
                        <span className="text-white font-bold text-sm">{isSameDay ? start : `${start} - ${end}`}</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-200 bg-slate-800 px-2 py-0.5 rounded-full">{leave.leaveType}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color}`}>
                      <Icon size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{leave.status}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{leave.reason}</p>
                  
                  {leave.adminRemarks && (
                    <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-800 flex gap-2 items-start mt-1">
                      <span className="text-xs font-bold text-slate-500 uppercase">Note:</span>
                      <p className="text-xs text-slate-200 leading-tight flex-1">{leave.adminRemarks}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
