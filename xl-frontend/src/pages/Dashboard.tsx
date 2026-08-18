import { useNavigate } from 'react-router-dom';
import { CalendarDays, Target, TrendingUp, Users } from 'lucide-react';

const stats = [
  { label: "Today's Calls", value: '0', icon: CalendarDays, color: 'text-sky-400' },
  { label: 'Doctors', value: '0', icon: Users, color: 'text-emerald-400' },
  { label: 'Monthly Target', value: '0%', icon: Target, color: 'text-amber-400' },
  { label: 'Sales MTD', value: '₹0', icon: TrendingUp, color: 'text-violet-400' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-full bg-slate-900">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-slate-800 to-slate-900">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Good morning</p>
        <h1 className="text-2xl font-bold text-white">Field CRM</h1>
        <p className="text-sm text-slate-400 mt-1">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
            <Icon size={20} className={`${color} mb-3`} strokeWidth={1.8} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/creation/doctor')}
            className="w-full flex items-center gap-4 bg-slate-800 rounded-2xl px-4 py-4 border border-slate-700/50 active:bg-slate-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Users size={18} className="text-sky-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Add Doctor</p>
              <p className="text-xs text-slate-400">Create a new doctor profile</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/creation')}
            className="w-full flex items-center gap-4 bg-slate-800 rounded-2xl px-4 py-4 border border-slate-700/50 active:bg-slate-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Target size={18} className="text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Creation Menu</p>
              <p className="text-xs text-slate-400">Doctors, Chemists, Stockists & more</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
