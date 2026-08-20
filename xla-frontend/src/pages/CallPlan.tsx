import { useState } from 'react';
import { ArrowLeft, ChevronDown, UserPlus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CallPlan() {
  const navigate = useNavigate();
  const [selectedMonth] = useState('August');
  const [selectedYear] = useState('2026');

  // Dummy data representing the list view of days
  const days = [
    { date: 1, day: 'SAT', status: 'Allowed', route: 'Plan DCS calls' },
    { date: 2, day: 'SUN', status: 'Not Allowed' },
    { date: 3, day: 'MON', status: 'Allowed', route: 'Plan DCS calls' },
    { date: 4, day: 'TUE', status: 'Allowed', route: 'Plan DCS calls' },
    { date: 5, day: 'WED', status: 'Allowed', route: '' }, // Empty day
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

        {/* Action Button */}
        <button className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 flex items-center justify-center gap-2 active:bg-emerald-500/20 transition-colors">
          <UserPlus size={20} />
          <span className="font-bold text-sm">Add Call Planning Report for another user</span>
        </button>

        {/* List View */}
        <div className="space-y-3 mt-4">
          {days.map((item, idx) => {
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
                    ) : (
                      <div className="flex flex-col gap-1">
                        {item.route ? (
                          <span className="text-sm font-bold text-white">{item.route}</span>
                        ) : (
                          <span className="text-sm font-semibold text-slate-500 italic">No Plan Added</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Plus Icon */}
                  <button 
                    disabled={isSunday}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isSunday ? 'bg-slate-700/30 text-slate-600' : 'bg-sky-500/10 text-sky-400 active:scale-95 active:bg-sky-500/20'}`}
                  >
                    <Plus size={20} strokeWidth={isSunday ? 2 : 2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-20">
        <button className="bg-sky-500 text-white font-black text-sm px-6 py-4 rounded-full shadow-lg shadow-sky-500/30 flex items-center gap-2 active:scale-95 transition-transform">
          <Plus size={20} />
          Multiple CPs
        </button>
      </div>

    </div>
  );
}
