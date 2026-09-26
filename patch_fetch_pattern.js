const fs = require('fs');
const path = require('path');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// It's probably a CRLF issue. Let's use a regex that handles whitespace.
const fetchPattern = /if\s*\(\s*res\.data\.success\s*\)\s*\{\s*const\s*initializedPreviews\s*=/;
if (fetchPattern.test(content)) {
    content = content.replace(fetchPattern, "if (res.data.success) {\n                setIsFinalized(!!res.data.loadedFromDb);\n                const initializedPreviews =");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fixed fetchPattern");
} else {
    console.log("Still failed to match fetchPattern");
}
