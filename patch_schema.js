const fs = require('fs');
const path = require('path');
const file = path.join('models', 'xlModels.js');
let code = fs.readFileSync(file, 'utf8');

// Add excelRowIndex to XlDoctor
if (!code.includes('excelRowIndex: { type: DataTypes.INTEGER }')) {
    code = code.replace(
        "updateAt: { type: DataTypes.STRING },",
        "updateAt: { type: DataTypes.STRING },\n        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },"
    );
    // Add to XlChemist
    code = code.replace(
        "extraInformation: { type: DataTypes.TEXT },",
        "extraInformation: { type: DataTypes.TEXT },\n        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },"
    );
    // Note: XlStockist has extraInformation too, so the above replace might hit it. Let's do it safely.
    fs.writeFileSync(file, code);
    console.log('excelRowIndex added successfully');
} else {
    console.log('excelRowIndex already exists');
}
