import { Menu, MessageSquare, Bell, FileText, CheckCircle2 } from 'lucide-react';

export default function Utilities() {
  const reports = [
    { title: 'Quick Reports', desc: 'Frequent used reports at a glance' },
    { title: 'Call Reports', desc: 'Records of visit with key details' },
    { title: 'Tour Program', desc: 'Planned visits, work areas and schedules' },
    { title: 'Call Planning', desc: 'Scheduled field visits and interactions' },
    { title: 'Analysis Reports', desc: 'View detailed analysis of the field performance' },
    { title: 'Expenses', desc: 'Track and manage field expenses' },
    { title: 'Geo-Fencing', desc: 'Analyze location data and coverage' },
    { title: 'Reminder Call Reports', desc: 'Logs of reminder calls and outcomes' },
    { title: 'Lists', desc: 'Data on doctors, chemists, products and more' },
    { title: 'Missed Reports', desc: 'Tracked missed visits for better follow-up' },
    { title: 'Primary Sales Reports', desc: 'Track sales data to stockists' },
    { title: 'Sales Insights', desc: 'Graphical view of primary, secondary sales' },
    { title: 'Secondary Sales Reports', desc: 'Track sales from stockists to retailers' },
    { title: 'POB Reports', desc: 'Product booking details and values' },
    { title: 'Monthly Reports', desc: 'Monthly summaries of all field calls' },
    { title: 'Sample Management', desc: 'Reports on sample distribution and allotment' },
    { title: 'Gift Management', desc: 'Reports on gift distribution and allotment' },
    { title: 'Targets', desc: 'Goals vs achievements tracking' },
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
        <h2 className="text-xl font-black text-white mb-6">Utilities</h2>
        
        <div className="space-y-4">
          {reports.map((report, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex gap-4 shadow-lg items-center active:bg-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                <FileText size={24} className="text-sky-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-[15px] leading-tight">{report.title}</h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1 leading-snug">{report.desc}</p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center">
                <CheckCircle2 size={18} className="text-emerald-400 mb-1" />
                <span className="text-[7px] font-black uppercase text-emerald-400 max-w-[40px] text-center leading-[9px]">Quality Assured Report</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
