import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, Settings as SettingsIcon, Wrench, Menu, Receipt, 
  MonitorPlay, Target, BarChart3, Clock, Bell, ClipboardList, Gift, PieChart, 
  Users, History, CheckSquare, LogOut, Sun, Moon, Search, MessageSquare, Sliders,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import NavigationDrawer from './NavigationDrawer';
import TypographySettingsModal from './TypographySettingsModal';
import axios from 'axios';
import { GLOBAL_ROUTES } from '../config/navigation';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin', icon: SettingsIcon, label: 'Admin Panel' },
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('xla_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('xla_sidebar_collapsed', next.toString());
      return next;
    });
  };
  const [logoUrl, setLogoUrl] = useState('');

  // Global Header States
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Typography Management
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);

  // Theme Management
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('xla_theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('xla_theme', isLightMode ? 'light' : 'dark');
    if (isLightMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [isLightMode]);

  useEffect(() => {
    if (!sessionStorage.getItem('xla_token')) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await axios.get('/api/company-profile');
        if (res.data) {
          if (res.data.logo && res.data.logo.length > 0 && res.data.logo[0].data) {
            setLogoUrl(res.data.logo[0].data);
          } else if (res.data.logoUrl) {
            setLogoUrl(res.data.logoUrl);
          }
        }
      } catch (e) {
        console.error("Failed to load company profile", e);
      }
    };
    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    axios.get('/api/xl/admin/notifications').then(res => {
      if (res.data.success) {
        const clearedAtStr = localStorage.getItem('xla_notifs_cleared');
        const clearedAt = clearedAtStr ? parseInt(clearedAtStr) : 0;
        const validNotifs = (res.data.data || []).filter((n: any) => {
          const t = new Date(n.date).getTime();
          return !isNaN(t) ? t > clearedAt : true;
        });
        setNotifications(validNotifs);
      }
    }).catch(e => console.error(e));
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    localStorage.setItem('xla_notifs_cleared', Date.now().toString());
    try {
      await axios.post('/api/xl/admin/notifications/clear');
    } catch(e) {
      console.error('Failed to clear notifications in database', e);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return alert('Message cannot be empty');
    try {
      const res = await axios.post('/api/xl/admin/announcement', { 
        message: broadcastMessage, 
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined, 
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined 
      });
      if (res.data.success) {
        alert('Broadcast message updated successfully!');
        setIsBroadcastModalOpen(false);
        setBroadcastMessage('');
      } else {
        alert('Failed to broadcast');
      }
    } catch(e: any) {
      alert('Error: ' + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
  };

  const userStr = sessionStorage.getItem('xla_user') || localStorage.getItem('xla_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || user?.firstName || user?.businessName || user?.username || 'Rishita';

  const filteredGlobalRoutes = GLOBAL_ROUTES.filter(r => 
    r.title.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
    r.breadcrumb.toLowerCase().includes(globalSearchTerm.toLowerCase())
  );

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-[#1a1a2e] overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* TOP HEADER - SPANS FULL WIDTH ABOVE ALL MENUS & SUBMENUS */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#1e1e30] border-b border-slate-200 dark:border-[#3b3b5a] shadow-md z-30 flex-shrink-0">
        
        {/* Left: Brand Logo & Hamburger Collapse Trigger */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)} 
            className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white md:hidden active:scale-95 transition-transform p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Open Navigation"
          >
            <Menu size={22} />
          </button>

          <div 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 object-contain" />
            ) : (
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">EMYRIS</h1>
                <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8b8baf]" size={17} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={globalSearchTerm}
            onChange={(e) => {
              setGlobalSearchTerm(e.target.value);
              setGlobalSearchOpen(true);
            }}
            onFocus={() => {
              if (globalSearchTerm) setGlobalSearchOpen(true);
            }}
            onBlur={() => setTimeout(() => setGlobalSearchOpen(false), 200)}
            className="w-full bg-slate-100 dark:bg-[#27273f] border border-slate-200 dark:border-[#3b3b5a]/60 rounded-full py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-[#8b8baf]"
          />
          
          {globalSearchOpen && globalSearchTerm && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-[#151521] border border-slate-200 dark:border-[#2d2d44] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[320px] overflow-y-auto">
              {filteredGlobalRoutes.length > 0 ? (
                filteredGlobalRoutes.map((route, idx) => (
                  <div 
                    key={idx}
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      setGlobalSearchOpen(false); 
                      setGlobalSearchTerm(''); 
                      navigate(route.path); 
                    }}
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1e1e2d] cursor-pointer flex flex-col border-b border-slate-100 dark:border-[#2d2d44] last:border-0 group"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-400 transition-colors">
                      {route.title}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                      {route.breadcrumb}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-400 text-center">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Theme Toggle, Broadcast, Notifications, User Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle with Tooltip */}
          <button 
            onClick={() => setIsLightMode(!isLightMode)} 
            className="text-slate-500 dark:text-[#8b8baf] hover:text-amber-500 dark:hover:text-amber-400 transition-colors relative flex items-center gap-1 group p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" 
            title="Toggle Theme"
          >
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
            <span className="text-[10px] absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white px-2 py-1 rounded shadow-lg pointer-events-none z-50">
              Change Theme
            </span>
          </button>

          {/* Typography Settings with Tooltip */}
          <button 
            onClick={() => setIsTypographyModalOpen(true)} 
            className="text-slate-500 dark:text-[#8b8baf] hover:text-indigo-400 transition-colors relative flex items-center gap-1 group p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" 
            title="Font & Size Settings"
          >
            <Sliders size={20} />
            <span className="text-[10px] absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white px-2 py-1 rounded shadow-lg pointer-events-none z-50">
              Font & Size
            </span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-[#3b3b5a] hidden sm:block"></div>

          {/* Broadcast Announcement Button */}
          <button 
            onClick={() => setIsBroadcastModalOpen(true)} 
            className="text-slate-500 dark:text-[#8b8baf] hover:text-sky-400 transition-colors relative hidden sm:block p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" 
            title="Broadcast Scroll Message"
          >
            <MessageSquare size={20} />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)} 
              className="text-slate-500 dark:text-[#8b8baf] hover:text-emerald-400 transition-colors relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" 
              title="View Recent Activity"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a] rounded-xl shadow-2xl p-2 z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-[#3b3b5a]">
                  <h4 className="text-slate-900 dark:text-white font-bold text-xs">Recent Activity</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearNotifications} 
                      className="text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No recent activity</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg border-b border-slate-100 dark:border-[#3b3b5a]/40 last:border-0 cursor-pointer text-left">
                        <div className="text-xs font-bold text-sky-400">{n.type}</div>
                        <div className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(n.date).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Name */}
          <div className="flex items-center gap-2.5 sm:pl-3 sm:border-l border-slate-200 dark:border-[#3b3b5a]">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-400/50 dark:border-slate-600 shadow-sm">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff&bold=true`} 
                alt={userName} 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:block">
              {userName}
            </span>
          </div>
        </div>
      </header>

      {/* BODY (BELOW TOP HEADER): MENUS & CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* DESKTOP SIDEBAR - RUNS UNDER THE HEADER */}
        <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-16' : 'w-60'} bg-white dark:bg-[#1a1a2e] border-r border-slate-200 dark:border-slate-800 flex-shrink-0 transition-all duration-300 ease-in-out relative z-20`}>
          
          {/* Coolify-Style Seam Collapse/Expand Toggle Button */}
          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-5 w-6 h-6 bg-white dark:bg-[#1e1e30] border border-slate-300 dark:border-[#3b3b5a] rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-white hover:border-sky-500 shadow-md transition-all hover:scale-110 z-30 cursor-pointer focus:outline-none"
          >
            {isSidebarCollapsed ? <ChevronRight size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
          </button>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-hide">
            {navItems.map((item, idx) => {
              const active = isActive(item.path);
              return (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 h-11' : 'gap-3 px-4 py-3'} rounded-xl transition-all ${
                      active ? 'bg-sky-500/10 text-sky-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200 font-semibold'
                    }`}
                  >
                    <item.icon size={20} className={`${active ? 'text-sky-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'} shrink-0`} />
                    {!isSidebarCollapsed && <span className="text-sm truncate">{item.label}</span>}
                  </button>

                  {/* Floating tooltip in collapsed mode */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                      <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700/60 animate-in fade-in duration-150">
                        {item.label}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 relative group">
            <button 
              onClick={() => { sessionStorage.removeItem('xla_token'); navigate('/login'); }} 
              className={`w-full flex items-center justify-center ${isSidebarCollapsed ? 'px-0 h-10' : 'gap-2 py-2.5'} bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-rose-400 dark:hover:text-rose-400 transition-colors`}
            >
              <LogOut size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm">Log Out</span>}
            </button>
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700/60 animate-in fade-in duration-150">
                  Log Out
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#151525]">
          {/* Navigation Drawer (Mobile Only) */}
          <div className="md:hidden">
            <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          </div>
          
          {/* Main content area */}
          <main className={`flex-1 min-h-0 flex flex-col pb-24 md:pb-0 ${location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/locations') || location.pathname.startsWith('/extras/primary-sales') || location.pathname.startsWith('/extras/secondary') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <Outlet context={{ openDrawer: () => setIsDrawerOpen(true) }} />
          </main>

          {/* Bottom Navigation Bar (Mobile Only) */}
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/60"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-stretch h-16 relative">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/dashboard') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
              >
                <LayoutDashboard size={22} strokeWidth={isActive('/dashboard') ? 2.2 : 1.7} />
                <span className={`text-[10px] font-medium ${isActive('/dashboard') ? 'text-sky-400' : 'text-slate-500'}`}>Dashboard</span>
                {isActive('/dashboard') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
              </button>
              <button
                onClick={() => navigate('/extras')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/extras') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
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

              <button
                onClick={() => navigate('/admin')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/admin') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
              >
                <SettingsIcon size={22} strokeWidth={isActive('/admin') ? 2.2 : 1.7} />
                <span className={`text-[10px] font-medium ${isActive('/admin') ? 'text-sky-400' : 'text-slate-500'}`}>Admin</span>
                {isActive('/admin') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
              </button>
              <button
                onClick={() => navigate('/utilities')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${isActive('/utilities') ? 'text-sky-400' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
              >
                <Wrench size={22} strokeWidth={isActive('/utilities') ? 2.2 : 1.7} />
                <span className={`text-[10px] font-medium ${isActive('/utilities') ? 'text-sky-400' : 'text-slate-500'}`}>Utilities</span>
                {isActive('/utilities') && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-sky-400" />}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e30] border border-slate-200 dark:border-[#3b3b5a] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Broadcast Message to XL Users</h3>
            <textarea 
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Enter ticker message to scroll across all XL user screens..."
              className="w-full h-28 bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#3b3b5a] rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500 mb-4 resize-none"
            />
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Start Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  style={{ colorScheme: isLightMode ? 'light' : 'dark' }} 
                  value={validFrom} 
                  onChange={e => setValidFrom(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">End Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  style={{ colorScheme: isLightMode ? 'light' : 'dark' }} 
                  value={validUntil} 
                  onChange={e => setValidUntil(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsBroadcastModalOpen(false)} 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBroadcast} 
                className="px-5 py-2 rounded-lg text-sm font-bold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-md"
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Typography Settings Modal */}
      <TypographySettingsModal 
        isOpen={isTypographyModalOpen} 
        onClose={() => setIsTypographyModalOpen(false)} 
      />

    </div>
  );
}
