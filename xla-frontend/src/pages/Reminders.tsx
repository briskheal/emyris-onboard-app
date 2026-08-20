import { ArrowLeft, ChevronDown, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reminders() {
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
        <div className="hidden md:block mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Add Reminder</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Calendar Block */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <button className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors">
                <ChevronDown size={18} className="rotate-90 text-slate-400" />
              </button>
              <h3 className="text-lg font-bold text-white">August 2026</h3>
              <button className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors">
                <ChevronDown size={18} className="-rotate-90 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-6 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs font-bold text-slate-500 uppercase">{day}</div>
              ))}
              
              {/* Dummy Calendar Days */}
              {Array.from({ length: 31 }, (_, i) => {
                const date = i + 1;
                const isSelected = date === 20;
                return (
                  <div key={date} className="flex items-center justify-center">
                    <button className={`w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center transition-all ${
                      isSelected ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : 'text-slate-300 hover:bg-slate-700'
                    }`}>
                      {date}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Block */}
          <div className="flex flex-col gap-6 w-full lg:w-[400px]">
            <input 
              type="text" 
              placeholder="Reminder Title" 
              className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            
            <input 
              type="text" 
              placeholder="Reminder Description" 
              className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />

            <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 active:bg-slate-700 transition-colors text-left">
              <span className="font-semibold text-sm text-slate-300">Call for a Meeting / Joint Reminder</span>
              <ChevronDown size={18} className="text-slate-500" />
            </button>

            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
              <span className="font-semibold text-sm text-slate-300">Time for Reminder</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-sky-400">09:45</span>
                <Clock size={16} className="text-slate-500" />
              </div>
            </div>

            <button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-4 font-bold shadow-lg shadow-sky-500/20 transition-colors flex items-center justify-center gap-2 mt-4">
              Add Reminder
            </button>

            {/* List of Reminders */}
            <div className="mt-8 space-y-3">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-sky-400 mb-0.5">2026-08-20 - meeting</h4>
                    <p className="text-xs font-semibold text-white mb-0.5">Dileep</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">meeting</p>
                  </div>
                </div>
                <button className="text-rose-400/50 hover:text-rose-400 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
