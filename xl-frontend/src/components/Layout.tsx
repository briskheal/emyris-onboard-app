import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Layers, Wrench, FileText, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import DCRModal from './DCRModal';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/extras', icon: FileText, label: 'Extras' },
  { path: '/creation', icon: Layers, label: 'Creation' },
  { path: '/utilities', icon: Wrench, label: 'Utilities' },
];



export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDCR, setShowDCR] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('xl_user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  // Check lockout status on mount and on route change
  useEffect(() => {
    // If we are already on the performance page, don't show the overlay (let them do the planning)
    if (location.pathname.includes('/extras/performance')) {
      setIsLocked(false);
      return;
    }

    if (!user) return;
    axios.get(`/api/xl/performance/status?email=${user.email}`)
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

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-dvh bg-slate-900 overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* GLOBAL LOCKOUT OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Access Locked</h2>
          <p className="text-slate-400 mb-8 max-w-[280px]">
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

      {/* DCR Modal (full-screen overlay) */}
      {showDCR && <DCRModal onClose={() => setShowDCR(false)} />}

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/60"
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

          {/* Centre FAB — Call Report (DCR) */}
          <div className="flex-1 flex items-center justify-center relative">
            <button
              onClick={() => setShowDCR(true)}
              className="absolute -top-5 w-14 h-14 rounded-full bg-sky-500 shadow-lg shadow-sky-500/30 flex flex-col items-center justify-center active:bg-sky-600 transition-all"
            >
              <PlusCircle size={26} strokeWidth={1.8} className="text-white" />
            </button>
            <span className="mt-7 text-[10px] font-medium text-slate-500">Report</span>
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
