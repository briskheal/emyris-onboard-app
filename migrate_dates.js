const { XlDCR, XlPrimarySales, XlSecondarySales, XlHoliday, sequelize, Op } = require('./db');

async function standardizeDates() {
    console.log("Starting date standardization to YYYY-MM-DD...");

    const models = [
        { model: XlDCR, name: 'XlDCR' },
        { model: XlPrimarySales, name: 'XlPrimarySales' },
        { model: XlSecondarySales, name: 'XlSecondarySales' },
        { model: XlHoliday, name: 'XlHoliday' }
    ];

    for (let { model, name } of models) {
        console.log(`Checking ${name}...`);
        
        // Find records where date contains a hyphen but doesn't start with a 4-digit year
        // e.g., 01-09-2026
        const records = await model.findAll({
            where: {
                date: {
                    [Op.like]: '%-%-%',
                    [Op.notLike]: '202%' // Assuming years in 202x
                }
            }
        });

        console.log(`Found ${records.length} records in ${name} needing conversion.`);

        for (let record of records) {
            const dateStr = record.date;
            // Expected DD-MM-YYYY or D-M-YYYY
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                let d = parts[0];
                let m = parts[1];
                let y = parts[2];
                
                // If it's MM/DD/YYYY? Unlikely with dashes, but let's assume DD-MM-YYYY
                // Standardize to YYYY-MM-DD
                d = d.padStart(2, '0');
                m = m.padStart(2, '0');
                
                if (y.length === 4) {
                    const newDate = `${y}-${m}-${d}`;
                    record.date = newDate;
                    await record.save();
                    console.log(`Converted ${dateStr} to ${newDate}`);
                }
            }
        }
    }
    console.log("Finished standardization.");
}

standardizeDates().catch(console.error);
