const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../onboarding_fallback.sqlite');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
    { name: 'rapidTestTime', type: 'INTEGER DEFAULT 25' },
    { name: 'activeExamDate', type: 'VARCHAR(255) DEFAULT ""' },
    { name: 'activeExamProduct', type: 'VARCHAR(255) DEFAULT ""' },
    { name: 'examMcqTime', type: 'INTEGER DEFAULT 15' },
    { name: 'examDescriptiveTime', type: 'INTEGER DEFAULT 15' },
    { name: 'examMcqCount', type: 'INTEGER DEFAULT 10' },
    { name: 'targetProductsList', type: 'TEXT' },
    { name: 'customAssetCategories', type: 'TEXT' },
    { name: 'designations', type: 'TEXT' },
    { name: 'requiredDocs', type: 'TEXT' }
];

db.serialize(() => {
    let successCount = 0;
    
    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE onboard_companies ADD COLUMN ${col.name} ${col.type};`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists. Skipping.`);
                } else {
                    console.error(`Error adding column ${col.name}:`, err.message);
                }
            } else {
                console.log(`✅ Added column ${col.name}`);
                successCount++;
            }
        });
    });
    
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database patching complete.');
    });
});
