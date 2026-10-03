const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(/const \[targetType, setTargetType\] = useState\('Select\.\.\.'\);/, 
  `const [targetType, setTargetType] = useState('Select...');
  const [file, setFile] = useState<File | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);`);

c = c.replace(/XLSX\.writeFile\(wb, \`Target_Upload_Format_\S+\.xlsx\`\);[\s\r\n]*};/,
  match => match + `
  
  const handleUpload = () => {
    if (targetType === 'Select...') return alert('Select Target Type');
    if (!selectedYear) return alert('Select Year');
    if (!file) return alert('Please choose a file');

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const res = await axios.post('/api/admin/targets/upload', {
          targetType,
          year: selectedYear,
          data: json
        });
        
        if (res.data.success) {
          alert('Targets uploaded successfully!');
          setFile(null);
        } else {
          alert('Error: ' + res.data.message);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse Excel file');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };`);

c = c.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800\/50 p-6 rounded-2xl border border-slate-700\/50">[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>)/,
  `<div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Year *</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Target Type</label>
            <select value={targetType} onChange={e => setTargetType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="Select...">Select...</option>
              <option value="Qty * Amount">Qty * Amount</option>
              <option value="Lump-Sum">Lump-Sum</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-rose-400 uppercase tracking-wider">Upload Excel *</label>
            <div className="bg-slate-900 border border-slate-700 rounded-lg flex items-center overflow-hidden">
              <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer w-full" />
            </div>
          </div>
        `);

c = c.replace(/<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg[\s\r\n]*transition-colors">[\s\r\n]*Upload Targets[\s\r\n]*<\/button>/g,
  `<button disabled={uploading} onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">
            {uploading ? 'Uploading...' : 'Upload Targets'}
          </button>`);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Done replacement');
