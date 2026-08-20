import { ArrowLeft, Users, Paperclip, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PerformanceMenu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative">
      
      {/* Sticky Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">User Performance Analysis</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="space-y-4">
          
          <button className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-lg active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner bg-sky-500/10">
              <Users size={22} className="text-sky-400" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-wide">Effort Analysis</span>
          </button>

          <button className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-lg active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner bg-emerald-500/10">
              <span className="font-black text-emerald-400 text-xl">A</span>
            </div>
            <span className="text-[15px] font-bold text-white tracking-wide">Add Achieved Targets</span>
          </button>

          <button className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-lg active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner bg-amber-500/10">
              <Paperclip size={22} className="text-amber-400" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-wide">Brand Analysis</span>
          </button>

        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-20">
        <button className="bg-sky-500 text-white font-black w-14 h-14 rounded-full shadow-lg shadow-sky-500/30 flex items-center justify-center active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
