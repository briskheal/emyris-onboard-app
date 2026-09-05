const fs = require('fs');
let code = fs.readFileSync('models/xlModels.js', 'utf8');
const oldBlock = "        gifts: { type: DataTypes.TEXT, defaultValue: '[]' },        // JSON [{item, qty}]
        checkInTime: { type: DataTypes.STRING },";
const newBlock = "        gifts: { type: DataTypes.TEXT, defaultValue: '[]' },        // JSON [{item, qty}]
        productsDetailed: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON [productIds]
        pobItems: { type: DataTypes.TEXT, defaultValue: '[]' },         // JSON [{product, type, rate, sampleQty, pobQty}]
        workedWith: { type: DataTypes.TEXT, defaultValue: '[]' },       // JSON [employeeIds]
        rating: { type: DataTypes.INTEGER, defaultValue: 0 },
        photoUrl: { type: DataTypes.STRING },
        workingAreaType: { type: DataTypes.STRING },
        workingAreas: { type: DataTypes.STRING },
        checkInTime: { type: DataTypes.STRING },";
if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync('models/xlModels.js', code);
    console.log('Successfully patched XlDCR model');
} else {
    console.log('Could not find target block in models/xlModels.js');
}
