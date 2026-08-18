import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusSquare, FileText, Settings, Wrench } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/extras', icon: FileText, label: 'Extras' },
  { path: '/creation', icon: PlusSquare, label: 'Create' },
  { path: '/utilities', icon: Wrench, label: 'Utilities' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-dvh bg-slate-900 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Main content area - scrollable */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/60"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150
                  ${active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.7}
                  className={active ? 'text-sky-400' : ''}
                />
                <span className={`text-[10px] ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
