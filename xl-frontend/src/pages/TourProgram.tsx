import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VISIT_TYPES = [
  { label: 'Local', color: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500' },
  { label: 'Ex-Station', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
  { label: 'Out-Station', color: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500' },
  { label: 'Conference', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  { label: 'Leave', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
  { label: 'Holiday', color: 'bg-slate-500', text: 'text-slate-200', border: 'border-slate-500' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  Draft: { label: 'Draft', color: 'text-slate-200', icon: Clock },
  Submitted: { label: 'Pending Approval', color: 'text-amber-400', icon: Clock },
  Approved: { label: 'Approved', color: 'text-emerald-400', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', color: 'text-rose-400', icon: AlertCircle },
};

// Hardcoded for Phase 2 — will be replaced by login session in future



export default function TourProgram() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('xl_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<Record<string, string>>({}); // { "2026-08-15": "Local" }
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tpId, setTpId] = useState<string | null>(null);
  const [tpStatus, setTpStatus] = useState('Draft');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const month = currentDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const year = String(currentDate.getFullYear());
  const monthLabel = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  useEffect(() => {
    fetchTP();
  }, [currentDate]);

  const fetchTP = async () => {
    try {
      const res = await axios.get(`/api/xl/tour-program/my?email=${user?.employeeId}&month=${month}&year=${year}`);
      if (res.data.data) {
        const tp = res.data.data;
        setTpId(tp._id);
        setTpStatus(tp.status);
        setAdminRemarks(tp.adminRemarks || '');
        const map: Record<string, string> = {};
        JSON.parse(tp.entries || '[]').forEach((e: { date: string; visitType: string }) => {
          map[e.date] = e.visitType;
        });
        setEntries(map);
      } else {
        setTpId(null);
        setTpStatus('Draft');
        setEntries({});
        setAdminRemarks('');
      }
    } catch (_) {}
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDayTap = (dateStr: string) => {
    if (tpStatus === 'Submitted' || tpStatus === 'Approved') return;
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  const assignVisitType = (type: string) => {
    if (!selectedDate) return;
    setEntries(prev => ({ ...prev, [selectedDate]: type }));
    setSelectedDate(null);
  };

  const removeEntry = (dateStr: string) => {
    setEntries(prev => { const n = { ...prev }; delete n[dateStr]; return n; });
  };

  const saveTP = async () => {
    setSaving(true);
    try {
      const entriesArr = Object.entries(entries).map(([date, visitType]) => ({ date, visitType }));
      const res = await axios.post('/api/xl/tour-program', {
        employeeId: user?.employeeId, employeeName: user ? `${user.firstName} ${user.lastName}` : '',
        month, year, entries: entriesArr
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

  const visitTypeConfig = (type: string) => VISIT_TYPES.find(v => v.label === type);
  const StatusIcon = STATUS_CONFIG[tpStatus]?.icon || Clock;

  return (
    <div className="min-h-full bg-slate-800">
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
          const visitType = entries[dateStr];
          const vtConfig = visitType ? visitTypeConfig(visitType) : null;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === today.toISOString().split('T')[0];
          return (
            <button
              key={dateStr}
              onClick={() => handleDayTap(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all
                ${isSelected ? 'ring-2 ring-white scale-110' : ''}
                ${vtConfig ? `${vtConfig.color} text-white` : 'bg-slate-700 text-slate-300'}
                ${isToday && !vtConfig ? 'ring-1 ring-sky-400' : ''}`}
            >
              {day}
              {visitType && (
                <span className="text-[8px] font-normal opacity-80 leading-tight">{visitType.slice(0, 3)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visit Type Picker (shown when a date is selected) */}
      {selectedDate && (
        <div className="mx-4 mb-4 bg-slate-700 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            {entries[selectedDate] && (
              <button onClick={() => removeEntry(selectedDate)} className="text-xs text-rose-400">Remove</button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VISIT_TYPES.map(vt => (
              <button key={vt.label} onClick={() => assignVisitType(vt.label)}
                className={`py-2 rounded-xl text-xs font-semibold border ${entries[selectedDate] === vt.label ? `${vt.color} text-white border-transparent` : `bg-slate-800 ${vt.text} ${vt.border}`}`}>
                {vt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 mb-4 flex flex-wrap gap-2">
        {VISIT_TYPES.map(vt => (
          <div key={vt.label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${vt.color}`} />
            <span className="text-[10px] text-slate-200">{vt.label}</span>
          </div>
        ))}
      </div>

      {/* Summary count */}
      <div className="px-4 mb-4">
        <p className="text-xs text-slate-200">
          {Object.keys(entries).length} days planned · {Object.values(entries).filter(v => v === 'Local').length} Local · {Object.values(entries).filter(v => v === 'Ex-Station').length} Ex · {Object.values(entries).filter(v => v === 'Out-Station').length} OS
        </p>
      </div>

      {/* Action Buttons */}
      {(tpStatus === 'Draft' || tpStatus === 'Rejected') && (
        <div className="px-4 pb-8 flex gap-3">
          <button onClick={saveTP} disabled={saving}
            className="flex-1 h-[45px] rounded-xl bg-slate-600 text-white text-sm font-semibold active:bg-slate-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={submitTP} disabled={submitting}
            className="flex-1 h-[45px] rounded-xl bg-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-sky-600 disabled:opacity-50">
            <Send size={15} />
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 bg-slate-600 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white text-center z-50 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
