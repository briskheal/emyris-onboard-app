const fs = require('fs');

// Fix DailyCallReport.tsx in Mobile App
const dcrPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/DailyCallReport.tsx';
if (fs.existsSync(dcrPath)) {
    let f = fs.readFileSync(dcrPath, 'utf8');
    f = f.replace(/\['PTS', 'MRP', 'PTR', 'Custom'\]/g, "['PTS', 'MRP', 'PTR', 'CUS']");
    fs.writeFileSync(dcrPath, f);
}

// Fix PrimarySales.tsx in Admin App
const adminPriPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx';
if (fs.existsSync(adminPriPath)) {
    let f = fs.readFileSync(adminPriPath, 'utf8');
    f = f.replace(/>Cus<\/button>/g, ">CUS</button>");
    fs.writeFileSync(adminPriPath, f);
}

// Fix SecondarySales.tsx in Admin App
const adminSecPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx';
if (fs.existsSync(adminSecPath)) {
    let f = fs.readFileSync(adminSecPath, 'utf8');
    f = f.replace(/>Cus<\/button>/g, ">CUS</button>");
    fs.writeFileSync(adminSecPath, f);
}

console.log('Fixed all remaining Cus / Custom inconsistencies');
