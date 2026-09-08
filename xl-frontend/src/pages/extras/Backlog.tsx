import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock, CheckCircle2, AlertCircle, Calendar as CalendarIcon, Lock, X } from 'lucide-react';
import axios from 'axios';

const getUserId = () => {
  const u = localStorage.getItem('xl_user');
  return u ? JSON.parse(u).employeeId : '';
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function Backlog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1);
  const [selYear, setSelYear] = useState(today.getFullYear());
  
  const [overview, setOverview] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, [selMonth, selYear]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/xl/backlog/overview?email=${getUserId()}&year=${selYear}&month=${selMonth}`);
      setOverview(res.data.data || []);
    } catch (e) {
      setError('Failed to fetch backlog overview.');
    } finally {
      setLoading(false);
    }
  };

  const openCalendar = () => {
    // Auto-select all locked dates
    const lockedDates = overview.filter(o => o.status === 'Locked').map(o => o.date);
    setSelectedDates(new Set(lockedDates));
    setReason('');
    setShowCalendar(true);
  };

  const toggleDate = (dateStr: string) => {
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) newSet.delete(dateStr);
    else newSet.add(dateStr);
    setSelectedDates(newSet);
  };

  const handleSubmit = async () => {
    if (selectedDates.size === 0) return alert('Select at least one date.');
    if (!reason) return alert('Reason is required.');
    
    setSubmitting(true);
    try {
      await axios.post('/api/xl/backlog', { 
        employeeId: getUserId(), 
        dates: Array.from(selectedDates), 
        reason 
      });
      setShowCalendar(false);
      await fetchOverview();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Approved': return { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 };
      case 'Rejected': return { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: AlertCircle };
      case 'Locked': return { color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', icon: Lock };
      default: return { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock };
    }
  };

  // Calendar rendering logic for the modal
  const renderCalendarGrid = () => {
    const startDay = new Date(selYear, selMonth - 1, 1).getDay();
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    
    const lockedDatesMap = new Set(overview.filter(o => o.status === 'Locked').map(o => parseInt(o.date.split('-')[2])));
    
    const realStartDay = new Date(selYear, selMonth - 1, 1).getDay();
    const grid = [];
    for(let i = 0; i < realStartDay; i++) grid.push(null);
    for(let i = 1; i <= daysInMonth; i++) grid.push(i);

    return (
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-slate-400 mb-1">{d}</div>)}
        {grid.map((d, i) => {
          if (!d) return <div key={i} className="h-8"></div>;
          
          const dateStr = `${selYear}-${selMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
          const isLocked = lockedDatesMap.has(d);
          const isSelected = selectedDates.has(dateStr);
          
          let btnClass = "h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ";
          
          if (!isLocked) {
             btnClass += "text-slate-600 cursor-not-allowed"; // Not a locked backlog day
          } else if (isSelected) {
             btnClass += "bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-110";
          } else {
             btnClass += "bg-[#1c1c2e] text-slate-300 border border-[#3b3b5a]";
          }

          return (
            <div key={i} className="flex items-center justify-center">
              <button 
                disabled={!isLocked}
                onClick={() => toggleDate(dateStr)}
                className={btnClass}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const hasLocked = overview.some(o => o.status === 'Locked');

  return (
    <div className="min-h-full bg-[#13131f] flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-[#1c1c2e] border-b border-[#3b3b5a] sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#27273f] active:bg-[#3b3b5a] flex-shrink-0 transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight">Backlog Reporting</h1>
          <p className="text-xs text-sky-400">Unlock missed call reports</p>
        </div>
      </div>

      <div className="flex-1 p-4 pb-36">
        {/* Month/Year Selectors */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-[#1c1c2e] rounded-xl border border-[#3b3b5a] px-3 py-1.5 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Month</span>
            <select value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))} className="bg-transparent text-white font-semibold text-sm outline-none appearance-none">
              {MONTHS.map((m, i) => <option key={i} value={i + 1} className="bg-[#1c1c2e]">{m}</option>)}
            </select>
          </div>
          <div className="flex-1 bg-[#1c1c2e] rounded-xl border border-[#3b3b5a] px-3 py-1.5 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Year</span>
            <select value={selYear} onChange={e => setSelYear(parseInt(e.target.value))} className="bg-transparent text-white font-semibold text-sm outline-none appearance-none">
              {YEARS.map((y) => <option key={y} value={y} className="bg-[#1c1c2e]">{y}</option>)}
            </select>
          </div>
        </div>
        
        {loading ? (
          <p className="text-center text-sm text-slate-500 mt-10">Scanning records...</p>
        ) : overview.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <p className="text-center text-emerald-400 font-bold">No Missed Days!</p>
            <p className="text-center text-slate-400 text-xs mt-1">You are completely up to date for this month.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overview.map(req => {
              const { color, icon: Icon } = getStatusConfig(req.status);
              const dObj = new Date(req.date);
              const dayNum = dObj.getDate().toString().padStart(2, '0');
              const dayStr = dObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

              return (
                <div key={req.date} className="bg-[#1c1c2e] rounded-2xl flex overflow-hidden border border-[#3b3b5a]">
                  {/* Left Calendar Block */}
                  <div className="w-16 bg-sky-600 flex flex-col items-center justify-center text-white p-2">
                    <span className="text-xl font-black">{dayNum}</span>
                    <span className="text-[10px] font-bold tracking-widest">{dayStr}</span>
                  </div>
                  
                  {/* Right Details Block */}
                  <div className="flex-1 p-3 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold text-sm">Missed Report</span>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${color}`}>
                        <Icon size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{req.status}</span>
                      </div>
                    </div>
                    
                    {req.status === 'Locked' ? (
                      <p className="text-xs text-slate-400">Request unlock to fill this report.</p>
                    ) : (
                      <p className="text-xs text-slate-300 line-clamp-1">{req.reason}</p>
                    )}
                    
                    {req.adminRemarks && <p className="text-[10px] text-rose-400 mt-1 font-semibold">Admin: {req.adminRemarks}</p>}
                    
                    {req.status === 'Approved' && (
                      <button 
                        onClick={() => navigate('/report', { state: { overrideDate: req.date } })}
                        className="mt-3 w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs active:bg-emerald-500/30 transition-colors"
                      >
                        Fill Call Report Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Unlock */}
      {hasLocked && (
        <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center z-50">
          <button 
            onClick={openCalendar}
            className="bg-sky-500 hover:bg-sky-400 text-white font-black text-sm px-8 py-4 rounded-full shadow-lg shadow-sky-900/50 flex items-center gap-2 active:scale-95 transition-all"
          >
            <CalendarIcon size={18} />
            Unlock Missing Days
          </button>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c2e] border border-[#3b3b5a] rounded-3xl w-full max-w-md mx-auto p-5 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-white font-bold text-lg">Select Days to Unlock</h3>
                <p className="text-sky-400 text-xs">Tap a date to add/remove.</p>
              </div>
              <button onClick={() => setShowCalendar(false)} className="w-8 h-8 rounded-full bg-[#27273f] text-slate-400 flex items-center justify-center hover:bg-[#3b3b5a]">
                <X size={18} />
              </button>
            </div>

            {renderCalendarGrid()}

            <div className="bg-[#13131f] rounded-xl p-3 border border-[#3b3b5a] mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Reason for Delay</span>
              <textarea 
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Why were these reports missed?"
                className="w-full bg-transparent text-white text-sm outline-none resize-none h-16"
              />
            </div>

            <button 
              onClick={handleSubmit} disabled={submitting}
              className="w-full h-14 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-900/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : `Submit ${selectedDates.size} Request${selectedDates.size > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}