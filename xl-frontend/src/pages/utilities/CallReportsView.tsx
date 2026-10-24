import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, FileText, RefreshCw, Download, Eye, X, Calendar, MapPin, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';
import { getDynamicYears } from '../../utils/dateUtils';

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
];

export default function CallReportsView() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [filterMode, setFilterMode] = useState<'all' | 'working'>('working');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const fetchCallReports = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/xl/reports/monthly-summary', {
        params: {
          employeeId: selectedUser.employeeId,
          month,
          year
        }
      });
      if (res.data?.success) {
        setReport(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchCallReports();
    }
  }, [selectedUser?.employeeId, month, year]);

  const days = report?.days || [];
  const filteredDays = filterMode === 'working'
    ? days.filter((d: any) => d.totalCalls > 0 || d.status === 'Working' || d.status.startsWith('Leave') || d.status.startsWith('Holiday'))
    : days;

  const handleExportExcel = () => {
    if (!days.length) return;
    const rows = days.map((d: any, i: number) => ({
      'Sr No': i + 1,
      'Date': d.displayDate,
      'Day': d.dayOfWeek,
      'Status': d.status,
      'Punch In': d.punchInTime,
      'Punch Out': d.punchOutTime,
      'TP Area': d.tpArea,
      'Planned Doctors': d.plannedDoctors,
      'Doctor Calls': d.doctorCalls,
      'Chemist Calls': d.chemistCalls,
      'Stockist Calls': d.stockistCalls,
      'Total Calls': d.totalCalls,
      'POB Value (INR)': d.pobValue,
      'Visited Entities': (d.dcrs || []).map((x: any) => `${x.entityName} (${x.entityType})`).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Call Reports');
    XLSX.writeFile(wb, `Call_Report_${selectedUser?.name || 'User'}_${month}_${year}.xlsx`);
  };

  const summary = report?.summary || {};

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
              <FileText size={16} className="text-sky-400" />
              CALL <span className="text-sky-400">REPORTS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Daily call records & visit details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95"
            title="Download Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={fetchCallReports}
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

        {/* Month & Year Selectors */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
            >
              {getDynamicYears(2, 2).map(y => (
                <option key={y} value={Number(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-2.5">
            <div className="text-sm font-black text-sky-400">{summary.totalDoctorCalls || 0}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Dr Calls</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-2.5">
            <div className="text-sm font-black text-emerald-400">{summary.totalChemistCalls || 0}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Chemist</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-2.5">
            <div className="text-sm font-black text-amber-400">{summary.totalStockistCalls || 0}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Stockist</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-2.5">
            <div className="text-sm font-black text-lime-400">₹{Number(summary.totalPobValue || 0).toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">POB</div>
          </div>
        </div>

        {/* Toggle All Days vs Activity Days */}
        <div className="flex items-center justify-between bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 text-xs">
          <button
            onClick={() => setFilterMode('working')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === 'working' ? 'bg-sky-500 text-white' : 'text-slate-400'
            }`}
          >
            Activity Days ({days.filter((d: any) => d.totalCalls > 0 || d.status === 'Working').length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400'
            }`}
          >
            All Month Days ({days.length})
          </button>
        </div>

        {/* Day-wise List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-sky-400" />
            <span className="text-xs font-semibold">Loading call reports...</span>
          </div>
        ) : filteredDays.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No call activity recorded for this period.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDays.map((day: any) => {
              const isExpanded = expandedDate === day.date;
              return (
                <div
                  key={day.date}
                  className="bg-slate-900/90 border border-slate-700/70 rounded-2xl overflow-hidden shadow-md"
                >
                  <div
                    onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                    className="p-3.5 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white font-mono">{day.displayDate}</span>
                        <span className="text-[10px] font-bold text-sky-400">{day.dayOfWeek}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          day.status === 'Working' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          day.status === 'Sunday' ? 'bg-amber-500/15 text-amber-400' :
                          day.status.startsWith('Leave') || day.status.startsWith('Holiday') ? 'bg-purple-500/15 text-purple-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {day.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Area: <strong className="text-slate-200">{day.tpArea !== '-' ? day.tpArea : (day.dcrs?.[0]?.workingAreas || '-')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-black">
                          {day.totalCalls} Calls
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          D:{day.doctorCalls} C:{day.chemistCalls} S:{day.stockistCalls}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-sky-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800 bg-slate-950/50 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Punch In: <strong className="text-white">{day.punchInTime}</strong></span>
                        <span>Punch Out: <strong className="text-white">{day.punchOutTime}</strong></span>
                        <span>POB: <strong className="text-lime-400">₹{Number(day.pobValue || 0).toLocaleString('en-IN')}</strong></span>
                      </div>

                      {(!day.dcrs || day.dcrs.length === 0) ? (
                        <div className="text-center py-3 text-[11px] text-slate-500">
                          No individual visit logs recorded on this date.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {day.dcrs.map((v: any, idx: number) => (
                            <div
                              key={v._id || idx}
                              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-white truncate">{v.entityName}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    v.entityType === 'Doctor' ? 'bg-sky-500/20 text-sky-300' :
                                    v.entityType === 'Chemist' ? 'bg-emerald-500/20 text-emerald-300' :
                                    'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {v.entityType}
                                  </span>
                                </div>
                                {v.discussion && (
                                  <p className="text-[10px] text-slate-400 mt-1 pl-5">{v.discussion}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-mono text-slate-400 block">{v.checkInTime}</span>
                                <span className="text-[9px] text-emerald-400 font-bold uppercase">{v.status || 'Submitted'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
