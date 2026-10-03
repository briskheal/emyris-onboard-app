const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// 1. Add states to UploadTargetTab
const stateTarget = `const [targetType, setTargetType] = useState('Select...');`;
const stateReplacement = `const [targetType, setTargetType] = useState('Select...');
  const [file, setFile] = useState<File | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);`;

c = c.replace(stateTarget, stateReplacement);

// 2. Add handleUpload function
const handleUploadCode = `
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
  };
`;

const handleDownloadFormatEnd = `XLSX.writeFile(wb, \`Target_Upload_Format_\${selectedHq.replace(/\\s+/g, '_')}.xlsx\`);\r
    };`;

if (c.indexOf(handleDownloadFormatEnd) !== -1) {
    c = c.replace(handleDownloadFormatEnd, handleDownloadFormatEnd + '\n' + handleUploadCode);
} else {
    const fallbackEnd = `XLSX.writeFile(wb, \`Target_Upload_Format_\${selectedHq.replace(/\\s+/g, '_')}.xlsx\`);\n    };`;
    c = c.replace(fallbackEnd, fallbackEnd + '\n' + handleUploadCode);
}

// 3. Update UI Grid (Target Type + File Input -> Year + Target Type + File Input)
const gridTarget = `<div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
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
              <input type="file" accept=".xlsx, .xls" className="text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer w-full" />
            </div>
          </div>
        </div>`;
        
const newGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
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
        </div>`;

// We might have CRLF issues so let's replace more robustly
const gridStart = '<div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">';
const gridEnd = '</div>\n          </div>\n        </div>';

if (c.indexOf(gridStart) !== -1) {
    const endIdx = c.indexOf(gridEnd, c.indexOf(gridStart));
    c = c.substring(0, c.indexOf(gridStart)) + newGrid + c.substring(endIdx + gridEnd.length);
}

// 4. Update Button
const btnTarget = `<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">
            Upload Targets
          </button>`;
const btnFallback1 = `<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg \r\ntransition-colors">
            Upload Targets
          </button>`;
const btnFallback2 = `<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">\r\n            Upload Targets\r\n          </button>`;

const newBtn = `<button disabled={uploading} onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">
            {uploading ? 'Uploading...' : 'Upload Targets'}
          </button>`;

c = c.replace(btnTarget, newBtn);
c = c.replace(btnFallback1, newBtn);
c = c.replace(btnFallback2, newBtn);

// In case the exact replace fails due to formatting, regex replace:
c = c.replace(/<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">\s*Upload Targets\s*<\/button>/, newBtn);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Injected handleUpload successfully!');
