const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  "const [yearlyTargets, setYearlyTargets] = useState<any[]>([]);",
  "const [yearlyTargets, setYearlyTargets] = useState<any[]>([]);\n  const [yearlySearch, setYearlySearch] = useState('');\n  const [yearlyDivision, setYearlyDivision] = useState('');"
);

const logicInjection = `
  const filteredYearlyTargets = yearlyTargets.filter(t => {
    const searchStr = yearlySearch.toLowerCase();
    const matchesSearch = !yearlySearch || t.userName.toLowerCase().includes(searchStr) || (t.hq || '').toLowerCase().includes(searchStr);
    const matchesDiv = !yearlyDivision || (t.division && t.division === yearlyDivision);
    return matchesSearch && matchesDiv;
  });

  const yearlyTotals = {
    April: 0, May: 0, June: 0, July: 0, August: 0, September: 0,
    October: 0, November: 0, December: 0, January: 0, February: 0, March: 0,
    total: 0
  };
  filteredYearlyTargets.forEach(t => {
    Object.keys(t.months).forEach(m => {
      yearlyTotals[m] += (t.months[m] || 0);
    });
    yearlyTotals.total += (t.total || 0);
  });

  const handleDownloadYearly = () => {
    let wsData = [
      ['Sr No', 'User', 'HQ', 'Division', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Total']
    ];
    filteredYearlyTargets.forEach((t, i) => {
      wsData.push([
        i + 1, t.userName, t.hq || '', t.division || '',
        Math.round(t.months.April), Math.round(t.months.May), Math.round(t.months.June), Math.round(t.months.July), Math.round(t.months.August), Math.round(t.months.September), 
        Math.round(t.months.October), Math.round(t.months.November), Math.round(t.months.December), Math.round(t.months.January), Math.round(t.months.February), Math.round(t.months.March),
        Math.round(t.total)
      ]);
    });
    wsData.push([
      '', 'GRAND TOTAL', '', '',
      Math.round(yearlyTotals.April), Math.round(yearlyTotals.May), Math.round(yearlyTotals.June), Math.round(yearlyTotals.July), Math.round(yearlyTotals.August), Math.round(yearlyTotals.September),
      Math.round(yearlyTotals.October), Math.round(yearlyTotals.November), Math.round(yearlyTotals.December), Math.round(yearlyTotals.January), Math.round(yearlyTotals.February), Math.round(yearlyTotals.March),
      Math.round(yearlyTotals.total)
    ]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yearly Budget');
    XLSX.writeFile(wb, \`Yearly_Budget_\${selectedYear}.xlsx\`);
  };

  const fetchYearlyTargets = async () => {
`;
c = c.replace("const fetchYearlyTargets = async () => {", logicInjection);

const start = c.indexOf("{activeSubTab === 'yearly' && (");
const end = c.indexOf("function AddTargetView", start);

const newJsx = `{activeSubTab === 'yearly' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl p-8 max-w-[98%] mx-auto w-full">
          <button onClick={() => setActiveSubTab('main')} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
            <ArrowLeft size={16} /> YEARLY TARGETS
          </button>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8 items-end justify-between">
            <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Year *</label>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 w-48">
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                </select>
                </div>
                
                <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Division</label>
                <select value={yearlyDivision} onChange={e => setYearlyDivision(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 w-48">
                    <option value="">All Divisions</option>
                    {divisions.map(d => <option key={d._id} value={d.divisionName}>{d.divisionName}</option>)}
                </select>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search by name or HQ..." value={yearlySearch} onChange={e => setYearlySearch(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 w-64" />
                </div>
                <button onClick={handleDownloadYearly} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                    <Download size={18} /> DOWNLOAD EXCEL
                </button>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({filteredYearlyTargets.length}) ENTRIES</h3>
          
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-x-auto overflow-y-auto max-h-[75vh]">
              <table className="w-full text-left border-collapse relative min-w-[1200px]">
                <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                  <tr className="border-b border-slate-700/50 text-slate-300">
                    <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr no.</th>
                    <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">User</th>
                    {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(m => (
                      <th key={m} className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">{m}</th>
                    ))}
                    <th className="p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredYearlyTargets.map((t, i) => (
                    <tr key={t.uid} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="border-r border-slate-700 p-4 text-slate-300">{i + 1}</td>
                      <td className="border-r border-slate-700 p-4">
                        <div className="text-slate-200 font-bold text-sm">{t.userName}</div>
                        {t.hq && <div className="text-xs text-sky-400 font-semibold mt-1">{t.hq}</div>}
                      </td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.April > 0 ? Math.round(t.months.April) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.May > 0 ? Math.round(t.months.May) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.June > 0 ? Math.round(t.months.June) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.July > 0 ? Math.round(t.months.July) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.August > 0 ? Math.round(t.months.August) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.September > 0 ? Math.round(t.months.September) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.October > 0 ? Math.round(t.months.October) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.November > 0 ? Math.round(t.months.November) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.December > 0 ? Math.round(t.months.December) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.January > 0 ? Math.round(t.months.January) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.February > 0 ? Math.round(t.months.February) : ''}</td>
                      <td className="border-r border-slate-700 p-4 text-center text-slate-300">{t.months.March > 0 ? Math.round(t.months.March) : ''}</td>
                      <td className="p-4 text-center text-emerald-400 font-bold">{t.total > 0 ? Math.round(t.total) : ''}</td>
                    </tr>
                  ))}
                  {filteredYearlyTargets.length === 0 && (
                    <tr>
                      <td colSpan={15} className="p-8 text-center text-slate-400">No targets found for this criteria.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="sticky bottom-0 bg-slate-900 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <tr className="border-t-2 border-sky-500/50">
                      <td colSpan={2} className="border-r border-slate-700 p-4 text-sky-400 font-bold text-right uppercase tracking-wider text-sm">Grand Total</td>
                      {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => (
                        <td key={m} className="border-r border-slate-700 p-4 text-center text-sky-400 font-bold text-sm">{yearlyTotals[m] > 0 ? Math.round(yearlyTotals[m]) : ''}</td>
                      ))}
                      <td className="p-4 text-center text-emerald-400 font-bold text-lg">{Math.round(yearlyTotals.total) > 0 ? Math.round(yearlyTotals.total) : ''}</td>
                    </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

`;

c = c.substring(0, start) + newJsx + c.substring(end);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Successfully patched ManageUsers.tsx flawlessly.');
