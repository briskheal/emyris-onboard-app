const fs = require('fs');
let src = fs.readFileSync('routes/admin.js', 'utf8');

// Normalize to LF for searching
const srcLF = src.replace(/\r\n/g, '\n');

const oldSnippet = `router.post('/products', async (req, res) => {
    try {
        const count = await XlProduct.count();
        const uid = \`PDT\${count + 1}\`;
        const product = await XlProduct.create({ ...req.body, uid, stock: 0 });
        res.json({ success: true, product });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/products/:id', async (req, res) => {
    try {
        await XlProduct.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/products/:id', async (req, res) => {
    try {
        await XlProduct.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});`;

const newSnippet = `// Helper: MAX-based uid (safe against deletions — COUNT caused uid collisions when products are deleted)
async function getNextProductUid() {
    const allProds = await XlProduct.findAll({ attributes: ['uid'], raw: true });
    let maxNum = 0;
    for (const p of allProds) {
        const num = parseInt((p.uid || '').replace(/^PDT/i, ''));
        if (!isNaN(num) && num > maxNum) maxNum = num;
    }
    let uid = 'PDT' + (maxNum + 1);
    // Safety: ensure uniqueness even in concurrent scenarios
    while (await XlProduct.count({ where: { uid } }) > 0) {
        maxNum++;
        uid = 'PDT' + (maxNum + 1);
    }
    return uid;
}

router.post('/products', async (req, res) => {
    try {
        const uid = await getNextProductUid();
        const product = await XlProduct.create({ ...req.body, uid, stock: 0 });
        res.json({ success: true, product });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Bulk product upload — Excel parsed on frontend, JSON array sent here
// Upsert: match by productName -> UPDATE prices only; no match -> CREATE with fresh uid
router.post('/products/upload', async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0)
            return res.status(400).json({ success: false, message: 'No product data provided' });

        const results = { created: 0, updated: 0, failed: 0, errors: [] };

        for (const row of products) {
            try {
                if (!row.productName || !String(row.productName).trim()) {
                    results.failed++;
                    results.errors.push('Row skipped: missing productName');
                    continue;
                }
                const name = String(row.productName).trim();
                const existing = await XlProduct.findOne({ where: { productName: name } });
                if (existing) {
                    // UPDATE: refresh prices/division only — never change uid or _id
                    const updates = {};
                    if (row.mrp !== undefined && row.mrp !== '') updates.mrp = parseFloat(row.mrp) || 0;
                    if (row.pts !== undefined && row.pts !== '') updates.pts = parseFloat(row.pts) || 0;
                    if (row.ptr !== undefined && row.ptr !== '') updates.ptr = parseFloat(row.ptr) || 0;
                    if (row.division) updates.division = String(row.division).trim();
                    if (row.description) updates.description = String(row.description);
                    await XlProduct.update(updates, { where: { _id: existing._id } });
                    results.updated++;
                } else {
                    // CREATE: always generate uid via getNextProductUid — ignore spreadsheet uid to avoid conflicts
                    const uid = await getNextProductUid();
                    await XlProduct.create({
                        productName: name,
                        mrp: parseFloat(row.mrp) || 0,
                        pts: parseFloat(row.pts) || 0,
                        ptr: parseFloat(row.ptr) || 0,
                        division: String(row.division || '').trim(),
                        description: String(row.description || ''),
                        uid,
                        stock: 0
                    });
                    results.created++;
                }
            } catch (rowErr) {
                results.failed++;
                results.errors.push((row.productName || 'Unknown') + ': ' + rowErr.message);
            }
        }

        res.json({ success: true, results });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/products/:id', async (req, res) => {
    try {
        await XlProduct.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/products/:id', async (req, res) => {
    try {
        await XlProduct.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});`;

if (!srcLF.includes(oldSnippet)) {
    console.log('PATTERN NOT FOUND');
    process.exit(1);
}
const patched = srcLF.replace(oldSnippet, newSnippet);
// Restore CRLF
fs.writeFileSync('routes/admin.js', patched.replace(/\n/g, '\r\n'));
console.log('PATCHED OK - lines changed:', (patched.split('\n').length - srcLF.split('\n').length));
