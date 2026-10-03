const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const replacementBlock = `      if (type === 'Doctor') {
        let ex = await XlDoctor.findOne({ where: { uid: row.uid } });
        if (!ex && row.name) {
            if (row.mobile && row.mobile.trim() !== '') ex = await XlDoctor.findOne({ where: { name: row.name, mobile: row.mobile } });
            if (!ex && row.headquarter) ex = await XlDoctor.findOne({ where: { name: row.name, headquarter: row.headquarter } });
        }
        if (ex) {
            row.uid = ex.uid; 
            if (ex.doctorCode) row.doctorCode = ex.doctorCode;
            await ex.update(row);
        } else {
            await XlDoctor.create(row);
        }
      }
      if (type === 'Chemist') {
        let ex = await XlChemist.findOne({ where: { uid: row.uid } });
        if (!ex && row.businessName) {
            if (row.mobile && row.mobile.trim() !== '') ex = await XlChemist.findOne({ where: { businessName: row.businessName, mobile: row.mobile } });
            if (!ex && row.headquarter) ex = await XlChemist.findOne({ where: { businessName: row.businessName, headquarter: row.headquarter } });
        }
        if (ex) {
            row.uid = ex.uid; 
            await ex.update(row);
        } else {
            await XlChemist.create(row);
        }
      }
      if (type === 'Stockist') {
        let ex = await XlStockist.findOne({ where: { uid: row.uid } });
        if (!ex && row.businessName) {
            if (row.mobile && row.mobile.trim() !== '') ex = await XlStockist.findOne({ where: { businessName: row.businessName, mobile: row.mobile } });
            if (!ex && row.headquarter) ex = await XlStockist.findOne({ where: { businessName: row.businessName, headquarter: row.headquarter } });
        }
        if (ex) {
            row.uid = ex.uid; 
            await ex.update(row);
        } else {
            await XlStockist.create(row);
        }
      }`;

const lines = c.split(/\r?\n/);
const startIndex = lines.findIndex((l, idx) => idx > 5000 && l.includes("if (type === 'Doctor') {") && lines[idx+1].includes("const ex = await XlDoctor.findOne"));

if (startIndex !== -1) {
    // Replace 12 lines
    lines.splice(startIndex, 12, replacementBlock);
    fs.writeFileSync('routes/admin.js', lines.join('\n'));
    console.log("Successfully patched /dcs/upload deduplication logic");
} else {
    console.log("Could not find the target block to patch!");
}
