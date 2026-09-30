const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/AllPrimarySales.tsx', 'utf8');

content = content.replace(/AllPrimarySales/g, 'AllSecondarySales');
content = content.replace(/PRIMARY SALES/g, 'SECONDARY SALES');
content = content.replace(/Primary Sales/g, 'Secondary Sales');
content = content.replace(/\/extras\/primary-sales/g, '/extras/secondary');
content = content.replace(/\/api\/xl\/primary-sales/g, '/api/xl/secondary-sales');

const tableHeaderOldRegex = /<th className="p-3 font-semibold text-center border-r border-\[\#3b3b5a\]\/50">Gross.*?<\/th>\s*<th className="p-3 font-semibold text-center border-r border-\[\#3b3b5a\]\/50">Net.*?<\/th>\s*<th className="p-3 font-semibold text-center border-r border-\[\#3b3b5a\]\/50">Salable<br\/>Rtn<\/th>\s*<th className="p-3 font-semibold text-center border-r border-\[\#3b3b5a\]\/50">Expiry<br\/>Rtn<\/th>/s;
const tableHeaderNew = `<th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Total Value (₹)</th>`;

content = content.replace(tableHeaderOldRegex, tableHeaderNew);

const colSpanNew = `colSpan={7}`;
content = content.replace(/colSpan=\{9\}/g, colSpanNew);

const tableRowLogicOldRegex = /const returnTotal =.*?<td className="p-3 text-center border-r border-\[\#3b3b5a\]\/50 text-rose-500 font-bold bg-rose-950\/10">.*?<\/td>/s;

const tableRowLogicNew = `return (
                      <tr key={sale._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                        <td className="p-3 text-center text-[#8b8baf] border-r border-[#3b3b5a]/50">{index + 1}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50">{sale.date || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-medium text-white">{sale.invoiceNumber || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50">{sale.invoiceDate || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 text-white truncate max-w-[150px]">{getStockistName(sale.stockist) || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[120px]">{sale.headquarter || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-bold text-sky-400">
                            {sale.amount ? sale.amount.toFixed(2) : '-'}
                        </td>`;

content = content.replace(tableRowLogicOldRegex, tableRowLogicNew);

// Fix the Home routing
content = content.replace(/navigate\('\/'\)/g, "navigate('/admin')");

fs.writeFileSync('xla-frontend/src/pages/AllSecondarySales.tsx', content);
console.log('Successfully generated AllSecondarySales.tsx');

// Also fix the Home routing in AllPrimarySales.tsx
let primaryContent = fs.readFileSync('xla-frontend/src/pages/AllPrimarySales.tsx', 'utf8');
primaryContent = primaryContent.replace(/navigate\('\/'\)/g, "navigate('/admin')");
fs.writeFileSync('xla-frontend/src/pages/AllPrimarySales.tsx', primaryContent);
console.log('Successfully fixed AllPrimarySales.tsx');
