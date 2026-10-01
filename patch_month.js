const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// We need to add state for the custom month picker
if (!c.includes('const [showMonthPicker, setShowMonthPicker]')) {
    c = c.replace(/const \[monthInput, setMonthInput\] = useState\('2026-09'\);/, 
    `const [monthInput, setMonthInput] = useState('2026-09');\n  const [showMonthPicker, setShowMonthPicker] = useState(false);`);
}

// Replace the input type="month" with a custom dropdown
const oldInput = `<div className="relative">
                    <input 
                      type="month" style={{ colorScheme: isLightMode ? 'light' : 'dark' }} className="bg-slate-50 dark:bg-[#1a1a2e] border border-sky-500/30 rounded-lg px-4 h-[42px] w-[220px] text-slate-500 dark:text-[#8b8baf] font-semibold text-sm outline-none focus:border-sky-500 transition-colors"
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                    />
                  </div>`;

const customMonthPicker = `<div className="relative">
                    <div 
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="flex items-center justify-between bg-slate-50 dark:bg-[#1a1a2e] border border-sky-500/30 rounded-lg px-4 h-[42px] w-[220px] text-slate-500 dark:text-[#8b8baf] font-semibold text-sm cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <span>{monthName} {yearStr}</span>
                      <Calendar size={16} />
                    </div>
                    {showMonthPicker && (
                      <div className="absolute top-[48px] left-0 w-[260px] bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-4">
                         <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-slate-700 dark:text-white">{yearStr}</span>
                            <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); setMonthInput((parseInt(yearStr)-1)+'-'+monthInput.split('-')[1]) }} className="p-1 hover:bg-slate-100 dark:hover:bg-[#2a2a40] rounded text-slate-500"><ChevronDown className="rotate-90" size={16} /></button>
                               <button onClick={(e) => { e.stopPropagation(); setMonthInput((parseInt(yearStr)+1)+'-'+monthInput.split('-')[1]) }} className="p-1 hover:bg-slate-100 dark:hover:bg-[#2a2a40] rounded text-slate-500"><ChevronDown className="-rotate-90" size={16} /></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                               const mNum = String(i+1).padStart(2, '0');
                               const isSel = monthInput === yearStr+'-'+mNum;
                               return (
                                 <div 
                                    key={m} 
                                    onClick={() => { setMonthInput(yearStr+'-'+mNum); setShowMonthPicker(false); }}
                                    className={\`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors \${isSel ? 'bg-sky-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2a40]'}\`}
                                 >{m}</div>
                               )
                            })}
                         </div>
                      </div>
                    )}
                  </div>`;

c = c.replace(oldInput, customMonthPicker);

// Make sure Calendar icon is imported from lucide-react if not already
if (!c.includes('Calendar,')) {
    c = c.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
        if (!p1.includes('Calendar')) return `import {${p1}, Calendar } from 'lucide-react';`;
        return match;
    });
}

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Patched custom month picker');
