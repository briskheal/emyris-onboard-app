const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/EmyrisDateRangePicker.tsx', 'utf8');

const regex = /<div className="p-4 mt-auto space-y-2">[\s\S]*?days starting today<\/span>\s*<\/div>\s*<\/div>/;
const repl = `<div className="p-4 mt-auto space-y-2">
            <div 
              className="bg-[#27273f] rounded px-3 py-2 text-xs text-slate-400 flex justify-between items-center border border-[#3b3b5a] cursor-pointer hover:bg-[#3b3b5a]"
              onClick={() => {
                const now = new Date();
                const first = new Date(now.getFullYear(), now.getMonth(), 1);
                setStartDate(first);
                setEndDate(now);
              }}
            >
              <span className="font-bold text-slate-300">{new Date().getDate()}</span> <span className="text-[10px]">days up to today</span>
            </div>
            <div className="bg-[#27273f] rounded px-3 py-2 text-xs text-slate-400 flex justify-between items-center border border-[#3b3b5a]">
              <input 
                type="number" 
                className="w-12 bg-transparent text-slate-300 font-bold outline-none border-b border-slate-500 focus:border-sky-500" 
                placeholder="-" 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    const now = new Date();
                    const future = new Date(now);
                    future.setDate(now.getDate() + val);
                    setStartDate(now);
                    setEndDate(future);
                  }
                }}
              />
              <span className="text-[10px]">days starting today</span>
            </div>
          </div>`;

f = f.replace(regex, repl);
fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/EmyrisDateRangePicker.tsx', f);
console.log("Patched Date Range Picker");
