const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const oldSecRoute = `router.put('/secondary-sales/update/:id', async (req, res) => {
    try {
        const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData } = req.body;
        const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });
        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();

        await XlSecondarySales.update({
            date,
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            amount,
            productsData: JSON.stringify(productsData)
        }, { where: { _id: req.params.id } });`;

const newSecRoute = `router.put('/secondary-sales/update/:id', async (req, res) => {
    try {
        const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData, status } = req.body;
        const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });
        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();

        const updateData = {
            date,
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            amount,
            productsData: JSON.stringify(productsData)
        };
        if (status) updateData.status = status;

        await XlSecondarySales.update(updateData, { where: { _id: req.params.id } });`;

f = f.replace(oldSecRoute, newSecRoute);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', f);
console.log('Patched routes/xl.js secondary-sales update');
