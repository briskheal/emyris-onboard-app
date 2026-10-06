const express = require('express');
const router = express.Router();
const { sequelize } = require('../db');

router.get('/debug-sql', async (req, res) => {
    try {
        const sql = 
            SELECT stockist, headquarter, SUM(netInvValue) as totalSales
            FROM xl_primary_sales
            WHERE date BETWEEN '2026-10-01' AND '2026-10-31'
            GROUP BY stockist, headquarter
        ;
        const data = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
        res.json({ success: true, data });
    } catch(e) {
        res.json({ success: false, error: e.message, stack: e.stack });
    }
});

module.exports = router;
