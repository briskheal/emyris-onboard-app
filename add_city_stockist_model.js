const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');

const lines = c.split(/\r?\n/);
let stockistStart = lines.findIndex(l => l.includes("sequelize.define('xl_stockist'"));

if (stockistStart !== -1) {
    let addressIdx = lines.findIndex((l, i) => i > stockistStart && l.includes('address: { type: DataTypes.TEXT }'));
    if (addressIdx !== -1) {
        // Insert city right after address
        lines.splice(addressIdx + 1, 0, "        city: { type: DataTypes.STRING },");
        fs.writeFileSync('models/xlModels.js', lines.join('\n'));
        console.log("Successfully added city to xl_stockist model");
    } else {
        console.log("Could not find address line in xl_stockist");
    }
} else {
    console.log("Could not find xl_stockist");
}
