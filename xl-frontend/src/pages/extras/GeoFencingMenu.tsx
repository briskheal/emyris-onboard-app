import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Store, Package } from 'lucide-react';

export default function GeoFencingMenu() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Doctor',
      icon: <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="Doctor" className="w-16 h-16 rounded-full shadow-lg" />,
      color: 'bg-rose-500',
      path: '/extras/geo-fencing/tag/doctor'
    },
    {
      title: 'Chemist',
      icon: <Store size={40} className="text-white" />,
      color: 'bg-sky-500',
      path: '/extras/geo-fencing/tag/chemist'
    },
    {
      title: 'Stockist',
      icon: <Package size={40} className="text-white" />,
      color: 'bg-emerald-500',
      path: '/extras/geo-fencing/tag/stockist'
    },
    {
      title: 'Tagged',
      icon: <MapPin size={40} className="text-white fill-amber-300" />,
      color: 'bg-rose-500',
      path: '/extras/geo-fencing/tagged'
    }
  ];

  return (
    <div className="min-h-full bg-[#1c1c2e] flex flex-col font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/extras')} className="text-slate-300">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tight">Geo Fencing</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tag for DCR</h2>

        <div className="grid grid-cols-2 gap-6">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="bg-[#27273f] border border-[#3b3b5a] rounded-3xl p-4 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:bg-[#3b3b5a]/50 aspect-square shadow-xl shadow-black/20"
            >
              <div className={`w-24 h-24 rounded-full ${item.color} bg-opacity-10 border border-white/5 flex items-center justify-center`}>
                <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                  {item.icon}
                </div>
              </div>
              <span className="text-base font-black tracking-wide text-slate-200">{item.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-12 bg-sky-900/20 border border-sky-500/20 p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center mb-3">
            <MapPin size={24} className="text-sky-400" />
          </div>
          <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest mb-2">Secure Your Territory</h3>
          <p className="text-xs font-semibold text-slate-400 leading-relaxed">
            Accurate geo-tagging ensures seamless daily reporting (DCR) and faster expense approvals. Start your day by securing your territory!
          </p>
        </div>
      </div>
    </div>
  );
}
