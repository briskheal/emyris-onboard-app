const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/models/xlModels.js';
let c = fs.readFileSync(path, 'utf8');

const itemModelCode = `
    const XlPrimarySalesItem = sequelize.define('xl_primary_sales_item', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        saleId: { type: DataTypes.STRING, references: { model: 'xl_primary_sales', key: '_id' }, onDelete: 'CASCADE' },
        product: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        basePrice: { type: DataTypes.FLOAT },
        priceType: { type: DataTypes.STRING },
        free: { type: DataTypes.INTEGER },
        discount: { type: DataTypes.FLOAT },
        exp: { type: DataTypes.INTEGER },
        purcRtn: { type: DataTypes.INTEGER },
        rtnPriceType: { type: DataTypes.STRING },
        rtnPrice: { type: DataTypes.FLOAT }
    });

    XlPrimarySales.hasMany(XlPrimarySalesItem, { foreignKey: 'saleId', as: 'items', onDelete: 'CASCADE' });
    XlPrimarySalesItem.belongsTo(XlPrimarySales, { foreignKey: 'saleId' });
`;

if (!c.includes("sequelize.define('xl_primary_sales_item'")) {
    const hook = "createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }\n    });";
    c = c.replace(hook, hook + "\n" + itemModelCode);
    
    // Add to return object
    const returnRegex = /return\s*\{([\s\S]*?)\};/;
    c = c.replace(returnRegex, (match, p1) => {
        return `return {${p1}, XlPrimarySalesItem };`;
    });
    
    fs.writeFileSync(path, c);
    console.log('Fixed XlPrimarySalesItem injection.');
}
