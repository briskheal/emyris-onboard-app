const fs = require('fs');
let c = fs.readFileSync('xl-frontend/src/pages/extras/CallPlan.tsx', 'utf8');

// 1. Add state for holidays
const stateTarget = "const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);";
const stateInject = "\n  const [holidays, setHolidays] = useState<Record<string, string>>({});";
if (!c.includes("setHolidays")) {
    c = c.replace(stateTarget, stateTarget + stateInject);
}

// 2. Add fetchHolidays function and call it in useEffect
const useEffectTarget = `useEffect(() => {
    if (activeUser) {
      fetchMasterData();
      fetchMonthlyPlans();
    }
  }, [activeUser, month, year]);`;

const useEffectNew = `useEffect(() => {
    if (activeUser) {
      fetchMasterData();
      fetchMonthlyPlans();
      fetchHolidays();
    }
  }, [activeUser, month, year]);

  const fetchHolidays = async () => {
    try {
      const res = await axios.get('/api/xl/settings/holidays');
      if (res.data.success) {
        const holidayMap: Record<string, string> = {};
        res.data.data.forEach((h: any) => {
          if (!h.state || h.state === 'All' || h.state === activeUser?.state) {
            const d = new Date(h.date);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            holidayMap[\`\${y}-\${m}-\${day}\`] = h.title;
          }
        });
        setHolidays(holidayMap);
      }
    } catch (e) {}
  };`;
c = c.replace(useEffectTarget, useEffectNew);

// 3. Update mapping logic to use holidays
const mapOld = `const isHol = isSunday(day);
              const isPlanned = !!plan && (pDocs.length > 0 || pChems.length > 0 || pStocks.length > 0);

              return (
                <div 
                  key={day} 
                  onClick={() => isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day)}`;

const mapNew = `const dateStr = \`\${year}-\${month.toString().padStart(2, '0')}-\${day.toString().padStart(2, '0')}\`;
              const isHolidayDate = !!holidays[dateStr];
              const isHol = isSunday(day) || isHolidayDate;
              const isPlanned = !!plan && (pDocs.length > 0 || pChems.length > 0 || pStocks.length > 0);

              return (
                <div 
                  key={day} 
                  onClick={() => isHol ? null : (isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day))}
                  className={\`flex items-center rounded-lg overflow-hidden border \${isMultiMode && selectedDates.has(day) ? 'border-sky-500 bg-sky-900/20' : 'border-[#3b3b5a] bg-[#27273f]'} transition-colors mb-2 \${isHol ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}\`}`;

// Wait, the div class replacement might fail if not exact, let's just do a regex replace on the div open tag
c = c.replace(
    "onClick={() => isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day)}",
    "onClick={() => isHol ? null : (isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day))}"
);

c = c.replace(
    "const isHol = isSunday(day);",
    "const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;\n              const isHolidayDate = !!holidays[dateStr];\n              const isHol = isSunday(day) || isHolidayDate;"
);

// Update the UI rendering part for Sunday to include Holiday
const uiOld = `<span className="text-sm font-bold text-slate-300">Sunday</span>`;
const uiNew = `<div className="flex flex-col"><span className="text-sm font-bold text-rose-400">{isHolidayDate ? 'Holiday' : 'Sunday'}</span>{isHolidayDate && <span className="text-xs text-slate-400 truncate">{holidays[dateStr]}</span>}</div>`;
c = c.replace(uiOld, uiNew);

fs.writeFileSync('xl-frontend/src/pages/extras/CallPlan.tsx', c);
console.log('Successfully patched CallPlan.tsx');
