const fs = require('fs');

let adminScript = fs.readFileSync('admin-script.js', 'utf8');

const regex = /function applyCompanyData\(\) \{/;
const newStr = `function applyCompanyData() {\n    if (typeof renderTargetProductsList === 'function') renderTargetProductsList();\n    if (typeof populateTargetProductDropdowns === 'function') populateTargetProductDropdowns();`;

if (regex.test(adminScript)) {
    adminScript = adminScript.replace(regex, newStr);
    fs.writeFileSync('admin-script.js', adminScript);
    console.log('Successfully injected dropdown initializers into applyCompanyData!');
} else {
    console.log('Failed to find applyCompanyData match.');
}
