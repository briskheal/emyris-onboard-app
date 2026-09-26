const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const oldCode = `<div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
          {selectedHq && (
             <button 
                onClick={() => { setIsUnlocking(allFilteredLocked); setShowConfirm(true); }} 
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
                {allFilteredLocked ? 'Unlock All Users In HQ' : 'Lock All Users In HQ'}
             </button>
          )}
        </div>`;

const newCode = `<div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">Showing ({filteredUsers.length}) Entries</h3>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 ml-0 md:ml-auto w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search user..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500 w-full md:w-64"
              />
            </div>
            {selectedHq && (
               <button 
                  onClick={() => { setIsUnlocking(allFilteredLocked); setShowConfirm(true); }} 
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap w-full md:w-auto">
                  {allFilteredLocked ? 'Unlock All Users In HQ' : 'Lock All Users In HQ'}
               </button>
            )}
          </div>
        </div>`;

if (c.includes(oldCode)) {
  c = c.replace(oldCode, newCode);
  fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
  console.log("Successfully moved search bar to the right side!");
} else {
  console.log("Could not find the exact code block to replace.");
}
