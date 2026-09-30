import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, MessageSquare, Bell, Trophy, TrendingUp, User, ChevronDown, Search, Download, Activity, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [selectedMonth] = useState('Sep');
  const [selectedYear] = useState('2026');
  const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();

  return (
    <div className="min-h-full bg-[#1a1a2e] flex flex-col pb-24 text-slate-100 font-sans">
      
      {/* Sticky Header - Modernized with Search Bar */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-[#1e1e30] z-20 border-b border-[#3b3b5a] shadow-lg">
        <div className="flex items-center flex-1 max-w-xl">
          <button onClick={openDrawer} className="text-slate-400 hover:text-white mr-4 active:scale-95 transition-transform md:hidden">
            <Menu size={24} />
          </button>
          
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8baf]" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-[#27273f] border border-[#3b3b5a]/50 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-[#8b8baf]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <button className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all">
            <span>Upgrade to Advance Plan</span>
          </button>
          <button className="hidden lg:flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-500/20 transition-all">
            <span>Refer & Earn</span>
          </button>
          
          <button className="text-[#8b8baf] hover:text-sky-400 transition-colors relative hidden sm:block">
            <MessageSquare size={20} />
          </button>
          <button className="text-[#8b8baf] hover:text-emerald-400 transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              1
            </span>
          </button>
          
          <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-[#3b3b5a]">
             <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center overflow-hidden border border-slate-500">
               <img src="https://ui-avatars.com/api/?name=Jnana&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
             </div>
             <span className="text-sm font-medium text-slate-200 hidden sm:block">Jnana</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-8">
        
        {/* Welcome Banner & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-5 shadow-lg">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
                 <span className="text-xl">✨</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">Hi Jnana, glad to see you again 👋</h2>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 bg-[#27273f] border border-[#3b3b5a] text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95">
                 <Download size={16} className="text-sky-400" />
                 Consolidated Reports
              </button>
              <button className="flex items-center gap-2 bg-[#27273f] border border-[#3b3b5a] text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95">
                 <Activity size={16} className="text-emerald-400" />
                 Today's Activity
              </button>
           </div>
        </div>

        {/* Graph Section (Target vs Primary vs Secondary & Reports Submitted) */}
        <div className="bg-[#212136] rounded-2xl shadow-lg border border-[#3b3b5a]/50 p-5 md:p-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <h3 className="text-lg font-bold text-slate-200">Statistics for September 2026</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center justify-between bg-[#1a1a2e] border border-sky-500/30 rounded-lg px-4 py-2 min-w-[160px] cursor-pointer">
                    <span className="font-semibold text-sm text-[#8b8baf]">{selectedMonth}, {selectedYear}</span>
                    <Calendar size={16} className="text-slate-500 ml-2" />
                  </div>
                  <div className="flex items-center justify-between bg-[#1a1a2e] border border-emerald-500/30 rounded-lg px-4 py-2 min-w-[200px] cursor-pointer">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                           <img src="https://ui-avatars.com/api/?name=Jnana+Dash&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-xs leading-none text-slate-200">Jnana Dash</span>
                            <span className="text-[9px] text-slate-500 font-bold tracking-wider mt-0.5">ADMIN</span>
                        </div>
                    </div>
                    <ChevronDown size={16} className="text-slate-500 ml-2" />
                  </div>
              </div>
           </div>

           {/* The Two Graphs */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
              {/* Graph 1: Target vs Primary vs Secondary */}
              <div className="flex flex-col relative w-full pr-4 pb-8 pl-12">
                 <div className="absolute inset-0 pl-12 pb-8 pr-4 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-[#8b8baf]">1000000</span></div>
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-[#8b8baf]">800000</span></div>
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-[#8b8baf]">600000</span></div>
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-[#8b8baf]">400000</span></div>
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-[#8b8baf]">200000</span></div>
                    <div className="border-t border-[#3b3b5a] w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-[#8b8baf]">0</span></div>
                 </div>
                 
                 <div className="relative h-64 flex items-end justify-around w-full z-10 pt-2 border-l border-[#3b3b5a]">
                    <div className="w-14 md:w-20 bg-sky-500 h-[100%] transition-all hover:opacity-90 relative group"></div>
                    <div className="w-14 md:w-20 bg-emerald-500 h-[55%] transition-all hover:opacity-90 relative group"></div>
                    <div className="w-14 md:w-20 bg-orange-500 h-[30%] transition-all hover:opacity-90 relative group"></div>
                 </div>
                 
                 <div className="flex justify-around mt-4 text-xs font-semibold text-[#8b8baf] ml-[-12px]">
                    <span className="w-14 md:w-20 text-center">Target</span>
                    <span className="w-14 md:w-20 text-center">Primary</span>
                    <span className="w-14 md:w-20 text-center">Secondary</span>
                 </div>
                 <h4 className="text-center mt-8 text-sm font-bold text-slate-300">Target vs Primary vs Secondary</h4>
              </div>

              {/* Graph 2: Reports Submitted */}
              <div className="flex flex-col relative w-full pr-4 pb-8 pl-8">
                 <div className="absolute inset-0 pl-8 pb-8 pr-4 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-8 -top-2.5 text-[10px] text-[#8b8baf]">60</span></div>
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-8 -top-2.5 text-[10px] text-[#8b8baf]">40</span></div>
                    <div className="border-t border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-8 -top-2.5 text-[10px] text-[#8b8baf]">20</span></div>
                    <div className="border-t border-[#3b3b5a] w-full h-0 relative"><span className="absolute -left-8 -top-2.5 text-[10px] text-[#8b8baf]">0</span></div>
                 </div>
                 
                 <div className="relative h-64 flex items-end justify-around w-full z-10 pt-2 border-l border-[#3b3b5a]">
                    <div className="w-14 md:w-20 bg-sky-500 h-[95%] transition-all hover:opacity-90 relative group"></div>
                    <div className="w-14 md:w-20 bg-emerald-500 h-[15%] transition-all hover:opacity-90 relative group"></div>
                    <div className="w-14 md:w-20 bg-orange-500 h-[10%] transition-all hover:opacity-90 relative group"></div>
                 </div>
                 
                 <div className="flex justify-around mt-4 text-xs font-semibold text-[#8b8baf] ml-[-8px]">
                    <span className="w-14 md:w-20 text-center">Doctor</span>
                    <span className="w-14 md:w-20 text-center">Chemist</span>
                    <span className="w-14 md:w-20 text-center">Stockist</span>
                 </div>
                 <h4 className="text-center mt-8 text-sm font-bold text-slate-300">Reports Submitted</h4>
              </div>
           </div>
        </div>

        {/* Existing Content moved below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performers */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-amber-400" />
              <h3 className="text-lg font-bold text-white">Top Performers</h3>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-4 shadow-lg shadow-black/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-400 flex items-center justify-center bg-amber-400/10 shrink-0">
                    <Trophy size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white line-clamp-1">Kuldeep Si...</h4>
                    <p className="text-xs font-medium text-slate-400 uppercase">Durg</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                  <div className="bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-lg mt-0.5">10.1</div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-4 shadow-lg shadow-black/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-slate-300/10 shrink-0">
                    <Trophy size={18} className="text-slate-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white line-clamp-1">Dhananjay ...</h4>
                    <p className="text-xs font-medium text-slate-400 uppercase">Rajkot</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                  <div className="bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-lg mt-0.5">5.8</div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-4 shadow-lg shadow-black/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-orange-400 flex items-center justify-center bg-orange-400/10 shrink-0">
                    <Trophy size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white line-clamp-1">Jnana Dash</h4>
                    <p className="text-xs font-medium text-slate-400 uppercase">Hyderabad</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                  <div className="bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-lg mt-0.5">4.5</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Performance */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Sales Performance</h3>
            </div>
            
            <div className="bg-[#212136] rounded-3xl p-6 border border-[#3b3b5a]/50 shadow-lg shadow-black/20 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {/* Monthly Target Box */}
                <div className="bg-slate-900/50 rounded-2xl p-5 border border-[#3b3b5a] flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#8b8baf]"></div>
                    <span className="text-xs font-bold text-[#8b8baf] tracking-wider uppercase">Monthly Target</span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">₹700k</div>
                </div>

                {/* Progress Bars */}
                <div className="md:col-span-2 flex flex-col justify-center space-y-6">
                  {/* Primary Sales */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-sm font-semibold text-emerald-400">Primary Sales</span>
                      </div>
                      <span className="text-xs font-bold text-sky-400">58.07%</span>
                    </div>
                    <div className="h-2 w-full bg-[#1a1a2e] rounded-full overflow-hidden border border-[#3b3b5a]/30">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '58.07%' }}></div>
                    </div>
                    <div className="mt-2 text-xl font-bold text-sky-400 tracking-wide">
                      ₹406,484.92
                    </div>
                  </div>
                  
                  {/* Secondary Sales */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                        <span className="text-sm font-semibold text-sky-400">Secondary Sales</span>
                      </div>
                      <span className="text-xs font-bold text-sky-400">20.40%</span>
                    </div>
                    <div className="h-2 w-full bg-[#1a1a2e] rounded-full overflow-hidden border border-[#3b3b5a]/30">
                      <div className="h-full bg-sky-400 rounded-full" style={{ width: '20.4%' }}></div>
                    </div>
                    <div className="mt-2 text-xl font-bold text-sky-400 tracking-wide">
                      ₹142,766.00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calls Section and Call Averages */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
          {/* Calls vs Targets */}
          <div className="lg:col-span-3">
            <h3 className="text-lg font-bold text-white mb-4">Calls vs Targets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User size={32} className="text-emerald-400" />
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-emerald-400 block mb-1">11 <span className="text-sm font-semibold text-slate-500">/ 4127</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctor Calls</span>
                </div>
              </div>
              
              <div className="bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <User size={32} className="text-amber-400" />
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-amber-400 block mb-1">1 <span className="text-sm font-semibold text-slate-500">/ 0</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chemist Calls</span>
                </div>
              </div>

              <div className="bg-[#212136] border border-[#3b3b5a]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <User size={32} className="text-rose-400" />
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-rose-400 block mb-1">3 <span className="text-sm font-semibold text-slate-500">/ 0</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stockist Calls</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call Averages */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Call Averages</h3>
            <div className="bg-[#212136] border border-[#3b3b5a]/50 rounded-3xl p-6 shadow-lg h-[calc(100%-2rem)] flex flex-col justify-between">
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
    </div>
  );
}
