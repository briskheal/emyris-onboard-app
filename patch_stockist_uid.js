const fs = require('fs');
const path = require('path');

const fileSec = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let contentSec = fs.readFileSync(fileSec, 'utf8');

// Update value={s.businessName || s.name} to value={s.uid || s._id} in SecondarySalesForm
contentSec = contentSec.replace(/<option key=\{s\.businessName \|\| s\.name\} value=\{s\.businessName \|\| s\.name\}/g, '<option key={s.uid || s._id} value={s.uid || s._id}');

// To display the selected name instead of uid when viewing, we don't strictly need to do anything since the <select> element's options have the text as the businessName.
fs.writeFileSync(fileSec, contentSec);

const filePri = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let contentPri = fs.readFileSync(filePri, 'utf8');

// Update getStockistName to handle if stockist is businessName (legacy) or UID
// It already does: s.uid === val || x._id === val || x.businessName === val
// So we just need to change the onClick setter:
contentPri = contentPri.replace(/setHeader\(\{\.\.\.header, stockist: s\.businessName\}\);/g, 'setHeader({...header, stockist: s.uid || s._id || s.businessName});');

fs.writeFileSync(filePri, contentPri);
console.log("Patched Mobile forms to use stockist UID instead of name.");
