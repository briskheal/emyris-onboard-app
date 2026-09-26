const fs = require('fs');
let content = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx', 'utf8');

// 1. Add imports
match = content.match(/import EmyrisDateRangePicker\b.*?;/i);
if (match) {
  content = content.replace(match[0], match[0] + "\n" + "import CustomUserSelect from '../components/CustomUserSelect';\nimport axios from 'axios';");
}

// 2. Add state and fetch logic
const stateLogic = `  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 8, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 21));
  const [frequencyReport, setFrequencyReport] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [adminsRes, usersRes] = await Promise.all([
          axios.get('/api/admin/admins'),
          axios.get('/api/admin/users')
        ]);
        let all: any[] = [];
        if (adminsRes.data && adminsRes.data.success) {
          all = [...all, ...adminsRes.data.admins.map((x: any) => ({ ...x, isAdmin: true }))];
        }
        if (usersRes.data && usersRes.data.success) {
          all = [...all, ...usersRes.data.users.map((x: any) => ({ ...x, isAdmin: false }))];
        }
        setUsers(all);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();
  }, []);`;

content = content.replace(
  /  const \[startDate, setStartDate\] = useState<Date \| null>\(new Date\(2026, 8, 1\)\);\s*const \[endDate, setEndDate\] = useState<Date \| null>\(new Date\(2026, 8, 21\)\);\s*const \[frequencyReport, setFrequencyReport\] = useState\(false\);/,
  stateLogic);

if (!content.includes('useEffect')) {
  content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
}

	// 3. Replace the UI block
const oldUiBlock = `{/{* Select User Area *}}
          <div className="mb-6">
            <label className="text-xs font-bold text-emerald-400 mb-2 block">Select User</label>
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-between bg-[#242538] border border-emerald-500/30 rounded-md px-4 py-2 min-w-[250px]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    <UserPlus size={12} className="text-slate-300" />
                  </div>
                  <div className="text-left">
                    <p className="text.xs font-bold text-white leading-none">Jigar Joshi</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Sales Manager</p>
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400 ml-4" />
              </button>
            </div>
          </div>`;

const newUiBlock = `{/{* Select User Area *}}
          <div className="mb-6 w-full max-w-sm">
            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 block">Select User</label>
            <CustomUserSelect 
              users={users}
              selectedUser={selectedUser}
              onChange={(current) => setSelectedUser(current)}
            />
          </div>`;

content = content.replace(oldUiBlock, newUiBlock);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx', content);
