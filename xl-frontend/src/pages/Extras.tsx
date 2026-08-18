import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, Route, CalendarOff, MapPin, Receipt, 
  History, UserCheck, Settings, LineChart, ChevronRight 
} from 'lucide-react';

const extrasOptions = [
  {
    path: '/extras/tour-program',
    icon: CalendarDays,
    label: 'Tour Program',
    description: 'Plan your monthly visits & get approval',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    path: '/extras/call-plan',
    icon: Route,
    label: 'Call Planning',
    description: 'Pre-call planning & objectives',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    path: '/extras/leave',
    icon: CalendarOff,
    label: 'Leave Request',
    description: 'Apply for leaves & track status',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    path: '/extras/geo-fencing',
    icon: MapPin,
    label: 'Geo Fencing',
    description: 'Geo-tag doctors & clinic locations',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    path: '/extras/expense',
    icon: Receipt,
    label: 'Expense',
    description: 'Submit and track travel expenses',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    path: '/extras/backlog',
    icon: History,
    label: 'Backlog Reporting',
    description: 'Submit missed call reports',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    path: '/extras/attendance',
    icon: UserCheck,
    label: 'Attendance',
    description: 'Daily attendance & punch-in',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
  {
    path: '#',
    icon: LineChart,
    label: 'User Performance Analysis',
    description: 'View sales & call metrics',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
  },
  {
    path: '#',
    icon: Settings,
    label: 'Settings',
    description: 'App preferences & account',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
  },
];

export default function Extras() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-900">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-slate-800 to-slate-900">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Extras</p>
        <h1 className="text-2xl font-bold text-white">Field Operations</h1>
        <p className="text-sm text-slate-400 mt-1">Manage plans, calls, and activities</p>
      </div>

      {/* Options List */}
      <div className="px-4 space-y-3">
        {extrasOptions.map(({ path, icon: Icon, label, description, color, bg }) => (
          <button
            key={label}
            onClick={() => path !== '#' && navigate(path)}
            className={`w-full flex items-center gap-4 bg-slate-800 rounded-2xl px-4 py-4 border border-slate-700/50 transition-colors ${path !== '#' ? 'active:bg-slate-700' : 'opacity-70 cursor-not-allowed'}`}
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} strokeWidth={1.8} />
            </div>
            <div className="text-left flex-1">
              <p className="text-base font-semibold text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            {path !== '#' && <ChevronRight size={18} className="text-slate-600 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
