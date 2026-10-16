import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Users, Download, Calendar, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface TeamMember {
  _id: string;
  employeeId: string;
  name: string;
  designation?: string;
  hq?: string;
}

interface EffortSummary {
  totalDoctors: number;
  totalDoctorsMet: number;
  totalUniqueDoctors: number;
  totalMissedDoctors: number;
  totalNonCore: string;
  totalCore: string;
  totalSuperCore: string;
  coverage: string | number;
  compliance: string | number;
}

interface EffortRow {
  label: string;
  data: (number | string)[];
}

interface EffortData {
  user: {
    _id: string;
    employeeId: string;
    name: string;
    designation?: string;
    hq?: string;
  };
  month: string;
  year: string;
  summary: EffortSummary;
  matrix: EffortRow[];
}

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('xl_user');
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = ['2025', '2026', '2027'];

export default function EffortAnalysisReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentUser = getStoredUser();
  const rawMonth = searchParams.get('month') || '';
  const rawYear = searchParams.get('year') || String(new Date().getFullYear());

  // Normalize month name (e.g. 'september' -> 'Sep')
  const normalizeMonth = (m: string) => {
    if (!m) return MONTHS[new Date().getMonth()];
    const clean = m.trim().toLowerCase();
    const found = MONTHS.find(mon => mon.toLowerCase() === clean.slice(0, 3));
    return found || MONTHS[new Date().getMonth()];
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(normalizeMonth(rawMonth));
  const [selectedYear, setSelectedYear] = useState<string>(rawYear || '2026');

  // Manager & Team State
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentUser?.employeeId || currentUser?.email || ''
  );
  const [selectedUserObj, setSelectedUserObj] = useState<TeamMember | null>(null);

  // Matrix Data State
  const [effortData, setEffortData] = useState<EffortData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Manager Team Hierarchy
  useEffect(() => {
    if (!currentUser) return;
    const empId = currentUser.employeeId || currentUser.email || currentUser._id;
    if (!empId) return;

    axios.get(`/api/xl/performance/my-team?employeeId=${empId}`)
      .then(res => {
        if (res.data.success) {
          setIsManager(res.data.isManager || (res.data.team && res.data.team.length > 0));
          setTeam(res.data.team || []);
          if (!selectedUserObj) {
            setSelectedUserObj(res.data.user || {
              _id: currentUser._id,
              employeeId: currentUser.employeeId,
              name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || currentUser.email,
              designation: currentUser.designation,
              hq: currentUser.hq
            });
          }
        }
      })
      .catch(err => {
        console.warn('Could not load manager team:', err);
      });
  }, []);

  // 2. Fetch Effort Matrix Data whenever Month, Year, or Target User changes
  useEffect(() => {
    const targetId = selectedEmployeeId || currentUser?.employeeId || currentUser?.email;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    axios.get(`/api/xl/performance/effort-matrix?month=${selectedMonth}&year=${selectedYear}&employeeId=${targetId}`)
      .then(res => {
        if (res.data.success) {
          setEffortData(res.data);
          if (res.data.user) {
            setSelectedUserObj(res.data.user);
          }
        } else {
          setError(res.data.message || 'Failed to load effort matrix');
        }
      })
      .catch(err => {
        console.error('Error fetching effort matrix:', err);
        setError(err.response?.data?.message || 'Error connecting to server');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedMonth, selectedYear, selectedEmployeeId]);

  // Handle Month / Year changes
  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    setSearchParams({ month: m, year: selectedYear });
  };

  const handleYearChange = (y: string) => {
    setSelectedYear(y);
    setSearchParams({ month: selectedMonth, year: y });
  };

  // Handle Export / Share to Excel
  const handleShare = async () => {
    if (!effortData || !effortData.matrix || effortData.matrix.length === 0) {
      alert('No data available to share');
      return;
    }

    setIsSharing(true);
    try {
      const userName = selectedUserObj?.name || effortData.user?.name || 'User';
      const userEmpId = selectedUserObj?.employeeId || effortData.user?.employeeId || '';
      const userDesig = selectedUserObj?.designation || effortData.user?.designation || '';
      const userHq = selectedUserObj?.hq || effortData.user?.hq || '';

      const fileName = `Effort_Analysis_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedMonth}_${selectedYear}.xlsx`;

      const rows: any[][] = [];

      // Sheet Header
      rows.push(['EFFORT ANALYSIS REPORT']);
      rows.push([`Employee: ${userName} (${userEmpId})`, `Designation: ${userDesig}`, `HQ: ${userHq}`]);
      rows.push([`Period: ${selectedMonth} ${selectedYear}`, `Generated: ${new Date().toLocaleDateString()}`]);
      rows.push([]);

      // Summary Block
      rows.push(['EFFORT SUMMARY OVERVIEW']);
      rows.push([
        'Total Doctors',
        'Total Doctors Met',
        'Total Unique Visited',
        'Total Missed Doctors',
        'Non-Core Met/Total',
        'Core Met/Total',
        'Super-Core Met/Total',
        'Doctor Coverage %',
        'Doctor Compliance %'
      ]);
      rows.push([
        effortData.summary?.totalDoctors ?? 0,
        effortData.summary?.totalDoctorsMet ?? 0,
        effortData.summary?.totalUniqueDoctors ?? 0,
        effortData.summary?.totalMissedDoctors ?? 0,
        effortData.summary?.totalNonCore ?? '0 / 0',
        effortData.summary?.totalCore ?? '0 / 0',
        effortData.summary?.totalSuperCore ?? '0 / 0',
        `${effortData.summary?.coverage ?? 0}%`,
        `${effortData.summary?.compliance ?? 0}%`
      ]);
      rows.push([]);

      // Matrix Table
      rows.push(['WEEKLY EFFORT BREAKDOWN MATRIX']);
      rows.push(['Metrics', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Total']);

      effortData.matrix.forEach(row => {
        const rowVals = row.data.map(val => {
          if (typeof val === 'number') {
            if (row.label.includes('Percentage')) return val.toFixed(2) + '%';
            if (row.label.includes('Average')) return val.toFixed(2);
          }
          return val;
        });
        rows.push([row.label, ...rowVals]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Column widths
      ws['!cols'] = [
        { wch: 34 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Effort Analysis');

      // Native share or download
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Effort Analysis - ${userName}`,
          text: `Effort Analysis Report for ${userName} (${selectedMonth} ${selectedYear})`
        });
        showToast('Shared successfully!');
      } else {
        XLSX.writeFile(wb, fileName);
        showToast('Excel downloaded successfully!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        showToast('Failed to share file: ' + (err.message || 'Error'));
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0f1422] flex flex-col font-sans pb-32 text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-sky-600 text-white px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="px-4 py-4 border-b border-[#232a45] bg-[#14192d] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/extras/performance')} 
            className="w-10 h-10 rounded-xl bg-[#1e243d] hover:bg-[#283152] border border-[#363e63] flex items-center justify-center text-slate-200 active:scale-95 transition-all shadow-sm"
            title="Back to Performance Menu"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-black text-sky-400 leading-tight">
              Effort Analysis Report
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {selectedUserObj ? `${selectedUserObj.name} • ` : ''}{selectedMonth} {selectedYear}
            </p>
          </div>
        </div>

        <button 
          onClick={handleShare} 
          disabled={loading || isSharing}
          className="h-10 px-3.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 transition-all disabled:opacity-50 text-xs md:text-sm cursor-pointer"
          title="Share / Export Excel Report"
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Share2 size={16} />
              <span className="hidden sm:inline">Export Excel</span>
            </>
          )}
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Line Manager & Date Filter Card */}
        <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-4 shadow-xl space-y-4">
          {/* Team Member Switcher (Only visible to Line Managers or Admins) */}
          {isManager && team.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Users size={16} className="text-sky-400" />
                <label className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Select Team Member (Line Manager View)
                </label>
              </div>
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedEmployeeId(val);
                  if (val === (currentUser?.employeeId || currentUser?.email)) {
                    setSelectedUserObj({
                      _id: currentUser._id,
                      employeeId: currentUser.employeeId,
                      name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || currentUser.email,
                      designation: currentUser.designation,
                      hq: currentUser.hq
                    });
                  } else {
                    const found = team.find(m => m.employeeId === val || m._id === val);
                    if (found) setSelectedUserObj(found);
                  }
                }}
                className="w-full bg-[#1e243d] border border-[#363e63] rounded-xl text-white font-semibold text-xs md:text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value={currentUser?.employeeId || currentUser?.email}>
                  👤 My Effort Report ({currentUser?.firstName || ''} {currentUser?.lastName || ''} - Self)
                </option>
                <optgroup label="Direct Subordinates & Team Members">
                  {team.map(m => (
                    <option key={m.employeeId || m._id} value={m.employeeId}>
                      {m.name} ({m.designation || 'Field'} - {m.hq || 'HQ'})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Month & Year Selectors */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#232a45]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
              <Calendar size={14} className="text-sky-400" />
              <span>Month:</span>
            </div>
            <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {MONTHS.map(m => (
                <button
                  key={m}
                  onClick={() => handleMonthChange(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    selectedMonth === m
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-[#1e243d] text-slate-300 hover:bg-[#283152] border border-[#363e63]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1 ml-auto">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => handleYearChange(y)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedYear === y
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#1e243d] text-slate-400 hover:text-white border border-[#363e63]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400 animate-pulse">Calculating effort matrix...</p>
          </div>
        )}

        {/* Error message */}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400">
            <p className="font-bold text-sm mb-2">{error}</p>
            <p className="text-xs text-slate-400">Please verify network connectivity or check if user has allotted doctors.</p>
          </div>
        )}

        {/* Data Content */}
        {!loading && effortData && (
          <div className="space-y-6">
            {/* Quick KPI Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-3.5 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Doctor Coverage
                </span>
                <span className="text-2xl font-black text-sky-400">
                  {effortData.summary?.coverage}%
                </span>
              </div>
              <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-3.5 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Doctor Compliance
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {effortData.summary?.compliance}%
                </span>
              </div>
              <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-3.5 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Doctors
                </span>
                <span className="text-2xl font-black text-white">
                  {effortData.summary?.totalDoctors}
                </span>
              </div>
              <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-3.5 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Doctors Met (Calls)
                </span>
                <span className="text-2xl font-black text-sky-300">
                  {effortData.summary?.totalDoctorsMet}
                </span>
              </div>
              <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-3.5 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Unique Doctors Visited
                </span>
                <span className="text-2xl font-black text-teal-300">
                  {effortData.summary?.totalUniqueDoctors}
                </span>
              </div>
              <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-3.5 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Missed Doctors
                </span>
                <span className="text-2xl font-black text-rose-400">
                  {effortData.summary?.totalMissedDoctors}
                </span>
              </div>
            </div>

            {/* Effort Analysis Summary Table (Matching Admin Portal) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  Effort Analysis Monthly Summary
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedMonth} {selectedYear}
                </span>
              </div>
              <div className="border border-[#363e63] rounded-lg shadow-xl overflow-x-auto">
                <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200 whitespace-nowrap">
                  <thead className="bg-[#1e243d]">
                    <tr>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Sr<br/>no.</th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total<br/>Doctors</th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Doctors<br/>Met</th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Unique<br/>Doctors Visited</th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Missed<br/>Doctors</th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Non-<br/>Core Doctors Met</th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Core<br/>Doctors Met</th>
                      <th className="border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Super<br/>Core Doctors Met</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#14192d] hover:bg-[#20294a] transition-colors text-center font-medium">
                      <td className="border-r border-b border-[#363e63] px-3 py-3 text-slate-400">1</td>
                      <td className="border-r border-b border-[#363e63] px-3 py-3 font-bold text-white">{effortData.summary?.totalDoctors}</td>
                      <td className="border-r border-b border-[#363e63] px-3 py-3 font-semibold text-slate-200">{effortData.summary?.totalDoctorsMet}</td>
                      <td className="border-r border-b border-[#363e63] px-3 py-3 font-semibold text-sky-300">{effortData.summary?.totalUniqueDoctors}</td>
                      <td className="border-r border-b border-[#363e63] px-3 py-3 font-bold text-red-400">{effortData.summary?.totalMissedDoctors}</td>
                      <td className="border-r border-b border-[#363e63] px-3 py-3 text-slate-300">{effortData.summary?.totalNonCore}</td>
                      <td className="border-r border-b border-[#363e63] px-3 py-3 text-slate-300">{effortData.summary?.totalCore}</td>
                      <td className="border-b border-b border-[#363e63] px-3 py-3 text-slate-300">{effortData.summary?.totalSuperCore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full 17-Row 6-Week Effort Breakdown Matrix (Matching Admin Portal Exactly) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-sky-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  Weekly Effort Breakdown Matrix
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Week 1 – Week 6 + Monthly Total
                </span>
              </div>
              
              <div className="border border-[#363e63] rounded-lg shadow-xl overflow-x-auto">
                <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200">
                  <thead className="bg-[#1e243d]">
                    <tr>
                      <th className="border-r border-b border-[#363e63] px-4 py-3 text-left font-bold text-sky-300 uppercase tracking-wider sticky left-0 bg-[#1e243d] z-10 whitespace-nowrap">
                        Metrics
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                        Week 1
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                        Week 2
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                        Week 3
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                        Week 4
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                        Week 5
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                        Week 6
                      </th>
                      <th className="border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-400 uppercase tracking-wider bg-[#222a47] whitespace-nowrap">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {effortData.matrix.map((row, i) => (
                      <tr key={i} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                        <td className="border-r border-b border-[#363e63] px-4 py-2.5 font-semibold text-white whitespace-nowrap sticky left-0 bg-inherit z-10">
                          {row.label}
                        </td>
                        {row.data.map((val, colIdx) => {
                          let displayVal = val;
                          if (typeof val === 'number') {
                            if (row.label.includes('Percentage')) displayVal = val.toFixed(2) + '%';
                            else if (row.label.includes('Average')) displayVal = val.toFixed(2);
                          }
                          const isTotalCol = colIdx === 6;
                          return (
                            <td 
                              key={colIdx} 
                              className={`border-r border-b border-[#363e63] px-3 py-2.5 text-center whitespace-nowrap ${
                                isTotalCol 
                                  ? 'font-bold text-sky-300 bg-[#1c233c]/60' 
                                  : 'text-slate-200 font-medium'
                              }`}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
