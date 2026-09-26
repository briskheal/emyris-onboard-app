const db = require('../db');
const { Op } = require('sequelize');

async function run() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');
        
        const { XlDoctor, XlChemist, XlStockist, XlGeoFencing } = db;
        
        const drs = await XlDoctor.findAll({ where: { name: { [Op.like]: '%Mayur%' } } });
        console.log('DOCTORS:', JSON.stringify(drs, null, 2));
        
        const geo = await XlGeoFencing.findAll();
        console.log('ALL GEO TAGS:', JSON.stringify(geo, null, 2));
        
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
