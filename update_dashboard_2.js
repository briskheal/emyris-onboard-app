const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// The EXACT string of the existing user dropdown in Dashboard.tsx
const oldDropdown = `<div className="relative w-[220px]">
                      <div 
                          onClick={() => setUserSearchOpen(!userSearchOpen)}
                          className="flex items-center justify-between bg-[#1a1a2e] border border-emerald-500/30 rounded-lg px-4 w-full h-[42px] cursor-pointer text-sm text-[#8b8baf] font-semibold transition-colors hover:border-emerald-500/50"
                      >
                          <div className="flex items-center gap-2 truncate">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold overflow-hidden border border-emerald-500/30">
                                  {selectedDashboardUser ? selectedDashboardUser.name?.charAt(0) : <img src={\`https://ui-avatars.com/api/?name=\${encodeURIComponent(userName)}&background=0D8ABC&color=fff\`} alt="User" className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex flex-col truncate text-left">
                                  <span className="font-semibold text-xs leading-none text-slate-200 truncate">{selectedDashboardUser ? selectedDashboardUser.name : userName}</span>
                                  <span className="text-[9px] text-slate-500 font-bold tracking-wider mt-0.5">{selectedDashboardUser ? selectedDashboardUser.designation || 'STAFF' : 'ADMIN'}</span>
                              </div>
                          </div>
                          <ChevronDown size={16} className="text-slate-500 shrink-0" />
                      </div>
                      {userSearchOpen && (
                          <div className="absolute top-full mt-2 right-0 w-[260px] bg-[#212136] border border-[#3b3b5a] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
                              <div className="p-2 border-b border-[#3b3b5a] bg-[#1a1a2e]">
                                  <input 
                                      type="text" 
                                      placeholder="Search users..."
                                      autoFocus
                                      value={userSearchTerm}
                                      onChange={(e) => setUserSearchTerm(e.target.value)}
                                      className="w-full bg-[#2a2a40] text-slate-200 px-3 py-1.5 rounded-md text-sm outline-none border border-[#3b3b5a] focus:border-emerald-500/50"
                                  />
                              </div>
                              <div className="overflow-y-auto max-h-[240px]">
                                  {filteredUsers.map(u => (
                                      <div 
                                          key={u._id}
                                          onClick={() => { setSelectedDashboardUser(u); setUserSearchOpen(false); setUserSearchTerm(''); }}
                                          className="px-4 py-2.5 hover:bg-[#1a1a2e] cursor-pointer flex flex-col border-b border-[#3b3b5a]/30 last:border-0"
                                      >
                                          <span className="text-sm font-medium text-slate-200">{u.name}</span>
                                          <span className="text-[11px] text-slate-500">{u.employeeId} - {u.designation || 'Staff'}</span>
                                      </div>
                                  ))}
                                  {filteredUsers.length === 0 && (
                                      <div className="px-4 py-6 text-sm text-slate-500 text-center flex flex-col items-center">
                                          <span className="mb-2 text-xl">🔍</span>
                                          No users found
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>`;

const newDropdown = `                  <div className="relative w-[220px]">
                      <div className="flex items-center bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-emerald-500/30 rounded-lg h-[42px] px-3 focus-within:border-emerald-500/50 transition-colors shadow-sm dark:shadow-none">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold overflow-hidden border border-emerald-500/20 dark:border-emerald-500/30 shrink-0">
                              {selectedDashboardUser ? selectedDashboardUser.name?.charAt(0) : 'U'}
                          </div>
                          <input 
                              type="text"
                              placeholder={selectedDashboardUser ? selectedDashboardUser.name : "Search users..."}
                              value={userSearchOpen ? userSearchTerm : (selectedDashboardUser ? selectedDashboardUser.name : '')}
                              onChange={(e) => {
                                  setUserSearchTerm(e.target.value);
                                  if (!userSearchOpen) setUserSearchOpen(true);
                              }}
                              onFocus={() => {
                                  setUserSearchOpen(true);
                                  setUserSearchTerm('');
                              }}
                              onBlur={() => setTimeout(() => setUserSearchOpen(false), 200)}
                              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-[#8b8baf] font-semibold w-full ml-2 truncate placeholder:text-slate-400 dark:placeholder:text-[#8b8baf]"
                          />
                          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-1" />
                      </div>
                      {userSearchOpen && (
                          <div className="absolute top-full mt-2 right-0 w-[260px] bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a] rounded-lg shadow-xl dark:shadow-2xl z-50 flex flex-col overflow-hidden max-h-[240px] overflow-y-auto">
                              {filteredUsers.map(u => (
                                  <div 
                                      key={u._id}
                                      onClick={() => { setSelectedDashboardUser(u); setUserSearchOpen(false); setUserSearchTerm(''); }}
                                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1a1a2e] cursor-pointer flex flex-col border-b border-slate-100 dark:border-[#3b3b5a]/30 last:border-0"
                                  >
                                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                                      <span className="text-[11px] text-slate-500">{u.designation || 'Staff'}</span>
                                  </div>
                              ))}
                              {filteredUsers.length === 0 && (
                                  <div className="px-4 py-4 text-sm text-slate-500 text-center flex flex-col items-center">
                                      No users found
                                  </div>
                              )}
                          </div>
                      )}
                  </div>`;

if(c.includes(oldDropdown)) {
    c = c.replace(oldDropdown, newDropdown);
    console.log("Replaced Dropdown OK");
} else {
    console.log("Could not find the dropdown string exactly. Need to fix.");
}

c = c.replace(/export default function Dashboard\(\) \{/, `export default function Dashboard() {\n  const [isLightMode, setIsLightMode] = useState(true);`);
c = c.replace(/<button className="text-\[\#8b8baf\] hover:text-amber-400 transition-colors relative hidden sm:flex items-center gap-1 group" title="Change Theme">/, `<button onClick={() => setIsLightMode(!isLightMode)} className="text-slate-500 dark:text-[#8b8baf] hover:text-amber-500 dark:hover:text-amber-400 transition-colors relative hidden sm:flex items-center gap-1 group" title="Toggle Theme">`);
c = c.replace(/<div className="min-h-full bg-\[\#1a1a2e\] flex flex-col pb-24 text-slate-100 font-sans">/, `<div className={"min-h-full flex flex-col pb-24 font-sans transition-colors " + (isLightMode ? "bg-slate-50 text-slate-900" : "bg-[#1a1a2e] text-slate-100 dark")}>`);

// Safe replace logic for all tailwind classes
c = c.replace(/bg-\[\#212136\]/g, 'bg-white dark:bg-[#212136]');
c = c.replace(/bg-\[\#1e1e30\]/g, 'bg-white dark:bg-[#1e1e30]');
c = c.replace(/bg-\[\#27273f\]/g, 'bg-slate-100 dark:bg-[#27273f]');
c = c.replace(/bg-\[\#1a1a2e\]/g, 'bg-slate-50 dark:bg-[#1a1a2e]');
c = c.replace(/border-\[\#3b3b5a\]/g, 'border-slate-200 dark:border-[#3b3b5a]');
c = c.replace(/text-slate-100/g, 'text-slate-800 dark:text-slate-100');
c = c.replace(/text-slate-200/g, 'text-slate-800 dark:text-slate-200');
c = c.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
c = c.replace(/text-\[\#8b8baf\]/g, 'text-slate-500 dark:text-[#8b8baf]');
c = c.replace(/text-white/g, 'text-slate-900 dark:text-white');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Saved');
