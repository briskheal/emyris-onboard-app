const fs = require('fs');
const path = require('path');
const file = path.join('routes', 'admin.js');
let code = fs.readFileSync(file, 'utf8');

// Ensure XlTarget is imported
if (!code.includes('XlTarget,')) {
    code = code.replace('XlRoute,', 'XlRoute, XlTarget,');
}

const targetApiCode = "\n" +
"// -------------------------------------------------------------\n" +
"// TARGETS API (XLA)\n" +
"// -------------------------------------------------------------\n\n" +
"router.get('/targets', async (req, res) => {\n" +
"    try {\n" +
"        const { period, month, year } = req.query;\n" +
"        let where = {};\n" +
"        if (period) where.targetPeriod = period;\n" +
"        if (month) where.month = month;\n" +
"        if (year) where.year = year;\n" +
"        \n" +
"        const targets = await XlTarget.findAll({ where, order: [['createdAt', 'DESC']] });\n" +
"        res.json({ success: true, targets });\n" +
"    } catch (e) {\n" +
"        console.error(e);\n" +
"        res.status(500).json({ success: false, message: e.message });\n" +
"    }\n" +
"});\n\n" +
"router.post('/targets', async (req, res) => {\n" +
"    try {\n" +
"        const { userEmail, userName, targetPeriod, month, year, allocationType, lumpSumAmount, productTargets, totalProductAmount } = req.body;\n" +
"        \n" +
"        const whereClause = { userEmail, targetPeriod, year };\n" +
"        if (targetPeriod === 'Monthly') {\n" +
"            whereClause.month = month;\n" +
"        }\n" +
"        \n" +
"        await XlTarget.destroy({ where: whereClause });\n" +
"        \n" +
"        const newTarget = await XlTarget.create({\n" +
"            userEmail, userName, targetPeriod, month: targetPeriod === 'Monthly' ? month : null, year, allocationType, lumpSumAmount, productTargets, totalProductAmount\n" +
"        });\n" +
"        \n" +
"        res.json({ success: true, target: newTarget });\n" +
"    } catch (e) {\n" +
"        console.error(e);\n" +
"        res.status(500).json({ success: false, message: e.message });\n" +
"    }\n" +
"});\n\n" +
"router.delete('/targets/:id', async (req, res) => {\n" +
"    try {\n" +
"        await XlTarget.destroy({ where: { _id: req.params.id } });\n" +
"        res.json({ success: true });\n" +
"    } catch (e) {\n" +
"        console.error(e);\n" +
"        res.status(500).json({ success: false, message: e.message });\n" +
"    }\n" +
"});\n";

if (!code.includes('/targets')) {
    code = code.replace("module.exports = router;", targetApiCode + "\nmodule.exports = router;");
    fs.writeFileSync(file, code);
    console.log('Target API routes added!');
} else {
    console.log('Target API routes already exist.');
}
