const fs = require('fs');
let src = fs.readFileSync('xla-frontend/src/pages/ManageLocations.tsx', 'utf8');

// --- HQTab PATCH ---
src = src.replace(
    /function HQTab\(\) \{([\s\S]*?)const paginatedHqs = hqs.slice\(\(currentPage - 1\) \* pageSize, currentPage \* pageSize\);([\s\S]*?)<h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING \(\{hqs\.length\}\) HEADQUARTERS<\/h3>([\s\S]*?)<TableFooter data=\{hqs\} fileName="HQs"/,
    (match, p1, p2, p3) => {
        let newP1 = p1.replace("const [pageSize, setPageSize] = useState(10);", "const [pageSize, setPageSize] = useState(10);\n  const [searchTerm, setSearchTerm] = useState('');");
        
        let newPagination = "const searchedHqs = hqs.filter(h => (h.hqName||'').toLowerCase().includes(searchTerm.toLowerCase()) || (h.state||'').toLowerCase().includes(searchTerm.toLowerCase()));\n  const paginatedHqs = searchedHqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);";
        
        let newShowing = `<div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-400 tracking-wider uppercase">SHOWING ({searchedHqs.length}) HEADQUARTERS</h3>
        <input 
          type="text" 
          placeholder="Search HQ or State..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-sky-500 w-72"
        />
      </div>`;
        
        return `function HQTab() {${newP1}${newPagination}${p2}${newShowing}${p3}<TableFooter data={searchedHqs} fileName="HQs"`;
    }
);

// --- StateTab PATCH ---
src = src.replace(
    /function StateTab\(\) \{([\s\S]*?)const paginatedStates = states.slice\(\(currentPage - 1\) \* pageSize, currentPage \* pageSize\);([\s\S]*?)<h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING \(\{states\.length\}\) ENTRIES<\/h3>([\s\S]*?)<TableFooter data=\{states\} fileName="States"/,
    (match, p1, p2, p3) => {
        let newP1 = p1.replace("const [pageSize, setPageSize] = useState(10);", "const [pageSize, setPageSize] = useState(10);\n  const [searchTerm, setSearchTerm] = useState('');");
        
        let newPagination = "const searchedStates = states.filter(s => (s.stateName||'').toLowerCase().includes(searchTerm.toLowerCase()));\n  const paginatedStates = searchedStates.slice((currentPage - 1) * pageSize, currentPage * pageSize);";
        
        let newShowing = `<div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-400 tracking-wider uppercase">SHOWING ({searchedStates.length}) ENTRIES</h3>
        <input 
          type="text" 
          placeholder="Search State..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-sky-500 w-72"
        />
      </div>`;
        
        return `function StateTab() {${newP1}${newPagination}${p2}${newShowing}${p3}<TableFooter data={searchedStates} fileName="States"`;
    }
);

fs.writeFileSync('xla-frontend/src/pages/ManageLocations.tsx', src);
console.log('Successfully patched ManageLocations.tsx with robust regex.');
