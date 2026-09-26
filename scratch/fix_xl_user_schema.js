const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');

const xlUserStart = c.indexOf("const XlUser = sequelize.define('xl_user', {");
const xlUserEnd = c.indexOf("});", xlUserStart);

if (xlUserStart !== -1) {
    let xlUserBlock = c.substring(xlUserStart, xlUserEnd);
    xlUserBlock = xlUserBlock.replace("status: { type: DataTypes.STRING, defaultValue: 'Active' },", "status: { type: DataTypes.STRING, defaultValue: 'Active' },\n        controls: { type: DataTypes.JSON, defaultValue: {} },");
    c = c.substring(0, xlUserStart) + xlUserBlock + c.substring(xlUserEnd);
    
    // Also remove the double controls from XlState
    c = c.replace("controls: { type: DataTypes.JSON, defaultValue: {} },\n        controls: { type: DataTypes.JSON, defaultValue: {} },", "controls: { type: DataTypes.JSON, defaultValue: {} },");
    c = c.replace("controls: { type: DataTypes.JSON, defaultValue: {} },\r\n        controls: { type: DataTypes.JSON, defaultValue: {} },", "controls: { type: DataTypes.JSON, defaultValue: {} },");
    
    fs.writeFileSync('models/xlModels.js', c);
    console.log("Fixed XlUser schema");
} else {
    console.log("Could not find XlUser block");
}
