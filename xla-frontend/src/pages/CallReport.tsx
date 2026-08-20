import { useOutletContext } from 'react-router-dom';
import { Menu, MessageSquare, Bell, Calendar, Lock, User, Store, Building2, Phone } from 'lucide-react';

export default function CallReport() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();

  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-40 text-slate-100 font-sans">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={openDrawer} className="text-white active:scale-95 transition-transform">
            <Menu size={26} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sky-400 relative">
            <MessageSquare size={22} />
          </button>
          <button className="text-emerald-400 relative">
            <Bell size={22} />
          </button>
        </div>
      </div>

      <div className="px-5 mt-6">
        
        {/* Welcome Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-slate-700 rounded-full border-2 border-sky-400 flex items-center justify-center overflow-hidden">
             <User size={28} className="text-slate-400 mt-2" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Welcome,</p>
            <h2 className="text-xl font-black text-white">Jnana Dash</h2>
          </div>
        </div>

        {/* Working Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-300">Today's Working Area</h3>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-3 py-1 rounded-full">
              Working
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Calendar size={16} className="text-rose-400" />
            Tour Program not found. Click to create!
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Doctor Call */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg">
            <div className="absolute top-4 right-4 text-slate-500 bg-slate-700/50 p-1.5 rounded-full">
              <Lock size={14} />
            </div>
            <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center">
              <User size={32} className="text-emerald-400" />
            </div>
            <span className="font-bold text-slate-300 text-sm">Doctor Call</span>
          </div>

          {/* Chemist Call */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg">
            <div className="absolute top-4 right-4 text-slate-500 bg-slate-700/50 p-1.5 rounded-full">
              <Lock size={14} />
            </div>
            <div className="w-16 h-16 rounded-full bg-sky-400/10 flex items-center justify-center">
              <Store size={32} className="text-sky-400" />
            </div>
            <span className="font-bold text-slate-300 text-sm">Chemist Call</span>
          </div>

          {/* Stockist Call */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg">
            <div className="absolute top-4 right-4 text-slate-500 bg-slate-700/50 p-1.5 rounded-full">
              <Lock size={14} />
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center">
              <Building2 size={32} className="text-amber-400" />
            </div>
            <span className="font-bold text-slate-300 text-sm">Stockist Call</span>
          </div>

          {/* Reminder Call */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg">
            <div className="absolute top-4 right-4 text-slate-500 bg-slate-700/50 p-1.5 rounded-full">
              <Lock size={14} />
            </div>
            <div className="w-16 h-16 rounded-full bg-rose-400/10 flex items-center justify-center">
              <Phone size={32} className="text-rose-400" />
            </div>
            <span className="font-bold text-slate-300 text-sm text-center leading-tight">Reminder Call</span>
          </div>
        </div>
      </div>

      {/* Sticky Final Call Report Footer */}
      <div className="fixed bottom-[80px] w-full bg-slate-800 border-t border-slate-700 px-5 py-4 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <div>
          <h4 className="font-bold text-white text-sm">Final Call Report List</h4>
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400">0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Store size={12} className="text-sky-400" />
              <span className="text-[10px] font-bold text-slate-400">0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold text-slate-400">0</span>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <span className="text-white font-black text-xl">0</span>
        </div>
      </div>

    </div>
  );
}
