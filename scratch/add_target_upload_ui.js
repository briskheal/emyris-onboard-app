const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const targetStr = `const [selectedHq, setSelectedHq] = useState('');
  const [targetType, setTargetType] = useState('Select...');`;

const replacement = `const [selectedHq, setSelectedHq] = useState('');
  const [targetType, setTargetType] = useState('Select...');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    if (targetType === 'Select...') {
      alert('Please select a Target Type first.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const res = await axios.post('/api/admin/targets/upload', {
          targetType,
          year: selectedYear,
          data: jsonData
        });
        
        if (res.data.success) {
          alert('Targets successfully uploaded and synchronized! Check the Set Targets tab.');
        } else {
          alert('Error: ' + res.data.message);
        }
      } catch (err: any) {
        alert('Upload failed: ' + err.message);
      } finally {
        setUploading(false);
        e.target.value = null; // reset file input
      }
    };
    reader.readAsArrayBuffer(file);
  };`;

c = c.replace(targetStr, replacement);

const uploadJSX = `          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-rose-400 uppercase tracking-wider">Upload Excel *</label>
            <div className="bg-slate-900 border border-slate-700 rounded-lg flex items-center overflow-hidden">
              <input type="file" accept=".xlsx, .xls" onChange={handleUpload} disabled={uploading} className="text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer w-full" />
            </div>
            {uploading && <p className="text-xs text-sky-400 font-bold mt-1">Processing and syncing...</p>}
          </div>`;

c = c.replace(/<div className="flex flex-col gap-2">\s*<label className="text-sm font-bold text-rose-400 uppercase tracking-wider">Upload Excel \*\/label>[\s\S]*?<\/div>\s*<\/div>/, uploadJSX);

// Add Year Selector next to Target Type
const typeSelectJSX = `<div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Target Type</label>`;
            
const typeSelectReplacement = `<div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 mb-4">
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Target Type</label>`;

c = c.replace(typeSelectJSX, typeSelectReplacement);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Added upload logic to frontend');
