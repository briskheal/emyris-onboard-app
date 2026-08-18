import { Menu, MessageSquare, Bell, CalendarDays, MapPin, Receipt, History, UserCheck, MonitorPlay, Shield, Target, ChevronRight } from 'lucide-react';

export default function Extras() {

  const extrasOptions = [
    { label: 'Tour Program', description: 'Plan your monthly visits & get approval', icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Call Planning', description: 'Pre-call planning & objectives', icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'Leave Request', description: 'Apply for leaves & track status', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Geo Fencing', description: 'Geo-tag doctors & clinic locations', icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Expense', description: 'Submit and track travel expenses', icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Backlog Reporting', description: 'Submit missed call reports', icon: History, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Attendance', description: 'Daily attendance & punch-in', icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'eDetailing', description: 'Interactive product detailing', icon: MonitorPlay, color: 'text-slate-300', bg: 'bg-slate-300/10', isNew: true },
    { label: 'Settings', description: 'App preferences & account', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'User Performance Analysis', description: 'View sales & call metrics', icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10', isNew: true },
    { label: 'Reminders', description: 'Follow-up and notification alerts', icon: Bell, color: 'text-sky-200', bg: 'bg-sky-200/10' }
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

      <div className="px-4 mt-6">
        <h2 className="text-xl font-black text-white mb-6">Extras</h2>
        
        {/* Options List */}
        <div className="space-y-3">
          {extrasOptions.map((item, idx) => (
            <button
              key={idx}
              className="w-full flex items-center gap-4 bg-slate-800 rounded-2xl px-4 py-4 border border-slate-700/50 transition-colors active:bg-slate-700 relative"
            >
              {item.isNew && (
                <span className="absolute top-3 right-10 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                  NEW
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={22} className={item.color} strokeWidth={1.8} />
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-semibold text-white">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              </div>
              <ChevronRight size={18} className="text-slate-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
