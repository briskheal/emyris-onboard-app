const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageLocations.tsx', 'utf8');

c = c.replace('import { ArrowLeft, Trash2, Edit }', 'import { ArrowLeft, Trash2, Edit, Search }');

c = c.replace(
  'const paginatedHqs = hqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);',
  `const [hqSearch, setHqSearch] = useState('');
  const filteredHqs = hqs.filter(h => 
    (h.hqName && h.hqName.toLowerCase().includes(hqSearch.toLowerCase())) || 
    (h.state && h.state.toLowerCase().includes(hqSearch.toLowerCase()))
  );
  const paginatedHqs = filteredHqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);`
);

const oldHeader = '<h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({hqs.length}) ENTRIES</h3>';
const newHeader = `
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <h3 className="text-lg font-bold text-slate-400 tracking-wider uppercase">SHOWING ({filteredHqs.length}) ENTRIES</h3>
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search HQ or State..." 
            value={hqSearch} 
            onChange={e => { setHqSearch(e.target.value); setCurrentPage(1); }} 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>
`;

c = c.replace(oldHeader, newHeader);
c = c.replace(/<TableFooter data=\{hqs\}/, '<TableFooter data={filteredHqs}');

fs.writeFileSync('xla-frontend/src/pages/ManageLocations.tsx', c);
console.log('Added HQ search logic');
