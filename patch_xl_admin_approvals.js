const fs = require('fs');

const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `            if (type === 'Geo Fencing') {
                let ent = null;`;

const newStr = `            if (pData.stockist && (type === 'Primary Sales' || type === 'Secondary Sales')) {
                const { XlStockist } = require('../db');
                const st = await XlStockist.findOne({ where: { [Op.or]: [{ _id: pData.stockist }, { uid: pData.stockist }] } });
                if (st) {
                    pData.stockistName = st.businessName || st.name;
                    pData.stockist = pData.stockistName; // Override ID with Name for UI Display
                    pData.headquarter = st.headquarter || pData.headquarter || '-';
                }
            }

            if (type === 'Geo Fencing') {
                let ent = null;`;

code = code.replace(targetStr, newStr);
fs.writeFileSync(path, code);
console.log("Patched xl.js to fetch Stockist Name and Headquarter for Secondary/Primary sales approvals");
