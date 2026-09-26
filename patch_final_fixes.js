const fs = require('fs');

// 1. Fix Layout.tsx clearNotifications
const layoutFile = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/components/Layout.tsx';
let layout = fs.readFileSync(layoutFile, 'utf8');
if (layout.includes('setNotifications([]);') && !layout.includes('setShowNotifMenu(false);')) {
    layout = layout.replace(
        'setNotifications([]);',
        'setNotifications([]);\n      setShowNotifMenu(false);'
    );
    fs.writeFileSync(layoutFile, layout);
    console.log('Fixed Layout.tsx');
}

// 2. Fix SecondarySalesForm.tsx modal boundary
const secSalesFile = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let secSales = fs.readFileSync(secSalesFile, 'utf8');
if (secSales.includes('className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-200"')) {
    secSales = secSales.replace(
        'className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-200"',
        'className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-200"'
    );
    fs.writeFileSync(secSalesFile, secSales);
    console.log('Fixed SecondarySalesForm.tsx');
}

// 3. Fix db.js startup sync for XlStockist and XlProduct
const dbFile = 'D:/MY WORK FLOW/Emyris Onboard App/db.js';
let db = fs.readFileSync(dbFile, 'utf8');
if (!db.includes('await XlStockist.sync({ alter: true })')) {
    const hook = "await XlTarget.sync({ alter: true });";
    db = db.replace(
        hook,
        hook + "\n        await XlStockist.sync({ alter: true }).catch(() => {});\n        await XlProduct.sync({ alter: true }).catch(() => {});"
    );
    fs.writeFileSync(dbFile, db);
    console.log('Fixed db.js sync');
}
