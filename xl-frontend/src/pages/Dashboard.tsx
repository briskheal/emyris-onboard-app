import { useState } from 'react';
import { TrendingUp, User, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');

  return (
    <div className="min-h-full bg-slate-900 flex flex-col font-sans pb-24 text-slate-100">
      
            {/* Placeholder for future Backlog Reporting & Messages */}
      <div id="dashboard-message-placeholder" className="hidden"></div>
      
      <div className="px-5 mt-4 space-y-8">
        
        {/* Filters Section */}
        <div>
          <h2 className="text-xl font-bold text-sky-400 mb-4">My Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <CheckCircle2 size={16} className="text-sky-400" />
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 font-semibold text-white focus:outline-none focus:border-sky-500"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={18} className="text-slate-400" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <CheckCircle2 size={16} className="text-sky-400" />
              </div>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 font-semibold text-white focus:outline-none focus:border-sky-500"
              >
                {['2025', '2026', '2027'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={18} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Performance */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-sky-400" />
            <h3 className="text-lg font-bold text-white">Sales Performance</h3>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg shadow-black/20 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-xs font-bold text-slate-400">Monthly Target</span>
              </div>
              <p className="text-2xl font-black text-white pl-4">₹700,000.00</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-bold text-emerald-400">Primary Sales</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">58.07%</span>
              </div>
              <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '58.07%' }}></div>
              </div>
              <p className="text-lg font-black text-sky-400 pl-4">₹406,484.92</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-slate-300">Secondary Sales</span>
                </div>
                <span className="text-xs font-bold text-blue-400">20.40%</span>
              </div>
              <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '20.40%' }}></div>
              </div>
              <p className="text-lg font-black text-sky-400 pl-4">₹142,766.00</p>
            </div>
          </div>
        </div>

        {/* Calls Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Calls (MTD)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 text-center tracking-wide">11 / 412</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Doctors</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400 text-center tracking-wide">4 / 108</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Chemists</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-400 text-center tracking-wide">1 / 24</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Stockists</span>
            </div>
          </div>
        </div>

        {/* POB Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Personal Order Booking</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">₹ 14.5K</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Dr. POB</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">₹ 4.2K</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Chem. POB</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
              <User size={24} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-400">₹ 0</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Stock. POB</span>
            </div>
          </div>
        </div>

        {/* Call Averages */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Call Averages</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg flex justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-2xl font-black text-sky-400">9.4</span>
                <p className="text-xs font-bold text-slate-400">Doctor's Call Average</p>
              </div>
              <div>
                <span className="text-2xl font-black text-sky-400">4.1</span>
                <p className="text-xs font-bold text-slate-400">Chemist's Call Average</p>
              </div>
              <div>
                <span className="text-2xl font-black text-sky-400">1.2</span>
                <p className="text-xs font-bold text-slate-400">Stockist's Call Average</p>
              </div>
            </div>
            
            {/* Visual Bar Graph */}
            <div className="flex items-end gap-3 h-36 pt-4 pr-2">
              <div className="w-4 bg-emerald-500 rounded-full h-[94%]"></div>
              <div className="w-4 bg-amber-400 rounded-full h-[41%]"></div>
              <div className="w-4 bg-rose-400 rounded-full h-[12%]"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
