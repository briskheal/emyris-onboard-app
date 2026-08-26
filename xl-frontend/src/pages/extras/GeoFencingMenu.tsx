import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Store, Package, PlaySquare } from 'lucide-react';

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
    <div className="min-h-full bg-[#f4f4f4] flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-[#e9ecef]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/extras')} className="text-slate-700">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-600 tracking-wider">Biolifesciences</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full bg-sky-500"></div>
          <div className="w-5 h-5 rounded-full bg-emerald-500"></div>
          <div className="flex flex-col gap-1 w-6">
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl flex-1 px-4 py-6 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] mt-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-sky-600">Geo Fencing - Tag for DCR</h2>
          <PlaySquare className="text-rose-500" size={24} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] active:scale-95 transition-transform"
            >
              <div className={`w-24 h-24 rounded-full ${item.color} flex items-center justify-center shadow-lg`}>
                {item.icon}
              </div>
              <span className="text-sm font-semibold text-slate-700">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
