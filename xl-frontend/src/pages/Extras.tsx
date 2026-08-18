import { useNavigate } from 'react-router-dom';
import { CalendarDays, Route, PlaySquare, CalendarOff, ChevronRight } from 'lucide-react';

const extrasOptions = [
  {
    path: '/extras/tour-program',
    icon: CalendarDays,
    label: 'Tour Plan',
    description: 'Plan your monthly visits & get approval',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    path: '#', // Placeholder for Phase 3
    icon: Route,
    label: 'Call Planning',
    description: 'Pre-call planning & objectives (Phase 3)',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    path: '#', // Placeholder for Phase 3
    icon: PlaySquare,
    label: 'E-Detailing',
    description: 'Show visual aids to doctors (Phase 3)',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    path: '#', // Placeholder for Phase 3
    icon: CalendarOff,
    label: 'Leave Management',
    description: 'Apply for leaves & track status (Phase 3)',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
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
