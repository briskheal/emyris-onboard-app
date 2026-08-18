import { useNavigate } from 'react-router-dom';
import { UserRound, ShoppingBag, Building2, MapPin, Navigation } from 'lucide-react';

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

      <div className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {creationOptions.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => navigate(item.path)}
              className="bg-slate-800 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform active:scale-95"
            >
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
