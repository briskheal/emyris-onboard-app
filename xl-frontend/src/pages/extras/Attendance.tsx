import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserCheck, Clock, Navigation } from 'lucide-react';
import axios from 'axios';

// Hardcoded for Phase 3 — will be replaced by login session in future
const USER_EMAIL = 'rep@emyris.in';

export default function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [att, setAtt] = useState<any>(null);
  
  const todayDate = new Date();
  const dateStr = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const displayDate = todayDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`/api/xl/attendance/my?email=${USER_EMAIL}&date=${dateStr}`);
      setAtt(res.data.data);
    } catch (e) {
      setError('Failed to fetch attendance status.');
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async (type: 'in' | 'out') => {
    if (!navigator.geolocation) {
      setError('GPS is not supported on your device.');
      return;
    }
    setActionLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const payload = {
            employeeEmail: USER_EMAIL,
            date: dateStr,
            [type === 'in' ? 'punchInTime' : 'punchOutTime']: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            [type === 'in' ? 'punchInLat' : 'punchOutLat']: pos.coords.latitude,
            [type === 'in' ? 'punchInLng' : 'punchOutLng']: pos.coords.longitude,
          };
          await axios.post(`/api/xl/attendance/punch-${type}`, payload);
          await fetchAttendance();
        } catch (e: any) {
          setError(e?.response?.data?.error || `Failed to punch ${type}.`);
        } finally {
          setActionLoading(false);
        }
      },
      (err) => {
        setActionLoading(false);
        setError(err.code === 1 ? 'Location access denied. Please enable GPS.' : 'Could not get location. Try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="min-h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-slate-800 border-b border-slate-700/60">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Attendance</h1>
          <p className="text-xs text-slate-400">Daily punch-in / punch-out</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-widest">Today</p>
        <h2 className="text-xl font-bold text-white mb-10 text-center">{displayDate}</h2>

        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-full bg-slate-800 border-4 border-slate-700"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* Status Card */}
            <div className="w-full bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-8 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Punch In</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={14} className="text-emerald-400" />
                  <p className="text-sm text-white font-medium">{att?.punchInTime || '--:--'}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase">Punch Out</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <Clock size={14} className="text-rose-400" />
                  <p className="text-sm text-white font-medium">{att?.punchOutTime || '--:--'}</p>
                </div>
              </div>
            </div>

            {/* Huge Punch Button */}
            {!att ? (
              <button 
                onClick={() => handlePunch('in')} 
                disabled={actionLoading}
                className={`relative group w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${actionLoading ? 'bg-emerald-600 scale-95' : 'bg-emerald-500 active:scale-95 active:bg-emerald-600 shadow-emerald-500/20'}`}
              >
                <div className="absolute inset-0 rounded-full border-[6px] border-emerald-400/30"></div>
                <Navigation size={32} className={`text-white ${actionLoading ? 'animate-spin' : ''}`} />
                <span className="text-white font-bold text-lg tracking-wide">
                  {actionLoading ? 'Locating...' : 'PUNCH IN'}
                </span>
                <span className="text-emerald-100 text-xs font-medium">Capture GPS</span>
              </button>
            ) : !att.punchOutTime ? (
              <button 
                onClick={() => handlePunch('out')} 
                disabled={actionLoading}
                className={`relative group w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${actionLoading ? 'bg-rose-600 scale-95' : 'bg-rose-500 active:scale-95 active:bg-rose-600 shadow-rose-500/20'}`}
              >
                <div className="absolute inset-0 rounded-full border-[6px] border-rose-400/30"></div>
                <UserCheck size={32} className="text-white" />
                <span className="text-white font-bold text-lg tracking-wide">
                  {actionLoading ? 'Locating...' : 'PUNCH OUT'}
                </span>
                <span className="text-rose-100 text-xs font-medium">End your day</span>
              </button>
            ) : (
              <div className="w-48 h-48 rounded-full bg-slate-800 border-[6px] border-slate-700 flex flex-col items-center justify-center gap-2">
                <UserCheck size={32} className="text-slate-500" />
                <span className="text-slate-400 font-bold text-lg tracking-wide">COMPLETED</span>
                <span className="text-slate-500 text-xs font-medium">See you tomorrow!</span>
              </div>
            )}
            
            {error && <p className="text-rose-400 text-sm mt-6 text-center">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
