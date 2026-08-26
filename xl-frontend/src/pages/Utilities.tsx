import { useNavigate } from 'react-router-dom';
import { LogOut, 
  Zap, FileText, CalendarDays, Route, BarChart3, Receipt, MapPin, 
  BellRing, List, Clock, PackageSearch, TrendingUp, ShoppingCart, 
  ClipboardList, CalendarRange, Box, Gift, Target
} from 'lucide-react';

const utilitiesOptions = [
  { id: 1, label: 'Quick Reports', description: 'Frequent used reports at a glance', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', path: '#' },
  { id: 2, label: 'Call Reports', description: 'Records of visit with key details', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', path: '#' },
  { id: 3, label: 'Tour Program', description: 'Planned visits, work areas and schedules', icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-500/10', path: '/extras/tour-program' },
  { id: 4, label: 'Call Planning', description: 'Scheduled field visits and interactions', icon: Route, color: 'text-orange-400', bg: 'bg-orange-500/10', path: '/extras/call-plan' },
  { id: 5, label: 'Analysis Reports', description: 'View detailed analysis of the field performance', icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '#' },
  { id: 6, label: 'Expenses', description: 'Track and manage field expenses', icon: Receipt, color: 'text-rose-400', bg: 'bg-rose-500/10', path: '/extras/expense' },
  { id: 7, label: 'Geo-Fencing', description: 'Analyze location data and coverage', icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: '/extras/geo-fencing' },
  { id: 9, label: 'Reminder Call Reports', description: 'Logs of reminder calls and outcomes', icon: BellRing, color: 'text-yellow-400', bg: 'bg-yellow-500/10', path: '#' },
  { id: 10, label: 'Lists', description: 'Data on doctors, chemists, products and more', icon: List, color: 'text-slate-400', bg: 'bg-slate-500/10', path: '#' },
  { id: 11, label: 'Missed Reports', description: 'Tracked missed visits for better follow-up', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10', path: '#' },
  { id: 12, label: 'Primary Sales Reports', description: 'Track sales data to stockists', icon: PackageSearch, color: 'text-cyan-400', bg: 'bg-cyan-500/10', path: '#' },
  { id: 13, label: 'Sales Insights', description: 'Graphical view of primary, secondary sales', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10', path: '#' },
  { id: 14, label: 'Secondary Sales Reports', description: 'Track sales from stockists to retailers', icon: ShoppingCart, color: 'text-pink-400', bg: 'bg-pink-500/10', path: '#' },
  { id: 15, label: 'POB Reports', description: 'Product booking details and values', icon: ClipboardList, color: 'text-lime-400', bg: 'bg-lime-500/10', path: '#' },
  { id: 16, label: 'Monthly Reports', description: 'Monthly summaries of all field calls', icon: CalendarRange, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', path: '#' },
  { id: 17, label: 'Sample Management', description: 'Reports on sample distribution, allotment and more', icon: Box, color: 'text-teal-400', bg: 'bg-teal-500/10', path: '#' },
  { id: 18, label: 'Gift Management', description: 'Reports on gift distribution, allotment and more', icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '#' },
  { id: 19, label: 'Targets', description: 'Track Product wise and lump-sum sales targets', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '#' },
];

export default function Utilities() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-900 pb-8">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-slate-800 to-slate-900 sticky top-0 z-10 flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Module</p>
          <h1 className="text-2xl font-bold text-white">Utilities</h1>
          <p className="text-sm text-slate-400 mt-1">Reports, analytics & management</p>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('xl_user');
            navigate('/login');
          }}
          className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-transform"
        >
          <LogOut size={16} />
          LOGOUT
        </button>
      </div>

      <div className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {utilitiesOptions.map((item) => (
            <button 
              key={item.id}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`bg-slate-800 border border-slate-700 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform relative ${item.path !== '#' ? 'active:scale-95' : 'opacity-70 cursor-not-allowed'}`}
            >
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
