const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/models/xlModels.js';
let c = fs.readFileSync(path, 'utf8');

const itemModelCode = `
    const XlSecondarySalesItem = sequelize.define('xl_secondary_sales_item', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        saleId: { type: DataTypes.STRING, references: { model: 'xl_secondary_sales', key: '_id' }, onDelete: 'CASCADE' },
        product: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        basePrice: { type: DataTypes.FLOAT },
        priceType: { type: DataTypes.STRING },
        openingQty: { type: DataTypes.INTEGER },
        receivedQty: { type: DataTypes.INTEGER },
        free: { type: DataTypes.INTEGER },
        closingQty: { type: DataTypes.INTEGER }
    });

    XlSecondarySales.hasMany(XlSecondarySalesItem, { foreignKey: 'saleId', as: 'items', onDelete: 'CASCADE' });
    XlSecondarySalesItem.belongsTo(XlSecondarySales, { foreignKey: 'saleId' });
`;

if (!c.includes("sequelize.define('xl_secondary_sales_item'")) {
    c = c.replace(/return \{/, itemModelCode + "\n    return {");
    fs.writeFileSync(path, c);
    console.log('Fixed XlSecondarySalesItem definition injection.');
}
