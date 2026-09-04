import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon, Wrench, Menu, CalendarDays, Receipt, MonitorPlay, Target, BarChart3, Clock, Bell, ClipboardList, Gift, PieChart, Users, History, CheckSquare } from 'lucide-react';
import NavigationDrawer from './NavigationDrawer';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin', icon: SettingsIcon, label: 'Admin Panel' },
  // { path: '/extras/tour-program', icon: MapPin, label: 'Tour Program' },
  { path: '/extras/call-plan', icon: CalendarDays, label: 'Call Planning' },
  { path: '/extras/expense', icon: Receipt, label: 'Expenses' },
  { path: '/extras/e-detailing', icon: MonitorPlay, label: 'E-Detailing' },
  { path: '/extras/primary-sales', icon: Target, label: 'Primary Sales' },
  { path: '/extras/secondary', icon: BarChart3, label: 'Secondary Sales' },
  { path: '/utilities', icon: ClipboardList, label: 'Reports' },
  { path: '/extras/attendance', icon: Clock, label: 'Attendance' },
  { path: '/extras/reminders', icon: Bell, label: 'Reminders' },
  { path: '/extras/leave', icon: CheckSquare, label: 'Leave Request' },
  { path: '/extras/samples', icon: Gift, label: 'Sample Management' },
  { path: '/extras/gifts', icon: Gift, label: 'Gift Management' },
  { path: '/extras/profit', icon: PieChart, label: 'Profit Analysis' },
  { path: '/extras/crm', icon: Users, label: 'CRM' },
  { path: '/extras/backlog', icon: History, label: 'Backlog Report' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-dvh bg-slate-900 overflow-hidden font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item, idx) => {
            const active = isActive(item.path);
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active ? 'bg-sky-500/10 text-sky-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-semibold'
                }`}
              >
                <item.icon size={20} className={active ? 'text-sky-400' : 'text-slate-500'} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 relative overflow-hidden">
        {/* Navigation Drawer (Mobile Only) */}
        <div className="md:hidden">
          <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </div>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <Outlet context={{ openDrawer: () => setIsDrawerOpen(true) }} />
        </main>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/60"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-stretch h-16 relative">
            {/* Left two items */}
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/dashboard') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutDashboard size={22} strokeWidth={isActive('/dashboard') ? 2.2 : 1.7} />
              <span className={`text-[10px] font-medium ${isActive('/dashboard') ? 'text-sky-400' : 'text-slate-500'}`}>Dashboard</span>
              {isActive('/dashboard') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
            </button>
            <button
              onClick={() => navigate('/extras')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/extras') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Menu size={22} strokeWidth={isActive('/extras') ? 2.2 : 1.7} />
              <span className={`text-[10px] font-medium ${isActive('/extras') ? 'text-sky-400' : 'text-slate-500'}`}>Extras</span>
              {isActive('/extras') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
            </button>

            {/* Centre FAB */}
            <div className="flex-1 flex items-center justify-center relative">
              <button
                onClick={() => navigate('/report')}
                className="absolute -top-5 w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center active:bg-emerald-600 transition-all"
              >
                <PlusCircle size={26} strokeWidth={1.8} className="text-white" />
              </button>
              <span className="mt-7 text-[10px] font-medium text-slate-500">Report</span>
            </div>

            {/* Right two items */}
            <button
              onClick={() => navigate('/admin')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/admin') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <SettingsIcon size={22} strokeWidth={isActive('/admin') ? 2.2 : 1.7} />
              <span className={`text-[10px] font-medium ${isActive('/admin') ? 'text-sky-400' : 'text-slate-500'}`}>Admin</span>
              {isActive('/admin') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
            </button>
            <button
              onClick={() => navigate('/utilities')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/utilities') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Wrench size={22} strokeWidth={isActive('/utilities') ? 2.2 : 1.7} />
              <span className={`text-[10px] font-medium ${isActive('/utilities') ? 'text-sky-400' : 'text-slate-500'}`}>Utilities</span>
              {isActive('/utilities') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
