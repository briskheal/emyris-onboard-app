const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('import { Check }')) {
    c = c.replace("Search, Download, Activity, Sun } from 'lucide-react';", "Search, Download, Activity, Sun, Check } from 'lucide-react';");
}

const dropdownRegex = /\{userSearchOpen && \([\s\S]*?<div className="absolute top-full mt-2 right-0 w-\[260px\] bg-white dark:bg-\[\#212136\] border border-slate-200 dark:border-\[\#3b3b5a\] rounded-lg shadow-xl dark:shadow-2xl z-50 flex flex-col overflow-hidden max-h-\[240px\] overflow-y-auto">[\s\S]*?\{filteredUsers\.map\(u => \([\s\S]*?key=\{u\._id\}[\s\S]*?onClick=\{[\s\S]*?\}[\s\S]*?className="px-4 py-2\.5 hover:bg-slate-50 dark:hover:bg-\[\#1a1a2e\] cursor-pointer flex flex-col border-b border-slate-100 dark:border-\[\#3b3b5a\]\/30 last:border-0"[\s\S]*?>[\s\S]*?<span className="text-sm font-medium text-slate-800 dark:text-slate-200">\{[\s\S]*?\}<\/span>[\s\S]*?<span className="text-\[11px\] text-slate-500">\{u\.designation \|\| 'Staff'\}<\/span>[\s\S]*?<\/div>[\s\S]*?\)\)}[\s\S]*?\{filteredUsers\.length === 0 && \([\s\S]*?<div className="px-4 py-4 text-sm text-slate-500 text-center flex flex-col items-center">[\s\S]*?No users found[\s\S]*?<\/div>[\s\S]*?\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/;

const newDropdown = `{userSearchOpen && (
                          <div className="absolute top-full mt-2 right-0 w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl dark:shadow-2xl z-50 flex flex-col overflow-hidden max-h-[240px] overflow-y-auto">
                              {filteredUsers.map(u => (
                                  <div 
                                      key={u._id}
                                      onClick={() => { setSelectedDashboardUser(u); setUserSearchOpen(false); setUserSearchTerm(''); }}
                                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 last:border-0 group"
                                  >
                                      <div className="flex flex-col">
                                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition-colors">{(u.name || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '') || u.businessName) || ''}</span>
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
                      )}`;

c = c.replace(dropdownRegex, newDropdown);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed styling');
