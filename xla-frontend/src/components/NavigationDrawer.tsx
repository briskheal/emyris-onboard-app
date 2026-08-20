import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Moon, MessageCircle, Users, Activity, ListTodo, Wallet, 
  CreditCard, Share2, HelpCircle, BookOpen, Key, LogOut 
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const menuItems = [
    { label: 'Contact Us', icon: MessageCircle, onClick: () => alert('Opening WhatsApp...') },
    { label: 'My Hierarchy', icon: Users, onClick: () => navigateTo('/hierarchy') },
    { label: 'Consolidated Activity', icon: Activity, onClick: () => navigateTo('/consolidated-activity') },
    { label: "Today's Activity", icon: ListTodo, onClick: () => navigateTo('/todays-activity') },
    { label: 'Wallet', icon: Wallet, onClick: () => {} },
    { label: 'Billing', icon: CreditCard, onClick: () => {} },
    { label: 'Refer & Earn', icon: Share2, onClick: () => {} },
    { label: 'Raise Support Ticket', icon: HelpCircle, onClick: () => {} },
    { label: 'Getting Started', icon: BookOpen, onClick: () => {} },
    { label: 'Change Password', icon: Key, onClick: () => {} },
    { label: 'Logout', icon: LogOut, onClick: () => {}, isDestructive: true },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-slate-900 z-[101] shadow-2xl flex flex-col font-sans overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 pt-12 pb-6 border-b border-slate-700/50 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-2xl">
              V
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">MEDORN</h1>
              <p className="text-[10px] font-bold text-sky-400 tracking-widest uppercase mt-1">Healthcare</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-6 bg-slate-700/30 p-3 rounded-2xl border border-slate-700/50">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <Users size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Jnana Dash</p>
              <span className="bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block">
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 pb-24">
          
          {/* Dark Theme Toggle */}
          <button 
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/30 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Moon size={16} className="text-slate-300" />
              </div>
              <span className="text-sm font-bold text-slate-300">Dark Theme</span>
            </div>
            
            <div className={`w-12 h-6 rounded-full p-1 flex transition-colors ${isDarkTheme ? 'bg-emerald-500' : 'bg-slate-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkTheme ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
          
          <div className="h-px bg-slate-800 my-2" />

          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors active:bg-slate-800/80"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-sky-400'}`}>
                <item.icon size={16} />
              </div>
              <span className={`text-sm font-bold ${item.isDestructive ? 'text-rose-500' : 'text-slate-300'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
