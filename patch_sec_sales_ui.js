const fs = require('fs');
const file = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the entire PRODUCT SEARCH MODAL
content = content.replace(/\{\/\* PRODUCT SEARCH MODAL \*\/\}[\s\S]*?(?=\s*<\/div>\s*\)\s*;\s*\})/m, '');

// 2. Remove showProductModal state and related
content = content.replace(/const \[showProductModal, setShowProductModal\] = useState\(false\);\n/, '');
content = content.replace(/const \[activeRowIndex, setActiveRowIndex\] = useState<any>\(null\);\n/, '');
content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);\n/, '');
content = content.replace(/setShowProductModal\(false\);/g, '');

// 3. Update selectProductForRow to handle rowIndex
const oldSelect = /const selectProductForRow = \(prodName: string\) => \{[\s\S]*?fetchRowStock\(prodName, activeRowIndex\);\n\s*\}\n\s*setShowProductModal\(false\);\n\s*\};/;
const newSelect = `
  const selectProductForRow = (prodName: string, rowIndex: number) => {
    handleRowChange(rowIndex, 'product', prodName);
    
    // Auto-set prices based on type
    const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
    if (pData) {
      const type = productsData[rowIndex].priceType;
      if (type === 'PTR') handleRowChange(rowIndex, 'basePrice', pData.ptr || 0);
      else if (type === 'PTS') handleRowChange(rowIndex, 'basePrice', pData.pts || 0);
      else if (type === 'MRP') handleRowChange(rowIndex, 'basePrice', pData.mrp || 0);
      
      fetchRowStock(prodName, rowIndex);
    }
  };
`;
content = content.replace(oldSelect, newSelect.trim());

// 4. Replace Product Selector UI with datalist combo box
const oldUI = /\{\/\* Product Selector \*\/\}[\s\S]*?(?=\{\/\* Price Toggle & Input \*\/)/m;
const newUI = `{/* Product Selector Inline Combobox */}
              <div className="relative mb-3 w-[85%]">
                <div className={\`flex items-center bg-[#0f1015] border \${row.product ? 'border-sky-900/50' : 'border-[#3b3b5a]'} rounded-xl px-4 h-12 transition-colors focus-within:border-sky-500\`}>
                  <PackageSearch className={\`w-4 h-4 shrink-0 mr-3 \${row.product ? 'text-sky-400' : 'text-slate-500'}\`} />
                  <input
                    disabled={isLocked}
                    type="text"
                    list={\`products-list-\${index}\`}
                    value={row.product}
                    onChange={(e) => selectProductForRow(e.target.value, index)}
                    placeholder="-- Search or Select Product --"
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder-slate-500 text-sky-300"
                  />
                </div>
                <datalist id={\`products-list-\${index}\`}>
                  {productsMaster.map((p:any) => (
                    <option key={p.productName || p.name} value={p.productName || p.name} />
                  ))}
                </datalist>
              </div>

              `;
content = content.replace(oldUI, newUI);

fs.writeFileSync(file, content);
console.log("Patched SecondarySalesForm UI to use inline datalist search.");
