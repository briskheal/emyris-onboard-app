import { useState, useEffect } from 'react';
import { ArrowLeft, User, MapPin, Store, Building2, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TodaysActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const userStr = sessionStorage.getItem('xla_user') || localStorage.getItem('xla_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const empId = user?.employeeId || user?.uid || '';

  const fetchTodaysActivity = () => {
    setLoading(true);
    axios.get(`/api/xl/user/todays-activity?employeeId=${encodeURIComponent(empId)}`)
      .then(res => {
        setLoading(false);
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTodaysActivity();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-sky-400 active:scale-95">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">Today's Activity</h1>
            <p className="text-xs text-slate-400">{data?.todayDate || 'Daily Tracking'}</p>
          </div>
        </div>

        <button 
          onClick={fetchTodaysActivity} 
          disabled={loading}
          className="p-2 rounded-xl bg-slate-700 text-sky-400 hover:bg-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5 py-6 space-y-6">
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
                <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-emerald-400">
                  <Clock size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                    data?.attendance?.isPunchedIn
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {data?.attendance?.status || 'Not Punched In'}
                  </span>
                </div>
              </div>

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
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <User size={18} className="text-emerald-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.doctorCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctors</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <Store size={18} className="text-sky-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.chemistCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chemists</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <Building2 size={18} className="text-amber-400 mb-1" />
                <span className="text-2xl font-black text-white">{data?.stockistCalls || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stockists</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
                <span className="text-xs font-bold text-indigo-400 mb-1">₹</span>
                <span className="text-xl font-black text-indigo-400">₹{Math.round(Number(data?.totalPob || 0)).toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's POB</span>
              </div>
            </div>

            {/* Visits Log List */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm">Visits Logged Today</h3>
                <span className="text-xs font-bold text-sky-400">{data?.visits?.length || 0} visits</span>
              </div>

              {(data?.visits || []).length > 0 ? (
                <div className="space-y-3">
                  {data.visits.map((act: any, idx: number) => (
                    <div key={idx} className="bg-slate-700/50 border border-slate-600/60 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-300">
                          {act.entityType === 'Doctor' ? <User size={18} className="text-emerald-400" /> : act.entityType === 'Chemist' ? <Store size={18} className="text-sky-400" /> : <Building2 size={18} className="text-amber-400" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm leading-tight">{act.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              act.entityType === 'Doctor' ? 'bg-emerald-500/20 text-emerald-400' : act.entityType === 'Chemist' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {act.entityType}
                            </span>
                            {act.workingAreas && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin size={11} className="text-rose-400" /> {act.workingAreas}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-300 block">{act.time || '--:--'}</span>
                        {Number(act.pob) > 0 && (
                          <span className="text-xs font-bold text-indigo-400 block mt-0.5">
                            ₹{Math.round(Number(act.pob)).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-sm">
                  No visits or calls recorded yet today.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
