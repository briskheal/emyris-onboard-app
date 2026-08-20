import { useState } from 'react';
import { ArrowLeft, ChevronDown, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Backlog() {
  const navigate = useNavigate();
  const [selectedMonth] = useState('August');
  const [selectedYear] = useState('2026');

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative">
      
      {/* Sticky Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col flex-1">
        
        {/* Top Controls */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
            <span className="font-semibold text-sm">{selectedMonth}</span>
            <ChevronDown size={18} className="text-slate-400" />
          </button>
          <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
            <span className="font-semibold text-sm">{selectedYear}</span>
            <ChevronDown size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-10">
          <div className="relative w-48 h-48 mb-6">
            <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-2xl" />
            <div className="w-full h-full rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center relative overflow-hidden shadow-2xl">
              <Rocket size={64} className="text-sky-400 absolute -rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                <span className="text-5xl font-black text-white italic drop-shadow-lg">404</span>
              </div>
            </div>
            
            {/* Asteroids/Stars */}
            <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-slate-700" />
            <div className="absolute bottom-10 right-4 w-4 h-4 rounded-full bg-slate-700" />
            <div className="absolute top-1/2 left-2 w-2 h-2 rounded-full bg-sky-400" />
          </div>
          
          <h2 className="text-lg font-black text-white tracking-widest uppercase mt-4">NO RESULTS FOUND !</h2>
          <p className="text-sm font-medium text-slate-400 mt-2 text-center max-w-[200px]">
            No backlog records found for this period.
          </p>
        </div>
        
      </div>
    </div>
  );
}
