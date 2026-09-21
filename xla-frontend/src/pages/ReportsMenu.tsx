import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Menu, MessageSquare, Bell, ClipboardList, MapPin, Search, CalendarClock, 
  Map, PhoneMissed, Copy, TrendingUp, BarChart3, LineChart, Tag, 
  ListOrdered, Target, Goal, CalendarRange, Download, Briefcase
} from 'lucide-react';

export default function ReportsMenu() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();
  
  const navigate = useNavigate();

  const reportItems = [
    { label: 'TOUR PROGRAM', icon: Map, path: '/extras/tour-program-reports' },
    { label: 'CALL REPORTS', icon: ClipboardList, path: '/report' },
    { label: 'REMINDER CALLS REPORTS', icon: CalendarClock, path: '/reports/reminders' },
    { label: 'MISSED REPORTS', icon: PhoneMissed, path: '/reports/missed' },
    { label: 'DCS DUPLICATE ENTRIES', icon: Copy, path: '/reports/dcs-duplicates' },
    { label: 'SALES INSIGHTS', icon: TrendingUp, path: '/reports/sales-insights' },
    { label: 'PRIMARY SALES REPORTS', icon: BarChart3, path: '/reports/primary-sales' },
    { label: 'SECONDARY SALES REPORTS', icon: LineChart, path: '/reports/secondary-sales' },
    { label: 'PRODUCT-WISE REPORTS', icon: Tag, path: '/reports/product-wise' },
    { label: 'LISTS', icon: ListOrdered, path: '/utilities/lists' },
    { label: 'TARGET', icon: Target, path: '/reports/target' },
    { label: 'POB REPORTS', icon: Goal, path: '/reports/pob' },
    { label: 'MONTHLY REPORTS', icon: CalendarRange, path: '/reports/monthly' },
    { label: 'ANNUAL REPORTS', icon: CalendarRange, path: '/reports/annual' },
    { label: 'GEO-LOCATION ANALYSIS REPORT', icon: MapPin, path: '/reports/geo-location' },
    { label: 'EXPENSE REPORTS', icon: Briefcase, path: '/reports/expenses' },
    { label: 'CHECKIN / CHECKOUT REPORT', icon: CalendarClock, path: '/reports/checkin-checkout' },
    { label: 'CALL PLANNING REPORTS', icon: Search, path: '/reports/call-planning' },
    { label: 'DOWNLOAD REPORTS', icon: Download, path: '/reports/download' }
  ];

  return (
    <div className="min-h-full bg-slate-900 flex flex-col font-sans pb-24 text-slate-100">
      
      {/* Sticky Header (Mobile Only) */}
      <div className="md:hidden flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
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

      <div className="px-5 mt-6 md:p-8">
        
        {/* Desktop Banner */}
        <div className="hidden md:block bg-slate-800 border-l-4 border-sky-500 rounded-r-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">REPORTS</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
            Access detailed reports and insights.
          </p>
        </div>

        {/* Mobile Title */}
        <h2 className="md:hidden text-xl font-black text-white mb-6 uppercase tracking-wide">REPORTS</h2>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {reportItems.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => item.path && navigate(item.path)}
              className="group bg-slate-800/80 border border-slate-700/80 hover:border-sky-500/50 rounded-3xl md:rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-5 relative shadow-lg hover:bg-slate-800 transition-all active:scale-95 min-h-[140px] md:min-h-[180px]"
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
