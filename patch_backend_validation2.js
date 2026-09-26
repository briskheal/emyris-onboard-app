const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

const validationFunction = `
// Strict API Validator for JSON Dialect
const validateProductsData = (pData) => {
    if (!pData) return true;
    let parsed;
    try {
        parsed = typeof pData === 'string' ? JSON.parse(pData) : pData;
    } catch(e) {
        throw new Error("productsData must be valid JSON");
    }
    if (!Array.isArray(parsed)) return true; // fallback for strange empty formats
    for (let row of parsed) {
        if (row && ('productId' in row || 'quantity' in row || 'customPrice' in row)) {
            throw new Error("Strict Schema Violation: productsData contains forbidden Admin Desktop dialect keys. You must use the strict mobile standard (product, qty, basePrice).");
        }
    }
    return true;
};
`;

c = c.replace(
  /router\.post\('\/primary-sales\/save',\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?const\s*\{\s*employeeId[^}]+\}\s*=\s*req\.body;)/,
  validationFunction + "router.post('/primary-sales/save', async (req, res) => {$1\n        // Strict Validation\n        if (productsData) validateProductsData(productsData);"
);

c = c.replace(
  /router\.put\('\/primary-sales\/update\/:id',\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?const\s*\{[^}]+\}\s*=\s*req\.body;)/,
  "router.put('/primary-sales/update/:id', async (req, res) => {$1\n        // Strict Validation\n        if (productsData) validateProductsData(productsData);"
);

fs.writeFileSync(path, c);
console.log('Backend strict validation patch applied.');
