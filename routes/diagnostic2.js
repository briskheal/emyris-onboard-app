const express = require('express');
const router = express.Router();
const { XlPrimarySales, XlStockist, XlPrimarySalesItem } = require('../db');
const { Op, fn, col } = require('sequelize');

router.get('/diagnostic2', async (req, res) => {
    try {
        let groupFields = ['stockist', 'headquarter'];
        let attributes = ['stockist', 'headquarter'];
        
        groupFields.unshift('date'); // this is what is done in routes/xl.js when dateWise=true!
        attributes.unshift('date');
        attributes.push([fn('SUM', col('netInvValue')), 'totalSales']);
        
        const data = await XlPrimarySales.findAll({
            where: { date: { [Op.between]: ['2026-10-01', '2026-10-31'] } },
            attributes: attributes,
            group: groupFields,
            raw: true
        });
        
        // now test the detail query
        const detailData = await XlPrimarySales.findAll({
            where: { date: { [Op.between]: ['2026-10-01', '2026-10-31'] }, stockist: 'STK1' },
            include: [{
                model: XlPrimarySalesItem,
                as: 'items',
                attributes: []
            }],
            attributes: [
                'date',
                [col('items.product'), 'product'],
                [fn('SUM', col('items.qty')), 'quantity'],
                [fn('SUM', col('items.basePrice')), 'averagePrice'],
                [fn('SUM', fn('COALESCE', col('items.basePrice'), 0)), 'totalSales']
            ],
            group: [col('date'), col('items.product')],
            raw: true
        });
        
        res.json({ success: true, main: data, detail: detailData });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});
module.exports = router;
