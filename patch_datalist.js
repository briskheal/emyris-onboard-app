const fs = require('fs');

function replaceDatalist(filePath, fetchFunc) {
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Import CustomLocationSelect
    if (!c.includes('CustomLocationSelect')) {
        c = c.replace(/import \* as XLSX from 'xlsx';/, "import * as XLSX from 'xlsx';\nimport CustomLocationSelect from '../components/CustomLocationSelect';");
    }

    // Replace the datalist HTML blocks
    const oldHtml = /<div className="w-full md:w-1\/2">\s*<h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State<\/h2>[\s\S]*?<\/datalist>\s*<\/div>\s*<div className="w-full md:w-1\/2">\s*<h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ<\/h2>[\s\S]*?<\/datalist>\s*<\/div>/;

    const newHtml = `<div className="w-full md:w-1/2">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State</h2>
              <CustomLocationSelect 
                options={[...new Set((states || []).map((s: any) => s.state))]} 
                selectedValue={selectedState} 
                onChange={(val) => { setSelectedState(val); setSelectedHq(''); }} 
                placeholder="Search State..." 
              />
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ</h2>
              <CustomLocationSelect 
                options={(hqs || []).filter((h: any) => !selectedState || h.state === selectedState).map((h: any) => h.hqName)} 
                selectedValue={selectedHq} 
                onChange={(val) => { setSelectedHq(val); ${fetchFunc}(val); }} 
                placeholder="Search Headquarter..." 
              />
            </div>`;

    c = c.replace(oldHtml, newHtml);
    fs.writeFileSync(filePath, c);
}

replaceDatalist('xla-frontend/src/pages/DoctorsListReport.tsx', 'fetchDoctors');
replaceDatalist('xla-frontend/src/pages/ChemistsListReport.tsx', 'fetchChemists');
replaceDatalist('xla-frontend/src/pages/StockistsListReport.tsx', 'fetchStockists');

console.log("Replaced native datalist with CustomLocationSelect!");
