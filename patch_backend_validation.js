const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

const oldSave = `router.post('/primary-sales/save', async (req, res) => {
    try {
        const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;`;

const newSave = `
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

router.post('/primary-sales/save', async (req, res) => {
    try {
        const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;
        
        // Strict Validation
        if (productsData) validateProductsData(productsData);`;

c = c.replace(oldSave, newSave);

const oldUpdate = `router.put('/primary-sales/update/:id', async (req, res) => {
    try {
        const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;`;

const newUpdate = `router.put('/primary-sales/update/:id', async (req, res) => {
    try {
        const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;
        
        // Strict Validation
        if (productsData) validateProductsData(productsData);`;

c = c.replace(oldUpdate, newUpdate);

fs.writeFileSync(path, c);
console.log('Backend strict validation patch applied.');
