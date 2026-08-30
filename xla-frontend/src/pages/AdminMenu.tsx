import { useOutletContext, useNavigate } from 'react-router-dom';
import { Menu, MessageSquare, Bell, Building2, Users, ClipboardList, FileBarChart, DollarSign, Stethoscope, Gift, CheckSquare, CalendarDays, Settings as SettingsIcon } from 'lucide-react';

export default function AdminMenu() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();
  
  const navigate = useNavigate();

  const adminItems = [
    { label: 'MANAGE LOCATIONS', icon: Building2, path: '/admin/locations' },
    { label: 'MANAGE USERS', icon: Users, path: '/admin/users' },
    { label: 'MANAGE PRODUCTS', icon: ClipboardList, path: '/admin/products' },
    { label: 'USER PERFORMANCE ANALYSIS', icon: FileBarChart },
    { label: 'ALLOWANCES', icon: DollarSign, path: '/admin/expenses' },
    { label: 'DOCTORS, STOCKISTS & CHEMISTS', icon: Stethoscope, path: '/admin/dcs' },
    { label: 'SAMPLES & GIFTS', icon: Gift },
    { label: 'APPROVALS', icon: CheckSquare, path: '/admin/approvals' },
    { label: 'MANAGE LEAVE', icon: CalendarDays },
    { label: 'SETTINGS', icon: SettingsIcon, path: '/extras/settings' }
  ];

  return (
    <div className="min-h-full bg-slate-900 flex flex-col font-sans pb-24 text-slate-100">
      
      {/* Sticky Header (Mobile Only) */}
      <div className="md:hidden flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={openDrawer} className="text-white active:scale-95 transition-transform">
            <Menu size={26} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sky-400 relative">
            <MessageSquare size={22} />
          </button>
          <button className="text-emerald-400 relative">
            <Bell size={22} />
          </button>
        </div>
      </div>

      <div className="px-5 mt-6 md:p-8">
        
        {/* Desktop Banner */}
        <div className="hidden md:block bg-slate-800 border-l-4 border-emerald-500 rounded-r-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Welcome to the Admin Panel</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
            Admins sometime refuse editing, deleting or making some changes in the software. You can always reach out to us in case anything goes wrong. Anything that you edit or modify can be rolled back to the previous version.
          </p>
        </div>

        {/* Mobile Title */}
        <h2 className="md:hidden text-xl font-black text-white mb-6 uppercase tracking-wide">Admin Panel</h2>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
          {adminItems.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => item.path && navigate(item.path)}
              className="group bg-slate-800/80 border border-slate-700/80 hover:border-sky-500/50 rounded-3xl md:rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-5 relative shadow-lg hover:bg-slate-800 transition-all active:scale-95 min-h-[140px] md:min-h-[200px]"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-700/50 group-hover:bg-sky-500/10 flex items-center justify-center transition-colors">
                <item.icon size={32} strokeWidth={1.5} className="text-white group-hover:text-sky-400 transition-colors" />
              </div>
              <div className="text-center w-full px-2">
                <h3 className="font-bold text-white text-xs leading-tight tracking-wide">{item.label}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
