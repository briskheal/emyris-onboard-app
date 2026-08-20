import { ArrowLeft, CalendarDays, User, Store, Building2, ClipboardList, Package, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConsolidatedActivity() {
  const navigate = useNavigate();

  const cards = [
    { label: 'DOCTOR VISITED', value: '412', icon: User, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
    { label: 'CHEMIST VISITED', value: '108', icon: Store, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-500/30' },
    { label: 'STOCKIST VISITED', value: '24', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
    { label: 'TOTAL POB', value: '₹1.2M', icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-500/30' },
    { label: 'TOTAL SAMPLES', value: '1240', icon: Package, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/30' },
    { label: 'TOTAL GIFTS', value: '45', icon: Gift, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24">
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-sky-400 active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-black text-white">Consolidated Activity</h1>
      </div>

      <div className="px-5 py-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <CalendarDays size={18} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Date Range</p>
              <h3 className="font-bold text-white text-sm">August 2026</h3>
            </div>
          </div>
          <button className="bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl active:bg-sky-600">
            Change
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, idx) => (
            <div key={idx} className={`bg-slate-800 border ${card.border} rounded-3xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg`}>
              <div className={`w-14 h-14 rounded-full ${card.bg} flex items-center justify-center mb-1`}>
                <card.icon size={26} className={card.color} />
              </div>
              <span className="text-2xl font-black text-white mt-1">{card.value}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1">
                {card.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
