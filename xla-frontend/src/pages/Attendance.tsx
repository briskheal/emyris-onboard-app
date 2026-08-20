import { ArrowLeft, ChevronDown, Download, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Attendance() {
  const navigate = useNavigate();

  // Create an array of 31 days for the table headers
  const days = Array.from({ length: 31 }, (_, i) => {
    const date = i + 1;
    const dayName = new Date(2026, 7, date).toLocaleDateString('en-US', { weekday: 'long' });
    return {
      date: date < 10 ? `0${date}` : `${date}`,
      day: dayName
    };
  });

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
        <div className="hidden md:block mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Attendance Summary</h2>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select Type</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm">Monthly Attendance</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select Month</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm">Aug, 2026</span>
                <CalendarIcon size={18} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 text-slate-400 text-xs font-semibold">
            <span>Last Synced</span>
            <span className="text-white">19 Aug 2026 | 11:48 pm</span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="hidden md:flex flex-col flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Table Header Controls */}
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs font-bold text-slate-300">Present</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-xs font-bold text-slate-300">Absent</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs font-bold text-slate-300">Leave</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-xs font-bold text-slate-300">Holiday</span></div>
            </div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
                Actions <SettingsIcon size={16} className="text-sky-400" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <div className="p-2 flex flex-col gap-1">
                  <button className="flex items-center gap-3 text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 px-3 py-2 rounded-lg transition-colors"><RefreshCw size={14} /> Sync Attd</button>
                  <button className="flex items-center gap-3 text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 px-3 py-2 rounded-lg transition-colors"><Download size={14} /> Download Attd</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto pb-16">
            <table className="w-[3000px] xl:w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 sticky left-0 bg-slate-900 z-10 border-r border-slate-700">Sr no.</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky left-16 bg-slate-900 z-10 border-r border-slate-700 w-48 text-left pl-6">Employee Name</th>
                  {days.map((d, i) => (
                    <th key={i} className="p-3 border-r border-slate-700/50 w-20">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <span className="text-xs font-bold text-white">{d.date} Aug</span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase">({d.day})</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-sm font-semibold text-slate-300 sticky left-0 bg-slate-900/90 border-r border-slate-700 z-10">1</td>
                  <td className="p-3 text-sm font-bold text-white text-left pl-6 sticky left-16 bg-slate-900/90 border-r border-slate-700 z-10">Jnana Dash</td>
                  {days.map((d, i) => (
                    <td key={i} className={`p-3 text-sm font-black border-r border-slate-700/50 ${d.day === 'Sunday' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {d.day === 'Sunday' ? 'H' : 'P'}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/50 transition-colors bg-slate-800/30">
                  <td className="p-3 text-sm font-semibold text-slate-300 sticky left-0 bg-slate-900/90 border-r border-slate-700 z-10">2</td>
                  <td className="p-3 text-sm font-bold text-white text-left pl-6 sticky left-16 bg-slate-900/90 border-r border-slate-700 z-10">Dhananjay Vegad</td>
                  {days.map((d, i) => (
                    <td key={i} className={`p-3 text-sm font-black border-r border-slate-700/50 ${d.day === 'Sunday' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {d.day === 'Sunday' ? 'H' : 'P'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Desktop Table Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700/50 backdrop-blur flex items-center justify-between px-6 py-4 z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                <ChevronDown size={14} className="rotate-90" /> Prev
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">Page 1 of 1</span>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                Next <ChevronDown size={14} className="-rotate-90" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                Export
              </button>
              <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                Show 10 <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
// CalendarIcon placeholder since it wasn't imported from lucide-react initially to avoid breaking
const CalendarIcon = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
