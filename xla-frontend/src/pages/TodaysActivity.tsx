import { ArrowLeft, User, MapPin, Store, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TodaysActivity() {
  const navigate = useNavigate();
  const activities = [
    { name: 'Kuldeep Singh', status: 'Out-Station', route: 'Vadodara - Rajkot', docs: 11, chems: 4, stock: 1 },
    { name: 'Dhananjay Kumar', status: 'HQ', route: 'Ahmedabad Local', docs: 8, chems: 2, stock: 0 },
    { name: 'Vikas Sharma', status: 'Transit', route: 'Raipur - Durg', docs: 3, chems: 1, stock: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24">
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-sky-400 active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-black text-white">Today's Activity</h1>
      </div>

      <div className="px-5 py-6 space-y-4">
        {activities.map((act, idx) => (
          <div key={idx} className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                  <User size={20} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{act.name}</h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${act.status === 'Out-Station' ? 'bg-orange-500/20 text-orange-400' : act.status === 'HQ' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {act.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5 bg-slate-900/50 py-2 px-3 rounded-xl border border-slate-700/50">
              <MapPin size={14} className="text-rose-400" />
              <span className="text-xs font-semibold text-slate-300">{act.route}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <User size={16} className="text-emerald-400 mb-1" />
                <span className="text-lg font-black text-white leading-none">{act.docs}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Doctors</span>
              </div>
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Store size={16} className="text-sky-400 mb-1" />
                <span className="text-lg font-black text-white leading-none">{act.chems}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Chemists</span>
              </div>
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Building2 size={16} className="text-amber-400 mb-1" />
                <span className="text-lg font-black text-white leading-none">{act.stock}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Stockists</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
