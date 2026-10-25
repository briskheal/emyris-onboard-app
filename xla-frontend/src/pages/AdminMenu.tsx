import { useNavigate } from 'react-router-dom';
import { adminItems } from '../config/navigation';

export default function AdminMenu() {
  const navigate = useNavigate();
  const items = adminItems;

  return (
    <div className="min-h-full bg-slate-900 flex flex-col font-sans pb-36 md:pb-12 text-slate-100">
      <div className="px-5 mt-6 md:p-8 space-y-8">
        
        {/* Desktop Banner */}
        <div className="hidden md:block bg-slate-800 border-l-4 border-emerald-500 rounded-r-xl p-6 shadow-lg">
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Welcome to the Admin Panel</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
            Admins sometime refuse editing, deleting or making some changes in the software. You can always reach out to us in case anything goes wrong. Anything that you edit or modify can be rolled back to the previous version.
          </p>
        </div>

        {/* Mobile Title */}
        <h2 className="md:hidden text-xl font-black text-white mb-6 uppercase tracking-wide">Admin Panel</h2>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 pb-16">
          {items.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => item.path && navigate(item.path)}
              className="group bg-slate-800/80 border border-slate-700/80 hover:border-sky-500/50 rounded-3xl md:rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-5 relative shadow-lg hover:bg-slate-800 transition-all active:scale-95 min-h-[140px] md:min-h-[200px]"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-700/50 group-hover:bg-sky-500/10 flex items-center justify-center transition-colors">
                <item.icon size={32} strokeWidth={1.5} className="text-white group-hover:text-sky-400 transition-colors" />
              </div>
              <div className="text-center w-full px-2">
                <h3 className="font-bold text-white text-xs leading-tight tracking-wide">{item.label}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
