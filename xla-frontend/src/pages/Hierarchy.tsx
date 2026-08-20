import { ArrowLeft, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hierarchy() {
  const navigate = useNavigate();
  const users = [
    { name: 'Kuldeep Singh', role: 'TBM', manager: 'Jnana Dash', city: 'DURG' },
    { name: 'Dhananjay Kumar', role: 'ASM', manager: 'Ravi Verma', city: 'RAJKOT' },
    { name: 'Vikas Sharma', role: 'TBM', manager: 'Kuldeep Singh', city: 'RAIPUR' },
    { name: 'Amit Patel', role: 'RSM', manager: 'Sanjay Gupta', city: 'AHMEDABAD' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans">
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-sky-400 active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-black text-white">My Hierarchy</h1>
      </div>

      <div className="px-5 py-4">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search team members..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="space-y-3">
          {users.map((user, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-lg active:bg-slate-700/80 transition-colors">
              <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-bold text-white leading-tight">{user.name}</h3>
                  <span className="bg-sky-500/20 text-sky-400 text-[10px] font-black px-2 py-0.5 rounded-full">{user.role}</span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">Reporting to: <span className="text-slate-300">{user.manager}</span></p>
                <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1 tracking-wide">{user.city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
