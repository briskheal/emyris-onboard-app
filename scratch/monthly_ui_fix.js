const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const headers = `<th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">Lump Sum Amt</th>
                      <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">Product Amt</th>`;
                      
const newHeaders = `<th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-right">Direct Budget</th>
                      <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-right">Team Budget</th>
                      <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-right">Total Budget</th>`;

c = c.replace(headers, newHeaders);

const rows = `{targets.map((t, i) => (
                  <tr key={t._id} className="hover:bg-slate-700/30">
                    <td className="p-4 text-slate-300 border-r border-slate-700">{i + 1}</td>
                    <td className="p-4 text-white font-bold border-r border-slate-700">{t.userName || t.userEmail}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700">{t.lumpSumAmount || 0}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700">{t.totalProductAmount || 0}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(t._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg" title="Delete">`;

const newRows = `{targets.filter(t => t.totalTarget > 0).map((t, i) => (
                  <tr key={t.employeeId} className="hover:bg-slate-700/30">
                    <td className="p-4 text-slate-300 border-r border-slate-700">{i + 1}</td>
                    <td className="p-4 text-white font-bold border-r border-slate-700">{t.userName || t.userEmail}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700 text-right">{t.directTarget || 0}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700 text-right">{t.teamTarget || 0}</td>
                    <td className="p-4 text-emerald-400 font-bold border-r border-slate-700 text-right">{t.totalTarget || 0}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(t.rawTarget?._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg" title="Delete">`;

c = c.replace(rows, newRows);
fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed Monthly targets UI');
