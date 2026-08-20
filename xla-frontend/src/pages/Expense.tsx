import { useState } from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, Clock, Plus, Settings as SettingsIcon, Trash2, UserPlus, Eye, XCircle, Info, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Expense() {
  const navigate = useNavigate();
  const [selectedMonth] = useState('Aug, 2026');
  const [selectedYear] = useState('2026');

  const expenses = [
    { date: 1, day: 'SAT', status: 'Allowed', badge: 'Out-Station', workingType: 'Meeting', total: '300', food: '300', workArea: 'Hyderabad Vadodara', fullDate: '1 Aug 2026' },
    { date: 2, day: 'SUN', status: 'Not Allowed', fullDate: '2 Aug 2026' },
    { date: 3, day: 'MON', status: 'Allowed', badge: 'Out-Station', workingType: 'Meeting', total: null, fullDate: '3 Aug 2026' },
    { date: 4, day: 'TUE', status: 'Allowed', badge: '', noTp: true, fullDate: '4 Aug 2026' }, 
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
        
        {/* DESKTOP HEADER & BANNER */}
        <div className="hidden md:block mb-6">
          <div className="bg-slate-800/80 border-l-4 border-emerald-500 rounded-r-xl p-4 shadow-lg flex items-start gap-3">
            <Info className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-slate-300 leading-relaxed">
              This is to declare that the daily allowance as claimed for the month of August are out of pocket expenses such as parking, snacks, stationery and other such expenses for which bills are not available.
            </p>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider mt-6">Field Expense</h2>
        </div>

        {/* CONTROLS (Responsive) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="grid grid-cols-2 md:flex gap-3 flex-wrap">
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

            {/* Desktop Filter Data */}
            <div className="hidden md:flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Filter Data</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm">All</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>
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
        </div>

        {/* Mobile Summary Header */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-4">
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

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:flex flex-col flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Table Header Controls */}
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs font-bold text-slate-300">Approved</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-xs font-bold text-slate-300">Rejected</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span className="text-xs font-bold text-slate-300">Pending</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span className="text-xs font-bold text-slate-300">Not Submitted</span></div>
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
          <div className="flex-1 overflow-auto pb-16">
            <table className="w-[1200px] xl:w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sr no.</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Area Type</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Working Type</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Calls</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Work Areas</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Travel</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Food</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hotel</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Misc.</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {expenses.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-sm font-semibold text-slate-300 text-center bg-slate-900/20">{item.date}</td>
                    <td className="p-3 text-sm font-bold text-sky-400 whitespace-nowrap">{item.fullDate}</td>
                    <td className="p-3 text-sm font-medium text-slate-300">{item.day === 'SAT' ? 'Saturday' : item.day === 'SUN' ? 'Sunday' : 'Monday'}</td>
                    <td className="p-3 text-sm font-medium text-slate-300">{item.badge || '-'}</td>
                    <td className="p-3 text-sm font-medium text-slate-300">{item.workingType || '-'}</td>
                    <td className="p-3 text-sm font-medium text-slate-500 text-center">-</td>
                    <td className="p-3 text-sm font-bold text-white max-w-[160px] truncate">{item.workArea || '-'}</td>
                    <td className="p-3 text-sm font-medium text-slate-500 text-center">-</td>
                    <td className="p-3 text-sm font-medium text-white">{item.food || '-'}</td>
                    <td className="p-3 text-sm font-medium text-slate-500 text-center">-</td>
                    <td className="p-3 text-sm font-medium text-slate-500 text-center">-</td>
                    <td className="p-3 text-sm font-medium text-slate-500 text-center">-</td>
                    <td className="p-3 text-sm font-medium text-slate-500 text-center">-</td>
                    <td className="p-3 text-sm font-black text-sky-400">{item.total || '-'}</td>
                    <td className="p-3 text-center">
                      {item.day !== 'SUN' && (
                        <button className="text-slate-500 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-500/10 inline-flex items-center justify-center">
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop Table Footer (Sticky Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700/50 backdrop-blur flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                <ChevronDown size={14} className="rotate-90" /> Prev
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">Page 1 of 1</span>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                Next <ChevronDown size={14} className="-rotate-90" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Total Pending Expense</p>
                  <p className="text-sm font-black text-amber-400 leading-tight">₹0</p>
                </div>
              </div>
              
              <div className="h-8 w-px bg-slate-700"></div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Total Approved Expense</p>
                  <p className="text-sm font-black text-emerald-400 leading-tight">₹5200</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MOBILE LIST VIEW */}
        <div className="md:hidden space-y-3 mt-2">
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
