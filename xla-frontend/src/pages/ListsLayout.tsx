import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function ListsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'DOCTORS LIST', path: '/utilities/lists/doctors' },
    { label: 'CHEMISTS LIST', path: '/utilities/lists/chemists' },
    { label: 'STOCKISTS LIST', path: '/utilities/lists/stockists' },
    { label: 'HQ / CITY / LOCAL AREA', path: '/utilities/lists/locations' },
    { label: 'GEO FENCING', path: '/utilities/lists/geo-fencing' },
    { label: 'PRODUCT LIST', path: '/utilities/lists/products' },
    { label: 'GIFT LIST', path: '/utilities/lists/gifts' },
    { label: 'ROUTE LIST', path: '/utilities/lists/routes' },
  ];

  return (
    <div className="min-h-full bg-slate-900 flex text-slate-100 font-sans h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800/80 border-r border-slate-700/50 hidden md:flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-700/50">
          <button 
            onClick={() => navigate('/utilities')}
            className="flex items-center gap-2 text-sky-400 font-bold hover:text-sky-300 transition-colors uppercase tracking-widest text-sm"
          >
            <ChevronLeft size={18} /> BACK TO UTILITIES
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">LISTS</h2>
          <div className="flex flex-col gap-1">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white border border-transparent'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar Trigger (Optional, for now just show content) */}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#1e1e2d]">
        <Outlet />
      </div>
    </div>
  );
}
