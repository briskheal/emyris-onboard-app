import { useOutletContext } from 'react-router-dom';
import { 
  Menu, MessageSquare, Bell, Zap, FileText, CalendarDays, Route, 
  BarChart3, Receipt, MapPin, BellRing, List, Clock, PackageSearch, 
  TrendingUp, ShoppingCart, ClipboardList, CalendarRange, Box, Gift, Target, CheckCircle2 
} from 'lucide-react';

export default function Utilities() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();

  const utilitiesOptions = [
    { label: 'Quick Reports', description: 'Frequent used reports at a glance', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Call Reports', description: 'Records of visit with key details', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Tour Program', description: 'Planned visits, work areas and schedules', icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'Call Planning', description: 'Scheduled field visits and interactions', icon: Route, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Analysis Reports', description: 'View detailed analysis of the field performance', icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Expenses', description: 'Track and manage field expenses', icon: Receipt, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Geo-Fencing', description: 'Analyze location data and coverage', icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Reminder Call Reports', description: 'Logs of reminder calls and outcomes', icon: BellRing, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Lists', description: 'Data on doctors, chemists, products and more', icon: List, color: 'text-slate-400', bg: 'bg-slate-400/10' },
    { label: 'Missed Reports', description: 'Tracked missed visits for better follow-up', icon: Clock, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Primary Sales Reports', description: 'Track sales data to stockists', icon: PackageSearch, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Sales Insights', description: 'Graphical view of primary, secondary sales', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Secondary Sales Reports', description: 'Track sales from stockists to retailers', icon: ShoppingCart, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'POB Reports', description: 'Product booking details and values', icon: ClipboardList, color: 'text-lime-400', bg: 'bg-lime-400/10' },
    { label: 'Monthly Reports', description: 'Monthly summaries of all field calls', icon: CalendarRange, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
    { label: 'Sample Management', description: 'Reports on sample distribution, allotment and more', icon: Box, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    { label: 'Gift Management', description: 'Reports on gift distribution, allotment and more', icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Targets', description: 'Track Product wise and lump-sum sales targets', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
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
        <h2 className="text-xl font-black text-white mb-6">Utilities</h2>
        
        <div className="space-y-4">
          {utilitiesOptions.map((report, idx) => (
            <div key={idx} className="flex gap-4">
              <div className={`w-12 h-12 rounded-full ${report.bg} flex items-center justify-center flex-shrink-0`}>
                <report.icon size={20} className={report.color} />
              </div>
              <div className="flex-1 pb-4 border-b border-slate-800">
                <h3 className="font-bold text-white mb-1">{report.label}</h3>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {report.description}
                </p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    Quality Assured Report
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
