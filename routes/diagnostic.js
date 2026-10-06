const express = require('express');
const router = express.Router();
const { XlPrimarySales, XlPrimarySalesItem, sequelize } = require('../db');

router.get('/diagnostic', async (req, res) => {
    try {
        const sales = await XlPrimarySales.findAll({ limit: 5, raw: true });
        const items = await XlPrimarySalesItem.findAll({ limit: 5, raw: true });
        res.json({ success: true, sales, items });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

module.exports = router;
