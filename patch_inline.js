const fs = require('fs');

const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Replace states
code = code.replace(
  `const [selectingStockist, setSelectingStockist] = useState(false);\n  const [stockistSearch, setStockistSearch] = useState('');\n  const [selectingProductFor, setSelectingProductFor] = useState<number | null>(null);\n  const [productSearch, setProductSearch] = useState('');`,
  `const [stockistSearchOpen, setStockistSearchOpen] = useState(false);\n  const [stockistSearch, setStockistSearch] = useState('');\n  const [activeProductDropdown, setActiveProductDropdown] = useState<number | null>(null);\n  const [productSearch, setProductSearch] = useState('');`
);

// 2. Replace Stockist Selector Block
const oldStockist = `<div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Select Stockist *</label>
            <div onClick={() => !isLocked && setSelectingStockist(true)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 text-sm text-white flex justify-between items-center cursor-pointer">
              <span className={header.stockist ? 'text-white' : 'text-slate-500'}>
                {getStockistName(header.stockist) || '-- Search & Select Stockist --'}
              </span>
              <Search size={16} className="text-slate-500" />
            </div>
          </div>`;

const newStockist = `<div className="relative">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Select Stockist *</label>
            <div className="relative">
              <input 
                type="text" 
                disabled={isLocked}
                placeholder="-- Search & Select Stockist --" 
                value={stockistSearchOpen ? stockistSearch : (getStockistName(header.stockist) || '')} 
                onChange={e => {
                  setStockistSearch(e.target.value);
                  setStockistSearchOpen(true);
                }}
                onFocus={() => {
                   setStockistSearch(''); 
                   setStockistSearchOpen(true);
                }}
                onBlur={() => setTimeout(() => setStockistSearchOpen(false), 200)}
                className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 pl-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none" 
              />
              <Search size={16} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {stockistSearchOpen && !isLocked && (
              <div className="absolute z-[60] w-full mt-1 bg-[#1e2032] border border-[#3b3b5a] rounded-lg shadow-2xl max-h-48 overflow-y-auto top-full left-0">
                {stockists
                  .filter(s => (s.businessName || s.name || '').toLowerCase().includes(stockistSearch.toLowerCase()))
                  .map(s => (
                    <div 
                      key={s._id || Math.random()} 
                      className="p-3 text-sm border-b border-[#3b3b5a]/50 text-white hover:bg-[#27273f] active:bg-[#27273f] cursor-pointer"
                      onMouseDown={(e) => { 
                        e.preventDefault();
                        setHeader({...header, stockist: s.uid || s._id});
                        setStockistSearch(s.businessName || s.name);
                        setStockistSearchOpen(false);
                      }}
                    >
                      <div className="font-bold">{s.businessName || s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.headquarter || ''}</div>
                    </div>
                ))}
                {stockists.filter(s => (s.businessName || s.name || '').toLowerCase().includes(stockistSearch.toLowerCase())).length === 0 && (
                   <div className="p-3 text-xs text-slate-500">No stockists found</div>
                )}
              </div>
            )}
          </div>`;

code = code.replace(oldStockist, newStockist);

// 3. Fix Product Card Overflow
code = code.replace(
  /className="bg-\[\#27273f\] rounded-xl border border-\[\#3b3b5a\] overflow-hidden shadow-lg/g,
  `className="bg-[#27273f] rounded-xl border border-[#3b3b5a] relative shadow-lg`
);

// 4. Replace Product Header (Card Header)
const oldProductHeader = `<div className="bg-[#1e2032] p-3 border-b border-[#3b3b5a] flex justify-between items-center gap-2">
                  <div onClick={() => !isLocked && setSelectingProductFor(index)} className="flex-1 flex justify-between items-center cursor-pointer py-1">
                    <span className={\`text-sm font-bold truncate \${row.product ? 'text-white' : 'text-slate-500'}\`}>
                      {getProductName(row.product) || '-- Search & Select Product --'}
                    </span>
                    {!row.product && <Search size={14} className="text-slate-500 ml-2 shrink-0" />}
                  </div>
                  {!isLocked && ( <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-300 p-1.5 transition-colors bg-red-400/10 rounded ml-2 shrink-0"><Trash2 size={16} /></button> )}
                </div>`;

const newProductHeader = `<div className="bg-[#1e2032] p-3 border-b border-[#3b3b5a] rounded-t-xl flex items-center gap-2 relative">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      disabled={isLocked}
                      placeholder="-- Search & Select Product --" 
                      value={activeProductDropdown === index ? productSearch : (getProductName(row.product) || '')} 
                      onChange={e => {
                        setProductSearch(e.target.value);
                        setActiveProductDropdown(index);
                      }}
                      onFocus={() => {
                         setProductSearch(''); 
                         setActiveProductDropdown(index);
                      }}
                      onBlur={() => setTimeout(() => { if (activeProductDropdown === index) setActiveProductDropdown(null) }, 200)}
                      className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  {!row.product && <Search size={14} className="text-slate-500 shrink-0 pointer-events-none" />}
                  {!isLocked && ( <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-300 p-1.5 transition-colors bg-red-400/10 rounded shrink-0"><Trash2 size={16} /></button> )}

                  {activeProductDropdown === index && !isLocked && (
                    <div className="absolute z-[70] w-full mt-1 bg-[#1e2032] border border-[#3b3b5a] rounded-lg shadow-2xl max-h-48 overflow-y-auto top-full left-0">
                      {productsMaster
                        .filter(p => (p.productName || p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                        .map(p => (
                          <div 
                            key={p.uid || p._id || p.productName || Math.random()} 
                            className="p-3 text-sm border-b border-[#3b3b5a]/50 text-white hover:bg-[#27273f] active:bg-[#27273f] cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectProductForRow(index, p.productName || p.name);
                              setActiveProductDropdown(null);
                            }}
                          >
                            <div className="font-bold">{p.productName || p.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">PTR: ₹{p.ptr || '0.00'}</div>
                          </div>
                      ))}
                      {productsMaster.filter(p => (p.productName || p.name || '').toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                         <div className="p-3 text-xs text-slate-500">No products found</div>
                      )}
                    </div>
                  )}
                </div>`;

code = code.replace(oldProductHeader, newProductHeader);

// 5. Remove old Modals at the bottom
const removeRegex = /\{\/\* Stockist Selection Modal \*\/\}(.|\n)*?\{\/\* Product Selection Modal \*\/\}(.|\n)*?<\/div>\n  \);\n\}/g;
code = code.replace(removeRegex, "</div>\n  );\n}");

fs.writeFileSync(path, code);
console.log("Replaced modals with inline search dropdowns.");
