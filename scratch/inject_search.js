const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  "const [selectedDivision, setSelectedDivision] = useState('');",
  "const [selectedDivision, setSelectedDivision] = useState('');\n  const [searchTerm, setSearchTerm] = useState('');"
);

const filterOld = `    if (selectedDivision && u.division !== selectedDivision) return false;
    return true;`;
const filterNew = `    if (selectedDivision && u.division !== selectedDivision) return false;
    if (searchTerm) {
      const full = (u.firstName + ' ' + (u.lastName || '')).toLowerCase();
      if (!full.includes(searchTerm.toLowerCase())) return false;
    }
    return true;`;
c = c.replace(filterOld, filterNew);

const uiOld = `<div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Showing ({filteredUsers.length}) Entries</h3>
          {selectedHq && (`;
const uiNew = `<div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">Showing ({filteredUsers.length}) Entries</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search user..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500 w-full md:w-64"
              />
            </div>
          </div>
          {selectedHq && (`;
c = c.replace(uiOld, uiNew);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Injected inline search bar in AccessControlTab.');
