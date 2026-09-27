const fs = require('fs');
const path = require('path');

const xlJsPath = path.join('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js');
let xlJs = fs.readFileSync(xlJsPath, 'utf8');

// We want to replace the `auto-populate` endpoint with one that correctly checks multiple identifiers for the stockist and supports both `product` and `productId` keys.
const autoPopulateOriginal = /router\.get\('\/secondary-sales-data\/auto-populate', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, message: error\.message \}\);\s*\}\s*\}\);/;

const autoPopulateReplacement = `router.get('/secondary-sales-data/auto-populate', async (req, res) => {
    try {
        const { stockist, month, year } = req.query;
        if (!stockist || !month || !year) return res.json({ success: true, data: [] });
        
        const { XlStockist } = require('../db');
        const { Op } = require('sequelize');

        // Look up the stockist to get all its possible identifiers (uid, _id, businessName, name)
        const targetStockist = await XlStockist.findOne({
            where: {
                [Op.or]: [
                    { uid: stockist },
                    { _id: stockist },
                    { businessName: stockist },
                    { name: stockist }
                ]
            }
        });

        // Search using all available aliases to support older records and newer records simultaneously
        const searchIds = [stockist];
        if (targetStockist) {
            if (targetStockist.uid) searchIds.push(targetStockist.uid);
            if (targetStockist._id) searchIds.push(targetStockist._id);
            if (targetStockist.businessName) searchIds.push(targetStockist.businessName);
            if (targetStockist.name) searchIds.push(targetStockist.name);
        }

        const sales = await XlPrimarySales.findAll({ where: { stockist: { [Op.in]: searchIds }, month, year } });

        const productMap = {}; // productId -> receivedQty

        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const pid = r.productId || r.product; // Fallback to handle both desktop and mobile schema
                        if (!pid) return;
                        if (!productMap[pid]) productMap[pid] = 0;
                        productMap[pid] += (Number(r.quantity) || Number(r.qty) || 0) + (Number(r.freeStocks) || Number(r.free) || 0);
                    });
                } catch(e) {}
            }
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const prevMonthIndex = months.indexOf(month) - 1;
        const prevMonth = prevMonthIndex >= 0 ? months[prevMonthIndex] : 'Dec';
        const prevYear = prevMonthIndex >= 0 ? year : String(Number(year) - 1);

        const prevSecSales = await XlSecondarySales.findAll({
            where: { stockist: { [Op.in]: searchIds }, month: prevMonth, year: prevYear }
        });

        const closingMap = {}; // productId -> closingQty
        prevSecSales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const pid = r.productId || r.product;
                        if (pid) {
                            closingMap[pid] = Number(r.closingQty) || 0;
                        }
                    });
                } catch(e) {}
            }
        });

        const allProductIds = [...new Set([...Object.keys(productMap), ...Object.keys(closingMap)])];
        const result = allProductIds.map(productId => {
            return {
                productId,
                receivedQty: productMap[productId] || 0,
                openingQty: closingMap[productId] || 0
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});`;

xlJs = xlJs.replace(autoPopulateOriginal, autoPopulateReplacement);

// Now patch opening-balance
const openingBalanceOriginal = /router\.get\('\/secondary-sales-data\/opening-balance', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, error: error\.message \}\);\s*\}\s*\}\);/;
const openingBalanceReplacement = `router.get('/secondary-sales-data/opening-balance', async (req, res) => {
    try {
        const { stockist, prevMonth, prevYear, productId } = req.query;
        const { XlStockist } = require('../db');
        const { Op } = require('sequelize');

        const targetStockist = await XlStockist.findOne({
            where: {
                [Op.or]: [
                    { uid: stockist },
                    { _id: stockist },
                    { businessName: stockist },
                    { name: stockist }
                ]
            }
        });
        const searchIds = [stockist];
        if (targetStockist) {
            if (targetStockist.uid) searchIds.push(targetStockist.uid);
            if (targetStockist._id) searchIds.push(targetStockist._id);
            if (targetStockist.businessName) searchIds.push(targetStockist.businessName);
            if (targetStockist.name) searchIds.push(targetStockist.name);
        }

        const sales = await XlSecondarySales.findAll({
            where: { stockist: { [Op.in]: searchIds }, month: prevMonth, year: prevYear }
        });
        
        let openingQty = 0;
        
        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const pid = r.productId || r.product;
                        if (pid === productId) {
                            openingQty += (Number(r.closingQty) || 0);
                        }
                    });
                } catch(e) {}
            }
        });
        
        res.json({ success: true, openingQty });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
xlJs = xlJs.replace(openingBalanceOriginal, openingBalanceReplacement);


// Now patch primary-received
const primaryReceivedOriginal = /router\.get\('\/secondary-sales-data\/primary-received', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, error: error\.message \}\);\s*\}\s*\}\);/;
const primaryReceivedReplacement = `router.get('/secondary-sales-data/primary-received', async (req, res) => {
    try {
        const { stockist, month, year, productId } = req.query;
        const { XlStockist } = require('../db');
        const { Op } = require('sequelize');

        const targetStockist = await XlStockist.findOne({
            where: {
                [Op.or]: [
                    { uid: stockist },
                    { _id: stockist },
                    { businessName: stockist },
                    { name: stockist }
                ]
            }
        });
        const searchIds = [stockist];
        if (targetStockist) {
            if (targetStockist.uid) searchIds.push(targetStockist.uid);
            if (targetStockist._id) searchIds.push(targetStockist._id);
            if (targetStockist.businessName) searchIds.push(targetStockist.businessName);
            if (targetStockist.name) searchIds.push(targetStockist.name);
        }

        const sales = await XlPrimarySales.findAll({
            where: { stockist: { [Op.in]: searchIds }, month, year }
        });
        
        let receivedQty = 0;
        
        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const pid = r.productId || r.product;
                        if (pid === productId) {
                            receivedQty += (Number(r.quantity) || Number(r.qty) || 0) + (Number(r.freeStocks) || Number(r.free) || 0);
                        }
                    });
                } catch(e) {}
            }
        });
        
        res.json({ success: true, receivedQty });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
xlJs = xlJs.replace(primaryReceivedOriginal, primaryReceivedReplacement);

fs.writeFileSync(xlJsPath, xlJs);
console.log("Successfully patched xl.js API endpoints!");
