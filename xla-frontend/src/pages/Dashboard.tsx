import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, MessageSquare, Bell, Trophy, TrendingUp, User, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [selectedMonth] = useState('August');
  const [selectedYear] = useState('2026');
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();

  return (
    <div className="min-h-full bg-slate-900 flex flex-col pb-24 text-slate-100 font-sans">
      
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 sticky top-0 bg-slate-900 z-10">
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
            <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              22
            </span>
          </button>
        </div>
      </div>

      <div className="px-5 mt-2 space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        
        {/* Filters Section */}
        <div className="md:col-span-2 lg:col-span-3 lg:flex lg:items-center lg:justify-between mb-2">
          <h2 className="text-xl font-bold text-sky-400 mb-4 lg:mb-0">Stats for the Month</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="grid grid-cols-2 sm:flex gap-3">
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-sky-400" />
                  <span className="font-semibold">{selectedMonth}</span>
                </div>
                <ChevronDown size={18} className="text-slate-400 ml-2" />
              </button>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-sky-400" />
                  <span className="font-semibold">{selectedYear}</span>
                </div>
                <ChevronDown size={18} className="text-slate-400 ml-2" />
              </button>
            </div>

            <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sky-400">
                  <User size={16} />
                </div>
                <span className="font-semibold text-slate-300">Select User</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs font-bold text-emerald-400">37</span>
                <ChevronDown size={18} className="text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Top Performers */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-amber-400" />
            <h3 className="text-lg font-bold text-white">Top Performers</h3>
          </div>
          
          <div className="space-y-3 flex-1">
            {/* Rank 1 */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg shadow-black/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-amber-400 flex items-center justify-center bg-amber-400/10">
                  <Trophy size={18} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Kuldeep Si...</h4>
                  <p className="text-xs font-medium text-slate-400 uppercase">Durg</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                <div className="bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-lg mt-0.5">
                  10.1
                </div>
              </div>
            </div>

            {/* Rank 2 */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg shadow-black/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-slate-300/10">
                  <Trophy size={18} className="text-slate-300" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Dhananjay ...</h4>
                  <p className="text-xs font-medium text-slate-400 uppercase">Rajkot</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                <div className="bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-lg mt-0.5">
                  5.8
                </div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg shadow-black/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-orange-400 flex items-center justify-center bg-orange-400/10">
                  <Trophy size={18} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Jnana Dash</h4>
                  <p className="text-xs font-medium text-slate-400 uppercase">Hyderabad</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                <div className="bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-lg mt-0.5">
                  4.5
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Performance */}
        <div className="flex flex-col h-full lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-sky-400" />
            <h3 className="text-lg font-bold text-white">Sales Performance</h3>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg shadow-black/20 space-y-5 flex-1 lg:grid lg:grid-cols-3 lg:space-y-0 lg:gap-6 lg:items-center">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Target</span>
              </div>
              <p className="text-3xl font-black text-white pl-4">₹700k</p>
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
              <p className="text-lg font-black text-emerald-400 pl-4">₹406,484.92</p>
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
              <p className="text-lg font-black text-blue-400 pl-4">₹142,766.00</p>
            </div>
          </div>
        </div>

        {/* Calls Section */}
        <div className="md:col-span-2 lg:col-span-3">
          <h3 className="text-lg font-bold text-white mb-4">Calls vs Targets</h3>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <User size={32} className="text-emerald-400" />
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-black text-emerald-400 block mb-1">11 <span className="text-sm font-semibold text-slate-500">/ 4127</span></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctor Calls</span>
              </div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <User size={32} className="text-amber-400" />
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-black text-amber-400 block mb-1">1 <span className="text-sm font-semibold text-slate-500">/ 0</span></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chemist Calls</span>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                <User size={32} className="text-rose-400" />
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-black text-rose-400 block mb-1">1 <span className="text-sm font-semibold text-slate-500">/ 0</span></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stockist Calls</span>
              </div>
            </div>
          </div>
        </div>

        {/* POB Section */}
        <div className="md:col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Personal Order Booking (POB)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg col-span-2">
              <User size={28} className="text-emerald-400 mb-2" />
              <span className="text-3xl font-black text-emerald-400 mb-1">11</span>
              <span className="text-xs font-bold text-slate-400 uppercase text-center">Doctors Met</span>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg col-span-2">
              <User size={28} className="text-amber-400 mb-2" />
              <span className="text-3xl font-black text-amber-400 mb-1">2086</span>
              <span className="text-xs font-bold text-slate-400 uppercase text-center">Total Doctors</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Doctor POB</span>
              <span className="text-lg font-black text-emerald-400">₹0</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chemist POB</span>
              <span className="text-lg font-black text-amber-400">₹0</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stockist POB</span>
              <span className="text-lg font-black text-rose-400">₹0</span>
            </div>
          </div>
        </div>

        {/* Call Averages */}
        <div className="md:col-span-1 lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4">Call Averages</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-lg h-[calc(100%-2rem)] flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-3xl font-black text-emerald-400">0.9</span>
                </div>
                <p className="text-xs font-bold text-slate-400 ml-6 uppercase tracking-wider">Doctor Call Average</p>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-3xl font-black text-amber-400">0.1</span>
                </div>
                <p className="text-xs font-bold text-slate-400 ml-6 uppercase tracking-wider">Chemist Call Average</p>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <span className="text-3xl font-black text-rose-400">0.3</span>
                </div>
                <p className="text-xs font-bold text-slate-400 ml-6 uppercase tracking-wider">Stockist Call Average</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
