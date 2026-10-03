const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace("const [targetType, setTargetType] = useState('Select...');", 
  `const [targetType, setTargetType] = useState('Select...');
  const [file, setFile] = useState<File | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);`);

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

const endTarget = "XLSX.writeFile(wb, `Target_Upload_Format_${selectedHq.replace(/\\s+/g, '_')}.xlsx`);\r\n    };\r\n\r\n    return (";
const endTarget2 = "XLSX.writeFile(wb, `Target_Upload_Format_${selectedHq.replace(/\\s+/g, '_')}.xlsx`);\n    };\n\n    return (";
const newEnd = "XLSX.writeFile(wb, `Target_Upload_Format_${selectedHq.replace(/\\s+/g, '_')}.xlsx`);\n    };\n" + handleUploadCode + "\n    return (";
c = c.replace(endTarget, newEnd);
c = c.replace(endTarget2, newEnd);

// Add Year Dropdown safely
const targetTypeDiv = `<div className="flex flex-col gap-2">\r
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Target Type</label>`;
const targetTypeDiv2 = `<div className="flex flex-col gap-2">\n            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Target Type</label>`;

const yearDiv = `<div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Year *</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>\n          `;

c = c.replace(targetTypeDiv, yearDiv + targetTypeDiv);
c = c.replace(targetTypeDiv2, yearDiv + targetTypeDiv2);

// Change grid-cols-2 to grid-cols-3
const gridClass = `grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50`;
const gridClass3 = `grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50`;
c = c.replace(gridClass, gridClass3);

// Update File input onChange
const fileInput = `<input type="file" accept=".xlsx, .xls" className="text-sm text-slate-400`;
const fileInputNew = `<input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-slate-400`;
c = c.replace(fileInput, fileInputNew);

// Update Button
c = c.replace(
  /<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg[\s\r\n]*transition-colors">[\s\r\n]*Upload Targets[\s\r\n]*<\/button>/g,
  `<button disabled={uploading} onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">
            {uploading ? 'Uploading...' : 'Upload Targets'}
          </button>`
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed gracefully!');
