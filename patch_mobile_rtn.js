const fs = require('fs');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(filePath, 'utf8');

// 1. Add rtnPriceType to useState and handleAddItem
f = f.replace(/purcRtn: 0,\s*rtnPrice: 0/g, "purcRtn: 0,\n      rtnPriceType: 'PTS',\n      rtnPrice: 0");

// 2. Add handleRtnPriceTypeChange below handlePriceTypeChange
const handlePriceTypeMatch = `  const handlePriceTypeChange = (id: string, newType: string) => {`;
const rtnPriceHandler = `  const handleRtnPriceTypeChange = (id: string, newType: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    let newPrice = item.rtnPrice;
    if (item.product) {
      const prodMaster = productsMaster.find(p => p.productName === item.product);
      if (prodMaster) {
        if (newType === 'PTS') newPrice = prodMaster.pts || 0;
        else if (newType === 'PTR') newPrice = prodMaster.ptr || 0;
        else if (newType === 'MRP') newPrice = prodMaster.mrp || 0;
      }
    }
    setItems(items.map(i => i.id === id ? { ...i, rtnPriceType: newType, rtnPrice: newPrice } : i));
  };
`;

if (!f.includes('handleRtnPriceTypeChange')) {
    f = f.replace(handlePriceTypeMatch, rtnPriceHandler + '\n' + handlePriceTypeMatch);
}

// 3. Update handleProductSelect to set rtnPrice as well
const productSelectRegex = /let newPrice = 0;\s*if \(item\.priceType === 'PTS'\) newPrice = selectedProduct\.pts \|\| 0;\s*else if \(item\.priceType === 'PTR'\) newPrice = selectedProduct\.ptr \|\| 0;\s*else if \(item\.priceType === 'MRP'\) newPrice = selectedProduct\.mrp \|\| 0;\s*setItems\(items\.map\(i => i\.id === id \? \{([\s\S]*?)basePrice: newPrice\s*\} : i\)\);/;

const replacementSelect = `let newPrice = 0;
    if (item.priceType === 'PTS') newPrice = selectedProduct.pts || 0;
    else if (item.priceType === 'PTR') newPrice = selectedProduct.ptr || 0;
    else if (item.priceType === 'MRP') newPrice = selectedProduct.mrp || 0;

    let newRtnPrice = 0;
    const rtnType = item.rtnPriceType || 'PTS';
    if (rtnType === 'PTS') newRtnPrice = selectedProduct.pts || 0;
    else if (rtnType === 'PTR') newRtnPrice = selectedProduct.ptr || 0;
    else if (rtnType === 'MRP') newRtnPrice = selectedProduct.mrp || 0;

    setItems(items.map(i => i.id === id ? { 
      ...i, 
      product: selectedProduct.productName, 
      basePrice: newPrice,
      rtnPrice: newRtnPrice
    } : i));`;

f = f.replace(productSelectRegex, replacementSelect);

// 4. Update JSX block
const oldJsxBlock = `<div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 uppercase block">Purc. Rtn Qty</label>
                        <input type="number" min="0" value={item.purcRtn || ''} onChange={e => updateItem(item.id, 'purcRtn', e.target.value)} placeholder="0" className="w-full bg-transparent border-b border-[#3b3b5a] text-xs text-white p-1 focus:outline-none focus:border-red-500" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 uppercase block">Rtn Price (₹)</label>
                        <input type="number" min="0" value={item.rtnPrice || ''} onChange={e => updateItem(item.id, 'rtnPrice', e.target.value)} placeholder="0.00" className="w-full bg-transparent border-b border-[#3b3b5a] text-xs text-white p-1 focus:outline-none focus:border-red-500" />
                      </div>
                    </div>`;
                    
const newJsxBlock = `<div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 uppercase block">Purc. Rtn Qty</label>
                        <input type="number" min="0" value={item.purcRtn || ''} onChange={e => updateItem(item.id, 'purcRtn', e.target.value)} placeholder="0" className="w-full bg-transparent border-b border-[#3b3b5a] text-xs text-white p-1 focus:outline-none focus:border-red-500" />
                      </div>
                      <div className="w-[75px]">
                        <label className="text-[9px] text-slate-500 uppercase block">Type</label>
                        <div className="relative">
                          <select 
                            value={item.rtnPriceType || 'PTS'} 
                            onChange={e => handleRtnPriceTypeChange(item.id, e.target.value)} 
                            className="w-full bg-transparent border-b border-[#3b3b5a] p-1 text-xs text-red-400 font-bold focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="PTS">PTS</option>
                            <option value="PTR">PTR</option>
                            <option value="MRP">MRP</option>
                            <option value="CUS">CUS</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 uppercase block">Rtn Price (₹)</label>
                        <input type="number" min="0" value={item.rtnPrice || ''} onChange={e => updateItem(item.id, 'rtnPrice', e.target.value)} placeholder="0.00" className="w-full bg-transparent border-b border-[#3b3b5a] text-xs text-white p-1 focus:outline-none focus:border-red-500" />
                      </div>
                    </div>`;

// Note: Replace requires exact match.
// Instead of exact string, let's use a regex to be safe:
const jsxRegex = /<div className="flex gap-2">\s*<div className="flex-1">\s*<label className="text-\[9px\] text-slate-500 uppercase block">Purc\. Rtn Qty<\/label>[\s\S]*?Rtn Price[\s\S]*?<\/div>\s*<\/div>/;

f = f.replace(jsxRegex, newJsxBlock);

fs.writeFileSync(filePath, f);
console.log('Mobile Return Price Type applied!');
