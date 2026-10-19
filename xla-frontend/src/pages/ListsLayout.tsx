import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ListsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('xla_lists_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('xla_lists_sidebar_collapsed', next.toString());
      return next;
    });
  };

  const menuItems = [
    { label: 'Doctors List', path: '/utilities/lists/doctors' },
    { label: 'Chemists List', path: '/utilities/lists/chemists' },
    { label: 'Stockists List', path: '/utilities/lists/stockists' },
    { label: 'Call Plan Lists', path: '/utilities/lists/call-plans' },
    { label: 'HQ / City / Local Area', path: '/utilities/lists/locations' },
    { label: 'Geo Fencing', path: '/utilities/lists/geo-fencing' },
    { label: 'Product List', path: '/utilities/lists/products' },
    { label: 'Gift List', path: '/utilities/lists/gifts' },
    { label: 'Route List', path: '/utilities/lists/routes' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans relative">
      {/* Sidebar */}
      {!isCollapsed ? (
        <div className="w-64 bg-slate-800/80 border-r border-slate-700/50 hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto transition-all duration-200">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <button 
              onClick={() => navigate('/utilities')}
              className="flex items-center gap-2 text-sky-400 font-bold hover:text-sky-300 transition-colors tracking-wide text-xs"
            >
              <ChevronLeft size={18} /> Back to Utilities
            </button>
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Collapse Lists menu to expand table width"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="p-4">
            <h2 className="text-white font-bold text-base tracking-wide mb-4 px-2" style={{ fontSize: 'var(--menu-heading-size, 16px)' }}>Lists</h2>
            <div className="flex flex-col gap-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={`text-left px-4 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-colors ${
                    location.pathname === item.path 
                      ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen bg-slate-800/80 border-r border-slate-700/50 p-2 items-center z-10">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-xl bg-slate-700/70 hover:bg-sky-600 text-slate-300 hover:text-white transition-colors shadow-md mt-2"
            title="Expand Lists menu"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-[#1e1e2d]">
        <Outlet />
      </div>
    </div>
  );
}
