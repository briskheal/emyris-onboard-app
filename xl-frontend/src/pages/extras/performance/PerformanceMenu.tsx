import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Paperclip, Building2, UserStar, Banknote, ShieldAlert } from 'lucide-react';

const TARGET_KPIS = [
  { id: 'brand', label: 'Brand Analysis', icon: Paperclip },
  { id: 'account', label: 'Account Wise Analysis', icon: Building2 },
  { id: 'keyCustomer', label: 'Key Customer Analysis', icon: UserStar },
  { id: 'roi', label: 'Customer ROI Analysis', icon: Banknote },
  { id: 'outstanding', label: 'Outstanding Analysis', icon: ShieldAlert },
];

export default function PerformanceMenu() {
  const navigate = useNavigate();
  const today = new Date();
  
  // Default to current month
  const [selectedMonth, setSelectedMonth] = useState(today.toLocaleString('en-US', { month: 'long' }).toLowerCase());
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const years = ['2025', '2026', '2027'];

  return (
    <div className="min-h-full bg-[#f4f4f4] flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#e9ecef]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-700">
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
        <h2 className="text-lg font-bold text-sky-600 mb-4">User Performance Analysis</h2>

        {/* Month & Year Selector */}
        <div className="flex gap-3 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Month</label>
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-white border-none rounded-xl text-slate-700 font-semibold h-10 px-3 shadow-sm focus:ring-2 focus:ring-sky-500"
            >
              {months.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Year</label>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-white border-none rounded-xl text-slate-700 font-semibold h-10 px-3 shadow-sm focus:ring-2 focus:ring-sky-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Effort Analysis (Auto-calculated) */}
        <button
          onClick={() => navigate(`/extras/performance/effort?month=${selectedMonth}&year=${selectedYear}`)}
          className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-8 active:scale-95 transition-transform border border-slate-50"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <Users size={24} className="text-slate-600" />
          </div>
          <span className="text-base font-semibold text-slate-700 flex-1 text-left">Effort Analysis</span>
        </button>

        {/* Add Achieved Targets section */}
        <h3 className="text-sm font-bold text-slate-800 mb-4">Add Achieved Targets</h3>
        
        <div className="space-y-4">
          {TARGET_KPIS.map(kpi => (
            <button
              key={kpi.id}
              onClick={() => navigate(`/extras/performance/targets/${kpi.id}?month=${selectedMonth}&year=${selectedYear}`)}
              className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] active:scale-95 transition-transform border border-slate-50"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <kpi.icon size={24} className="text-slate-600" />
              </div>
              <span className="text-base font-semibold text-slate-700 flex-1 text-left">{kpi.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
