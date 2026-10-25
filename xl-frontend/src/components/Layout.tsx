import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {  LayoutDashboard, PlusCircle, FileText, Layers, Wrench, Menu, Bell, AlertTriangle , ChevronLeft, Trash2 } from 'lucide-react';
import axios from 'axios';
import NavigationDrawer from './NavigationDrawer';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/extras', icon: FileText, label: 'Extras' },
  { path: '/creation', icon: Layers, label: 'Creation' },
  { path: '/utilities', icon: Wrench, label: 'Utilities' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const fetchAnnouncement = () => {
      axios.get('/api/xl/admin/announcement')
        .then(res => {
          if (res.data?.success && res.data?.data) {
            setAnnouncement(res.data.data.message || '');
          } else {
            setAnnouncement('');
          }
        })
        .catch(e => console.error('Failed to fetch announcement:', e));
    };
    fetchAnnouncement();
    const interval = setInterval(fetchAnnouncement, 30000);
    return () => clearInterval(interval);
  }, []);

  const [logoUrl, setLogoUrl] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  // Office Wi-Fi / 480 sq.ft Arrival Prompt State (Exclusively for PUNCHING-enabled Office Staff)
  const [officeArrivalPrompt, setOfficeArrivalPrompt] = useState<{
    show: boolean;
    isRePunch: boolean;
    officeName: string;
    sessionCount: number;
  }>({ show: false, isRePunch: false, officeName: 'Office', sessionCount: 0 });
  const [officePromptPunching, setOfficePromptPunching] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('xl_user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }

    axios.get('/api/company-profile')
      .then(res => {
        if (res.data) {
          if (res.data.logo && res.data.logo.length > 0 && res.data.logo[0].data) {
            setLogoUrl(res.data.logo[0].data);
          } else if (res.data.logoUrl) {
            setLogoUrl(res.data.logoUrl);
          }
        }
      })
      .catch(err => console.error("Failed to load company profile", err));
  }, [navigate]);

  useEffect(() => {
    if (user?.uid) {
        axios.get('/api/xl/notifications?email=' + user.employeeId).then(r => setNotifications(r.data.data || [])).catch(e => console.error(e));
    }
  }, [user]);

  
  const clearNotifications = async () => {
      await axios.post('/api/xl/notifications/clear', { email: user?.employeeId });
      setNotifications([]);
  };

  const formatNotifDate = (dateString: string) => {
      const d = new Date(dateString);
      const today = new Date();
      const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      const datePart = isToday ? 'Today' : d.toLocaleDateString();
      const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
      return { datePart, timePart };
  };

  const handleBack = () => {
      if (showNotifMenu) {
          setShowNotifMenu(false);
          return;
      }
      navigate('/dashboard');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const handleOpenNotifs = async () => {
      setShowNotifMenu(!showNotifMenu);
      if (!showNotifMenu && unreadCount > 0) {
          await axios.post('/api/xl/notifications/read', { email: user?.employeeId });
          setNotifications(notifications.map(n => ({...n, isRead: true})));
      }
  };

  // Check lockout status on mount and on route change
  useEffect(() => {
    if (location.pathname.includes('/extras/performance')) {
      setIsLocked(false);
      return;
    }

    if (!user) return;
    axios.get(`/api/xl/performance/status?email=${user.employeeId}`)
      .then(res => {
        if (res.data.locked) {
          setIsLocked(true);
          setLockMessage(res.data.message);
        } else {
          setIsLocked(false);
        }
      })
      .catch(err => console.error("Failed to check lockout status", err));
  }, [location.pathname, user]);

  // Background Office Geo-Location Presence Watcher (ONLY runs for users with PUNCHING enabled in User Controls)
  useEffect(() => {
    if (!user) return;
    const empId = user.employeeId || user.email || user.uid;
    if (!empId) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let strikeCount = 0;

    const getResilientPosition = (): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation unsupported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => {
            // Fallback to network/indoor location if hardware GPS satellite fix times out indoors/on desktop
            navigator.geolocation.getCurrentPosition(
              (pos2) => resolve(pos2),
              (err2) => reject(err2),
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
          },
          { enableHighAccuracy: true, timeout: 4500, maximumAge: 15000 }
        );
      });

    const getHaversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371000;
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const checkOfficePresence = async () => {
      try {
        const hb = await axios.post('/api/xl/attendance/office-heartbeat', {
          employeeId: empId,
          date: todayStr
        });
        if (!hb.data?.officePunchConfig?.enabled) {
          strikeCount = 0;
          setOfficeArrivalPrompt((prev) => (prev.show ? { ...prev, show: false } : prev));
          return;
        }

        const cfg = hb.data.officePunchConfig;
        const isPunchedIn = Boolean(hb.data.isCurrentlyPunchedIn);
        const sessionCount = Number(hb.data.sessionCount) || 0;

        // CASE A: User is NOT Punched In -> Check if user's live location matches Admin-linked Office Geo-Location
        if (!isPunchedIn) {
          strikeCount = 0;

          if (cfg.officeLat !== null && cfg.officeLng !== null && navigator.geolocation) {
            try {
              const pos = await getResilientPosition();
              const rawDist = getHaversineMeters(
                pos.coords.latitude,
                pos.coords.longitude,
                Number(cfg.officeLat),
                Number(cfg.officeLng)
              );
              const indoorAccuracyOverlap = Math.min(Math.max(0, Number(pos.coords.accuracy) || 0), 300);
              const effectiveDist = Math.max(0, Math.round(rawDist - indoorAccuracyOverlap));
              const allowedRadius = Math.max(Number(cfg.officeRadius) || 50, 50);

              if (effectiveDist <= allowedRadius) {
                setOfficeArrivalPrompt({
                  show: true,
                  isRePunch: sessionCount > 0,
                  officeName: cfg.officeName || 'Corporate Office',
                  sessionCount
                });
              } else {
                setOfficeArrivalPrompt((prev) => (prev.show ? { ...prev, show: false } : prev));
              }
            } catch {
              // If browser blocked GPS or still locating, keep current state
            }
          } else {
            // Admin enabled PUNCHING without specific coordinates -> prompt immediately
            setOfficeArrivalPrompt({
              show: true,
              isRePunch: sessionCount > 0,
              officeName: cfg.officeName || 'Corporate Office',
              sessionCount
            });
          }
          return;
        }

        // CASE B: User IS Punched In -> hide arrival prompt & watch for leaving the Admin-linked Office Geo-Location
        setOfficeArrivalPrompt((prev) => (prev.show ? { ...prev, show: false } : prev));
        if (location.pathname.includes('/extras/attendance')) return;

        if (cfg.officeLat !== null && cfg.officeLng !== null && navigator.geolocation) {
          try {
            const pos = await getResilientPosition();
            const rawDist = getHaversineMeters(
              pos.coords.latitude,
              pos.coords.longitude,
              Number(cfg.officeLat),
              Number(cfg.officeLng)
            );
            const indoorAccuracyOverlap = Math.min(Math.max(0, Number(pos.coords.accuracy) || 0), 150);
            const effectiveDist = Math.max(0, Math.round(rawDist - indoorAccuracyOverlap));
            const allowedRadius = Math.max(Number(cfg.officeRadius) || 50, 50);

            if (effectiveDist > allowedRadius) {
              strikeCount += 1;
              if (strikeCount >= 3) {
                strikeCount = 0;
                await axios.post('/api/xl/attendance/punch-out', {
                  employeeId: empId,
                  date: todayStr,
                  punchOutTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  punchOutLat: pos.coords.latitude,
                  punchOutLng: pos.coords.longitude,
                  autoPunchOut: true,
                  autoReason: `Auto (Left ${cfg.officeName || 'Office'} Geo-Location)`
                });
              }
            } else {
              strikeCount = 0;
            }
          } catch {}
        }
      } catch {}
    };

    checkOfficePresence();
    const timer = setInterval(checkOfficePresence, 15000);
    return () => clearInterval(timer);
  }, [user, location.pathname]);

  const handleQuickOfficePunchIn = () => {
    if (!user) return;
    const empId = user.employeeId || user.email || user.uid;
    const todayStr = new Date().toISOString().split('T')[0];
    setOfficePromptPunching(true);

    const submitPunch = async (lat: number | null, lng: number | null, acc: number | null) => {
      try {
        await axios.post('/api/xl/attendance/punch-in', {
          employeeId: empId,
          date: todayStr,
          punchInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          punchInLat: lat,
          punchInLng: lng,
          gpsAccuracy: acc
        });
        setOfficeArrivalPrompt((prev) => ({ ...prev, show: false }));
        if (location.pathname.includes('/extras/attendance')) {
          window.location.reload();
        } else {
          navigate('/extras/attendance');
        }
      } catch {
        setOfficeArrivalPrompt((prev) => ({ ...prev, show: false }));
        navigate('/extras/attendance');
      } finally {
        setOfficePromptPunching(false);
      }
    };

    if (!navigator.geolocation) {
      submitPunch(null, null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => submitPunch(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos2) => submitPunch(pos2.coords.latitude, pos2.coords.longitude, pos2.coords.accuracy),
          () => submitPunch(null, null, null),
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 15000 }
    );
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-dvh bg-slate-800 overflow-hidden relative w-full max-w-md mx-auto sm:shadow-2xl sm:border-x sm:border-slate-700/50" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* TOP NAVIGATION BAR */}
      <header className="h-14 bg-slate-800 border-b border-slate-800 flex items-center justify-between px-4 z-40 relative">
        <div className="flex items-center gap-2">
            {(location.pathname !== '/dashboard' || showNotifMenu) && (
              <button onClick={handleBack} className="text-slate-300 active:scale-95 p-1 bg-slate-700/50 rounded-md mr-1">
                <ChevronLeft size={20} />
              </button>
            )}
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center text-white font-black text-sm">EM</div>
          )}
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-white leading-tight">EMYRIS</span>
            <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase leading-tight">Biolifesciences</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={handleOpenNotifs} className="relative text-slate-200 focus:outline-none">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center bg-rose-500 text-white border-2 border-slate-900 rounded-full">{unreadCount}</span>}
            </button>
            
          </div>
          <button onClick={() => setIsDrawerOpen(true)} className="text-slate-300">
            <Menu size={24} />
          </button>
        </div>
      </header>
      
      {/* Global Scrolling Announcement Ticker */}
      {announcement && !showNotifMenu && (
        <div className="bg-sky-500/20 border-b border-sky-400/30 overflow-hidden py-1.5 px-3 flex items-center shadow-sm z-30 shrink-0">
          <marquee className="text-sky-200 text-xs font-semibold tracking-wide" scrollamount="5">
            📢 {announcement}
          </marquee>
        </div>
      )}
      
      {/* Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} user={user} />

      {/* OFFICE WI-FI / 480 SQ.FT ARRIVAL AUTO PUNCH-IN PROMPT MODAL */}
      {officeArrivalPrompt.show && !isLocked && (
        <div className="absolute inset-0 z-[9990] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-xs bg-slate-800 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-400/40 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5">
              {officeArrivalPrompt.officeName}
            </p>
            <h2 className="text-lg font-extrabold text-white leading-snug mb-6">
              {officeArrivalPrompt.isRePunch
                ? 'Welcome Back. Tap to Re-Punch In'
                : 'You are in Office. Please Punch In to Start.'}
            </h2>
            <button
              onClick={handleQuickOfficePunchIn}
              disabled={officePromptPunching}
              className="w-full h-13 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm tracking-wide rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-60"
            >
              {officePromptPunching
                ? 'PUNCHING IN...'
                : officeArrivalPrompt.isRePunch
                ? 'TAP TO RE-PUNCH IN'
                : 'PUNCH IN TO START'}
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL LOCKOUT OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-[9999] bg-slate-800/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Access Locked</h2>
          <p className="text-slate-200 mb-8 max-w-[280px]">
            {lockMessage || "You must submit your Monthly Planning to unlock the dashboard."}
          </p>
          <button
            onClick={() => {
              setIsLocked(false);
              navigate('/extras/performance');
            }}
            className="w-full max-w-[280px] h-14 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/30 active:scale-95 transition-transform"
          >
            Go to Performance Analysis
          </button>
        </div>
      )}

            {/* Main content area */}
      {showNotifMenu ? (
        <div className="absolute top-14 left-0 right-0 bottom-0 bg-[#212236] z-50 overflow-y-auto flex flex-col pb-16">
          <h2 className="text-center text-sky-400 font-bold text-2xl py-3 shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-[#212236] z-10 border-b border-sky-400/50">
            Notifications
          </h2>
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700">
            <span className="text-emerald-400 font-bold text-[13px]">Notifications: {notifications.length}</span>
            <button onClick={clearNotifications} className="text-slate-300 font-semibold text-[13px] flex items-center gap-1 active:scale-95">
              Clear notifications <Trash2 size={16} />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-3 pb-24">
            {notifications.length === 0 ? (
              <div className="text-center text-slate-500 mt-10 text-sm">No new notifications</div>
            ) : (
              notifications.map((n:any) => {
                const { datePart, timePart } = formatNotifDate(n.createdAt);
                return (
                  <div key={n._id} className="bg-[#292a40] rounded-xl p-3 flex gap-3 shadow-md border border-slate-700/50">
                    <Bell className="text-emerald-400 mt-1 shrink-0" size={24} fill="currentColor" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-[13px] leading-tight">{n.title}</h3>
                      <p className="text-slate-300 text-xs mt-1 leading-tight">{n.message}</p>
                    </div>
                    <div className="flex flex-col items-end justify-start shrink-0 gap-1">
                      <span className="text-sky-400 text-xs font-semibold">{datePart}</span>
                      <span className="text-sky-400 text-[11px] font-medium">{timePart}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 w-full max-w-md mx-auto left-1/2 -translate-x-1/2 z-50 bg-slate-800 border-t border-slate-700/60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16 relative">
          {/* Left two items */}
          {navItems.slice(0, 2).map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150
                  ${active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
                <span className={`text-[10px] font-medium ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                  {label}
                </span>
                {active && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
              </button>
            );
          })}

          {/* Centre FAB */}
          <div className="flex-1 flex items-center justify-center relative">
            <button
              onClick={() => navigate('/report')}
              className={`absolute -top-4 w-12 h-12 rounded-full shadow-lg flex flex-col items-center justify-center active:scale-95 transition-all ${isActive('/report') ? 'bg-sky-600 shadow-sky-600/40' : 'bg-sky-500 shadow-sky-500/30'}`}
            >
              <PlusCircle size={22} strokeWidth={2} className="text-white" />
            </button>
            <span className={`mt-7 text-[10px] font-medium ${isActive('/report') ? 'text-sky-400' : 'text-slate-500'}`}>Report</span>
          </div>

          {/* Right two items */}
          {navItems.slice(2).map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150
                  ${active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
                <span className={`text-[10px] font-medium ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                  {label}
                </span>
                {active && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
