const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');
const searchStr = 'const handleDownloadFormat = () => {';
const handleUploadCode = `
  const handleUpload = () => {
    if (targetType === 'Select...') return alert('Select Target Type');
    if (!selectedYear) return alert('Select Year');
    if (!file) return alert('Please choose a file');

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
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

c = c.replace(searchStr, handleUploadCode + '\n  ' + searchStr);
fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Successfully injected handleUpload!');
