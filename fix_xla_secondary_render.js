const fs = require('fs');

// --- 1. Fix AllSecondarySales.tsx (XLA) ---
const allSalesPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/AllSecondarySales.tsx';
let allSalesCode = fs.readFileSync(allSalesPath, 'utf8');

// Fix getStockistName to check _id
allSalesCode = allSalesCode.replace(
  'const st = stockists.find(s => s.uid === uid || s.businessName === uid || s.name === uid);',
  'const st = stockists.find(s => s._id === uid || s.uid === uid || s.businessName === uid || s.name === uid);'
);

// Fix Date column rendering to fallback to createdAt or invoiceDate
allSalesCode = allSalesCode.replace(
  '<td className="p-3 text-center border-r border-[#3b3b5a]/50 text-slate-300">{sale.date || \'-\'}</td>',
  '<td className="p-3 text-center border-r border-[#3b3b5a]/50 text-slate-300">{sale.date || (sale.createdAt ? new Date(sale.createdAt).toISOString().split(\'T\')[0] : (sale.invoiceDate || \'-\'))}</td>'
);

// Fix headquarter fallback in UI just in case
allSalesCode = allSalesCode.replace(
  '<td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[150px] text-slate-300">{sale.headquarter || \'-\'}</td>',
  '<td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[150px] text-slate-300">{sale.headquarter || (stockists.find(s => s._id === sale.stockist || s.uid === sale.stockist)?.headquarter || \'-\')}</td>'
);

fs.writeFileSync(allSalesPath, allSalesCode);
console.log('Fixed AllSecondarySales.tsx');

// --- 2. Fix SecondarySales.tsx (XLA Edit Mode) ---
const editSalesPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx';
let editSalesCode = fs.readFileSync(editSalesPath, 'utf8');

// Fix Date initialization
editSalesCode = editSalesCode.replace(
  'date: d.date || \'\',',
  'date: d.date || (d.createdAt ? new Date(d.createdAt).toISOString().split(\'T\')[0] : \'\'),'
);

// Fix headquarter fallback in edit mode (if d.headquarter is missing, pull from stockist)
editSalesCode = editSalesCode.replace(
  'headquarter: d.headquarter || \'\',',
  'headquarter: d.headquarter || (stockists.find(s => s._id === d.stockist || s.uid === d.stockist)?.headquarter || \'\'),'
);

// Ensure the Stockist CustomSelect options match by checking BOTH _id and uid
editSalesCode = editSalesCode.replace(
  'options={filteredStockists.map(s => ({ value: s.uid || s._id, label: s.businessName || s.name || s.uid }))}',
  'options={filteredStockists.map(s => ({ value: s._id || s.uid, label: s.businessName || s.name || s.uid }))}'
);
// Force value to match what the options map to (s._id usually)
editSalesCode = editSalesCode.replace(
  'value={formData.stockist}',
  'value={stockists.find(s => s.uid === formData.stockist || s._id === formData.stockist)?._id || formData.stockist}'
);

fs.writeFileSync(editSalesPath, editSalesCode);
console.log('Fixed SecondarySales.tsx (Edit Form)');

// --- 3. Fix backend routes/xl.js to inject missing HQ on save/update ---
const xlPath = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let xlCode = fs.readFileSync(xlPath, 'utf8');

const postSaveOld = `const sale = await XlSecondarySales.create({
            employeeId,
            date,
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,`;

const postSaveNew = `let finalHq = headquarter;
        if (!finalHq && stockist) {
            const { XlStockist } = require('../db');
            const st = await XlStockist.findOne({ where: { [require('sequelize').Op.or]: [{ _id: stockist }, { uid: stockist }] } });
            if (st) finalHq = st.headquarter;
        }

        const sale = await XlSecondarySales.create({
            employeeId,
            date: date || invoiceDate || new Date().toISOString(),
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter: finalHq,
            stockist,`;

xlCode = xlCode.replace(postSaveOld, postSaveNew);

const putUpdateOld = `const sale = await XlSecondarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Not found' });

        sale.date = date || sale.date;
        sale.month = month || sale.month;
        sale.year = year || sale.year;
        sale.invoiceDate = invoiceDate || sale.invoiceDate;
        sale.invoiceNumber = invoiceNumber || sale.invoiceNumber;
        sale.division = division || sale.division;
        sale.headquarter = headquarter || sale.headquarter;
        sale.stockist = stockist || sale.stockist;`;

const putUpdateNew = `const sale = await XlSecondarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Not found' });

        let finalHq = headquarter || sale.headquarter;
        let activeStockist = stockist || sale.stockist;
        if (!finalHq && activeStockist) {
            const { XlStockist } = require('../db');
            const st = await XlStockist.findOne({ where: { [require('sequelize').Op.or]: [{ _id: activeStockist }, { uid: activeStockist }] } });
            if (st) finalHq = st.headquarter;
        }

        sale.date = date || sale.date;
        sale.month = month || sale.month;
        sale.year = year || sale.year;
        sale.invoiceDate = invoiceDate || sale.invoiceDate;
        sale.invoiceNumber = invoiceNumber || sale.invoiceNumber;
        sale.division = division || sale.division;
        sale.headquarter = finalHq;
        sale.stockist = activeStockist;`;

xlCode = xlCode.replace(putUpdateOld, putUpdateNew);

fs.writeFileSync(xlPath, xlCode);
console.log('Fixed routes/xl.js to inject missing HQ and Date');
