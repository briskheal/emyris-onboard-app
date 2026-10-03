const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');

const lines = c.split(/\r?\n/);
let chemistStart = lines.findIndex(l => l.includes("sequelize.define('xl_chemist'"));

if (chemistStart !== -1) {
    let addressIdx = lines.findIndex((l, i) => i > chemistStart && l.includes('address: { type: DataTypes.TEXT }'));
    if (addressIdx !== -1) {
        // Insert city right after address
        lines.splice(addressIdx + 1, 0, "        city: { type: DataTypes.STRING },");
        fs.writeFileSync('models/xlModels.js', lines.join('\n'));
        console.log("Successfully added city to xl_chemist model");
    } else {
        console.log("Could not find address line");
    }
} else {
    console.log("Could not find xl_chemist");
}
