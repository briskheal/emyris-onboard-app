const fs = require('fs');
const path = require('path');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add `isFinalized` state
const statePattern = /const \[previewData, setPreviewData\] = useState<any \| null>\(null\);/;
content = content.replace(statePattern, "const [previewData, setPreviewData] = useState<any | null>(null);\n    const [isFinalized, setIsFinalized] = useState(false);");

// 2. Add `setIsFinalized` in `fetchPreview`
const fetchPattern = /if \(res\.data\.success\) \{\n\s*const initializedPreviews =/;
content = content.replace(fetchPattern, "if (res.data.success) {\n                setIsFinalized(!!res.data.loadedFromDb);\n                const initializedPreviews =");

// 2b. Add `setIsFinalized(true)` in `finalizePayrun` and `wipePayrun`
content = content.replace(/setEmailSuccess\(`Successfully finalized payrun for \$\{payrunMonth\} \$\{payrunYear\}!`\);/, "setEmailSuccess(`Successfully finalized payrun for ${payrunMonth} ${payrunYear}!`);\n                setIsFinalized(true);");
content = content.replace(/setEmailSuccess\('Payrun data completely wiped\.'\);/, "setEmailSuccess('Payrun data completely wiped.');\n                setIsFinalized(false);");

// 3. Add `handleSyncCRM`
const handleSyncFn = `
    const handleSyncCRM = () => {
        if (isFinalized) {
            if (!confirm('This month is already finalized. Syncing with the live CRM will overwrite your saved data with fresh attendance data. Proceed?')) {
                return;
            }
        }
        fetchPreview(true);
    };

    const fetchPreview = async`;
content = content.replace(/const fetchPreview = async/, handleSyncFn);

// 4. Update the Sync with CRM button and add the badge
const syncButtonPattern = /<button onClick=\{\(\) => fetchPreview\(true\)\} disabled=\{loadingPreview\} className="btn btn-primary"/;
content = content.replace(syncButtonPattern, `{isFinalized && (
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#10b981', color: 'white', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            <CheckCircle size={16} style={{ marginRight: '6px' }} />
                            FINALIZED
                        </div>
                    )}
                    <button onClick={handleSyncCRM} disabled={loadingPreview} className="btn btn-primary"`);

// 5. Move "Test Mode: Wipe Data" to the bottom, rename to "Reset Month"
const wipeButtonTop = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1\.5rem' \}\}>\s*<h2 style=\{\{ margin: 0 \}\}>Payrun & Attendance Module \(v3\)<\/h2>\s*<button onClick=\{wipePayrun\}.*?<\/button>\s*<\/div>/s;

content = content.replace(wipeButtonTop, `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Payrun & Attendance Module (v3)</h2>
                </div>`);

const bottomButtonsPattern = /<button onClick=\{finalizePayrun\}/;
content = content.replace(bottomButtonsPattern, `<button onClick={wipePayrun} disabled={wiping || finalizing || previews.length === 0} className="btn btn-danger" style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px' }}>
                                    <Trash2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    {wiping ? 'Resetting...' : 'Reset Month'}
                                </button>
                                <button onClick={finalizePayrun}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched PayrunSystem.tsx successfully.");
