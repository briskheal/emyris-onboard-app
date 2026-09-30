const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

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

// Replace lines 189 through 238
const lines = c.split('\n');
lines.splice(188, 50, newDropdown);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', lines.join('\n'));
console.log('Fixed Dropdown with exact splice.');
