const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('const [dashboardStats, setDashboardStats] = useState<any>(null);')) {
    c = c.replace(/const \[monthInput, setMonthInput\] = useState\('2026-09'\);/, 
`const [monthInput, setMonthInput] = useState('2026-09');
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
      const [year, monthNum] = monthInput.split('-');
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const month = monthNames[parseInt(monthNum) - 1];
      
      let url = \`/api/xl/admin/dashboard-stats?month=\${month}&year=\${year}\`;
      if (selectedDashboardUser) {
          url += \`&employeeId=\${selectedDashboardUser._id || selectedDashboardUser.employeeId || selectedDashboardUser.uid}\`;
      }
      
      axios.get(url).then(res => {
          if (res.data.success) {
              setDashboardStats(res.data.data);
          }
      }).catch(e => console.error(e));
  }, [monthInput, selectedDashboardUser]);`);
}

c = c.replace(/\{\/\* The Two Graphs \*\/\}[\s\S]*?\{\/\* Calls vs Targets \*\/\}/m,
`{/* The Two Graphs */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
              {/* Graph 1: Target vs Primary vs Secondary */}
              {(() => {
                 const targetSales = dashboardStats ? dashboardStats.target : 0;
                 const primarySales = dashboardStats ? dashboardStats.primary : 0;
                 const secondarySales = dashboardStats ? dashboardStats.secondary : 0;
                 const maxS = Math.max(targetSales, primarySales, secondarySales, 1000);
                 // Round up to nearest nice number
                 const maxSales = Math.ceil(maxS / 1000) * 1000;
                 return (
                 <div className="flex flex-col relative w-full pr-4 pb-8 pl-12">
                    <div className="absolute inset-0 pl-12 pb-8 pr-4 flex flex-col justify-between pointer-events-none">
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{maxSales}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.8)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.6)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.4)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxSales*0.2)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a] w-full h-0 relative"><span className="absolute -left-12 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">0</span></div>
                    </div>
                    
                    <div className="relative h-64 flex items-end justify-around w-full z-10 pt-2 border-l border-slate-200 dark:border-[#3b3b5a]">
                       <div className="w-14 md:w-20 bg-sky-500 transition-all hover:opacity-90 relative group" title={'₹' + targetSales.toLocaleString()} style={{height: \`\${(targetSales/maxSales)*100}%\`}}></div>
                       <div className="w-14 md:w-20 bg-emerald-500 transition-all hover:opacity-90 relative group" title={'₹' + primarySales.toLocaleString()} style={{height: \`\${(primarySales/maxSales)*100}%\`}}></div>
                       <div className="w-14 md:w-20 bg-orange-500 transition-all hover:opacity-90 relative group" title={'₹' + secondarySales.toLocaleString()} style={{height: \`\${(secondarySales/maxSales)*100}%\`}}></div>
                    </div>
                    
                    <div className="flex justify-around mt-4 text-xs font-semibold text-slate-500 dark:text-[#8b8baf] ml-[-12px]">
                       <span className="w-14 md:w-20 text-center">Target</span>
                       <span className="w-14 md:w-20 text-center">Primary</span>
                       <span className="w-14 md:w-20 text-center">Secondary</span>
                    </div>
                    
                    <div className="text-center mt-6 text-sm font-bold text-slate-700 dark:text-white">Target vs Primary vs Secondary</div>
                 </div>
                 );
              })()}

              {/* Graph 2: Reports Submitted */}
              {(() => {
                 const docCalls = dashboardStats?.calls?.doctor?.actual || 0;
                 const chemCalls = dashboardStats?.calls?.chemist?.actual || 0;
                 const stockCalls = dashboardStats?.calls?.stockist?.actual || 0;
                 const maxR = Math.max(docCalls, chemCalls, stockCalls, 10);
                 const maxRep = Math.ceil(maxR / 10) * 10;
                 return (
                 <div className="flex flex-col relative w-full pr-4 pb-8 pl-12">
                    <div className="absolute inset-0 pl-12 pb-8 pr-4 flex flex-col justify-between pointer-events-none">
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{maxRep}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.8)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.6)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.4)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a]/30 w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">{Math.round(maxRep*0.2)}</span></div>
                       <div className="border-t border-slate-200 dark:border-[#3b3b5a] w-full h-0 relative"><span className="absolute -left-10 -top-2.5 text-[10px] text-slate-500 dark:text-[#8b8baf]">0</span></div>
                    </div>
                    
                    <div className="relative h-64 flex items-end justify-around w-full z-10 pt-2 border-l border-slate-200 dark:border-[#3b3b5a]">
                       <div className="w-14 md:w-20 bg-sky-500 transition-all hover:opacity-90 relative group" title={String(docCalls)} style={{height: \`\${(docCalls/maxRep)*100}%\`}}></div>
                       <div className="w-14 md:w-20 bg-emerald-500 transition-all hover:opacity-90 relative group" title={String(chemCalls)} style={{height: \`\${(chemCalls/maxRep)*100}%\`}}></div>
                       <div className="w-14 md:w-20 bg-orange-500 transition-all hover:opacity-90 relative group" title={String(stockCalls)} style={{height: \`\${(stockCalls/maxRep)*100}%\`}}></div>
                    </div>

                    <div className="flex justify-around mt-4 text-xs font-semibold text-slate-500 dark:text-[#8b8baf] ml-[-12px]">
                       <span className="w-14 md:w-20 text-center">Doctor</span>
                       <span className="w-14 md:w-20 text-center">Chemist</span>
                       <span className="w-14 md:w-20 text-center">Stockist</span>
                    </div>
                    
                    <div className="text-center mt-6 text-sm font-bold text-slate-700 dark:text-white">Reports Submitted</div>
                 </div>
                 );
              })()}
           </div>
        </div>

        {/* Calls Section and Call Averages */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
          {/* Calls vs Targets */}`);

