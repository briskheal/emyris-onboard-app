import { useNavigate } from 'react-router-dom';
import { PackageSearch, ShoppingCart, CheckCircle, BellRing, UserRound, ShoppingBag, Building2, MapPin, Navigation } from 'lucide-react';

const creationOptions = [
  { path: '/creation/doctor', icon: UserRound, label: 'Doctor', description: 'Add doctors, specialists & hospitals', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { path: '/creation/chemist', icon: ShoppingBag, label: 'Chemist', description: 'Add retail chemist outlets', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { path: '/creation/stockist', icon: Building2, label: 'Stockist', description: 'Add stockists & distributors', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { path: '#', icon: BellRing, label: 'Reminder Call', description: 'Create reminder call logs', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { path: '/creation/primary-sales', icon: PackageSearch, label: 'Primary Sales', description: 'Log primary sales data', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { path: '/creation/secondary-sales', icon: ShoppingCart, label: 'Secondary Sales', description: 'Log secondary sales data', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { path: '/creation/city', icon: MapPin, label: 'City', description: 'Register HQ cities & areas', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { path: '/creation/route', icon: Navigation, label: 'Route', description: 'Define travel routes & distances', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { path: '/creation/approvals', icon: CheckCircle, label: 'Approvals', description: 'Review and approve team requests', color: 'text-teal-400', bg: 'bg-teal-500/10', requiresManager: true },
];

export default function CreationMenu() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('xl_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isManager = user?.designation && (user.designation.toLowerCase().includes('manager') || user.designation.toLowerCase().includes('admin'));

  return (
    <div className="min-h-full bg-slate-800 pb-24">
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50">
        <h1 className="text-lg font-black text-white tracking-wide">
          CREATION <span className="text-sky-400 font-bold text-[13px] ml-1">(Add Records)</span>
        </h1>
      </div>
      <div className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {creationOptions.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => {
                if (item.requiresManager && !isManager) return;
                if (item.path !== '#') navigate(item.path);
              }}
              className={`bg-slate-700 border border-slate-600 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform ${(item.requiresManager && !isManager) ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
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
