const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const routeCode = `
router.post('/targets/upload', async (req, res) => {
    try {
        const { targetType, year, data } = req.body;
        if (!data || !Array.isArray(data)) return res.json({ success: false, message: 'Invalid data' });

        const months = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
        
        for (const row of data) {
            const employeeId = row['Employee UID'];
            if (!employeeId) continue;
            
            for (const month of months) {
                if (row[month] !== undefined && row[month] !== '') {
                    const monthVal = parseFloat(row[month]);
                    if (isNaN(monthVal)) continue;

                    let target = await XlTarget.findOne({ where: { employeeId, month, year } });

                    if (targetType === 'Lump-Sum') {
                        if (target) {
                            await target.update({
                                allocationType: 'Lump-Sum',
                                lumpSumAmount: monthVal,
                                totalProductAmount: 0
                            });
                        } else {
                            await XlTarget.create({
                                employeeId,
                                userName: row['Employee Name'],
                                targetPeriod: 'Monthly',
                                month,
                                year,
                                allocationType: 'Lump-Sum',
                                lumpSumAmount: monthVal,
                                totalProductAmount: 0
                            });
                        }
                    } else {
                        // Qty * Amount
                        const uid = row['uid'];
                        if (!uid) continue;
                        
                        const qty = monthVal;
                        const cus = parseFloat(row['cus']) || 0;
                        const total = qty * cus;

                        if (target) {
                            let productTargets = target.productTargets || [];
                            // Ensure it's an array
                            if (typeof productTargets === 'string') {
                                try { productTargets = JSON.parse(productTargets); } catch(e) { productTargets = []; }
                            }
                            
                            // Remove existing target for this product if exists
                            productTargets = productTargets.filter(p => p.productId !== uid);
                            
                            if (qty > 0) {
                                productTargets.push({
                                    productId: uid,
                                    productName: row['productName'],
                                    qty: qty,
                                    price: cus,
                                    total: total
                                });
                            }

                            const totalProductAmount = productTargets.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
                            
                            await target.update({
                                allocationType: 'Qty * Amount',
                                productTargets,
                                totalProductAmount,
                                lumpSumAmount: 0
                            });
                        } else {
                            if (qty > 0) {
                                const productTargets = [{
                                    productId: uid,
                                    productName: row['productName'],
                                    qty: qty,
                                    price: cus,
                                    total: total
                                }];
                                
                                await XlTarget.create({
                                    employeeId,
                                    userName: row['Employee Name'],
                                    targetPeriod: 'Monthly',
                                    month,
                                    year,
                                    allocationType: 'Qty * Amount',
                                    productTargets,
                                    totalProductAmount: total,
                                    lumpSumAmount: 0
                                });
                            }
                        }
                    }
                }
            }
        }

        res.json({ success: true, message: 'Upload processed successfully' });
    } catch (e) {
        console.error('Target upload error:', e);
        res.json({ success: false, message: e.message });
    }
});
`;

c = c.replace('module.exports = router;', routeCode + '\nmodule.exports = router;');
fs.writeFileSync('routes/admin.js', c);
console.log('Added target upload route');
