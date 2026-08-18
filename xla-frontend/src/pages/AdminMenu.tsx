import { Menu, MessageSquare, Bell, UserPlus, Store, Building2, MapPin, Route, CheckSquare, TrendingUp, TrendingDown, Gift, Target } from 'lucide-react';

export default function AdminMenu() {
  const adminItems = [
    { label: 'Create Doctor', icon: UserPlus, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { label: 'Create Chemist', icon: Store, color: 'text-sky-400', bgColor: 'bg-sky-400/10' },
    { label: 'Create Stockist', icon: Building2, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    { label: 'Create City', icon: MapPin, color: 'text-rose-400', bgColor: 'bg-rose-400/10' },
    { label: 'Create Route', icon: Route, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
    { label: 'Approvals', icon: CheckSquare, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', badge: '2' },
    { label: 'Create Primary Sales', icon: TrendingUp, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { label: 'Create Secondary Sales', icon: TrendingDown, color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
    { label: 'Allot Gifts & Samples', icon: Gift, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { label: 'Add Target', icon: Target, color: 'text-sky-500', bgColor: 'bg-sky-500/10' }
  ];

  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-24 text-slate-100 font-sans">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
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
          </button>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-xl font-black text-white mb-6">Creation Menu</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {adminItems.map((item, idx) => (
            <button 
              key={idx}
              className="bg-slate-800 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform relative"
            >
              {item.badge && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                  {item.badge}
                </span>
              )}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bgColor}`}>
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
