import { useNavigate } from 'react-router-dom';
import { UserRound, ShoppingBag, Building2, Navigation, Banknote, FileSignature, NotebookPen, MapPin, Truck, Gift, Target, ShieldCheck, Map } from 'lucide-react';

const approvalModules = [
  { path: 'Call Report', icon: UserRound, label: 'Call Report' },
  { path: 'Tour Program', icon: Navigation, label: 'Tour Program' },
  { path: 'Call Plans', icon: NotebookPen, label: 'Call Plans' },
  { path: 'Doctors', icon: UserRound, label: 'Doctors' },
  { path: 'Chemists', icon: ShoppingBag, label: 'Chemists' },
  { path: 'Stockists', icon: Building2, label: 'Stockists' },
  { path: 'Expense', icon: Banknote, label: 'Expense' },
  { path: 'Leave Request', icon: FileSignature, label: 'Leave Request' },
  { path: 'City', icon: MapPin, label: 'City' },
  { path: 'Routes', icon: Map, label: 'Routes' },
  { path: 'Samples', icon: Truck, label: 'Samples' },
  { path: 'Gifts', icon: Gift, label: 'Gifts' },
  { path: 'Primary Sales', icon: Target, label: 'Primary Sales' },
  { path: 'Secondary Sales', icon: ShieldCheck, label: 'Secondary Sales' },
  { path: 'Geo Fencing', icon: Navigation, label: 'Geo Fencing' },
];

export default function ApprovalsLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-800 pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sky-400 font-medium">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-white">Approvals</h1>
          <p className="text-xs text-slate-400">Select a module to view pending approvals.</p>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 gap-3">
        {approvalModules.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(`/creation/approvals/${item.path}`)}
            className="w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-5 py-4 flex flex-row items-center justify-start gap-4 shadow-lg transition-transform active:scale-95"
          >
            <item.icon size={20} className="text-slate-300" />
            <span className="text-sm font-bold text-slate-200">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
