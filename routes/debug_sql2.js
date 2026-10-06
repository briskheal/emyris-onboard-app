const express = require('express');
const router = express.Router();
const { sequelize } = require('../db');

router.get('/debug-sql2', async (req, res) => {
    try {
        const sql = 
            SELECT p.date, p.stockist, p.headquarter, SUM(p.netInvValue) as totalSales
            FROM xl_primary_sales p
            WHERE p.date BETWEEN '2026-10-01' AND '2026-10-31'
            GROUP BY p.date, p.stockist, p.headquarter
        ;
        const data = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
        res.json({ success: true, data });
    } catch(e) {
        res.json({ success: false, error: e.message, stack: e.stack });
    }
});

module.exports = router;
