const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// 1. Add yearlyTargets state to SetTargetTab
c = c.replace(
  'const [targets, setTargets] = useState<any[]>([]); // for monthly/yearly views',
  'const [targets, setTargets] = useState<any[]>([]); // for monthly view\n  const [yearlyTargets, setYearlyTargets] = useState<any[]>([]); // for yearly view'
);

// 2. Add fetchYearlyTargets function
const fetchYearlyTargets = `
  const fetchYearlyTargets = async () => {
    if (!selectedYear) return;
    try {
      const res = await axios.get(\`/api/admin/targets/yearly?year=\${selectedYear}\`);
      if (res.data.success) {
        setYearlyTargets(res.data.data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeSubTab === 'yearly') {
      fetchYearlyTargets();
    }
  }, [activeSubTab, selectedYear]);
`;
c = c.replace('  const handleDeleteTarget =', fetchYearlyTargets + '\n  const handleDeleteTarget =');

// 3. Replace the placeholder with the Yearly Targets UI
const yearlyPlaceholder = `      {activeSubTab === 'yearly' && (
        <div>
          <button onClick={() => setActiveSubTab('main')} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
            <ArrowLeft size={16} /> YEARLY TARGETS (Coming Soon)
          </button>
          <p className="text-slate-400">Yearly aggregation logic can be built based on the monthly data.</p>
        </div>
      )}`;

const yearlyUI = `      {activeSubTab === 'yearly' && (
        <div>
          <button onClick={() => setActiveSubTab('main')} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
            <ArrowLeft size={16} /> YEARLY TARGETS
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Year *</label>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({yearlyTargets.length}) ENTRIES</h3>
          
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                  <tr className="border-b border-slate-700/50 text-slate-300">
                    <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr no.</th>
                    <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">User</th>
                    {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(m => (
                      <th key={m} className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">{m}</th>
                    ))}
                    <th className="p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">Total ↑</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {yearlyTargets.map((t, i) => (
                    <tr key={t.uid} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="border-r border-slate-700 p-4 text-slate-300">{i + 1}</td>
                      <td className="border-r border-slate-700 p-4 text-white font-bold">{t.userName}</td>
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
                      <td className="p-4 text-center text-emerald-400 font-bold">{Math.round(t.total)}</td>
                    </tr>
                  ))}
                  {yearlyTargets.length === 0 && (
                    <tr><td colSpan={15} className="p-8 text-center text-slate-500 font-bold">No targets found for this year.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}`;
      
c = c.replace(yearlyPlaceholder, yearlyUI);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Yearly targets injected');
