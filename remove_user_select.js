const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace('grid-cols-1 lg:grid-cols-4 gap-6 mb-6', 'grid-cols-1 lg:grid-cols-3 gap-6 mb-6');

const toReplace = `          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SELECT USER</label>
            <CustomUserSelect users={users} selectedUser={filterUser} onChange={setFilterUser} />
          </div>`;

c = c.replace(toReplace, '');

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Removed user select successfully');
