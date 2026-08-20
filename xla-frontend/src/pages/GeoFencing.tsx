import { ArrowLeft, UserRound, ShoppingBag, Building2, MapPin, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GeoFencing() {
  const navigate = useNavigate();

  const geoItems = [
    { label: 'Doctor', icon: UserRound, iconColor: 'text-white', bgColor: 'bg-rose-500' },
    { label: 'Chemist', icon: ShoppingBag, iconColor: 'text-white', bgColor: 'bg-blue-500' },
    { label: 'Stockist', icon: Building2, iconColor: 'text-white', bgColor: 'bg-emerald-500' },
    { label: 'Tagged', icon: MapPin, iconColor: 'text-white', bgColor: 'bg-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">Geo Fencing - Tag for DCR</h1>
        </div>
        <button className="text-rose-500 active:scale-95 transition-transform">
          <Youtube size={26} />
        </button>
      </div>

      <div className="px-5 py-6">
        <div className="grid grid-cols-2 gap-4">
          {geoItems.map((item, idx) => (
            <button 
              key={idx}
              className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 shadow-lg active:scale-95 transition-transform"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${item.bgColor}`}>
                <item.icon size={32} className={item.iconColor} />
              </div>
              <span className="text-sm font-black text-white uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
