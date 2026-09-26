const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

// Fix Junk characters (₹ sign)
f = f.replace(/_A\?s_A/g, '₹');
f = f.replace(/삱½,삱½/g, '₹');

// Fix Title
f = f.replace(
  /\{editId \? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"\}/g,
  "{loadedStatus === 'Approved' ? 'VIEW PRIMARY SALES' : editId ? 'EDIT PRIMARY SALES' : 'PRIMARY SALES ENTRY'}"
);

// Map stockists and products
if (!f.includes('getStockistName')) {
  f = f.replace(
    'const [header, setHeader] = useState({',
    `const getStockistName = (val: string) => {
      if (!val) return '';
      const s = stockists.find(x => x.uid === val || x._id === val || x.businessName === val);
      return s ? (s.businessName || s.name || val) : val;
    };
    const getProductName = (val: string) => {
      if (!val) return '';
      const p = productsMaster.find(x => x.uid === val || x._id === val || x.productName === val);
      return p ? (p.productName || val) : val;
    };
    const [header, setHeader] = useState({`
  );
}

// Display mapped names
f = f.replace(
  /\{header\.stockist \|\| '-- Search & Select Stockist --'\}/g,
  "{getStockistName(header.stockist) || '-- Search & Select Stockist --'}"
);
f = f.replace(
  /\{item\.product \|\| '-- Search & Select Product --'\}/g,
  "{getProductName(item.product) || '-- Search & Select Product --'}"
);

// Disable inputs
f = f.replace(/<input type="number" min="0" value=\{item\.qty/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.qty');
f = f.replace(/<input type="number" min="0" value=\{item\.free/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.free');
f = f.replace(/<input type="number" min="0" value=\{item\.discount/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.discount');
f = f.replace(/<input type="number" min="0" value=\{item\.purcRtn/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.purcRtn');
f = f.replace(/<input type="number" min="0" value=\{item\.rtnPrice/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.rtnPrice');
f = f.replace(/<input type="number" min="0" value=\{item\.basePrice/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="number" min="0" value={item.basePrice');
f = f.replace(/<input type="checkbox" checked=\{item\.exp\}/g, '<input disabled={loadedStatus === \\\'Approved\\\'} type="checkbox" checked={item.exp}');
f = f.replace(/<select value=\{item\.priceType\}/g, '<select disabled={loadedStatus === \\\'Approved\\\'} value={item.priceType}');
f = f.replace(/<select value=\{item\.rtnPriceType\}/g, '<select disabled={loadedStatus === \\\'Approved\\\'} value={item.rtnPriceType}');

// Hide Add Product Button
f = f.replace(
  /<button onClick=\{handleAddItem\} className="w-full py-3[^>]*>[\s\S]*?<\/button>/,
  "{loadedStatus !== 'Approved' && ( $& )}"
);

// Hide Delete Product Button
f = f.replace(
  /<button onClick=\{\(\) => handleRemoveItem\(item\.id\)\} className="text-red-400[^>]*>[\s\S]*?<\/button>/g,
  "{loadedStatus !== 'Approved' && ( $& )}"
);

fs.writeFileSync(path, f);
console.log('Patch complete!');
