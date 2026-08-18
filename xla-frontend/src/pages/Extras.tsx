import { Menu, MessageSquare, Bell, Calendar, MapPin, Calculator, ClipboardList, PenTool, CalendarCheck, Target, Shield, Clock } from 'lucide-react';

export default function Extras() {

  const menuItems = [
    { label: 'Tour Program', icon: MapPin, color: 'text-rose-400', bgColor: 'bg-rose-400/10' },
    { label: 'Call Planning', icon: Calendar, color: 'text-sky-400', bgColor: 'bg-sky-400/10' },
    { label: 'Leave Request', icon: CalendarCheck, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { label: 'Geo Fencing', icon: MapPin, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { label: 'Expense', icon: Calculator, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    { label: 'Backlog Reporting', icon: ClipboardList, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
    { label: 'Attendance', icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { label: 'eDetailing', icon: PenTool, color: 'text-slate-300', bgColor: 'bg-slate-300/10', isNew: true },
    { label: 'Settings', icon: Shield, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'User Performance Analysis', icon: Target, color: 'text-purple-400', bgColor: 'bg-purple-400/10', isNew: true },
    { label: 'Reminders', icon: Bell, color: 'text-sky-200', bgColor: 'bg-sky-200/10' }
  ];

  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-24 text-slate-100 font-sans">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button className="text-white active:scale-95 transition-transform">
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

      <div className="px-5 mt-6">
        <h2 className="text-xl font-black text-white mb-6">Extras</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, idx) => (
            <button 
              key={idx}
              className="bg-slate-800 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform relative"
            >
              {item.isNew && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                  New
                </span>
              )}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bgColor}`}>
                <item.icon size={28} className={item.color} />
              </div>
              <span className="text-xs font-bold text-slate-300 text-center px-2">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
