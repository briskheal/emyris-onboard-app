/**
 * Fix all issues in routes/applicant.js and routes/admin.js:
 * 1. Replace app.get/post/put/delete with router.get/post/put/delete
 * 2. Fix require imports (add fs, path, all db models)
 * 3. Add sendEmail, saveBase64ToFile, BASE_URL stubs
 */
const fs = require('fs');
const path = require('path');

function fixRouteFile(filePath, extraDbModels) {
    let c = fs.readFileSync(filePath, 'utf8');

    // 1. Fix app.xxx -> router.xxx
    c = c.replace(/\bapp\.(get|post|put|delete|patch)\(/g, 'router.$1(');

    // 2. Fix the require('../db') line to include all needed models
    const oldDbRequire = /const \{[^}]+\} = require\('\.\.\/db'\);/;
    const newDbRequire = `const { Company, Applicant, Question, ExamResult, Asset, Division, HQ, TemplateHistory, sequelize } = require('../db');`;
    c = c.replace(oldDbRequire, newDbRequire);

    // 3. Replace old require line with full header
    const oldHeader = `const express = require('express');\nconst router = express.Router();\nconst multer = require('multer');\n${newDbRequire}`;
    const newHeader = `const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Company, Applicant, Question, ExamResult, Asset, Division, HQ, TemplateHistory, sequelize } = require('../db');

const BASE_URL = process.env.BASE_URL || 'https://emyrishr.in';

// Shared email helper
async function sendEmail({ to, subject, html }) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
            port: parseInt(process.env.EMAIL_PORT || '465'),
            secure: process.env.EMAIL_SECURE !== 'false',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: (process.env.EMAIL_PASS || '').replace(/\\s+/g, '')
            }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to, subject, html
        });
    } catch (e) {
        console.error('[EMAIL ERROR]', e.message);
    }
}

// Shared file helper
function saveBase64ToFile(email, category, base64Data) {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
        return base64Data;
    }
    try {
        const matches = base64Data.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
        if (!matches) return base64Data;
        const ext = matches[1].split('/')[1] || 'bin';
        const dir = path.join(__dirname, '..', 'uploads', email.replace('@', '_'));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filename = \`\${category}_\${Date.now()}.\${ext}\`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, Buffer.from(matches[2], 'base64'));
        return \`/uploads/\${email.replace('@', '_')}/\${filename}\`;
    } catch (e) {
        console.error('[FILE SAVE ERROR]', e.message);
        return base64Data;
    }
}

// Shared date helper
function safeParseDateServer(s) {
    if (!s || typeof s !== 'string') return null;
    if (s.includes('T')) return new Date(s);
    const parts = s.split('-');
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) return new Date(s);
    return new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}\`);
}

// Number to words helper
function numberToWords(n) {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
        'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if (n === 0) return 'Zero';
    if (n < 0) return 'Negative ' + numberToWords(-n);
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + numberToWords(n%100) : '');
    if (n < 100000) return numberToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + numberToWords(n%1000) : '');
    if (n < 10000000) return numberToWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + numberToWords(n%100000) : '');
    return numberToWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + numberToWords(n%10000000) : '');
}

// Template resolver helper
function resolveTemplate(template, data) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] !== undefined ? data[key] : match);
}`;

    // Replace old header block
    c = c.replace(
        /const express = require\('express'\);\nconst router = express\.Router\(\);\n(?:const multer = require\('multer'\);\n)?const \{[^}]+\} = require\('\.\.\/db'\);[^\n]*/,
        newHeader
    );

    // Remove any remaining multer require if it's still there separately
    c = c.replace(/^const multer = require\('multer'\);\n/m, '');

    fs.writeFileSync(filePath, c);
    console.log('Fixed:', filePath);
}

fixRouteFile(path.join(__dirname, 'routes', 'applicant.js'));
fixRouteFile(path.join(__dirname, 'routes', 'admin.js'));
console.log('All fixes applied!');
