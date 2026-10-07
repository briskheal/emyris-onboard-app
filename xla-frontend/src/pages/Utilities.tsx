import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Menu, MessageSquare, Bell, CheckCircle2 
} from 'lucide-react';
import { utilitiesOptions } from '../config/navigation';

export default function Utilities() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();
  const navigate = useNavigate();

  const options = utilitiesOptions;

  return (
    <div className="min-h-full md:h-dvh bg-slate-900 flex flex-col pb-24 md:pb-0 text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
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

      <div className="flex-1 px-5 md:px-8 py-6 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:block mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Reports</h2>
        </div>

        {/* MOBILE HEADER */}
        <h2 className="md:hidden text-xl font-black text-white mb-6">Utilities</h2>
        
        {/* Desktop Grid / Mobile List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-8">
          {options.map((report, idx) => (
            <div key={idx} onClick={() => report.path ? navigate(report.path) : (report.id === 'lists' && navigate('/utilities/lists/doctors'))} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 rounded-2xl p-5 md:p-6 transition-all group shadow-lg flex gap-4 md:gap-5 items-start relative overflow-hidden cursor-pointer">
              {/* Desktop Decorative Glow */}
              <div className="hidden md:block absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity z-0 pointer-events-none"></div>

              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${report.bg} flex items-center justify-center flex-shrink-0 z-10`}>
                <report.icon size={24} className={`${report.color} md:w-7 md:h-7`} />
              </div>
              <div className="flex-1 z-10">
                <h3 className="font-black text-white mb-2 text-sm md:text-base tracking-wide flex items-center justify-between">
                  {report.label}
                  <CheckCircle2 size={16} className="text-emerald-500 hidden md:block" />
                </h3>
                <p className="text-xs text-slate-400 md:text-slate-300 leading-relaxed md:leading-loose pr-4">
                  {report.description}
                </p>
                
                {/* Mobile Quality badge */}
                <div className="md:hidden flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    Quality Assured Report
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

