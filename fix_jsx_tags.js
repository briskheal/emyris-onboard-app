const fs = require('fs');

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // Restore back the whole render function properly
    // Find everything after `return (`
    const returnIndex = content.indexOf('return (\n');
    if (returnIndex === -1) return;

    let headersHTML = `      <div className="flex-1 flex flex-col min-h-screen bg-[#1e1e2d] relative font-sans">
        
        {/* Header / Controls */}
        <div className="p-4 md:p-6 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div>
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State</h2>
                <CustomLocationSelect 
                  options={[...new Set((states || []).map((s: any) => s.stateName))]} 
                  selectedValue={selectedState} 
                  onChange={(val) => { setSelectedState(val); setSelectedHq(''); }} 
                  placeholder="Search State..." 
                />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ</h2>
                <CustomLocationSelect 
                  options={(hqs || []).filter((h: any) => !selectedState || h.state === selectedState).map((h: any) => h.hqName)} 
                  selectedValue={selectedHq} 
                  onChange={(val) => { setSelectedHq(val); fetchDoctors(val); }} 
                  placeholder="Search Headquarter..." 
                />
              </div>
              <div>
               <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 ">Search</h2>
               <div className="relative w-full">
                 <input type="text" placeholder="Search Doctor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg pl-10" />
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
              </div>
            </div>
        </div>
`;
    // For chemists and stockists, fetch function is different
    if (name === 'ChemistsListReport') {
        headersHTML = headersHTML.replace(/fetchDoctors/g, 'fetchChemists');
        headersHTML = headersHTML.replace(/Search Doctor/g, 'Search Chemist');
    } else if (name === 'StockistsListReport') {
        headersHTML = headersHTML.replace(/fetchDoctors/g, 'fetchStockists');
        headersHTML = headersHTML.replace(/Search Doctor/g, 'Search Stockist');
    }

    const midIndex = content.indexOf('{/* Main Table Content */}');
    
    // We replace from `return (` to ` {/* Main Table Content */}`
    content = content.substring(0, returnIndex + 9) + headersHTML + '\n        ' + content.substring(midIndex);

    // Ensure the table structure is perfectly balanced.
    // The previous patches broke the end of the file.
    // Let's just fix the end.
    let tableStartRegex = /<div className="p-4 md:p-6">[\s\S]*?<div className="overflow-x-auto w-full pb-10">/;
    // Basically it goes:
    // <div className="p-4 md:p-6">
    //   ... entries counter ...
    //   <div className="overflow-x-auto w-full pb-10">
    //     <table>...</table>
    //   </div>
    //   <div flex-shrink-0 pagination>
    //     ...
    //   </div>
    // </div>  // close p-4 md:p-6
    // </div> // close min-h-screen
    // );
    // }

    let lastPart = content.substring(content.indexOf('</select>'));
    // we want exactly:
    // </select>
    // </div>
    // </div>
    // </div>
    // </div>
    // </div>
    // );
    // }
    content = content.substring(0, content.indexOf('</select>')) + `</select>
                  </div>
                </div>
              </div>
        </div>
      </div>
    );
}`;

    fs.writeFileSync(file, content);
});

console.log("Fixed JSX perfectly.");
