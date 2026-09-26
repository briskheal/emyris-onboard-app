const fs = require('fs');

// Patch SettingsPreferences.tsx
let p = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/SettingsPreferences.tsx';
let content = fs.readFileSync(p, 'utf8');

const newPref = `{section.toggles.map((toggle) => (
                   <div key={toggle.id} className="border-b border-[#3b3b5a]/30 pb-6 last:border-0 last:pb-0">
                     <div className="flex justify-between items-start gap-8">
                       <div>
                         <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-widest">{toggle.label}</h3>
                         <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{toggle.desc}</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                         <input 
                           type="checkbox" 
                           className="sr-only peer" 
                           checked={!!settings[toggle.id]} 
                           onChange={(e) => handleToggle(toggle.id, e.target.checked)} 
                         />
                         <div className="w-11 h-6 bg-[#27273f] rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                       </label>
                     </div>
                     {toggle.id === 'set_working_days' && settings[toggle.id] && (
                       <div className="mt-6 flex items-center justify-between gap-4 flex-wrap bg-[#1a1a2e]/50 p-4 rounded-xl border border-[#3b3b5a]/50">
                         <div className="flex items-center gap-2 flex-wrap">
                           {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                             <button 
                               key={day}
                               onClick={() => {
                                 const wd = settings.workingDays || { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true };
                                 setSettings({ ...settings, workingDays: { ...wd, [day]: !wd[day] } });
                               }}
                               className={"px-4 py-2 rounded-md font-bold text-[13px] transition-colors " + ((settings.workingDays?.[day] ?? (day !== 'Sunday')) ? 'bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20' : 'bg-[#5b2b3a] text-[#ff8ba7] hover:bg-[#6c3345] shadow-md shadow-rose-900/20')}
                             >
                               {day}
                             </button>
                           ))}
                         </div>
                         <button onClick={() => handleToggle('workingDays', settings.workingDays || { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true })} className="px-6 py-2 bg-transparent hover:bg-slate-700/50 text-sky-400 font-bold text-sm rounded-md border border-sky-900/50 transition-colors">
                           Submit
                         </button>
                       </div>
                     )}
                   </div>
                 ))}`;

let regexPref = /\{section\.toggles\.map\(\(toggle\) => \([\s\S]*?<\/label>[\s\S]*?<\/div>[\s\S]*?\)\)\}/;
if(regexPref.test(content)) {
    content = content.replace(regexPref, newPref);
    fs.writeFileSync(p, content, 'utf8');
    console.log("Patched SettingsPreferences.tsx");
} else {
    console.log("Could not find regex in SettingsPreferences.tsx");
}

// Patch CallReport.tsx
let cPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx';
let cContent = fs.readFileSync(cPath, 'utf8');

cContent = cContent.replace('<option>Show Last Call Report</option>', '<option>Calls with Holidays</option>\n                    <option>Show Last Call Report</option>');

let cOldDisp = `if (reportType === 'Show Last Call Report') {`;
let cNewDisp = `if (reportType === 'Calls with Holidays') {
          return reportData.filter(r => (r.isHoliday || r.isWeeklyOff) && (r.docs > 0 || r.chems > 0 || r.stockists > 0));
      }
      
      if (reportType === 'Show Last Call Report') {`;
cContent = cContent.replace(cOldDisp, cNewDisp);

let cOldFetch = `let allHolidays: any[] = [];
        
        try {
            const hRes = await axios.get('/api/xl/extras/holidays');`;
let cNewFetch = `let allHolidays: any[] = [];
        let workingDaysPref: any = { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false };
        
        try {
            const prefRes = await axios.get('/api/xl/settings/preferences');
            if (prefRes.data && prefRes.data.success && prefRes.data.data) {
                if (prefRes.data.data.set_working_days && prefRes.data.data.workingDays) {
                    workingDaysPref = prefRes.data.data.workingDays;
                }
            }
        } catch(e) {}
        
        try {
            const hRes = await axios.get('/api/xl/extras/holidays');`;
cContent = cContent.replace(cOldFetch, cNewFetch);

let cOldSun = `const isSunday = new Date(dStr).getDay() === 0;
  
            let finalActivity = tp.activityType || tp.activity;`;
let cNewSun = `const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayStr = dayNames[new Date(dStr).getDay()];
            const isSunday = !workingDaysPref[dayStr];
  
            let finalActivity = tp.activityType || tp.activity;`;
cContent = cContent.replace(cOldSun, cNewSun);

fs.writeFileSync(cPath, cContent, 'utf8');
console.log("Patched CallReport.tsx");
