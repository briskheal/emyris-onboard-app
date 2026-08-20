import { useOutletContext } from 'react-router-dom';
import { Menu, MessageSquare, Bell, UserPlus, Store, Building2, MapPin, Route, CheckSquare, TrendingUp, TrendingDown, Gift, Target } from 'lucide-react';

export default function AdminMenu() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();
  
  const adminItems = [
    { label: 'Create Doctor', description: 'Add new doctor profiles', icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Create Chemist', description: 'Add new chemist profiles', icon: Store, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'Create Stockist', description: 'Add new stockist profiles', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Create City', description: 'Add and manage territories', icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Create Route', description: 'Define travel routes', icon: Route, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Approvals', description: 'Pending request approvals', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10', badge: '2' },
    { label: 'Create Primary Sales', description: 'Log primary sales data', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Create Secondary Sales', description: 'Log secondary sales data', icon: TrendingDown, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Allot Gifts & Samples', description: 'Manage sample distribution', icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Add Target', description: 'Set monthly KPIs', icon: Target, color: 'text-sky-500', bg: 'bg-sky-500/10' }
  ];

  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-24 text-slate-100 font-sans">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
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

      <div className="px-5 mt-6">
        <h2 className="text-xl font-black text-white mb-6">Creation Menu</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {adminItems.map((item, idx) => (
            <button key={idx} className="bg-slate-800 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 relative shadow-lg active:scale-95 transition-transform">
              
              {item.badge && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {item.badge}
                </div>
              )}

              <div className={`w-14 h-14 rounded-full ${item.bg} flex items-center justify-center mb-1`}>
                <item.icon size={28} className={item.color} />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-200 text-sm leading-tight">{item.label}</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
