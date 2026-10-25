import { useState, useEffect } from 'react';
import { 
  ArrowLeft, CalendarDays, User, Store, Building2, 
  ClipboardList, RefreshCw, FileSpreadsheet, Users, 
  Search, ChevronDown, Check, Activity 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { formatDDMMYYYY, getDynamicYears } from '../utils/dateUtils';

export default function ConsolidatedActivity() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramEmpId = searchParams.get('employeeId');
  const paramName = searchParams.get('name');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Month & Year state
  const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthsArr[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  // Employee Selection: 'ALL' or specific employeeId
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => paramEmpId || 'ALL');
  const [selectedEmpName, setSelectedEmpName] = useState<string>(() => paramName || '');

  // Picker Modal/Dropdown state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Fetch field staff list for picker
  useEffect(() => {
    axios.get('/api/admin/users')
      .then(res => {
        if (res.data.success) {
          const list = res.data.users || res.data.data || [];
          setAllUsers(list.filter((u: any) => u.status === 'Active'));
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = (empIdToFetch: string, month: string, year: string) => {
    setLoading(true);
    const q = (!empIdToFetch || empIdToFetch === 'ALL') ? '' : `&employeeId=${encodeURIComponent(empIdToFetch)}`;
    axios.get(`/api/xl/user/consolidated-activity?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}${q}`)
      .then(res => {
        setLoading(false);
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (paramEmpId && paramEmpId !== selectedEmpId) {
      setSelectedEmpId(paramEmpId);
      if (paramName) setSelectedEmpName(paramName);
    }
  }, [paramEmpId, paramName]);

  useEffect(() => {
    fetchData(selectedEmpId, selectedMonth, selectedYear);
  }, [selectedEmpId, selectedMonth, selectedYear]);

  const handleSelectEmployee = (emp: any | null) => {
    if (!emp || emp.employeeId === 'ALL') {
      setSelectedEmpId('ALL');
      setSelectedEmpName('');
      setSearchParams({});
    } else {
      const id = emp.employeeId || emp.uid || emp._id;
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || id;
      setSelectedEmpId(id);
      setSelectedEmpName(name);
      setSearchParams({ employeeId: id, name });
    }
    setShowPicker(false);
    setPickerSearch('');
  };

  const isCompanyWide = selectedEmpId === 'ALL';

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
    const prefix = isCompanyWide ? 'CompanyWide' : (selectedEmpName || selectedEmpId).replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Consolidated_${prefix}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsersForPicker = allUsers.filter(u => {
    if (!pickerSearch.trim()) return true;
    const term = pickerSearch.toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const desig = (u.designation || '').toLowerCase();
    const hq = (u.hq || '').toLowerCase();
    const id = (u.employeeId || '').toLowerCase();
    return name.includes(term) || desig.includes(term) || hq.includes(term) || id.includes(term);
  });

  const cards = [
    { label: 'DOCTOR VISITS', value: String(data?.doctorCalls || 0), icon: User, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
    { label: 'CHEMIST VISITS', value: String(data?.chemistCalls || 0), icon: Store, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-500/30' },
    { label: 'STOCKIST VISITS', value: String(data?.stockistCalls || 0), icon: Building2, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
    { label: 'TOTAL CALLS', value: String(data?.totalCalls || 0), icon: ClipboardList, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30' },
    { label: 'DAYS WORKED', value: `${data?.daysWorked || 0} Days`, icon: CalendarDays, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/30' },
    { label: 'TOTAL POB', value: `₹${Math.round(Number(data?.totalPob || 0)).toLocaleString('en-IN')}`, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-28">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3.5 bg-slate-800/95 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-xl bg-slate-700/80 text-sky-400 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white leading-none">Consolidated Activity</h1>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isCompanyWide ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {isCompanyWide ? 'COMPANY SUMMARY' : 'INDIVIDUAL'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              Monthly Field Performance & Call Summary
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportCSV}
            disabled={loading || !data?.dailyBreakdown?.length}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-md active:scale-95"
            title="Download CSV"
          >
            <FileSpreadsheet size={15} />
            <span>Export</span>
          </button>

          <button 
            onClick={() => fetchData(selectedEmpId, selectedMonth, selectedYear)} 
            disabled={loading}
            className="p-2 rounded-xl bg-slate-700/80 text-sky-400 hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Employee Switcher Bar */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 rounded-2xl p-3 flex items-center justify-between shadow-lg text-left transition-all active:scale-98"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCompanyWide ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}>
                {isCompanyWide ? <Users size={20} /> : <User size={20} />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Report Scope:
                </span>
                <span className="text-sm font-black text-white truncate block">
                  {isCompanyWide ? '🏢 Company-Wide Consolidated (All Field Force)' : `👤 ${selectedEmpName || selectedEmpId}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded-lg">
                Switch
              </span>
              <ChevronDown size={18} className="text-slate-400" />
            </div>
          </button>

          {/* Searchable Picker Dropdown */}
          {showPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-3xl p-3 z-30 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search staff by name, HQ, designation..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                <button
                  onClick={() => handleSelectEmployee(null)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                    isCompanyWide ? 'bg-sky-500 text-white font-bold' : 'hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <div>
                      <p className="text-xs font-bold leading-tight">🏢 Company-Wide Consolidated</p>
                      <p className={`text-[10px] ${isCompanyWide ? 'text-white/80' : 'text-slate-400'}`}>All Field Staff Performance</p>
                    </div>
                  </div>
                  {isCompanyWide && <Check size={16} />}
                </button>

                <div className="h-px bg-slate-700/50 my-1" />

                {filteredUsersForPicker.map((u) => {
                  const empName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                  const empKey = u.employeeId || u.uid || u._id;
                  const isSelected = selectedEmpId === empKey;
                  return (
                    <button
                      key={empKey}
                      onClick={() => handleSelectEmployee(u)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                        isSelected ? 'bg-sky-500 text-white font-bold' : 'hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">{empName}</p>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20' : 'bg-slate-900 text-sky-400'}`}>
                            {u.designation || 'TBM'}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          HQ: {u.hq || 'N/A'} • ID: {u.employeeId}
                        </p>
                      </div>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Month/Year Filter */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center text-sky-400 shrink-0">
              <CalendarDays size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Selection</span>
              <span className="text-xs font-bold text-white">{selectedMonth} {selectedYear}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
            >
              {monthsArr.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
            >
              {getDynamicYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={36} className="text-sky-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading consolidated monthly data...</p>
          </div>
        ) : (
          <>
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cards.map((c, i) => {
                const IconComponent = c.icon;
                return (
                  <div key={i} className={`bg-slate-800 border ${c.border} rounded-2xl p-4 shadow-lg flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{c.label}</span>
                      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center ${c.color}`}>
                        <IconComponent size={16} />
                      </div>
                    </div>
                    <span className="text-2xl font-black text-white">{c.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Daily Call Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Daily Field Summary</h3>
                  <p className="text-[11px] text-slate-400">
                    Day-by-day activity for {selectedMonth} {selectedYear}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-xl">
                  Avg: {data?.callAvg || 0} calls/day
                </span>
              </div>

              {!data?.dailyBreakdown?.length ? (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 text-center text-slate-400 text-xs">
                  No activity records logged for {selectedMonth} {selectedYear}.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.dailyBreakdown.map((row: any, idx: number) => (
                    <div 
                      key={idx}
                      className="bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 hover:border-slate-600 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-xs">{formatDDMMYYYY(row.date)}</span>
                          <span className="text-[9px] font-bold bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded">
                            {row.total} Calls
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="text-emerald-400 font-semibold">{row.doctor} Dr</span>
                          <span>•</span>
                          <span className="text-sky-400 font-semibold">{row.chemist} Chem</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{row.stockist} Stk</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {Number(row.pob) > 0 ? (
                          <span className="text-xs font-bold text-emerald-400 block font-mono">
                            ₹{Math.round(Number(row.pob)).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block uppercase">
                            No POB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
