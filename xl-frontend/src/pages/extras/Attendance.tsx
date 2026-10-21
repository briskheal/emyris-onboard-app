import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserCheck, Clock, Navigation, MapPin, ShieldCheck, AlertTriangle, RotateCcw } from 'lucide-react';
import axios from 'axios';

const getUserId = () => {
  const u = localStorage.getItem('xl_user');
  if (!u) return '';
  try {
    const parsed = JSON.parse(u);
    return parsed.employeeId || parsed.email || parsed.uid || '';
  } catch {
    return '';
  }
};

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDurationMinutes(mins: number) {
  const safe = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [att, setAtt] = useState<any>(null);

  // Exclusive 480 sq.ft Office Geo-Punching state (ONLY active when Admin ticked PUNCHING in User Controls)
  const [officeConfig, setOfficeConfig] = useState<{
    enabled: boolean;
    officeName: string;
    officeLat: number | null;
    officeLng: number | null;
    officeRadius: number;
    officeWifiIp?: string;
    requireWifiLock?: boolean;
  }>({
    enabled: false,
    officeName: 'Office Premises (480 sq.ft)',
    officeLat: null,
    officeLng: null,
    officeRadius: 15,
    officeWifiIp: '',
    requireWifiLock: false
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalOfficeMinutes, setTotalOfficeMinutes] = useState<number>(0);
  const [isCurrentlyPunchedIn, setIsCurrentlyPunchedIn] = useState<boolean>(false);
  const [liveDistanceMeters, setLiveDistanceMeters] = useState<number | null>(null);
  const [liveSessionMinutes, setLiveSessionMinutes] = useState<number>(0);

  const autoPunchLockRef = useRef(false);
  const outsideStrikeCountRef = useRef(0);

  const todayDate = new Date();
  const dateStr = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const displayDate = todayDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`/api/xl/attendance/my?email=${encodeURIComponent(getUserId())}&date=${dateStr}`);
      setAtt(res.data.data);
      if (res.data.officePunchConfig) {
        setOfficeConfig(res.data.officePunchConfig);
      }
      if (Array.isArray(res.data.sessions)) {
        setSessions(res.data.sessions);
      }
      if (typeof res.data.totalOfficeMinutes === 'number') {
        setTotalOfficeMinutes(res.data.totalOfficeMinutes);
      }
      setIsCurrentlyPunchedIn(Boolean(res.data.isCurrentlyPunchedIn));
    } catch (e) {
      setError('Failed to fetch attendance status.');
    } finally {
      setLoading(false);
    }
  };

  // Live active session minute ticker for Office Punching users
  useEffect(() => {
    if (!officeConfig.enabled || !isCurrentlyPunchedIn) {
      setLiveSessionMinutes(0);
      return;
    }
    const computeLive = () => {
      const openSess = [...sessions].reverse().find(s => !s.punchOutTime);
      if (openSess && openSess.punchInMs) {
        const mins = Math.max(0, Math.floor((Date.now() - Number(openSess.punchInMs)) / 60000));
        setLiveSessionMinutes(mins);
      }
    };
    computeLive();
    const interval = setInterval(computeLive, 15000);
    return () => clearInterval(interval);
  }, [officeConfig.enabled, isCurrentlyPunchedIn, sessions]);

  // Live Office Geo-Location Distance + 3-Strike Anti-Jitter Auto Punch-Out Watcher
  useEffect(() => {
    if (!officeConfig.enabled || !navigator.geolocation) return;

    const handlePosUpdate = async (pos: GeolocationPosition) => {
      if (officeConfig.officeLat !== null && officeConfig.officeLng !== null) {
        const rawDist = getDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          officeConfig.officeLat,
          officeConfig.officeLng
        );
        const indoorTolerance = Math.min(Math.max(0, Number(pos.coords.accuracy) || 0), 250);
        const effectiveDist = Math.max(0, Math.round(rawDist - indoorTolerance));
        setLiveDistanceMeters(effectiveDist);
        const allowedRadius = Math.max(Number(officeConfig.officeRadius) || 50, 35);

        if (isCurrentlyPunchedIn) {
          if (effectiveDist > allowedRadius) {
            outsideStrikeCountRef.current += 1;
          } else {
            outsideStrikeCountRef.current = 0;
          }

          // Require 3 consecutive outside readings to prevent false indoor GPS drift while sitting at desk
          if (outsideStrikeCountRef.current >= 3 && !autoPunchLockRef.current) {
            autoPunchLockRef.current = true;
            outsideStrikeCountRef.current = 0;
            try {
              const payload = {
                employeeId: getUserId(),
                date: dateStr,
                punchOutTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                punchOutLat: pos.coords.latitude,
                punchOutLng: pos.coords.longitude,
                autoPunchOut: true,
                autoReason: `Auto (Left ${officeConfig.officeName || 'Office'} Geo-Location)`
              };
              const res = await axios.post('/api/xl/attendance/punch-out', payload);
              setInfoMessage(
                res.data?.message ||
                  `Auto Punched Out: You left ${officeConfig.officeName}. Please Re-Punch In when you return.`
              );
              await fetchAttendance();
            } catch {
              // ignore transient network error
            } finally {
              autoPunchLockRef.current = false;
            }
          }
        }
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePosUpdate,
      () => {
        navigator.geolocation.getCurrentPosition(
          handlePosUpdate,
          () => {},
          { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 6000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [officeConfig.enabled, officeConfig.officeLat, officeConfig.officeLng, officeConfig.officeRadius, isCurrentlyPunchedIn]);

  const handlePunch = async (type: 'in' | 'out') => {
    if (!navigator.geolocation) {
      setError('GPS is not supported on your device.');
      return;
    }
    setActionLoading(true);
    setError('');
    setInfoMessage('');

    const executePunchWithPos = async (pos: GeolocationPosition) => {
      try {
        if (officeConfig.enabled && officeConfig.officeLat !== null && officeConfig.officeLng !== null) {
          const rawDist = getDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            officeConfig.officeLat,
            officeConfig.officeLng
          );
          const indoorTolerance = Math.min(Math.max(0, Number(pos.coords.accuracy) || 0), 300);
          const effectiveDist = Math.max(0, Math.round(rawDist - indoorTolerance));
          setLiveDistanceMeters(effectiveDist);
          const allowedRadius = Math.max(Number(officeConfig.officeRadius) || 50, 35);

          if (type === 'in' && effectiveDist > allowedRadius) {
            setError(
              `Outside ${officeConfig.officeName} (${effectiveDist}m away; allowed ${officeConfig.officeRadius}m). Please step inside the office location to Punch In.`
            );
            setActionLoading(false);
            return;
          }
        }

        const payload = {
          employeeId: getUserId(),
          date: dateStr,
          gpsAccuracy: pos.coords.accuracy,
          [type === 'in' ? 'punchInTime' : 'punchOutTime']: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          [type === 'in' ? 'punchInLat' : 'punchOutLat']: pos.coords.latitude,
          [type === 'in' ? 'punchInLng' : 'punchOutLng']: pos.coords.longitude,
        };
        const res = await axios.post(`/api/xl/attendance/punch-${type}`, payload);
        if (res.data?.message) {
          setInfoMessage(res.data.message);
        }
        outsideStrikeCountRef.current = 0;
        await fetchAttendance();
      } catch (e: any) {
        setError(e?.response?.data?.error || `Failed to punch ${type}.`);
      } finally {
        setActionLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      executePunchWithPos,
      () => {
        // Fallback to network/indoor location if hardware GPS satellite fix times out indoors
        navigator.geolocation.getCurrentPosition(
          executePunchWithPos,
          (err) => {
            setActionLoading(false);
            setError(err.code === 1 ? 'Location access denied. Please enable GPS.' : 'Could not get location. Try again.');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  const isInsideOffice =
    officeConfig.officeLat === null ||
    officeConfig.officeLng === null ||
    (liveDistanceMeters !== null && liveDistanceMeters <= Math.max(Number(officeConfig.officeRadius) || 50, 35));

  const combinedTotalMinutes = totalOfficeMinutes + (isCurrentlyPunchedIn ? liveSessionMinutes : 0);

  return (
    <div className="min-h-full bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-slate-700 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-600 active:bg-slate-600">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Attendance</h1>
            <p className="text-xs text-slate-200">
              {officeConfig.enabled ? 'Office Geo-Location Attendance' : 'Daily punch-in / punch-out'}
            </p>
          </div>
        </div>
        {officeConfig.enabled && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck size={12} /> OFFICE MODE
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center px-5 pt-5 pb-24 overflow-y-auto">
        <p className="text-slate-300 font-medium text-xs mb-0.5 uppercase tracking-widest">Today</p>
        <h2 className="text-lg font-bold text-white mb-5 text-center">{displayDate}</h2>

        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 mt-8">
            <div className="w-44 h-44 rounded-full bg-slate-700 border-4 border-slate-700"></div>
          </div>
        ) : officeConfig.enabled ? (
          /* ═══════════════════════════════════════════════════════════════════════
             EXCLUSIVE OFFICE STAFF GEO-LOCATION ATTENDANCE + TIME LOG VIEW
             (Only shown for users where Admin ticked PUNCHING in User Controls)
             ═══════════════════════════════════════════════════════════════════════ */
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* Pure Office Geo-Location Match Status Card */}
            <div className="w-full bg-slate-700/60 rounded-2xl p-3.5 border border-slate-600/80 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isInsideOffice ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{officeConfig.officeName}</p>
                    <p className="text-[11px] text-slate-300">
                      Linked Office Zone: <span className="font-semibold text-sky-400">{officeConfig.officeRadius}m</span>
                    </p>
                  </div>
                </div>
                {officeConfig.officeLat !== null && officeConfig.officeLng !== null ? (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                    liveDistanceMeters === null
                      ? 'bg-slate-600 text-slate-200'
                      : isInsideOffice
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {liveDistanceMeters === null
                      ? 'GPS Locating...'
                      : isInsideOffice
                      ? `Matched (${liveDistanceMeters}m)`
                      : `Outside (${liveDistanceMeters}m)`}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                    Multi-Punch Active
                  </span>
                )}
              </div>

              <p className="text-[10px] text-slate-300 leading-relaxed">
                Leaving the linked {officeConfig.officeRadius}m office geo-location triggers <span className="text-amber-300 font-semibold">Auto Punch-Out</span>. Re-Punch In when back inside to log your office hours.
              </p>
            </div>

            {/* Summary Metrics Card */}
            <div className="w-full bg-slate-700/50 rounded-2xl p-4 border border-slate-700 mb-6 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-300 font-semibold uppercase">First Punch In</p>
                <p className="text-xs text-emerald-400 font-bold mt-1">{att?.punchInTime || '--:--'}</p>
              </div>
              <div className="border-x border-slate-600/80 px-1">
                <p className="text-[10px] text-slate-300 font-semibold uppercase">Inside Office</p>
                <p className="text-sm text-sky-400 font-extrabold mt-0.5">{formatDurationMinutes(combinedTotalMinutes)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-300 font-semibold uppercase">Last Out</p>
                <p className="text-xs text-rose-400 font-bold mt-1">
                  {isCurrentlyPunchedIn ? 'ACTIVE' : (att?.punchOutTime || '--:--')}
                </p>
              </div>
            </div>

            {/* Automatic Office Arrival Prompt Banner */}
            {!isCurrentlyPunchedIn && isInsideOffice && (
              <div className="w-full mb-4 bg-emerald-500/20 border-2 border-emerald-400/60 rounded-2xl px-4 py-3 text-center shadow-lg animate-pulse">
                <p className="text-sm font-extrabold text-emerald-200 tracking-wide">
                  {sessions.length > 0
                    ? 'Welcome Back. Tap to Re-Punch In'
                    : 'You are in Office. Please Punch In to Start.'}
                </p>
              </div>
            )}

            {/* Repeated Punch-In / Punch-Out Button */}
            {!isCurrentlyPunchedIn ? (
              <button
                onClick={() => handlePunch('in')}
                disabled={actionLoading}
                className={`relative group w-44 h-44 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-2xl transition-all ${
                  actionLoading
                    ? 'bg-emerald-600 scale-95'
                    : 'bg-emerald-500 active:scale-95 active:bg-emerald-600 shadow-emerald-500/25'
                }`}
              >
                <div className="absolute inset-0 rounded-full border-[6px] border-emerald-400/30"></div>
                {sessions.length > 0 ? (
                  <RotateCcw size={30} className={`text-white ${actionLoading ? 'animate-spin' : ''}`} />
                ) : (
                  <Navigation size={30} className={`text-white ${actionLoading ? 'animate-spin' : ''}`} />
                )}
                <span className="text-white font-extrabold text-base tracking-wide">
                  {actionLoading
                    ? 'Verifying...'
                    : sessions.length > 0
                    ? 'RE-PUNCH IN'
                    : 'PUNCH IN'}
                </span>
                <span className="text-emerald-100 text-[11px] font-semibold">
                  {sessions.length > 0 ? `Start Session #${sessions.length + 1}` : 'Inside 480 sq.ft Office'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => handlePunch('out')}
                disabled={actionLoading}
                className={`relative group w-44 h-44 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-2xl transition-all ${
                  actionLoading
                    ? 'bg-rose-600 scale-95'
                    : 'bg-rose-500 active:scale-95 active:bg-rose-600 shadow-rose-500/25'
                }`}
              >
                <div className="absolute inset-0 rounded-full border-[6px] border-rose-400/30"></div>
                <UserCheck size={30} className="text-white" />
                <span className="text-white font-extrabold text-base tracking-wide">
                  {actionLoading ? 'Locating...' : 'PUNCH OUT'}
                </span>
                <span className="text-rose-100 text-[11px] font-semibold">
                  Session #{sessions.length} • {formatDurationMinutes(liveSessionMinutes)}
                </span>
              </button>
            )}

            {infoMessage && (
              <div className="w-full mt-4 bg-sky-500/15 border border-sky-500/40 rounded-xl px-3.5 py-2.5 text-xs text-sky-200 font-medium text-center">
                {infoMessage}
              </div>
            )}

            {error && (
              <div className="w-full mt-4 bg-rose-500/15 border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-xs text-rose-300 font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Today's Inside-Office Sessions Log */}
            <div className="w-full mt-6 bg-slate-700/40 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-700/70 border-b border-slate-600/70 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Today's Office Time Log ({sessions.length})
                </span>
                <span className="text-xs font-extrabold text-emerald-400">
                  Total: {formatDurationMinutes(combinedTotalMinutes)}
                </span>
              </div>
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-5">
                  No office sessions recorded today yet. Punch In when inside the 480 sq.ft office.
                </p>
              ) : (
                <div className="divide-y divide-slate-700/70 max-h-56 overflow-y-auto">
                  {sessions.map((s: any, idx: number) => {
                    const isOpen = !s.punchOutTime;
                    const dur = isOpen ? liveSessionMinutes : (s.durationMinutes || 0);
                    return (
                      <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sky-400">#{s.sessionNo || idx + 1}</span>
                            <span className="text-white font-semibold">
                              {s.punchInTime} → {s.punchOutTime || 'Inside Office'}
                            </span>
                          </div>
                          {s.outType && (
                            <span className={`inline-block mt-0.5 text-[10px] font-semibold ${
                              String(s.outType).includes('Auto') ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              {s.outType}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isOpen
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : 'bg-slate-600/80 text-slate-200'
                        }`}>
                          {isOpen ? `Active • ${formatDurationMinutes(dur)}` : formatDurationMinutes(dur)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════════
             STANDARD FIELD USER SINGLE-PUNCH ATTENDANCE VIEW (Untouched)
             ═══════════════════════════════════════════════════════════════════════ */
          <div className="flex flex-col items-center w-full max-w-sm mt-4">
            {/* Status Card */}
            <div className="w-full bg-slate-700/50 rounded-2xl p-4 border border-slate-700 mb-8 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-200 font-semibold uppercase">Punch In</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={14} className="text-emerald-400" />
                  <p className="text-sm text-white font-medium">{att?.punchInTime || '--:--'}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-600"></div>
              <div className="text-right">
                <p className="text-xs text-slate-200 font-semibold uppercase">Punch Out</p>
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
              <div className="w-48 h-48 rounded-full bg-slate-700 border-[6px] border-slate-700 flex flex-col items-center justify-center gap-2">
                <UserCheck size={32} className="text-slate-500" />
                <span className="text-slate-200 font-bold text-lg tracking-wide">COMPLETED</span>
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
