const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx';
let content = fs.readFileSync(rPath, 'utf8');

// 1. Remove `<input type="file" ... />`
content = content.replace(/<input type="file" className="form-control" accept="\.xlsx, \.xls" onChange={handleFileChange}[^>]+>\s*/, '');

// 2. Replace `<button onClick={handleUpload}...` and `{uploadSuccess && ...}` with the new Sync button
const uploadBlockRegex = /<button onClick={handleUpload}[\s\S]*?\{uploadSuccess && \([\s\S]*?<\/button>\s*\)\}/;

const syncButton = `<button onClick={() => fetchPreview(true)} disabled={loadingPreview} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                        <Upload size={16} style={{ marginRight: '8px' }} />
                        {loadingPreview ? 'Syncing...' : 'Sync with CRM'}
                    </button>`;

content = content.replace(uploadBlockRegex, syncButton);

fs.writeFileSync(rPath, content, 'utf8');
console.log("Patched PayrunSystem.tsx to replace Upload Data with Sync with CRM!");
