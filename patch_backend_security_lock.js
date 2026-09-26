const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

const updateRegex = /router\.put\('\/primary-sales\/update\/:id',\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?const\s*sale\s*=\s*await\s*XlPrimarySales\.findByPk\(req\.params\.id\);\s*if\s*\(!sale\)\s*return\s*res\.status\(404\)\.json\(\{.*?\}\);)/;

const updateReplacement = `router.put('/primary-sales/update/:id', async (req, res) => {$1

        // Strict Server-Side Security Lock for Approved Invoices
        if (sale.status === 'Approved') {
            const requesterId = req.body.employeeId || req.query.employeeId || 'UNKNOWN';
            let isAdmin = (requesterId === 'ADMIN');
            
            if (!isAdmin && requesterId !== 'UNKNOWN') {
                const { XlUser } = require('../db');
                const user = await XlUser.findOne({ where: { employeeId: requesterId } });
                if (user && (user.designation === 'ADMIN' || user.designation === 'HO')) {
                    isAdmin = true;
                }
            }
            
            if (!isAdmin) {
                return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit an approved invoice unless you are an Admin.' });
            }
        }`;

c = c.replace(updateRegex, updateReplacement);

const deleteRegex = /router\.delete\('\/primary-sales\/delete\/:id',\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?const\s*sale\s*=\s*await\s*XlPrimarySales\.findByPk\(req\.params\.id\);\s*if\s*\(!sale\)\s*return\s*res\.status\(404\)\.json\(\{.*?\}\);)/;

const deleteReplacement = `router.delete('/primary-sales/delete/:id', async (req, res) => {$1

        // Strict Server-Side Security Lock for Approved Invoices
        if (sale.status === 'Approved') {
            const requesterId = req.body.employeeId || req.query.employeeId || 'UNKNOWN';
            let isAdmin = (requesterId === 'ADMIN');
            
            if (!isAdmin && requesterId !== 'UNKNOWN') {
                const { XlUser } = require('../db');
                const user = await XlUser.findOne({ where: { employeeId: requesterId } });
                if (user && (user.designation === 'ADMIN' || user.designation === 'HO')) {
                    isAdmin = true;
                }
            }
            
            if (!isAdmin) {
                return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete an approved invoice unless you are an Admin.' });
            }
        }`;

c = c.replace(deleteRegex, deleteReplacement);

fs.writeFileSync(path, c);
console.log('Server-side security locks added to update and delete routes.');
