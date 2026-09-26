const fs = require('fs');

// 1. Force patch db.js
const dbFile = 'D:/MY WORK FLOW/Emyris Onboard App/db.js';
let db = fs.readFileSync(dbFile, 'utf8');

const hook = "await XlProduct.sync({ alter: true }).catch(() => {});";
const rawSql = `
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
        } catch(e) {}
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
        } catch(e) {}
`;

if (!db.includes("ADD COLUMN uid VARCHAR(255)")) {
    db = db.replace(hook, hook + rawSql);
    fs.writeFileSync(dbFile, db);
    console.log("SUCCESSFULLY Injected UID raw SQL into db.js");
} else {
    console.log("UID injection already present in db.js");
}
