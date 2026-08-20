import { useState } from 'react';
import { ArrowLeft, ChevronDown, UserPlus, Plus, Eye, Trash2, CheckCircle2, XCircle, Clock, CalendarDays, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CallPlan() {
  const navigate = useNavigate();
  const [selectedMonth] = useState('Aug, 2026');
  const [selectedYear] = useState('2026');

  // Dummy data representing the list view of days
  const days = [
    { date: 1, day: 'SAT', status: 'Allowed', route: 'Plan DCS calls', fullDate: '1 Aug 2026' },
    { date: 2, day: 'SUN', status: 'Not Allowed', fullDate: '2 Aug 2026' },
    { date: 3, day: 'MON', status: 'Allowed', route: 'Plan DCS calls', fullDate: '3 Aug 2026' },
  ];

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
      <div className="flex-1 flex flex-col px-5 py-4 md:p-8 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Call Planning</h2>
        </div>

        {/* CONTROLS (Responsive) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="grid grid-cols-2 md:flex gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="hidden md:block text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select Month <span className="text-rose-500">*</span></label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors min-w-[160px]">
                <span className="font-semibold text-sm">{selectedMonth}</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>
            <button className="md:hidden flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
              <span className="font-semibold text-sm">{selectedYear}</span>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Desktop Select User */}
          <div className="hidden md:flex flex-col gap-1.5 min-w-[250px]">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User</label>
            <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 active:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <UserPlus size={16} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-none">Jnana Dash</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Admin</p>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Mobile Action Button */}
          <button className="md:hidden w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 flex items-center justify-center gap-2 active:bg-emerald-500/20 transition-colors">
            <UserPlus size={20} />
            <span className="font-bold text-sm">Add Call Planning Report for another user</span>
          </button>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:flex flex-col flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Table Header Controls */}
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /><span className="text-xs font-bold text-slate-300">Approved</span></div>
              <div className="flex items-center gap-2"><XCircle size={16} className="text-rose-400" /><span className="text-xs font-bold text-slate-300">Rejected</span></div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-sky-400" /><span className="text-xs font-bold text-slate-300">Pending</span></div>
              <div className="flex items-center gap-2"><CalendarDays size={16} className="text-amber-400" /><span className="text-xs font-bold text-slate-300">Leave</span></div>
            </div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
                Actions <SettingsIcon size={16} className="text-sky-400" />
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <div className="p-2 flex flex-col gap-1">
                  <button className="flex items-center gap-2 text-left text-sm font-semibold text-sky-400 hover:bg-slate-700/50 px-3 py-2 rounded-lg transition-colors"><Plus size={14} /> Add</button>
                  <button className="flex items-center gap-2 text-left text-sm font-semibold text-rose-400 hover:bg-slate-700/50 px-3 py-2 rounded-lg transition-colors"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-20 text-center">Sr no.</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-40">Date</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">Day</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctors</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Chemists</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stockists</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-24 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {days.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-slate-300 text-center bg-slate-900/20">{item.date}</td>
                    <td className="p-4 text-sm font-bold text-sky-400">{item.fullDate}</td>
                    <td className="p-4 text-sm font-medium text-slate-300">{item.day === 'SAT' ? 'Saturday' : item.day === 'SUN' ? 'Sunday' : 'Monday'}</td>
                    <td className="p-4 text-sm font-medium text-slate-500 italic">No Data</td>
                    <td className="p-4 text-sm font-medium text-slate-500 italic">No Data</td>
                    <td className="p-4 text-sm font-medium text-slate-500 italic">No Data</td>
                    <td className="p-4 text-center">
                      {item.day !== 'SUN' && (
                        <button className="text-slate-500 hover:text-sky-400 transition-colors p-2 rounded-lg hover:bg-sky-500/10 inline-flex items-center justify-center">
                          <Eye size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE LIST VIEW */}
        <div className="md:hidden space-y-3 mt-2">
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

      {/* Floating Action Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-24 right-5 z-20">
        <button className="bg-sky-500 text-white font-black text-sm px-6 py-4 rounded-full shadow-lg shadow-sky-500/30 flex items-center gap-2 active:scale-95 transition-transform">
          <Plus size={20} />
          Multiple CPs
        </button>
      </div>

    </div>
  );
}
