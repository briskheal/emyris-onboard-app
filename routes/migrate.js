const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { XlUser, XlDesignation, XlDoctor, XlChemist, XlStockist, XlCity, XlRoute, XlTourProgram, XlDCR, XlAttendance, XlLeave, XlLeaveType, XlAssignedLeave, XlLeaveTemplate, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification, XlSample, XlGift, XlPrimarySales, XlSecondarySales, XlGeoFencing, XlGlobalSettings, XlHoliday, XlProduct, XlHQ, XlDivision, XlTarget } = require('../db');

router.get('/admin/migrate-keys', async (req, res) => {
    try {
        const users = await XlUser.findAll();
        const tablesToMigrate = [
            XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlTourProgram, XlAttendance,
            XlLeave, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification,
            XlDoctor, XlChemist, XlStockist, XlRoute, XlCity, XlAssignedLeave
        ];

        let totalUpdated = 0;
        let logs = [];

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
                            { employeeId: user.employeeId },
                            { where: { employeeId: { [Op.in]: aliases } } }
                        );
                        if (updatedRows > 0) {
                            logs.push(`Updated ${updatedRows} rows in ${Table.name} for user ${user.firstName} to ${user.employeeId}`);
                            totalUpdated += updatedRows;
                        }
                    } catch (e) {
                        // Ignore if table has no employeeId
                    }
                }
            }
        }

        
        for (const user of users) {
            if (!user.employeeId) continue;
            const aliases = [];
            if (user.uid && user.uid !== user.employeeId) aliases.push(user.uid);
            if (user._id && user._id !== user.employeeId) aliases.push(user._id);
            if (aliases.length === 0) continue;
            
            const clientTables = [XlDoctor, XlChemist, XlStockist];
            for (const Table of clientTables) {
                if (Table) {
                    try {
                        const [updatedRows] = await Table.update(
                            { userAllotted: user.employeeId },
                            { where: { userAllotted: { [Op.in]: aliases } } }
                        );
                        if (updatedRows > 0) {
                            logs.push(`Updated ${updatedRows} userAllotted rows in ${Table.name} for user ${user.firstName} to ${user.employeeId}`);
                            totalUpdated += updatedRows;
                        }
                    } catch (e) {}
                }
            }
        }
        res.json({
            success: true,
            message: `Migration complete! Total rows normalized: ${totalUpdated}`,
            logs
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
