import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, ChevronDown, Download, Activity, Check, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDashboardUser, setSelectedDashboardUser] = useState<any>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // For the native month input
  const [monthInput, setMonthInput] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
      const [year, monthNum] = monthInput.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[parseInt(monthNum) - 1];
      
      let url = `/api/xl/admin/dashboard-stats?month=${month}&year=${year}`;
      if (selectedDashboardUser) {
          url += `&employeeId=${selectedDashboardUser.uid || selectedDashboardUser.employeeId || selectedDashboardUser._id}`;
      }
      
      axios.get(url).then(res => {
          if (res.data.success) {
              setDashboardStats(res.data.data);
          }
      }).catch(e => console.error(e));
  }, [monthInput, selectedDashboardUser]);

  useEffect(() => {
    axios.get('/api/admin/users').then(res => {
      if (res.data.success) {
        setUsers(res.data.users || res.data.data || []);
      }
    }).catch(e => console.error(e));
  }, []);

  const userStr = sessionStorage.getItem('xla_user') || localStorage.getItem('xla_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || user?.firstName || user?.businessName || 'User';

  const dateObj = new Date(monthInput + '-01');
  const monthName = dateObj.toLocaleString('default', { month: 'long' });
  const yearStr = dateObj.getFullYear().toString();
  const filteredUsers = users.filter(u => ((u.name || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '') || u.businessName) || '').toLowerCase().includes(userSearchTerm.toLowerCase()) || (u.employeeId || '').toLowerCase().includes(userSearchTerm.toLowerCase()));

  return (
    <div className="min-h-full flex flex-col pb-24 font-sans transition-colors bg-slate-50 dark:bg-[#1a1a2e] text-slate-900 dark:text-slate-100 p-5 md:p-6 space-y-6">
      <div className="space-y-6">
        
        {/* Welcome Banner & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a]/50 rounded-2xl p-5 shadow-lg">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
                 <span className="text-xl">✨</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Hi {userName}, glad to see you again 👋</h2>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 bg-slate-100 dark:bg-[#27273f] border border-slate-200 dark:border-[#3b3b5a] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95">
                 <Download size={16} className="text-sky-400" />
                 Consolidated Reports
              </button>
              <button className="flex items-center gap-2 bg-slate-100 dark:bg-[#27273f] border border-slate-200 dark:border-[#3b3b5a] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95">
                 <Activity size={16} className="text-emerald-400" />
                 Today's Activity
              </button>
           </div>
        </div>

        {/* Graph Section (Target vs Primary vs Secondary & Reports Submitted) */}
        <div className="bg-white dark:bg-[#212136] rounded-2xl shadow-lg border border-slate-200 dark:border-[#3b3b5a]/50 p-5 md:p-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Statistics for {monthName} {yearStr}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                  
                  <div className="relative">
                    <div 
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="flex items-center justify-between bg-slate-50 dark:bg-[#1a1a2e] border border-sky-500/30 rounded-lg px-4 h-[42px] w-[220px] text-slate-500 dark:text-[#8b8baf] font-semibold text-sm cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <span>{monthName} {yearStr}</span>
                      <Calendar size={16} />
                    </div>
                    {showMonthPicker && (
                      <div className="absolute top-[48px] left-0 w-[260px] bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-4">
                         <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-slate-700 dark:text-white">{yearStr}</span>
                            <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); setMonthInput((parseInt(yearStr)-1)+'-'+monthInput.split('-')[1]) }} className="p-1 hover:bg-slate-100 dark:hover:bg-[#2a2a40] rounded text-slate-500"><ChevronDown className="rotate-90" size={16} /></button>
                               <button onClick={(e) => { e.stopPropagation(); setMonthInput((parseInt(yearStr)+1)+'-'+monthInput.split('-')[1]) }} className="p-1 hover:bg-slate-100 dark:hover:bg-[#2a2a40] rounded text-slate-500"><ChevronDown className="-rotate-90" size={16} /></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                               const mNum = String(i+1).padStart(2, '0');
                               const isSel = monthInput === yearStr+'-'+mNum;
                               return (
                                 <div 
                                    key={m} 
                                    onClick={() => { setMonthInput(yearStr+'-'+mNum); setShowMonthPicker(false); }}
                                    className={`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${isSel ? 'bg-sky-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2a40]'}`}
                                 >{m}</div>
                               )
                            })}
                         </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative w-[220px]">
                      <div className="flex items-center bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded-xl h-[42px] px-3 focus-within:border-emerald-500/50 transition-colors shadow-sm dark:shadow-none cursor-text" onClick={() => { const el = document.getElementById('user-search-input'); if (el) { el.focus(); el.click(); } }}>
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold overflow-hidden border border-emerald-500/20 dark:border-emerald-500/30 shrink-0">
                              {selectedDashboardUser ? (selectedDashboardUser.name || (selectedDashboardUser.firstName ? selectedDashboardUser.firstName + ' ' + (selectedDashboardUser.lastName || '') : '') || selectedDashboardUser.businessName || '')?.charAt(0) : 'U'}
                          </div>
                          <input 
                              id="user-search-input"
                              type="text"
                              placeholder={selectedDashboardUser ? (selectedDashboardUser.name || (selectedDashboardUser.firstName ? selectedDashboardUser.firstName + ' ' + (selectedDashboardUser.lastName || '') : '') || selectedDashboardUser.businessName || '') : "Search users..."}
                              value={userSearchOpen ? userSearchTerm : (selectedDashboardUser ? (selectedDashboardUser.name || (selectedDashboardUser.firstName ? selectedDashboardUser.firstName + ' ' + (selectedDashboardUser.lastName || '') : '') || selectedDashboardUser.businessName || '') : '')}
                              onChange={(e) => {
                                  setUserSearchTerm(e.target.value);
                                  if (!userSearchOpen) setUserSearchOpen(true);
                              }}
                              onFocus={() => {
                                  setUserSearchOpen(true);
                                  setUserSearchTerm('');
                              }}
                              onBlur={() => setTimeout(() => setUserSearchOpen(false), 200)}
                              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-500 dark:text-[#8b8baf] font-semibold w-full ml-2 truncate placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-[#8b8baf]"
                          />
                          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-1 cursor-pointer pointer-events-none" />
                      </div>
                      {userSearchOpen && (
                          <div className="absolute top-full mt-2 right-0 w-[260px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl dark:shadow-2xl z-50 flex flex-col overflow-hidden max-h-[240px] overflow-y-auto">
                              {filteredUsers.map(u => (
                                  <div 
                                      key={u._id}
                                      onMouseDown={(e) => { e.preventDefault(); setSelectedDashboardUser(u); setUserSearchOpen(false); setUserSearchTerm(''); }}
                                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 last:border-0 group"
                                  >
                                      <div className="flex flex-col">
    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition-colors">{u.name || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '') || u.businessName || 'Unnamed User'}</span>
    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mt-0.5">{u.designation || 'Staff'}</span>
</div>
{selectedDashboardUser?._id === u._id && (
    <Check size={16} className="text-sky-500" />
)}
                                  </div>
                              ))}
                              {filteredUsers.length === 0 && (
                                  <div className="px-4 py-4 text-sm text-slate-500 text-center flex flex-col items-center">
                                      No users found
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
           </div>

           {/* The Two Graphs */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
              {/* Graph 1: Target vs Primary vs Secondary */}
              {(() => {
                 const targetSales = dashboardStats ? dashboardStats.target : 0;
                 const primarySales = dashboardStats ? dashboardStats.primary : 0;
                 const secondarySales = dashboardStats ? dashboardStats.secondary : 0;
                 const maxS = Math.max(targetSales, primarySales, secondarySales, 1000);
                 const maxSales = Math.ceil(maxS / 1000) * 1000;
                 return (
                 <div className="flex flex-col relative w-full pr-4 pb-8 pl-12">
                    <div className="absolute inset-0 pl-12 pb-8 pr-4 flex flex-col justify-between pointer-events-none">
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{maxSales}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.8)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.6)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.4)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.2)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a] w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">0</span></div>
                    </div>
                    
                    <div className="relative h-64 flex items-end justify-around w-full z-10 pt-2 border-l border-slate-200 dark:border-[#3b3b5a]">
                       <div className="w-14 md:w-20 bg-sky-500 transition-all hover:opacity-90 relative group" title={'₹' + targetSales.toLocaleString()} style={{height: `${(targetSales/maxSales)*100}%`}}></div>
                       <div className="w-14 md:w-20 bg-emerald-500 transition-all hover:opacity-90 relative group" title={'₹' + primarySales.toLocaleString()} style={{height: `${(primarySales/maxSales)*100}%`}}></div>
                       <div className="w-14 md:w-20 bg-orange-500 transition-all hover:opacity-90 relative group" title={'₹' + secondarySales.toLocaleString()} style={{height: `${(secondarySales/maxSales)*100}%`}}></div>
                    </div>
                    
                    <div className="flex justify-around mt-4 text-xs font-semibold text-slate-500 dark:text-[#8b8baf] ml-[-12px]">
                       <span className="w-14 md:w-20 text-center">Target</span>
                       <span className="w-14 md:w-20 text-center">Primary</span>
                       <span className="w-14 md:w-20 text-center">Secondary</span>
                    </div>
                    
                    <div className="text-center mt-6 text-sm font-bold text-slate-700 dark:text-white">Target vs Primary vs Secondary</div>
                 </div>
                 );
              })()}

              {/* Graph 2: Reports Submitted */}
              {(() => {
                 const docCalls = dashboardStats?.calls?.doctor?.actual || 0;
                 const chemCalls = dashboardStats?.calls?.chemist?.actual || 0;
                 const stockCalls = dashboardStats?.calls?.stockist?.actual || 0;
                 const maxR = Math.max(docCalls, chemCalls, stockCalls, 10);
                 const maxRep = Math.ceil(maxR / 10) * 10;
                 return (
                 <div className="flex flex-col relative w-full pr-4 pb-8 pl-12">
                    <div className="absolute inset-0 pl-12 pb-8 pr-4 flex flex-col justify-between pointer-events-none">
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{maxRep}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.8)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.6)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.4)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.2)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a] w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">0</span></div>
                    </div>
                    
                    <div className="relative h-64 flex items-end justify-around w-full z-10 pt-2 border-l border-slate-200 dark:border-[#3b3b5a]">
                       <div className="w-14 md:w-20 bg-sky-500 transition-all hover:opacity-90 relative group" title={String(docCalls)} style={{height: `${(docCalls/maxRep)*100}%`}}></div>
                       <div className="w-14 md:w-20 bg-emerald-500 transition-all hover:opacity-90 relative group" title={String(chemCalls)} style={{height: `${(chemCalls/maxRep)*100}%`}}></div>
                       <div className="w-14 md:w-20 bg-orange-500 transition-all hover:opacity-90 relative group" title={String(stockCalls)} style={{height: `${(stockCalls/maxRep)*100}%`}}></div>
                    </div>

                    <div className="flex justify-around mt-4 text-xs font-semibold text-slate-500 dark:text-[#8b8baf] ml-[-12px]">
                       <span className="w-14 md:w-20 text-center">Doctor</span>
                       <span className="w-14 md:w-20 text-center">Chemist</span>
                       <span className="w-14 md:w-20 text-center">Stockist</span>
                    </div>
                    
                    <div className="text-center mt-6 text-sm font-bold text-slate-700 dark:text-white">Reports Submitted</div>
                 </div>
                 );
              })()}
           </div>
        </div>

        {/* Calls Section and Call Averages */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
          {/* Calls vs Targets */}
          <div className="lg:col-span-3 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Calls vs Targets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 flex-1">
              <div className="bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User size={32} className="text-emerald-400" />
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-emerald-400 block mb-1">{dashboardStats?.calls?.doctor?.actual || 0} <span className="text-sm font-semibold text-slate-500">/ {dashboardStats?.calls?.doctor?.target || 0}</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctor Calls</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <User size={32} className="text-amber-400" />
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-amber-400 block mb-1">{dashboardStats?.calls?.chemist?.actual || 0} <span className="text-sm font-semibold text-slate-500">/ {dashboardStats?.calls?.chemist?.target || 0}</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chemist Calls</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <User size={32} className="text-rose-400" />
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-rose-400 block mb-1">{dashboardStats?.calls?.stockist?.actual || 0} <span className="text-sm font-semibold text-slate-500">/ {dashboardStats?.calls?.stockist?.target || 0}</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stockist Calls</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call Averages */}
          <div className="lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Call Averages</h3>
            <div className="bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a]/50 rounded-2xl p-6 shadow-lg flex-1 flex flex-col justify-center gap-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-3xl font-black text-emerald-400">{dashboardStats?.calls?.doctor?.target ? (dashboardStats.calls.doctor.actual / dashboardStats.calls.doctor.target).toFixed(1) : 0}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 ml-6 uppercase tracking-wider">Doctor Call Average</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <span className="text-3xl font-black text-amber-400">{dashboardStats?.calls?.chemist?.target ? (dashboardStats.calls.chemist.actual / dashboardStats.calls.chemist.target).toFixed(1) : 0}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 ml-6 uppercase tracking-wider">Chemist Call Average</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <span className="text-3xl font-black text-rose-400">{dashboardStats?.calls?.stockist?.target ? (dashboardStats.calls.stockist.actual / dashboardStats.calls.stockist.target).toFixed(1) : 0}</span>
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




