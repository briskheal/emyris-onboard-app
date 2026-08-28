import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, Route, CalendarOff, MapPin, Receipt, 
  History, UserCheck, Settings, LineChart
} from 'lucide-react';

export default function Extras() {
  const navigate = useNavigate();

  const extrasOptions = [
    {
      path: '/extras/tour-program',
      icon: CalendarDays,
      label: 'Tour Program',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      path: '/extras/call-plan',
      icon: Route,
      label: 'Call Planning',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      path: '/extras/leave',
      icon: CalendarOff,
      label: 'Leave Request',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      path: '/extras/geo-fencing',
      icon: MapPin,
      label: 'Geo Fencing',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      path: '/extras/expense',
      icon: Receipt,
      label: 'Expense',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      path: '/extras/backlog',
      icon: History,
      label: 'Backlog Reporting',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      path: '/extras/attendance',
      icon: UserCheck,
      label: 'Attendance',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
    },
    {
      path: '/extras/performance',
      icon: LineChart,
      label: 'Performance',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      isNew: true
    },
    {
      path: '#',
      icon: Settings,
      label: 'Settings',
      color: 'text-slate-200',
      bg: 'bg-slate-500/10',
    },
  ];

  return (
    <div className="min-h-full bg-slate-800 pb-24 text-slate-100 font-sans">
      {/* Header */}
      <div className="px-4 py-3 sticky top-0 bg-slate-800 z-10 border-b border-slate-700">
        <h1 className="text-lg font-black text-white tracking-wide">
          EXTRAS <span className="text-sky-400 font-bold text-[13px] ml-1">(Plan Well)</span>
        </h1>
      </div>

      <div className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {extrasOptions.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`bg-slate-700 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform relative ${item.path !== '#' ? 'active:scale-95' : 'opacity-70 cursor-not-allowed'}`}
            >
              {item.isNew && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md uppercase">
                  New
                </span>
              )}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bg}`}>
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
