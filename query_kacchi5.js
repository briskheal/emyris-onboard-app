const { XlAttendance, XlDCR } = require('./db.js');
const { Op } = require('sequelize');

async function run() {
    const year = '2026';
    const month = '09';
    const datePrefix = year + '-' + month;

    const dcrs = await XlDCR.findAll({
        attributes: ['employeeId', 'date'],
        where: {
            date: { [Op.startsWith]: datePrefix } 
        }
    });

    console.log('DCRs for Sep 2026:', dcrs.length);
    if(dcrs.length > 0) {
        console.log('Sample DCR:', dcrs[0].toJSON());
    }

    const atts = await XlAttendance.findAll({ 
        where: { 
            date: { [Op.startsWith]: datePrefix } 
        } 
    });

    console.log('Atts for Sep 2026:', atts.length);
    if(atts.length > 0) {
        console.log('Sample Att:', atts[0].toJSON());
    }

    const mergedData = [...atts.map(a => a.toJSON())];
    const attMap = new Set(atts.map(a => `${a.employeeId}_${a.date}`));

    for (const dcr of dcrs) {
        const key = `${dcr.employeeId}_${dcr.date}`;
        if (!attMap.has(key)) {
            mergedData.push({
                employeeId: dcr.employeeId,
                date: dcr.date,
                status: 'Present',
                punchInTime: 'DCR Submitted'
            });
            attMap.add(key);
        }
    }

    console.log('Merged Data:', mergedData.length);
    const kacchiMerged = mergedData.filter(a => a.employeeId === 'mohammad.kachhi@briskheal.com' || a.employeeId === 'KAC');
    console.log('Kacchi merged atts:', kacchiMerged.length, kacchiMerged.map(a => a.date + ' (' + a.employeeId + ')'));
}
run().catch(console.error);
