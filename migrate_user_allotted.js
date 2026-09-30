const { Sequelize, DataTypes, Op } = require('sequelize');
const { XlUser, XlDoctor, XlChemist, XlStockist } = require('./db');

async function migrateUserAllotted() {
    try {
        console.log('Fetching all users...');
        const users = await XlUser.findAll();

        const tablesToMigrate = [XlDoctor, XlChemist, XlStockist];

        let totalUpdated = 0;

        for (const user of users) {
            if (!user.employeeId) continue;

            const aliases = [];
            if (user.uid && user.uid !== user.employeeId) aliases.push(user.uid);
            if (user._id && user._id !== user.employeeId) aliases.push(user._id);

            if (aliases.length === 0) continue;

            for (const Table of tablesToMigrate) {
                if (Table) {
                    try {
                        const [updatedRows] = await Table.update(
                            { userAllotted: user.employeeId },
                            { where: { userAllotted: { [Op.in]: aliases } } }
                        );
                        if (updatedRows > 0) {
                            console.log(`Updated ${updatedRows} userAllotted rows in ${Table.name} for user ${user.firstName} to ${user.employeeId}`);
                            totalUpdated += updatedRows;
                        }
                    } catch (e) {
                        console.error('Error on table', Table.name, e);
                    }
                }
            }
        }

        console.log(`Migration complete! Total userAllotted normalized: ${totalUpdated}`);
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrateUserAllotted();
