import { useNavigate } from 'react-router-dom';
import { UserRound, ShoppingBag, Building2, MapPin, Navigation, ChevronRight } from 'lucide-react';

const creationOptions = [
  {
    path: '/creation/doctor',
    icon: UserRound,
    label: 'Doctor',
    description: 'Add doctors, specialists & hospitals',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    path: '/creation/chemist',
    icon: ShoppingBag,
    label: 'Chemist',
    description: 'Add retail chemist outlets',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    path: '/creation/stockist',
    icon: Building2,
    label: 'Stockist',
    description: 'Add stockists & distributors',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    path: '/creation/city',
    icon: MapPin,
    label: 'City',
    description: 'Register HQ cities & areas',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    path: '/creation/route',
    icon: Navigation,
    label: 'Route',
    description: 'Define travel routes & distances',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
];

export default function CreationMenu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-900">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-slate-800 to-slate-900">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Module</p>
        <h1 className="text-2xl font-bold text-white">Creation Menu</h1>
        <p className="text-sm text-slate-400 mt-1">Add new records to the CRM</p>
      </div>

      {/* Options List */}
      <div className="px-4 space-y-3">
        {creationOptions.map(({ path, icon: Icon, label, description, color, bg }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-4 bg-slate-800 rounded-2xl px-4 py-4 border border-slate-700/50 active:bg-slate-700 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} strokeWidth={1.8} />
            </div>
            <div className="text-left flex-1">
              <p className="text-base font-semibold text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            <ChevronRight size={18} className="text-slate-600 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
