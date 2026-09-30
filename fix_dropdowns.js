const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// 1. Add state variables for users and search
const stateVars = `
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDashboardUser, setSelectedDashboardUser] = useState<any>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // For the native month input
  const [monthInput, setMonthInput] = useState('2026-09');
`;
if (!c.includes('const [users, setUsers] = useState<any[]>([])')) {
    c = c.replace(/const \[notifications, setNotifications\] = useState<any\[\]>\(\[\]\);/g, "const [notifications, setNotifications] = useState<any[]>([]);" + stateVars);
}

// 2. Fetch users on mount
const fetchUsersLogic = `
  useEffect(() => {
    axios.get('/api/admin/users').then(res => {
      if (res.data.success) {
        setUsers(res.data.users || res.data.data || []);
      }
    }).catch(e => console.error(e));
  }, []);
`;
if (!c.includes("axios.get('/api/admin/users')")) {
    c = c.replace(/useEffect\(\(\) => \{\s*axios\.get\('\/api\/xl\/admin\/notifications'\)/, fetchUsersLogic + "\n  useEffect(() => {\n    axios.get('/api/xl/admin/notifications')");
}

// 3. Render logic for month string
const renderLogic = `
  const dateObj = new Date(monthInput + '-01');
  const monthName = dateObj.toLocaleString('default', { month: 'long' });
  const yearStr = dateObj.getFullYear().toString();
  const filteredUsers = users.filter(u => (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) || (u.employeeId || '').toLowerCase().includes(userSearchTerm.toLowerCase()));
`;
if (!c.includes('const dateObj = new Date(monthInput')) {
    c = c.replace(/const userName = user\?\.name \|\| user\?\.firstName \|\| user\?\.businessName \|\| 'User';/, "const userName = user?.name || user?.firstName || user?.businessName || 'User';\n" + renderLogic);
}

// 4. Update the title "Statistics for September 2026"
c = c.replace(/<h3 className="text-lg font-bold text-slate-200">Statistics for September 2026<\/h3>/g, `<h3 className="text-lg font-bold text-slate-200">Statistics for {monthName} {yearStr}</h3>`);

// 5. Replace the two dropdowns
const newDropdowns = `
                  <div className="relative">
                    <input 
                      type="month" 
                      className="bg-[#1a1a2e] border border-sky-500/30 rounded-lg px-4 h-[42px] w-[220px] text-[#8b8baf] font-semibold text-sm outline-none focus:border-sky-500 transition-colors"
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                    />
                  </div>
                  
                  <div className="relative w-[220px]">
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

c = c.replace(/<div className="flex items-center justify-between bg-\[\#1a1a2e\] border border-sky-500\/30 rounded-lg px-4 py-2 min-w-\[160px\] cursor-pointer">[\s\S]*?<ChevronDown size=\{16\} className="text-slate-500 ml-2" \/>\s*<\/div>/, newDropdowns);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Done');
