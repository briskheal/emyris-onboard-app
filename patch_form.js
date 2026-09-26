const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

// 1. Add Helper Functions
f = f.replace('// Invoice Header State', `
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

  // Invoice Header State`);

// 2. Change the title dynamically
f = f.replace(
  '<h1 className="text-sm font-black text-white tracking-wide uppercase">\\n          Edit Primary Sales\\n        </h1>',
  '<h1 className="text-sm font-black text-white tracking-wide uppercase">\\n          {loadedStatus === \\\'Approved\\\' ? \\\'View\\\' : editId ? \\\'Edit\\\' : \\\'Create\\\'} Primary Sales\\n        </h1>'
);

// 3. Stockist rendering
f = f.replace(
  '{header.stockist || \'-- Search & Select Stockist --\'}',
  '{getStockistName(header.stockist) || \'-- Search & Select Stockist --\'}'
);

// 4. Product rendering
f = f.replace(
  '{item.product || \'-- Search & Select Product --\'}',
  '{getProductName(item.product) || \'-- Search & Select Product --\'}'
);

// 5. Add disabled flags to line item inputs
// qty
f = f.replace(
  '<input type="number" min="0" value={item.qty || \'\'} onChange={e => updateItem(item.id, \'qty\', e.target.value)} placeholder="0"',
  '<input type="number" disabled={loadedStatus === \'Approved\'} min="0" value={item.qty || \'\'} onChange={e => updateItem(item.id, \'qty\', e.target.value)} placeholder="0"'
);
// free
f = f.replace(
  '<input type="number" min="0" value={item.free || \'\'} onChange={e => updateItem(item.id, \'free\', e.target.value)} placeholder="0"',
  '<input type="number" disabled={loadedStatus === \'Approved\'} min="0" value={item.free || \'\'} onChange={e => updateItem(item.id, \'free\', e.target.value)} placeholder="0"'
);
// discount
f = f.replace(
  '<input type="number" min="0" value={item.discount || \'\'} onChange={e => updateItem(item.id, \'discount\', e.target.value)} placeholder="0"',
  '<input type="number" disabled={loadedStatus === \'Approved\'} min="0" value={item.discount || \'\'} onChange={e => updateItem(item.id, \'discount\', e.target.value)} placeholder="0"'
);
// exp checkbox
f = f.replace(
  '<input type="checkbox" checked={item.exp} onChange={e => updateItem(item.id, \'exp\', e.target.checked)}',
  '<input type="checkbox" disabled={loadedStatus === \'Approved\'} checked={item.exp} onChange={e => updateItem(item.id, \'exp\', e.target.checked)}'
);
// purcRtn
f = f.replace(
  '<input type="number" min="0" value={item.purcRtn || \'\'} onChange={e => updateItem(item.id, \'purcRtn\', e.target.value)} placeholder="0"',
  '<input type="number" disabled={loadedStatus === \'Approved\'} min="0" value={item.purcRtn || \'\'} onChange={e => updateItem(item.id, \'purcRtn\', e.target.value)} placeholder="0"'
);
// rtnPrice
f = f.replace(
  '<input type="number" min="0" value={item.rtnPrice || \'\'} onChange={e => updateItem(item.id, \'rtnPrice\', e.target.value)} placeholder="0.00"',
  '<input type="number" disabled={loadedStatus === \'Approved\'} min="0" value={item.rtnPrice || \'\'} onChange={e => updateItem(item.id, \'rtnPrice\', e.target.value)} placeholder="0.00"'
);
// basePrice
f = f.replace(
  '<input type="number" min="0" value={item.basePrice || \'\'} onChange={e => updateItem(item.id, \'basePrice\', e.target.value)} placeholder="0.00"',
  '<input type="number" disabled={loadedStatus === \'Approved\'} min="0" value={item.basePrice || \'\'} onChange={e => updateItem(item.id, \'basePrice\', e.target.value)} placeholder="0.00"'
);
// selects
f = f.replace(
  '<select value={item.priceType} onChange={e => updateItem(item.id, \'priceType\', e.target.value)}',
  '<select disabled={loadedStatus === \'Approved\'} value={item.priceType} onChange={e => updateItem(item.id, \'priceType\', e.target.value)}'
);
f = f.replace(
  '<select value={item.rtnPriceType} onChange={e => updateItem(item.id, \'rtnPriceType\', e.target.value)}',
  '<select disabled={loadedStatus === \'Approved\'} value={item.rtnPriceType} onChange={e => updateItem(item.id, \'rtnPriceType\', e.target.value)}'
);

// 6. Hide Add and Trash buttons if approved
f = f.replace(
  '<button onClick={handleAddItem} className="w-full py-3',
  '{loadedStatus !== \'Approved\' && <button onClick={handleAddItem} className="w-full py-3'
);
f = f.replace(
  'Add Product\\n          </button>',
  'Add Product\\n          </button>}'
);

f = f.replace(
  '<button onClick={() => removeItem(item.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 active:scale-95">',
  '{loadedStatus !== \'Approved\' && <button onClick={() => removeItem(item.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 active:scale-95">'
);
f = f.replace(
  '<Trash2 size={16} />\\n                    </button>',
  '<Trash2 size={16} />\\n                    </button>}'
);

fs.writeFileSync(path, f);
console.log('done');
