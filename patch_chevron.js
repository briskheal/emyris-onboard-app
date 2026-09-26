const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx', 'utf8');

f = f.replace(
  "import { ArrowLeft, Save, Plus, Trash2, PackageSearch, Search, X } from 'lucide-react';",
  "import { ArrowLeft, Save, Plus, Trash2, PackageSearch, Search, X, ChevronDown } from 'lucide-react';"
);

const targetBlock = `<label className="text-[9px] text-slate-400 uppercase mb-1 block">Price Type</label>
                      <select 
                        value={item.priceType} 
                        onChange={e => handlePriceTypeChange(item.id, e.target.value)} 
                        className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-cyan-400 font-bold focus:outline-none appearance-none"
                      >
                        <option value="PTS">PTS</option>
                        <option value="PTR">PTR</option>
                        <option value="MRP">MRP</option>
                        <option value="Cus">Cus</option>
                      </select>`;

const replacementBlock = `<label className="text-[9px] text-slate-400 uppercase mb-1 block">Price Type</label>
                      <div className="relative">
                        <select 
                          value={item.priceType} 
                          onChange={e => handlePriceTypeChange(item.id, e.target.value)} 
                          className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 pr-6 text-xs text-cyan-400 font-bold focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="PTS">PTS</option>
                          <option value="PTR">PTR</option>
                          <option value="MRP">MRP</option>
                          <option value="Cus">Cus</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                      </div>`;

f = f.replace(targetBlock, replacementBlock);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx', f);
console.log('Patched');
