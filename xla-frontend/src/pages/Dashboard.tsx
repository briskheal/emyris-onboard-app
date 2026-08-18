import { Menu, MessageSquare, Bell } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <button className="text-white active:scale-95 transition-transform">
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
            <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              22
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center text-slate-500 mt-20">
           <h2 className="text-xl font-bold text-white mb-2">Admin Dashboard</h2>
           <p>This is the newly scaffolded mobile admin portal.</p>
        </div>
      </div>
    </div>
  );
}
