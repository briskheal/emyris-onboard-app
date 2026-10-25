import { useNavigate } from 'react-router-dom';
import { extrasOptions } from '../config/navigation';

export default function Extras() {
  const navigate = useNavigate();
  const options = extrasOptions;

  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-36 md:pb-12 text-slate-100 font-sans">
      <div className="px-5 mt-6">
        <h2 className="text-xl font-black text-white mb-6">Extras</h2>
        
        <div className="grid grid-cols-2 gap-4 pb-16">
          {options.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => navigate(item.path)}
              className="bg-slate-800 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform relative"
            >
              {item.isNew && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                  New
                </span>
              )}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bg}`}>
                <item.icon size={28} className={item.color} />
              </div>
              <span className="text-xs font-bold text-slate-300 text-center px-2">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
