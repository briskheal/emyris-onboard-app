const fs = require('fs');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove (v3)
content = content.replace(
    /<h2 style=\{\{\s*fontSize:\s*'1\.75rem',\s*fontWeight:\s*'bold',\s*margin:\s*'0'\s*\}\}>Payrun & Attendance Module \(v3\)<\/h2>/g,
    `<h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0' }}>Payrun & Attendance Module</h2>`
);
content = content.replace(
    /<h2 style=\{\{\s*margin:\s*0\s*\}\}>Payrun & Attendance Module \(v3\)<\/h2>/g,
    `<h2 style={{ margin: 0 }}>Payrun & Attendance Module</h2>`
);


// 2. Make fonts smaller in the table
// Table headers
content = content.replace(/fontSize: '0\.8rem'/g, "fontSize: '0.75rem'"); // If any existed

// Adjust the table body and inputs
// Let's add a global class or just replace font sizes on the inputs and text
content = content.replace(/<div style=\{\{ fontWeight: 'bold' \}\}>/g, `<div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>`);
content = content.replace(/<div style=\{\{ fontSize: '0\.85rem', color: '#94a3b8' \}\}>/g, `<div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>`);
content = content.replace(/<div style=\{\{ fontWeight: 'bold', textAlign: 'center' \}\}>/g, `<div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.85rem' }}>`);
content = content.replace(/<div style=\{\{ fontWeight: 'bold', color: '#10b981', fontSize: '1\.1rem' \}\}>/g, `<div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1rem' }}>`);
content = content.replace(/<div style=\{\{ fontWeight: 'bold', color: '#10b981', fontSize: '1\.1rem', textAlign: 'center' \}\}>/g, `<div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1rem', textAlign: 'center' }}>`);

// Make the inputs smaller
content = content.replace(/<input\s+type="number"\s+className="form-control"\s+value=\{p\.expense\}/g, `<input type="number" className="form-control" style={{ fontSize: '0.85rem', padding: '4px 8px', height: 'auto' }} value={p.expense}`);
content = content.replace(/<input\s+type="number"\s+className="form-control"\s+value=\{p\.penaltyDays\}/g, `<input type="number" className="form-control" style={{ fontSize: '0.85rem', padding: '4px 8px', height: 'auto' }} value={p.penaltyDays}`);


fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched PayrunSystem UI");
