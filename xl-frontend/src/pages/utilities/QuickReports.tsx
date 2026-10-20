import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Zap, RefreshCw, CheckCircle2, Clock, CalendarDays,
  FileText, TrendingUp, ShoppingCart, PackageSearch, ClipboardList, Target, List, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';

function formatDDMMYYYY(dateStr: string) {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function QuickReports() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchSummary = async (empId: string) => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/xl/reports/quick-summary?employeeId=${encodeURIComponent(empId)}`);
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchSummary(selectedUser.employeeId);
    }
  }, [selectedUser?.employeeId]);

  const shortcuts = [
    { label: 'Call Reports', path: '/utilities/call-reports', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/15' },
    { label: 'Missed Reports', path: '/utilities/missed-reports', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/15' },
    { label: 'Monthly Reports', path: '/utilities/monthly-reports', icon: CalendarDays, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15' },
    { label: 'POB Reports', path: '/utilities/pob-reports', icon: ClipboardList, color: 'text-lime-400', bg: 'bg-lime-500/15' },
    { label: 'Primary Sales', path: '/utilities/primary-sales', icon: PackageSearch, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { label: 'Secondary Sales', path: '/utilities/secondary-sales', icon: ShoppingCart, color: 'text-pink-400', bg: 'bg-pink-500/15' },
    { label: 'Sales Insights', path: '/utilities/sales-insights', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/15' },
    { label: 'Targets vs Achv', path: '/utilities/targets', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Lists Directory', path: '/utilities/lists', icon: List, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  ];

  const today = data?.today || {};
  const month = data?.month || {};
  const approvals = data?.approvals || {};
  const callPct = month.expectedDoctorCalls > 0
    ? Math.min(100, Math.round((month.doctorCalls / month.expectedDoctorCalls) * 100))
    : 0;

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
              <Zap size={16} className="text-amber-400" />
              QUICK <span className="text-amber-400">REPORTS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Frequent reports & live field snapshot</p>
          </div>
        </div>
        <button
          onClick={() => selectedUser && fetchSummary(selectedUser.employeeId)}
          className="p-2 rounded-xl bg-slate-700/60 text-sky-400 active:scale-95"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <ReportUserFilter
          selectedEmployeeId={selectedUser?.employeeId}
          onSelectUser={(u) => setSelectedUser(u)}
        />

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-amber-400" />
            <span className="text-xs font-semibold">Loading quick summary...</span>
          </div>
        ) : (
          <>
            {/* Today's Card */}
            <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">Today's Snapshot</span>
                  <span className="text-xs font-bold text-white">{formatDDMMYYYY(today.date)}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  today.isHoliday
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : today.isLeave || today.isSunday
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : today.attendanceStatus === 'Not Punched In'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {today.isHoliday
                    ? `🎉 HOLIDAY • ${today.holidayTitle || 'HOLIDAY'}`
                    : (today.attendanceStatus || 'Not Punched In')}
                </span>
              </div>

              {today.isHoliday && (
                <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-500/40 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎉</span>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        {today.holidayType || 'Official'} Holiday
                      </div>
                      <div className="text-sm font-black text-white">
                        {today.holidayTitle || 'Holiday'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Holiday
                  </span>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-base font-black text-sky-400">{today.doctorCalls || 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Doctors</div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-base font-black text-emerald-400">{today.chemistCalls || 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Chemists</div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-base font-black text-amber-400">{today.stockistCalls || 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Stockists</div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-sm font-black text-lime-400">₹{Number(today.pobValue || 0).toLocaleString('en-IN')}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">POB</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Punch In: <strong className="text-slate-200">{today.punchInTime || '-'}</strong></span>
                <span>Punch Out: <strong className="text-slate-200">{today.punchOutTime || '-'}</strong></span>
              </div>
            </div>

            {/* Monthly Scorecard */}
            <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {month.monthLabel || 'Current Month'} Summary
                </span>
                <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {month.workingDays || 0} Working Days
                </span>
              </div>

              {/* Call Compliance Bar */}
              <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-semibold">Doctor Calls Achievement</span>
                  <span className="font-black text-sky-400">
                    {month.doctorCalls || 0} / {month.expectedDoctorCalls || 0} ({callPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${callPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Primary Sales</div>
                  <div className="text-sm font-black text-cyan-400 mt-0.5">
                    ₹{Number(month.primarySales || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Secondary Sales</div>
                  <div className="text-sm font-black text-pink-400 mt-0.5">
                    ₹{Number(month.secondarySales || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly POB</div>
                  <div className="text-sm font-black text-lime-400 mt-0.5">
                    ₹{Number(month.pobValue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Expenses Claimed</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">
                    ₹{Number(month.totalExpense || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Approvals & Planning Status */}
            <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 space-y-2.5 shadow-lg">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                Planning & Approval Status
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
                  <span className="text-slate-400">Tour Program</span>
                  <span className={`font-bold ${approvals.tourProgramStatus === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {approvals.tourProgramStatus || 'Pending'}
                  </span>
                </div>
                <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
                  <span className="text-slate-400">Approved Plans</span>
                  <span className="font-bold text-sky-400">{approvals.approvedCallPlans || 0} Days</span>
                </div>
                <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
                  <span className="text-slate-400">Pending Expenses</span>
                  <span className="font-bold text-rose-400">{approvals.pendingExpenses || 0}</span>
                </div>
                <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
                  <span className="text-slate-400">Pending Leaves</span>
                  <span className="font-bold text-amber-400">{approvals.pendingLeaves || 0}</span>
                </div>
              </div>
            </div>

            {/* Frequent Report Shortcuts */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 block">
                Quick Access Reports
              </span>
              <div className="grid grid-cols-1 gap-2">
                {shortcuts.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(s.path)}
                    className="bg-slate-700/70 hover:bg-slate-700 border border-slate-600/50 rounded-2xl p-3.5 flex items-center justify-between active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                        <s.icon size={18} className={s.color} />
                      </div>
                      <span className="text-xs font-bold text-white">{s.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
