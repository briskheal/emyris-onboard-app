const fs = require('fs');
let src = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

const target = `<button className="text-emerald-400 font-semibold text-sm hover:underline border border-emerald-500/30 px-6 py-3 rounded-lg hover:bg-emerald-500/10 transition-colors">Download Format</button>`;
const replacement = `<button onClick={handleDownloadFormat} className="text-emerald-400 font-semibold text-sm hover:underline border border-emerald-500/30 px-6 py-3 rounded-lg hover:bg-emerald-500/10 transition-colors">Download Format</button>`;

const fnTarget = `    return (\r\n      <div className="flex-1 min-w-0 overflow-auto p-8 relative z-10">`;
      
const fnReplacement = `    const handleDownloadFormat = async () => {\r\n      const { utils, writeFile } = await import('xlsx');\r\n      let headers = [];\r\n      let filename = '';\r\n\r\n      if (uploadType === 'Doctor') {\r\n        headers = ['Name', 'Degree', 'Specialization', 'Hospital', 'Mobile', 'Clinic Contact', 'Doctor Code', 'Category', 'Address', 'Working Area', 'Birthday', 'Anniversary', 'Email', 'Extra Information'];\r\n        filename = 'doctor_upload_format.xlsx';\r\n      } else if (uploadType === 'Chemist') {\r\n        headers = ['Business Name', 'Proprietor Name', 'Mobile', 'Email', 'Address', 'Working Area', 'Birthday', 'Certifications', 'Extra Information'];\r\n        filename = 'chemist_upload_format.xlsx';\r\n      } else if (uploadType === 'Stockist') {\r\n        headers = ['Business Name', 'Proprietor Name', 'Mobile', 'Email', 'GST', 'Drug License', 'Address', 'Working Area', 'Certifications', 'Extra Information'];\r\n        filename = 'stockist_upload_format.xlsx';\r\n      } else if (uploadType === 'CityOrArea') {\r\n        alert('CityOrArea bulk upload is currently under development on the backend.');\r\n        return;\r\n      }\r\n\r\n      const ws = utils.aoa_to_sheet([headers]);\r\n      const wb = utils.book_new();\r\n      utils.book_append_sheet(wb, ws, 'Template');\r\n      writeFile(wb, filename);\r\n    };\r\n\r\n    return (\r\n      <div className="flex-1 min-w-0 overflow-auto p-8 relative z-10">`;

if (!src.includes(target)) { console.log('target not found'); process.exit(1); }
if (!src.includes(fnTarget)) { console.log('fnTarget not found'); process.exit(1); }

src = src.replace(fnTarget, fnReplacement);
src = src.replace(target, replacement);
fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', src);
console.log('Patched ManageDCS.tsx for Download Format button');
