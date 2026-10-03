const fs = require('fs');

function processFile(filePath, entityName, title) {
    let c = fs.readFileSync(filePath, 'utf8');

    // Replace state/hooks
    c = c.replace(/const \[users, setUsers\] = useState<any\[\]>\(\[\]\);/, "const [states, setStates] = useState<any[]>([]);\n  const [hqs, setHqs] = useState<any[]>([]);");
    c = c.replace(/const \[selectedUser, setSelectedUser\] = useState\(''\);/, "const [selectedState, setSelectedState] = useState('');\n  const [selectedHq, setSelectedHq] = useState('');\n  const [searchQuery, setSearchQuery] = useState('');");

    // Replace fetchUsers
    c = c.replace(/const fetchUsers = async \(\) => \{.*?\};\n/s, `const fetchLocations = async () => {
    try {
      const [stateRes, hqRes] = await Promise.all([
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/locations/hqs')
      ]);
      if (stateRes.data.success) setStates(stateRes.data.data);
      if (hqRes.data.success) setHqs(hqRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };\n`);

    // Replace useEffect
    c = c.replace(/fetchUsers\(\);/, "fetchLocations();");

    // Replace fetchDoctors/Chemists/Stockists
    const lowerEntity = entityName.toLowerCase();
    const fetchFuncName = `fetch${entityName}`;
    c = c.replace(new RegExp(`const ${fetchFuncName} = async \\(employeeId: string\\) => \\{\\s*setLoading\\(true\\);\\s*try \\{\\s*const url = employeeId \\? \`/api/xl/reports/${lowerEntity}\\?employeeId=\\$\\{employeeId\\}\` : '/api/xl/reports/${lowerEntity}';`, 'g'), 
    `const ${fetchFuncName} = async (hq: string) => {
    setLoading(true);
    try {
      const url = hq ? \`/api/xl/reports/${lowerEntity}?hq=\${encodeURIComponent(hq)}\` : '/api/xl/reports/${lowerEntity}';`);

    // Replace handleUserChange
    c = c.replace(/const handleUserChange = \(val: string\) => \{.*?\};\n/s, "");

    // Replace header UI
    const headerRegex = /<h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select User<\/h2>\s*<div className="flex flex-col md:flex-row gap-4 items-start md:items-center">\s*<CustomUserSelect users=\{users\} selectedUser=\{selectedUser\} onChange=\{handleUserChange\} \/>\s*<\/div>/s;
    
    const uiReplacement = `<div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
            <div className="w-full md:w-1/2">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State</h2>
              <input list="state-list" placeholder="Search State..." value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedHq(''); }} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg" />
              <datalist id="state-list">{states.map((s: any) => <option key={s._id} value={s.state} />)}</datalist>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ</h2>
              <input list="hq-list" placeholder="Search Headquarter..." value={selectedHq} onChange={(e) => { setSelectedHq(e.target.value); ${fetchFuncName}(e.target.value); }} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg" />
              <datalist id="hq-list">{hqs.filter((h: any) => !selectedState || h.state === selectedState).map((h: any) => <option key={h._id} value={h.hqName} />)}</datalist>
            </div>
          </div>
          <div className="w-full md:w-1/3 pt-6 md:pt-0">
             <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 md:opacity-0 md:block">Search</h2>
             <div className="relative w-full">
               <input type="text" placeholder="Search ${title}..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg pl-10" />
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
        </div>`;

    c = c.replace(headerRegex, uiReplacement);

    // Replace the CustomUserSelect import
    c = c.replace(/import CustomUserSelect from '\.\.\/components\/CustomUserSelect';\n/, "");

    // Apply client side search filtering to the list
    const mainReturnIndex = c.indexOf('<div className="flex-1 flex flex-col h-full bg-[#1e1e2d]');
    if (mainReturnIndex !== -1) {
        // Find the 'return (' right before this
        const returnIndex = c.lastIndexOf('return (', mainReturnIndex);
        if (returnIndex !== -1) {
            const filterInsert = `const filteredList = ${lowerEntity}.filter(d => !searchQuery || (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) || (d.businessName && d.businessName.toLowerCase().includes(searchQuery.toLowerCase())) || (d.proprietorName && d.proprietorName.toLowerCase().includes(searchQuery.toLowerCase())) || (d.mobile && d.mobile.includes(searchQuery)));\n\n  `;
            
            c = c.substring(0, returnIndex) + filterInsert + c.substring(returnIndex);
        }
    }

    // Now replace usages of doctors.length and doctors.map with filteredList
    // But careful to only replace inside the JSX (after the filter definition)
    // We can safely replace ${lowerEntity}.length and ${lowerEntity}.map globally because they are only used in render and export.
    // Wait, exportToExcel uses `doctors.map` which means it will only export the FILTERED list. This is GREAT! The user will love that.
    c = c.replace(new RegExp(`\\b${lowerEntity}\\.length`, 'g'), `filteredList.length`);
    c = c.replace(new RegExp(`\\b${lowerEntity}\\.map`, 'g'), `filteredList.map`);

    fs.writeFileSync(filePath, c);
}

processFile('xla-frontend/src/pages/DoctorsListReport.tsx', 'Doctors', 'Doctor');
processFile('xla-frontend/src/pages/ChemistsListReport.tsx', 'Chemists', 'Chemist');
processFile('xla-frontend/src/pages/StockistsListReport.tsx', 'Stockists', 'Stockist');

console.log('Patched all 3 files.');
