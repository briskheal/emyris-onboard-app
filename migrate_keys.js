const { Sequelize, DataTypes, Op } = require('sequelize');
const { XlUser, XlDesignation, XlDoctor, XlChemist, XlStockist, XlCity, XlRoute, XlTourProgram, XlDCR, XlAttendance, XlLeave, XlLeaveType, XlAssignedLeave, XlLeaveTemplate, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification, XlSample, XlGift, XlPrimarySales, XlSecondarySales, XlGeoFencing, XlGlobalSettings, XlHoliday, XlProduct, XlHQ, XlDivision, XlTarget } = require('./db');

async function migrateKeys() {
    try {
        console.log('Fetching all users...');
        const users = await XlUser.findAll();
        console.log(`Found ${users.length} users.`);

        const tablesToMigrate = [
            XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlTourProgram, XlAttendance,
            XlLeave, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification,
            XlDoctor, XlChemist, XlStockist, XlRoute, XlCity, XlAssignedLeave
        ];

        let totalUpdated = 0;

        for (const user of users) {
            if (!user.employeeId) continue; // Skip if they don't have a formal employeeId

            const aliases = [];
            if (user.uid && user.uid !== user.employeeId) aliases.push(user.uid);
            if (user._id && user._id !== user.employeeId) aliases.push(user._id);

            if (aliases.length === 0) continue;

            for (const Table of tablesToMigrate) {
                if (Table) {
                    try {
                        const [updatedRows] = await Table.update(
                            { employeeId: user.employeeId },
                            { where: { employeeId: { [Op.in]: aliases } } }
                        );
                        if (updatedRows > 0) {
                            console.log(`Updated ${updatedRows} rows in ${Table.name} for user ${user.userName || user.firstName} to ${user.employeeId}`);
                            totalUpdated += updatedRows;
                        }
                    } catch (e) {
                        // Some tables might not have employeeId, ignore
                    }
                }
            }
        }

        console.log(`Migration complete! Total rows normalized: ${totalUpdated}`);
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrateKeys();
