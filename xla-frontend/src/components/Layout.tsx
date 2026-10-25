import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, Settings as SettingsIcon, Wrench, Menu, Receipt, 
  MonitorPlay, Target, BarChart3, Clock, Bell, ClipboardList, Gift, PieChart, 
  Users, History, CheckSquare, LogOut, Sun, Moon, Search, MessageSquare, Sliders,
  ChevronLeft, ChevronRight, Laptop, Monitor, ArrowLeft, Trash2, X
} from 'lucide-react';
import NavigationDrawer from './NavigationDrawer';
import TypographySettingsModal from './TypographySettingsModal';
import axios from 'axios';
import { GLOBAL_ROUTES } from '../config/navigation';

const DESKTOP_ONLY_MODULES: { path: string; label: string }[] = [
  { path: '/admin/locations', label: 'Manage Locations' },
  { path: '/admin/users', label: 'Manage Users' },
  { path: '/admin/products', label: 'Manage Products' },
  { path: '/admin/user-performance-analysis', label: 'User Performance Analysis' },
  { path: '/admin/expenses', label: 'Manage Expenses & Allowances' },
  { path: '/admin/dcs', label: 'Manage DCS (Doctors, Stockists, Chemists)' },
  { path: '/admin/approvals', label: 'Approvals Hub' },
  { path: '/admin/leave', label: 'Manage Leave' },
  { path: '/admin/company-profile', label: 'Company Profile & Contact' },
  { path: '/reports/geo-location-analysis', label: 'Geo-Location Analysis Report' },
  { path: '/reports/office-geo-analysis', label: 'Office Geo-Presence Report' },
  { path: '/reports/sales-insights', label: 'Sales Insights Report' },
  { path: '/reports/primary-sales', label: 'Primary Sales Reports' },
  { path: '/reports/secondary-sales', label: 'Secondary Sales Reports' },
  { path: '/reports/missed-reports', label: 'Missed Reports' },
  { path: '/utilities/lists', label: 'Master Lists Directory' },
  { path: '/extras/call-plan', label: 'Monthly Doctor Call Plan' },
  { path: '/extras/profit', label: 'Profit & Financial Analysis' },
];

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
  { path: '/extras/samples', icon: Gift, label: 'Samples & Gifts' },
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

  // Mobile Screen Warning for Desktop-Only Modules
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [dismissedDesktopWarning, setDismissedDesktopWarning] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('xla_dismissed_desktop_warnings') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const matchedDesktopModule = useMemo(() => {
    return DESKTOP_ONLY_MODULES.find(m => location.pathname.startsWith(m.path));
  }, [location.pathname]);

  const showDesktopModal = isMobileScreen && !!matchedDesktopModule && !dismissedDesktopWarning.includes(matchedDesktopModule.path);

  const handleDismissDesktopWarning = () => {
    if (matchedDesktopModule) {
      const updated = [...dismissedDesktopWarning, matchedDesktopModule.path];
      setDismissedDesktopWarning(updated);
      sessionStorage.setItem('xla_dismissed_desktop_warnings', JSON.stringify(updated));
    }
  };

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

  const handleToggleNotifications = () => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(prev => !prev);
  };

  const formatNotifDate = (dateString?: string) => {
    if (!dateString) return { datePart: '', timePart: '' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { datePart: '', timePart: '' };
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && 
                    d.getMonth() === today.getMonth() && 
                    d.getFullYear() === today.getFullYear();
    const datePart = isToday ? 'Today' : d.toLocaleDateString();
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    return { datePart, timePart };
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

  const filteredGlobalRoutes = useMemo(() => {
    if (!globalSearchTerm.trim()) return [];
    const query = globalSearchTerm.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    const seenKeys = new Set<string>();
    return GLOBAL_ROUTES.filter(r => {
      const key = `${r.path}_${r.title}`;
      if (!r.path || seenKeys.has(key)) return false;

      const searchableCorpus = [
        r.title,
        r.breadcrumb,
        r.path,
        ...(r.keywords || [])
      ].join(' ').toLowerCase();

      const matches = tokens.every(token => searchableCorpus.includes(token));
      if (matches) {
        seenKeys.add(key);
        return true;
      }
      return false;
    });
  }, [globalSearchTerm]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-[#1a1a2e] overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* TOP HEADER - SPANS FULL WIDTH ABOVE ALL MENUS & SUBMENUS */}
      <header className="h-16 flex items-center justify-between px-3 sm:px-6 bg-white dark:bg-[#1e1e30] border-b border-slate-200 dark:border-[#3b3b5a] shadow-md z-30 flex-shrink-0">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
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

        {/* Right: Theme Toggle, Font Settings, Broadcast, Notifications, User Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3">
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

          {/* Broadcast Announcement Button */}
          <button 
            onClick={() => setIsBroadcastModalOpen(true)} 
            className="text-slate-500 dark:text-[#8b8baf] hover:text-sky-400 transition-colors relative group p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" 
            title="Broadcast Scroll Message"
          >
            <MessageSquare size={20} />
            <span className="text-[10px] absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white px-2 py-1 rounded shadow-lg pointer-events-none z-50">
              Broadcast Message
            </span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-[#3b3b5a] hidden sm:block"></div>

          {/* Notifications Dropdown / Full Phone Boundary Modal */}
          <div className="relative">
            <button 
              onClick={handleToggleNotifications} 
              className={`text-slate-500 dark:text-[#8b8baf] hover:text-emerald-400 transition-colors relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${isNotifOpen ? 'text-emerald-500 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800' : ''}`} 
              title="Notifications"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                {/* Desktop Backdrop to dismiss when clicking outside */}
                <div 
                  className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 hidden md:block"
                  onClick={() => setIsNotifOpen(false)}
                />

                {/* Notifications Modal: Spans full phone boundary on Mobile, sleek anchored card on Desktop */}
                <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-white dark:bg-[#212236] flex flex-col md:fixed md:inset-auto md:top-16 md:right-4 md:w-[420px] md:max-h-[580px] md:rounded-2xl md:shadow-2xl md:border md:border-slate-200 md:dark:border-[#3b3b5a] md:overflow-hidden animate-in fade-in duration-150">
                  
                  {/* Top Bar (Title & Close Button) */}
                  <div className="relative py-3 px-4 shadow-[0_4px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-white dark:bg-[#212236] z-10 border-b border-sky-400/50 flex items-center justify-between">
                    <div className="w-8"></div>
                    <h2 className="text-slate-900 dark:text-sky-400 font-bold text-xl sm:text-2xl tracking-tight text-center flex items-center justify-center gap-2">
                      <Bell size={22} className="text-sky-500 dark:text-sky-400" />
                      <span>Notifications</span>
                    </h2>
                    <button 
                      onClick={() => setIsNotifOpen(false)} 
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 active:scale-95 transition-all"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Sub-bar with Count and Clear Button (Exact XL Modal match) */}
                  <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1b2d]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-[13px]">
                      Notifications: {notifications.length}
                    </span>
                    <button 
                      onClick={handleClearNotifications} 
                      className="text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span>Clear notifications</span>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Notification Items List */}
                  <div className="flex-1 p-3.5 sm:p-4 space-y-3 overflow-y-auto pb-24 md:pb-6">
                    {notifications.length === 0 ? (
                      <div className="text-center text-slate-400 dark:text-slate-500 mt-12 text-sm flex flex-col items-center justify-center gap-2">
                        <Bell size={36} className="text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                        <span>No new notifications</span>
                      </div>
                    ) : (
                      notifications.map((n: any) => {
                        const { datePart, timePart } = formatNotifDate(n.date || n.createdAt);
                        return (
                          <div 
                            key={n.id || n._id} 
                            className="bg-slate-50 dark:bg-[#292a40] rounded-xl p-3 sm:p-3.5 flex gap-3 shadow-sm border border-slate-200 dark:border-slate-700/60 text-left"
                          >
                            <Bell className="text-emerald-500 dark:text-emerald-400 mt-1 shrink-0" size={24} fill="currentColor" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-slate-900 dark:text-white font-bold text-xs sm:text-[13px] leading-tight">
                                {n.title || n.type}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 leading-snug break-words">
                                {n.message}
                              </p>
                            </div>
                            <div className="flex flex-col items-end justify-start shrink-0 gap-1">
                              <span className="text-sky-600 dark:text-sky-400 text-xs font-semibold">{datePart}</span>
                              <span className="text-sky-600 dark:text-sky-400 text-[11px] font-medium">{timePart}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
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

          {/* Mobile Hamburger Trigger (Right Side, exactly matching XL Portal) */}
          <button 
            onClick={() => setIsDrawerOpen(true)} 
            className="md:hidden text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-white active:scale-95 transition-transform p-1 rounded-lg"
            title="Open Menu"
          >
            <Menu size={24} />
          </button>
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
          <main className={`flex-1 min-h-0 flex flex-col pb-36 md:pb-0 ${location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/locations') || location.pathname.startsWith('/admin/dcs') || location.pathname.startsWith('/extras/primary-sales') || location.pathname.startsWith('/extras/secondary') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
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

      {/* Mobile Screen: Open in Desktop / Laptop Modal */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full" />
            
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-sky-500/10">
              <Laptop size={32} strokeWidth={2.2} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Monitor size={13} />
              <span>Desktop / Laptop Recommended</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2">
              Open in Desktop / Laptop
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              <strong className="text-sky-500 dark:text-sky-400">{matchedDesktopModule?.label}</strong> is a high-density administrative module designed for larger screens.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Wide tables, multi-column filters, and bulk operations are not fully compatible with mobile screens. For the best experience, please open this module on your <strong>Desktop or Laptop</strong>.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Return to Mobile Dashboard</span>
              </button>

              <button
                onClick={handleDismissDesktopWarning}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Continue Anyway (View on Mobile)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
