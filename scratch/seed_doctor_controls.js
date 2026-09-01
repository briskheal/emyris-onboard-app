const { XlDoctorControl, sequelize } = require('../models/xlModels.js'); // Actually, need to require from db.js
const { XlDoctorControl: XlDC } = require('../db');
const XLSX = require('xlsx');

async function seed() {
    await XlDC.destroy({ where: {} }); // Clear old ones

    const insertFile = async (filename, type) => {
        try {
            const wb = XLSX.readFile(filename);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const rows = data.slice(1).filter(r => r && r.length > 0 && r[1] && typeof r[1] === 'string' && !r[1].startsWith('Date of File'));
            
            const records = [];
            for (let r of rows) {
                let name = r[1].trim();
                let location = null;

                if (type === 'Hospital' && name.includes(',')) {
                    const parts = name.split(',');
                    name = parts[0].trim();
                    location = parts[1].trim();
                }

                records.push({ type, name, location, isActive: true });
            }

            await XlDC.bulkCreate(records);
            console.log(`Seeded ${records.length} ${type}s`);
        } catch (e) {
            console.error(`Error in ${type}: ${e.message}`);
        }
    };

    await insertFile('REPORTING MODULE/Category.xlsx', 'Category');
    await insertFile('REPORTING MODULE/Degree.xlsx', 'Degree');
    await insertFile('REPORTING MODULE/Specialization.xlsx', 'Specialization');
    await insertFile('REPORTING MODULE/Hospitals.xlsx', 'Hospital');
}

seed().then(() => {
    console.log('Seeding complete');
    process.exit(0);
});
