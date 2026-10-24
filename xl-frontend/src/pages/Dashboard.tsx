import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, User, ChevronDown, CheckCircle2, MapPin, Navigation, Clock, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => monthsArr[curDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(() => String(curDate.getFullYear()));
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [announcement, setAnnouncement] = useState('');
  const [tpReminder, setTpReminder] = useState<any>(null);
  const [stats, setStats] = useState({
    target: 0,
    primary: 0,
    secondary: 0,
    primaryPercent: 0,
    secondaryPercent: 0,
    calls: {
      doctor: { actual: 0, target: 0 },
      chemist: { actual: 0, target: 0 },
      stockist: { actual: 0, target: 0 }
    },
    pob: {
      doctor: 0,
      chemist: 0,
      stockist: 0,
      total: 0
    },
    callAverages: {
      doctor: 0,
      chemist: 0,
      stockist: 0,
      daysWorked: 0
    }
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [officePunch, setOfficePunch] = useState<{
    enabled: boolean;
    isPunchedIn: boolean;
    officeName: string;
    sessions: any[];
    totalMinutes: number;
    loading: boolean;
  }>({
    enabled: false,
    isPunchedIn: false,
    officeName: 'Corporate Office',
    sessions: [],
    totalMinutes: 0,
    loading: true
  });
  const [punchingIn, setPunchingIn] = useState(false);

  useEffect(() => {
    let employeeId = '';
    try {
      const storedUser = localStorage.getItem('xl_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        employeeId = u.employeeId || u.email || u.uid || '';
      }
    } catch (e) {
      console.error(e);
    }

    setLoadingStats(true);
    axios.get(`/api/xl/user/dashboard-stats?employeeId=${encodeURIComponent(employeeId)}&month=${selectedMonth}&year=${selectedYear}`)
      .then(res => {
        if (res.data?.success && res.data.data) {
          setStats(res.data.data);
        }
      })
      .catch(err => console.error('Failed to fetch dashboard stats:', err))
      .finally(() => setLoadingStats(false));
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    axios.get('/api/xl/admin/announcement')
      .then(res => {
        if (res.data.success && res.data.data) {
          setAnnouncement(res.data.data.message);
        }
      })
      .catch(e => console.error('Failed to fetch announcement:', e));

    let employeeId = '';
    try {
      const storedUser = localStorage.getItem('xl_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        employeeId = u.employeeId || u.email || u.uid || '';
      }
    } catch (e) {
      console.error(e);
    }

    if (employeeId) {
      const todayStr = new Date().toISOString().split('T')[0];
      axios.get(`/api/xl/attendance/my?email=${encodeURIComponent(employeeId)}&date=${todayStr}`)
        .then(res => {
          if (res.data?.officePunchConfig?.enabled) {
            setOfficePunch({
              enabled: true,
              isPunchedIn: Boolean(res.data.isCurrentlyPunchedIn),
              officeName: res.data.officePunchConfig.officeName || 'Corporate Office',
              sessions: res.data.sessions || [],
              totalMinutes: Number(res.data.totalOfficeMinutes) || 0,
              loading: false
            });
          } else {
            setOfficePunch(prev => ({ ...prev, loading: false }));
          }
        })
        .catch(() => setOfficePunch(prev => ({ ...prev, loading: false })));
    }

    axios.get(`/api/xl/tour-program/submission-reminder?employeeId=${encodeURIComponent(employeeId)}`)
      .then(res => {
        if (res.data && res.data.success) {
          setTpReminder(res.data);
        }
      })
      .catch(e => console.error('Failed to fetch TP reminder:', e));
  }, []);

  const handleInlineOfficePunchIn = () => {
    let employeeId = '';
    try {
      const storedUser = localStorage.getItem('xl_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        employeeId = u.employeeId || u.email || u.uid || '';
      }
    } catch {}
    if (!employeeId) return;

    setPunchingIn(true);
    const todayStr = new Date().toISOString().split('T')[0];

    const doSubmit = async (lat: number | null, lng: number | null, acc: number | null) => {
      try {
        await axios.post('/api/xl/attendance/punch-in', {
          employeeId,
          date: todayStr,
          punchInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          punchInLat: lat,
          punchInLng: lng,
          gpsAccuracy: acc
        });
        navigate('/extras/attendance');
      } catch {
        navigate('/extras/attendance');
      } finally {
        setPunchingIn(false);
      }
    };

    if (!navigator.geolocation) {
      doSubmit(null, null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => doSubmit(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos2) => doSubmit(pos2.coords.latitude, pos2.coords.longitude, pos2.coords.accuracy),
          () => doSubmit(null, null, null),
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 15000 }
    );
  };

  return (
    <div className="min-h-full bg-slate-800 flex flex-col font-sans pb-24 text-slate-100">
      
      {/* Floating Tour Plan Submission Reminder Scroll Message */}
      {tpReminder && tpReminder.shouldShow && (
        <div 
          onClick={() => navigate(tpReminder.targetUrl || '/extras/tour-program')}
          className="bg-gradient-to-r from-amber-600/30 via-orange-600/25 to-amber-600/30 border-b border-amber-500/50 overflow-hidden py-2.5 px-3 flex items-center gap-2.5 shadow-lg cursor-pointer active:opacity-90 select-none transition-all hover:bg-amber-600/40"
          title="Click to open and submit your Tour Plan"
        >
          <div className="shrink-0 bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
            <span>TP REMINDER</span>
          </div>
          <marquee className="text-amber-200 text-xs sm:text-sm font-bold tracking-wide cursor-pointer" scrollamount="6">
            📢 {tpReminder.reminderMessage} &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp; ⚠️ Mandatory Submission: Tap here to submit your Tour Plan now &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp; 🚀 {tpReminder.reminderMessage}
          </marquee>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(tpReminder.targetUrl || '/extras/tour-program'); }}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-lg shadow transition active:scale-95 flex items-center gap-1"
          >
            <span>Submit</span>
          </button>
        </div>
      )}

      {/* Global Scrolling Announcement */}
      {announcement && (
        <div className="bg-sky-600/20 border-b border-sky-500/30 overflow-hidden py-2 px-4 flex items-center shadow-md">
           
           <marquee className="text-white text-sm font-medium" scrollamount="5">{announcement}</marquee>
        </div>
      )}
  
      
      <div className="px-5 mt-4 space-y-6">
        
        {/* Office Geo-Presence Attendance Action Card (For Users with PUNCHING enabled) */}
        {officePunch.enabled && !officePunch.loading && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> {officePunch.officeName}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                officePunch.isPunchedIn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {officePunch.isPunchedIn ? 'ACTIVE IN OFFICE' : 'NOT PUNCHED IN'}
              </span>
            </div>

            {!officePunch.isPunchedIn ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {officePunch.sessions.length > 0
                      ? 'Welcome Back. Tap to Re-Punch In'
                      : 'You are in Office. Please Punch In to Start.'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1-Tap Geo-Punch to begin logging your office session
                  </p>
                </div>
                <button
                  onClick={handleInlineOfficePunchIn}
                  disabled={punchingIn}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Navigation size={15} className={punchingIn ? 'animate-spin' : ''} />
                  <span>{punchingIn ? 'VERIFYING GPS...' : (officePunch.sessions.length > 0 ? 'TAP TO RE-PUNCH IN' : 'PUNCH IN TO START')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock size={15} className="text-emerald-400" /> Session #{officePunch.sessions.length} Active
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Logged: {officePunch.totalMinutes}m inside office today
                  </p>
                </div>
                <button
                  onClick={() => navigate('/extras/attendance')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 active:scale-95 transition-all"
                >
                  View Attendance
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filters Section */}
        <div>
          <h2 className="text-xl font-bold text-sky-400 mb-4">My Stats</h2>
          <div className="grid grid-cols-2 gap-3 relative z-30">
            {/* Month Dropdown Scroll Box */}
            <div className="relative" ref={monthRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMonthOpen(!isMonthOpen);
                  setIsYearOpen(false);
                }}
                className={`w-full bg-slate-700 hover:bg-slate-700/80 border ${
                  isMonthOpen ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-slate-700'
                } rounded-xl py-3 pl-10 pr-10 font-semibold text-white flex items-center justify-between transition-all`}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CheckCircle2 size={16} className="text-sky-400" />
                </div>
                <span className="text-sm font-bold text-slate-100">{selectedMonth}</span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown
                    size={18}
                    className={`text-slate-300 transition-transform duration-200 ${isMonthOpen ? 'rotate-180 text-sky-400' : ''}`}
                  />
                </div>
              </button>

              {isMonthOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1">
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-700/50">
                    {monthsArr.map((m) => {
                      const isSelected = selectedMonth === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setIsMonthOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{m}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-sky-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Year Dropdown Scroll Box */}
            <div className="relative" ref={yearRef}>
              <button
                type="button"
                onClick={() => {
                  setIsYearOpen(!isYearOpen);
                  setIsMonthOpen(false);
                }}
                className={`w-full bg-slate-700 hover:bg-slate-700/80 border ${
                  isYearOpen ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-slate-700'
                } rounded-xl py-3 pl-10 pr-10 font-semibold text-white flex items-center justify-between transition-all`}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CheckCircle2 size={16} className="text-sky-400" />
                </div>
                <span className="text-sm font-bold text-slate-100">{selectedYear}</span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown
                    size={18}
                    className={`text-slate-300 transition-transform duration-200 ${isYearOpen ? 'rotate-180 text-sky-400' : ''}`}
                  />
                </div>
              </button>

              {isYearOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1">
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-700/50">
                    {['2024', '2025', '2026', '2027', '2028'].map((y) => {
                      const isSelected = selectedYear === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setSelectedYear(y);
                            setIsYearOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{y}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-sky-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Performance */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-sky-400" />
              <h3 className="text-lg font-bold text-white">Sales Performance</h3>
            </div>
            {loadingStats && <span className="text-[10px] text-sky-400 font-bold animate-pulse">Syncing...</span>}
          </div>
          
          <div className="bg-slate-700 border border-slate-700 rounded-3xl p-5 shadow-lg shadow-black/20 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-xs font-bold text-slate-200">Monthly Target</span>
              </div>
              <p className="text-2xl font-black text-white pl-4">
                ₹{Math.round(Number(stats.target || 0)).toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-bold text-emerald-400">Primary Sales</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {(stats.primaryPercent ?? (stats.target > 0 ? (stats.primary / stats.target) * 100 : 0)).toFixed(2)}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-600 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, stats.primaryPercent || (stats.target > 0 ? (stats.primary / stats.target) * 100 : 0)))}%` }}
                ></div>
              </div>
              <p className="text-lg font-black text-sky-400 pl-4">
                ₹{Math.round(Number(stats.primary || 0)).toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-slate-300">Secondary Sales</span>
                </div>
                <span className="text-xs font-bold text-blue-400">
                  {(stats.secondaryPercent ?? (stats.target > 0 ? (stats.secondary / stats.target) * 100 : 0)).toFixed(2)}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-600 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, stats.secondaryPercent || (stats.target > 0 ? (stats.secondary / stats.target) * 100 : 0)))}%` }}
                ></div>
              </div>
              <p className="text-lg font-black text-sky-400 pl-4">
                ₹{Math.round(Number(stats.secondary || 0)).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Calls Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Calls (MTD)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-700 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 text-center tracking-wide">
                {stats.calls?.doctor?.actual ?? 0} / {stats.calls?.doctor?.target ?? 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Doctors</span>
            </div>
            <div className="bg-slate-700 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400 text-center tracking-wide">
                {stats.calls?.chemist?.actual ?? 0} / {stats.calls?.chemist?.target ?? 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Chemists</span>
            </div>
            <div className="bg-slate-700 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-400 text-center tracking-wide">
                {stats.calls?.stockist?.actual ?? 0} / {stats.calls?.stockist?.target ?? 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Stockists</span>
            </div>
          </div>
        </div>

        {/* POB Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Personal Order Booking</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">
                {(() => {
                  const n = Number(stats.pob?.doctor || 0);
                  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)}Cr`;
                  if (n >= 100000) return `₹ ${(n / 100000).toFixed(1)}L`;
                  if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)}K`;
                  return `₹ ${n}`;
                })()}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Dr. POB</span>
            </div>
            <div className="bg-slate-700 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">
                {(() => {
                  const n = Number(stats.pob?.chemist || 0);
                  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)}Cr`;
                  if (n >= 100000) return `₹ ${(n / 100000).toFixed(1)}L`;
                  if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)}K`;
                  return `₹ ${n}`;
                })()}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Chem. POB</span>
            </div>
            <div className="bg-slate-700 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-400">
                {(() => {
                  const n = Number(stats.pob?.stockist || 0);
                  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)}Cr`;
                  if (n >= 100000) return `₹ ${(n / 100000).toFixed(1)}L`;
                  if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)}K`;
                  return `₹ ${n}`;
                })()}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Stock. POB</span>
            </div>
          </div>
        </div>

        {/* Call Averages */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Call Averages</h3>
          <div className="bg-slate-700 border border-slate-700 rounded-3xl p-5 shadow-lg flex justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-2xl font-black text-sky-400">{stats.callAverages?.doctor ?? 0}</span>
                <p className="text-xs font-bold text-slate-200">Doctor's Call Average</p>
              </div>
              <div>
                <span className="text-2xl font-black text-sky-400">{stats.callAverages?.chemist ?? 0}</span>
                <p className="text-xs font-bold text-slate-200">Chemist's Call Average</p>
              </div>
              <div>
                <span className="text-2xl font-black text-sky-400">{stats.callAverages?.stockist ?? 0}</span>
                <p className="text-xs font-bold text-slate-200">Stockist's Call Average</p>
              </div>
            </div>
            
            {/* Visual Bar Graph */}
            {(() => {
              const maxVal = Math.max(
                stats.callAverages?.doctor || 0,
                stats.callAverages?.chemist || 0,
                stats.callAverages?.stockist || 0,
                1
              );
              const docH = `${Math.min(95, Math.max(12, Math.round(((stats.callAverages?.doctor || 0) / maxVal) * 94)))}%`;
              const chemH = `${Math.min(95, Math.max(12, Math.round(((stats.callAverages?.chemist || 0) / maxVal) * 94)))}%`;
              const stkH = `${Math.min(95, Math.max(12, Math.round(((stats.callAverages?.stockist || 0) / maxVal) * 94)))}%`;

              return (
                <div className="flex items-end gap-3 h-36 pt-4 pr-2">
                  <div className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-4 bg-emerald-500 rounded-full transition-all duration-500" style={{ height: docH }}></div>
                  </div>
                  <div className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-4 bg-amber-400 rounded-full transition-all duration-500" style={{ height: chemH }}></div>
                  </div>
                  <div className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-4 bg-rose-400 rounded-full transition-all duration-500" style={{ height: stkH }}></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
