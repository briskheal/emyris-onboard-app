const fs = require('fs');
let src = fs.readFileSync('routes/admin.js', 'utf8');

const catRegex = /const count = await XlProductCategory\.count\(\);\s*const uid = `CAT\$\{count \+ 1\}`;/;
const catFix = `const all = await XlProductCategory.findAll({ attributes: ['uid'], raw: true });
        let maxNum = 0;
        for (const r of all) {
            const num = parseInt((r.uid || '').replace(/^CAT/i, ''));
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
        let uid = 'CAT' + (maxNum + 1);
        while (await XlProductCategory.count({ where: { uid } }) > 0) {
            maxNum++;
            uid = 'CAT' + (maxNum + 1);
        }`;

const typRegex = /const count = await XlProductType\.count\(\);\s*const uid = `TYP\$\{count \+ 1\}`;/;
const typFix = `const all = await XlProductType.findAll({ attributes: ['uid'], raw: true });
        let maxNum = 0;
        for (const r of all) {
            const num = parseInt((r.uid || '').replace(/^TYP/i, ''));
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
        let uid = 'TYP' + (maxNum + 1);
        while (await XlProductType.count({ where: { uid } }) > 0) {
            maxNum++;
            uid = 'TYP' + (maxNum + 1);
        }`;

const supRegex = /const count = await XlProductSupplier\.count\(\);\s*const uid = `SUP\$\{count \+ 1\}`;/;
const supFix = `const all = await XlProductSupplier.findAll({ attributes: ['uid'], raw: true });
        let maxNum = 0;
        for (const r of all) {
            const num = parseInt((r.uid || '').replace(/^SUP/i, ''));
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
        let uid = 'SUP' + (maxNum + 1);
        while (await XlProductSupplier.count({ where: { uid } }) > 0) {
            maxNum++;
            uid = 'SUP' + (maxNum + 1);
        }`;

if (!catRegex.test(src)) console.log('CAT missing');
if (!typRegex.test(src)) console.log('TYP missing');
if (!supRegex.test(src)) console.log('SUP missing');

src = src.replace(catRegex, catFix);
src = src.replace(typRegex, typFix);
src = src.replace(supRegex, supFix);

fs.writeFileSync('routes/admin.js', src);
console.log('PATCHED ALL SUCCESSFULLY');
