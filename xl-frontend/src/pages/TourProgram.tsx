import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Send, Search, X } from 'lucide-react';
import axios from 'axios';

const VISIT_TYPES = [
  { label: 'HQ', color: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500' },
  { label: 'Ex Mkt', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
  { label: 'Out Mkt', color: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500' },
  { label: 'Conf/Mtng', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  { label: 'Leave', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
  { label: 'Admin', color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
  { label: 'Transit', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  Draft: { label: 'Draft', color: 'text-slate-200', icon: Clock },
  Submitted: { label: 'Pending Approval', color: 'text-amber-400', icon: Clock },
  Approved: { label: 'Approved', color: 'text-emerald-400', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', color: 'text-rose-400', icon: AlertCircle },
};

export default function TourProgram() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('xl_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const today = new Date();
  
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [tpId, setTpId] = useState<string | null>(null);
  const [tpStatus, setTpStatus] = useState('Draft');
  const [adminRemarks, setAdminRemarks] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Market Selection Modal State
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [pendingVisitType, setPendingVisitType] = useState('');
  const [markets, setMarkets] = useState<any[]>([]);
  const [marketSearch, setMarketSearch] = useState('');

  const year = currentDate.getFullYear();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = `${monthNames[currentDate.getMonth()]} ${year}`;
  const month = monthNames[currentDate.getMonth()];
  
  const firstDay = new Date(year, currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchTP();
    fetchMarkets();
  }, [currentDate]);

  const fetchTP = async () => {
    try {
      const res = await axios.get(`/api/xl/tour-program/my?email=${user.employeeId}&month=${month}&year=${year}`);
      if (res.data.success && res.data.data) {
        // Fallback for both array or object depending on backend
        const tp = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
        if (!tp) return;
        setTpId(tp._id);
        setTpStatus(tp.status || 'Draft');
        setAdminRemarks(tp.adminRemarks || '');
        const loadedEntries: Record<string, any> = {};
        try {
          const parsed = JSON.parse(tp.entries || '[]');
          parsed.forEach((e: any) => {
            if (e.date) loadedEntries[e.date] = e;
          });
        } catch(e){}
        setEntries(loadedEntries);
      } else {
        setTpId(null); setTpStatus('Draft'); setAdminRemarks(''); setEntries({});
      }
    } catch(e) {}
  };

  const fetchMarkets = async () => {
    try {
      const res = await axios.get('/api/admin/locations/cities');
      if (res.data.success) {
        setMarkets(res.data.cities || []);
      }
    } catch(e) {}
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDayTap = (dateStr: string) => {
    if (tpStatus === 'Submitted' || tpStatus === 'Approved') return;
    const d = new Date(dateStr);
    if (d.getDay() === 0) return; // Ignore Sundays
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  const handleVisitTypeClick = (type: string) => {
    if (!selectedDate) return;
    
    if (['Ex Mkt', 'Out Mkt', 'Conf/Mtng'].includes(type)) {
      setPendingVisitType(type);
      setMarketSearch('');
      setShowMarketModal(true);
    } else {
      setEntries(prev => ({ ...prev, [selectedDate]: { type } }));
      setSelectedDate(null);
    }
  };

  const selectMarket = (marketName: string) => {
    if (!selectedDate || !pendingVisitType) return;
    setEntries(prev => ({ ...prev, [selectedDate]: { type: pendingVisitType, toMarket: marketName } }));
    setShowMarketModal(false);
    setSelectedDate(null);
  };

  const removeEntry = (dateStr: string) => {
    setEntries(prev => { const n = { ...prev }; delete n[dateStr]; return n; });
  };

  const saveTP = async () => {
    setSaving(true);
    try {
      const entriesArr = Object.entries(entries).map(([date, val]) => {
        if (typeof val === 'string') return { date, type: val };
        return { date, type: val.type || val.visitType, toMarket: val.toMarket };
      });
      const res = await axios.post('/api/xl/tour-program', {
        employeeId: user?.employeeId, employeeName: user ? `${user.firstName} ${user.lastName}` : '',
        hq: user?.hq || '', month, year, entries: entriesArr
      });
      setTpId(res.data.data._id);
      showToast('Tour Program saved!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const submitTP = async () => {
    if (!tpId) { showToast('Save the TP first before submitting.'); return; }
    if (Object.keys(entries).length === 0) { showToast('Please plan at least one day.'); return; }
    setSubmitting(true);
    try {
      await saveTP();
      await axios.put(`/api/xl/tour-program/${tpId}/submit`);
      setTpStatus('Submitted');
      showToast('Tour Program submitted for approval!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getVisitTypeStr = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      // Legacy mapping
      if (val === 'Local') return 'HQ';
      if (val === 'Ex-Station') return 'Ex Mkt';
      if (val === 'Out-Station') return 'Out Mkt';
      if (val === 'Conference') return 'Conf/Mtng';
      return val;
    }
    return val.type || val.visitType;
  };

  const visitTypeConfig = (type: string) => VISIT_TYPES.find(v => v.label === type);
  const StatusIcon = STATUS_CONFIG[tpStatus]?.icon || Clock;

  // Counts
  const typeCounts = Object.values(entries).reduce((acc: any, val: any) => {
    const t = getVisitTypeStr(val);
    if (t) acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-full bg-slate-800 pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-slate-800 border-b border-slate-700/60 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="flex-1 flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Tour Program</h1>
                <p className="text-[10px] text-slate-300">Submit proposed activities</p>
              </div>
              {tpStatus && (
                <div className={`flex flex-col items-end ${STATUS_CONFIG[tpStatus]?.color}`}>
                  <div className="flex items-center gap-1">
                    <StatusIcon size={12} />
                    <span className="text-[10px] font-semibold">{STATUS_CONFIG[tpStatus]?.label}</span>
                  </div>
                  {adminRemarks && tpStatus === 'Rejected' && (
                    <p className="text-[9px] text-rose-400 mt-0.5 max-w-[100px] truncate" title={adminRemarks}>Remark: {adminRemarks}</p>
                  )}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center active:bg-slate-600">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <p className="text-base font-bold text-white">{monthLabel}</p>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center active:bg-slate-600">
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 px-4 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-slate-500 font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 px-4 gap-y-1 mb-4">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          const dObj = new Date(dateStr);
          const isSunday = dObj.getDay() === 0;

          const entry = entries[dateStr];
          const visitType = getVisitTypeStr(entry);
          const vtConfig = visitType ? visitTypeConfig(visitType) : null;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === today.toISOString().split('T')[0];
          
          return (
            <button
              key={dateStr}
              onClick={() => handleDayTap(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : ''}
                ${vtConfig ? `${vtConfig.color} text-white` : isSunday ? 'bg-slate-700/30 text-slate-600' : 'bg-slate-700 text-slate-300'}
                ${isToday && !vtConfig ? 'ring-1 ring-sky-400' : ''}`}
            >
              {day}
              {visitType && (
                <span className="text-[8px] font-bold opacity-90 leading-tight uppercase mt-0.5">{visitType.slice(0, 3)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visit Type Picker (shown when a date is selected) */}
      {selectedDate && (
        <div className="mx-4 mb-4 bg-slate-700 rounded-2xl p-4 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-600 pb-2">
            <div>
              <p className="text-sm font-bold text-white">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              {entries[selectedDate]?.toMarket && (
                <p className="text-xs text-sky-400 mt-1">Market: {entries[selectedDate].toMarket}</p>
              )}
            </div>
            {entries[selectedDate] && (
              <button onClick={() => removeEntry(selectedDate)} className="text-xs font-bold bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg active:bg-rose-500/40">Remove</button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VISIT_TYPES.map(vt => {
              const isActive = getVisitTypeStr(entries[selectedDate]) === vt.label;
              return (
                <button key={vt.label} onClick={() => handleVisitTypeClick(vt.label)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${isActive ? `${vt.color} text-white border-transparent` : `bg-slate-800 ${vt.text} ${vt.border} hover:bg-slate-700`}`}>
                  {vt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 mb-4 flex flex-wrap gap-2">
        {VISIT_TYPES.map(vt => (
          <div key={vt.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${vt.color}`} />
            <span className="text-[10px] text-slate-300 font-medium">{vt.label}</span>
          </div>
        ))}
      </div>

      {/* Summary count */}
      <div className="px-4 mb-6">
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {Object.keys(entries).length} days planned &middot; 
          {typeCounts['HQ'] || 0} HQ &middot; 
          {typeCounts['Ex Mkt'] || 0} Ex &middot; 
          {typeCounts['Out Mkt'] || 0} OS &middot; 
          {typeCounts['Conf/Mtng'] || 0} Mtng
        </p>
      </div>

      {/* Action Buttons */}
      {(tpStatus === 'Draft' || tpStatus === 'Rejected') && (
        <div className="px-4 flex gap-3">
          <button onClick={saveTP} disabled={saving}
            className="flex-1 h-[48px] rounded-xl bg-slate-600 text-white text-sm font-bold active:bg-slate-500 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={submitTP} disabled={submitting}
            className="flex-1 h-[48px] rounded-xl bg-sky-500 text-white text-sm font-bold flex items-center justify-center gap-2 active:bg-sky-400 transition-colors disabled:opacity-50 shadow-lg shadow-sky-500/20">
            <Send size={16} />
            {submitting ? 'Submitting...' : 'Submit TP'}
          </button>
        </div>
      )}

      {/* Market Selection Modal */}
      {showMarketModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">Select TO Market</h2>
            <button onClick={() => setShowMarketModal(false)} className="p-1"><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search market by city name..."
                value={marketSearch}
                onChange={e => setMarketSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {markets.filter(m => m.cityName?.toLowerCase().includes(marketSearch.toLowerCase())).map((m, i) => (
              <button 
                key={m._id || i}
                onClick={() => selectMarket(m.cityName)}
                className="w-full text-left p-4 border-b border-slate-800/50 active:bg-slate-800"
              >
                <p className="text-sm font-bold text-white">{m.cityName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.state} {m.hq ? `• ${m.hq}` : ''}</p>
              </button>
            ))}
            {markets.length === 0 && (
              <p className="text-center text-slate-400 mt-10 text-sm">No markets available.</p>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm font-bold text-white text-center z-[70] shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
