const fs = require('fs');
const path = require('path');

const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

function extractRoutes(prefix) {
    const routeRegex = new RegExp(`app\\.(get|post)\\('${prefix}[^']*',\\s*(?:async\\s*)?\\(req,\\s*res\\)\\s*=>\\s*\\{`, 'g');
    let match;
    const routes = [];
    
    while ((match = routeRegex.exec(serverContent)) !== null) {
        const startIndex = match.index;
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let endIndex = -1;
        
        for (let i = startIndex; i < serverContent.length; i++) {
            const char = serverContent[i];
            const nextChar = serverContent[i+1];
            
            // Handle strings to ignore braces inside them
            if ((char === '"' || char === "'" || char === '`') && serverContent[i-1] !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endIndex = i + 1;
                        
                        // Check if it ends with });
                        if (serverContent.substring(i+1, i+4) === ');') {
                            endIndex = i + 3;
                        } else if (serverContent.substring(i+1, i+3) === ');') {
                            endIndex = i + 3;
                        } else if (serverContent.substring(i+1, i+2) === ')') {
                            endIndex = i + 2;
                        }
                        break;
                    }
                }
            }
        }
        
        if (endIndex !== -1) {
            routes.push({
                fullText: serverContent.substring(startIndex, endIndex),
                start: startIndex,
                end: endIndex
            });
        }
    }
    
    return routes;
}

const adminRoutes = extractRoutes('/api/admin');
const applicantRoutes = extractRoutes('/api/applicant');

console.log(`Found ${adminRoutes.length} admin routes`);
console.log(`Found ${applicantRoutes.length} applicant routes`);

// We are going to replace `app.get('/api/admin/...')` with `router.get('/...')`
function formatRoutes(routesList) {
    return routesList.map(r => {
        let code = r.fullText;
        code = code.replace(/^app\./, 'router.');
        // Remove /api/admin or /api/applicant prefix from the route path
        code = code.replace(/router\.(get|post)\('\/api\/(admin|applicant)/, "router.$1('");
        return code;
    }).join('\n\n');
}

const adminCode = `const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Company, Applicant, Question, ExamResult, Asset, EmailLog } = require('../db');
const sgMail = require('@sendgrid/mail');
// You may need to port upload middleware and other shared utilities here.

${formatRoutes(adminRoutes)}

module.exports = router;
`;

const applicantCode = `const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Company, Applicant, Question, ExamResult, Asset, EmailLog } = require('../db');
const sgMail = require('@sendgrid/mail');

${formatRoutes(applicantRoutes)}

module.exports = router;
`;

fs.writeFileSync(path.join(__dirname, '../routes/admin.js'), adminCode);
fs.writeFileSync(path.join(__dirname, '../routes/applicant.js'), applicantCode);

// Now remove them from server.js
let newServerContent = serverContent;
const allRoutes = [...adminRoutes, ...applicantRoutes].sort((a, b) => b.start - a.start); // Sort descending to not mess up indices

for (const r of allRoutes) {
    newServerContent = newServerContent.substring(0, r.start) + newServerContent.substring(r.end);
}

// Inject router usage
const appUseInjection = `
// --- Modular Routes ---
const adminRoutes = require('./routes/admin');
const applicantRoutes = require('./routes/applicant');
app.use('/api/admin', adminRoutes);
app.use('/api/applicant', applicantRoutes);
// ----------------------
`;

newServerContent = newServerContent.replace("app.use(express.json());", "app.use(express.json());\n" + appUseInjection);

fs.writeFileSync(path.join(__dirname, '../server.js'), newServerContent);

console.log("Modularization complete.");
