import { ArrowLeft, ChevronDown, Eye, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SampleManagement() {
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
        
        {/* DESKTOP HEADER & BANNER */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Samples Management</h2>
            <button className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              View Old Reports
            </button>
          </div>
          
          <div className="bg-slate-800/80 border-l-4 border-emerald-500 rounded-r-xl p-4 shadow-lg flex items-start gap-3">
            <Info className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-slate-300 leading-relaxed">
              Due to the adoption of a new architecture in our application, all Sample Management reports generated before May are now available under "View Old Reports". You can continue to view reports from May onwards directly on this page.
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl">
          <div className="flex flex-col gap-1.5 min-w-[250px]">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select Report Type</label>
            <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
              <span className="font-semibold text-sm">Products Report</span>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>
          
          <div className="flex flex-col gap-1.5 min-w-[250px] flex-1">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User *</label>
            <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-400">D</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-none">Dhananjay Vegad</p>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">ASM</p>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          <button className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-8 py-3 font-bold shadow-lg shadow-sky-500/20 transition-colors h-[46px] self-end">
            See Reports
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="hidden md:flex flex-col flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative">
          
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Showing (4) Entries</h3>
          </div>

          <div className="flex-1 overflow-auto pb-16">
            <table className="w-[1000px] xl:w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">Sr no.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Sample</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Allotted Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Distributed Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Restored Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">De-Allotted Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Available Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-slate-300 bg-slate-900/20">1</td>
                  <td className="p-4 text-sm font-bold text-white text-left">Alomos Dm Sachet(samples)</td>
                  <td className="p-4 text-sm font-black text-sky-400">6</td>
                  <td className="p-4 text-sm font-black text-sky-400">0</td>
                  <td className="p-4 text-sm font-black text-sky-400">0</td>
                  <td className="p-4 text-sm font-black text-sky-400">0</td>
                  <td className="p-4 text-sm font-black text-emerald-400">6</td>
                  <td className="p-4 text-center">
                    <button className="text-slate-500 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-500/10 inline-flex items-center justify-center">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-slate-300 bg-slate-900/20">2</td>
                  <td className="p-4 text-sm font-bold text-white text-left">Alomos Hp 30gm Sachet</td>
                  <td className="p-4 text-sm font-black text-sky-400">50</td>
                  <td className="p-4 text-sm font-black text-sky-400">0</td>
                  <td className="p-4 text-sm font-black text-sky-400">0</td>
                  <td className="p-4 text-sm font-black text-sky-400">0</td>
                  <td className="p-4 text-sm font-black text-emerald-400">50</td>
                  <td className="p-4 text-center">
                    <button className="text-slate-500 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-500/10 inline-flex items-center justify-center">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Desktop Table Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700/50 backdrop-blur flex items-center justify-between px-6 py-4">
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
              <button className="text-slate-400 hover:text-white text-sm font-bold transition-colors">
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
