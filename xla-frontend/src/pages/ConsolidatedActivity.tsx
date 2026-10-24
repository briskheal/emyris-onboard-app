import { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, User, Store, Building2, ClipboardList, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDDMMYYYY } from '../utils/dateUtils';

export default function ConsolidatedActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Month & Year state
  const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthsArr[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const userStr = sessionStorage.getItem('xla_user') || localStorage.getItem('xla_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const empId = user?.employeeId || user?.uid || '';

  const fetchData = () => {
    setLoading(true);
    axios.get(`/api/xl/user/consolidated-activity?employeeId=${encodeURIComponent(empId)}&month=${encodeURIComponent(selectedMonth)}&year=${encodeURIComponent(selectedYear)}`)
      .then(res => {
        setLoading(false);
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const exportCSV = () => {
    if (!data?.dailyBreakdown?.length) return;
    const headers = ['Date', 'Doctor Calls', 'Chemist Calls', 'Stockist Calls', 'Total Calls', 'POB Value (INR)'];
    const rows = data.dailyBreakdown.map((r: any) => [
      formatDDMMYYYY(r.date),
      r.doctor,
      r.chemist,
      r.stockist,
      r.total,
      r.pob
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Consolidated_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cards = [
    { label: 'DOCTOR VISITS', value: String(data?.doctorCalls || 0), icon: User, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
    { label: 'CHEMIST VISITS', value: String(data?.chemistCalls || 0), icon: Store, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-500/30' },
    { label: 'STOCKIST VISITS', value: String(data?.stockistCalls || 0), icon: Building2, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
    { label: 'TOTAL CALLS', value: String(data?.totalCalls || 0), icon: ClipboardList, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30' },
    { label: 'DAYS WORKED', value: `${data?.daysWorked || 0} Days`, icon: CalendarDays, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/30' },
    { label: 'TOTAL POB', value: `₹${Math.round(Number(data?.totalPob || 0)).toLocaleString('en-IN')}`, icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-sky-400 active:scale-95">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">Consolidated Activity</h1>
            <p className="text-xs text-slate-400">Monthly Performance & Call Summary</p>
          </div>
        </div>

        <button 
          onClick={exportCSV}
          disabled={loading || !data?.dailyBreakdown?.length}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-colors shadow-sm"
          title="Download CSV"
        >
          <FileSpreadsheet size={15} />
          <span>Export</span>
        </button>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Month/Year Filter */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <CalendarDays size={18} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Period</p>
              <h3 className="font-bold text-white text-sm">{selectedMonth} {selectedYear}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none"
            >
              {monthsArr.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={36} className="text-sky-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading consolidated activity...</p>
          </div>
        ) : (
          <>
            {/* 6 Key Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {cards.map((card, idx) => (
                <div key={idx} className={`bg-slate-800 border ${card.border} rounded-3xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg`}>
                  <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center mb-1`}>
                    <card.icon size={22} className={card.color} />
                  </div>
                  <span className="text-2xl font-black text-white mt-1">{card.value}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    {card.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm">Daily Field Log Breakdown</h3>
                <span className="text-xs font-bold text-sky-400">
                  Avg: {data?.callAvg || 0} calls/day
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-center">Doctors</th>
                      <th className="py-2 px-3 text-center">Chemists</th>
                      <th className="py-2 px-3 text-center">Stockists</th>
                      <th className="py-2 px-3 text-center">Total</th>
                      <th className="py-2 px-3 text-right">POB (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {(data?.dailyBreakdown || []).length > 0 ? (
                      data.dailyBreakdown.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-700/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-200">{formatDDMMYYYY(r.date)}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{r.doctor}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-sky-400">{r.chemist}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-400">{r.stockist}</td>
                          <td className="py-2.5 px-3 text-center font-black text-white">{r.total}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-400">
                            ₹{Math.round(Number(r.pob || 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No calls recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
