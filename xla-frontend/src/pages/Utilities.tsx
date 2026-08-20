import { useOutletContext } from 'react-router-dom';
import { 
  Menu, MessageSquare, Bell, FileText, CalendarDays, 
  BarChart3, Receipt, MapPin, BellRing, List, Clock, PackageSearch, 
  TrendingUp, ShoppingCart, ClipboardList, CalendarRange, Box, Target, CheckCircle2 
} from 'lucide-react';

export default function Utilities() {
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();

  const utilitiesOptions = [
    { label: 'TOUR PROGRAM', description: 'Access detailed reports of field Tour Programs submitted by users, outlining their planned doctor visits, working areas, and daily schedule.', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'CALL REPORTS', description: 'Access official records of doctor, chemist, and stockist visits made by Medical Representatives, including visit dates, covered areas, and key visit details.', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'REMINDER CALLS REPORTS', description: 'Reminder Calls Reports record all reminder calls, including dates and outcomes, ensuring timely follow-ups and effective communication tracking.', icon: BellRing, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'MISSED REPORTS', description: 'Missed Call Reports track visits made to doctors, stockists, and chemists, highlighting those missed. They help identify coverage gaps and improve follow-up efficiency.', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'DCS DUPLICATE ENTRIES', description: 'DCS Duplicate Entries help find and fix repeated records of doctors, chemists, and stockists to keep the information accurate and organized.', icon: List, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'SALES INSIGHTS', description: 'Graphical insights of primary, secondary, and combined sales for complete visibility along with their report types User-Wise, Stockist-Wise and Headquarter-Wise.', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'PRIMARY SALES REPORTS', description: 'Provide detailed data on pharmaceutical sales to doctors, chemists, and stockists, including quantities and dates, helping in accurate tracking and planning.', icon: PackageSearch, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    { label: 'SECONDARY SALES REPORTS', description: 'Secondary Sales Reports track pharmaceutical product movement from stockists to retailers, including sales volumes and dates. They support monitoring distribution performance.', icon: ShoppingCart, color: 'text-lime-400', bg: 'bg-lime-400/10' },
    { label: 'PRODUCT-WISE REPORTS', description: 'Product-Wise Reports summarize key metrics for each product, including primary and secondary quantities, free stock, and closing stock, enabling effective inventory and sales management.', icon: Box, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'LISTS', description: 'This list consolidates essential data such as doctors, chemists, stockists, products, gifts, routes, holidays, and geofencing details, streamlining field management and operational planning.', icon: ClipboardList, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
    { label: 'TARGET', description: 'Target Reports summarize product-wise sales targets, including amount and quantity, helping track progress and ensure goal achievement.', icon: Target, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'POB REPORTS', description: 'POB Reports track the details of Products on Booking, including quantities and value, providing insights into order status and sales performance.', icon: Receipt, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'MONTHLY REPORTS', description: 'Monthly Call Reports summarize all calls made by field staff to doctors, chemists, and stockists, highlighting call frequency and outcomes to assess engagement and performance.', icon: CalendarRange, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'ANNUAL REPORTS', description: 'Annual Call Reports summarize yearly calls made by field staff to doctors, chemists, and stockists, highlighting call frequency and outcomes to assess engagement and performance.', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'GEO-LOCATION ANALYSIS REPORT', description: 'Geo-Location Analysis Report tracks and analyzes the geographic locations of field activities, helping optimize routes, monitor coverage, and improve overall field efficiency.', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'EXPENSE REPORTS', description: 'Expense Reports record field-related expenses such as food, travel tickets, hotel stays, and other costs, enabling effective budget management and cost control.', icon: Receipt, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="min-h-full md:h-dvh bg-slate-900 flex flex-col pb-24 md:pb-0 text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sticky Header */}
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

      <div className="flex-1 px-5 md:px-8 py-6 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:block mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Reports</h2>
        </div>

        {/* MOBILE HEADER */}
        <h2 className="md:hidden text-xl font-black text-white mb-6">Utilities</h2>
        
        {/* Desktop Grid / Mobile List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-8">
          {utilitiesOptions.map((report, idx) => (
            <div key={idx} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 rounded-2xl p-5 md:p-6 transition-all group shadow-lg flex gap-4 md:gap-5 items-start relative overflow-hidden">
              {/* Desktop Decorative Glow */}
              <div className="hidden md:block absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity z-0 pointer-events-none"></div>

              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${report.bg} flex items-center justify-center flex-shrink-0 z-10`}>
                <report.icon size={24} className={`${report.color} md:w-7 md:h-7`} />
              </div>
              <div className="flex-1 z-10">
                <h3 className="font-black text-white mb-2 text-sm md:text-base tracking-wide flex items-center justify-between">
                  {report.label}
                  <CheckCircle2 size={16} className="text-emerald-500 hidden md:block" />
                </h3>
                <p className="text-xs text-slate-400 md:text-slate-300 leading-relaxed md:leading-loose pr-4">
                  {report.description}
                </p>
                
                {/* Mobile Quality badge */}
                <div className="md:hidden flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
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
