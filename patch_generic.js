const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', 'utf8');

// Add useNavigate import if missing
if (!f.includes("import { useNavigate }")) {
    f = f.replace("import { useState, useMemo } from 'react';", "import { useState, useMemo } from 'react';\nimport { useNavigate } from 'react-router-dom';");
}

// Add const navigate = useNavigate();
if (!f.includes("const navigate = useNavigate();")) {
    f = f.replace("export default function GenericApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {", "export default function GenericApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {\n  const navigate = useNavigate();");
}

// Replace the alert with routing logic
const viewButtonRegex = /<button onClick=\{\(\) => alert\('View details feature coming soon'\)\} className="(.*?)">/g;
const replacement = `<button onClick={(e) => {
                                e.stopPropagation();
                                if (selectedModule === 'Primary Sales') navigate('/extras/primary-sales/edit/' + d._id);
                                else if (selectedModule === 'Secondary Sales') navigate('/extras/secondary-sales/edit/' + d._id);
                                else alert('View details feature coming soon');
                              }} className="$1">`;
f = f.replace(viewButtonRegex, replacement);

// Make the entire row clickable if it's primary/secondary sales
const trRegex = /<tr key=\{d\._id\} className="([^"]*)">/g;
const trReplacement = `<tr key={d._id} onClick={() => {
                          if (selectedModule === 'Primary Sales') navigate('/extras/primary-sales/edit/' + d._id);
                          else if (selectedModule === 'Secondary Sales') navigate('/extras/secondary-sales/edit/' + d._id);
                        }} className="$1 \${['Primary Sales', 'Secondary Sales'].includes(selectedModule) ? 'cursor-pointer' : ''}">`;
f = f.replace(trRegex, trReplacement);

// Make sure checkbox doesn't trigger row click
const checkboxRegex = /<input type="checkbox" checked=\{selectedRows\.includes\(d\._id\)\} onChange=\{\(\) => \ntoggleRow\(d\._id\)\} className="([^"]*)" \/>/g;
// Actually, onChange triggers after onClick, but we can stop propagation on the td.
const tdCheckboxRegex = /<td className="p-4 text-center">\s*<input type="checkbox" checked=\{selectedRows\.includes\(d\._id\)\} onChange=\{\(\) => toggleRow\(d\._id\)\}/g;
const tdCheckboxReplacement = `<td className="p-4 text-center" onClick={e => e.stopPropagation()}>\n                            <input type="checkbox" checked={selectedRows.includes(d._id)} onChange={() => toggleRow(d._id)}`;
f = f.replace(tdCheckboxRegex, tdCheckboxReplacement);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', f);
console.log('patched GenericApproval.tsx');
