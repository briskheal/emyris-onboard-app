const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

// Title
f = f.replace(
  '{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}',
  '{loadedStatus === \\\'Approved\\\' ? \\\'VIEW PRIMARY SALES\\\' : editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}'
);

// Stockist mapper
f = f.replace('const [header, setHeader] = useState({', `
  const getStockistName = (val: string) => {
    if (!val) return '';
    const s = stockists.find(x => x.uid === val || x._id === val || x.businessName === val);
    return s ? (s.businessName || s.name || val) : val;
  };

  const getProductName = (val: string) => {
    if (!val) return '';
    const p = productsMaster.find(x => x.uid === val || x._id === val || x.productName === val);
    return p ? (p.productName || val) : val;
  };

  const [header, setHeader] = useState({`);

// Fix Stockist rendering
f = f.replace(
  '<span className={header.stockist ? \\\'text-white\\\' : \\\'text-slate-500\\\'}>\\n                  {header.stockist || \\\'-- Search & Select Stockist --\\\'}',
  '<span className={header.stockist ? \\\'text-white\\\' : \\\'text-slate-500\\\'}>\\n                  {getStockistName(header.stockist) || \\\'-- Search & Select Stockist --\\\'}'
);

// Fix Product rendering
f = f.replace(
  '<span className={`text-sm font-bold truncate ${item.product ? \\\'text-white\\\' : \\\'text-slate-500\\\'}`}>\\n                      {item.product || \\\'-- Search & Select Product --\\\'}',
  '<span className={`text-sm font-bold truncate ${item.product ? \\\'text-white\\\' : \\\'text-slate-500\\\'}`}>\\n                      {getProductName(item.product) || \\\'-- Search & Select Product --\\\'}'
);

// Fix Inputs
f = f.replace(
  '<input type="number" min="0" value={item.qty || \\\'\\\'}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.qty || \\\'\\\'}'
);
f = f.replace(
  '<input type="number" min="0" value={item.free || \\\'\\\'}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.free || \\\'\\\'}'
);
f = f.replace(
  '<input type="number" min="0" value={item.discount || \\\'\\\'}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.discount || \\\'\\\'}'
);
f = f.replace(
  '<input type="number" min="0" value={item.purcRtn || \\\'\\\'}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.purcRtn || \\\'\\\'}'
);
f = f.replace(
  '<input type="number" min="0" value={item.rtnPrice || \\\'\\\'}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.rtnPrice || \\\'\\\'}'
);
f = f.replace(
  '<input type="number" min="0" value={item.basePrice || \\\'\\\'}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.basePrice || \\\'\\\'}'
);
f = f.replace(
  '<input type="checkbox" checked={item.exp}',
  '<input disabled={loadedStatus === \\\'Approved\\\'} type="checkbox" checked={item.exp}'
);
f = f.replace(
  '<select value={item.priceType}',
  '<select disabled={loadedStatus === \\\'Approved\\\'} value={item.priceType}'
);
f = f.replace(
  '<select value={item.rtnPriceType}',
  '<select disabled={loadedStatus === \\\'Approved\\\'} value={item.rtnPriceType}'
);

// Fix Add Item Button
f = f.replace(
  '<button onClick={handleAddItem} className="w-full py-3',
  '{loadedStatus !== \\\'Approved\\\' && <button onClick={handleAddItem} className="w-full py-3'
);
f = f.replace(
  '<Plus size={16} /> Add Product\\n          </button>',
  '<Plus size={16} /> Add Product\\n          </button>}'
);

// Fix Trash Button
f = f.replace(
  '<button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300',
  '{loadedStatus !== \\\'Approved\\\' && <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300'
);
f = f.replace(
  '<Trash2 size={16} />\\n                    </button>',
  '<Trash2 size={16} />\\n                    </button>}'
);

fs.writeFileSync(path, f);
console.log('patched');
