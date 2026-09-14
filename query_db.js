const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join('D:/MY WORK FLOW/Emyris Onboard App', 'onboarding_fallback.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT _id, invoiceNumber, stockist, productsData FROM xl_primary_sales LIMIT 3", [], (err, rows) => {
    if (err) {
        throw err;
    }
    rows.forEach((row) => {
        console.log('Invoice No:', row.invoiceNumber, '| Stockist:', row.stockist);
        console.log('Products Data:', row.productsData);
        console.log('----------------------------------------------------');
    });
});

db.close();
