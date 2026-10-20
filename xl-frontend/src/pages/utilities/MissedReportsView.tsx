import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Clock, RefreshCw, Download, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
];

export default function MissedReportsView() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [entityType, setEntityType] = useState<'Doctor' | 'Chemist' | 'Stockist'>('Doctor');
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [year, setYear] = useState<string>(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState<'All' | 'Met' | 'Partially Missed' | 'Fully Missed'>('All');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ met: 0, partiallyMissed: 0, missed: 0 });
  const [rows, setRows] = useState<any[]>([]);

  const fetchMissedReport = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/xl/missed-reports', {
        params: {
          reportType: 'Met/Missed',
          entityType,
          month,
          year,
          userAllotted: selectedUser._id || selectedUser.employeeId
        }
      });
      if (res.data?.success) {
        setSummary(res.data.summary || { met: 0, partiallyMissed: 0, missed: 0 });
        setRows(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchMissedReport();
    }
  }, [selectedUser?.employeeId, entityType, month, year]);

  const filteredRows = rows.filter(r => {
    if (statusFilter === 'All') return true;
    return r.status === statusFilter;
  });

  const handleExport = () => {
    if (!filteredRows.length) return;
    const sheetData = filteredRows.map((r, i) => ({
      'Sr No': i + 1,
      'Name': r.name,
      'Category': r.category || '-',
      'Degree / Spec': [r.degree, r.specialization].filter(Boolean).join(' • ') || '-',
      'Expected Visits': r.expected ?? 1,
      'Actual Visits': r.actual ?? 0,
      'Status': r.status,
      'Visit Dates': r.meetingDate || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Missed Report');
    XLSX.writeFile(wb, `Missed_Report_${entityType}_${month}_${year}.xlsx`);
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24 text-white font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/utilities')}
            className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-wide flex items-center gap-1.5">
              <Clock size={16} className="text-rose-400" />
              MISSED <span className="text-rose-400">REPORTS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Met, partially missed & missed coverage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95"
            title="Download Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={fetchMissedReport}
            className="p-2 rounded-xl bg-slate-700/60 text-sky-400 active:scale-95"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <ReportUserFilter
          selectedEmployeeId={selectedUser?.employeeId}
          onSelectUser={(u) => setSelectedUser(u)}
        />

        {/* Entity Type Selector */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 text-xs">
          {(['Doctor', 'Chemist', 'Stockist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setEntityType(t)}
              className={`py-2 rounded-xl font-bold transition-colors ${
                entityType === t ? 'bg-rose-500 text-white shadow' : 'text-slate-400'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>

        {/* Month & Year */}
        <div className="grid grid-cols-2 gap-2.5">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
          >
            {['2024', '2025', '2026', '2027', '2028'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Summary Cards (Click to Filter) */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <button
            onClick={() => setStatusFilter(statusFilter === 'Met' ? 'All' : 'Met')}
            className={`p-3 rounded-2xl border transition-all ${
              statusFilter === 'Met' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-slate-900/90 border-slate-700/60'
            }`}
          >
            <div className="text-lg font-black text-emerald-400">{summary.met}</div>
            <div className="text-[10px] font-bold text-slate-300 uppercase">Met</div>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'Partially Missed' ? 'All' : 'Partially Missed')}
            className={`p-3 rounded-2xl border transition-all ${
              statusFilter === 'Partially Missed' ? 'bg-amber-500/20 border-amber-400' : 'bg-slate-900/90 border-slate-700/60'
            }`}
          >
            <div className="text-lg font-black text-amber-400">{summary.partiallyMissed}</div>
            <div className="text-[10px] font-bold text-slate-300 uppercase">Partial</div>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'Fully Missed' ? 'All' : 'Fully Missed')}
            className={`p-3 rounded-2xl border transition-all ${
              statusFilter === 'Fully Missed' ? 'bg-rose-500/20 border-rose-400' : 'bg-slate-900/90 border-slate-700/60'
            }`}
          >
            <div className="text-lg font-black text-rose-400">{summary.missed}</div>
            <div className="text-[10px] font-bold text-slate-300 uppercase">Missed</div>
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-rose-400" />
            <span className="text-xs font-semibold">Calculating coverage...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No {entityType.toLowerCase()} records match the selected filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRows.map((r, i) => (
              <div
                key={r._id || i}
                className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white truncate">{r.name}</span>
                    {r.category && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700 shrink-0">
                        {r.category}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Visits: <strong className="text-white">{r.actual || 0} / {r.expected || 1}</strong>
                    {r.meetingDate && r.meetingDate !== '-' && (
                      <span className="ml-2 text-sky-400">• Days: {r.meetingDate}</span>
                    )}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${
                  r.status === 'Met' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  r.status === 'Partially Missed' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
