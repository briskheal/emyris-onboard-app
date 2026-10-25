import { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, MapPin, Store, Building2, Clock, 
  RefreshCw, Users, Search, ChevronDown, Check, Activity 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function TodaysActivity() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramEmpId = searchParams.get('employeeId');
  const paramName = searchParams.get('name');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Selected employee: 'ALL' for company-wide, or specific employeeId
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => paramEmpId || 'ALL');
  const [selectedEmpName, setSelectedEmpName] = useState<string>(() => paramName || '');

  // Employee picker dropdown/modal state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  
  // Visit entity filter
  const [visitFilter, setVisitFilter] = useState<'ALL' | 'Doctor' | 'Chemist' | 'Stockist'>('ALL');

  // Load field users list for picker
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

  const fetchTodaysActivity = (empIdToFetch: string) => {
    setLoading(true);
    const q = (!empIdToFetch || empIdToFetch === 'ALL') ? '' : `?employeeId=${encodeURIComponent(empIdToFetch)}`;
    axios.get(`/api/xl/user/todays-activity${q}`)
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
    fetchTodaysActivity(selectedEmpId);
  }, [selectedEmpId]);

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

  const filteredVisits = (data?.visits || []).filter((v: any) => {
    if (visitFilter === 'ALL') return true;
    return v.entityType === visitFilter;
  });

  const filteredUsersForPicker = allUsers.filter(u => {
    if (!pickerSearch.trim()) return true;
    const term = pickerSearch.toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const desig = (u.designation || '').toLowerCase();
    const hq = (u.hq || '').toLowerCase();
    const id = (u.employeeId || '').toLowerCase();
    return name.includes(term) || desig.includes(term) || hq.includes(term) || id.includes(term);
  });

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
              <h1 className="text-lg font-black text-white leading-none">Today's Activity</h1>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isCompanyWide ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {isCompanyWide ? 'COMPANY LIVE' : 'INDIVIDUAL'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {data?.todayDate || 'Daily Tracking'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => fetchTodaysActivity(selectedEmpId)} 
          disabled={loading}
          className="p-2 rounded-xl bg-slate-700/80 text-sky-400 hover:bg-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
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
                  Viewing Activity For:
                </span>
                <span className="text-sm font-black text-white truncate block">
                  {isCompanyWide ? '🏢 Company-Wide Live (All Field Force)' : `👤 ${selectedEmpName || selectedEmpId}`}
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
                {/* Option 1: Company-Wide */}
                <button
                  onClick={() => handleSelectEmployee(null)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                    isCompanyWide ? 'bg-sky-500 text-white font-bold' : 'hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <div>
                      <p className="text-xs font-bold leading-tight">🏢 Company-Wide Live Tracking</p>
                      <p className={`text-[10px] ${isCompanyWide ? 'text-white/80' : 'text-slate-400'}`}>All Field Staff Live Activity</p>
                    </div>
                  </div>
                  {isCompanyWide && <Check size={16} />}
                </button>

                <div className="h-px bg-slate-700/50 my-1" />

                {/* Individual Staff List */}
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

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={36} className="text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading today's activity...</p>
          </div>
        ) : (
          <>
            {/* Attendance Status Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0">
                  <Clock size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isCompanyWide ? 'Field Attendance Status' : 'User Punch-In Status'}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                    data?.attendance?.isPunchedIn
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {data?.attendance?.status || (data?.attendance?.isPunchedIn ? 'Active in Field' : 'Not Punched In')}
                  </span>
                </div>
              </div>

              {!isCompanyWide ? (
                <div className="flex items-center gap-6 text-xs border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6">
                  <div>
                    <span className="text-slate-400 block font-medium">Punch-In Time</span>
                    <span className="font-bold text-white text-sm">{data?.attendance?.punchInTime || '--:--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Punch-Out Time</span>
                    <span className="font-bold text-white text-sm">{data?.attendance?.punchOutTime || 'Active in Field'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6 flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 block font-medium">Total Staff</span>
                    <span className="font-bold text-white text-sm">{data?.totalStaffCount || allUsers.length}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block font-medium">Active Punched</span>
                    <span className="font-bold text-emerald-400 text-sm">{data?.totalPunchedIn || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <User size={18} className="text-emerald-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.doctorCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor Calls</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <Store size={18} className="text-sky-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.chemistCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chemist Calls</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <Building2 size={18} className="text-amber-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.stockistCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stockist Calls</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <Activity size={18} className="text-purple-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.totalCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Calls</span>
              </div>
            </div>

            {/* Today's Total POB Value */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-sky-950/40 border border-emerald-500/30 rounded-3xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Total POB Generated</span>
                <span className="text-2xl font-black text-emerald-400 mt-0.5 block">
                  ₹{Math.round(Number(data?.totalPob || 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Store size={24} />
              </div>
            </div>

            {/* Live Field Activity Log / Visits Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Field Activity Feed</h3>
                  <p className="text-[11px] text-slate-400">
                    {filteredVisits.length} visits logged {isCompanyWide ? 'company-wide' : 'by user'} today
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 text-[10px]">
                  {(['ALL', 'Doctor', 'Chemist', 'Stockist'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setVisitFilter(f)}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                        visitFilter === f ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredVisits.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 text-center text-slate-400 text-xs">
                  No visits logged for today yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredVisits.map((v: any, idx: number) => {
                    const isDoc = v.entityType === 'Doctor';
                    const isChem = v.entityType === 'Chemist';
                    return (
                      <div 
                        key={v._id || idx}
                        className="bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 shadow-md flex items-start justify-between gap-3 hover:border-slate-600 transition-all"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isDoc ? 'bg-emerald-500/20 text-emerald-400' :
                            isChem ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {isDoc ? <User size={18} /> : isChem ? <Store size={18} /> : <Building2 size={18} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h4 className="font-bold text-white text-xs leading-tight truncate">
                                {v.name}
                              </h4>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                isDoc ? 'bg-emerald-500/20 text-emerald-400' :
                                isChem ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {v.entityType}
                              </span>
                            </div>

                            {v.employeeName && (
                              <p className="text-[11px] text-sky-400 font-semibold truncate">
                                Staff: {v.employeeName} {v.hq ? `(${v.hq})` : ''}
                              </p>
                            )}

                            {v.workingAreas && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin size={10} />
                                {v.workingAreas}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-slate-300 block font-bold">
                            {v.time || '--:--'}
                          </span>
                          {Number(v.pob) > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-400 mt-1 block">
                              POB: ₹{Math.round(Number(v.pob)).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 mt-1 block uppercase">
                              No POB
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
