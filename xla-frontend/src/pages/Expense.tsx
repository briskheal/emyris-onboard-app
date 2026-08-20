import { useState } from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Expense() {
  const navigate = useNavigate();
  const [selectedMonth] = useState('August');
  const [selectedYear] = useState('2026');

  const expenses = [
    { date: 1, day: 'SAT', status: 'Allowed', badge: 'OUT', total: '300' },
    { date: 2, day: 'SUN', status: 'Not Allowed' },
    { date: 3, day: 'MON', status: 'Allowed', badge: 'HQ', total: null }, // Needs expense
    { date: 4, day: 'TUE', status: 'Allowed', badge: '', noTp: true }, 
  ];

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

      <div className="px-5 py-4 space-y-4">
        
        {/* Top Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
            <span className="font-semibold text-sm">{selectedMonth}</span>
            <ChevronDown size={18} className="text-slate-400" />
          </button>
          <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
            <span className="font-semibold text-sm">{selectedYear}</span>
            <ChevronDown size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Summary Header */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Approved</span>
            </div>
            <span className="text-xl font-black text-emerald-400">5200</span>
          </div>
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={14} className="text-amber-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
            </div>
            <span className="text-xl font-black text-amber-400">0</span>
          </div>
        </div>

        {/* List View */}
        <div className="space-y-3 mt-4">
          {expenses.map((item, idx) => {
            const isSunday = item.day === 'SUN';
            return (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl flex overflow-hidden shadow-lg">
                {/* Left Date Block */}
                <div className="w-14 flex flex-col items-center justify-center bg-slate-700/50 py-3 border-r border-slate-700">
                  <span className="text-xl font-black text-white leading-none">{item.date}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.day}</span>
                </div>
                
                {/* Content Block */}
                <div className="flex-1 p-3 flex items-center justify-between">
                  <div>
                    {isSunday ? (
                      <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md">Not Allowed</span>
                    ) : item.noTp ? (
                      <span className="text-sm font-semibold text-rose-400 italic">No TP Found</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {item.total ? (
                          <span className="text-sm font-bold text-white">Total - ₹ {item.total}</span>
                        ) : (
                          <span className="text-sm font-bold text-sky-400 underline decoration-sky-400/30">Add Expense</span>
                        )}
                        {item.badge && (
                          <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 self-start px-2 py-0.5 rounded-full border border-emerald-400/20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Icon */}
                  {(!isSunday && !item.noTp && !item.total) && (
                    <button className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center active:scale-95 transition-transform">
                      <Plus size={20} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
