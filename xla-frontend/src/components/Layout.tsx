import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Calendar, FileText, Shield, FileCog } from 'lucide-react';
import NavigationDrawer from './NavigationDrawer';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/extras', icon: Calendar, label: 'Extras' },
    { path: '/report', icon: FileText, label: 'Call Report', isCenter: true },
    { path: '/admin', icon: Shield, label: 'Admin' },
    { path: '/utilities', icon: FileCog, label: 'Utilities' },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden text-slate-100 font-sans relative">
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet context={{ openDrawer: () => setIsDrawerOpen(true) }} />
      </div>

      {/* Bottom Navigation */}
      <div className="h-20 bg-slate-800 fixed bottom-0 w-full flex justify-between items-center px-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          
          if (item.isCenter) {
            return (
              <div key={item.path} className="relative -top-6 flex flex-col items-center">
                <button 
                  onClick={() => navigate(item.path)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-sky-500 shadow-sky-500/40' : 'bg-slate-700 text-slate-300'}`}
                >
                  <item.icon size={28} className={isActive ? 'text-white' : 'text-slate-300'} />
                </button>
              </div>
            );
          }

          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-sky-500/20' : 'bg-transparent'}`} />
                <item.icon size={24} className={isActive ? 'text-sky-400' : 'text-slate-500'} />
              
              <span className={`text-[10px] font-bold ${isActive ? 'text-sky-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
