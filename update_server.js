const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

const targetStr = `app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(require('path').join(__dirname, 'frontend', 'dist', 'index.html'));
    } else {
        res.status(404).json({ success: false, message: 'API route not found' });
    }
});`;

const replacementStr = `app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        const indexPath = require('path').join(__dirname, 'frontend', 'dist', 'index.html');
        res.sendFile(indexPath, err => {
            if (err) {
                console.error("Failed to send index.html. Did the React build fail?", err);
                res.status(500).send("Frontend build not found. Please check deployment logs.");
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'API route not found' });
    }
});`;

c = c.replace(targetStr, replacementStr);
fs.writeFileSync('server.js', c);