// Now fix the calls vs targets cards
c = c.replace(/<span className="text-2xl font-black text-emerald-400 block mb-1">11 <span className="text-sm font-semibold text-slate-500">\/ 4127<\/span><\/span>/,
`<span className="text-2xl font-black text-emerald-400 block mb-1">{dashboardStats?.calls?.doctor?.actual || 0} <span className="text-sm font-semibold text-slate-500">/ {dashboardStats?.calls?.doctor?.target || 0}</span></span>`);

c = c.replace(/<span className="text-2xl font-black text-amber-400 block mb-1">1 <span className="text-sm font-semibold text-slate-500">\/ 0<\/span><\/span>/,
`<span className="text-2xl font-black text-amber-400 block mb-1">{dashboardStats?.calls?.chemist?.actual || 0} <span className="text-sm font-semibold text-slate-500">/ {dashboardStats?.calls?.chemist?.target || 0}</span></span>`);

c = c.replace(/<span className="text-2xl font-black text-rose-400 block mb-1">3 <span className="text-sm font-semibold text-slate-500">\/ 0<\/span><\/span>/,
`<span className="text-2xl font-black text-rose-400 block mb-1">{dashboardStats?.calls?.stockist?.actual || 0} <span className="text-sm font-semibold text-slate-500">/ {dashboardStats?.calls?.stockist?.target || 0}</span></span>`);

// Call Averages cards
c = c.replace(/<span className="text-3xl font-black text-emerald-400">0\.9<\/span>/, 
`<span className="text-3xl font-black text-emerald-400">{dashboardStats?.calls?.doctor?.target ? (dashboardStats.calls.doctor.actual / dashboardStats.calls.doctor.target).toFixed(1) : 0}</span>`);
c = c.replace(/<span className="text-3xl font-black text-amber-400">0\.1<\/span>/,
`<span className="text-3xl font-black text-amber-400">{dashboardStats?.calls?.chemist?.target ? (dashboardStats.calls.chemist.actual / dashboardStats.calls.chemist.target).toFixed(1) : 0}</span>`);
c = c.replace(/<span className="text-3xl font-black text-rose-400">0\.3<\/span>/,
`<span className="text-3xl font-black text-rose-400">{dashboardStats?.calls?.stockist?.target ? (dashboardStats.calls.stockist.actual / dashboardStats.calls.stockist.target).toFixed(1) : 0}</span>`);


fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed graphs in Dashboard');
