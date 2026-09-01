const fs = require('fs');

// --- 1. PATCH ADMIN.JS FOR DEDUPLICATION ---
let admin = fs.readFileSync('routes/admin.js', 'utf8');

admin = admin.replace(
  "const ex = await XlDoctor.findOne({ where: { uid: row.uid } });\n          if (ex) await ex.update(row); else await XlDoctor.create(row);",
  "let ex = await XlDoctor.findOne({ where: { uid: row.uid } });\n          if (!ex && row.name && row.mobile) ex = await XlDoctor.findOne({ where: { name: row.name, mobile: row.mobile } });\n          if (!ex && row.name && row.headquarter) ex = await XlDoctor.findOne({ where: { name: row.name, headquarter: row.headquarter } });\n          if (ex) { row.uid = ex.uid; await ex.update(row); } else await XlDoctor.create(row);"
);

admin = admin.replace(
  "const ex = await XlChemist.findOne({ where: { uid: row.uid } });\n          if (ex) await ex.update(row); else await XlChemist.create(row);",
  "let ex = await XlChemist.findOne({ where: { uid: row.uid } });\n          if (!ex && row.businessName && row.mobile) ex = await XlChemist.findOne({ where: { businessName: row.businessName, mobile: row.mobile } });\n          if (!ex && row.businessName && row.headquarter) ex = await XlChemist.findOne({ where: { businessName: row.businessName, headquarter: row.headquarter } });\n          if (ex) { row.uid = ex.uid; await ex.update(row); } else await XlChemist.create(row);"
);

admin = admin.replace(
  "const ex = await XlStockist.findOne({ where: { uid: row.uid } });\n          if (ex) await ex.update(row); else await XlStockist.create(row);",
  "let ex = await XlStockist.findOne({ where: { uid: row.uid } });\n          if (!ex && row.businessName && row.mobile) ex = await XlStockist.findOne({ where: { businessName: row.businessName, mobile: row.mobile } });\n          if (!ex && row.businessName && row.headquarter) ex = await XlStockist.findOne({ where: { businessName: row.businessName, headquarter: row.headquarter } });\n          if (ex) { row.uid = ex.uid; await ex.update(row); } else await XlStockist.create(row);"
);

fs.writeFileSync('routes/admin.js', admin);
console.log('Fixed deduplication in admin.js');

// --- 2. PATCH UI TO EXPORT UID ---
const exportFiles = [
  'xla-frontend/src/pages/ManageDCS.tsx',
  'xla-frontend/src/pages/ChemistsListReport.tsx',
  'xla-frontend/src/pages/StockistsListReport.tsx',
  'xla-frontend/src/pages/DoctorsListReport.tsx'
];

for (let file of exportFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // ManageDCS
    if (file.includes('ManageDCS')) {
      content = content.replace(
        "if(filterType === 'Doctor') return { 'Sr no.': i+1, Name: d.name, Degree: d.degree, Specialization: d.specialization, Hospital: d.hospital, 'Mobile Number': d.mobile, HQ: d.headquarter };",
        "if(filterType === 'Doctor') return { 'Sr no.': i+1, UID: d.uid, Name: d.name, Degree: d.degree, Specialization: d.specialization, Hospital: d.hospital, 'Mobile Number': d.mobile, HQ: d.headquarter };"
      );
      content = content.replace(
        "else return { 'Sr no.': i+1, 'Business Name': d.businessName, 'Proprietor Name': d.proprietorName || d.name, Address: d.address, 'Mobile Number': d.mobile || d.contact, HQ: d.headquarter };",
        "else return { 'Sr no.': i+1, UID: d.uid, 'Business Name': d.businessName, 'Proprietor Name': d.proprietorName || d.name, Address: d.address, 'Mobile Number': d.mobile || d.contact, HQ: d.headquarter };"
      );
    }
    
    // Chemists/Stockists/Doctors
    else {
      content = content.replace(
        "'Sr no.': i + 1,",
        "'Sr no.': i + 1,\n        UID: c.uid,"
      );
    }
    
    fs.writeFileSync(file, content);
    console.log('Added UID to export in ' + file);
  }
}
