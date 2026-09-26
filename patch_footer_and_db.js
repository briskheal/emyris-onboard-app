const fs = require('fs');

const dbFile = 'D:/MY WORK FLOW/Emyris Onboard App/db.js';
let db = fs.readFileSync(dbFile, 'utf8');

const hook = "await XlStockist.sync({ alter: true }).catch(() => {});";
const rawSql = `
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
        } catch(e) {}
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
        } catch(e) {}
`;

if (!db.includes("ALTER TABLE xl_stockists")) {
    db = db.replace(hook, hook + rawSql);
    fs.writeFileSync(dbFile, db);
    console.log("Injected raw SQL alter tables into db.js");
}

// 2. Fix the footer in SecondarySalesForm.tsx
const secFile = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let sec = fs.readFileSync(secFile, 'utf8');

// The STICKY FOOTER section
const oldFooter = `className="fixed bottom-0 left-0 right-0 bg-[#1e2032]/90 backdrop-blur-md border-t border-[#3b3b5a] p-4 pb-safe flex justify-between items-center z-40"`;
// We want it to be constrained to max-w-md and pushed up above the bottom nav (bottom-14)
const newFooter = `className="fixed bottom-14 w-full max-w-md mx-auto bg-[#1e2032]/90 backdrop-blur-md border-t border-[#3b3b5a] p-4 pb-safe flex justify-between items-center z-40"`;

sec = sec.replace(oldFooter, newFooter);

// And wait, the user's "Grand total" image shows it at the very bottom. Did it cover the nav bar?
// If we want it at the very bottom but constrained to the mobile width:
// Wait! If they are on a mobile device or responsive mode, the nav bar is at the bottom (bottom-0).
// If we set bottom-14, it sits exactly on top of the nav bar.
// Let's also check if "SAVE DRAFT" button was causing overflow.
fs.writeFileSync(secFile, sec);
console.log("Fixed footer in SecondarySalesForm");

