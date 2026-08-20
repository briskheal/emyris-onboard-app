import { ArrowLeft, PieChart, Banknote, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfitAnalysis() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-6 md:p-8 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between mb-12">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Profit Analysis</h2>
        </div>

        {/* 3 Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto w-full">
          
          <button className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 transition-all group shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Banknote size={36} className="text-indigo-400" />
            </div>
            <span className="text-lg font-black text-white tracking-widest uppercase relative z-10">Cost Center</span>
          </button>

          <button className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 transition-all group shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 rounded-2xl bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PieChart size={36} className="text-sky-400" />
            </div>
            <span className="text-lg font-black text-white tracking-widest uppercase relative z-10">Profit Center</span>
          </button>

          <button className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 transition-all group shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <SettingsIcon size={36} className="text-emerald-400" />
            </div>
            <span className="text-lg font-black text-white tracking-widest uppercase relative z-10">Settings</span>
          </button>

        </div>

      </div>
    </div>
  );
}
