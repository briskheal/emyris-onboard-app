const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
    "const [targetType, setTargetType] = useState('Select...');", 
    "const [targetType, setTargetType] = useState('Select...');\n  const [productSearch, setProductSearch] = useState('');"
);

c = c.replace(
    '<h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Product Details</h3>', 
    `<div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Product Details</h3>
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
              </div>
            </div>`
);

// We need to safely replace productTargets.map((p, idx) with the filtered version
// and update the onChange handlers to use the absolute index instead of the filtered index idx.
c = c.replace(
    'productTargets.map((p, idx) => (', 
    'productTargets.map((p, idx) => ({p, idx})).filter(({p}) => p.productName.toLowerCase().includes(productSearch.toLowerCase())).map(({p, idx}) => ('
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Search logic added!');
