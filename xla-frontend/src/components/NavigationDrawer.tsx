import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Moon, Sun, MessageCircle, Users, Activity, ListTodo, 
  Key, LogOut, Mail, Phone, MapPin, Headphones, ChevronRight, ArrowLeft 
} from 'lucide-react';
import axios from 'axios';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const navigate = useNavigate();

  // Theme State
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('xla_theme') !== 'light';
  });

  // Company Profile State
  const [companyName, setCompanyName] = useState('EMYRIS BIOLIFESCIENCES');
  const [tagline, setTagline] = useState('Enhancing Life, Excelling in Care.');
  const [logoUrl, setLogoUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('hradmin@emyrishr.in');
  const [helpdeskPhone, setHelpdeskPhone] = useState('7993163300');
  const [tollFree, setTollFree] = useState('');
  const [corporateAddress, setCorporateAddress] = useState('Sumadhura Pragati Chambers, Park Ln, Secunderabd, Telengana-500003');

  // Contact Us View State
  const [showContactSupport, setShowContactSupport] = useState(false);

  // User Profile
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Load user from storage
      try {
        const stored = sessionStorage.getItem('xla_user') || localStorage.getItem('xla_user');
        if (stored) {
          setUserData(JSON.parse(stored));
        }
      } catch (e) {}

      // Fetch live company profile
      axios.get('/api/company-profile')
        .then(res => {
          if (res.data) {
            if (res.data.name) setCompanyName(res.data.name);
            if (res.data.marqueeText) setTagline(res.data.marqueeText);
            if (res.data.logoUrl) setLogoUrl(res.data.logoUrl);
            else if (res.data.logo && res.data.logo.length > 0 && res.data.logo[0].data) {
              setLogoUrl(res.data.logo[0].data);
            }
            if (res.data.email) setSupportEmail(res.data.email);
            if (res.data.phone) setHelpdeskPhone(res.data.phone);
            if (res.data.tollFree) setTollFree(res.data.tollFree);
            if (res.data.address) setCorporateAddress(res.data.address);
          }
        })
        .catch(err => console.error("Failed to load company profile", err));
    }
  }, [isOpen]);

  const handleToggleTheme = () => {
    const nextTheme = !isDarkTheme;
    setIsDarkTheme(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('xla_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('xla_theme', 'light');
    }
  };

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('xla_token');
    sessionStorage.removeItem('xla_user');
    localStorage.removeItem('xla_token');
    localStorage.removeItem('xla_user');
    onClose();
    navigate('/login');
  };

  const displayName = userData?.fullName || 
    (userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Jnana Dash');
  const displayRole = (userData?.designation || userData?.role || 'ADMIN').toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Right-Side Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-slate-900 z-[101] shadow-2xl flex flex-col font-sans overflow-hidden border-l border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 pt-12 pb-6 border-b border-slate-700/50 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 shadow-lg" />
            ) : (
              <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-xl tracking-tighter">
                EM
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black text-white tracking-tight leading-tight truncate">{companyName}</h1>
              <p className="text-[10px] font-bold text-sky-400 tracking-wider uppercase mt-0.5 truncate">{tagline}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 bg-slate-700/30 p-3 rounded-2xl border border-slate-700/50">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
              <Users size={18} className="text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white leading-tight truncate">{displayName}</p>
              <span className="bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-8">
          
          {/* Subview: Contact Support Details */}
          {showContactSupport ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <button 
                onClick={() => setShowContactSupport(false)}
                className="flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors mb-2"
              >
                <ArrowLeft size={16} />
                <span>Back to Menu</span>
              </button>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
                  Contact Support
                </h3>

                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-semibold">Official Support Email</p>
                    <a href={`mailto:${supportEmail}`} className="text-white font-bold hover:underline break-all">
                      {supportEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-semibold">Helpdesk Contact</p>
                    <a href={`tel:${helpdeskPhone}`} className="text-white font-bold hover:underline">
                      {helpdeskPhone}
                    </a>
                  </div>
                </div>

                {tollFree && (
                  <div className="flex items-start gap-3">
                    <Headphones size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-slate-400 font-semibold">Toll-Free Helpline</p>
                      <a href={`tel:${tollFree}`} className="text-white font-bold hover:underline">
                        {tollFree}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-semibold">Corporate Office</p>
                    <p className="text-white font-bold leading-relaxed">{corporateAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dark Theme Toggle */}
              <button 
                onClick={handleToggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/30 mb-2 cursor-pointer active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    {isDarkTheme ? <Moon size={16} className="text-slate-300" /> : <Sun size={16} className="text-amber-400" />}
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    {isDarkTheme ? 'Dark Theme' : 'Light Theme'}
                  </span>
                </div>
                
                <div className={`w-12 h-6 rounded-full p-1 flex transition-colors ${isDarkTheme ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkTheme ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>
              
              <div className="h-px bg-slate-800 my-2" />

              {/* Active Menu Items */}
              <button
                onClick={() => setShowContactSupport(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/10">
                    <MessageCircle size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Contact Us</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button
                onClick={() => navigateTo('/hierarchy')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/10">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white block leading-tight">Organogram</span>
                    <span className="text-[10px] text-slate-500 font-medium">Company Hierarchy Tree</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button
                onClick={() => navigateTo('/consolidated-activity')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/10">
                    <Activity size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Consolidated Activity</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button
                onClick={() => navigateTo('/todays-activity')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/10">
                    <ListTodo size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Today's Activity</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button
                onClick={() => navigateTo('/admin/users')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/10">
                    <Key size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Manage Passwords & Users</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <div className="h-px bg-slate-800 my-2" />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <LogOut size={16} />
                </div>
                <span className="text-sm font-bold">Logout</span>
              </button>

              {/* Version Tag */}
              <div className="pt-6 pb-2 text-center">
                <p className="text-[11px] font-mono font-bold text-slate-500 tracking-widest">
                  Version - V1-25-26
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
