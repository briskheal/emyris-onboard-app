const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// Replace the SELECT USER TO ALLOT block with nothing
c = c.replace(
    /<div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT USER TO ALLOT \*<\/label><select value=\{formData\.userAllotted\} onChange=\{e=>setFormData\(\{\.\.\.formData, userAllotted: e\.target\.value\}\)\} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select User<\/option>\{users\.map\(u => <option key=\{u\._id\} value=\{u\._id\}>\{u\.firstName\} \{u\.lastName\}<\/option>\)\}<\/select><\/div>/g,
    ''
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Removed SELECT USER TO ALLOT dropdown from all Create DCS tabs');
