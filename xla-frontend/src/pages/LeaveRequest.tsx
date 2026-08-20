import { ArrowLeft, ChevronDown, CheckCircle2, XCircle, Clock, CalendarDays, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeaveRequest() {
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
        <div className="hidden md:flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Leave Request</h2>
          <button className="text-sm font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-all">
            My Leaves
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 mb-8">
          
          {/* Calendar Block */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 max-w-3xl">
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
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 w-full xl:w-[450px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-400">J</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white leading-none">Jnana Dash</p>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">Admin</p>
                  </div>
                </div>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Leave Type *</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-300">Select Leave Type</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Reason for Leave *</label>
              <textarea 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none min-h-[120px]"
                placeholder="Enter Reason for Leave"
              />
            </div>

            <button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-4 font-bold shadow-lg shadow-sky-500/20 transition-colors flex items-center justify-center">
              Submit
            </button>
          </div>
        </div>

        {/* BOTTOM TABLE */}
        <div className="hidden md:flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative">
          
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select Month *</label>
                <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 active:bg-slate-700 transition-colors">
                  <span className="font-semibold text-sm">Aug, 2026</span>
                  <CalendarDays size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[250px]">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User</label>
                <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 active:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-400">J</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white leading-none">Jnana Dash</p>
                      <p className="text-[8px] font-semibold text-slate-500 uppercase mt-0.5">Admin</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-auto pb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">Sr no.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">Reason for Leave</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span>Reason Type</span>
                      <ChevronDown size={14} className="text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-24">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-slate-300 text-center bg-slate-900/20">1</td>
                  <td className="p-4 text-sm font-bold text-sky-400">19 Aug 2026</td>
                  <td className="p-4 text-sm font-bold text-sky-400">22 Aug 2026</td>
                  <td className="p-4 text-sm font-semibold text-slate-300 leading-relaxed max-w-xs truncate">Family Hospital Emergency...</td>
                  <td className="p-4 text-sm font-semibold text-slate-300">Casual Leave</td>
                  <td className="p-4 text-center">
                    <button className="text-rose-400/50 hover:text-rose-400 transition-colors p-1.5">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
