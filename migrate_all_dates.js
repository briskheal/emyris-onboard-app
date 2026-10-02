const { sequelize, Op } = require('./db');

async function migrateDates() {
    console.log("Starting date standardization to YYYY-MM-DD...");
    const models = Object.values(sequelize.models);

    let totalUpdated = 0;

    for (let model of models) {
        // Only process models with a 'date' column of type STRING
        if (model.rawAttributes.date && model.rawAttributes.date.type.key === 'STRING') {
            console.log(`Checking model: ${model.name}...`);
            
            const records = await model.findAll({
                where: {
                    date: {
                        [Op.like]: '%-%-%', // contains hyphens
                        [Op.notLike]: '202%' // doesn't start with 202x
                    }
                }
            });

            if (records.length > 0) {
                console.log(`Found ${records.length} records in ${model.name} to migrate.`);
                for (let record of records) {
                    const parts = record.date.split('-');
                    if (parts.length === 3) {
                        let [d, m, y] = parts;
                        d = d.padStart(2, '0');
                        m = m.padStart(2, '0');
                        if (y.length === 4) {
                            const newDate = `${y}-${m}-${d}`;
                            record.date = newDate;
                            await record.save();
                            totalUpdated++;
                        }
                    }
                }
            }
        }
    }
    console.log(`Migration complete. Total records updated: ${totalUpdated}`);
}

migrateDates().catch(console.error).finally(() => process.exit(0));
