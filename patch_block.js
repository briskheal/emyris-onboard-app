const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Disable Stockist selection
c = c.replace(
  /onClick=\{\(\) => setShowStockistSearch\(true\)\}/g,
  "onClick={() => { if (loadedStatus !== 'Approved') setShowStockistSearch(true); }}"
);

// 2. Disable Product selection
c = c.replace(
  /onClick=\{\(\) => setSelectingProductFor\(item\.id\)\}/g,
  "onClick={() => { if (loadedStatus !== 'Approved') setSelectingProductFor(item.id); }}"
);

// 3. Disable Select dropdowns
c = c.replace(
  /<select\s*\n\s*value=\{item\.priceType\}/g,
  "<select disabled={loadedStatus === 'Approved'}\n                            value={item.priceType}"
);

c = c.replace(
  /<select\s*\n\s*value=\{item\.rtnPriceType/g,
  "<select disabled={loadedStatus === 'Approved'}\n                              value={item.rtnPriceType"
);

// 4. Fetch ALL stockists if editId is present so old stockists resolve
c = c.replace(
  /axios\.get\(`\/api\/xl\/stockists\?hq=\$\{hq\}&designation=\$\{desig\}`\)/g,
  "axios.get(editId ? '/api/xl/reports/stockists' : `/api/xl/stockists?hq=${hq}&designation=${desig}`)"
);

fs.writeFileSync(path, c);
console.log('Fixed block interactions');
