async function getMaxUID(Model, prefix) {
    const records = await Model.findAll({ attributes: ['uid'] });
    let max = 0;
    for (let r of records) {
        if (r.uid && r.uid.startsWith(prefix)) {
            const num = parseInt(r.uid.substring(prefix.length)) || 0;
            if (num > max) max = num;
        }
    }
    return max;
}

const express = require('express');
const router = express.Router();
const { toStorageDate, toDisplayDate, getMonthYear } = require('../utils/dateStandard');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'emyris_super_secret_key_2026';

const verifyToken = (req, res, next) => {
    const openRoutes = ["/api/xl/debug-user", 
        '/api/xl/login', '/login', 
        '/api/xl/admin-login', '/admin-login', 
        '/api/xl/forgot-password', '/forgot-password',
        '/api/xl/register', '/register',
        '/company-profile',
        '/admin/settings/typography', '/api/xl/admin/settings/typography',
        '/tile-proxy', '/api/xl/tile-proxy',
        '/tour-program/submission-reminder', '/api/xl/tour-program/submission-reminder'
    ];
    if (openRoutes.includes(req.path) || req.path.includes('submission-reminder') || req.path.includes('tile-proxy') || req.path.includes('/cleanup-') || req.path.includes('/debug-') || req.path.includes('forgot-password') || req.path.includes('change-password')) {
        return next();
    }
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token format' });
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Forbidden: Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

router.use(verifyToken);

// XLA Admin Login — dedicated route, completely separate from emyrishr.in/admin portal
// Only accepts credentials created specifically for the XLA module (XlAdmin table with role='XLA' or 'ADMIN')
// Main admin portal credentials (routes/admin.js /login) do NOT work here
router.post('/admin-login', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const loginEmail = (email || username || '').trim();
        if (!loginEmail || !password) return res.json({ success: false, message: 'Email and password required' });

        const { XlAdmin, sequelize } = require('../db');
        const bcrypt = require('bcryptjs');

        // Look up by email in XlAdmin table (case-insensitive)
        let admin = await XlAdmin.findOne({ where: { email: loginEmail } });
        if (!admin) {
            admin = await XlAdmin.findOne({ 
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('email')), 
                    loginEmail.toLowerCase()
                ) 
            });
        }

        if (!admin) {
            return res.json({ success: false, message: 'Invalid XLA credentials. Use your XLA admin login.' });
        }

        if (admin.status === 'Deactivated' || admin.status === 'Inactive') {
            return res.json({ success: false, message: 'Not Authorized to Access' });
        }

        // Verify password (supports both bcrypt-hashed and plain text)
        const storedPass = admin.password || '';
        let passwordMatch = false;
        if (storedPass.startsWith('$2')) {
            passwordMatch = bcrypt.compareSync(password, storedPass);
        } else {
            passwordMatch = (password === storedPass);
            if (passwordMatch) {
                // Auto-encrypt plain text to bcrypt in database
                const upgraded = bcrypt.hashSync(password, 10);
                await XlAdmin.update({ password: upgraded }, { where: { _id: admin._id } });
            }
        }

        if (!passwordMatch) {
            return res.json({ success: false, message: 'Invalid XLA credentials. Use your XLA admin login.' });
        }

        const adminData = admin.toJSON();
        delete adminData.password;

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role || 'ADMIN', isAdmin: true },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.json({ success: true, user: adminData, role: admin.role || 'admin', token });
    } catch (e) {
        console.error('[XLA Admin Login Error]', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ==========================================
// ROBUST 2-STEP OTP ADMIN PASSWORD RESET
// ==========================================

// Step 1: Send OTP / PIN to Admin's Pre-Linked Email (auto-resolves admin if email not passed)
router.post('/forgot-password/request-otp', async (req, res) => {
    try {
        const { email } = req.body;
        let targetEmail = (email || '').trim().toLowerCase();

        const { XlAdmin, sequelize } = require('../db');
        const { sendEmail } = require('../utils/mailer');

        let admin = null;
        if (targetEmail) {
            admin = await XlAdmin.findOne({ where: { email: targetEmail } });
            if (!admin) {
                admin = await XlAdmin.findOne({ 
                    where: sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('email')), 
                        targetEmail
                    ) 
                });
            }
        }

        // If no email passed or not found by exact string, resolve registered XLA admin directly
        if (!admin) {
            admin = await XlAdmin.findOne({ where: { email: 'hradmin@emyrishr.in' } });
            if (!admin) admin = await XlAdmin.findOne();
        }

        if (!admin) {
            return res.json({ 
                success: false, 
                message: 'No registered XLA Admin account was found in the system.' 
            });
        }

        // Anti-Spam / Rate-limiting: Require 30 seconds between OTP requests
        if (admin.resetOtpExpires) {
            const timeDiff = new Date(admin.resetOtpExpires).getTime() - Date.now();
            if (timeDiff > (9 * 60 + 30) * 1000) {
                return res.json({ success: false, message: 'A verification PIN was recently sent. Please wait 30 seconds before requesting another.' });
            }
        }

        // Generate a secure 6-digit verification PIN
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP & Expiry in database on admin's record
        await XlAdmin.update({ resetOtp: otp, resetOtpExpires: expires }, { where: { _id: admin._id } });
        console.log(`[XLA PASSWORD RESET OTP] Code generated for admin: ${admin.email}`);

        // Mask the email for privacy/confirmation display (e.g. h•••••n@emyrishr.in)
        const [userPart, domainPart] = admin.email.split('@');
        const maskedEmail = userPart.length > 2 
            ? userPart.charAt(0) + '••••' + userPart.charAt(userPart.length - 1) + '@' + domainPart
            : userPart.charAt(0) + '••••@' + domainPart;

        const adminName = `${admin.firstName || 'Admin'} ${admin.lastName || ''}`.trim();

        const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #f43f5e, #be123c); padding: 12px 28px; border-radius: 10px; color: #ffffff; font-weight: 900; font-size: 22px; letter-spacing: -0.5px;">
                        EMYRIS
                    </div>
                    <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: bold; color: #f43f5e; text-transform: uppercase; letter-spacing: 2px;">Admin Portal Security</p>
                </div>

                <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Reset Verification PIN</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                    Hello <strong>${adminName}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                    We received a request to reset the password for your XLA Admin account (<strong>${admin.email}</strong>). Please use the One-Time Security PIN below to authorize this request:
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f43f5e; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your 6-Digit Verification PIN</div>
                    <div style="font-family: Monaco, Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 900; color: #e11d48; letter-spacing: 8px; background: #ffffff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #f43f5e; display: inline-block;">
                        ${otp}
                    </div>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">This code expires in <strong>10 minutes</strong>.</p>
                </div>

                <div style="font-size: 12px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                    <p style="margin: 0 0 6px 0;"><strong>Security Notice:</strong> Never share this PIN with anyone. Emyris personnel will never ask for your verification code.</p>
                    <p style="margin: 0;">If you did not request this, you can safely ignore this email. Your current password remains active and unchanged in the database.</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: admin.email,
            subject: `XLA Admin Portal - Security Verification PIN: ${otp}`,
            html: emailHtml
        });

        res.json({ 
            success: true, 
            adminEmail: admin.email,
            maskedEmail,
            message: `A 6-digit verification PIN has been sent to ${maskedEmail}. Please check your inbox.` 
        });
    } catch (e) {
        console.error('[XLA Request OTP Error]', e);
        res.status(500).json({ success: false, message: 'Server error generating verification code: ' + e.message });
    }
});

// Step 2: Verify OTP & Set User's Chosen New Password in Database (ENCRYPTED WITH BCRYPT)
router.post('/forgot-password/verify-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        let targetEmail = (email || '').trim().toLowerCase();
        const submittedOtp = (otp || '').trim();
        const trimmedNewPass = (newPassword || '').trim();

        if (!submittedOtp || !trimmedNewPass) {
            return res.json({ success: false, message: 'Verification PIN and new password are required.' });
        }

        if (trimmedNewPass.length < 6) {
            return res.json({ success: false, message: 'New password must be at least 6 characters long.' });
        }

        const { XlAdmin, sequelize } = require('../db');
        const bcrypt = require('bcryptjs');
        const { sendEmail } = require('../utils/mailer');

        let admin = null;
        if (targetEmail) {
            admin = await XlAdmin.findOne({ where: { email: targetEmail } });
            if (!admin) {
                admin = await XlAdmin.findOne({ 
                    where: sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('email')), 
                        targetEmail
                    ) 
                });
            }
        }
        if (!admin) {
            admin = await XlAdmin.findOne({ where: { email: 'hradmin@emyrishr.in' } });
            if (!admin) admin = await XlAdmin.findOne();
        }

        if (!admin) {
            return res.json({ success: false, message: 'Admin account not found.' });
        }

        // Validate OTP
        if (!admin.resetOtp || admin.resetOtp.trim() !== submittedOtp) {
            return res.json({ success: false, message: 'Invalid verification PIN. Please check your email and try again.' });
        }

        // Validate Expiry
        if (!admin.resetOtpExpires || new Date() > new Date(admin.resetOtpExpires)) {
            return res.json({ success: false, message: 'Verification PIN has expired. Please request a new PIN.' });
        }

        // Encrypt password with bcrypt before storing in database
        const hashedPassword = bcrypt.hashSync(trimmedNewPass, 10);

        // Update password in database; invalidate OTP
        await XlAdmin.update({ 
            password: hashedPassword,
            resetOtp: null,
            resetOtpExpires: null
        }, { where: { _id: admin._id } });

        console.log(`[XLA PASSWORD RESET SUCCESS] Password successfully encrypted (bcrypt) and updated in database for admin: ${admin.email}`);

        // Send confirmation email
        const adminName = `${admin.firstName || 'Admin'} ${admin.lastName || ''}`.trim();
        const baseUrl = process.env.BASE_URL || 'https://emyrishr.in';
        const loginUrl = `${baseUrl}/xla/login`;

        const confirmationHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #0f172a; margin-top: 0;">Password Successfully Changed</h2>
                <p style="font-size: 14px; color: #475569;">Hello <strong>${adminName}</strong>,</p>
                <p style="font-size: 14px; color: #475569;">Your XLA Admin password has been successfully updated in the database.</p>
                <div style="margin: 24px 0;">
                    <a href="${loginUrl}" style="background-color: #f43f5e; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block;">
                        Login to Admin Portal
                    </a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">If you did not perform this action, please alert your systems administrator immediately.</p>
            </div>
        `;

        await sendEmail({
            to: admin.email,
            subject: 'XLA Admin Portal - Password Changed Successfully',
            html: confirmationHtml
        }).catch(err => console.error('Failed to send confirmation email', err));

        res.json({ 
            success: true, 
            message: 'Your password has been successfully updated in the database! You can now log in.' 
        });
    } catch (e) {
        console.error('[XLA Verify OTP Error]', e);
        res.status(500).json({ success: false, message: 'Server error setting new password: ' + e.message });
    }
});


// [NEW] Cleanup Ghost Admin Expenses
router.get('/cleanup-ghost-expenses', async (req, res) => {
    try {
        const deleted = await XlExpense.destroy({ where: { employeeId: 'admin@admin.com' } });
        res.json({ success: true, message: `Successfully deleted ${deleted} ghost expenses from admin@admin.com!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// [NEW] Cleanup Orphaned Uploaded Files
router.get('/cleanup-orphaned-files', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const { sequelize } = require('../db');
        const uploadsPath = path.join(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsPath)) return res.json({ success: true, message: 'Uploads folder not found' });

        // Fetch ALL data from ALL tables to create a universal reference string
        let dbContent = '';
        const models = Object.values(sequelize.models);
        for (const model of models) {
            try {
                const records = await model.findAll({ raw: true });
                dbContent += JSON.stringify(records);
            } catch(e) {
                // skip unqueryable models
            }
        }

        const files = fs.readdirSync(uploadsPath);
        
        let deletedCount = 0;
        let keptCount = 0;
        let deletedSize = 0;

        for (const file of files) {
            const filePath = path.join(uploadsPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) continue;
            
            // Exclude common static or non-uploaded files if they somehow got in
            if (file === '.gitkeep' || file === 'test.webp') continue;
            
            // Check if filename exists anywhere in the database dump
            if (!dbContent.includes(file)) {
                deletedSize += stats.size;
                fs.unlinkSync(filePath);
                deletedCount++;
            } else {
                keptCount++;
            }
        }

        const sizeMB = (deletedSize / (1024 * 1024)).toFixed(2);
        res.json({ success: true, message: `Successfully deleted ${deletedCount} orphaned files and freed ${sizeMB} MB of space! Kept ${keptCount} active files.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


const fs = require('fs');
const path = require('path');

function deleteExpenseFiles(receiptImageStr) {
    if (!receiptImageStr) return;
    const urls = receiptImageStr.split(',').filter(Boolean);
    for (const fileUrl of urls) {
        try {
            const filename = fileUrl.split('/').pop();
            if (filename) {
                const filepath = path.join(__dirname, '..', 'uploads', filename);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }
        } catch (err) {
            console.error('Failed to delete file:', fileUrl, err);
        }
    }
}

const buildEffortMatrix = async (user, month, year, XlDCR, XlDoctor, XlChemist, XlStockist) => {
    const monthNumMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
    const monthNum = monthNumMap[month] || '01';
    const datePrefix = `${year}-${monthNum}-`;

    // 1. Fetch baselines
    const { Op } = require('sequelize');
    const { sequelize } = require('../db');
    const hqCondition = (user.hq || '').trim().toLowerCase();
    
    const getWhere = () => {
        const conditions = [];
        if (user.uid) conditions.push({ userAllotted: user.uid });
        if (user._id) conditions.push({ userAllotted: user._id });
        if (user.employeeId) conditions.push({ userAllotted: user.employeeId });
        if (user.email) conditions.push({ userAllotted: user.email });
        
        if (hqCondition) {
            conditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), hqCondition));
        }
        
        return conditions.length > 0 ? { [Op.or]: conditions } : { _id: 'never_match' };
    };

    const doctors = await XlDoctor.findAll({ where: getWhere() });
    const chemists = await XlChemist.findAll({ where: getWhere() });
    const stockists = await XlStockist.findAll({ where: getWhere() });

    let nonCoreCount = 0, coreCount = 0, superCoreCount = 0;
    let expectedDoctorCalls = 0;
    const docTargetMap = {};
    const docCategoryMap = {};
    doctors.forEach(d => {
        let target = 0;
        let cat = '';
        if (d.category && d.category.includes('SuperCore')) { superCoreCount++; target = 3; cat = 'SuperCore'; }
        else if (d.category && d.category.includes('Non-Core')) { nonCoreCount++; target = 1; cat = 'Non-Core'; }
        else if (d.category && d.category.includes('Core')) { coreCount++; target = 2; cat = 'Core'; }
        expectedDoctorCalls += target;
        if (d.uid) { docTargetMap[d.uid] = target; docCategoryMap[d.uid] = cat; }
        if (d._id) { docTargetMap[d._id] = target; docCategoryMap[d._id] = cat; }
    });

    const totalDocs = doctors.length;
    const totalChems = chemists.length;
    const totalStocks = stockists.length;

    // 2. Fetch DCRs
    const dcrs = await XlDCR.findAll({
        where: {
            employeeId: user.employeeId || null,
            date: { [Op.like]: datePrefix + '%' }
        }
    });

    const getWeek = (dateStr) => {
        if (!dateStr) return 0;
        const d = new Date(dateStr).getDate();
        if (isNaN(d)) return 0;
        if (d <= 7) return 0;
        if (d <= 14) return 1;
        if (d <= 21) return 2;
        if (d <= 28) return 3;
        let val = Math.floor((d - 1) / 7);
        if (val < 0) val = 0;
        if (val > 5) val = 5;
        return val;
    };

    // Arrays: index 0 to 5 for Week 1-6, index 6 for Total
    const initArr = () => [0, 0, 0, 0, 0, 0, 0];
    
    // Discrete weekly containers
    const drCalls = initArr();
    const chemCalls = initArr();
    const stockCalls = initArr();
    const workingDays = initArr();
    
    // Tracking sets for unique days/entities per week
    const weeklyDays = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];
    
    // Time-series of DCRs
    const weeklyDrVisits = [{}, {}, {}, {}, {}, {}];
    const weeklyChemVisits = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];
    const weeklyStockVisits = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];

    dcrs.forEach(dcr => {
        const w = getWeek(dcr.date);
        weeklyDays[w].add(dcr.date);
        
        if (dcr.entityType === 'Doctor' && dcr.entityId) {
            drCalls[w]++;
            weeklyDrVisits[w][dcr.entityId] = (weeklyDrVisits[w][dcr.entityId] || 0) + 1;
        } else if (dcr.entityType === 'Chemist' && dcr.entityId) {
            chemCalls[w]++;
            weeklyChemVisits[w].add(dcr.entityId);
        } else if (dcr.entityType === 'Stockist' && dcr.entityId) {
            stockCalls[w]++;
            weeklyStockVisits[w].add(dcr.entityId);
        } else if (!dcr.entityType && dcr.doctorsData) {
            // Fallback for older multi-doctor payload
            try {
                const docs = JSON.parse(dcr.doctorsData);
                docs.forEach(doc => {
                    if (doc.uid) {
                        drCalls[w]++;
                        weeklyDrVisits[w][doc.uid] = (weeklyDrVisits[w][doc.uid] || 0) + 1;
                    }
                });
            } catch(e) {}
        }
    });

    for (let i = 0; i < 6; i++) {
        workingDays[i] = weeklyDays[i].size;
        drCalls[6] += drCalls[i];
        chemCalls[6] += chemCalls[i];
        stockCalls[6] += stockCalls[i];
        workingDays[6] += workingDays[i];
    }

    // Cumulative Tracking
    const drUniqueCum = initArr();
    const drMissedCum = initArr();
    const chemUniqueCum = initArr();
    const chemMissedCum = initArr();
    const stockUniqueCum = initArr();
    const stockMissedCum = initArr();
    
    const drCoverageCum = initArr();
    const drComplianceCum = initArr();
    const drCallAvg = initArr();
    const nonCoreCum = initArr();
    const coreCum = initArr();
    const superCoreCum = initArr();

    const cumulativeDrVisits = {};
    const cumulativeChem = new Set();
    const cumulativeStock = new Set();

    for (let i = 0; i < 6; i++) {
        // Averages
        drCallAvg[i] = workingDays[i] > 0 ? (drCalls[i] / workingDays[i]) : 0;
        
        // Doctors Accumulation
        Object.keys(weeklyDrVisits[i]).forEach(id => {
            cumulativeDrVisits[id] = (cumulativeDrVisits[id] || 0) + weeklyDrVisits[i][id];
        });
        drUniqueCum[i] = Object.keys(cumulativeDrVisits).length;
        drMissedCum[i] = Math.max(0, totalDocs - drUniqueCum[i]);
        
        drCoverageCum[i] = totalDocs > 0 ? (drUniqueCum[i] / totalDocs) * 100 : 0;
        
        // Progressive Compliance: (Sum of valid calls so far / Expected Calls) * 100
        let validCalls = 0;
        Object.keys(cumulativeDrVisits).forEach(id => {
            const actual = cumulativeDrVisits[id];
            const target = docTargetMap[id] || 0;
            if (target > 0) {
                validCalls += Math.min(actual, target);
            }
        });
        drComplianceCum[i] = expectedDoctorCalls > 0 ? (validCalls / expectedDoctorCalls) * 100 : 0;

        let nonCoreMet = 0;
        let coreMet = 0;
        let superCoreMet = 0;

        Object.keys(cumulativeDrVisits).forEach(id => {
            const cat = docCategoryMap[id];
            if (cat === 'Non-Core') nonCoreMet++;
            else if (cat === 'Core') coreMet++;
            else if (cat === 'SuperCore') superCoreMet++;
        });

        nonCoreCum[i] = `${nonCoreMet} / ${nonCoreCount}`;
        coreCum[i] = `${coreMet} / ${coreCount}`;
        superCoreCum[i] = `${superCoreMet} / ${superCoreCount}`;

        // Chemists Accumulation
        weeklyChemVisits[i].forEach(id => cumulativeChem.add(id));
        chemUniqueCum[i] = cumulativeChem.size;
        chemMissedCum[i] = Math.max(0, totalChems - chemUniqueCum[i]);

        // Stockists Accumulation
        weeklyStockVisits[i].forEach(id => cumulativeStock.add(id));
        stockUniqueCum[i] = cumulativeStock.size;
        stockMissedCum[i] = Math.max(0, totalStocks - stockUniqueCum[i]);
    }

    // Fill Totals (index 6) for Cumulative items (which is just the Week 6 value)
    drCallAvg[6] = workingDays[6] > 0 ? (drCalls[6] / workingDays[6]) : 0;
    drUniqueCum[6] = drUniqueCum[5];
    drMissedCum[6] = drMissedCum[5];
    drCoverageCum[6] = drCoverageCum[5];
    drComplianceCum[6] = drComplianceCum[5];
    nonCoreCum[6] = nonCoreCum[5];
    coreCum[6] = coreCum[5];
    superCoreCum[6] = superCoreCum[5];
    
    chemUniqueCum[6] = chemUniqueCum[5];
    chemMissedCum[6] = chemMissedCum[5];
    
    stockUniqueCum[6] = stockUniqueCum[5];
    stockMissedCum[6] = stockMissedCum[5];

    const staticArr = (val) => [val, val, val, val, val, val, val];

    return [
        { label: 'Total Doctors', data: staticArr(totalDocs) },
        { label: 'Doctors Call', data: drCalls },
        { label: 'Unique Doctors Visited', data: drUniqueCum },
        { label: 'Missed Doctors', data: drMissedCum },
        { label: 'Non-Core Doctors (Met/Total)', data: nonCoreCum },
        { label: 'Core Doctors (Met/Total)', data: coreCum },
        { label: 'Super-Core Doctors (Met/Total)', data: superCoreCum },
        { label: 'Doctors Call Average', data: drCallAvg },
        { label: "Doctor's Coverage Percentage", data: drCoverageCum },
        { label: "Doctor's Compliance Percentage", data: drComplianceCum },
        { label: 'Total Chemists', data: staticArr(totalChems) },
        { label: 'Chemists Call', data: chemCalls },
        { label: 'Missed Chemists', data: chemMissedCum },
        { label: 'Total Stockists', data: staticArr(totalStocks) },
        { label: 'Stockists Call', data: stockCalls },
        { label: 'Stockists Met', data: stockUniqueCum },
        { label: 'Missed Stockists', data: stockMissedCum }
    ];
};



// RANKINGS ENDPOINT
router.get('/user-performance/rankings', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ success: false, message: 'Missing month/year' });

        const monthMap = { 'Jan': 'january', 'Feb': 'february', 'Mar': 'march', 'Apr': 'april', 'May': 'may', 'Jun': 'june', 'Jul': 'july', 'Aug': 'august', 'Sep': 'september', 'Oct': 'october', 'Nov': 'november', 'Dec': 'december' };
        const fullMonth = monthMap[month] || month.toLowerCase();

        const { XlUser, XlGlobalSettings, XlPerformanceAnalysis, XlDCR, XlDoctor, sequelize } = require('../db');
        const { Op } = require('sequelize');




        const users = await XlUser.findAll();
        
        const settingsRecord = await XlGlobalSettings.findOne();
        let settings = { weightages: { effort: 30, brand: 15, keyCustomer: 15, customerRoi: 10, outstanding: 15, account: 15 }};
        if (settingsRecord && settingsRecord.settings && settingsRecord.settings.userPerformance) {
            settings = settingsRecord.settings.userPerformance;
        }
        const weightages = settings.weightages || {};

        let leaderboard = [];

        for (const user of users) {
            let userScore = 0;
            let kpiBreakdown = {};

            // 1. EFFORT ANALYSIS
            let hqCondition = (user.hq || '').trim().toLowerCase();
            const allocatedDoctors = await XlDoctor.findAll({ 
                where: sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), hqCondition) 
            });
            const totalDocs = allocatedDoctors.length || 1;

            const monthNumMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
            const monthNum = monthNumMap[month] || '01';
            const datePrefix = `${year}-${monthNum}-`; // e.g. "2026-09-"

            const dcrs = await XlDCR.findAll({ 
                where: { 
                    employeeId: user.employeeId || null, 
                    date: { [Op.like]: datePrefix + '%' } 
                } 
            });
            
            let doctorVisitCounts = {}; 
            dcrs.forEach(dcr => {
                if (dcr.entityType === 'Doctor' && dcr.entityId) {
                    doctorVisitCounts[dcr.entityId] = (doctorVisitCounts[dcr.entityId] || 0) + 1;
                }
            });

            const uniqueDoctorsMet = Object.keys(doctorVisitCounts).length;
            const coveragePercent = Math.min((uniqueDoctorsMet / totalDocs) * 100, 100);
            
            let compliantDoctorsCount = 0;
            allocatedDoctors.forEach(doc => {
                const visits = doctorVisitCounts[doc.uid] || doctorVisitCounts[doc._id] || 0;
                let requiredVisits = 0;
                if (doc.category && doc.category.includes('SuperCore')) requiredVisits = 3;
                else if (doc.category && doc.category.includes('Core')) requiredVisits = 2;
                else if (doc.category && doc.category.includes('Non-Core')) requiredVisits = 1;

                if (requiredVisits > 0 && visits >= requiredVisits) {
                    compliantDoctorsCount++;
                }
            });

            const docsRequiringVisits = allocatedDoctors.filter(d => d.category && (d.category.includes('Core') || d.category.includes('SuperCore') || d.category.includes('Non-Core'))).length;
            const compliancePercent = docsRequiringVisits > 0 ? (compliantDoctorsCount / docsRequiringVisits) * 100 : 0;

            // 4-Way Split Logic
            const effortThresholds = settings.effortThresholds || { coverage: 90, compliance: 90, drCallAvg: 8, chemistCallAvg: 2 };
            const targetCoverage = Number(effortThresholds.coverage) || 90;
            const targetCompliance = Number(effortThresholds.compliance) || 90;
            const targetDrCallAvg = Number(effortThresholds.drCallAvg) || 8;
            const targetChemistCallAvg = Number(effortThresholds.chemistCallAvg) || 2;

            const maxEffortPts = Number(weightages.effort) || 30;
            const maxPerMetric = maxEffortPts / 4;

            // 1. Coverage Pts
            let coveragePts = (coveragePercent / targetCoverage) * maxPerMetric;
            if (coveragePts > maxPerMetric) coveragePts = maxPerMetric; 

            // 2. Compliance Pts
            let compliancePts = (compliancePercent / targetCompliance) * maxPerMetric;
            if (compliancePts > maxPerMetric) compliancePts = maxPerMetric;

            // 3. Dr Call Average
            const totalDaysWorked = new Set(dcrs.map(d => d.date)).size;
            const totalDrCalls = dcrs.filter(d => d.entityType === 'Doctor').length;
            const actualDrCallAvg = totalDaysWorked > 0 ? (totalDrCalls / totalDaysWorked) : 0;
            
            let drCallPts = (actualDrCallAvg / targetDrCallAvg) * maxPerMetric;
            if (drCallPts > maxPerMetric) drCallPts = maxPerMetric;

            // 4. Chemist Call Average
            const totalChemistCalls = dcrs.filter(d => d.entityType === 'Chemist').length;
            const actualChemistCallAvg = totalDaysWorked > 0 ? (totalChemistCalls / totalDaysWorked) : 0;

            let chemistCallPts = (actualChemistCallAvg / targetChemistCallAvg) * maxPerMetric;
            if (chemistCallPts > maxPerMetric) chemistCallPts = maxPerMetric;

            const effortPoints = coveragePts + compliancePts + drCallPts + chemistCallPts;
            userScore += effortPoints;
            const effortPercent = maxEffortPts > 0 ? (effortPoints / maxEffortPts) * 100 : 0;
            const effortMatrix = await buildEffortMatrix(user, month, year, XlDCR, XlDoctor, XlChemist, XlStockist);
            kpiBreakdown['Effort Analysis'] = { 
                points: effortPoints, 
                max: maxEffortPts, 
                percentage: effortPercent,
                matrix: effortMatrix
            };

            // 2. SALES KPIs
            const perf = await XlPerformanceAnalysis.findOne({ where: { employeeId: user.employeeId || null, month: fullMonth, year } });
            
            const calcSalesKpi = (dataStr, weightStr) => {
                const weight = Number(weightStr) || 0;
                if (!dataStr) return { points: 0, max: weight, percentage: 0, data: [] };
                let data = [];
                try {
                    data = JSON.parse(dataStr);
                    if (typeof data === 'string') data = JSON.parse(data);
                } catch(e) { return { points: 0, max: weight, percentage: 0, data: [] }; }
                
                let totalPlanned = 0;
                let totalAchieved = 0;
                data.forEach(item => {
                    ['week1', 'week2', 'week3', 'week4', 'week5', 'week6'].forEach(w => {
                        if (item[w]) {
                            totalPlanned += Number(item[w].planned || 0);
                            totalAchieved += Number(item[w].achieved || 0);
                        }
                    });
                });

                if (totalPlanned === 0) return { points: 0, max: weight, percentage: 0, data };
                let percent = (totalAchieved / totalPlanned) * 100;
                let cappedPercent = percent > 100 ? 100 : percent; 
                return { points: (cappedPercent / 100) * weight, max: weight, percentage: percent, data };
            };

            let brandRes = { points: 0, max: Number(weightages.brand) || 15 };
            let roiRes = { points: 0, max: Number(weightages.customerRoi) || 10 };
            let outstandingRes = { points: 0, max: Number(weightages.outstanding) || 15 };
            let accountRes = { points: 0, max: Number(weightages.account) || 15 };
            let keyCustomerRes = { points: 0, max: Number(weightages.keyCustomer) || 15 };

            if (perf) {
                brandRes = calcSalesKpi(perf.brandData, weightages.brand || 15);
                roiRes = calcSalesKpi(perf.roiData, weightages.customerRoi || 10);
                outstandingRes = calcSalesKpi(perf.outstandingData, weightages.outstanding || 15);
                accountRes = calcSalesKpi(perf.accountData, weightages.account || 15);
                keyCustomerRes = calcSalesKpi(perf.keyCustomerData, weightages.keyCustomer || 15);
            }

            userScore += brandRes.points + roiRes.points + outstandingRes.points + accountRes.points + keyCustomerRes.points;
            
            kpiBreakdown['Brand Analysis'] = brandRes;
            kpiBreakdown['Customer ROI Analysis'] = roiRes;
            kpiBreakdown['Outstanding Analysis'] = outstandingRes;
            kpiBreakdown['Account Analysis'] = accountRes;
            kpiBreakdown['Key Customer Analysis'] = keyCustomerRes;

            const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
            leaderboard.push({
                userId: user._id,
                user: fullName,
                hq: user.hq || '-',
                designation: user.designation,
                avatar: user.profilePic,
                totalScore: userScore,
                kpiBreakdown
            });
        }

        leaderboard.sort((a, b) => b.totalScore - a.totalScore);
        
        // Add rank
        leaderboard = leaderboard.map((l, idx) => ({ ...l, rank: idx + 1 }));

        res.json({ success: true, data: leaderboard });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate rankings: ' + e.message, stack: e.stack });
    }
});

const { XlUser, XlDesignation, XlDoctor, XlChemist, XlStockist, XlDoctorControl, XlState, XlCity, XlRoute, XlTourProgram, XlDCR, XlAttendance, XlLeave, XlLeaveType, XlAssignedLeave, XlLeaveTemplate, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification, XlSample, XlGift, XlPrimarySales, XlSecondarySales, XlGeoFencing, XlGlobalSettings, XlHoliday, XlProduct, XlHQ, XlDivision, generateId, sequelize } = require('../db');
const { Op } = require('sequelize');

// Middleware to block locked users from any mobile API route instantly
router.use(async (req, res, next) => {
    const empId = req.body?.employeeId || req.query?.employeeId || req.body?.email || req.query?.email;
    if (empId) {
        try {
            const user = await XlUser.findOne({ 
                where: { 
                    [Op.or]: [
                        { employeeId: empId },
                        { email: empId },
                        { uid: empId }
                    ]
                }
            });
            if (user) {
                let controls = user.controls;
                if (typeof controls === 'string') {
                    try { controls = JSON.parse(controls); } catch(e) { controls = {}; }
                }
                if ((controls && controls.locked) || user.status === 'Deactivated' || user.status === 'Inactive') {
                    return res.json({ 
                        success: false, 
                        isLocked: true, // Special flag for mobile app if it wants to log out
                        message: 'Not Authorized to Access' 
                    });
                }
            }
        } catch(e) {
            console.error('Lock Check Error:', e);
        }
    }
    next();
});


// ─── HAVERSINE GEO-FENCE HELPER ──────────────────────────────────────────────
// Returns distance in metres between two GPS coordinates
function haversineMetres(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in metres
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_RADIUS_METRES = 200;

// Helper to generate common designation aliases (Sr. vs Senior, ZSM, ABM, etc.)
function getDesignationAliases(desig) {
    if (!desig) return [];
    const clean = desig.trim().toLowerCase();
    const aliases = new Set([clean]);

    // Strip out (HQ) if present: e.g. "Area Business Manager (Palanpur)" -> "area business manager"
    const base = clean.replace(/\s*\([^)]*\)/g, '').trim();
    if (base && base !== clean) {
        aliases.add(base);
    }

    const check = base || clean;
    if (check.includes('sr.') || check.includes('sr ')) {
        aliases.add(check.replace(/sr\.?/g, 'senior').replace(/\s+/g, ' ').trim());
    }
    if (check.includes('senior')) {
        aliases.add(check.replace(/senior/g, 'sr.').replace(/\s+/g, ' ').trim());
        aliases.add(check.replace(/senior/g, 'sr').replace(/\s+/g, ' ').trim());
    }
    if (check.includes('area business manager')) aliases.add('abm');
    if (check === 'abm') aliases.add('area business manager');
    if (check.includes('regional business manager')) aliases.add('rbm');
    if (check === 'rbm') aliases.add('regional business manager');
    if (check.includes('zonal sales manager')) aliases.add('zsm');
    if (check.includes('sr. zonal sales manager') || check.includes('senior zonal sales manager')) aliases.add('szsm');
    if (check === 'szsm') {
        aliases.add('sr. zonal sales manager');
        aliases.add('senior zonal sales manager');
    }
    if (check === 'zsm') aliases.add('zonal sales manager');
    if (check.includes('general manager')) aliases.add(check.replace(/general manager/g, 'gm').replace(/\s+/g, ' ').trim());
    if (check.includes('gm')) aliases.add(check.replace(/\bgm\b/g, 'general manager').replace(/\s+/g, ' ').trim());
    if (check.includes('national sales manager')) aliases.add('nsm');
    if (check === 'nsm') aliases.add('national sales manager');
    if (check.includes('vice president')) aliases.add('vp');
    if (check === 'vp') aliases.add('vice president');

    return Array.from(aliases);
}

// Standard designation rank and hierarchy level classifier
function getDesignationInfo(desig) {
    if (!desig) return { level: 1, badge: 'TBM' };
    const d = desig.toLowerCase().trim();
    if (d.includes('gm') || d.includes('general manager') || d.includes('director') || d.includes('president')) return { level: 9, badge: 'GM' };
    if (d.includes('national sales manager') || d.includes('nsm')) return { level: 8, badge: 'NSM' };
    if (d.includes('sales manager') && !d.includes('area') && !d.includes('regional') && !d.includes('zonal')) return { level: 7, badge: 'SM' };
    if (d.includes('sr. zonal') || d.includes('sr zonal') || d.includes('senior zonal') || d.includes('szsm')) return { level: 6, badge: 'Sr. ZSM' };
    if (d.includes('zonal sales manager') || d.includes('zsm')) return { level: 5, badge: 'ZSM' };
    if (d.includes('sr. regional') || d.includes('sr regional') || d.includes('senior regional') || d.includes('sr. rsm') || d.includes('sr rsm')) return { level: 4, badge: 'Sr. RSM' };
    if (d.includes('regional sales manager') || d.includes('rsm') || d.includes('rbm') || d.includes('regional business manager')) return { level: 3, badge: 'RSM' };
    if (d.includes('area sales manager') || d.includes('asm') || d.includes('abm') || d.includes('area business manager')) return { level: 2, badge: 'ASM' };
    if (d.includes('product manager') || d.includes('pm')) return { level: 6, badge: 'PM' };
    return { level: 1, badge: 'TBM' };
}

// Enterprise organizational tree builder resolving full downline hierarchies across all departments
async function getFullOrganizationHierarchy() {
    const { XlUser } = require('../db');
    const rawUsers = await XlUser.findAll({
        attributes: ['_id', 'uid', 'employeeId', 'firstName', 'lastName', 'designation', 'hq', 'division', 'phone', 'email', 'reportingManager', 'status', 'controls'],
        raw: true
    });

    // Filter active users
    const allUsers = rawUsers.filter(u => {
        if (!u) return false;
        if (u.status === 'Deactivated' || u.status === 'Inactive') return false;
        if (u.controls) {
            let c = u.controls;
            if (typeof c === 'string') {
                try { c = JSON.parse(c); } catch(e) {}
            }
            if (c && c.locked === true) return false;
        }
        return true;
    });

    const userMap = {};
    allUsers.forEach(u => {
        const empId = u.employeeId || u.uid || u._id;
        const dInfo = getDesignationInfo(u.designation);
        userMap[empId] = {
            ...u,
            id: empId,
            employeeId: empId,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || empId,
            level: dInfo.level,
            badge: dInfo.badge,
            children: [],
            managerName: '',
            managerDesignation: '',
            managerHq: ''
        };
    });

    // Link reportees to managers
    allUsers.forEach(u => {
        const empId = u.employeeId || u.uid || u._id;
        const userObj = userMap[empId];
        if (!userObj) return;

        let mgr = null;
        if (u.reportingManager) {
            mgr = userMap[u.reportingManager];
            if (!mgr) {
                mgr = Object.values(userMap).find(m => {
                    const desigHq = `${m.designation || ''} (${m.hq || ''})`.toLowerCase().trim();
                    return desigHq === u.reportingManager.toLowerCase().trim();
                });
            }
            if (!mgr) {
                mgr = Object.values(userMap).find(m => {
                    const mHq = (m.hq || '').replace(/-pst-\d+/i, '').trim().toLowerCase();
                    const desigHq = `${m.designation || ''} (${mHq})`.toLowerCase().trim();
                    const repClean = u.reportingManager.replace(/-pst-\d+/i, '').trim().toLowerCase();
                    return desigHq === repClean;
                });
            }
            if (!mgr) {
                mgr = Object.values(userMap).find(m => {
                    const desigOnly = (m.designation || '').toLowerCase().trim();
                    const repMgr = u.reportingManager.toLowerCase().trim();
                    return repMgr === desigOnly && desigOnly.length > 2;
                });
            }
            if (!mgr) {
                mgr = Object.values(userMap).find(m => {
                    const mName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase().trim();
                    return mName === u.reportingManager.toLowerCase().trim();
                });
            }
        }

        // Hierarchy rule: RSMs, ZSMs, Sr. ZSMs (levels 3-6) report to SM/NSM/GM
        if (!mgr && (userObj.level >= 3 && userObj.level <= 6)) {
            const smManager = Object.values(userMap).find(m => m.level >= 7 && (m.division === userObj.division || (m.designation || '').toLowerCase().includes('west') || m.level === 9));
            if (smManager) mgr = smManager;
        }

        if (mgr && (mgr.employeeId || mgr._id) !== empId) {
            userObj.managerName = mgr.name;
            userObj.managerDesignation = mgr.designation;
            userObj.managerHq = mgr.hq;
            if (!mgr.children.some(c => (c.employeeId || c.id) === empId)) {
                mgr.children.push(userObj);
            }
        }
    });

    // Find roots: top level nodes or those whose managers are not internal field reportees
    const roots = Object.values(userMap).filter(u => {
        if (!u.managerName) return true;
        return false;
    });

    if (roots.length === 0 && Object.keys(userMap).length > 0) {
        const maxLevel = Math.max(...Object.values(userMap).map(u => u.level));
        Object.values(userMap).filter(u => u.level === maxLevel).forEach(r => roots.push(r));
    }

    roots.sort((a, b) => (b.level - a.level) || a.name.localeCompare(b.name));

    // Calculate downline team count recursively
    function computeTeamCounts(node, depth = 0) {
        node.treeDepth = depth;
        let count = node.children.length;
        node.children.forEach(child => {
            count += computeTeamCounts(child, depth + 1);
        });
        node.totalTeamCount = count;
        return count;
    }
    roots.forEach(r => computeTeamCounts(r, 0));

    // Flatten tree in hierarchical order
    const flatList = [];
    const visited = new Set();
    function traverse(node) {
        if (visited.has(node.employeeId)) return;
        visited.add(node.employeeId);
        flatList.push({
            employeeId: node.employeeId,
            name: node.name,
            firstName: node.firstName,
            lastName: node.lastName,
            designation: node.designation,
            level: node.level,
            badge: node.badge,
            hq: node.hq,
            division: node.division,
            phone: node.phone,
            email: node.email,
            reportingManager: node.reportingManager,
            managerName: node.managerName,
            managerDesignation: node.managerDesignation,
            managerHq: node.managerHq,
            directReportsCount: node.children.length,
            totalTeamCount: node.totalTeamCount,
            treeDepth: node.treeDepth
        });
        node.children.sort((a, b) => (b.level - a.level) || a.name.localeCompare(b.name));
        node.children.forEach(traverse);
    }
    roots.forEach(traverse);

    Object.values(userMap).forEach(u => {
        if (!visited.has(u.employeeId)) {
            traverse(u);
        }
    });

    const divisions = Array.from(new Set(allUsers.map(u => u.division).filter(Boolean))).sort();
    const designations = Array.from(new Set(allUsers.map(u => u.designation).filter(Boolean))).sort();

    return {
        roots,
        flatList,
        totalEmployees: allUsers.length,
        divisions,
        designations
    };
}

// Robust recursive team collector resolving all direct and downline subordinates across any hierarchy level
async function getAllTeamMembers(managerUser, allUsers = null) {
    if (!managerUser) return [];
    const { XlUser } = require('../db');
    if (!allUsers) {
        allUsers = await XlUser.findAll({ where: { status: 'Active' }, raw: true });
    }

    const team = [];
    const queue = [managerUser];
    const visited = new Set([managerUser.employeeId || managerUser._id]);

    while (queue.length > 0) {
        const currentMgr = queue.shift();
        const mgrFullName = ((currentMgr.firstName || '') + ' ' + (currentMgr.lastName || '')).trim().toLowerCase();
        const mgrDesig = (currentMgr.designation || '').trim();
        const mgrHq = (currentMgr.hq || '').trim();
        const baseHq = mgrHq.replace(/-pst-\d+/i, '').split('-')[0].trim().toLowerCase();
        const desigAliases = getDesignationAliases(mgrDesig);

        for (const u of allUsers) {
            const uId = u.employeeId || u._id;
            if (visited.has(uId)) continue;
            if (u.status !== 'Active') continue;
            const rm = (u.reportingManager || '').trim();
            if (!rm) continue;
            const rmLower = rm.toLowerCase();

            let isMatch = false;
            if (currentMgr.employeeId && rmLower === currentMgr.employeeId.toLowerCase()) isMatch = true;
            if (currentMgr.uid && rmLower === currentMgr.uid.toLowerCase()) isMatch = true;
            if (mgrFullName && rmLower === mgrFullName) isMatch = true;

            if (!isMatch && mgrDesig) {
                for (const d of desigAliases) {
                    if (rmLower === d) { isMatch = true; break; }
                    if (mgrHq) {
                        const hqLower = mgrHq.toLowerCase();
                        if (rmLower === `${d} (${hqLower})` || rmLower === `${d} - ${hqLower}` || rmLower.startsWith(`${d} (${hqLower}`)) {
                            isMatch = true;
                            break;
                        }
                    }
                    if (baseHq) {
                        if (rmLower === `${d} (${baseHq})` || rmLower === `${d} - ${baseHq}` || rmLower.startsWith(`${d} (${baseHq}`)) {
                            isMatch = true;
                            break;
                        }
                    }
                }
            }

            if (isMatch) {
                visited.add(uId);
                team.push(u);
                queue.push(u);
            }
        }
    }
    return team;
}

// Find actual reporting manager records matching a reportingManager string (which is usually "Designation (HQ)")
async function findReportingManagers(reportingManagerStr) {
    if (!reportingManagerStr) return [];
    const { XlUser, sequelize } = require('../db');
    const { Op } = require('sequelize');

    const mgrRaw = reportingManagerStr.trim();
    const mgrQuery = mgrRaw.toLowerCase();
    const hqMatch = mgrRaw.match(/\(([^)]+)\)/);
    const targetHq = hqMatch ? hqMatch[1].trim() : null;
    const targetDesig = mgrRaw.replace(/\s*\([^)]*\)\s*$/, '').trim();

    const managerOr = [
        { employeeId: mgrRaw },
        sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), mgrQuery),
        sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('CONCAT', sequelize.col('firstName'), ' ', sequelize.col('lastName'))),
            mgrQuery
        )
    ];

    if (mgrRaw.length <= 36) {
        managerOr.push({ uid: mgrRaw });
    }

    if (targetDesig) {
        const desigAliases = getDesignationAliases(targetDesig);
        for (const d of desigAliases) {
            if (targetHq) {
                const baseHq = targetHq.replace(/-pst-\d+/i, '').split('-')[0].trim().toLowerCase();
                managerOr.push({
                    [Op.and]: [
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('designation')), d),
                        {
                            [Op.or]: [
                                sequelize.where(sequelize.fn('LOWER', sequelize.col('hq')), targetHq.toLowerCase()),
                                sequelize.where(sequelize.fn('LOWER', sequelize.col('hq')), { [Op.like]: `${baseHq}%` })
                            ]
                        }
                    ]
                });
            } else {
                managerOr.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('designation')), d));
            }
        }
    }

    return await XlUser.findAll({
        where: { [Op.or]: managerOr, status: 'Active' },
        attributes: ['_id', 'employeeId', 'firstName', 'lastName', 'designation', 'hq', 'division', 'email', 'phone'],
        raw: true
    });
}

// N-Level Recursive Hierarchy Lookup for Users and HQs
async function getReporteeUsers(designation, hq, division, userList = [], visited = new Set(), managerUser = null) {
    if (!designation || designation.toUpperCase() === 'ADMIN') return userList;
    const { XlUser } = require('../db');
    
    let resolvedMgr = managerUser;
    if (!resolvedMgr) {
        resolvedMgr = await XlUser.findOne({
            where: { designation, ...(hq ? { hq } : {}) }
        });
    }
    
    if (resolvedMgr) {
        const team = await getAllTeamMembers(resolvedMgr);
        for (const t of team) {
            if (!userList.some(existing => (existing.employeeId || existing._id) === (t.employeeId || t._id))) {
                userList.push(t);
            }
        }
        return userList;
    }
    
    return userList;
}

async function getSubordinateHQs(designation, hq, division, hqSet = new Set()) {
    if (!designation || designation === 'ADMIN') return Array.from(hqSet);
    const { XlHQ } = require('../db');

    // 1. Permanent Territory Hierarchy Traversal via XlHQ.parentHq
    if (hq) {
        const rootHq = hq.trim().toUpperCase();
        const baseRoot = rootHq.replace(/-pst-\d+/i, '').split('-')[0].trim();
        const hqQueue = [rootHq];
        if (baseRoot && baseRoot !== rootHq) hqQueue.push(baseRoot);

        const visitedHqs = new Set(hqQueue);
        try {
            const allHqs = await XlHQ.findAll({ raw: true });
            while (hqQueue.length > 0) {
                const currentParent = hqQueue.shift();
                for (const h of allHqs) {
                    const hName = (h.hqName || '').trim().toUpperCase();
                    const pName = (h.parentHq || '').trim().toUpperCase();
                    const pBase = pName.replace(/-pst-\d+/i, '').split('-')[0].trim();

                    if (pName === currentParent || pBase === currentParent) {
                        if (!visitedHqs.has(hName)) {
                            visitedHqs.add(hName);
                            hqQueue.push(hName);
                            hqSet.add(hName);
                            hqSet.add(hName.toLowerCase());
                            const hBase = hName.replace(/-pst-\d+/i, '').split('-')[0].trim();
                            if (hBase) {
                                hqSet.add(hBase);
                                hqSet.add(hBase.toLowerCase());
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[HQ Traversal Warning]', e.message);
        }
    }

    // 2. Traversal via active users downline (backwards-compatibility & vacant fallback)
    const reportees = await getReporteeUsers(designation, hq, division);
    for (const r of reportees) {
        if (r.hq) {
            const clean = r.hq.trim();
            hqSet.add(clean);
            hqSet.add(clean.toUpperCase());
            hqSet.add(clean.toLowerCase());
            hqSet.add(clean.replace(/\s+/g, '-'));
            hqSet.add(clean.replace(/-/g, ' '));
            const base = clean.replace(/-pst-\d+/i, '').split('-')[0].trim();
            if (base) {
                hqSet.add(base);
                hqSet.add(base.toUpperCase());
                hqSet.add(base.toLowerCase());
            }
        }
    }
    return Array.from(hqSet);
}

// Get routes for user and their team
router.get('/routes', async (req, res) => {
    try {
        let { designation, hq, employeeId } = req.query;

        // If employeeId is passed and designation/hq are missing, resolve from database
        if (employeeId && (!designation || !hq)) {
            const userRecord = await XlUser.findOne({
                where: { [Op.or]: [{ employeeId }, { uid: employeeId }, { email: employeeId }] }
            });
            if (userRecord) {
                designation = designation || userRecord.designation;
                hq = hq || userRecord.hq;
            }
        }

        let hqList = [];
        if (hq) {
            const trimmed = hq.trim().toLowerCase();
            hqList.push(trimmed);
            hqList.push(trimmed.replace(/\s+/g, '-'));
            hqList.push(trimmed.replace(/-/g, ' '));
        }
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq, req.query.division);
            subHQs.forEach(sub => {
                const subTrim = sub.trim().toLowerCase();
                hqList.push(subTrim);
                hqList.push(subTrim.replace(/\s+/g, '-'));
                hqList.push(subTrim.replace(/-/g, ' '));
            });
            hqList = [...new Set(hqList)];
        } else if (designation === 'ADMIN') {
            const routes = await XlRoute.findAll();
            return res.json({ success: true, data: routes });
        }
        
        const { sequelize } = require('../db');
        const routes = await XlRoute.findAll({
            where: hqList.length > 0 ? sequelize.where(sequelize.fn('lower', sequelize.col('hq')), { [Op.in]: hqList }) : {}
        });
        
        res.json({ success: true, data: routes });
    } catch (e) {
        console.error('Routes fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
});

router.get('/debug-call-plans', async (req, res) => {
    try {
        const plans = await XlCallPlan.findAll({ order: [['createdAt', 'DESC']], limit: 20 });
        res.json({ success: true, data: plans });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/debug-linkage', async (req, res) => {
    try {
        const users = await XlUser.findAll({
            attributes: ['_id', 'employeeId', 'firstName', 'lastName', 'designation', 'hq', 'division', 'reportingManager', 'email', 'isAdmin', 'status']
        });
        const pendingTPs = await XlTourProgram.findAll({
            where: { status: ['Submitted', 'Pending', 'pending', 'submitted', 'Re-Submitted', 're-submitted'] },
            attributes: ['_id', 'employeeId', 'employeeName', 'hq', 'month', 'year', 'status']
        });
        const pendingExpenses = await XlExpense.findAll({
            where: { status: ['Submitted', 'Pending', 'pending', 'submitted', 'Re-Submitted', 're-submitted'] },
            attributes: ['_id', 'employeeId', 'date', 'amount', 'category', 'status'],
            limit: 10
        });

        const linkageResults = [];
        for (const u of users) {
            const desig = (u.designation || '').toLowerCase();
            const isMgr = desig.includes('manager') || desig.includes('abm') || desig.includes('rbm') || desig.includes('zsm') || u.isAdmin;
            if (isMgr) {
                const reportees = await getReporteeUsers(u.designation, u.hq, u.division, [], new Set(), u);
                const subHQs = await getSubordinateHQs(u.designation, u.hq, u.division);
                linkageResults.push({
                    name: `${u.firstName} ${u.lastName}`,
                    email: u.email,
                    employeeId: u.employeeId,
                    designation: u.designation,
                    hq: u.hq,
                    division: u.division,
                    isAdmin: u.isAdmin,
                    reporteesCount: reportees.length,
                    reportees: reportees.map(r => ({ name: `${r.firstName} ${r.lastName}`, employeeId: r.employeeId, designation: r.designation, hq: r.hq, division: r.division, reportingManager: r.reportingManager })),
                    subordinateHQs: subHQs
                });
            }
        }

        res.json({
            usersCount: users.length,
            users: users.map(u => ({ name: `${u.firstName} ${u.lastName}`, employeeId: u.employeeId, designation: u.designation, hq: u.hq, division: u.division, reportingManager: u.reportingManager, email: u.email })),
            pendingTPs,
            pendingExpenses,
            linkageResults
        });
    } catch(e) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

// --- DOCTOR CONTROL ROUTES ---
router.post('/login', async (req, res) => {
    try {
        const { email, password, companyCode } = req.body;
        if (!email || !password) return res.json({ success: false, message: 'Email and password required' });
        
        // Validate Company Code against Company Profile
        try {
            const { Company } = require('../db');
            const companyRec = await Company.findOne().lean();
            const expectedCode = ((companyRec && companyRec.companyCode) || 'EMYRIS').trim().toUpperCase();
            if (companyCode) {
                const inputCode = companyCode.trim().toUpperCase();
                if (inputCode !== expectedCode) {
                    return res.json({ success: false, message: 'Invalid Company Code' });
                }
            }
        } catch (compErr) {
            console.error('Company code check error:', compErr);
        }

        const cleanEmail = email.trim().toLowerCase();
        let user = await XlUser.findOne({ where: { email: cleanEmail } });
        if (!user) {
            user = await XlUser.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('email')),
                    cleanEmail
                )
            });
        }
        if (!user) {
            user = await XlUser.findOne({ where: { employeeId: email.trim() } });
        }
        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        if (user.status === 'Deactivated' || user.status === 'Inactive') {
            return res.json({ success: false, message: 'Not Authorized to Access' });
        }

        const bcrypt = require('bcryptjs');
        const storedPass = user.password || '';
        let passwordMatch = false;
        if (storedPass.startsWith('$2')) {
            passwordMatch = bcrypt.compareSync(password, storedPass);
        } else {
            passwordMatch = (password === storedPass);
        }
        if (!passwordMatch) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        
        // Remove password before sending to frontend
        const userData = user.toJSON();
        delete userData.password;

        // Fetch user designation level
        if (user.designation) {
            const desigRec = await XlDesignation.findOne({ where: { designationName: user.designation } });
            if (desigRec) userData.level = desigRec.level;
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: 'USER' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, message: 'Login successful', user: userData, token });
    } catch (e) {
        console.error('XL Login Error:', e);
        res.status(500).json({ success: false, message: 'System error during login' });
    }
});

// ─── USER DRAWER: CHANGE PASSWORD WITH OTP PIN VIA REGISTERED EMAIL ─────────────

// Step 1: Send OTP PIN directly to user's pre-captured email without asking for email
router.post('/user/change-password/request-pin', async (req, res) => {
    try {
        const { employeeId, email, userId } = req.body;
        const { XlUser, sequelize } = require('../db');
        const { sendEmail } = require('../utils/mailer');

        let user = null;
        if (employeeId) {
            user = await XlUser.findOne({ where: { employeeId: employeeId.trim() } });
        }
        if (!user && userId) {
            user = await XlUser.findOne({ where: { _id: userId } });
        }
        if (!user && email) {
            user = await XlUser.findOne({ 
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('email')), 
                    email.trim().toLowerCase()
                )
            });
        }
        if (!user) {
            return res.json({ success: false, message: 'User profile not found. Please log in again.' });
        }

        const targetEmail = (user.email || '').trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) {
            return res.json({ 
                success: false, 
                message: 'No registered email address found for this user account. Please contact your administrator.' 
            });
        }

        // Generate secure 6-digit random PIN
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await XlUser.update({ resetOtp: pin, resetOtpExpires: expires }, { where: { _id: user._id } });

        // Mask email for privacy display (e.g. k•••••i@emyrishr.in)
        const [uPart, dPart] = targetEmail.split('@');
        const maskedEmail = uPart.length > 2 
            ? uPart.charAt(0) + '••••' + uPart.charAt(uPart.length - 1) + '@' + dPart
            : uPart.charAt(0) + '••••@' + dPart;

        const userName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();

        const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 14px; background-color: #0f172a; color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #0284c7, #0369a1); padding: 10px 24px; border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 20px; letter-spacing: 0.5px;">
                        EMYRIS
                    </div>
                    <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 2px;">Field CRM Security</p>
                </div>

                <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px;">Password Change Verification PIN</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px;">
                    Hello <strong>${userName}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
                    We received a request to change the password for your Emyris XL account. Please use the 6-Digit One-Time Verification PIN below to authorize this change:
                </p>

                <div style="background-color: #1e293b; border: 1px solid #334155; border-left: 4px solid #38bdf8; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your 6-Digit Verification PIN</div>
                    <div style="font-family: Monaco, Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 900; color: #38bdf8; letter-spacing: 8px; background: #0f172a; padding: 12px 24px; border-radius: 8px; border: 1px dashed #38bdf8; display: inline-block;">
                        ${pin}
                    </div>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">This code expires in <strong>10 minutes</strong>.</p>
                </div>

                <div style="font-size: 12px; line-height: 1.5; color: #64748b; border-top: 1px solid #334155; padding-top: 16px;">
                    <p style="margin: 0 0 6px 0;"><strong>Security Notice:</strong> Do not share this PIN with anyone. Emyris support will never ask for your verification code.</p>
                    <p style="margin: 0;">If you did not initiate this change, your account credentials remain unchanged and safe.</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: targetEmail,
            subject: `Emyris XL - Password Change Verification PIN: ${pin}`,
            html: emailHtml
        });

        res.json({
            success: true,
            maskedEmail,
            message: `A 6-digit verification PIN has been sent to your registered email (${maskedEmail}).`
        });
    } catch (e) {
        console.error('Request change password PIN error:', e);
        res.status(500).json({ success: false, message: 'Failed to send PIN: ' + e.message });
    }
});

// Step 2: Verify OTP PIN & Update password in database & send confirmation email
router.post('/user/change-password/verify-pin', async (req, res) => {
    try {
        const { employeeId, email, userId, pin, newPassword } = req.body;
        const { XlUser, sequelize } = require('../db');
        const { sendEmail } = require('../utils/mailer');

        let user = null;
        if (employeeId) {
            user = await XlUser.findOne({ where: { employeeId: employeeId.trim() } });
        }
        if (!user && userId) {
            user = await XlUser.findOne({ where: { _id: userId } });
        }
        if (!user && email) {
            user = await XlUser.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('email')),
                    email.trim().toLowerCase()
                )
            });
        }
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const submittedPin = String(pin || '').trim();
        const trimmedNewPass = String(newPassword || '').trim();

        if (!submittedPin) {
            return res.json({ success: false, message: 'Verification PIN is required' });
        }
        if (!trimmedNewPass || trimmedNewPass.length < 4) {
            return res.json({ success: false, message: 'New password must be at least 4 characters long' });
        }

        if (user.resetOtp !== submittedPin) {
            return res.json({ success: false, message: 'Invalid verification PIN. Please check and try again.' });
        }

        if (!user.resetOtpExpires || new Date(user.resetOtpExpires).getTime() < Date.now()) {
            return res.json({ success: false, message: 'Verification PIN has expired. Please request a new PIN.' });
        }

        // Update password in database and clear OTP
        await XlUser.update(
            { password: trimmedNewPass, resetOtp: null, resetOtpExpires: null },
            { where: { _id: user._id } }
        );

        const targetEmail = (user.email || '').trim().toLowerCase();
        const userName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();
        const changeTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

        if (targetEmail && targetEmail.includes('@')) {
            const confirmHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 14px; background-color: #0f172a; color: #f8fafc;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 10px 24px; border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 20px; letter-spacing: 0.5px;">
                            EMYRIS
                        </div>
                        <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: bold; color: #34d399; text-transform: uppercase; letter-spacing: 2px;">Field CRM Security Notice</p>
                    </div>

                    <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px;">Password Changed Successfully</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px;">
                        Hello <strong>${userName}</strong>,
                    </p>
                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
                        Your password for Emyris XL Field CRM was successfully changed in the database on <strong>${changeTime} (IST)</strong>.
                    </p>

                    <div style="background-color: #1e293b; border: 1px solid #334155; border-left: 4px solid #10b981; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0; font-size: 13px; color: #34d399; font-weight: bold;">
                            ✓ Your new password is now active in the database.
                        </p>
                    </div>

                    <div style="font-size: 12px; line-height: 1.5; color: #64748b; border-top: 1px solid #334155; padding-top: 16px;">
                        <p style="margin: 0;">If you did not make this change, please report immediately to <a href="mailto:adminhr@emyrishr.in" style="color: #38bdf8;">adminhr@emyrishr.in</a>.</p>
                    </div>
                </div>
            `;
            sendEmail({
                to: targetEmail,
                subject: 'Emyris XL - Password Changed Successfully',
                html: confirmHtml
            }).catch(e => console.error('Confirmation email error:', e));
        }

        res.json({
            success: true,
            message: 'Your password has been successfully updated in the database and confirmation email sent!'
        });
    } catch (e) {
        console.error('Verify and change password error:', e);
        res.status(500).json({ success: false, message: 'Server error: ' + e.message });
    }
});

// ─── FULL COMPANY HIERARCHY (ADMIN / TREE) ────────────────────────────────────
router.get('/hierarchy', async (req, res) => {
    try {
        const fullHierarchy = await getFullOrganizationHierarchy();
        res.json({ success: true, isFullHierarchy: true, ...fullHierarchy });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── USER DRAWER: MY HIERARCHY ──────────────────────────────────────────────────
router.get('/user/hierarchy', async (req, res) => {
    try {
        const { employeeId, all } = req.query;
        const { XlUser, sequelize } = require('../db');
        const { Op } = require('sequelize');

        // If 'all' is requested, or no employeeId, or ALL, return entire company hierarchy
        if (!employeeId || employeeId.trim() === '' || employeeId === 'ALL' || all === 'true') {
            const fullHierarchy = await getFullOrganizationHierarchy();
            return res.json({ success: true, isFullHierarchy: true, ...fullHierarchy });
        }

        const user = await XlUser.findOne({ 
            where: { 
                [Op.or]: [
                    { employeeId: employeeId.trim() },
                    { uid: employeeId.trim() },
                    { _id: employeeId.trim() }
                ]
            }, 
            raw: true 
        });

        // If employee not found in field records (e.g., Admin account), return full hierarchy
        if (!user) {
            const fullHierarchy = await getFullOrganizationHierarchy();
            return res.json({ success: true, isFullHierarchy: true, ...fullHierarchy });
        }

        let manager = null;
        if (user.reportingManager) {
            const mgrRaw = user.reportingManager.trim();
            const mgrQuery = mgrRaw.toLowerCase();
            const hqMatch = mgrRaw.match(/\(([^)]+)\)/);
            const targetHq = hqMatch ? hqMatch[1].trim() : null;
            const targetDesig = mgrRaw.replace(/\s*\([^)]*\)\s*$/, '').trim();

            const managerOr = [
                { employeeId: mgrRaw },
                sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), mgrQuery),
                sequelize.where(
                    sequelize.fn('LOWER', sequelize.fn('CONCAT', sequelize.col('firstName'), ' ', sequelize.col('lastName'))),
                    mgrQuery
                )
            ];

            if (user.reportingManager.trim().length <= 36) {
                managerOr.push({ uid: mgrRaw });
            }

            if (targetDesig) {
                const desigAliases = getDesignationAliases(targetDesig);
                for (const d of desigAliases) {
                    if (targetHq) {
                        const baseHq = targetHq.split('-')[0].trim().toLowerCase();
                        managerOr.push({
                            [Op.and]: [
                                sequelize.where(sequelize.fn('LOWER', sequelize.col('designation')), d),
                                {
                                    [Op.or]: [
                                        sequelize.where(sequelize.fn('LOWER', sequelize.col('hq')), targetHq.toLowerCase()),
                                        sequelize.where(sequelize.fn('LOWER', sequelize.col('hq')), { [Op.like]: `${baseHq}%` })
                                    ]
                                }
                            ]
                        });
                    } else {
                        managerOr.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('designation')), d));
                    }
                }
            }

            manager = await XlUser.findOne({
                where: { [Op.or]: managerOr },
                attributes: ['firstName', 'lastName', 'designation', 'email', 'phone', 'hq', 'division'],
                raw: true
            });
        }

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const reporteeOrConditions = [
            { reportingManager: user.employeeId },
            { reportingManager: user.employeeId.trim() }
        ];

        if (user.uid) {
            reporteeOrConditions.push({ reportingManager: user.uid });
        }

        if (fullName) {
            reporteeOrConditions.push({ reportingManager: fullName });
            reporteeOrConditions.push(sequelize.where(
                sequelize.fn('LOWER', sequelize.col('reportingManager')),
                fullName.toLowerCase()
            ));
        }

        // Designation & HQ based matching for subordinates
        if (user.designation) {
            const desigAliases = getDesignationAliases(user.designation);
            const hqClean = (user.hq || '').trim();
            const baseHq = hqClean.split('-')[0].trim();

            for (const d of desigAliases) {
                // Match designation alone (when reportingManager does not specify an HQ)
                reporteeOrConditions.push(sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('reportingManager')),
                    d
                ));

                // Match designation + exact HQ / base HQ
                if (hqClean) {
                    const hqLower = hqClean.toLowerCase();
                    reporteeOrConditions.push(sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('reportingManager')),
                        `${d} (${hqLower})`
                    ));
                    reporteeOrConditions.push(sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('reportingManager')),
                        `${d} - ${hqLower}`
                    ));
                    reporteeOrConditions.push(sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('reportingManager')),
                        { [Op.like]: `${d} (${hqLower}%` }
                    ));
                }
                if (baseHq && baseHq.toLowerCase() !== hqClean.toLowerCase()) {
                    const baseLower = baseHq.toLowerCase();
                    reporteeOrConditions.push(sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('reportingManager')),
                        `${d} (${baseLower})`
                    ));
                    reporteeOrConditions.push(sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('reportingManager')),
                        `${d} - ${baseLower}`
                    ));
                    reporteeOrConditions.push(sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('reportingManager')),
                        { [Op.like]: `${d} (${baseLower}%` }
                    ));
                }
            }
        }

        const rawReportees = await XlUser.findAll({
            where: {
                [Op.or]: reporteeOrConditions,
                status: 'Active'
            },
            attributes: ['firstName', 'lastName', 'designation', 'hq', 'division', 'phone', 'email', 'employeeId'],
            raw: true
        });

        // Deduplicate and filter out self
        const reportees = [];
        const seen = new Set();
        for (const r of rawReportees) {
            const key = r.employeeId || `${r.firstName}_${r.lastName}_${r.hq}`;
            if (r.employeeId !== user.employeeId && !seen.has(key)) {
                seen.add(key);
                reportees.push(r);
            }
        }

        res.json({
            success: true,
            user: {
                name: fullName,
                designation: user.designation,
                employeeId: user.employeeId,
                hq: user.hq,
                division: user.division,
                phone: user.phone,
                email: user.email
            },
            manager,
            reportees
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── USER DRAWER / DASHBOARD: CONSOLIDATED ACTIVITY (MTD SUMMARY) ─────────────
router.get('/user/consolidated-activity', async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        const { XlDCR } = require('../db');
        const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const curM = month || monthsArr[now.getMonth()];
        const curY = year || String(now.getFullYear());
        const mIdx = monthsArr.indexOf(curM);

        const where = {};
        if (employeeId && employeeId.trim() !== '' && employeeId.trim() !== 'ALL') {
            const { XlUser } = require('../db');
            const { Op } = require('sequelize');
            const user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { employeeId: employeeId.trim() },
                        { uid: employeeId.trim() },
                        { _id: employeeId.trim() }
                    ]
                }
            });
            if (user) {
                const team = await getAllTeamMembers(user);
                const allEmpKeys = [user.employeeId, user.uid, user._id, ...team.map(t => t.employeeId), ...team.map(t => t.uid), ...team.map(t => t._id)].filter(Boolean);
                where.employeeId = { [Op.in]: allEmpKeys };
            } else {
                where.employeeId = employeeId.trim();
            }
        }

        const dcrRecords = await XlDCR.findAll({
            where,
            raw: true
        });

        const monthDcrs = dcrRecords.filter(d => {
            const dt = new Date(d.date || d.createdAt);
            return !isNaN(dt.getTime()) && dt.getMonth() === mIdx && String(dt.getFullYear()) === curY;
        });

        let doctorCalls = 0;
        let chemistCalls = 0;
        let stockistCalls = 0;
        let totalPob = 0;
        const datesWorked = new Set();
        const dailyMap = {};

        monthDcrs.forEach(d => {
            if (d.entityType === 'Doctor') doctorCalls++;
            else if (d.entityType === 'Chemist') chemistCalls++;
            else if (d.entityType === 'Stockist') stockistCalls++;

            let rowPob = 0;
            if (d.pobItems) {
                try {
                    const parsed = typeof d.pobItems === 'string' ? JSON.parse(d.pobItems) : d.pobItems;
                    if (Array.isArray(parsed)) {
                        rowPob = parsed.reduce((sum, item) => sum + (Number(item.qty || item.quantity || 0) * Number(item.rate || item.price || 0)), 0);
                    }
                } catch (_) {}
            }
            if (!rowPob && d.pob) rowPob = Number(d.pob || 0);
            totalPob += rowPob;

            const day = d.date ? d.date.split('T')[0] : '';
            if (day) {
                datesWorked.add(day);
                if (!dailyMap[day]) {
                    const parts = day.split('-');
                    const formattedDate = parts.length === 3 && parts[0].length === 4 
                        ? `${parts[2]}-${parts[1]}-${parts[0]}` 
                        : day;
                    dailyMap[day] = { date: formattedDate, rawDate: day, doctor: 0, chemist: 0, stockist: 0, total: 0, pob: 0 };
                }
                if (d.entityType === 'Doctor') dailyMap[day].doctor++;
                else if (d.entityType === 'Chemist') dailyMap[day].chemist++;
                else if (d.entityType === 'Stockist') dailyMap[day].stockist++;
                dailyMap[day].total++;
                dailyMap[day].pob += rowPob;
            }
        });

        const daysWorked = datesWorked.size;
        const totalCalls = doctorCalls + chemistCalls + stockistCalls;
        const callAvg = daysWorked > 0 ? Number((totalCalls / daysWorked).toFixed(1)) : 0;
        const dailyBreakdown = Object.values(dailyMap).sort((a, b) => b.rawDate.localeCompare(a.rawDate));

        res.json({
            success: true,
            data: {
                month: curM,
                year: curY,
                isAllMode: !employeeId || employeeId === 'ALL' || employeeId.trim() === '',
                totalCalls,
                doctorCalls,
                chemistCalls,
                stockistCalls,
                totalPob,
                daysWorked,
                callAvg,
                dailyBreakdown
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── USER DRAWER / DASHBOARD: TODAY'S ACTIVITY ─────────────────────────────────
router.get('/user/todays-activity', async (req, res) => {
    try {
        const { employeeId } = req.query;
        const { XlDCR, XlAttendance } = require('../db');
        const { Op } = require('sequelize');
        const todayStr = new Date().toISOString().split('T')[0];

        const attWhere = { date: { [Op.like]: `${todayStr}%` } };
        const dcrWhere = { date: { [Op.like]: `${todayStr}%` } };

        if (employeeId && employeeId.trim() !== '' && employeeId.trim() !== 'ALL') {
            const { XlUser } = require('../db');
            const user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { employeeId: employeeId.trim() },
                        { uid: employeeId.trim() },
                        { _id: employeeId.trim() }
                    ]
                }
            });
            if (user) {
                const team = await getAllTeamMembers(user);
                const allEmpKeys = [user.employeeId, user.uid, user._id, ...team.map(t => t.employeeId), ...team.map(t => t.uid), ...team.map(t => t._id)].filter(Boolean);
                attWhere.employeeId = { [Op.in]: allEmpKeys };
                dcrWhere.employeeId = { [Op.in]: allEmpKeys };
            } else {
                attWhere.employeeId = employeeId.trim();
                dcrWhere.employeeId = employeeId.trim();
            }
        }

        const [atts, dcrs] = await Promise.all([
            XlAttendance.findAll({
                where: attWhere,
                raw: true
            }),
            XlDCR.findAll({
                where: dcrWhere,
                order: [['createdAt', 'DESC']],
                raw: true
            })
        ]);

        let docCount = 0;
        let chemCount = 0;
        let stkCount = 0;
        let todayPob = 0;

        dcrs.forEach(d => {
            if (d.entityType === 'Doctor') docCount++;
            else if (d.entityType === 'Chemist') chemCount++;
            else if (d.entityType === 'Stockist') stkCount++;

            let rowPob = 0;
            if (d.pobItems) {
                try {
                    const parsed = typeof d.pobItems === 'string' ? JSON.parse(d.pobItems) : d.pobItems;
                    if (Array.isArray(parsed)) {
                        rowPob = parsed.reduce((sum, item) => sum + (Number(item.qty || item.quantity || 0) * Number(item.rate || item.price || 0)), 0);
                    }
                } catch (_) {}
            }
            if (!rowPob && d.pob) rowPob = Number(d.pob || 0);
            todayPob += rowPob;
        });

        const { XlUser } = require('../db');
        const activeFieldUsers = await XlUser.findAll({ where: { status: 'Active' }, attributes: ['employeeId', 'firstName', 'lastName', 'designation', 'hq'], raw: true });
        const totalPunchedIn = atts.filter(a => !!a.punchInTime).length;
        const isAllMode = !employeeId || employeeId.trim() === '' || employeeId === 'ALL';
        const att = atts.length > 0 ? atts[0] : null;

        res.json({
            success: true,
            data: {
                todayDate: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }),
                todayStr,
                isAllMode,
                totalStaffCount: activeFieldUsers.length,
                totalPunchedIn,
                attendance: {
                    isPunchedIn: isAllMode ? totalPunchedIn > 0 : !!(att && att.punchInTime),
                    punchInTime: att?.punchInTime || null,
                    punchOutTime: att?.punchOutTime || null,
                    status: isAllMode ? `${totalPunchedIn} / ${activeFieldUsers.length} Staff Active in Field` : (att?.status || (att?.punchInTime ? 'Present' : 'Not Punched In')),
                    allAttendees: atts
                },
                doctorCalls: docCount,
                chemistCalls: chemCount,
                stockistCalls: stkCount,
                totalCalls: dcrs.length,
                totalPob: todayPob,
                visits: dcrs.map(d => ({
                    _id: d._id,
                    employeeId: d.employeeId,
                    employeeName: d.employeeName,
                    hq: d.hq || d.workingHq || '',
                    entityType: d.entityType,
                    name: d.entityName || d.doctorName || d.chemistName || 'Call',
                    workingAreas: d.workingAreas || d.workingAreaType || '',
                    time: d.checkInTime || d.time || (d.createdAt ? new Date(d.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''),
                    pob: d.pob || 0,
                    status: d.status || 'Submitted'
                }))
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── USER DRAWER: CONTACT SUPPORT ───────────────────────────────────────────────
router.post('/user/contact-support', async (req, res) => {
    try {
        const { employeeId, subject, message } = req.body;
        const { XlUser, XlNotification, Company } = require('../db');
        const { sendEmail } = require('../utils/mailer');

        const user = await XlUser.findOne({ where: { employeeId: (employeeId || '').trim() } });
        const userName = user ? `${user.firstName} ${user.lastName}` : 'CRM Field User';
        const userEmail = user?.email || 'N/A';
        const userHq = user?.hq || 'N/A';
        const userDesignation = user?.designation || 'TERRITORY BUSINESS MANAGER';

        // Fetch official company support email dynamically from Company profile
        let companySupportEmail = 'hradmin@emyrishr.in';
        try {
            const company = await Company.findOne();
            if (company && company.email) {
                companySupportEmail = company.email.trim();
            }
        } catch (_) {}

        const ticketNo = 'TCK-' + Date.now().toString().slice(-6);

        // 1. Send direct email to company support email with replyTo set to employee
        await sendEmail({
            to: companySupportEmail,
            replyTo: (userEmail && userEmail !== 'N/A' && userEmail.includes('@')) ? userEmail : undefined,
            subject: `[Support Ticket #${ticketNo}] ${subject || 'User Query'} - from ${userName} (${userHq})`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                    <div style="background: #0284c7; color: white; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0; font-size: 16px;">New Support Request #${ticketNo}</h3>
                        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Emyris XL Field CRM Help Desk</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                        <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Employee:</strong></td><td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${userName} (${employeeId || 'N/A'})</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Designation:</strong></td><td style="padding: 6px 0; color: #0f172a;">${userDesignation}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Headquarter:</strong></td><td style="padding: 6px 0; color: #0f172a;">${userHq}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Employee Email:</strong></td><td style="padding: 6px 0; color: #0284c7;"><a href="mailto:${userEmail}">${userEmail}</a></td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Subject / Concern:</strong></td><td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${subject || 'Support Query'}</td></tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Message / Concern:</strong></p>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1e293b;">${message}</div>
                    <div style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
                        To reply to the employee, click Reply in your email client.
                    </div>
                </div>
            `
        });

        // 2. Also send an immediate acknowledgement / confirmation copy to the Employee!
        if (userEmail && userEmail !== 'N/A' && userEmail.includes('@')) {
            await sendEmail({
                to: userEmail,
                subject: `[Received #${ticketNo}] Support Concern: ${subject || 'General'}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                        <h3 style="color: #0284c7; margin-top: 0;">We've received your query</h3>
                        <p style="font-size: 14px; color: #334155;">Hello <strong>${userName}</strong>,</p>
                        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
                            Thank you for reaching out to Emyris Support. Your request has been logged under <strong>Ticket #${ticketNo}</strong> and forwarded to our HR & Operations team (<strong>${companySupportEmail}</strong>).
                        </p>
                        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; margin: 16px 0;">
                            <p style="margin: 0 0 8px 0;"><strong>Concern:</strong> ${subject || 'Support Query'}</p>
                            <p style="margin: 0; color: #64748b; white-space: pre-wrap;">${message}</p>
                        </div>
                        <p style="font-size: 12px; color: #64748b;">
                            If you need urgent assistance, you can also contact the helpdesk at <strong>7993163300</strong>.
                        </p>
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Best Regards,<br>Emyris Support Team</p>
                    </div>
                `
            }).catch(err => console.error('Employee ack email error:', err));
        }

        // 3. Save directly in database notifications for Admin portal
        await XlNotification.create({
            employeeId: 'ADMIN',
            title: `Support #${ticketNo}: ${subject || 'General'} (${userName} - ${userHq})`,
            message: `From: ${userName} (${employeeId || 'N/A'}) | HQ: ${userHq} | Email: ${userEmail}\n\n${message}`
        }).catch(err => console.error('Notification log error:', err));

        // 4. Also save in the employee's personal notifications in their mobile app
        if (employeeId) {
            await XlNotification.create({
                employeeId: employeeId.trim(),
                title: `Support Ticket #${ticketNo} Submitted`,
                message: `Your query regarding "${subject || 'General'}" has been sent to ${companySupportEmail}.`
            }).catch(err => console.error('User notification log error:', err));
        }

        res.json({ success: true, message: `Your support request #${ticketNo} has been submitted to the management team.` });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});


// ─── PHASE 1: CREATION ─────────────────────────────────────────────────────

router.post('/doctor', async (req, res) => {
    try {
        const doctor = await XlDoctor.create(req.body);
        res.json({ success: true, message: 'Doctor created successfully!', data: doctor });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create doctor' });
    }
});

router.put('/doctor/:id/geo', async (req, res) => {
    try {
        const { lat1, lng1, geoAddress1, employeeId } = req.body;
        const doctor = await XlDoctor.findOne({ where: { _id: req.params.id } });
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        
        if (!doctor.lat1) {
            doctor.lat1 = lat1;
            doctor.lng1 = lng1;
            doctor.geoAddress1 = geoAddress1;
        } else if (!doctor.lat2) {
            doctor.lat2 = lat1;
            doctor.lng2 = lng1;
            doctor.geoAddress2 = geoAddress1;
        } else {
            return res.status(400).json({ error: 'Doctor already has 2 locations tagged.' });
        }
        await doctor.save();

        await XlGeoFencing.create({
            employeeId: employeeId || 'SYSTEM',
            entityType: 'Doctor',
            entityId: req.params.id,
            latitude: lat1,
            longitude: lng1,
            geoAddress: geoAddress1,
            status: 'Submitted'
        });
        res.json({ success: true, message: 'Doctor location tagged successfully!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'DB ERROR: ' + e.message });
    }
});

router.put('/chemist/:id/geo', async (req, res) => {
    try {
        const { lat1, lng1, geoAddress1, employeeId } = req.body;
        const chemist = await XlChemist.findOne({ where: { _id: req.params.id } });
        if (!chemist) return res.status(404).json({ error: 'Chemist not found' });
        
        if (!chemist.lat1) {
            chemist.lat1 = lat1;
            chemist.lng1 = lng1;
            chemist.geoAddress1 = geoAddress1;
        } else if (!chemist.lat2) {
            chemist.lat2 = lat1;
            chemist.lng2 = lng1;
            chemist.geoAddress2 = geoAddress1;
        } else {
            return res.status(400).json({ error: 'Chemist already has 2 locations tagged.' });
        }
        await chemist.save();
        
        await XlGeoFencing.create({
            employeeId: employeeId || 'SYSTEM',
            entityType: 'Chemist',
            entityId: req.params.id,
            latitude: lat1,
            longitude: lng1,
            geoAddress: geoAddress1,
            status: 'Submitted'
        });
        res.json({ success: true, message: 'Chemist location tagged successfully!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'DB ERROR: ' + e.message });
    }
});

router.put('/stockist/:id/geo', async (req, res) => {
    try {
        const { lat1, lng1, geoAddress1, employeeId } = req.body;
        const stockist = await XlStockist.findOne({ where: { _id: req.params.id } });
        if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
        
        if (!stockist.lat1) {
            stockist.lat1 = lat1;
            stockist.lng1 = lng1;
            stockist.geoAddress1 = geoAddress1;
        } else {
            return res.status(400).json({ error: 'Stockist already has a location tagged.' });
        }
        await stockist.save();
        
        await XlGeoFencing.create({
            employeeId: employeeId || 'SYSTEM',
            entityType: 'Stockist',
            entityId: req.params.id,
            latitude: lat1,
            longitude: lng1,
            geoAddress: geoAddress1,
            status: 'Submitted'
        });
        res.json({ success: true, message: 'Stockist location tagged successfully!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'DB ERROR: ' + e.message });
    }
});

router.post('/chemist', async (req, res) => {
    try {
        const data = { ...req.body };
        if (!data.businessName && data.name) data.businessName = data.name;
        if (!data.name && data.businessName) data.name = data.businessName;
        if (!data.mobile && data.mobileNumber) data.mobile = data.mobileNumber;
        if (!data.headquarter && data.hq) data.headquarter = data.hq;
        if (!data.workingArea && data.route) data.workingArea = data.route;
        if (!data.extraInformation && data.extraInfo) data.extraInformation = data.extraInfo;
        if (!data.userAllotted && data.employeeId) data.userAllotted = data.employeeId;
        if (!data.employeeId && data.userAllotted) data.employeeId = data.userAllotted;
        if (!data.status) data.status = 'Pending';
        if (!data.uid) {
            try {
                const max = await getMaxUID(XlChemist, 'CHM');
                data.uid = 'CHM' + (max + 1);
            } catch(e) {
                data.uid = 'CHM' + Date.now();
            }
        }

        const chemist = await XlChemist.create(data);

        if (chemist.lat1 && chemist.lng1) {
            await XlGeoFencing.create({
                employeeId: chemist.userAllotted || chemist.employeeId || 'SYSTEM',
                entityType: 'Chemist',
                entityId: chemist._id,
                latitude: chemist.lat1,
                longitude: chemist.lng1,
                geoAddress: chemist.geoAddress1 || '',
                status: 'Submitted'
            });
        }

        res.json({ success: true, message: 'Chemist created successfully!', data: chemist });
    } catch (e) {
        console.error('Chemist create error:', e);
        res.status(500).json({ error: 'Failed to create chemist: ' + e.message });
    }
});

router.post('/stockist', async (req, res) => {
    try {
        const data = { ...req.body };
        if (!data.businessName && data.name) data.businessName = data.name;
        if (!data.name && data.proprietorName) data.name = data.proprietorName;
        if (!data.proprietorName && data.name) data.proprietorName = data.name;
        if (!data.mobile && data.mobileNumber) data.mobile = data.mobileNumber;
        if (!data.headquarter && data.hq) data.headquarter = data.hq;
        if (!data.workingArea && data.route) data.workingArea = data.route;
        if (!data.gst && data.gstNumber) data.gst = data.gstNumber;
        if (!data.drugLicense && data.certification) data.drugLicense = data.certification;
        if (!data.drugExpiryDate && data.drugLicenseExpiry) data.drugExpiryDate = data.drugLicenseExpiry;
        if (!data.extraInformation && data.extraInfo) data.extraInformation = data.extraInfo;
        if (!data.userAllotted && data.employeeId) data.userAllotted = data.employeeId;
        if (!data.employeeId && data.userAllotted) data.employeeId = data.userAllotted;
        if (!data.status) data.status = 'Pending';
        if (!data.uid) {
            try {
                const max = await getMaxUID(XlStockist, 'STK');
                data.uid = 'STK' + (max + 1);
            } catch(e) {
                data.uid = 'STK' + Date.now();
            }
        }

        const stockist = await XlStockist.create(data);

        if (stockist.lat1 && stockist.lng1) {
            try {
                await XlGeoFencing.create({
                    employeeId: stockist.userAllotted || stockist.employeeId || 'SYSTEM',
                    entityType: 'Stockist',
                    entityId: stockist._id,
                    latitude: stockist.lat1,
                    longitude: stockist.lng1,
                    geoAddress: stockist.geoAddress1 || '',
                    status: 'Submitted'
                });
            } catch(e) {}
        }

        res.json({ success: true, message: 'Stockist created successfully!', data: stockist });
    } catch (e) {
        console.error('Stockist create error:', e);
        res.status(500).json({ error: 'Failed to create stockist: ' + e.message });
    }
});

// Get all states from database (created in state page / XlState)
router.get('/states', async (req, res) => {
    try {
        const states = await XlState.findAll({ order: [['stateName', 'ASC']] });
        res.json({
            success: true,
            states: states.map(s => s.stateName),
            data: states
        });
    } catch (e) {
        console.error('Fetch states error:', e);
        res.status(500).json({ success: false, error: 'Failed to fetch states' });
    }
});

// Get all cities/areas (supports subordinate HQs for managers)
router.get('/cities', async (req, res) => {
    try {
        let { state, hq, designation, division, employeeId } = req.query;
        const { sequelize } = require('../db');
        const { Op } = require('sequelize');

        // If employeeId is passed and designation/hq are missing, resolve from database
        if (employeeId && (!designation || !hq)) {
            const userRecord = await XlUser.findOne({
                where: { [Op.or]: [{ employeeId }, { uid: employeeId }, { email: employeeId }] }
            });
            if (userRecord) {
                designation = designation || userRecord.designation;
                hq = hq || userRecord.hq;
                division = division || userRecord.division;
            }
        }

        let hqList = [];
        if (hq) {
            const trimmed = hq.trim().toLowerCase();
            hqList.push(trimmed);
            hqList.push(trimmed.replace(/\s+/g, '-'));
            hqList.push(trimmed.replace(/-/g, ' '));
        }

        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, hq, division);
            subHQs.forEach(sub => {
                const subTrim = sub.trim().toLowerCase();
                hqList.push(subTrim);
                hqList.push(subTrim.replace(/\s+/g, '-'));
                hqList.push(subTrim.replace(/-/g, ' '));
            });
            hqList = [...new Set(hqList)];
        }

        let whereConditions = [];
        if (state) {
            whereConditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('state')), state.trim().toLowerCase()));
        }
        if (hqList.length > 0) {
            whereConditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('hq')), { [Op.in]: hqList }));
        }

        let where = {};
        if (whereConditions.length === 1) where = whereConditions[0];
        else if (whereConditions.length > 1) where = { [Op.and]: whereConditions };

        const cities = await XlCity.findAll({
            where,
            order: [['cityName', 'ASC']]
        });

        // Also fetch routes for these HQs to include markets / destination cities (like Palanpur)
        let routeWhere = {};
        let routeConditions = [];
        if (state) {
            routeConditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('state')), state.trim().toLowerCase()));
        }
        if (hqList.length > 0) {
            routeConditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('hq')), { [Op.in]: hqList }));
        }
        if (routeConditions.length === 1) routeWhere = routeConditions[0];
        else if (routeConditions.length > 1) routeWhere = { [Op.and]: routeConditions };

        const routes = await XlRoute.findAll({ where: routeWhere });
        const allCityNames = new Set(cities.map(c => c.cityName));
        routes.forEach(r => {
            if (r.fromCity) allCityNames.add(r.fromCity);
            if (r.toCity) allCityNames.add(r.toCity);
        });

        const sortedCityNames = Array.from(allCityNames).filter(Boolean).sort();
        res.json({
            success: true,
            cities: sortedCityNames,
            data: cities
        });
    } catch (e) {
        console.error('Fetch cities error:', e);
        res.status(500).json({ success: false, error: 'Failed to fetch cities' });
    }
});

// Check if City/Area exists case-insensitively
router.get('/city/check-duplicate', async (req, res) => {
    try {
        const { cityName } = req.query;
        const name = (cityName || '').trim();
        if (!name) {
            return res.json({ success: true, exists: false });
        }
        const { sequelize } = require('../db');
        const existing = await XlCity.findOne({
            where: sequelize.where(sequelize.fn('lower', sequelize.col('cityName')), name.toLowerCase())
        });
        return res.json({
            success: true,
            exists: !!existing,
            message: existing ? 'City/Area Exists' : ''
        });
    } catch (e) {
        console.error('Check duplicate error:', e);
        res.status(500).json({ success: false, error: 'Failed to check duplicate' });
    }
});

router.post('/city', async (req, res) => {
    try {
        const { cityName, state, hq, areaType, employeeId } = req.body;
        const cleanName = (cityName || '').trim();
        if (!cleanName) {
            return res.status(400).json({ success: false, error: 'City/Area Name is required' });
        }

        const { sequelize } = require('../db');
        // Check duplication whether entered in capital or small letter
        const existing = await XlCity.findOne({
            where: sequelize.where(sequelize.fn('lower', sequelize.col('cityName')), cleanName.toLowerCase())
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'City/Area Exists',
                message: 'City/Area Exists'
            });
        }

        let uid = req.body.uid;
        if (!uid) {
            try {
                const max = await getMaxUID(XlCity, 'CTY');
                uid = 'CTY' + (max + 1);
            } catch (err) {
                uid = 'CTY' + Date.now();
            }
        }

        const city = await XlCity.create({
            ...req.body,
            cityName: cleanName,
            uid,
            state: (state || '').trim(),
            hq: (hq || '').toUpperCase().trim(),
            areaType: areaType || 'City',
            employeeId: employeeId || req.body.userAllotted || '',
            employeeName: req.body.employeeName || '',
            status: 'Pending'
        });

        res.json({ success: true, message: 'City created successfully!', data: city });
    } catch (e) {
        console.error('Create city error:', e);
        res.status(500).json({ success: false, error: 'Failed to create city: ' + e.message });
    }
});

// Check if route exists case-insensitively
router.get('/route/check-duplicate', async (req, res) => {
    try {
        const { hq, fromCity, toCity } = req.query;
        if (!hq || !fromCity || !toCity) {
            return res.json({ success: true, exists: false });
        }
        const { sequelize } = require('../db');
        const existing = await XlRoute.findOne({
            where: {
                [Op.and]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('hq')), hq.trim().toLowerCase()),
                    sequelize.where(sequelize.fn('lower', sequelize.col('fromCity')), fromCity.trim().toLowerCase()),
                    sequelize.where(sequelize.fn('lower', sequelize.col('toCity')), toCity.trim().toLowerCase())
                ]
            }
        });
        return res.json({
            success: true,
            exists: !!existing,
            message: existing ? `Route from ${fromCity} to ${toCity} already exists for ${hq}!` : ''
        });
    } catch (e) {
        console.error('Check duplicate route error:', e);
        res.status(500).json({ success: false, error: 'Failed to check route duplicate' });
    }
});

// Auto-calculate road distance between markets
router.get('/route/distance', async (req, res) => {
    try {
        const { fromCity, toCity, state } = req.query;
        if (!fromCity || !toCity) {
            return res.status(400).json({ success: false, message: 'fromCity and toCity required' });
        }
        
        // 1. Check if an existing route has this distance already in DB
        const { sequelize } = require('../db');
        const knownRoute = await XlRoute.findOne({
            where: {
                [Op.or]: [
                    {
                        [Op.and]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col('fromCity')), fromCity.trim().toLowerCase()),
                            sequelize.where(sequelize.fn('lower', sequelize.col('toCity')), toCity.trim().toLowerCase())
                        ]
                    },
                    {
                        [Op.and]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col('fromCity')), toCity.trim().toLowerCase()),
                            sequelize.where(sequelize.fn('lower', sequelize.col('toCity')), fromCity.trim().toLowerCase())
                        ]
                    }
                ],
                distance: { [Op.gt]: 0 }
            }
        });
        
        if (knownRoute && knownRoute.distance > 0) {
            return res.json({ success: true, distance: knownRoute.distance, source: 'database' });
        }

        // 2. City coordinates table for instant high-speed accurate calculation across key regions
        const cityCoords = {
            'ahmedabad': [23.0225, 72.5714],
            'gandhinagar': [23.2156, 72.6369],
            'vadodara': [22.3072, 73.1812],
            'anand': [22.5645, 72.9289],
            'nadiad': [22.6916, 72.8634],
            'surat': [21.1702, 72.8311],
            'bharuch': [21.7051, 72.9959],
            'ankleshwar': [21.6264, 73.0152],
            'navsari': [20.9467, 72.9520],
            'valsad': [20.5992, 72.9342],
            'vapi': [20.3893, 72.9106],
            'rajkot': [22.3039, 70.8022],
            'morbi': [22.8173, 70.8370],
            'jamnagar': [22.4707, 70.0577],
            'bhavnagar': [21.7645, 72.1519],
            'junagadh': [21.5222, 70.4579],
            'porbandar': [21.6417, 69.6293],
            'mehsana': [23.5880, 72.3693],
            'palanpur': [24.1724, 72.4346],
            'himatnagar': [23.5977, 72.9698],
            'bhuj': [23.2420, 69.6669],
            'gandhidham': [23.0753, 70.1337],
            'bhubaneswar': [20.2961, 85.8245],
            'cuttack': [20.4625, 85.8830],
            'puri': [19.8135, 85.8312],
            'berhampur': [19.3149, 84.7941],
            'rourkela': [22.2604, 84.8536],
            'sambalpur': [21.4669, 83.9812],
            'balasore': [21.4934, 86.9135],
            'mumbai': [19.0760, 72.8777],
            'thane': [19.2183, 72.9781],
            'navi mumbai': [19.0330, 73.0297],
            'pune': [18.5204, 73.8567],
            'nashik': [19.9975, 73.7898],
            'nagpur': [21.1458, 79.0882],
            'aurangabad': [19.8762, 75.3433],
            'chhatrapati sambhajinagar': [19.8762, 75.3433],
            'kolhapur': [16.7050, 74.2433],
            'solapur': [17.6599, 75.9064],
            'delhi': [28.6139, 77.2090],
            'noida': [28.5355, 77.3910],
            'gurugram': [28.4595, 77.0266],
            'faridabad': [28.4089, 77.3178],
            'jaipur': [26.9124, 75.7873],
            'jodhpur': [26.2389, 73.0243],
            'udaipur': [24.5854, 73.7125],
            'kota': [25.2138, 75.8648],
            'bhopal': [23.2599, 77.4126],
            'indore': [22.7196, 75.8577],
            'gwalior': [26.2183, 78.1828],
            'jabalpur': [23.1815, 79.9864],
            'raipur': [21.2514, 81.6296],
            'bilaspur': [22.0797, 82.1409],
            'durg': [21.1904, 81.2849],
            'bhilai': [21.1938, 81.3509],
            'hyderabad': [17.3850, 78.4867],
            'secunderabad': [17.4399, 78.4983],
            'bengaluru': [12.9716, 77.5946],
            'bangalore': [12.9716, 77.5946],
            'chennai': [13.0827, 80.2707],
            'kolkata': [22.5726, 88.3639],
            'patna': [25.5941, 85.1376],
            'lucknow': [26.8467, 80.9462],
            'kanpur': [26.4499, 80.3319],
            'varanasi': [25.3176, 82.9739]
        };

        const cleanFrom = fromCity.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        const cleanTo = toCity.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

        // 2. Curated standard road distances for common pharma hubs
        const curatedDistances = {
            'vadodara_bharuch': 76.3,
            'bharuch_vadodara': 76.3,
            'vadodara_ankleshwar': 85.0,
            'ankleshwar_vadodara': 85.0,
            'vadodara_anand': 45.0,
            'anand_vadodara': 45.0,
            'vadodara_nadiad': 58.0,
            'nadiad_vadodara': 58.0,
            'vadodara_surat': 152.0,
            'surat_vadodara': 152.0,
            'vadodara_ahmedabad': 111.0,
            'ahmedabad_vadodara': 111.0,
            'ahmedabad_gandhinagar': 27.0,
            'gandhinagar_ahmedabad': 27.0,
            'ahmedabad_anand': 76.0,
            'anand_ahmedabad': 76.0,
            'ahmedabad_nadiad': 60.0,
            'nadiad_ahmedabad': 60.0,
            'surat_navsari': 38.0,
            'navsari_surat': 38.0,
            'surat_valsad': 92.0,
            'valsad_surat': 92.0,
            'surat_vapi': 115.0,
            'vapi_surat': 115.0,
            'surat_bharuch': 74.0,
            'bharuch_surat': 74.0,
            'surat_ankleshwar': 66.0,
            'ankleshwar_surat': 66.0,
            'bhubaneswar_cuttack': 28.0,
            'cuttack_bhubaneswar': 28.0,
            'bhubaneswar_puri': 58.0,
            'puri_bhubaneswar': 58.0,
            'mumbai_thane': 24.0,
            'thane_mumbai': 24.0,
            'mumbai_pune': 150.0,
            'pune_mumbai': 150.0
        };

        const pair1 = `${cleanFrom}_${cleanTo}`;
        const pair2 = `${cleanTo}_${cleanFrom}`;
        if (curatedDistances[pair1]) {
            return res.json({ success: true, distance: curatedDistances[pair1], source: 'curated_benchmark' });
        }
        if (curatedDistances[pair2]) {
            return res.json({ success: true, distance: curatedDistances[pair2], source: 'curated_benchmark' });
        }

        const findCoord = (name) => {
            if (cityCoords[name]) return cityCoords[name];
            for (const key of Object.keys(cityCoords)) {
                if (name.includes(key) || key.includes(name)) return cityCoords[key];
            }
            return null;
        };

        const c1 = findCoord(cleanFrom);
        const c2 = findCoord(cleanTo);

        if (c1 && c2) {
            try {
                const axios = require('axios');
                const osrm = await axios.get(`https://router.project-osrm.org/route/v1/driving/${c1[1]},${c1[0]};${c2[1]},${c2[0]}?overview=false`, { timeout: 3500 });
                if (osrm.data?.routes?.length) {
                    const distMeters = osrm.data.routes[0].distance;
                    const distKm = Math.round((distMeters / 1000) * 10) / 10;
                    return res.json({ success: true, distance: distKm, source: 'osrm_driving' });
                }
            } catch (osrmErr) {
                // Fallback to Haversine
            }

            const R = 6371; // km
            const dLat = (c2[0] - c1[0]) * Math.PI / 180;
            const dLon = (c2[1] - c1[1]) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const straightDistance = R * c;
            const roadKm = Math.round(straightDistance * 1.12 * 10) / 10;
            return res.json({ success: true, distance: Math.max(5, roadKm), source: 'calculated' });
        }

        // 3. Fallback: query OSRM or OpenStreetMap nominatim with a short timeout
        try {
            const axios = require('axios');
            const geo1 = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromCity + (state ? ' ' + state : ''))}&countrycodes=in&limit=1`, { timeout: 3000, headers: { 'User-Agent': 'EmyrisCRM/1.0' } });
            const geo2 = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toCity + (state ? ' ' + state : ''))}&countrycodes=in&limit=1`, { timeout: 3000, headers: { 'User-Agent': 'EmyrisCRM/1.0' } });
            
            if (geo1.data?.length && geo2.data?.length) {
                const lat1 = parseFloat(geo1.data[0].lat);
                const lon1 = parseFloat(geo1.data[0].lon);
                const lat2 = parseFloat(geo2.data[0].lat);
                const lon2 = parseFloat(geo2.data[0].lon);

                const osrm = await axios.get(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`, { timeout: 3000 });
                if (osrm.data?.routes?.length) {
                    const distMeters = osrm.data.routes[0].distance;
                    const distKm = Math.round((distMeters / 1000) * 10) / 10;
                    return res.json({ success: true, distance: distKm, source: 'google_map_osrm' });
                }

                const R = 6371;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const roadKm = Math.round(R * c * 1.12 * 10) / 10;
                return res.json({ success: true, distance: Math.max(5, roadKm), source: 'calculated_nominatim' });
            }
        } catch (apiErr) {
            // Silently fallback if network request times out
        }

        return res.json({ success: true, distance: 40, source: 'default_estimate' });
    } catch (e) {
        console.error('Distance calc error:', e);
        return res.json({ success: true, distance: 40, source: 'fallback' });
    }
});

router.post('/route', async (req, res) => {
    try {
        let { state, hq, fromCity, toCity, areaType, distance, employeeId, employeeName } = req.body;
        
        state = (state || '').trim();
        hq = (hq || '').toUpperCase().trim();
        fromCity = (fromCity || '').trim();
        toCity = (toCity || '').trim();
        areaType = (areaType || '').trim();

        if (!state || !hq || !fromCity || !toCity || !areaType) {
            return res.status(400).json({ success: false, message: 'State, HQ, From City, To City, and Area Type are required.' });
        }

        // Distance rules:
        // Local: 0 KM
        // Out-Station: 0 KM (Actual ticket fare reimbursed)
        // Ex-Station: Captured / edited KM
        if (areaType === 'Local' || areaType === 'Out-Station') {
            distance = 0;
        } else {
            distance = parseFloat(distance) || 0;
        }

        // Case-insensitive duplicate check for fromCity -> toCity under the same HQ
        const { sequelize } = require('../db');
        const existing = await XlRoute.findOne({
            where: {
                [Op.and]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('hq')), hq.toLowerCase()),
                    sequelize.where(sequelize.fn('lower', sequelize.col('fromCity')), fromCity.toLowerCase()),
                    sequelize.where(sequelize.fn('lower', sequelize.col('toCity')), toCity.toLowerCase())
                ]
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Route from "${fromCity}" to "${toCity}" already exists for ${hq}!`
            });
        }

        let uid = req.body.uid;
        if (!uid) {
            try {
                const max = await getMaxUID(XlRoute, 'RTE');
                uid = 'RTE' + (max + 1);
            } catch (err) {
                uid = 'RTE' + Date.now();
            }
        }

        const route = await XlRoute.create({
            state,
            hq,
            fromCity,
            toCity,
            areaType,
            distance,
            uid,
            employeeId: employeeId || req.body.userAllotted || '',
            status: 'Pending'
        });

        res.json({ success: true, message: 'Route submitted for approval successfully!', data: route });
    } catch (e) {
        console.error('Create route error:', e);
        res.status(500).json({ success: false, error: 'Failed to create route: ' + e.message, message: e.message });
    }
});

// Fetch all doctors for a user (for DCR entity selection)

// Reports Route for Doctors List
router.get('/reports/doctors', async (req, res) => {
    try {
        const { employeeId, hq } = req.query;
        let where = {};
        if (hq && hq.trim() !== '' && hq !== 'All') {
            where.headquarter = sequelize.where(
                sequelize.fn('lower', sequelize.col('headquarter')),
                hq.trim().toLowerCase()
            );
        } else if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } });
            if (user && user.hq) {
                where.headquarter = sequelize.where(
                    sequelize.fn('lower', sequelize.col('headquarter')),
                    user.hq.trim().toLowerCase()
                );
            } else {
                where.employeeId = employeeId;
            }
        }
        const doctors = await XlDoctor.findAll({ where, order: [['name', 'ASC']] });
        res.json({ success: true, data: doctors });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch doctors for reports' });
    }
});


// Reports Route for Chemists List
router.get('/reports/chemists', async (req, res) => {
    try {
        const { employeeId, hq } = req.query;
        let where = {};
        if (hq) {
            where.headquarter = hq;
        } else if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } });
            if (user && user.hq) {
                where.headquarter = user.hq;
            } else {
                where.employeeId = employeeId;
            }
        }
        const records = await XlChemist.findAll({ where, order: [['businessName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch chemists for reports' });
    }
});

// Reports Route for Stockists List
router.get('/reports/stockists', async (req, res) => {
    try {
        const { employeeId, hq } = req.query;
        let where = {};
        if (hq) {
            where.headquarter = hq;
        } else if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } });
            if (user && user.hq) {
                where.headquarter = user.hq;
            } else {
                where.employeeId = employeeId;
            }
        }
        const records = await XlStockist.findAll({ where, order: [['businessName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch stockists for reports' });
    }
});

// Reports Route for Products List
router.get('/products', async (req, res) => {
    try {
        const records = await XlProduct.findAll({ order: [['productName', 'ASC']] });
        res.json({ success: true, products: records, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products', details: e.message });
    }
});

router.get('/reports/products', async (req, res) => {
    try {
        const records = await XlProduct.findAll({ order: [['productName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products for reports', details: e.message });
    }
});

// Reports Route for Locations List

// Reports Route for Gifts List
router.get('/reports/gifts', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) where.employeeId = employeeId;
        const records = await XlGift.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch gifts for reports' });
    }
});

// Reports Route for Routes List
router.get('/reports/routes', async (req, res) => {
    try {
        const { employeeId, hq } = req.query;
        let where = {};
        if (hq) {
            where.headquarter = hq;
        } else if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } });
            if (user && user.hq) {
                where.hq = user.hq;
            } else {
                where.employeeId = employeeId;
            }
        }
        const records = await XlRoute.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch routes for reports' });
    }
});

router.get('/reports/locations', async (req, res) => {
    try {
        const { employeeId } = req.query;
        const doctors = await XlDoctor.findAll({ attributes: ['headquarter', 'workingArea', 'employeeId'] });
        const chemists = await XlChemist.findAll({ attributes: ['headquarter', 'workingArea', 'employeeId'] });
        const stockists = await XlStockist.findAll({ attributes: ['headquarter', 'workingArea', 'employeeId'] });
        
        res.json({ 
            success: true, 
            data: { doctors, chemists, stockists }
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch locations data for reports' });
    }
});

// Reports Route for Call Plan Lists (Approved Only)
router.get('/reports/call-plans', async (req, res) => {
    try {
        const { employeeId, hq, month, year, search } = req.query;
        const { Op } = require('sequelize');

        // Requirement: Approved only plans
        let where = { status: 'Approved' };

        // Month & Year filtering
        if (month && year) {
            let mNum;
            const monthMap = {
                'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
                'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
                'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
                'nov': 11, 'november': 11, 'dec': 12, 'december': 12
            };
            const cleanM = String(month).trim().toLowerCase();
            if (monthMap[cleanM]) {
                mNum = String(monthMap[cleanM]).padStart(2, '0');
            } else if (!isNaN(parseInt(month, 10))) {
                mNum = String(parseInt(month, 10)).padStart(2, '0');
            }

            if (mNum) {
                const y = parseInt(year, 10);
                const lastDay = new Date(y, parseInt(mNum, 10), 0).getDate();
                const startDate = `${y}-${mNum}-01`;
                const endDate = `${y}-${mNum}-${String(lastDay).padStart(2, '0')}`;
                where.date = { [Op.between]: [startDate, endDate] };
            }
        } else if (year) {
            where.date = { [Op.like]: `${year}-%` };
        }

        // Employee & HQ filtering
        let targetEmployeeIds = [];
        if (employeeId && employeeId !== 'ALL') {
            targetEmployeeIds = [employeeId];
        } else if (hq && hq !== 'ALL') {
            const hqUsers = await XlUser.findAll({
                where: sequelize.where(sequelize.fn('lower', sequelize.col('hq')), hq.trim().toLowerCase()),
                attributes: ['employeeId', 'uid', '_id']
            });
            targetEmployeeIds = hqUsers.map(u => u.employeeId || u.uid || u._id).filter(Boolean);
            if (targetEmployeeIds.length === 0) {
                return res.json({ success: true, count: 0, totalCalls: 0, data: [] });
            }
        }

        if (targetEmployeeIds.length > 0) {
            where.employeeId = { [Op.in]: targetEmployeeIds };
        }

        const plans = await XlCallPlan.findAll({
            where,
            order: [['date', 'ASC'], ['employeeId', 'ASC']]
        });

        if (plans.length === 0) {
            return res.json({ success: true, count: 0, totalCalls: 0, data: [] });
        }

        // Collect all employee IDs & Doctor IDs for batch lookup
        const empIdSet = new Set();
        const docIdSet = new Set();

        plans.forEach(p => {
            if (p.employeeId) empIdSet.add(p.employeeId);
            let docItems = [];
            try { docItems = JSON.parse(p.doctors || '[]'); } catch(e){}
            if (!Array.isArray(docItems)) docItems = Object.values(docItems || {});
            docItems.forEach(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id);
                if (id && !String(id).startsWith('slot_open_')) docIdSet.add(id);
            });
        });

        // Batch fetch users
        const users = await XlUser.findAll({
            where: {
                [Op.or]: [
                    { employeeId: Array.from(empIdSet) },
                    { uid: Array.from(empIdSet) },
                    { _id: Array.from(empIdSet) }
                ]
            },
            attributes: ['_id', 'uid', 'employeeId', 'firstName', 'middleName', 'lastName', 'hq', 'designation']
        });
        const userMap = {};
        users.forEach(u => {
            const name = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.employeeId;
            if (u.employeeId) userMap[u.employeeId] = { ...u.toJSON(), name };
            if (u.uid) userMap[u.uid] = { ...u.toJSON(), name };
            if (u._id) userMap[u._id] = { ...u.toJSON(), name };
        });

        // Batch fetch doctors
        const doctors = await XlDoctor.findAll({
            where: {
                [Op.or]: [
                    { _id: Array.from(docIdSet) },
                    { uid: Array.from(docIdSet) }
                ]
            },
            attributes: ['_id', 'uid', 'name', 'category', 'hospital', 'degree', 'specialization', 'workingArea', 'mobile', 'headquarter']
        });
        const docMap = {};
        doctors.forEach(d => {
            docMap[d._id] = d;
            if (d.uid) docMap[d.uid] = d;
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let totalCallsCount = 0;

        const formatted = plans.map(p => {
            const user = userMap[p.employeeId] || {};
            let docItems = [];
            try { docItems = JSON.parse(p.doctors || '[]'); } catch(e){}
            if (!Array.isArray(docItems)) docItems = Object.values(docItems || {});

            const planDateObj = new Date(p.date + 'T00:00:00');
            const dayOfWeek = isNaN(planDateObj.getTime()) ? '' : dayNames[planDateObj.getDay()];

            const enrichedDoctors = docItems.map((item, idx) => {
                const id = typeof item === 'string' ? item : (item.id || item._id);
                const doc = docMap[id];
                const rawName = typeof item === 'object' ? (item.name || item.doctorName || '') : '';
                const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));

                return {
                    srNo: idx + 1,
                    _id: id,
                    name: (doc ? doc.name : (!isNameAnId ? rawName : null)) || (String(id).startsWith('slot_open_') ? '(Open Slot)' : `Doctor (${id})`),
                    category: doc?.category || (typeof item === 'object' ? item.category : 'General') || 'General',
                    hospital: doc?.hospital || (typeof item === 'object' ? item.hospital : '-') || '-',
                    workingArea: doc?.workingArea || (typeof item === 'object' ? item.workingArea : '-') || '-',
                    degree: doc?.degree || '',
                    specialization: doc?.specialization || '',
                    mobile: doc?.mobile || ''
                };
            });

            totalCallsCount += enrichedDoctors.length;
            const uniqueWorkingAreas = [...new Set(enrichedDoctors.map(d => d.workingArea).filter(w => w && w !== '-'))];

            return {
                _id: p._id,
                date: p.date,
                dayOfWeek,
                employeeId: p.employeeId,
                userName: user.name || p.employeeId,
                headquarter: user.hq || '-',
                designation: user.designation || 'MR',
                status: p.status || 'Approved',
                adminRemarks: p.adminRemarks || '',
                approvedBy: p.approvedBy || 'Admin',
                doctorCount: enrichedDoctors.length,
                workingAreas: uniqueWorkingAreas,
                doctors: enrichedDoctors
            };
        });

        // Optional post-search
        let results = formatted;
        if (search && search.trim()) {
            const s = search.trim().toLowerCase();
            results = results.filter(p => 
                p.userName.toLowerCase().includes(s) ||
                p.headquarter.toLowerCase().includes(s) ||
                p.date.includes(s) ||
                p.workingAreas.some(w => w.toLowerCase().includes(s)) ||
                p.doctors.some(d => d.name.toLowerCase().includes(s) || d.hospital.toLowerCase().includes(s))
            );
        }

        res.json({
            success: true,
            count: results.length,
            totalCalls: totalCallsCount,
            data: results
        });
    } catch (e) {
        console.error('Call plans report error:', e);
        res.status(500).json({ error: 'Failed to fetch approved call plans', details: e.message });
    }
});

router.get('/doctors', async (req, res) => {
    try {
        const { designation, hq, division } = req.query;
        let hqList = [];
        if (hq) hqList.push(hq.trim().toLowerCase());
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq, division);
            hqList = [...new Set([...hqList, ...subHQs.map(h => h.trim().toLowerCase())])];
        }

        let where = {};
        if (hqList.length > 0) {
            const { sequelize } = require('../db');
            where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), { [Op.in]: hqList });
        } else if (req.query.hq) {
            // fallback
            const { sequelize } = require('../db');
            where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), req.query.hq.trim().toLowerCase());
        }

        const doctors = await XlDoctor.findAll({ where, attributes: ['_id', 'name', 'degree', 'specialization', 'hospital', 'headquarter', 'workingArea', 'category', 'userAllotted', 'lat1', 'lng1', 'lat2', 'lng2'], order: [['name', 'ASC']] });
        res.json({ success: true, data: doctors });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// Fetch all chemists
router.get('/chemists', async (req, res) => {
    try {
        const { designation, hq, division } = req.query;
        let hqList = [];
        if (hq) hqList.push(hq.trim().toLowerCase());
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq, division);
            hqList = [...new Set([...hqList, ...subHQs.map(h => h.trim().toLowerCase())])];
        }

        let where = {};
        if (hqList.length > 0) {
            const { sequelize } = require('../db');
            where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), { [Op.in]: hqList });
        } else if (req.query.hq) {
            const { sequelize } = require('../db');
            where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), req.query.hq.trim().toLowerCase());
        }

        const chemists = await XlChemist.findAll({ where, attributes: ['_id', 'businessName', 'proprietorName', 'headquarter', 'workingArea', 'userAllotted'], order: [['businessName', 'ASC']] });
        res.json({ success: true, data: chemists });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch chemists' });
    }
});

router.get('/stockists', async (req, res) => {
    try {
        const { designation, hq, division } = req.query;
        let hqList = [];
        if (hq) hqList.push(hq.trim().toLowerCase());
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq, division);
            hqList = [...new Set([...hqList, ...subHQs.map(h => h.trim().toLowerCase())])];
        }

        let where = {};
        if (hqList.length > 0) {
            const { sequelize } = require('../db');
            where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), { [Op.in]: hqList });
        } else if (req.query.hq) {
            const { sequelize } = require('../db');
            where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), req.query.hq.trim().toLowerCase());
        }

        const stockists = await XlStockist.findAll({ where, attributes: ['_id', 'businessName', 'name', 'headquarter', 'workingArea', 'userAllotted'], order: [['businessName', 'ASC']] });
        res.json({ success: true, data: stockists });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch stockists', details: e.message });
    }
});

// ─── PHASE 2: TOUR PROGRAM ──────────────────────────────────────────────────

// Save/Update draft TP for the month
router.post('/tour-program', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { XlUser, XlHoliday, XlTourProgram, XlNotification, generateId, sequelize } = require('../db');
        
        // Auto-migrate any missing tour program columns safely
        try {
            if (sequelize.getDialect() === 'postgres') {
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN IF NOT EXISTS "approvedBy" VARCHAR(255);');
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN IF NOT EXISTS "adminRemarks" TEXT;');
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP WITH TIME ZONE;');
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP WITH TIME ZONE;');
            } else {
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN approvedBy VARCHAR(255);').catch(() => {});
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN adminRemarks TEXT;').catch(() => {});
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN submittedAt DATETIME;').catch(() => {});
                await sequelize.query('ALTER TABLE xl_tour_programs ADD COLUMN approvedAt DATETIME;').catch(() => {});
            }
        } catch (mErr) {}

        const { employeeId, employeeName, hq, year, entries, resubmitRemark } = req.body;
        let { month } = req.body;
        if (!employeeId || !month || !year) return res.status(400).json({ error: 'Missing required fields' });
        
        month = month.toLowerCase(); // Enforce lowercase month for DB consistency

        // --- HOLIDAY CHECK ---
        const u = await XlUser.findOne({ where: { employeeId } });
        if (u && u.state && entries && entries.length > 0) {
            const holidays = await XlHoliday.findAll({
                where: {
                    [Op.or]: [
                        { state: u.state }, { state: null }, { state: 'All' }, { state: 'N/A' }, { state: '' }
                    ]
                }
            });
            const holidayDates = new Set(holidays.map(h => h.date));
            for (const entry of entries) {
                if (holidayDates.has(entry.date) && entry.type !== 'Holiday' && entry.activityType !== 'Holiday' && entry.type !== 'SUNDAY') {
                    return res.status(403).json({ error: `Cannot plan a working route on a Holiday (${entry.date})` });
                }
            }
        }
        // ---------------------

        // Upsert: one TP per employee per month/year
        const userForId = await XlUser.findOne({ where: { employeeId } }) || await XlUser.findOne({ where: { email: employeeId } }) || await XlUser.findOne({ where: { uid: employeeId } });
        let idArray3 = [employeeId];
        if (userForId) {
            if (userForId.employeeId) idArray3.push(userForId.employeeId);
            if (userForId.email) idArray3.push(userForId.email);
            if (userForId.uid) idArray3.push(userForId.uid);
        }
        let tp = await XlTourProgram.findOne({ where: { employeeId: { [Op.in]: idArray3 }, month, year } });

        if (tp) {
            if ((tp.status === 'Submitted' || tp.status === 'Approved') && resubmitRemark) {
                const u = await XlUser.findOne({ where: { employeeId } });
                if (u && u.reportingManager) {
                    try {
                        const managers = await findReportingManagers(u.reportingManager);
                        for (const m of managers) {
                            if (m.employeeId) {
                                await XlNotification.create({
                                    _id: generateId(),
                                    employeeId: m.employeeId,
                                    title: 'Tour Program Resubmitted',
                                    message: `${employeeName} modified their ${month} ${year} Tour Program. Remark: ${resubmitRemark}`
                                }).catch(() => {});
                            }
                        }
                    } catch(e) {}
                }
            }
            const isAdminSender = !!req.body.fromAdmin || !!(resubmitRemark && resubmitRemark.toLowerCase().includes('admin'));
            const finalStatus = isAdminSender ? 'Approved' : (tp.status || 'Draft');
            const approvedFields = isAdminSender ? { approvedBy: 'Admin', approvedAt: new Date() } : {};
            const processedEntries = (entries || []).map(e => isAdminSender ? { ...e, status: 'Approved' } : e);

            await XlTourProgram.update({ 
                entries: JSON.stringify(processedEntries), 
                employeeName, 
                hq, 
                status: finalStatus,
                ...approvedFields
            }, { where: { _id: tp._id } });
            tp = await XlTourProgram.findOne({ where: { _id: tp._id } });
        } else {
            const isAdminSender = !!req.body.fromAdmin || !!(resubmitRemark && resubmitRemark.toLowerCase().includes('admin'));
            const finalStatus = isAdminSender ? 'Approved' : 'Draft';
            const approvedFields = isAdminSender ? { approvedBy: 'Admin', approvedAt: new Date() } : {};
            const processedEntries = (entries || []).map(e => isAdminSender ? { ...e, status: 'Approved' } : e);

            tp = await XlTourProgram.create({
                _id: generateId(),
                employeeId, employeeName, hq, month, year,
                entries: JSON.stringify(processedEntries),
                status: finalStatus,
                ...approvedFields
            });
        }
        res.json({ success: true, message: 'Tour Program saved!', data: tp });
    } catch (e) {
        console.error('TP save error:', e);
        res.status(500).json({ error: 'Failed to save Tour Program: ' + e.message });
    }
});

// Submit TP for approval
router.put('/tour-program/:id/submit', async (req, res) => {
    try {
        const tp = await XlTourProgram.findOne({ where: { _id: req.params.id } });
        if (!tp) return res.status(404).json({ error: 'Not found' });

        await XlTourProgram.update({ status: 'Submitted', submittedAt: new Date() }, { where: { _id: req.params.id } });

        // Non-blocking notifications
        try {
            const user = await XlUser.findOne({ where: { employeeId: tp.employeeId } });
            if (user && user.reportingManager) {
                const managers = await findReportingManagers(user.reportingManager);
                for (const m of managers) {
                    if (m.employeeId) {
                        await XlNotification.create({
                            _id: generateId(),
                            employeeId: m.employeeId,
                            title: 'Tour Program Submitted',
                            message: `${tp.employeeName || 'A user'} has submitted their Tour Program for ${tp.month} ${tp.year} for approval.`
                        }).catch(() => {});
                    }
                }
            }
            
            // Also notify global admin
            await XlNotification.create({
                _id: generateId(),
                employeeId: 'ADMIN',
                title: 'Tour Program Submitted',
                message: `${tp.employeeName || 'A user'} has submitted their Tour Program for ${tp.month} ${tp.year} for approval.`
            }).catch(() => {});
            
            // Notify the submitter
            if (tp.employeeId) {
                await XlNotification.create({
                    _id: generateId(),
                    employeeId: tp.employeeId,
                    title: 'Tour Program Submitted',
                    message: `You have successfully submitted your Tour Program for ${tp.month} ${tp.year} for approval.`
                }).catch(() => {});
            }
        } catch (notifErr) {
            console.error('Notification warning in TP submit:', notifErr);
        }

        res.json({ success: true, message: 'Tour Program submitted for approval!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to submit Tour Program' });
    }
});
// Revert TP from Submitted back to Draft (if not approved)
router.put('/tour-program/:id/unsubmit', async (req, res) => {
    try {
        const { XlTourProgram } = require('../db');
        const tp = await XlTourProgram.findOne({ where: { _id: req.params.id } });
        if (!tp) return res.status(404).json({ error: 'Tour Program not found' });
        if (tp.status === 'Approved') {
            return res.status(400).json({ error: 'Approved Tour Program cannot be reverted to Draft' });
        }
        await XlTourProgram.update({ status: 'Draft', submittedAt: null }, { where: { _id: req.params.id } });
        res.json({ success: true, message: 'Tour Program reverted to Draft' });
    } catch (e) {
        console.error('Error reverting TP:', e);
        res.status(500).json({ error: 'Failed to revert Tour Program' });
    }
});


// Check Tour Program submission reminder for coming month (triggers by 25th of every month)
router.get('/tour-program/submission-reminder', async (req, res) => {
    try {
        const { employeeId, preview } = req.query;
        const { XlTourProgram, XlUser } = require('../db');
        const { Op } = require('sequelize');

        const now = new Date();
        const currentDay = now.getDate();
        const isAfter25th = currentDay >= 25;

        // Calculate coming month comparing current month
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const comingDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const comingMonthName = monthNames[comingDate.getMonth()];
        const comingMonthShort = comingMonthName.slice(0, 3);
        const comingYear = comingDate.getFullYear().toString();
        const comingMonthStr = `${comingMonthName} ${comingYear}`;

        // Exact message format: "Submit your Tour Plan for Coming Month- xxxxx"
        const reminderMessage = `Submit your Tour Plan for Coming Month- ${comingMonthStr}`;

        let isSubmitted = false;
        let tpRecord = null;

        if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } }) || 
                         await XlUser.findOne({ where: { email: employeeId } }) || 
                         await XlUser.findOne({ where: { uid: employeeId } });
            
            const idArray = [employeeId];
            if (user) {
                if (user.employeeId) idArray.push(user.employeeId);
                if (user.email) idArray.push(user.email);
                if (user.uid) idArray.push(user.uid);
            }

            const monthVariants = Array.from(new Set([
                comingMonthName,
                comingMonthName.toLowerCase(),
                comingMonthShort,
                comingMonthShort.toLowerCase(),
                `${comingMonthShort.toLowerCase()} ${comingYear}`,
                `${comingMonthName.toLowerCase()} ${comingYear}`,
                String(comingDate.getMonth() + 1),
                String(comingDate.getMonth() + 1).padStart(2, '0')
            ]));

            const tps = await XlTourProgram.findAll({
                where: {
                    employeeId: { [Op.in]: idArray },
                    month: { [Op.in]: monthVariants },
                    year: comingYear,
                    status: { [Op.in]: ['Submitted', 'Approved'] }
                }
            });

            if (tps && tps.length > 0) {
                isSubmitted = true;
                tpRecord = tps[0];
            }
        }

        // Message floats for all employees until they submit TP for the coming month
        const shouldShow = !isSubmitted;

        res.json({
            success: true,
            shouldShow,
            isAfter25th,
            currentDay,
            isSubmitted,
            comingMonth: comingMonthName,
            comingYear,
            comingMonthStr,
            reminderMessage,
            targetUrl: '/extras/tour-program',
            tpStatus: tpRecord ? tpRecord.status : (isSubmitted ? 'Submitted' : 'Pending')
        });
    } catch (e) {
        console.error('Submission reminder error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// Get my TP for a specific month/year
router.get('/tour-program/my', async (req, res) => {
    try {
        let { email, month, year } = req.query;
        if (!email || !month || !year) return res.status(400).json({ error: 'Missing params' });
        month = month.toLowerCase();
        
        const { Op } = require('sequelize');
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArray = [email];
        if (user) {
            if (user.employeeId) idArray.push(user.employeeId);
            if (user.email) idArray.push(user.email);
            if (user.uid) idArray.push(user.uid);
        }
        
          const rawMonth = (req.query.month || '').trim();
        const cleanMonth = rawMonth.toLowerCase();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        
        let extraVariants = [];
        const mNum = parseInt(rawMonth, 10);
        if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
            const longName = monthNames[mNum - 1];
            const shortName = monthShorts[mNum - 1];
            extraVariants = [
                longName,
                shortName,
                shortName.toUpperCase(),
                shortName.charAt(0).toUpperCase() + shortName.slice(1),
                longName.charAt(0).toUpperCase() + longName.slice(1),
                String(mNum),
                String(mNum).padStart(2, '0')
            ];
        } else {
            const idxShort = monthShorts.indexOf(cleanMonth.slice(0, 3));
            if (idxShort !== -1) {
                const longName = monthNames[idxShort];
                const shortName = monthShorts[idxShort];
                extraVariants = [
                    String(idxShort + 1),
                    String(idxShort + 1).padStart(2, '0'),
                    shortName,
                    shortName.toUpperCase(),
                    shortName.charAt(0).toUpperCase() + shortName.slice(1),
                    longName,
                    longName.charAt(0).toUpperCase() + longName.slice(1)
                ];
            }
        }

        const monthVariants = Array.from(new Set([
            rawMonth,
            cleanMonth,
            cleanMonth.charAt(0).toUpperCase() + cleanMonth.slice(1),
            rawMonth.slice(0, 3),
            rawMonth.slice(0, 3).toLowerCase(),
            rawMonth.slice(0, 3).charAt(0).toUpperCase() + rawMonth.slice(0, 3).toLowerCase().slice(1),
            ...extraVariants
        ])).filter(Boolean);

        const tps = await XlTourProgram.findAll({ 
            where: { 
                employeeId: { [Op.in]: idArray }, 
                month: { [Op.in]: monthVariants }, 
                year 
            } 
        });
          let tp = null;
          if (tps.length > 0) {
              // Prefer Approved/Submitted over Draft, and longer entries over shorter ones
              tps.sort((a, b) => {
                  if (a.status === 'Approved' && b.status !== 'Approved') return -1;
                  if (b.status === 'Approved' && a.status !== 'Approved') return 1;
                  const aLen = a.entries ? a.entries.length : 0;
                  const bLen = b.entries ? b.entries.length : 0;
                  return bLen - aLen;
              });
              tp = tps[0];
          }


        res.json({ success: true, data: tp || null });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch Tour Program' });
    }
});

// ─── PHASE 2: DCR (DAILY CALL REPORT) ───────────────────────────────────────

// Submit a DCR
router.post('/dcr', async (req, res) => {
    try {
        const { employeeId, date, entityType, entityId, entityName } = req.body;
        if (!employeeId || !date || !entityType || !entityId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if rep has an APPROVED TP for this date
        const dateObj = new Date(date);
        const monthLong = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const monthShort = dateObj.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        const monthNum = String(dateObj.getMonth() + 1);
        const monthNumPad = monthNum.padStart(2, '0');
        const year = String(dateObj.getFullYear());

        const userForId = await XlUser.findOne({ where: { employeeId } }) || 
                          await XlUser.findOne({ where: { email: employeeId } }) || 
                          await XlUser.findOne({ where: { uid: employeeId } });
        let idArray = [employeeId];
        if (userForId) {
            if (userForId.employeeId) idArray.push(userForId.employeeId);
            if (userForId.email) idArray.push(userForId.email);
            if (userForId.uid) idArray.push(userForId.uid);
        }
        idArray = Array.from(new Set(idArray));

        const tp = await XlTourProgram.findOne({
            where: {
                employeeId: { [Op.in]: idArray },
                year,
                status: 'Approved',
                [Op.or]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('month')), monthLong),
                    sequelize.where(sequelize.fn('lower', sequelize.col('month')), monthShort),
                    { month: monthNum },
                    { month: monthNumPad }
                ]
            }
        });
        if (!tp) {
            return res.status(403).json({ error: 'No approved Tour Program found for this date. Please submit and get your TP approved first.' });
        }

        const normalizeDate = (d) => toStorageDate(d) || d || '';

        // Check entries contain this date
        let entries = [];
        try { entries = JSON.parse(tp.entries || '[]'); } catch(e){}
        if (!Array.isArray(entries)) entries = Object.values(entries);

        const normDate = normalizeDate(date);
        const entry = entries.find((e) => normalizeDate(e.date) === normDate);
        if (!entry) {
            return res.status(403).json({ error: `Date ${date} is not in your approved Tour Program.` });
        }

        // ── Phase 3: Check Attendance & Backlog Rules ──────────────────────
        const todayStr = new Date().toISOString().split('T')[0];
        if (date === todayStr) {
            // Current day -> MUST be punched in
            const att = await XlAttendance.findOne({ where: { employeeId, date } });
            if (!att || !att.punchInTime) {
                return res.status(403).json({ error: 'You must punch in your Attendance for today before submitting a call report.' });
            }
        } else {
            // Past day -> MUST have an approved Backlog Request
            const backlog = await XlBacklogRequest.findOne({ where: { employeeId, date, status: 'Approved' } });
            if (!backlog) {
                return res.status(403).json({ error: `Reporting for ${date} is locked. You must submit a Backlog Request and get Admin approval to report for past dates.` });
            }
        }

        // ── Geo-fence check for Doctor, Chemist, and Stockist visits ────────────
        const todayStr2 = new Date().toISOString().split('T')[0];
        if (date === todayStr2 && (entityType === 'Doctor' || entityType === 'Chemist' || entityType === 'Stockist')) {
            const { latitude: mrLat, longitude: mrLng } = req.body;

            if (!mrLat || !mrLng) {
                return res.status(400).json({ error: `Your GPS location is required to submit a ${entityType} call report. Please capture your location first.` });
            }

            let targetEntity = null;
            if (entityType === 'Doctor') targetEntity = await XlDoctor.findOne({ where: { _id: entityId } });
            else if (entityType === 'Chemist') targetEntity = await XlChemist.findOne({ where: { _id: entityId } });
            else if (entityType === 'Stockist') targetEntity = await XlStockist.findOne({ where: { _id: entityId } });

            if (!targetEntity) return res.status(404).json({ error: `${entityType} not found.` });

            if (!targetEntity.lat1 || !targetEntity.lng1) {
                return res.status(403).json({ error: `${targetEntity.name || targetEntity.businessName} has no registered location. Please tag their location in Geo Fencing Manager first.` });
            }

            const dist1 = haversineMetres(mrLat, mrLng, targetEntity.lat1, targetEntity.lng1);
            const dist2 = (targetEntity.lat2 && targetEntity.lng2)
                ? haversineMetres(mrLat, mrLng, targetEntity.lat2, targetEntity.lng2)
                : Infinity;

            const nearest = Math.min(dist1, dist2);
            if (nearest > DEFAULT_RADIUS_METRES) {
                return res.status(403).json({
                    error: `You are ${Math.round(nearest)}m away from ${targetEntity.name || targetEntity.businessName}'s registered location. You must be within ${DEFAULT_RADIUS_METRES}m to submit this report.`
                });
            }
        }

        const hqToRecord = (req.body.headquarter || req.body.hq || userForId?.hq || tp?.hq || '').toUpperCase().trim();
        const dcr = await XlDCR.create({
            _id: generateId(),
            ...req.body,
            headquarter: hqToRecord,
            tourProgramId: tp._id,
            samplesGiven: JSON.stringify(req.body.samplesGiven || []),
            gifts: JSON.stringify(req.body.gifts || []),
            productsDetailed: JSON.stringify(req.body.productsDetailed || []),
            pobItems: JSON.stringify(req.body.pobItems || []),
            workedWith: JSON.stringify(req.body.workedWith || []),
        });
        res.json({ success: true, message: 'Call Report submitted!', data: dcr });
    } catch (e) {
        console.error('DCR error:', e);
        res.status(500).json({ error: 'Failed to submit Call Report' });
    }
});

// Get my DCRs for a specific date
router.get('/dcr/my', async (req, res) => {
    try {
        const { email, date } = req.query;
        if (!email || !date) return res.status(400).json({ error: 'Missing params' });
        const dcrs = await XlDCR.findAll({ where: { employeeId: email, date }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: dcrs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch DCRs' });
    }
});

// Get my DCRs for a whole month
router.get('/dcr/monthly', async (req, res) => {
    try {
        const { email, month, year } = req.query; // month should be 1-12
        if (!email || !month || !year) return res.status(400).json({ error: 'Missing params' });
        const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
        
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArrayDcr = [email];
        if (user) {
            if (user.employeeId) idArrayDcr.push(user.employeeId);
            if (user.email) idArrayDcr.push(user.email);
            if (user.uid) idArrayDcr.push(user.uid);
        }
        const dcrs = await XlDCR.findAll({ 
            where: { 
                employeeId: { [Op.in]: idArrayDcr }, 
                date: { [Op.startsWith]: datePrefix } 
            } 
        });

        res.json({ success: true, data: dcrs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch monthly DCRs' });
    }
});

// Force download file
router.get('/download', (req, res) => {
    try {
        const fileUrl = req.query.file;
        const customName = req.query.name;
        if (!fileUrl) return res.status(400).json({ error: 'File required' });
        // fileUrl is like /uploads/abc.jpg
        const filePath = path.join(__dirname, '..', fileUrl);
        if (fs.existsSync(filePath)) {
            if (customName) {
                res.download(filePath, customName);
            } else {
                res.download(filePath);
            }
        } else {
            res.status(404).send('File not found');
        }
    } catch(e) {
        res.status(500).send('Error');
    }
});

// ─── PHASE 3: ATTENDANCE ─────────────────────────────────────────────────────

function getOfficeDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Automatically clean up any legacy Wi-Fi / IP fields stored in XlUser.controls or XlAttendance.dayRemarks
(async function cleanUnusedOfficeWifiDataInDb() {
    try {
        const { XlUser, XlAttendance } = require('../db');
        const { Op } = require('sequelize');
        const users = await XlUser.findAll();
        for (const u of users) {
            let ctrls = u.controls;
            if (!ctrls) continue;
            if (typeof ctrls === 'string') {
                try { ctrls = JSON.parse(ctrls); } catch (e) { continue; }
            }
            if (ctrls && typeof ctrls === 'object' && ('officeWifiIp' in ctrls || 'requireWifiLock' in ctrls)) {
                const cleaned = { ...ctrls };
                delete cleaned.officeWifiIp;
                delete cleaned.requireWifiLock;
                u.controls = cleaned;
                await u.save();
            }
        }
        const officeAtts = await XlAttendance.findAll({
            where: { dayRemarks: { [Op.like]: '%isOfficePunchMeta%' } }
        });
        for (const att of officeAtts) {
            try {
                const parsed = typeof att.dayRemarks === 'string' ? JSON.parse(att.dayRemarks) : att.dayRemarks;
                if (parsed && parsed.isOfficePunchMeta) {
                    let changed = false;
                    if (parsed.officeSnapshot && 'requireWifiLock' in parsed.officeSnapshot) {
                        delete parsed.officeSnapshot.requireWifiLock;
                        changed = true;
                    }
                    if (Array.isArray(parsed.sessions)) {
                        parsed.sessions.forEach(s => {
                            if ('punchInIp' in s || 'wifiVerified' in s) {
                                delete s.punchInIp;
                                delete s.wifiVerified;
                                changed = true;
                            }
                        });
                    }
                    if (changed) {
                        att.dayRemarks = JSON.stringify(parsed);
                        await att.save();
                    }
                }
            } catch (e) {}
        }
    } catch (e) {
        // Non-blocking startup cleanup
    }
})();

async function getOfficePunchConfigForEmployee(identifier) {
    const defaultCfg = {
        enabled: false,
        officeName: 'Corporate Office',
        officeLat: null,
        officeLng: null,
        officeRadius: 50
    };
    if (!identifier) return { user: null, officePunchConfig: defaultCfg };
    try {
        const { XlUser } = require('../db');
        const { Op } = require('sequelize');
        const clean = String(identifier).trim();
        const user = await XlUser.findOne({
            where: {
                [Op.or]: [
                    { employeeId: clean },
                    { email: clean },
                    { uid: clean }
                ]
            }
        });
        if (!user) return { user: null, officePunchConfig: defaultCfg };
        let controls = user.controls || {};
        if (typeof controls === 'string') {
            try { controls = JSON.parse(controls); } catch (e) { controls = {}; }
        }
        const enabled = Boolean(controls && controls.PUNCHING === true);
        const hasLat = controls.officeLat !== undefined && controls.officeLat !== null && String(controls.officeLat).trim() !== '' && !isNaN(Number(controls.officeLat));
        const hasLng = controls.officeLng !== undefined && controls.officeLng !== null && String(controls.officeLng).trim() !== '' && !isNaN(Number(controls.officeLng));
        return {
            user,
            officePunchConfig: {
                enabled,
                officeName: (controls.officeName && String(controls.officeName).trim()) || 'Corporate Office',
                officeLat: hasLat ? Number(controls.officeLat) : null,
                officeLng: hasLng ? Number(controls.officeLng) : null,
                officeRadius: Number(controls.officeRadius) > 0 ? Number(controls.officeRadius) : 50
            }
        };
    } catch (e) {
        console.error('[getOfficePunchConfigForEmployee Error]', e.message);
        return { user: null, officePunchConfig: defaultCfg };
    }
}

function hasExplicitOfficeMeta(att) {
    if (!att || !att.dayRemarks) return false;
    try {
        const parsed = typeof att.dayRemarks === 'string' ? JSON.parse(att.dayRemarks) : att.dayRemarks;
        return Boolean(parsed && parsed.isOfficePunchMeta && Array.isArray(parsed.sessions));
    } catch (e) {
        return false;
    }
}

function parseOfficePunchMeta(att) {
    if (!att) {
        return { isOfficePunchMeta: true, officeSnapshot: null, sessions: [], totalOfficeMinutes: 0, userRemarks: '' };
    }
    if (att.dayRemarks) {
        try {
            const parsed = typeof att.dayRemarks === 'string' ? JSON.parse(att.dayRemarks) : att.dayRemarks;
            if (parsed && parsed.isOfficePunchMeta && Array.isArray(parsed.sessions)) {
                return {
                    isOfficePunchMeta: true,
                    officeSnapshot: parsed.officeSnapshot || null,
                    sessions: parsed.sessions,
                    totalOfficeMinutes: Number(parsed.totalOfficeMinutes) || 0,
                    userRemarks: parsed.userRemarks || ''
                };
            }
        } catch (e) {
            // Plain text dayRemarks
        }
    }
    // If record was created before Office Punching was enabled, do NOT treat it as an active office session
    return {
        isOfficePunchMeta: true,
        officeSnapshot: null,
        sessions: [],
        totalOfficeMinutes: 0,
        userRemarks: typeof att.dayRemarks === 'string' ? att.dayRemarks : ''
    };
}

// Punch In
router.post('/attendance/punch-in', async (req, res) => {
    try {
        const { employeeId, date, punchInTime, punchInLat, punchInLng, gpsAccuracy } = req.body;
        const { user, officePunchConfig } = await getOfficePunchConfigForEmployee(employeeId);
        const { Op } = require('sequelize');
        const idCandidates = [employeeId, user?.employeeId, user?.email, user?.uid].filter(Boolean);

        // ── EXCLUSIVE OFFICE GEO-PUNCHING FLOW (Only when Admin ticked PUNCHING in User Controls) ──
        if (officePunchConfig.enabled) {
            // Pure Admin-Linked Office Geo-Location Match (with indoor GPS accuracy circle overlap tolerance)
            if (officePunchConfig.officeLat !== null && officePunchConfig.officeLng !== null && punchInLat !== undefined && punchInLng !== undefined && punchInLat !== null && punchInLng !== null) {
                const rawDistMeters = Math.round(
                    getOfficeDistanceMeters(
                        Number(punchInLat),
                        Number(punchInLng),
                        officePunchConfig.officeLat,
                        officePunchConfig.officeLng
                    )
                );
                const indoorTolerance = Math.min(Math.max(0, Number(gpsAccuracy) || 0), 300);
                const effectiveDist = Math.max(0, Math.round(rawDistMeters - indoorTolerance));
                const allowedRadius = Math.max(Number(officePunchConfig.officeRadius) || 50, 35);

                if (effectiveDist > allowedRadius) {
                    return res.status(400).json({
                        error: `Outside ${officePunchConfig.officeName} (${effectiveDist}m away; allowed ${officePunchConfig.officeRadius}m). You can only Punch In when your location matches the office.`,
                        distanceMeters: effectiveDist,
                        officeRadius: officePunchConfig.officeRadius
                    });
                }
            }

            const existing = await XlAttendance.findOne({
                where: {
                    employeeId: { [Op.in]: idCandidates },
                    date
                }
            });
            const nowMs = Date.now();
            const finalLat = (punchInLat !== undefined && punchInLat !== null) ? punchInLat : officePunchConfig.officeLat;
            const finalLng = (punchInLng !== undefined && punchInLng !== null) ? punchInLng : officePunchConfig.officeLng;

            // Auto-lock office geo-location to employee's desk if not already set by Admin
            if (user && finalLat != null && finalLng != null && (officePunchConfig.officeLat == null || officePunchConfig.officeLng == null)) {
                let ctrls = user.controls || {};
                if (typeof ctrls === 'string') {
                    try { ctrls = JSON.parse(ctrls); } catch (e) { ctrls = {}; }
                }
                ctrls.officeLat = Number(Number(finalLat).toFixed(6));
                ctrls.officeLng = Number(Number(finalLng).toFixed(6));
                ctrls.officeRadius = ctrls.officeRadius || 50;
                user.controls = ctrls;
                await user.save();
                officePunchConfig.officeLat = ctrls.officeLat;
                officePunchConfig.officeLng = ctrls.officeLng;
            }

            const officeSnapshot = {
                officeName: officePunchConfig.officeName || 'Corporate Office',
                officeLat: officePunchConfig.officeLat,
                officeLng: officePunchConfig.officeLng,
                officeRadius: officePunchConfig.officeRadius || 50
            };

            if (!existing) {
                const meta = {
                    isOfficePunchMeta: true,
                    officeSnapshot,
                    sessions: [
                        {
                            sessionNo: 1,
                            officeName: officeSnapshot.officeName,
                            punchInTime,
                            punchInMs: nowMs,
                            punchInLat: finalLat,
                            punchInLng: finalLng,
                            punchOutTime: null,
                            punchOutMs: null,
                            punchOutLat: null,
                            punchOutLng: null,
                            outType: null,
                            durationMinutes: 0
                        }
                    ],
                    totalOfficeMinutes: 0,
                    userRemarks: ''
                };
                const att = await XlAttendance.create({
                    _id: generateId(),
                    employeeId: user?.employeeId || employeeId,
                    date,
                    punchInTime,
                    punchInLat: finalLat,
                    punchInLng: finalLng,
                    punchOutTime: null,
                    dayRemarks: JSON.stringify(meta)
                });
                return res.json({
                    success: true,
                    message: `Punched In inside ${officePunchConfig.officeName} (Session #1)!`,
                    data: att,
                    officePunchConfig,
                    sessions: meta.sessions,
                    totalOfficeMinutes: meta.totalOfficeMinutes,
                    isCurrentlyPunchedIn: true
                });
            }

            const meta = parseOfficePunchMeta(existing);
            meta.officeSnapshot = meta.officeSnapshot || officeSnapshot;
            const lastSession = meta.sessions.length > 0 ? meta.sessions[meta.sessions.length - 1] : null;
            if (lastSession && !lastSession.punchOutTime && !existing.punchOutTime) {
                return res.status(400).json({ error: 'You are already Punched In inside the office.' });
            }

            const nextSessionNo = meta.sessions.length + 1;
            meta.sessions.push({
                sessionNo: nextSessionNo,
                officeName: officeSnapshot.officeName,
                punchInTime,
                punchInMs: nowMs,
                punchInLat: finalLat,
                punchInLng: finalLng,
                punchOutTime: null,
                punchOutMs: null,
                punchOutLat: null,
                punchOutLng: null,
                outType: null,
                durationMinutes: 0
            });

            await XlAttendance.update(
                {
                    punchInTime: existing.punchInTime || punchInTime,
                    punchInLat: finalLat,
                    punchInLng: finalLng,
                    punchOutTime: null,
                    dayRemarks: JSON.stringify(meta)
                },
                { where: { _id: existing._id } }
            );

            const updatedAtt = await XlAttendance.findOne({ where: { _id: existing._id } });
            return res.json({
                success: true,
                message: nextSessionNo === 1
                    ? `Punched In inside ${officePunchConfig.officeName} (Session #1)!`
                    : `Re-Punched In inside ${officePunchConfig.officeName} (Session #${nextSessionNo})!`,
                data: updatedAtt,
                officePunchConfig,
                sessions: meta.sessions,
                totalOfficeMinutes: meta.totalOfficeMinutes,
                isCurrentlyPunchedIn: true
            });
        }

        // ── STANDARD FIELD USER SINGLE-PUNCH FLOW (Untouched) ──
        const existing = await XlAttendance.findOne({ where: { employeeId, date } });
        if (existing) return res.status(400).json({ error: 'Already punched in for today.' });
        
        const att = await XlAttendance.create({
            _id: generateId(),
            employeeId, date, punchInTime, punchInLat, punchInLng
        });
        res.json({ success: true, message: 'Punched In!', data: att });
    } catch (e) {
        console.error('[Punch In Error]', e);
        res.status(500).json({ error: 'Failed to punch in' });
    }
});

// Punch Out
router.post('/attendance/punch-out', async (req, res) => {
    try {
        const { employeeId, date, punchOutTime, punchOutLat, punchOutLng, autoPunchOut, autoReason } = req.body;
        const { user, officePunchConfig } = await getOfficePunchConfigForEmployee(employeeId);
        const { Op } = require('sequelize');
        const idCandidates = [employeeId, user?.employeeId, user?.email, user?.uid].filter(Boolean);

        let att = await XlAttendance.findOne({
            where: {
                employeeId: { [Op.in]: idCandidates },
                date
            }
        });
        if (!att) {
            const backlog = await XlBacklogRequest.findOne({ where: { employeeId, date, status: 'Approved' } });
            if (backlog) {
                att = await XlAttendance.create({ _id: generateId(), employeeId, date, punchInTime: '00:00', punchOutTime: '23:59', daySubmitted: false });
            } else {
                return res.status(400).json({ error: 'No punch-in record found for today.' });
            }
        }

        // ── EXCLUSIVE OFFICE GEO-PUNCHING FLOW (Only when Admin ticked PUNCHING in User Controls) ──
        if (officePunchConfig.enabled) {
            const meta = parseOfficePunchMeta(att);
            const openSession = [...meta.sessions].reverse().find(s => !s.punchOutTime);

            if (!openSession && att.punchOutTime) {
                return res.status(400).json({ error: 'Already punched out.' });
            }

            const nowMs = Date.now();
            if (openSession) {
                openSession.punchOutTime = punchOutTime;
                openSession.punchOutMs = nowMs;
                openSession.punchOutLat = punchOutLat;
                openSession.punchOutLng = punchOutLng;
                openSession.outType = autoPunchOut ? (autoReason || 'Auto (Left Office Location)') : 'Manual';
                const elapsedMin = openSession.punchInMs
                    ? Math.max(1, Math.round((nowMs - Number(openSession.punchInMs)) / 60000))
                    : 1;
                openSession.durationMinutes = elapsedMin;
            }

            meta.totalOfficeMinutes = meta.sessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

            await XlAttendance.update(
                {
                    punchOutTime,
                    punchOutLat,
                    punchOutLng,
                    dayRemarks: JSON.stringify(meta)
                },
                { where: { _id: att._id } }
            );

            const updatedAtt = await XlAttendance.findOne({ where: { _id: att._id } });
            return res.json({
                success: true,
                message: autoPunchOut
                    ? `Auto Punched Out (${autoReason || 'Left Office Location'}). Please Re-Punch In when you return inside the office.`
                    : 'Punched Out!',
                data: updatedAtt,
                officePunchConfig,
                sessions: meta.sessions,
                totalOfficeMinutes: meta.totalOfficeMinutes,
                isCurrentlyPunchedIn: false
            });
        }

        // ── STANDARD FIELD USER SINGLE-PUNCH FLOW (Untouched) ──
        if (att.punchOutTime) return res.status(400).json({ error: 'Already punched out.' });

        await XlAttendance.update(
            { punchOutTime, punchOutLat, punchOutLng }, 
            { where: { _id: att._id } }
        );
        res.json({ success: true, message: 'Punched Out!' });
    } catch (e) {
        console.error('[Punch Out Error]', e);
        res.status(500).json({ error: 'Failed to punch out' });
    }
});

// Office Geo-Location Presence Heartbeat Check
router.post('/attendance/office-heartbeat', async (req, res) => {
    try {
        const { employeeId, date } = req.body;
        const { user, officePunchConfig } = await getOfficePunchConfigForEmployee(employeeId);

        if (!officePunchConfig.enabled) {
            return res.json({ success: true, enabled: false });
        }

        const { Op } = require('sequelize');
        const idCandidates = [employeeId, user?.employeeId, user?.email, user?.uid].filter(Boolean);
        const att = await XlAttendance.findOne({
            where: {
                employeeId: { [Op.in]: idCandidates },
                date
            }
        });
        const meta = parseOfficePunchMeta(att);
        const hasOpenOfficeSession = meta.sessions.some(s => !s.punchOutTime);
        const isCurrentlyPunchedIn = Boolean(hasExplicitOfficeMeta(att) && hasOpenOfficeSession && att && !att.punchOutTime);

        return res.json({
            success: true,
            autoPunchedOut: false,
            isCurrentlyPunchedIn,
            sessionCount: meta.sessions.length,
            totalOfficeMinutes: meta.totalOfficeMinutes,
            officePunchConfig
        });
    } catch (e) {
        res.status(500).json({ error: 'Heartbeat check failed' });
    }
});


// Delete entire Day Report (All DCRs for a specific date and reset Attendance)
router.delete('/dcr/day/all', async (req, res) => {
    try {
        const { employeeId, date } = req.query;
        if (!employeeId || !date) {
            return res.status(400).json({ success: false, message: 'Employee ID and date are required' });
        }
        await XlDCR.destroy({ where: { employeeId, date } });
        
        const { XlAttendance } = require('../db');
        await XlAttendance.update({ daySubmitted: false, status: 'Pending' }, { where: { employeeId, date } });
        
        res.json({ success: true, message: 'Day report deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete day report' });
    }
});

// Delete DCR
router.delete('/dcr/:id', async (req, res) => {
    try {
        await XlDCR.destroy({ where: { _id: req.params.id } });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete DCR' });
    }
});

// Submit Day Final Report
router.post('/attendance/submit-day', async (req, res) => {
    try {
        const { employeeId, date, dayRemarks } = req.body;
        let att = await XlAttendance.findOne({ where: { employeeId, date } });
        if (!att) {
            const backlog = await XlBacklogRequest.findOne({ where: { employeeId, date, status: 'Approved' } });
            if (backlog) {
                att = await XlAttendance.create({ _id: generateId(), employeeId, date, punchInTime: '00:00', punchOutTime: '23:59', daySubmitted: false });
            } else {
                return res.status(400).json({ error: 'No punch-in record found for today.' });
            }
        }
        if (att.daySubmitted) return res.status(400).json({ error: 'Day already submitted.' });

        let nextRemarks = dayRemarks;
        if (att.dayRemarks) {
            try {
                const parsed = typeof att.dayRemarks === 'string' ? JSON.parse(att.dayRemarks) : att.dayRemarks;
                if (parsed && parsed.isOfficePunchMeta) {
                    parsed.userRemarks = dayRemarks || '';
                    nextRemarks = JSON.stringify(parsed);
                }
            } catch (e) {}
        }

        await XlAttendance.update(
            { dayRemarks: nextRemarks, daySubmitted: true }, 
            { where: { _id: att._id } }
        );
        res.json({ success: true, message: 'Day submitted successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit day' });
    }
});

// Get Attendance for date
router.get('/attendance/my', async (req, res) => {
    try {
        const { email, date } = req.query;
        const { user, officePunchConfig } = await getOfficePunchConfigForEmployee(email);
        const { Op } = require('sequelize');
        const idCandidates = [email];
        if (user) {
            if (user.employeeId && !idCandidates.includes(user.employeeId)) idCandidates.push(user.employeeId);
            if (user.email && !idCandidates.includes(user.email)) idCandidates.push(user.email);
            if (user.uid && !idCandidates.includes(user.uid)) idCandidates.push(user.uid);
        }
        const att = await XlAttendance.findOne({
            where: {
                employeeId: { [Op.in]: idCandidates.filter(Boolean) },
                date
            }
        });
        const meta = officePunchConfig.enabled ? parseOfficePunchMeta(att) : { sessions: [], totalOfficeMinutes: 0 };
        const hasOpenOfficeSession = meta.sessions.some(s => !s.punchOutTime);
        const isCurrentlyPunchedIn = officePunchConfig.enabled
            ? Boolean(hasExplicitOfficeMeta(att) && hasOpenOfficeSession && att && !att.punchOutTime)
            : Boolean(att && att.punchInTime && !att.punchOutTime);
        res.json({
            success: true,
            data: att,
            officePunchConfig,
            sessions: meta.sessions,
            totalOfficeMinutes: meta.totalOfficeMinutes,
            isCurrentlyPunchedIn
        });
    } catch (e) {
        console.error('[GET /attendance/my Error]', e);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Get Monthly Attendances
router.get('/attendance/monthly', async (req, res) => {
    try {
        const { email, month, year } = req.query; // month is 1-12
        const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
        
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArrayAtt = [email];
        if (user) {
            if (user.employeeId) idArrayAtt.push(user.employeeId);
            if (user.email) idArrayAtt.push(user.email);
            if (user.uid) idArrayAtt.push(user.uid);
        }
        const atts = await XlAttendance.findAll({ 
            where: { 
                employeeId: { [require('sequelize').Op.in]: idArrayAtt }, 
                date: { [require('sequelize').Op.startsWith]: datePrefix } 
            } 
        });

        res.json({ success: true, data: atts });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch monthly attendance' });
    }
});

// ─── PHASE 3: LEAVE REQUEST ────────────────────────────────────────────────


router.get('/debug/dcrs', async (req, res) => {
    try {
        const dcrs = await XlDCR.findAll({ attributes: ['employeeId', 'date'] });
        res.json({ success: true, data: dcrs });
    } catch(e) { res.status(500).json({ error: e.message }); }
});
// Get ALL Monthly Attendances (for Admin ERP View)
router.get('/attendance/monthly/all', async (req, res) => {
    try {
        const { month, year } = req.query; // month is 1-12
        const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
        
        const atts = await XlAttendance.findAll({ 
            where: { 
                date: { [require('sequelize').Op.startsWith]: datePrefix } 
            } 
        });
        
        const dcrs = await XlDCR.findAll({
            attributes: ['employeeId', 'date'],
            where: {
                date: { [require('sequelize').Op.startsWith]: datePrefix } 
            }
        });
        
        // Merge DCRs into atts as fake attendances if they don't already exist
        const attMap = new Set(atts.map(a => `${a.employeeId}_${a.date}`));
        const mergedData = [...atts.map(a => a.toJSON())];
        
        for (const dcr of dcrs) {
            const key = `${dcr.employeeId}_${dcr.date}`;
            if (!attMap.has(key)) {
                mergedData.push({
                    employeeId: dcr.employeeId,
                    date: dcr.date,
                    status: 'Present',
                    punchInTime: 'DCR Submitted'
                });
                attMap.add(key); // prevent duplicates from multiple DCRs on same day
            }
        }
        
        // Fetch Working Days Preference and Global Holidays
        const pref = await XlGlobalSettings.findOne();
        const workingDays = (pref && pref.settings && pref.settings.set_working_days) ? (pref.settings.workingDays || { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true }) : { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false };
        
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const startDate = datePrefix + '-01';
        const endDate = datePrefix + '-' + String(lastDay).padStart(2, '0');
        const holidays = await XlHoliday.findAll({
            where: { date: { [require('sequelize').Op.between]: [startDate, endDate] } }
        });

        res.json({ success: true, data: mergedData, workingDays, holidays });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch all monthly attendance', details: e.message, stack: e.stack });
    }
});
// --- LEAVE ADMIN FETCH ROUTES ---
router.get('/leave', async (req, res) => {
    try {
        const { XlLeave, XlUser } = require('../db');
        const { Op } = require('sequelize');
        let where = {};
        if (req.query.employeeId) {
            let empIds = [String(req.query.employeeId).trim()];
            const user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { uid: req.query.employeeId },
                        { employeeId: req.query.employeeId },
                        { email: req.query.employeeId }
                    ]
                }
            });
            if (user) {
                if (user.uid) empIds.push(String(user.uid).trim());
                if (user.employeeId) empIds.push(String(user.employeeId).trim());
                if (user.email) empIds.push(String(user.email).trim());
                if (user._id) empIds.push(String(user._id).trim());
            }
            where.employeeId = { [Op.in]: Array.from(new Set(empIds)) };
        }
        const leaves = await XlLeave.findAll({ where, order: [['createdAt', 'DESC']] });

        const allUsers = await XlUser.findAll({
            attributes: ['_id', 'uid', 'employeeId', 'email', 'firstName', 'lastName', 'designation', 'hq']
        });
        const userMap = new Map();
        for (const u of allUsers) {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            const uObj = {
                _id: u._id,
                uid: u.uid,
                employeeId: u.employeeId,
                email: u.email,
                name: fullName,
                designation: u.designation || '',
                hq: u.hq || ''
            };
            if (u._id) userMap.set(String(u._id), uObj);
            if (u.uid) userMap.set(String(u.uid), uObj);
            if (u.employeeId) userMap.set(String(u.employeeId), uObj);
            if (u.email) userMap.set(String(u.email).toLowerCase(), uObj);
        }

        const data = leaves.map(item => {
            const plain = item.toJSON ? item.toJSON() : item;
            const empKey = String(plain.employeeId || '').trim();
            const matched = userMap.get(empKey) || userMap.get(empKey.toLowerCase());
            return {
                ...plain,
                employeeName: matched?.name || 'Unknown User',
                employeeCode: matched?.employeeId || matched?.uid || empKey
            };
        });

        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

router.delete('/leave/:id', async (req, res) => {
    try {
        const { XlLeave, XlAssignedLeave } = require('../db');
        const leave = await XlLeave.findOne({ where: { _id: req.params.id } });
        
        if (leave && leave.status === 'Approved' && leave.leaveType !== 'Leave Without Pay' && leave.leaveType !== 'LWP') {
            const sd = new Date(leave.startDate);
            const ed = new Date(leave.endDate || leave.startDate);
            const days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
            
            const startMonth = sd.getMonth();
            const startYear = sd.getFullYear();
            const yearStr = startMonth >= 3 ? `${startYear}-${startYear+1}` : `${startYear-1}-${startYear}`;
            
            const record = await XlAssignedLeave.findOne({ where: { employeeId: leave.employeeId, year: yearStr, leaveType: leave.leaveType } });
            
            if (record) {
                record.used = Math.max(0, (record.used || 0) - days);
                await record.save();
            }
        }
        
        // --- NEW LOGIC: REMOVE FROM XlAttendance ---
        if (leave && leave.status === 'Approved') {
            const { XlAttendance, XlUser } = require('../db');
            const sd = new Date(leave.startDate);
            const ed = new Date(leave.endDate || leave.startDate);
            
            let correctEmployeeId = leave.employeeId;
            try {
                const users = await XlUser.findAll();
                
    const lookupValLeave = leave.employeeId ? leave.employeeId.toLowerCase() : '';
    const xlUser = users.find(u => 
        (u.email && u.email.toLowerCase() === lookupValLeave) || 
        (u.uid && u.uid.toLowerCase() === lookupValLeave) || 
        (u.employeeId && u.employeeId.toLowerCase() === lookupValLeave)
    );

                if (xlUser && xlUser.employeeId) {
                    correctEmployeeId = xlUser.employeeId;
                }
            } catch (e) {}

            if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
                const dateList = [];
                let curr = new Date(sd);
                while (curr <= ed) {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    dateList.push(`${y}-${m}-${d}`);
                    curr.setDate(curr.getDate() + 1);
                }
                
                for (const dStr of dateList) {
                    await XlAttendance.destroy({
                        where: {
                            employeeId: correctEmployeeId,
                            date: dStr
                        }
                    });
                }
            }
        }
        // -------------------------------------------

        
        await XlLeave.destroy({ where: { _id: req.params.id } });
        res.json({ success: true, message: 'Leave deleted and balance restored' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete leave' });
    }
});

router.post('/leave', async (req, res) => {
    try {
        const { XlLeave, XlAssignedLeave } = require('../db');
        const { startDate, endDate, leaveType, status, employeeId } = req.body;
        
        const finalStatus = status || 'Pending';
        const leave = await XlLeave.create({ _id: generateId(), ...req.body, status: finalStatus });
        
        if (finalStatus === 'Approved' && leaveType !== 'Leave Without Pay' && leaveType !== 'LWP') {
            const sd = new Date(startDate);
            const ed = new Date(endDate || startDate);
            const days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
            
            const startMonth = sd.getMonth();
            const startYear = sd.getFullYear();
            const yearStr = startMonth >= 3 ? `${startYear}-${startYear+1}` : `${startYear-1}-${startYear}`;
            
            const record = await XlAssignedLeave.findOne({ where: { employeeId, year: yearStr, leaveType } });
            
            if (record) {
                record.used = (record.used || 0) + days;
                await record.save();
            }
        }
        
        // --- NEW LOGIC: INJECT INTO XlAttendance ---
        if (finalStatus === 'Approved') {
            const { XlAttendance, XlUser } = require('../db');
            const generateId = () => Math.random().toString(36).substring(2, 15);
            const sd = new Date(startDate);
            const ed = new Date(endDate || startDate);
            
            let correctEmployeeId = employeeId;
            try {
                // Try to convert email to employee code if it is an email
                const users = await XlUser.findAll();
                  const lookupVal = employeeId ? employeeId.toLowerCase() : '';
            const xlUser = users.find(u => 
                (u.email && u.email.toLowerCase() === lookupVal) || 
                (u.uid && u.uid.toLowerCase() === lookupVal) || 
                (u.employeeId && u.employeeId.toLowerCase() === lookupVal)
            );
                if (xlUser && xlUser.employeeId) {
                    correctEmployeeId = xlUser.employeeId;
                }
            } catch (e) {
                console.error("Failed to lookup employeeId", e);
            }

            if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
                const dateList = [];
                let curr = new Date(sd);
                while (curr <= ed) {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    dateList.push(`${y}-${m}-${d}`);
                    curr.setDate(curr.getDate() + 1);
                }
                
                const isLWP = leaveType === 'Leave Without Pay' || leaveType === 'LWP';

                for (const dStr of dateList) {
                    const existing = await XlAttendance.findOne({ where: { employeeId: correctEmployeeId, date: dStr } });
                    if (existing) {
                        await existing.update({
                            status: isLWP ? 'LWP' : 'Leave',
                            punchInTime: 'Leave',
                            punchOutTime: 'Leave',
                            dayRemarks: 'Auto-approved Leave',
                            daySubmitted: true
                        });
                    } else {
                        await XlAttendance.create({
                            _id: generateId() + Date.now().toString(36),
                            employeeId: correctEmployeeId,
                            date: dStr,
                            status: isLWP ? 'LWP' : 'Leave',
                            punchInTime: 'Leave',
                            punchOutTime: 'Leave',
                            dayRemarks: 'Auto-approved Leave',
                            daySubmitted: true
                        });
                    }
                }
            }
        }
        // -------------------------------------------

        
        res.json({ success: true, message: 'Leave request submitted!', data: leave });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to submit leave request' });
    }
});

router.get('/leave/my', async (req, res) => {
    try {
        
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: req.query.email } }) || await XlUser.findOne({ where: { email: req.query.email } }) || await XlUser.findOne({ where: { uid: req.query.email } });
        let idArrayLeaves = [req.query.email];
        if (user) {
            if (user.employeeId) idArrayLeaves.push(user.employeeId);
            if (user.email) idArrayLeaves.push(user.email);
            if (user.uid) idArrayLeaves.push(user.uid);
        }
        const leaves = await XlLeave.findAll({ where: { employeeId: { [require('sequelize').Op.in]: idArrayLeaves } }, order: [['createdAt', 'DESC']] });
        
        res.json({ success: true, data: leaves });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

// ─── PHASE 3: EXPENSE ──────────────────────────────────────────────────────

router.delete('/expense', async (req, res) => {
    try {
        const { email, date, preserveFiles } = req.query;
        if (!email || !date) return res.status(400).json({ success: false, message: 'Email and date required' });
        
        // Fetch to get the files and delete them physically if preserveFiles is not true
        if (preserveFiles !== 'true') {
            const expenses = await XlExpense.findAll({ where: { employeeId: email, date } });
            for (const exp of expenses) {
                if (exp.receiptImage) deleteExpenseFiles(exp.receiptImage);
            }
        }
        
        await XlExpense.destroy({ where: { employeeId: email, date } });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/expense', async (req, res) => {
    try {
        const exp = await XlExpense.create({ _id: generateId(), ...req.body });
        res.json({ success: true, message: 'Expense submitted!', data: exp });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit expense' });
    }
});

router.get('/expense/my', async (req, res) => {
    try {
        
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: req.query.email } }) || await XlUser.findOne({ where: { email: req.query.email } }) || await XlUser.findOne({ where: { uid: req.query.email } });
        let idArrayExps = [req.query.email];
        if (user) {
            if (user.employeeId) idArrayExps.push(user.employeeId);
            if (user.email) idArrayExps.push(user.email);
            if (user.uid) idArrayExps.push(user.uid);
        }
        const exps = await XlExpense.findAll({ where: { employeeId: { [require('sequelize').Op.in]: idArrayExps } }, order: [['date', 'DESC']] });
        
        res.json({ success: true, data: exps });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// ─── PHASE 3: BACKLOG REQUEST ──────────────────────────────────────────────

router.post('/backlog', async (req, res) => {
    try {
        const { employeeId, dates, reason } = req.body;
        
        let datesArray = dates;
        if (!dates && req.body.date) datesArray = [req.body.date];
        
        if (!datesArray || !Array.isArray(datesArray) || datesArray.length === 0) return res.status(400).json({ error: 'No dates provided' });
        
        const created = [];
        for (const date of datesArray) {
            const existing = await XlBacklogRequest.findOne({ where: { employeeId, date } });
            if (!existing) {
                const reqs = await XlBacklogRequest.create({ _id: generateId(), employeeId, date, reason, status: 'Pending' });
                created.push(reqs);
            }
        }
        res.json({ success: true, message: 'Backlog requests submitted to Admin.', data: created });
    } catch (e) {
        res.status(500).json({ error: 'Failed to request backlog' });
    }
});

router.get('/backlog/my', async (req, res) => {
    try {
        
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: req.query.email } }) || await XlUser.findOne({ where: { email: req.query.email } }) || await XlUser.findOne({ where: { uid: req.query.email } });
        let idArrayReqs = [req.query.email];
        if (user) {
            if (user.employeeId) idArrayReqs.push(user.employeeId);
            if (user.email) idArrayReqs.push(user.email);
            if (user.uid) idArrayReqs.push(user.uid);
        }
        const reqs = await XlBacklogRequest.findAll({ where: { employeeId: { [require('sequelize').Op.in]: idArrayReqs } }, order: [['date', 'DESC']] });
        
        res.json({ success: true, data: reqs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch backlog requests' });
    }
});

// ─── PHASE 3: CALL PLAN ────────────────────────────────────────────────────





// ─── PHASE 4: PERFORMANCE ANALYSIS ──────────────────────────────────────────

// Lockout Status Check
router.get('/performance/status', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        const today = new Date();
        const dateNum = today.getDate();
        
        // If it's <= 3rd of the month, no lockout
        if (dateNum <= 3) {
            return res.json({ locked: false });
        }

        const monthStr = today.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const yearStr = String(today.getFullYear());

        const perf = await XlPerformanceAnalysis.findOne({ where: { employeeId: email, month: monthStr, year: yearStr } });
        
        // If they have submitted their plan, no lockout
        if (perf && perf.planningSubmittedAt) {
            return res.json({ locked: false });
        }

        // Mid-month joiner check: if they have NO DCRs from ANY previous month, they are new, don't lock them
        // For simplicity, we just check if they have any DCR submitted prior to the 1st of this month
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const pastDcrs = await XlDCR.count({
            where: {
                employeeId: email,
                date: { [Op.lt]: firstOfThisMonth }
            }
        });

        if (pastDcrs === 0) {
            return res.json({ locked: false }); // Mid-month joiner / fresh account
        }

        return res.json({ locked: true, message: `Planning for ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)} must be submitted to access the dashboard.` });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to check performance status' });
    }
});

// Get/Create user's performance record for a month
router.get('/performance/my', async (req, res) => {
    try {
        const { email, month, year } = req.query;
        let perf = await XlPerformanceAnalysis.findOne({ where: { employeeId: email, month, year } });
        
        if (!perf) {
            perf = await XlPerformanceAnalysis.create({
                _id: generateId(),
                employeeId: email,
                month,
                year
            });
        }
        res.json({ success: true, data: perf });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch performance record' });
    }
});

// Submit the monthly plan (locks in the planned targets)
router.post('/performance/plan', async (req, res) => {
    try {
        const { id, brandData, roiData, accountData, keyCustomerData, outstandingData } = req.body;
        
        await XlPerformanceAnalysis.update({
            brandData: brandData !== undefined ? brandData : undefined,
            roiData: roiData !== undefined ? roiData : undefined,
            accountData: accountData !== undefined ? accountData : undefined,
            keyCustomerData: keyCustomerData !== undefined ? keyCustomerData : undefined,
            outstandingData: outstandingData !== undefined ? outstandingData : undefined
        }, { where: { _id: id } });

        res.json({ success: true, message: 'Plan saved successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save planning' });
    }
});

// Final submission locks the month
router.post('/performance/submit-final', async (req, res) => {
    try {
        const { id } = req.body;
        
        await XlPerformanceAnalysis.update({
            planningSubmittedAt: new Date()
        }, { where: { _id: id } });

        res.json({ success: true, message: 'Monthly Planning locked successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to lock planning' });
    }
});

// Request an unlock (User)
router.post('/performance/request-unlock', async (req, res) => {
    try {
        const { id } = req.body;
        await XlPerformanceAnalysis.update({ unlockRequested: true }, { where: { _id: id } });
        res.json({ success: true, message: 'Unlock requested successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to request unlock' });
    }
});

// Release / unlock the plan (Admin)
router.post('/performance/release', async (req, res) => {
    try {
        const { id } = req.body;
        await XlPerformanceAnalysis.update({ 
            planningSubmittedAt: null,
            unlockRequested: false
        }, { where: { _id: id } });
        res.json({ success: true, message: 'Plan unlocked successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to unlock plan' });
    }
});

// Update achieved targets for a specific week (or updating targets)
router.put('/performance/achieve', async (req, res) => {
    try {
        const { id, brandData, roiData, accountData, keyCustomerData, outstandingData } = req.body;
        
        await XlPerformanceAnalysis.update({
            brandData: brandData !== undefined ? (typeof brandData === 'string' ? brandData : JSON.stringify(brandData)) : undefined,
            roiData: roiData !== undefined ? (typeof roiData === 'string' ? roiData : JSON.stringify(roiData)) : undefined,
            accountData: accountData !== undefined ? (typeof accountData === 'string' ? accountData : JSON.stringify(accountData)) : undefined,
            keyCustomerData: keyCustomerData !== undefined ? (typeof keyCustomerData === 'string' ? keyCustomerData : JSON.stringify(keyCustomerData)) : undefined,
            outstandingData: outstandingData !== undefined ? (typeof outstandingData === 'string' ? outstandingData : JSON.stringify(outstandingData)) : undefined
        }, { where: { _id: id } });

        res.json({ success: true, message: 'Achievements saved successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update achievements' });
    }
});

// Auto-calculate Effort Analysis based on DCRs for a date range
router.post('/performance/effort-analysis', async (req, res) => {
    try {
        const { email, startDate, endDate } = req.body;
        
        const myDcrs = await XlDCR.findAll({
            where: {
                employeeId: email,
                date: { [Op.between]: [startDate, endDate] }
            }
        });

        const myDoctors = await XlDoctor.findAll({ where: { allottedUser: email } });
        const myChemists = await XlChemist.findAll({ where: { allottedUser: email } });
        const myStockists = await XlStockist.findAll({ where: { allottedUser: email } });

        // Calculate metrics
        const totalDoctors = myDoctors.length;
        const totalChemists = myChemists.length;
        const totalStockists = myStockists.length;

        let totalDrCalls = 0;
        let totalChemCalls = 0;
        let totalStockCalls = 0;
        
        const uniqueDrsVisited = new Set();
        const workDays = new Set();

        myDcrs.forEach(dcr => {
            workDays.add(dcr.date);
            if (dcr.entityType === 'Doctor') {
                totalDrCalls++;
                uniqueDrsVisited.add(dcr.entityId);
            } else if (dcr.entityType === 'Chemist') {
                totalChemCalls++;
            } else if (dcr.entityType === 'Stockist') {
                totalStockCalls++;
            }
        });

        const totalUniqueDoctorsVisited = uniqueDrsVisited.size;
        const totalMissedDoctors = totalDoctors - totalUniqueDoctorsVisited;
        
        const numWorkDays = workDays.size || 1; // avoid div by 0
        const doctorCallAverage = (totalDrCalls / numWorkDays).toFixed(1);
        const chemistCallAverage = (totalChemCalls / numWorkDays).toFixed(1);
        
        const coveragePercentage = totalDoctors > 0 ? Math.round((totalUniqueDoctorsVisited / totalDoctors) * 100) : 0;

        // Dummy compliance percentage for now (needs more complex parsing of categories)
        const compliancePercentage = coveragePercentage; 

        const numNonCore = myDoctors.filter(d => d.category === 'C' || d.category === 'D').length;
        const numCore = myDoctors.filter(d => d.category === 'B' || d.category === 'A').length;
        const numSuperCore = myDoctors.filter(d => d.category === 'A+').length;

        res.json({
            success: true,
            data: {
                totalDoctors,
                totalDrCalls,
                totalUniqueDoctorsVisited,
                totalMissedDoctors,
                numNonCore,
                numCore,
                numSuperCore,
                doctorCallAverage,
                coveragePercentage,
                compliancePercentage,
                totalChemists,
                totalChemCalls,
                chemistCallAverage,
                totalStockists,
                totalStockCalls
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to calculate effort analysis' });
    }
});

// Get team members for Line Manager
router.get('/performance/my-team', async (req, res) => {
    try {
        const { employeeId, email, userId } = req.query;
        const empIdentifier = employeeId || email || userId;
        if (!empIdentifier) {
            return res.status(400).json({ success: false, message: 'Employee identifier required' });
        }

        const { XlUser } = require('../db');
        const { Op } = require('sequelize');

        let mgrUser = null;
        if (userId) {
            mgrUser = await XlUser.findByPk(userId);
        }
        if (!mgrUser && empIdentifier) {
            mgrUser = await XlUser.findOne({
                where: { [Op.or]: [{ employeeId: empIdentifier }, { email: empIdentifier }, { uid: empIdentifier }] }
            });
        }

        if (!mgrUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const effectiveDesig = mgrUser.designation || '';
        const effectiveHq = mgrUser.hq || '';
        const effectiveDiv = mgrUser.division || '';
        const isAdmin = effectiveDesig.toUpperCase() === 'ADMIN' || !!mgrUser.isAdmin;

        let team = [];
        if (isAdmin) {
            team = await XlUser.findAll({
                where: { 
                    status: { [Op.ne]: 'Deactivated' },
                    _id: { [Op.ne]: mgrUser._id }
                },
                order: [['firstName', 'ASC']]
            });
        } else {
            team = await getReporteeUsers(effectiveDesig, effectiveHq, effectiveDiv, [], new Set(), mgrUser);
        }

        const formattedTeam = (team || []).map(u => ({
            _id: u._id,
            employeeId: u.employeeId,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email,
            designation: u.designation,
            hq: u.hq
        })).filter(u => u.employeeId !== mgrUser.employeeId);

        res.json({
            success: true,
            isManager: isAdmin || formattedTeam.length > 0,
            user: {
                _id: mgrUser._id,
                employeeId: mgrUser.employeeId,
                name: `${mgrUser.firstName || ''} ${mgrUser.lastName || ''}`.trim() || mgrUser.name || mgrUser.email,
                designation: mgrUser.designation,
                hq: mgrUser.hq
            },
            team: formattedTeam
        });
    } catch (err) {
        console.error('Error in /performance/my-team:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get complete week-wise Effort Breakdown Matrix
router.get('/performance/effort-matrix', async (req, res) => {
    try {
        const { month, year, employeeId, email, userId } = req.query;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Missing month or year' });
        }

        const { XlUser, XlDCR, XlDoctor, XlChemist, XlStockist } = require('../db');
        const { Op } = require('sequelize');

        let user = null;
        if (userId) {
            user = await XlUser.findByPk(userId);
        }
        if (!user && (employeeId || email)) {
            const targetId = employeeId || email;
            user = await XlUser.findOne({
                where: {
                    [Op.or]: [{ employeeId: targetId }, { email: targetId }, { uid: targetId }]
                }
            });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const monthMap = {
            'january': 'Jan', 'jan': 'Jan', '01': 'Jan', '1': 'Jan',
            'february': 'Feb', 'feb': 'Feb', '02': 'Feb', '2': 'Feb',
            'march': 'Mar', 'mar': 'Mar', '03': 'Mar', '3': 'Mar',
            'april': 'Apr', 'apr': 'Apr', '04': 'Apr', '4': 'Apr',
            'may': 'May', '05': 'May', '5': 'May',
            'june': 'Jun', 'jun': 'Jun', '06': 'Jun', '6': 'Jun',
            'july': 'Jul', 'jul': 'Jul', '07': 'Jul', '7': 'Jul',
            'august': 'Aug', 'aug': 'Aug', '08': 'Aug', '8': 'Aug',
            'september': 'Sep', 'sep': 'Sep', '09': 'Sep', '9': 'Sep',
            'october': 'Oct', 'oct': 'Oct', '10': 'Oct', '10': 'Oct',
            'november': 'Nov', 'nov': 'Nov', '11': 'Nov', '11': 'Nov',
            'december': 'Dec', 'dec': 'Dec', '12': 'Dec', '12': 'Dec'
        };
        const rawM = (month || '').trim().toLowerCase();
        const shortMonth = monthMap[rawM] || (rawM.slice(0, 1).toUpperCase() + rawM.slice(1, 3));

        const effortMatrix = await buildEffortMatrix(user, shortMonth, String(year), XlDCR, XlDoctor, XlChemist, XlStockist);

        const totalDocsRow = effortMatrix.find(r => r.label === 'Total Doctors');
        const totalDocs = totalDocsRow ? totalDocsRow.data[6] : 0;
        const drCalls = effortMatrix.find(r => r.label === 'Doctors Call')?.data[6] || 0;
        const drUnique = effortMatrix.find(r => r.label === 'Unique Doctors Visited')?.data[6] || 0;
        const drMissed = effortMatrix.find(r => r.label === 'Missed Doctors')?.data[6] || 0;
        const nonCore = effortMatrix.find(r => r.label === 'Non-Core Doctors (Met/Total)')?.data[6] || '0 / 0';
        const core = effortMatrix.find(r => r.label === 'Core Doctors (Met/Total)')?.data[6] || '0 / 0';
        const superCore = effortMatrix.find(r => r.label === 'Super-Core Doctors (Met/Total)')?.data[6] || '0 / 0';
        const coverageVal = effortMatrix.find(r => r.label.includes('Coverage'))?.data[6] || 0;
        const complianceVal = effortMatrix.find(r => r.label.includes('Compliance'))?.data[6] || 0;

        res.json({
            success: true,
            user: {
                _id: user._id,
                employeeId: user.employeeId,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email,
                designation: user.designation,
                hq: user.hq
            },
            month: shortMonth,
            year: String(year),
            summary: {
                totalDoctors: totalDocs,
                totalDoctorsMet: drCalls,
                totalUniqueDoctors: drUnique,
                totalMissedDoctors: drMissed,
                totalNonCore: nonCore,
                totalCore: core,
                totalSuperCore: superCore,
                coverage: typeof coverageVal === 'number' ? coverageVal.toFixed(2) : coverageVal,
                compliance: typeof complianceVal === 'number' ? complianceVal.toFixed(2) : complianceVal
            },
            matrix: effortMatrix
        });
    } catch (err) {
        console.error('Error in /performance/effort-matrix:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Approvals API

// Get counts of pending approvals for all modules
router.get('/approvals/counts', async (req, res) => {
    try {
        const { designation, hq, division, employeeId, email, userAllotted } = req.query;
        let reporteeEmails = null;
        let subordinateHQs = [];

        const empIdentifier = employeeId || email || userAllotted || (req.user && (req.user.email || req.user.id));
        let mgrUser = null;
        if (empIdentifier) {
            mgrUser = await XlUser.findOne({
                where: { [Op.or]: [{ employeeId: empIdentifier }, { email: empIdentifier }, { uid: empIdentifier }] }
            });
        }

        const effectiveDesig = (mgrUser && mgrUser.designation) || designation || '';
        const effectiveHq = (mgrUser && mgrUser.hq) || hq || '';
        const effectiveDiv = (mgrUser && mgrUser.division) || division || '';
        const isAdmin = effectiveDesig.toUpperCase() === 'ADMIN' || (mgrUser && mgrUser.isAdmin);

        if (!isAdmin) {
            const reportees = await getReporteeUsers(effectiveDesig, effectiveHq, effectiveDiv, [], new Set(), mgrUser);
            const reporteeIdentifiers = [];
            for (const u of reportees) {
                if (u.employeeId) reporteeIdentifiers.push(u.employeeId);
                if (u.email) reporteeIdentifiers.push(u.email);
                if (u.uid) reporteeIdentifiers.push(u.uid);
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                if (fullName) reporteeIdentifiers.push(fullName);
            }
            reporteeEmails = Array.from(new Set(reporteeIdentifiers.filter(Boolean)));
            subordinateHQs = await getSubordinateHQs(effectiveDesig, effectiveHq, effectiveDiv);
            if (effectiveHq) {
                subordinateHQs.push(effectiveHq, effectiveHq.toUpperCase(), effectiveHq.toLowerCase());
            }
            if (reporteeEmails.length === 0 && subordinateHQs.length === 0) {
                return res.json({ success: true, counts: {} });
            }
        }

        const baseStatus = ['Submitted', 'Pending', 'pending', 'submitted', 'Re-Submitted', 're-submitted'];
        const empIn = (reporteeEmails && reporteeEmails.length > 0) ? { [Op.in]: reporteeEmails } : { [Op.in]: ['__NONE__'] };
        const empCondition = isAdmin 
            ? { status: baseStatus } 
            : { status: baseStatus, employeeId: empIn };
        
        const counts = {};
        const countErrors = {};
        const safeCount = async (name, fn) => {
            try {
                counts[name] = await fn();
            } catch (err) {
                console.error(`[Approvals Count] Error in ${name}:`, err.message);
                counts[name] = 0;
                countErrors[name] = err.message;
            }
        };

        const tourProgramCond = isAdmin ? { status: baseStatus } : {
            status: baseStatus,
            [Op.or]: [
                { employeeId: empIn },
                ...(subordinateHQs.length > 0 ? [{ hq: { [Op.in]: subordinateHQs } }] : [])
            ]
        };

        const chemistCond = isAdmin ? { status: baseStatus } : {
            status: baseStatus,
            [Op.or]: [
                { userAllotted: empIn },
                ...(subordinateHQs.length > 0 ? [{ headquarter: { [Op.in]: subordinateHQs } }] : [])
            ]
        };

        const stockistCond = isAdmin ? { status: baseStatus } : {
            status: baseStatus,
            [Op.or]: [
                { employeeId: empIn },
                { userAllotted: empIn },
                ...(subordinateHQs.length > 0 ? [{ headquarter: { [Op.in]: subordinateHQs } }] : [])
            ]
        };

        const locationCond = isAdmin ? { status: baseStatus } : {
            status: baseStatus,
            [Op.or]: [
                { employeeId: empIn },
                ...(subordinateHQs.length > 0 ? [{ hq: { [Op.in]: subordinateHQs } }] : [])
            ]
        };

        await safeCount('Call Report', async () => {
            const attendances = await require('../db').XlAttendance.findAll({ 
                where: { daySubmitted: true },
                attributes: ['employeeId', 'date'],
                raw: true 
            });
            const submittedDaysSet = new Set(attendances.map(a => `${a.employeeId}_${a.date}`));

            const callGroups = await XlDCR.findAll({
                where: empCondition,
                attributes: ['employeeId', 'date'],
                group: ['employeeId', 'date'],
                raw: true
            });
            return callGroups.filter(g => submittedDaysSet.has(`${g.employeeId}_${g.date}`)).length;
        });

        await safeCount('Tour Program', () => XlTourProgram.count({ where: tourProgramCond }));
        await safeCount('Call Plans', () => XlCallPlan.count({ where: empCondition }));
        await safeCount('Doctors', () => XlDoctor.count({ where: empCondition }));
        await safeCount('Chemists', () => XlChemist.count({ where: chemistCond }));
        await safeCount('Stockists', () => XlStockist.count({ where: stockistCond }));
        await safeCount('City', () => XlCity.count({ where: locationCond }));
        await safeCount('Routes', () => XlRoute.count({ where: locationCond }));

        await safeCount('Expense', async () => {
            const expenseGroups = await XlExpense.findAll({
                where: empCondition,
                attributes: ['employeeId', 'date'],
                group: ['employeeId', 'date'],
                raw: true
            });
            return expenseGroups.length;
        });

        await safeCount('Leave Request', () => XlLeave.count({ where: empCondition }));
        await safeCount('Primary Sales', () => XlPrimarySales.count({ where: empCondition }));
        await safeCount('Secondary Sales', () => XlSecondarySales.count({ where: empCondition }));
        await safeCount('Samples', () => XlSample.count({ where: empCondition }));
        await safeCount('Gifts', () => XlGift.count({ where: empCondition }));
        await safeCount('Geo Fencing', () => XlGeoFencing.count({ where: empCondition }));

        await safeCount('Performance KPI', () => XlPerformanceAnalysis.count({
            where: isAdmin 
                ? { planningSubmittedAt: { [Op.ne]: null } } 
                : { planningSubmittedAt: { [Op.ne]: null }, employeeId: empIn }
        }));
        
        res.json({ success: true, counts, ...(Object.keys(countErrors).length > 0 ? { countErrors } : {}) });
    } catch (e) {
        console.error('Approvals count error:', e);
        res.status(500).json({ error: 'Failed to fetch counts', message: e.message, stack: e.stack });
    }
});

router.get('/approvals/pending', async (req, res) => {
    try {
        const { type, designation, hq, division, status, employeeId, email, userAllotted } = req.query;
        let reporteeEmails = null;
        let subordinateHQs = [];

        const empIdentifier = employeeId || email || userAllotted || (req.user && (req.user.email || req.user.id));
        let mgrUser = null;
        if (empIdentifier) {
            mgrUser = await XlUser.findOne({
                where: { [Op.or]: [{ employeeId: empIdentifier }, { email: empIdentifier }, { uid: empIdentifier }] }
            });
        }

        const effectiveDesig = (mgrUser && mgrUser.designation) || designation || '';
        const effectiveHq = (mgrUser && mgrUser.hq) || hq || '';
        const effectiveDiv = (mgrUser && mgrUser.division) || division || '';
        const isAdmin = effectiveDesig.toUpperCase() === 'ADMIN' || (mgrUser && mgrUser.isAdmin);

        if (!isAdmin) {
            const reportees = await getReporteeUsers(effectiveDesig, effectiveHq, effectiveDiv, [], new Set(), mgrUser);
            const reporteeIdentifiers = [];
            for (const u of reportees) {
                if (u.employeeId) reporteeIdentifiers.push(u.employeeId);
                if (u.email) reporteeIdentifiers.push(u.email);
                if (u.uid) reporteeIdentifiers.push(u.uid);
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                if (fullName) reporteeIdentifiers.push(fullName);
            }
            reporteeEmails = Array.from(new Set(reporteeIdentifiers.filter(Boolean)));
            subordinateHQs = await getSubordinateHQs(effectiveDesig, effectiveHq, effectiveDiv);
            if (effectiveHq) {
                subordinateHQs.push(effectiveHq, effectiveHq.toUpperCase(), effectiveHq.toLowerCase());
            }
            if (reporteeEmails.length === 0 && subordinateHQs.length === 0) {
                return res.json({ success: true, data: [] });
            }
        }

        if (type === 'Performance KPI') {
            const empIn = (reporteeEmails && reporteeEmails.length > 0) ? { [Op.in]: reporteeEmails } : { [Op.in]: ['__NONE__'] };
            const perfs = await XlPerformanceAnalysis.findAll({
                where: {
                    ...(isAdmin ? {} : { employeeId: empIn }),
                    planningSubmittedAt: { [Op.ne]: null }
                },
                raw: true
            });
            const allUsers = await XlUser.findAll({ raw: true });
            const userMap = {};
            allUsers.forEach(u => {
                userMap[u.employeeId] = { name: (u.firstName + ' ' + (u.lastName || '')).trim(), hq: u.hq };
            });

            const formatted = perfs.map(p => ({
                ...p,
                status: 'Submitted',
                employeeName: userMap[p.employeeId]?.name || p.employeeId,
                hq: userMap[p.employeeId]?.hq || 'Unknown HQ'
            }));
            return res.json({ success: true, data: formatted });
        }

        let Model;
        if (type === 'Call Report') Model = XlDCR;
        else if (type === 'Tour Program') Model = XlTourProgram;
        else if (type === 'Call Plans') Model = XlCallPlan;
        else if (type === 'Doctors') Model = XlDoctor;
        else if (type === 'Chemists') Model = XlChemist;
        else if (type === 'Stockists') Model = XlStockist;
        else if (type === 'Expense') Model = XlExpense;
        else if (type === 'Leave Request') Model = XlLeave;
        else if (type === 'City') Model = XlCity;
        else if (type === 'Routes' || type === 'Route') Model = XlRoute;
        else if (type === 'Samples') Model = XlSample;
        else if (type === 'Gifts') Model = XlGift;
        else if (type === 'Primary Sales') Model = XlPrimarySales;
        else if (type === 'Secondary Sales') Model = XlSecondarySales;
        else if (type === 'Geo Fencing') Model = XlGeoFencing;
        else return res.status(400).json({ error: 'Invalid module type' });

        if (type === 'Routes' || type === 'Route') {
            try {
                await XlRoute.update(
                    { status: 'Pending' },
                    { 
                        where: { 
                            status: 'Active', 
                            employeeId: { [Op.ne]: null, [Op.ne]: '' } 
                        } 
                    }
                );
            } catch(e){}
        }

        let userFilter = {};
        if (!isAdmin) {
            const empIn = (reporteeEmails && reporteeEmails.length > 0) ? { [Op.in]: reporteeEmails } : { [Op.in]: ['__NONE__'] };
            if (type === 'Chemists') {
                userFilter = {
                    [Op.or]: [
                        { userAllotted: empIn },
                        ...(subordinateHQs.length > 0 ? [{ headquarter: { [Op.in]: subordinateHQs } }] : [])
                    ]
                };
            } else if (type === 'Stockists') {
                userFilter = {
                    [Op.or]: [
                        { employeeId: empIn },
                        { userAllotted: empIn },
                        ...(subordinateHQs.length > 0 ? [{ headquarter: { [Op.in]: subordinateHQs } }] : [])
                    ]
                };
            } else if (type === 'Tour Program' || type === 'City' || type === 'Routes' || type === 'Route') {
                userFilter = {
                    [Op.or]: [
                        { employeeId: empIn },
                        ...(subordinateHQs.length > 0 ? [{ hq: { [Op.in]: subordinateHQs } }] : [])
                    ]
                };
            } else {
                userFilter = { employeeId: empIn };
            }
        }

        const pending = await Model.findAll({ 
            where: { 
                ...userFilter, 
                ...(status === 'History' ? {
                    status: { [Op.notIn]: ['Pending', 'Submitted', 'pending', 'submitted'] }
                } : {
                    [Op.or]: [
                        { status: ['Pending', 'Submitted', 'pending', 'submitted', 'Re-Submitted', 're-submitted'] },
                        { status: null }
                    ]
                })
            }, 
            order: [['createdAt', 'DESC']] 
        });
        
        const data = [];
        const allBacklogs = type === 'Call Report' ? await require('../db').XlBacklogRequest.findAll({ where: { status: 'Approved' } }) : [];
        const attendances = type === 'Call Report' && status !== 'History' ? await require('../db').XlAttendance.findAll({ where: { daySubmitted: true } }) : [];

        if (type === 'Call Report') {
            const grouped = {};
            for (const p of pending) {
                const pData = p.toJSON();
                if (status !== 'History') {
                    const isDaySubmitted = attendances.some(a => a.employeeId === pData.employeeId && a.date === pData.date);
                    if (!isDaySubmitted) continue;
                }
                const key = `${pData.employeeId}_${pData.date}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        _id: key,
                        employeeId: pData.employeeId,
                        date: pData.date,
                        status: pData.status || 'Pending',
                        calls: [],
                        isBacklog: allBacklogs.some(b => b.employeeId === pData.employeeId && b.date === pData.date),
                        workArea: pData.workingAreas || pData.workingAreaType || 'HQ'
                    };
                }
                grouped[key].calls.push(pData);
            }

            for (const k of Object.keys(grouped)) {
                const g = grouped[k];
                const empId = g.employeeId;
                const u = await XlUser.findOne({ where: { [Op.or]: [{ employeeId: empId }, { uid: empId }, { email: empId }] } });
                if (u) {
                    g.employeeName = ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.name || empId;
                    g.hq = u.hq || 'HQ';
                    g.designation = u.designation || '-';
                } else {
                    g.employeeName = empId;
                    g.hq = 'HQ';
                }

                g.doctorCalls = g.calls.filter(c => c.entityType === 'Doctor' || (!c.entityType && (c.entityName?.toLowerCase().startsWith('dr') || c.entityName?.toLowerCase().includes('dr.'))));
                g.chemistCalls = g.calls.filter(c => c.entityType === 'Chemist');
                g.stockistCalls = g.calls.filter(c => c.entityType === 'Stockist');

                g.doctorCount = g.doctorCalls.length;
                g.chemistCount = g.chemistCalls.length;
                g.stockistCount = g.stockistCalls.length;

                data.push(g);
            }

            return res.json({ success: true, data });
        }

        if (type === 'Expense') {
            const grouped = {};
            for (const p of pending) {
                const pData = p.toJSON();
                const key = `${pData.employeeId}_${pData.date}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        _id: key,
                        employeeId: pData.employeeId,
                        date: pData.date,
                        status: pData.status || 'Pending',
                        expenses: [],
                        totalAmount: 0,
                        receipts: [],
                        areaType: pData.workingAreaType || pData.areaType || 'HQ',
                        workAreas: pData.workingAreas || pData.workAreas || '-'
                    };
                }
                grouped[key].expenses.push(pData);
                grouped[key].totalAmount += parseFloat(pData.amount || 0);
                if (pData.receiptImage && !grouped[key].receipts.includes(pData.receiptImage)) {
                    grouped[key].receipts.push(pData.receiptImage);
                }
            }

            for (const k of Object.keys(grouped)) {
                const g = grouped[k];
                const empId = g.employeeId;
                const u = await XlUser.findOne({ where: { [Op.or]: [{ employeeId: empId }, { uid: empId }, { email: empId }] } });
                if (u) {
                    g.employeeName = ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.name || empId;
                    g.hq = u.hq || 'HQ';
                    g.designation = u.designation || '-';
                } else {
                    g.employeeName = empId;
                    g.hq = 'HQ';
                }
                g.totalAmount = Math.round(g.totalAmount * 100) / 100;
                data.push(g);
            }

            return res.json({ success: true, data });
        }

        if (type === 'Call Plans') {
            const { XlDoctor: PDoctor, XlChemist: PChemist, XlStockist: PStockist } = require('../db');
            const bulkDocIds = new Set();
            const bulkChemIds = new Set();
            const bulkStockIds = new Set();

            pending.forEach(p => {
                const parseSafe = (f) => {
                    try {
                        const parsed = typeof f === 'string' ? JSON.parse(f) : f;
                        return Array.isArray(parsed) ? parsed : Object.values(parsed || {});
                    } catch(e) { return []; }
                };
                parseSafe(p.doctors).forEach(d => {
                    const id = typeof d === 'string' ? d : (d.id || d._id || d.doctorId);
                    if (id && !String(id).startsWith('slot_open_')) bulkDocIds.add(id);
                });
                parseSafe(p.chemists).forEach(c => {
                    const id = typeof c === 'string' ? c : (c.id || c._id || c.chemistId);
                    if (id) bulkChemIds.add(id);
                });
                parseSafe(p.stockists).forEach(s => {
                    const id = typeof s === 'string' ? s : (s.id || s._id || s.stockistId);
                    if (id) bulkStockIds.add(id);
                });
            });

            const fetchedDocs = bulkDocIds.size > 0 ? await PDoctor.findAll({ where: { _id: Array.from(bulkDocIds) }, attributes: ['_id', 'name', 'hospital', 'workingArea', 'category'] }) : [];
            const pDocMap = new Map();
            fetchedDocs.forEach(d => pDocMap.set(d._id, d));

            const fetchedChems = bulkChemIds.size > 0 ? await PChemist.findAll({ where: { _id: Array.from(bulkChemIds) }, attributes: ['_id', 'businessName', 'proprietorName', 'workingArea'] }) : [];
            const pChemMap = new Map();
            fetchedChems.forEach(c => pChemMap.set(c._id, c));

            const fetchedStocks = bulkStockIds.size > 0 ? await PStockist.findAll({ where: { _id: Array.from(bulkStockIds) }, attributes: ['_id', 'name', 'businessName', 'workingArea'] }) : [];
            const pStockMap = new Map();
            fetchedStocks.forEach(s => pStockMap.set(s._id, s));

            for (const p of pending) {
                const pData = p.toJSON();
                let docList = [];
                let chemList = [];
                let stockList = [];
                try { docList = typeof pData.doctors === 'string' ? JSON.parse(pData.doctors || '[]') : (pData.doctors || []); } catch(e){}
                try { chemList = typeof pData.chemists === 'string' ? JSON.parse(pData.chemists || '[]') : (pData.chemists || []); } catch(e){}
                try { stockList = typeof pData.stockists === 'string' ? JSON.parse(pData.stockists || '[]') : (pData.stockists || []); } catch(e){}
                if (!Array.isArray(docList)) docList = Object.values(docList || {});
                if (!Array.isArray(chemList)) chemList = Object.values(chemList || {});
                if (!Array.isArray(stockList)) stockList = Object.values(stockList || {});

                const empId = pData.employeeId || pData.userAllotted;
                if (empId) {
                    const u = await XlUser.findOne({ where: { [Op.or]: [{ employeeId: empId }, { uid: empId }, { email: empId }] } });
                    if (u) {
                        pData.employeeName = pData.employeeName || ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.name;
                        pData.employeeEmail = pData.employeeEmail || u.email;
                        pData.designation = u.designation || '-';
                        pData.reportingManager = u.reportingManager || '-';
                        pData.hq = pData.headquarter || pData.hq || u.hq || 'HQ';
                    }
                }

                pData.parsedDoctors = docList.map(d => {
                    const id = typeof d === 'string' ? d : (d.id || d._id || d.doctorId || '');
                    const dMaster = pDocMap.get(id);
                    const rawName = typeof d === 'object' ? (d.name || d.doctorName || '') : '';
                    const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
                    const name = (dMaster ? dMaster.name : (!isNameAnId ? rawName : null)) || (id.startsWith('slot_open_') ? '(Open Slot - Pending Doctor Addition)' : `Doctor (${id})`);
                    const info = (dMaster ? (dMaster.workingArea || dMaster.hospital || '') : (typeof d === 'object' && d.info && d.info !== 'Imported' ? d.info : '')) || '';
                    return {
                        id,
                        _id: id,
                        name,
                        doctorName: name,
                        info,
                        category: dMaster ? dMaster.category : (typeof d === 'object' ? d.category : 'General'),
                        hospital: dMaster ? (dMaster.hospital || '-') : (typeof d === 'object' ? (d.hospital || '-') : '-'),
                        workingArea: dMaster ? (dMaster.workingArea || '-') : (typeof d === 'object' ? (d.workingArea || '-') : '-'),
                        shifts: typeof d === 'object' ? (d.shifts || (d.shift ? [d.shift] : [])) : [],
                        priority: typeof d === 'object' ? (d.priority || '') : '',
                        samples: typeof d === 'object' && d.samples ? d.samples : [],
                        gifts: typeof d === 'object' && d.gifts ? d.gifts : []
                    };
                });

                pData.parsedChemists = chemList.map(c => {
                    const id = typeof c === 'string' ? c : (c.id || c._id || c.chemistId || '');
                    const cMaster = pChemMap.get(id);
                    const rawName = typeof c === 'object' ? (c.name || c.businessName || c.chemistName || '') : '';
                    const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
                    const name = (cMaster ? (cMaster.name || cMaster.businessName) : (!isNameAnId ? rawName : null)) || `Chemist (${id})`;
                    const info = (cMaster ? (cMaster.workingArea || '') : (typeof c === 'object' && c.info && c.info !== 'Imported' ? c.info : '')) || '';
                    return {
                        id,
                        _id: id,
                        name,
                        chemistName: name,
                        info,
                        workingArea: cMaster ? (cMaster.workingArea || '-') : (typeof c === 'object' ? (c.workingArea || '-') : '-')
                    };
                });

                pData.parsedStockists = stockList.map(s => {
                    const id = typeof s === 'string' ? s : (s.id || s._id || s.stockistId || '');
                    const sMaster = pStockMap.get(id);
                    const rawName = typeof s === 'object' ? (s.name || s.businessName || s.stockistName || '') : '';
                    const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
                    const name = (sMaster ? (sMaster.name || sMaster.businessName) : (!isNameAnId ? rawName : null)) || `Stockist (${id})`;
                    const info = (sMaster ? (sMaster.workingArea || '') : (typeof s === 'object' && s.info && s.info !== 'Imported' ? s.info : '')) || '';
                    return {
                        id,
                        _id: id,
                        name,
                        stockistName: name,
                        info,
                        workingArea: sMaster ? (sMaster.workingArea || '-') : (typeof s === 'object' ? (s.workingArea || '-') : '-')
                    };
                });

                pData.doctors = JSON.stringify(pData.parsedDoctors);
                pData.chemists = JSON.stringify(pData.parsedChemists);
                pData.stockists = JSON.stringify(pData.parsedStockists);
                pData.doctorCount = pData.parsedDoctors.length;
                pData.chemistCount = pData.parsedChemists.length;
                pData.stockistCount = pData.parsedStockists.length;

                data.push(pData);
            }
            return res.json({ success: true, data });
        }

        for (const p of pending) {
            const pData = p.toJSON();
            if (type === 'Call Report') {
                if (status !== 'History') {
                    const isDaySubmitted = attendances.some(a => a.employeeId === pData.employeeId && a.date === pData.date);
                    if (!isDaySubmitted) continue;
                }
                pData.isBacklog = allBacklogs.some(b => b.employeeId === pData.employeeId && b.date === pData.date);
            }
            const empId = pData.employeeId || pData.userAllotted;
            if (empId) {
                const u = await XlUser.findOne({ where: { [Op.or]: [{ employeeId: empId }, { uid: empId }, { email: empId }] } });
                if (u) {
                    pData.employeeName = pData.employeeName || ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.name;
                    pData.employeeEmail = pData.employeeEmail || u.email;
                    pData.designation = u.designation || '-';
                    pData.reportingManager = u.reportingManager || '-';
                    pData.hq = pData.headquarter || pData.hq || u.hq || 'HQ';
                }
            }
            if (!pData.date && pData.createdAt) {
                try {
                    pData.date = typeof pData.createdAt === 'string' ? pData.createdAt.split('T')[0] : new Date(pData.createdAt).toISOString().split('T')[0];
                } catch(e) {}
            }
            pData.hq = pData.headquarter || pData.hq || 'HQ';
            if (!pData.employeeName || pData.employeeName === '-' || pData.employeeName.trim() === '') {
                try {
                    if (pData.hq) {
                        const cleanHq = pData.hq.trim().toLowerCase();
                        const { sequelize: dbSequelize } = require('../db');
                        const uByHq = await XlUser.findOne({
                            where: dbSequelize.where(dbSequelize.fn('lower', dbSequelize.col('hq')), cleanHq)
                        });
                        if (uByHq) {
                            pData.employeeName = ((uByHq.firstName || '') + ' ' + (uByHq.lastName || '')).trim() || uByHq.name || uByHq.employeeId;
                            pData.employeeId = pData.employeeId || uByHq.employeeId;
                        } else {
                            pData.employeeName = 'Admin';
                        }
                    } else {
                        pData.employeeName = 'Admin';
                    }
                } catch (hqErr) {
                    pData.employeeName = 'Admin';
                }
            }
            if (!pData.businessName && pData.name) {
                pData.businessName = pData.name;
            }
            if (!pData.name && pData.businessName) {
                pData.name = pData.businessName;
            }

            if (type === 'City') {
                pData.name = pData.cityName || pData.name;
                pData.cityName = pData.cityName || pData.name;
                pData.headquarter = pData.hq || pData.headquarter;
                pData.hq = pData.hq || pData.headquarter;
            }

            if (type === 'Routes' || type === 'Route') {
                pData.name = `${pData.fromCity} → ${pData.toCity}`;
                pData.headquarter = pData.hq || pData.headquarter || '';
                pData.hq = pData.hq || pData.headquarter || '';
                pData.details = `${pData.fromCity} to ${pData.toCity} (${pData.areaType}, ${pData.distance} KM)`;
            }

            if ((type === 'Primary Sales' || type === 'Secondary Sales') && pData.stockist) {
                const st = await XlStockist.findOne({ where: { [Op.or]: [{ _id: pData.stockist }, { uid: pData.stockist }] } });
                if (st) {
                    pData.stockist = st.businessName || st.name || pData.stockist;
                    pData.headquarter = pData.headquarter || st.headquarter || '-';
                }
            }

            if (type === 'Geo Fencing') {
                let ent = null;
                if (pData.entityType === 'Doctor') ent = await XlDoctor.findOne({ where: { _id: pData.entityId }});
                else if (pData.entityType === 'Chemist') ent = await XlChemist.findOne({ where: { _id: pData.entityId }});
                else if (pData.entityType === 'Stockist') ent = await XlStockist.findOne({ where: { _id: pData.entityId }});
                
                pData.entityName = ent ? (ent.name || ent.businessName || ent.proprietorName || 'Unknown') : 'Unknown';
                pData.location = pData.geoAddress || `${pData.latitude}, ${pData.longitude}`;
            }

            if (type === 'Expense') {
                try {
                    const dateObj = new Date(pData.date);
                    const month = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
                    const year = String(dateObj.getFullYear());
                    const tp = await XlTourProgram.findOne({ where: { employeeId: pData.employeeId, month, year } });
                    if (tp && tp.entries) {
                        let entries = [];
                        try { entries = typeof tp.entries === 'string' ? JSON.parse(tp.entries) : tp.entries; } catch(e){}
                        const dayEntry = entries.find(e => {
                            if (e.dateStr) return e.dateStr === pData.date;
                            if (e.date) {
                                if (typeof e.date === 'string' && e.date.length === 10) return e.date === pData.date;
                                const d = new Date(e.date);
                                return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === pData.date;
                            }
                            return false;
                        });
                        if (dayEntry) {
                            pData.areaType = dayEntry.type || dayEntry.workAreaType || 'Out-Station';
                            pData.workAreas = dayEntry.toMarket || dayEntry.workingArea || dayEntry.workArea || '-';
                        }
                    }
                } catch(e) {
                    // ignore mapping error
                }
            }

            data.push(pData);
        }

        res.json({ success: true, data });
    } catch (e) {
        console.error('Pending approvals error:', e);
        res.status(500).json({ error: 'Failed to fetch pending approvals', message: e.message, stack: e.stack });
    }
});

router.post('/approvals/action', async (req, res) => {
    try {
        const { recordId, type, action, remarks, approvedBy } = req.body;
        let Model;
        if (type === 'Call Report') Model = XlDCR;
        else if (type === 'Tour Program') Model = XlTourProgram;
        else if (type === 'Call Plans') Model = XlCallPlan;
        else if (type === 'Doctors') Model = XlDoctor;
        else if (type === 'Chemists') Model = XlChemist;
        else if (type === 'Stockists') Model = XlStockist;
        else if (type === 'Expense') Model = XlExpense;
        else if (type === 'Leave Request') Model = XlLeave;
        else if (type === 'City') Model = XlCity;
        else if (type === 'Routes' || type === 'Route') Model = XlRoute;
        else if (type === 'Samples') Model = XlSample;
        else if (type === 'Gifts') Model = XlGift;
        else if (type === 'Primary Sales') Model = XlPrimarySales;
        else if (type === 'Secondary Sales') Model = XlSecondarySales;
        else if (type === 'Geo Fencing') Model = XlGeoFencing;
        else if (type !== 'CallReportGroup' && type !== 'ExpenseGroup') return res.status(400).json({ error: 'Invalid module type' });
        
        if (type === 'CallReportGroup' || (type === 'Call Report' && req.body.employeeId && req.body.date)) {
            const { employeeId, date } = req.body;
            const records = await XlDCR.findAll({ where: { employeeId, date, status: ['Pending', 'Submitted', 'pending', 'submitted'] } });
            
            for (const rec of records) {
                rec.status = action;
                if(action === 'Approved' && approvedBy) rec.approvedBy = approvedBy;
                rec.adminRemarks = remarks || rec.adminRemarks || '';
                await rec.save();
            }
            return res.json({ success: true, message: 'Successfully ' + action + ' call reports' });
        }
        
        if (type === 'ExpenseGroup' || (type === 'Expense' && req.body.employeeId && req.body.date)) {
            const { employeeId, date, miscExpense } = req.body;
            const records = await XlExpense.findAll({ where: { employeeId, date, status: ['Pending', 'Submitted', 'pending', 'submitted', 'Re-Submitted', 're-submitted'] } });
            
            for (const rec of records) {
                if (action === 'Deleted' || action === 'Delete') {
                    if (rec.receiptImage) deleteExpenseFiles(rec.receiptImage);
                    await rec.destroy();
                } else {
                    if (rec.category === 'Misc' && miscExpense !== undefined) {
                        rec.amount = parseFloat(miscExpense) || 0;
                    }
                    rec.status = action;
                if(action === 'Approved' && approvedBy) rec.approvedBy = approvedBy;
                    rec.remarks = remarks || rec.remarks || '';
                    await rec.save();
                }
            }
            
            if (miscExpense !== undefined && !records.some(r => r.category === 'Misc')) {
                await XlExpense.create({
                    _id: generateId(),
                    employeeId,
                    date,
                    amount: parseFloat(miscExpense) || 0,
                    category: 'Misc',
                    remarks: remarks || '',
                    status: action
                });
            }
            return res.json({ success: true, message: 'Successfully ' + action + ' expenses' });
        }

        const record = await Model.findByPk(recordId);
        if (!record) return res.status(404).json({ error: 'Record not found' });

        if (type === 'Tour Program' && req.body.dates && Array.isArray(req.body.dates)) {
            let entries = [];
            try { entries = JSON.parse(record.entries || '[]'); } catch(e){}
            if (!Array.isArray(entries)) entries = Object.values(entries);
            
            const normalizeDate = (d) => toStorageDate(d) || d || '';
            const reqDatesNorm = req.body.dates.map(normalizeDate);

            entries = entries.map(e => {
                const eNorm = normalizeDate(e.date);
                if (req.body.dates.includes(e.date) || (eNorm && reqDatesNorm.includes(eNorm))) {
                    return { ...e, status: action };
                }
                return e;
            });
            
            record.entries = JSON.stringify(entries);
            
            // Optionally update root status if all days are handled
            const allHandled = entries.every(e => e.status && e.status !== 'Pending' && e.status !== 'Submitted');
            if (allHandled) {
                const hasRejected = entries.some(e => e.status === 'Rejected');
                record.status = hasRejected ? 'Rejected' : 'Approved';
                if(!hasRejected && approvedBy) record.approvedBy = approvedBy;
            }
            
            record.adminRemarks = remarks || record.adminRemarks || '';
            await record.save();
        } else {
            if (type === 'Leave Request') {
                const { XlAssignedLeave } = require('../db');
                const oldStatus = record.status;
                
                if ((oldStatus === 'Pending' || oldStatus === 'Submitted' || oldStatus === 'pending' || !oldStatus) && action === 'Approved' && record.leaveType !== 'Leave Without Pay' && record.leaveType !== 'LWP') {
                    const sd = new Date(record.startDate);
                    const ed = new Date(record.endDate || record.startDate);
                    const days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
                    
                    const startMonth = sd.getMonth();
                    const startYear = sd.getFullYear();
                    const yearStr = startMonth >= 3 ? `${startYear}-${startYear+1}` : `${startYear-1}-${startYear}`;
                    
                    const assignment = await XlAssignedLeave.findOne({
                        where: { employeeId: record.employeeId, year: yearStr, leaveType: record.leaveType }
                    });
                    
                    if (assignment) {
                        assignment.used = (assignment.used || 0) + days;
                        await assignment.save();
                    }
                }
                
                // --- NEW LOGIC: INJECT INTO XlAttendance ---
                const { XlAttendance, XlUser } = require('../db');
                const generateId = () => Math.random().toString(36).substring(2, 15);
                const sd = new Date(record.startDate);
                const ed = new Date(record.endDate || record.startDate);
                
                let correctEmployeeId = record.employeeId;
                try {
                    // Try to convert email to employee code if it is an email
                    const users = await XlUser.findAll();
                      
    const lookupValRecord = record.employeeId ? record.employeeId.toLowerCase() : '';
    const xlUser = users.find(u => 
        (u.email && u.email.toLowerCase() === lookupValRecord) || 
        (u.uid && u.uid.toLowerCase() === lookupValRecord) || 
        (u.employeeId && u.employeeId.toLowerCase() === lookupValRecord)
    );

                    if (xlUser && xlUser.employeeId) {
                        correctEmployeeId = xlUser.employeeId;
                    }
                } catch (e) {
                    console.error("Failed to lookup employeeId", e);
                }

                if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
                    const dateList = [];
                    let curr = new Date(sd);
                    while (curr <= ed) {
                        const y = curr.getFullYear();
                        const m = String(curr.getMonth() + 1).padStart(2, '0');
                        const d = String(curr.getDate()).padStart(2, '0');
                        dateList.push(`${y}-${m}-${d}`);
                        curr.setDate(curr.getDate() + 1);
                    }
                    
                    const isLWP = record.leaveType === 'Leave Without Pay' || record.leaveType === 'LWP';

                    if (action === 'Approved') {
                        for (const dStr of dateList) {
                            const existing = await XlAttendance.findOne({ where: { employeeId: correctEmployeeId, date: dStr } });
                            if (existing) {
                                await existing.update({
                                    status: isLWP ? 'LWP' : 'Leave',
                                    punchInTime: 'Leave',
                                    punchOutTime: 'Leave',
                                    dayRemarks: 'Auto-approved Leave',
                                    daySubmitted: true
                                });
                            } else {
                                await XlAttendance.create({
                                    _id: generateId() + Date.now().toString(36),
                                    employeeId: correctEmployeeId,
                                    date: dStr,
                                    status: isLWP ? 'LWP' : 'Leave',
                                    punchInTime: 'Leave',
                                    punchOutTime: 'Leave',
                                    dayRemarks: 'Auto-approved Leave',
                                    daySubmitted: true
                                });
                            }
                        }
                    } else if (action === 'Revoked' || action === 'Rejected') {
                        for (const dStr of dateList) {
                            await XlAttendance.destroy({
                                where: {
                                    employeeId: correctEmployeeId,
                                    date: dStr
                                }
                            });
                        }
                    }
                }
                


                
                if (oldStatus === 'Approved' && action === 'Revoked' && record.leaveType !== 'Leave Without Pay' && record.leaveType !== 'LWP') {
                    const sd = new Date(record.startDate);
                    const ed = new Date(record.endDate || record.startDate);
                    const days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
                    
                    const startMonth = sd.getMonth();
                    const startYear = sd.getFullYear();
                    const yearStr = startMonth >= 3 ? `${startYear}-${startYear+1}` : `${startYear-1}-${startYear}`;
                    
                    const assignment = await XlAssignedLeave.findOne({
                        where: { employeeId: record.employeeId, year: yearStr, leaveType: record.leaveType }
                    });
                    if (assignment) {
                        assignment.used = Math.max(0, (assignment.used || 0) - days);
                        await assignment.save();
                    }
                }
            }

            if (action === 'Approved') {
                if (type === 'Doctors' && !record.uid) {
                    const max = await getMaxUID(XlDoctor, 'DOC');
                    record.uid = 'DOC' + (max + 1);
                } else if (type === 'Chemists' && !record.uid) {
                    try {
                        const max = await getMaxUID(XlChemist, 'CHM');
                        record.uid = 'CHM' + (max + 1);
                    } catch(e) {
                        record.uid = 'CHM' + Date.now();
                    }
                } else if (type === 'Stockists' && !record.uid) {
                    const max = await getMaxUID(XlStockist, 'STK');
                    record.uid = 'STK' + (max + 1);
                }
            }

            if (type === 'Tour Program') {
                let entries = [];
                try { entries = JSON.parse(record.entries || '[]'); } catch(e){}
                if (!Array.isArray(entries)) entries = Object.values(entries);
                entries = entries.map(e => ({ ...e, status: action }));
                record.entries = JSON.stringify(entries);
            }

            record.status = action;
            if(action === 'Approved' && approvedBy) record.approvedBy = approvedBy;
            record.adminRemarks = remarks || '';
            await record.save();
        }

        try {
            await XlNotification.create({
                employeeId: record.employeeId,
                title: 'Request ' + action,
                message: 'Your ' + type + ' request has been ' + action.toLowerCase() + '. ' + (remarks ? 'Remarks: ' + remarks : '')
            });
        } catch(ne) { console.error('Notification failed', ne); }
        res.json({ success: true, message: 'Successfully ' + action + ' record' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to process approval action' });
    }
});


router.get('/notifications', async (req, res) => {
    try {
        const { email } = req.query;
        const notifications = await XlNotification.findAll({ where: { employeeId: email }, order: [['createdAt', 'DESC']], limit: 50 });
        res.json({ success: true, data: notifications });
    } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/notifications/clear', async (req, res) => {
    try {
        const { email } = req.body;
        await XlNotification.destroy({ where: { employeeId: email } });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/notifications/read', async (req, res) => {
    try {
        const { email } = req.body;
        await XlNotification.update({ isRead: true }, { where: { employeeId: email, isRead: false } });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/vacancies', async (req, res) => {
    try {
        const { designation } = req.query;
        if (!designation) return res.json({ success: true, data: [] });
        
        const subHQs = await getSubordinateHQs(designation, req.query.hq || hq);
        if (subHQs.length === 0) return res.json({ success: true, data: [] });

        const { XlVacancyLog } = require('../db');
        if (!XlVacancyLog) return res.json({ success: true, data: [] });

        // Only return currently vacant HQs in their hierarchy
        const vacancies = await XlVacancyLog.findAll({
            where: {
                headquarter: { [Op.in]: subHQs },
                vacantTo: null
            },
            order: [['vacantFrom', 'DESC']]
        });

        // Calculate current days vacant for display
        const enriched = vacancies.map(v => {
            const days = Math.max(0, Math.round((new Date() - new Date(v.vacantFrom)) / (1000 * 60 * 60 * 24)));
            return { ...v.toJSON(), currentDaysVacant: days };
        });

        res.json({ success: true, data: enriched });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch vacancies' });
    }
});


// Call Plan Routes
router.get('/call-plan/month', async (req, res) => {
    try {
        const { email, month, year } = req.query; // employeeId is actually passed as email
        if (!email || !month || !year) return res.status(400).json({ error: 'Missing parameters' });
        
        const { Op } = require('sequelize');
        
        const userForId = await XlUser.findOne({ where: { employeeId: email } }) || 
                          await XlUser.findOne({ where: { email } }) || 
                          await XlUser.findOne({ where: { uid: email } });
        let idArray = [email];
        if (userForId) {
            if (userForId.employeeId) idArray.push(userForId.employeeId);
            if (userForId.email) idArray.push(userForId.email);
            if (userForId.uid) idArray.push(userForId.uid);
        }
        idArray = Array.from(new Set(idArray));
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const _ld = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month.padStart(2, '0')}-${String(_ld).padStart(2, '0')}`;
        
        const plans = await XlCallPlan.findAll({
            where: {
                employeeId: { [Op.in]: idArray },
                date: { [Op.between]: [startDate, endDate] }
            },
            order: [['date', 'ASC']]
        });

        // Auto-hydrate doctor, chemist, stockist names from master tables
        const { XlDoctor, XlChemist, XlStockist } = require('../db');
        const allDocIds = new Set();
        const allChemIds = new Set();
        const allStockIds = new Set();

        plans.forEach(p => {
            const parseSafe = (f) => {
                try {
                    const parsed = typeof f === 'string' ? JSON.parse(f) : f;
                    return Array.isArray(parsed) ? parsed : [];
                } catch(e) { return []; }
            };
            parseSafe(p.doctors).forEach(d => {
                const id = typeof d === 'string' ? d : (d.id || d._id);
                if (id && !id.startsWith('slot_open_')) allDocIds.add(id);
            });
            parseSafe(p.chemists).forEach(c => {
                const id = typeof c === 'string' ? c : (c.id || c._id);
                if (id) allChemIds.add(id);
            });
            parseSafe(p.stockists).forEach(s => {
                const id = typeof s === 'string' ? s : (s.id || s._id);
                if (id) allStockIds.add(id);
            });
        });

        const dbDocs = allDocIds.size > 0 ? await XlDoctor.findAll({ where: { _id: { [Op.in]: Array.from(allDocIds) } }, attributes: ['_id', 'name', 'hospital', 'workingArea', 'category'] }) : [];
        const docMap = new Map();
        dbDocs.forEach(d => docMap.set(d._id, d));

        const dbChems = allChemIds.size > 0 ? await XlChemist.findAll({ where: { _id: { [Op.in]: Array.from(allChemIds) } }, attributes: ['_id', 'businessName', 'proprietorName', 'workingArea'] }) : [];
        const chemMap = new Map();
        dbChems.forEach(c => chemMap.set(c._id, c));

        const dbStocks = allStockIds.size > 0 ? await XlStockist.findAll({ where: { _id: { [Op.in]: Array.from(allStockIds) } }, attributes: ['_id', 'name', 'businessName', 'workingArea'] }) : [];
        const stockMap = new Map();
        dbStocks.forEach(s => stockMap.set(s._id, s));

        const hydratedPlans = plans.map(p => {
            const pObj = p.toJSON ? p.toJSON() : { ...p };
            const parseSafe = (f) => {
                try {
                    const parsed = typeof f === 'string' ? JSON.parse(f) : f;
                    return Array.isArray(parsed) ? parsed : [];
                } catch(e) { return []; }
            };

            const docs = parseSafe(pObj.doctors).map(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id);
                const d = docMap.get(id);
                if (d) {
                    return {
                        id: d._id,
                        _id: d._id,
                        name: d.name,
                        doctorName: d.name,
                        category: d.category,
                        hospital: d.hospital || '-',
                        workingArea: d.workingArea || '-',
                        info: d.workingArea || d.hospital || '',
                        samples: (typeof item === 'object' && item.samples) ? item.samples : [],
                        gifts: (typeof item === 'object' && item.gifts) ? item.gifts : []
                    };
                }
                if (typeof item === 'string' && item.startsWith('slot_open_')) {
                    return {
                        id: item,
                        _id: item,
                        name: '(Open Slot - Pending Doctor Addition)',
                        category: 'Open Slot',
                        hospital: 'Dedicated for Tour Market',
                        workingArea: 'Ex-Market',
                        info: 'Open Slot'
                    };
                }
                return item;
            });
            pObj.doctors = JSON.stringify(docs);

            const chems = parseSafe(pObj.chemists).map(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id);
                const c = chemMap.get(id);
                if (c) {
                    return {
                        id: c._id,
                        _id: c._id,
                        name: c.name || c.businessName,
                        workingArea: c.workingArea || '-',
                        info: c.workingArea || ''
                    };
                }
                return item;
            });
            pObj.chemists = JSON.stringify(chems);

            const stocks = parseSafe(pObj.stockists).map(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id);
                const s = stockMap.get(id);
                if (s) {
                    return {
                        id: s._id,
                        _id: s._id,
                        name: s.name || s.businessName,
                        workingArea: s.workingArea || '-',
                        info: s.workingArea || ''
                    };
                }
                return item;
            });
            pObj.stockists = JSON.stringify(stocks);

            return pObj;
        });
        
        res.json({ success: true, data: hydratedPlans });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch call plans' });
    }
});

router.post('/call-plan/bulk', async (req, res) => {
    try {
        const { employeeId, dates, doctors, chemists, stockists } = req.body;
        if (!employeeId || !dates || !Array.isArray(dates)) return res.status(400).json({ error: 'Invalid payload' });

        const userForId = await XlUser.findOne({ where: { employeeId } }) || 
                          await XlUser.findOne({ where: { email: employeeId } }) || 
                          await XlUser.findOne({ where: { uid: employeeId } });
        let idArray = [employeeId];
        if (userForId) {
            if (userForId.employeeId) idArray.push(userForId.employeeId);
            if (userForId.email) idArray.push(userForId.email);
            if (userForId.uid) idArray.push(userForId.uid);
        }
        idArray = Array.from(new Set(idArray));

        const normalizeDate = (d) => toStorageDate(d) || d || '';

        // --- STRICT TP DATE CHECK ---
        for (const date of dates) {
            const sDate = normalizeDate(date);
            const dObj = new Date(sDate + 'T00:00:00');
            const monthLong = dObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
            const monthShort = dObj.toLocaleString('en-US', { month: 'short' }).toLowerCase();
            const monthNum = String(dObj.getMonth() + 1);
            const monthNumPad = monthNum.padStart(2, '0');
            const tpYear = String(dObj.getFullYear());
            
            const approvedTp = await XlTourProgram.findOne({
                where: {
                    employeeId: { [Op.in]: idArray },
                    year: tpYear,
                    status: { [Op.in]: ['Submitted', 'Approved'] },
                    [Op.or]: [
                        sequelize.where(sequelize.fn('lower', sequelize.col('month')), monthLong),
                        sequelize.where(sequelize.fn('lower', sequelize.col('month')), monthShort),
                        { month: monthNum },
                        { month: monthNumPad }
                    ]
                }
            });

            if (!approvedTp) {
                return res.json({ success: false, message: `You must have a Submitted or Approved Tour Program for ${monthLong} ${tpYear} before submitting Call Plans.` });
            }
            
            let tpEntries = [];
            try { tpEntries = JSON.parse(approvedTp.entries || '[]'); } catch(e){}
            if (!Array.isArray(tpEntries)) tpEntries = Object.values(tpEntries);

            const matchingEntry = tpEntries.find(e => normalizeDate(e.date) === sDate);

            if (!matchingEntry) {
                return res.json({ success: false, message: `Cannot submit Call Plan for ${date} because it is not planned as a working day in your Tour Program.` });
            }

            if (matchingEntry.activityType === 'Leave' || matchingEntry.type === 'Holiday' || matchingEntry.activityType === 'Holiday' || matchingEntry.type === 'SUNDAY') {
                return res.json({ success: false, message: `Cannot submit Call Plan for ${date} because it is marked as ${matchingEntry.activityType || matchingEntry.type} in your Tour Program.` });
            }
        }
        // ----------------------------

        // --- HOLIDAY CHECK ---
        if (userForId && userForId.state) {
            const holidays = await XlHoliday.findAll({
                where: {
                    [Op.or]: [
                        { state: userForId.state },
                        { state: null },
                        { state: 'All' },
                        { state: 'N/A' },
                        { state: '' }
                    ]
                }
            });
            const holidayDates = new Set(holidays.map(h => normalizeDate(h.date)));
            const invalidDates = dates.filter(d => holidayDates.has(normalizeDate(d)));
            if (invalidDates.length > 0) {
                return res.json({ success: false, message: 'Cannot submit Call Plan on a Holiday: ' + invalidDates.join(', ') });
            }
        }
        // -----------------------
        
        const isAdminCallPlan = !!req.body.fromAdmin || req.body.status === 'Approved';
        const planStatus = isAdminCallPlan ? 'Approved' : 'Submitted';

        const { XlDoctor: BDoctor, XlChemist: BChemist, XlStockist: BStockist } = require('../db');
        const inDocIds = (doctors || []).map(d => typeof d === 'string' ? d : (d.id || d._id)).filter(id => id && !String(id).startsWith('slot_open_'));
        const inChemIds = (chemists || []).map(c => typeof c === 'string' ? c : (c.id || c._id)).filter(Boolean);
        const inStockIds = (stockists || []).map(s => typeof s === 'string' ? s : (s.id || s._id)).filter(Boolean);

        const bDocs = inDocIds.length > 0 ? await BDoctor.findAll({ where: { _id: inDocIds }, attributes: ['_id', 'name', 'hospital', 'workingArea', 'category'] }) : [];
        const bDocMap = new Map();
        bDocs.forEach(d => bDocMap.set(d._id, d));

        const bChems = inChemIds.length > 0 ? await BChemist.findAll({ where: { _id: inChemIds }, attributes: ['_id', 'businessName', 'proprietorName', 'workingArea'] }) : [];
        const bChemMap = new Map();
        bChems.forEach(c => bChemMap.set(c._id, c));

        const bStocks = inStockIds.length > 0 ? await BStockist.findAll({ where: { _id: inStockIds }, attributes: ['_id', 'name', 'businessName', 'workingArea'] }) : [];
        const bStockMap = new Map();
        bStocks.forEach(s => bStockMap.set(s._id, s));

        const hydratedDocsToSave = (doctors || []).map(d => {
            const id = typeof d === 'string' ? d : (d.id || d._id);
            const m = bDocMap.get(id);
            const rawName = typeof d === 'object' ? (d.name || d.doctorName || '') : '';
            const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
            return {
                id,
                _id: id,
                name: (m ? m.name : (!isNameAnId ? rawName : null)) || (String(id).startsWith('slot_open_') ? '(Open Slot - Pending Doctor Addition)' : id),
                doctorName: (m ? m.name : (!isNameAnId ? rawName : null)) || (String(id).startsWith('slot_open_') ? '(Open Slot - Pending Doctor Addition)' : id),
                category: m ? m.category : (typeof d === 'object' ? d.category : 'General'),
                hospital: m ? (m.hospital || '-') : (typeof d === 'object' ? (d.hospital || '-') : '-'),
                workingArea: m ? (m.workingArea || '-') : (typeof d === 'object' ? (d.workingArea || '-') : '-'),
                info: (m ? (m.workingArea || m.hospital || '') : (typeof d === 'object' && d.info && d.info !== 'Imported' ? d.info : '')) || '',
                samples: typeof d === 'object' && d.samples ? d.samples : [],
                gifts: typeof d === 'object' && d.gifts ? d.gifts : []
            };
        });

        const hydratedChemsToSave = (chemists || []).map(c => {
            const id = typeof c === 'string' ? c : (c.id || c._id);
            const m = bChemMap.get(id);
            const rawName = typeof c === 'object' ? (c.name || c.businessName || c.chemistName || '') : '';
            const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
            return {
                id,
                _id: id,
                name: (m ? (m.name || m.businessName) : (!isNameAnId ? rawName : null)) || id,
                chemistName: (m ? (m.name || m.businessName) : (!isNameAnId ? rawName : null)) || id,
                workingArea: m ? (m.workingArea || '-') : (typeof c === 'object' ? (c.workingArea || '-') : '-'),
                info: m ? (m.workingArea || '') : (typeof c === 'object' ? (c.info || '') : '')
            };
        });

        const hydratedStocksToSave = (stockists || []).map(s => {
            const id = typeof s === 'string' ? s : (s.id || s._id);
            const m = bStockMap.get(id);
            const rawName = typeof s === 'object' ? (s.name || s.businessName || s.stockistName || '') : '';
            const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
            return {
                id,
                _id: id,
                name: (m ? (m.name || m.businessName) : (!isNameAnId ? rawName : null)) || id,
                stockistName: (m ? (m.name || m.businessName) : (!isNameAnId ? rawName : null)) || id,
                workingArea: m ? (m.workingArea || '-') : (typeof s === 'object' ? (s.workingArea || '-') : '-'),
                info: m ? (m.workingArea || '') : (typeof s === 'object' ? (s.info || '') : '')
            };
        });

        for (const date of dates) {
            const sDate = normalizeDate(date);
            let plan = await XlCallPlan.findOne({ where: { employeeId: { [Op.in]: idArray }, date: sDate } });
            try {
                if (plan) {
                    plan.doctors = JSON.stringify(hydratedDocsToSave);
                    plan.chemists = JSON.stringify(hydratedChemsToSave);
                    plan.stockists = JSON.stringify(hydratedStocksToSave);
                    plan.status = planStatus;
                    await plan.save();
                } else {
                    await XlCallPlan.create({
                        employeeId: userForId?.employeeId || employeeId,
                        date: sDate,
                        doctors: JSON.stringify(hydratedDocsToSave),
                        chemists: JSON.stringify(hydratedChemsToSave),
                        stockists: JSON.stringify(hydratedStocksToSave),
                        status: planStatus
                    });
                }
            } catch (dbError) {
                return res.json({ success: false, message: 'Database Error: ' + dbError.message });
            }
        }
        
        // Notify manager of call plan update
        const mgrUser = userForId || await XlUser.findOne({ where: { employeeId } });
        const senderName = mgrUser ? (((mgrUser.firstName || '') + ' ' + (mgrUser.lastName || '')).trim() || mgrUser.name || employeeId) : employeeId;
        if (mgrUser && mgrUser.reportingManager) {
            const managers = await findReportingManagers(mgrUser.reportingManager);
            for (const m of managers) {
                await XlNotification.create({
                    _id: generateId(),
                    employeeId: m.employeeId,
                    title: 'Call Plan Updated',
                    message: `${senderName} has submitted their Call Plan.`
                }).catch(() => {});
            }
        }
        
        // Notify the submitter
        await XlNotification.create({
            _id: generateId(),
            employeeId,
            title: 'Call Plan Submitted',
            message: `You have successfully submitted your Call Plan. It has been sent to your manager.`
        }).catch(() => {});
        
        await XlNotification.create({
            _id: generateId(),
            employeeId: 'ADMIN',
            title: 'Call Plan Updated',
            message: `Call Plan submitted by ${senderName}.`
        }).catch(() => {});

        res.json({ success: true });
    } catch (e) {
        console.error('Call Plan Save Error:', e);
        require('fs').appendFileSync('cp_error.log', (e.original ? e.original.message : '') + '\n' + (e.stack || e.message) + '\n');
        res.status(500).json({ error: 'Failed to save call plan' });
    }
});

router.post('/call-plan/submit-all', async (req, res) => {
    try {
        const { employeeId, month, year } = req.body;
        if (!employeeId || !month || !year) {
            return res.status(400).json({ success: false, message: 'employeeId, month, and year are required' });
        }

        const { Op } = require('sequelize');
        const { XlUser, XlCallPlan, XlTourProgram, XlNotification, generateId, sequelize } = require('../db');

        const userForId = await XlUser.findOne({ where: { employeeId } }) || 
                          await XlUser.findOne({ where: { email: employeeId } }) || 
                          await XlUser.findOne({ where: { uid: employeeId } });
        let idArray = [employeeId];
        if (userForId) {
            if (userForId.employeeId) idArray.push(userForId.employeeId);
            if (userForId.email) idArray.push(userForId.email);
            if (userForId.uid) idArray.push(userForId.uid);
        }
        idArray = Array.from(new Set(idArray));

        const mNum = parseInt(month, 10);
        const yNum = parseInt(year, 10);
        const dObj = new Date(yNum, mNum - 1, 1);
        const monthLong = dObj.toLocaleString('en-US', { month: 'long' });
        const mLong = monthLong.toLowerCase();
        const mShort = dObj.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        const mNumStr = String(mNum);
        const mNumPad = mNumStr.padStart(2, '0');
        const tpYear = String(yNum);

        // Check Tour Program: User MUST have Submitted or Approved Tour Program for this month
        const tp = await XlTourProgram.findOne({
            where: {
                employeeId: { [Op.in]: idArray },
                year: tpYear,
                status: { [Op.in]: ['Submitted', 'Approved'] },
                [Op.or]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('month')), mLong),
                    sequelize.where(sequelize.fn('lower', sequelize.col('month')), mShort),
                    sequelize.where(sequelize.fn('lower', sequelize.col('month')), mShort + ' ' + yNum),
                    sequelize.where(sequelize.fn('lower', sequelize.col('month')), mLong + ' ' + yNum),
                    { month: mNumStr },
                    { month: mNumPad }
                ]
            }
        });

        if (!tp) {
            return res.status(400).json({
                success: false,
                message: `Cannot submit Call Plan: No Tour Program has been submitted (or approved) for ${monthLong} ${tpYear}. You must submit your Tour Program first.`
            });
        }

        const startDate = `${yNum}-${mNumPad}-01`;
        const lastDay = new Date(yNum, mNum, 0).getDate();
        const endDate = `${yNum}-${mNumPad}-${String(lastDay).padStart(2, '0')}`;

        const plans = await XlCallPlan.findAll({
            where: {
                employeeId: { [Op.in]: idArray },
                date: { [Op.between]: [startDate, endDate] }
            }
        });

        const parseSafe = (f) => {
            try {
                const parsed = typeof f === 'string' ? JSON.parse(f || '[]') : f;
                return Array.isArray(parsed) ? parsed : [];
            } catch(e) { return []; }
        };

        const plannedRecords = plans.filter(p => {
            return parseSafe(p.doctors).length > 0 || parseSafe(p.chemists).length > 0 || parseSafe(p.stockists).length > 0;
        });

        if (plannedRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No planned calls found for ${monthLong} ${tpYear}. Please plan your visits first before submitting.`
            });
        }

        let totalPlannedCalls = 0;
        for (const p of plannedRecords) {
            p.status = 'Submitted';
            await p.save();
            totalPlannedCalls += parseSafe(p.doctors).length;
        }

        const senderName = userForId ? (((userForId.firstName || '') + ' ' + (userForId.lastName || '')).trim() || userForId.name || employeeId) : employeeId;

        // Notify reporting manager
        if (userForId && userForId.reportingManager) {
            const managers = await findReportingManagers(userForId.reportingManager);
            for (const m of managers) {
                await XlNotification.create({
                    _id: generateId(),
                    employeeId: m.employeeId,
                    title: 'Monthly Call Plan Submitted',
                    message: `${senderName} has submitted their complete Call Plan for ${monthLong} ${yNum} (${plannedRecords.length} working days, ${totalPlannedCalls} doctor calls) for approval.`
                }).catch(() => {});
            }
        }

        // Notify Admin
        await XlNotification.create({
            _id: generateId(),
            employeeId: 'ADMIN',
            title: 'Monthly Call Plan Submitted',
            message: `${senderName} has submitted their complete Call Plan for ${monthLong} ${yNum} (${plannedRecords.length} working days, ${totalPlannedCalls} doctor calls).`
        }).catch(() => {});

        // Notify Submitter
        await XlNotification.create({
            _id: generateId(),
            employeeId: userForId?.employeeId || employeeId,
            title: 'Call Plan Submitted',
            message: `Your Call Plan for ${monthLong} ${yNum} (${plannedRecords.length} working days, ${totalPlannedCalls} doctor calls) has been submitted successfully for approval.`
        }).catch(() => {});

        return res.json({
            success: true,
            message: `Successfully submitted Call Plan for ${plannedRecords.length} working days (${totalPlannedCalls} doctor calls) for approval!`,
            count: plannedRecords.length,
            totalPlannedCalls
        });
    } catch (e) {
        console.error('Submit All Call Plans Error:', e);
        return res.status(500).json({ success: false, message: 'Failed to submit call plans: ' + e.message });
    }
});

// GET Global Settings

router.get('/hq', async (req, res) => {
    try {
        const { designation, hq, state, division } = req.query;
        const { sequelize } = require('../db');
        const { Op } = require('sequelize');

        let allowedHqs = null;
        let hasReportees = false;

        if (hq) {
            let userAllowed = [hq.trim()];
            if (designation && designation !== 'ADMIN') {
                const subHQs = await getSubordinateHQs(designation, hq, division);
                hasReportees = subHQs.length > 0;
                userAllowed = [...new Set([...userAllowed, ...subHQs])];
            } else if (designation === 'ADMIN') {
                hasReportees = true;
            }
            if (designation !== 'ADMIN') {
                allowedHqs = userAllowed;
            }
        } else if (designation === 'ADMIN') {
            hasReportees = true;
        }

        let whereConditions = [];
        if (state) {
            whereConditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('state')), state.trim().toLowerCase()));
        }
        if (allowedHqs) {
            const lowerHqs = allowedHqs.map(h => h.toLowerCase());
            whereConditions.push(sequelize.where(sequelize.fn('lower', sequelize.col('hqName')), { [Op.in]: lowerHqs }));
        }

        let where = {};
        if (whereConditions.length === 1) {
            where = whereConditions[0];
        } else if (whereConditions.length > 1) {
            where = { [Op.and]: whereConditions };
        }

        let dbHqs = await XlHQ.findAll({
            where,
            order: [['hqName', 'ASC']]
        });

        let resultList = dbHqs.map(h => h.toJSON ? h.toJSON() : h);

        // If user has allowed HQs, ensure all allowed/subordinate HQs exist in result
        if (allowedHqs) {
            for (const h of allowedHqs) {
                if (!resultList.some(item => (item.hqName || '').toLowerCase() === h.toLowerCase())) {
                    resultList.push({ hqName: h.toUpperCase(), state: state || '' });
                }
            }
        }

        resultList.sort((a, b) => (a.hqName || '').localeCompare(b.hqName || ''));
        return res.json({ 
            success: true, 
            data: resultList,
            hasReportees: Boolean(hasReportees),
            userHq: hq || ''
        });
    } catch(e) {
        console.error('Error fetching hq:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/division', async (req, res) => {
    try {
        const divs = await XlDivision.findAll({ order: [['divisionName', 'ASC']] });
        res.json({ success: true, data: divs });
    } catch(e) {
        res.status(500).json({ success: false });
    }
});



router.get('/user-performance/userwise', async (req, res) => {
    try {
        const { month, year, reportType, userId } = req.query;
        if (!month || !year || !reportType || !userId) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        const user = await XlUser.findByPk(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let data = {};

        if (reportType === 'Effort Analysis') {
            const { XlDCR, XlDoctor, XlChemist, XlStockist } = require('../db');
            const effortMatrix = await buildEffortMatrix(user, month, year, XlDCR, XlDoctor, XlChemist, XlStockist);
            
            const totalDocsRow = effortMatrix.find(r => r.label === 'Total Doctors');
            const totalDocs = totalDocsRow ? totalDocsRow.data[6] : 0;
            const drCalls = effortMatrix.find(r => r.label === 'Doctors Call')?.data[6] || 0;
            const drUnique = effortMatrix.find(r => r.label === 'Unique Doctors Visited')?.data[6] || 0;
            const drMissed = effortMatrix.find(r => r.label === 'Missed Doctors')?.data[6] || 0;
            const nonCore = effortMatrix.find(r => r.label === 'Non-Core Doctors (Met/Total)')?.data[6] || '0 / 0';
            const core = effortMatrix.find(r => r.label === 'Core Doctors (Met/Total)')?.data[6] || '0 / 0';
            const superCore = effortMatrix.find(r => r.label === 'Super-Core Doctors (Met/Total)')?.data[6] || '0 / 0';

            data = {
                totalDoctors: totalDocs, 
                totalDoctorsMet: drCalls,
                totalUniqueDoctors: drUnique,
                totalMissedDoctors: drMissed,
                totalNonCore: nonCore,
                totalCore: core,
                totalSuperCore: superCore,
                matrix: effortMatrix
            };
        } else {
            // Fetch from XlPerformanceAnalysis
            
            const monthMap = { 'Jan': 'january', 'Feb': 'february', 'Mar': 'march', 'Apr': 'april', 'May': 'may', 'Jun': 'june', 'Jul': 'july', 'Aug': 'august', 'Sep': 'september', 'Oct': 'october', 'Nov': 'november', 'Dec': 'december' };
            const fullMonth = monthMap[month] || month.toLowerCase();
            const perf = await XlPerformanceAnalysis.findOne({ where: { employeeId: user.employeeId || null, month: fullMonth, year } });

            
            if (perf) {
                if (reportType === 'Brand Analysis' && perf.brandData) {
                    data = JSON.parse(perf.brandData);
                    if (typeof data === 'string') data = JSON.parse(data); // Fix double-stringified corruption
                } else if (reportType === 'Key Customer Analysis' && perf.keyCustomerData) {
                    data = JSON.parse(perf.keyCustomerData);
                    if (typeof data === 'string') data = JSON.parse(data); // Fix double-stringified corruption
                } else if (reportType === 'Account Analysis' && perf.accountData) {
                    data = JSON.parse(perf.accountData);
                    if (typeof data === 'string') data = JSON.parse(data); // Fix double-stringified corruption
                } else if (reportType === 'Customer ROI Analysis' && perf.roiData) {
                    data = JSON.parse(perf.roiData);
                    if (typeof data === 'string') data = JSON.parse(data); // Fix double-stringified corruption
                } else if (reportType === 'Outstanding Analysis' && perf.outstandingData) {
                    data = JSON.parse(perf.outstandingData);
                    if (typeof data === 'string') data = JSON.parse(data); // Fix double-stringified corruption
                } else {
                    data = [];
                }
            } else {
                data = [];
            }
        }
        res.json({ success: true, data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/settings/preferences', async (req, res) => {
    try {
        let settings = await XlGlobalSettings.findOne();
        if (!settings) settings = await XlGlobalSettings.create({ settings: {} });
        res.json({ success: true, data: settings.settings || {} });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// POST Global Settings
router.post('/settings/preferences', async (req, res) => {
    try {
        let settings = await XlGlobalSettings.findOne();
        if (!settings) settings = await XlGlobalSettings.create({ settings: req.body.settings || {} });
        else { settings.settings = { ...settings.settings, ...req.body.settings }; await settings.save(); }
        res.json({ success: true, data: settings.settings });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});


// GET Holidays
router.get('/settings/holidays', async (req, res) => {
    try {
        const { year } = req.query;
        let where = {};
        if (year && year !== 'ALL') {
            const { Op } = require('sequelize');
            where = {
                date: {
                    [Op.between]: [`${year}-01-01`, `${year}-12-31`]
                }
            };
        }
        const holidays = await XlHoliday.findAll({ where, order: [['date', 'ASC']] });
        res.json({ success: true, data: holidays });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
});

// POST Holiday
router.post('/settings/holidays', async (req, res) => {
    try {
        const { date, type, state, title } = req.body;
        const holiday = await XlHoliday.create({ date, type, state, title });
        res.json({ success: true, data: holiday });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create holiday' });
    }
});

// DELETE Holiday
router.delete('/settings/holidays/:id', async (req, res) => {
    try {
        await XlHoliday.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
});

// GET Geo Fencing Tags for a specific user
router.get('/geo-fencing/my-tags', async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) return res.json({ success: true, data: [] });
        const tags = await XlGeoFencing.findAll({ where: { employeeId } });
        res.json({ success: true, data: tags });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});


// --- ADDED BACKLOG OVERVIEW ---
router.get('/backlog/overview', async (req, res) => {
    try {
        const { email, year, month } = req.query; // month is 1-12
        if (!email || !year || !month) return res.status(400).json({ error: 'Missing parameters' });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        const today = new Date();
        const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        
        const limitDate = endDate < yesterday ? endDate : yesterday; // Up to yesterday or end of month

        // Fetch Holidays based on user state
        const user = await XlUser.findOne({ where: { employeeId: email } });
        const Op = require('sequelize').Op;
        let holidaysData = [];
        if (user && user.state) {
            holidaysData = await XlHoliday.findAll({
                where: {
                    [Op.or]: [
                        { state: user.state },
                        { state: null },
                        { state: 'All' },
                        { state: 'N/A' },
                        { state: '' }
                    ]
                }
            });
        } else {
            holidaysData = await XlHoliday.findAll({
                where: {
                    [Op.or]: [
                        { state: null },
                        { state: 'All' },
                        { state: 'N/A' },
                        { state: '' }
                    ]
                }
            });
        }
        const holidayDates = new Set(holidaysData.map(h => h.date));

        // Fetch Attendances for the month
        const attendances = await XlAttendance.findAll({ 
            where: { employeeId: email, date: { [require('sequelize').Op.startsWith]: `${year}-${String(month).padStart(2, '0')}` } }
        });
        
        // Fetch DCRs for the month
        const dcrs = await XlDCR.findAll({ 
            where: { employeeId: email, date: { [require('sequelize').Op.startsWith]: `${year}-${String(month).padStart(2, '0')}` } }
        });

        const submittedDates = new Set([
            ...attendances.filter(a => a.daySubmitted).map(a => a.date),
            ...dcrs.filter(d => d.status === 'Approved').map(d => d.date)
        ]);

        // Fetch existing requests for the month
        const requests = await XlBacklogRequest.findAll({ 
            where: { employeeId: email, date: { [require('sequelize').Op.startsWith]: `${year}-${String(month).padStart(2, '0')}` } }
        });
        const requestMap = {};
        requests.forEach(r => requestMap[r.date] = r);

        const overview = [];
        let curr = new Date(startDate);

        while (curr <= limitDate) {
            // Check if Sunday
            if (curr.getDay() !== 0) { // Not Sunday
                const yyyy = curr.getFullYear();
                const mm = String(curr.getMonth() + 1).padStart(2, '0');
                const dd = String(curr.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;
                
                // Not holiday, not submitted
                if (!holidayDates.has(dateStr) && !submittedDates.has(dateStr)) {
                    if (requestMap[dateStr]) {
                        overview.push({ 
                            date: dateStr, 
                            status: requestMap[dateStr].status, 
                            reason: requestMap[dateStr].reason, 
                            adminRemarks: requestMap[dateStr].adminRemarks 
                        });
                    } else {
                        overview.push({ date: dateStr, status: 'Locked' });
                    }
                }
            }
            curr.setDate(curr.getDate() + 1);
        }

        res.json({ success: true, data: overview });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch backlog overview' });
    }
});
// ------------------------------








// --- LEAVE MANAGEMENT ADMIN ROUTES ---
router.get('/leave-types', async (req, res) => {
    try {
        const { XlLeaveType } = require('../db');
        const data = await XlLeaveType.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/leave-types', async (req, res) => {
    try {
        const { XlLeaveType } = require('../db');
        const { name, code, description, isPaid } = req.body;
        const data = await XlLeaveType.create({ name, code, description, isPaid });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/leave-types/:id', async (req, res) => {
    try {
        const { XlLeaveType } = require('../db');
        const { name, code, description, isPaid } = req.body;
        const record = await XlLeaveType.findOne({ where: { _id: req.params.id } });
        if (!record) return res.status(404).json({ error: 'Not found' });
        
        record.name = name;
        record.code = code;
        record.description = description;
        record.isPaid = isPaid;
        await record.save();
        
        res.json({ success: true, data: record });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/leave-types/:id', async (req, res) => {
    try {
        const { XlLeaveType } = require('../db');
        await XlLeaveType.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/assigned-leaves', async (req, res) => {
    try {
        const { XlAssignedLeave, XlUser } = require('../db');
        const { year } = req.query;
        let where = {};
        if (year) where.year = year;
        const rawData = await XlAssignedLeave.findAll({ where });

        const allUsers = await XlUser.findAll({
            attributes: ['_id', 'uid', 'employeeId', 'email', 'firstName', 'lastName', 'designation', 'hq']
        });

        const userMap = new Map();
        for (const u of allUsers) {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            const uObj = {
                _id: u._id,
                uid: u.uid,
                employeeId: u.employeeId,
                email: u.email,
                name: fullName,
                designation: u.designation || '',
                hq: u.hq || ''
            };
            if (u._id) userMap.set(String(u._id), uObj);
            if (u.uid) userMap.set(String(u.uid), uObj);
            if (u.employeeId) userMap.set(String(u.employeeId), uObj);
            if (u.email) userMap.set(String(u.email).toLowerCase(), uObj);
        }

        const data = rawData.map(item => {
            const plain = item.toJSON ? item.toJSON() : item;
            const empKey = String(plain.employeeId || '').trim();
            const matched = userMap.get(empKey) || userMap.get(empKey.toLowerCase());
            return {
                ...plain,
                employeeName: matched?.name || plain.employeeName || 'Unknown',
                employeeCode: matched?.employeeId || matched?.uid || empKey,
                canonicalEmpId: matched?.uid || matched?.employeeId || empKey,
                designation: matched?.designation || '',
                hq: matched?.hq || ''
            };
        });

        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/assigned-leaves/my', async (req, res) => {
    try {
        const { XlAssignedLeave, XlUser } = require('../db');
        const { Op } = require('sequelize');
        const { employeeId, year } = req.query;
        if (!employeeId) return res.json({ success: true, data: [] });

        let empIds = [String(employeeId).trim()];
        const user = await XlUser.findOne({
            where: {
                [Op.or]: [
                    { uid: employeeId },
                    { employeeId: employeeId },
                    { email: employeeId }
                ]
            }
        });
        if (user) {
            if (user.uid) empIds.push(String(user.uid).trim());
            if (user.employeeId) empIds.push(String(user.employeeId).trim());
            if (user.email) empIds.push(String(user.email).trim());
            if (user._id) empIds.push(String(user._id).trim());
        }
        empIds = Array.from(new Set(empIds));

        let where = { employeeId: { [Op.in]: empIds } };
        if (year) where.year = year;

        const data = await XlAssignedLeave.findAll({ where });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/assign-leave', async (req, res) => {
    try {
        const { XlAssignedLeave } = require('../db');
        const { employeeId, year, leaveType, count, used } = req.body;
        let record = await XlAssignedLeave.findOne({ where: { employeeId, year, leaveType } });
        if (record) {
            record.assigned += parseInt(count, 10);
            if (used) record.used += parseInt(used, 10);
            await record.save();
        } else {
            record = await XlAssignedLeave.create({ 
                employeeId, year, leaveType, 
                assigned: parseInt(count, 10),
                used: used ? parseInt(used, 10) : 0 
            });
        }
        res.json({ success: true, data: record });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/assign-leave-bulk', async (req, res) => {
    try {
        const { XlAssignedLeave, XlLeaveTemplate } = require('../db');
        const { employeeId, year, templateId } = req.body;
        const template = await XlLeaveTemplate.findOne({ where: { _id: templateId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        
        const payload = JSON.parse(template.payload || '[]');
        for (let item of payload) {
            let record = await XlAssignedLeave.findOne({ where: { employeeId, year, leaveType: item.leaveType } });
            if (record) {
                record.assigned += parseInt(item.count, 10);
                await record.save();
            } else {
                await XlAssignedLeave.create({ employeeId, year, leaveType: item.leaveType, assigned: parseInt(item.count, 10) });
            }
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/assign-leave/:id', async (req, res) => {
    try {
        const { XlAssignedLeave } = require('../db');
        const { assigned, used } = req.body;
        const record = await XlAssignedLeave.findOne({ where: { _id: req.params.id } });
        if (!record) return res.status(404).json({ error: 'Not found' });
        
        if (assigned !== undefined) record.assigned = parseInt(assigned, 10);
        if (used !== undefined) record.used = parseInt(used, 10);
        
        await record.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/leave-templates', async (req, res) => {
    try {
        const { XlLeaveTemplate } = require('../db');
        const data = await XlLeaveTemplate.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/leave-templates', async (req, res) => {
    try {
        const { XlLeaveTemplate } = require('../db');
        const { name, description, payload } = req.body;
        const data = await XlLeaveTemplate.create({ name, description, payload: JSON.stringify(payload) });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/leave-templates/:id', async (req, res) => {
    try {
        const { XlLeaveTemplate } = require('../db');
        await XlLeaveTemplate.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// Save Primary Sales Invoice

// Strict API Validator for JSON Dialect
const validateProductsData = (pData) => {
    if (!pData) return true;
    // Basic JSON validation only — do not reject any specific keys
    try {
        const parsed = typeof pData === 'string' ? JSON.parse(pData) : pData;
        if (!Array.isArray(parsed)) return true;
    } catch(e) {
        throw new Error("productsData must be valid JSON");
    }
    return true;
};

function normalizeDateStr(dStr) {
    return toStorageDate(dStr);
}

function getMonthYearFromDate(dStr) {
    return getMonthYear(dStr);
}

router.post('/primary-sales/save', async (req, res) => {
    try {
        const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status, fromAdmin, month: reqMonth, year: reqYear } = req.body;
        // Strict Validation
        if (productsData) validateProductsData(productsData);
        
        const savedDate = normalizeDateStr(date) || normalizeDateStr(new Date());
        const savedInvDate = normalizeDateStr(invoiceDate) || savedDate;
        const my = getMonthYearFromDate(savedInvDate || savedDate);
        const month = reqMonth || my.month || new Date().toLocaleString('en-US', { month: 'short' });
        const year = reqYear || my.year || new Date().getFullYear().toString();

        const { XlStockist, XlUser, XlAdmin } = require('../db');
        const { Op } = require('sequelize');

        // Check if initiator is Admin or if employeeId belongs to an Admin
        let isAdminSender = !!fromAdmin;
        if (employeeId) {
            if (employeeId === 'ADMIN' || employeeId.toUpperCase().startsWith('ADM')) isAdminSender = true;
            else {
                const adminCheck = await XlAdmin.findOne({ where: { [Op.or]: [{ employeeId }, { uid: employeeId }] } });
                if (adminCheck) isAdminSender = true;
            }
        }

        // Territory Attribution: Resolve field representative
        let finalEmpId = employeeId;
        if (isAdminSender || !finalEmpId || finalEmpId === 'ADMIN') {
            if (stockist) {
                const st = await XlStockist.findOne({ where: { [Op.or]: [{ uid: stockist }, { _id: stockist }] } });
                if (st && (st.userAllotted || st.employeeId)) {
                    finalEmpId = st.userAllotted || st.employeeId;
                }
            }
            if ((!finalEmpId || finalEmpId === 'ADMIN' || finalEmpId === employeeId) && headquarter) {
                const rep = await XlUser.findOne({ where: { hq: headquarter, status: 'Active' } });
                if (rep && rep.employeeId) finalEmpId = rep.employeeId;
                else if (!finalEmpId || finalEmpId === 'ADMIN' || isAdminSender) finalEmpId = 'VACANT_' + headquarter;
            }
        }

        // Rule 1: Admin submissions must be immediately Approved
        const finalStatus = (isAdminSender || status === 'Approved') ? 'Approved' : (status || 'Pending');

        const newSale = await XlPrimarySales.create({
            employeeId: finalEmpId || 'ADMIN',
            date: savedDate,
            invoiceDate: savedInvDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            grossInvValue,
            netInvValue,
            salableRtnValue,
            expiryRtnValue,
            amount: netInvValue, // Legacy fallback
            month,
            year,
            productsData: JSON.stringify(productsData),
            status: finalStatus
        });

        if (productsData && Array.isArray(productsData) && productsData.length > 0) {
            const { XlPrimarySalesItem } = require('../db');
            const items = productsData.map(p => ({
                saleId: newSale._id,
                product: p.product || p.productId,
                qty: parseInt(p.qty || p.quantity || 0),
                basePrice: parseFloat(p.basePrice || p.customPrice || 0),
                priceType: p.priceType || 'BASE PRICE',
                free: parseInt(p.free || 0),
                discount: parseFloat(p.discount || 0),
                exp: p.exp ? 1 : 0,
                purcRtn: parseInt(p.purcRtn || 0),
                rtnPriceType: p.rtnPriceType || 'BASE PRICE',
                rtnPrice: parseFloat(p.rtnPrice || 0)
            }));
            await XlPrimarySalesItem.bulkCreate(items);
        }

        res.json({ success: true, message: 'Primary Sales invoice saved successfully!', data: newSale });
    } catch (error) {
        console.error('Error saving primary sales:', error);
        res.status(500).json({ success: false, message: 'Failed to save primary sales' });
    }
});


// NEW API: Primary Sales Reports

router.get('/test-query', async (req, res) => {
    try {
        const { XlPrimarySales } = require('../db');
        const { Op, fn, col } = require('sequelize');
        let attributes = ['date', 'stockist', 'headquarter'];
        attributes.push([fn('SUM', col('netInvValue')), 'totalSales']);
        
        const data = await XlPrimarySales.findAll({
            attributes: attributes,
            group: ['date', 'stockist', 'headquarter'],
            raw: true
        });
        res.json({ success: true, data });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});

router.get('/reports/primary-sales', async (req, res) => {
    try {
        const { XlPrimarySales, sequelize } = require('../db');
        const { startDate, endDate, type, dateWise } = req.query;

        let whereClauses = [];
        let replacements = {};

        const dateCol = 'COALESCE(p."invoiceDate", p.date)';
        const dateExpr = `(CASE 
            WHEN ${dateCol} ~ '^\\d{4}-\\d{2}-\\d{2}$' AND CAST(SUBSTRING(${dateCol}, 6, 2) AS INT) > 12 THEN TO_DATE(${dateCol}, 'YYYY-DD-MM')
            WHEN ${dateCol} ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(${dateCol}, 'YYYY-MM-DD')
            WHEN ${dateCol} ~ '^\\d{2}-\\d{2}-\\d{4}$' AND CAST(SUBSTRING(${dateCol}, 1, 2) AS INT) > 12 THEN TO_DATE(${dateCol}, 'DD-MM-YYYY')
            WHEN ${dateCol} ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN TO_DATE(${dateCol}, 'MM-DD-YYYY')
            ELSE NULL
        END)`;
        const startExpr = "(CASE WHEN :startDate ~ '^\\d{4}-\\d{2}-\\d{2}$' AND CAST(SUBSTRING(:startDate, 6, 2) AS INT) > 12 THEN TO_DATE(:startDate, 'YYYY-DD-MM') WHEN :startDate ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(:startDate, 'YYYY-MM-DD') WHEN :startDate ~ '^\\d{2}-\\d{2}-\\d{4}$' AND CAST(SUBSTRING(:startDate, 1, 2) AS INT) > 12 THEN TO_DATE(:startDate, 'DD-MM-YYYY') WHEN :startDate ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN TO_DATE(:startDate, 'MM-DD-YYYY') ELSE NULL END)";
        const endExpr = "(CASE WHEN :endDate ~ '^\\d{4}-\\d{2}-\\d{2}$' AND CAST(SUBSTRING(:endDate, 6, 2) AS INT) > 12 THEN TO_DATE(:endDate, 'YYYY-DD-MM') WHEN :endDate ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(:endDate, 'YYYY-MM-DD') WHEN :endDate ~ '^\\d{2}-\\d{2}-\\d{4}$' AND CAST(SUBSTRING(:endDate, 1, 2) AS INT) > 12 THEN TO_DATE(:endDate, 'DD-MM-YYYY') WHEN :endDate ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN TO_DATE(:endDate, 'MM-DD-YYYY') ELSE NULL END)";
        if (startDate && endDate) {
            whereClauses.push(`${dateExpr} BETWEEN ${startExpr} AND ${endExpr}`);
            replacements.startDate = startDate;
            replacements.endDate = endDate;
        } else if (startDate) {
            whereClauses.push(`${dateExpr} >= ${startExpr}`);
            replacements.startDate = startDate;
        } else if (endDate) {
            whereClauses.push(`${dateExpr} <= ${endExpr}`);
            replacements.endDate = endDate;
        }

        if (req.query.employeeId && req.query.employeeId !== 'all') {
            whereClauses.push('p.\"employeeId\" = :employeeId');
            replacements.employeeId = req.query.employeeId;
        }

        const isDateWise = dateWise === 'true';
        let selectParts = [];
        let groupParts = [];
        let sql = '';

        if (type === 'Purchase Returns' || type === 'Expiry Returns') {
            const expCondition = type === 'Purchase Returns' ? '0' : '1';
            let whereSql = whereClauses.length > 0 ? ' AND ' + whereClauses.join(' AND ') : '';
            sql = `
                SELECT 
                    COALESCE(p."invoiceDate", p.date) as date, 
                    p."invoiceNumber" as "invoiceNumber", 
                    p.stockist as stockist, 
                    p.headquarter as headquarter, 
                    i.product as product, 
                    i."purcRtn" as "returnQty", 
                    i."rtnPrice" as "returnRate", 
                    (i."purcRtn" * i."rtnPrice") as "totalValue"
                FROM xl_primary_sales p
                JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                WHERE i."purcRtn" > 0 AND i.exp = ${expCondition} ${whereSql}
                ORDER BY p."createdAt" DESC
            `;
        } else if (type === 'User') {
            let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
            sql = `
                SELECT 
                    p.*, 
                    p."grossInvValue" as "grossSales", 
                    p."salableRtnValue" as "salableReturns", 
                    p."expiryRtnValue" as "expiryReturns", 
                    p."netInvValue" as "totalSales"
                FROM xl_primary_sales p
                ${whereSql}
                ORDER BY p."createdAt" DESC
            `;
        } else {
            if (type === 'Stockist') {
                selectParts.push('p.stockist as stockist', 'p.headquarter as headquarter');
                groupParts.push('p.stockist', 'p.headquarter');
            } else if (type === 'Headquarter') {
                selectParts.push('p.headquarter as headquarter');
                groupParts.push('p.headquarter');
            } else if (type === 'Date') {
                selectParts.push('COALESCE(p."invoiceDate", p.date) as date');
                groupParts.push('COALESCE(p."invoiceDate", p.date)');
            }

            if (isDateWise && type !== 'Date') {
                selectParts.unshift('COALESCE(p."invoiceDate", p.date) as date');
                groupParts.unshift('COALESCE(p."invoiceDate", p.date)');
            }

            // Add aggregations
            selectParts.push('SUM(p."grossInvValue") as "grossSales"');
            selectParts.push('SUM(p."salableRtnValue") as "salableReturns"');
            selectParts.push('SUM(p."expiryRtnValue") as "expiryReturns"');
            selectParts.push('SUM(p."netInvValue") as "totalSales"');

            let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            sql = `
                SELECT ${selectParts.join(', ')}
                FROM xl_primary_sales p
                ${whereSql}
                ${groupParts.length > 0 ? 'GROUP BY ' + groupParts.join(', ') : ''}
            `;
        }

        const data = await sequelize.query(sql, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });

        // Mapping logic
        const { XlStockist, XlUser, XlAdmin } = require('../db');
        const stockists = await XlStockist.findAll({ raw: true });
        const stockMap = {};
        stockists.forEach(s => {
            const name = s.businessName || s.name || s.uid || s._id;
            if (s.uid) stockMap[s.uid] = name;
            if (s._id) stockMap[s._id] = name;
        });

        const users = await XlUser.findAll({ raw: true });
        const admins = XlAdmin ? await XlAdmin.findAll({ raw: true }) : [];
        const userMap = {};
        users.forEach(u => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name;
            if (u.employeeId) userMap[u.employeeId] = name;
            if (u._id) userMap[u._id] = name;
            if (u.uid) userMap[u.uid] = name;
        });
        admins.forEach(a => {
            const name = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
            if (a.employeeId) userMap[a.employeeId] = name;
            if (a._id) userMap[a._id] = name;
            if (a.uid) userMap[a.uid] = name;
        });

        const { XlProduct } = require('../db');
        const products = await XlProduct.findAll({ raw: true });
        const prodMap = {};
        products.forEach(pr => {
            const name = pr.productName || pr.name || pr.uid || pr._id;
            if (pr.uid) prodMap[pr.uid] = name;
            if (pr._id) prodMap[pr._id] = name;
        });

        data.forEach(d => {
            if (d.stockist && stockMap[d.stockist]) {
                d.stockistName = stockMap[d.stockist];
            }
            if (d.employeeId && userMap[d.employeeId]) {
                d.userName = userMap[d.employeeId];
            }
            if (d.product && prodMap[d.product]) {
                d.productName = prodMap[d.product];
            }
            if (d.date) {
                d.displayDate = toDisplayDate(d.date);
            }
            d.totalSales = Number(d.totalSales || 0);
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch report: ' + error.message });
    }
});

router.get('/reports/primary-sales/detail', async (req, res) => {
    try {
        const { XlPrimarySales, XlStockist, sequelize } = require('../db');
        const { Op } = require('sequelize');
        const { startDate, endDate, type, dateWise, stockist, headquarter, user, date } = req.query;

        let whereClauses = [];
        let replacements = {};

        const dateCol = 'COALESCE(p."invoiceDate", p.date)';
        const dateExpr = `(CASE 
            WHEN ${dateCol} ~ '^\\d{4}-\\d{2}-\\d{2}$' AND CAST(SUBSTRING(${dateCol}, 6, 2) AS INT) > 12 THEN TO_DATE(${dateCol}, 'YYYY-DD-MM')
            WHEN ${dateCol} ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(${dateCol}, 'YYYY-MM-DD')
            WHEN ${dateCol} ~ '^\\d{2}-\\d{2}-\\d{4}$' AND CAST(SUBSTRING(${dateCol}, 1, 2) AS INT) > 12 THEN TO_DATE(${dateCol}, 'DD-MM-YYYY')
            WHEN ${dateCol} ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN TO_DATE(${dateCol}, 'MM-DD-YYYY')
            ELSE NULL
        END)`;
        const startExpr = "(CASE WHEN :startDate ~ '^\\d{4}-\\d{2}-\\d{2}$' AND CAST(SUBSTRING(:startDate, 6, 2) AS INT) > 12 THEN TO_DATE(:startDate, 'YYYY-DD-MM') WHEN :startDate ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(:startDate, 'YYYY-MM-DD') WHEN :startDate ~ '^\\d{2}-\\d{2}-\\d{4}$' AND CAST(SUBSTRING(:startDate, 1, 2) AS INT) > 12 THEN TO_DATE(:startDate, 'DD-MM-YYYY') WHEN :startDate ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN TO_DATE(:startDate, 'MM-DD-YYYY') ELSE NULL END)";
        const endExpr = "(CASE WHEN :endDate ~ '^\\d{4}-\\d{2}-\\d{2}$' AND CAST(SUBSTRING(:endDate, 6, 2) AS INT) > 12 THEN TO_DATE(:endDate, 'YYYY-DD-MM') WHEN :endDate ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(:endDate, 'YYYY-MM-DD') WHEN :endDate ~ '^\\d{2}-\\d{2}-\\d{4}$' AND CAST(SUBSTRING(:endDate, 1, 2) AS INT) > 12 THEN TO_DATE(:endDate, 'DD-MM-YYYY') WHEN :endDate ~ '^\\d{2}-\\d{2}-\\d{4}$' THEN TO_DATE(:endDate, 'MM-DD-YYYY') ELSE NULL END)";
        if (startDate && endDate) {
            whereClauses.push(`${dateExpr} BETWEEN ${startExpr} AND ${endExpr}`);
            replacements.startDate = startDate;
            replacements.endDate = endDate;
        } else if (startDate) {
            whereClauses.push(`${dateExpr} >= ${startExpr}`);
            replacements.startDate = startDate;
        } else if (endDate) {
            whereClauses.push(`${dateExpr} <= ${endExpr}`);
            replacements.endDate = endDate;
        }

        if (type === 'Stockist' && stockist) {
            const targetStockist = await XlStockist.findOne({
                where: { [Op.or]: [{ uid: stockist }, { _id: stockist }, { businessName: stockist }, { name: stockist }] }
            });
            const searchStockistIds = [stockist];
            if (targetStockist) {
                if (targetStockist.uid) searchStockistIds.push(targetStockist.uid);
                if (targetStockist._id) searchStockistIds.push(targetStockist._id);
                if (targetStockist.businessName) searchStockistIds.push(targetStockist.businessName);
                if (targetStockist.name) searchStockistIds.push(targetStockist.name);
            }
            whereClauses.push('p.stockist IN (:searchStockistIds)');
            replacements.searchStockistIds = searchStockistIds;
        } else if (type === 'Headquarter' && headquarter) {
            whereClauses.push('p.headquarter = :headquarter');
            replacements.headquarter = headquarter;
        } else if (type === 'User' && user) {
            whereClauses.push('p.\"employeeId\" = :user');
            replacements.user = user;
        }

        if (date) {
            whereClauses.push(`(
                COALESCE(p."invoiceDate", p.date) = :date 
                OR p.date = :date 
                OR p."invoiceDate" = :date
            )`);
            replacements.date = date;
        }

        const isDateWise = dateWise === 'true';
        let selectQuery = '';
        let groupQuery = '';

        if (isDateWise) {
            selectQuery = 'COALESCE(p."invoiceDate", p.date) as date, i.product, SUM(COALESCE(i.qty, 0)) as quantity, CASE WHEN SUM(COALESCE(i.qty, 0)) > 0 THEN ROUND(SUM(i."basePrice" * i.qty) / SUM(i.qty), 2) ELSE ROUND(AVG(i."basePrice"), 2) END as "averagePrice", SUM(i."basePrice" * i.qty) as "totalSales"';
            groupQuery = 'COALESCE(p."invoiceDate", p.date), i.product';
        } else {
            selectQuery = 'i.product, SUM(COALESCE(i.qty, 0)) as quantity, CASE WHEN SUM(COALESCE(i.qty, 0)) > 0 THEN ROUND(SUM(i."basePrice" * i.qty) / SUM(i.qty), 2) ELSE ROUND(AVG(i."basePrice"), 2) END as "averagePrice", SUM(i."basePrice" * i.qty) as "totalSales"';
            groupQuery = 'i.product';
        }

        let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const sql = `
            SELECT ${selectQuery}
            FROM xl_primary_sales p
            JOIN xl_primary_sales_items i ON p.\"_id\" = i.\"saleId\"
            ${whereSql}
            GROUP BY ${groupQuery}
        `;

        let data = [];
        try {
            data = await sequelize.query(sql, {
                replacements: replacements,
                type: sequelize.QueryTypes.SELECT
            });
        } catch(sqlErr) {
            console.error('Direct items SQL error, attempting fallback:', sqlErr.message);
        }

        // Map product names
        const { XlProduct } = require('../db');
        const products = await XlProduct.findAll({ raw: true });
        const prodMap = {};
        products.forEach(pr => {
            const name = pr.productName || pr.name || pr.uid || pr._id;
            if (pr.uid) prodMap[pr.uid] = name;
            if (pr._id) prodMap[pr._id] = name;
            if (pr.name) prodMap[pr.name] = name;
            if (pr.productName) prodMap[pr.productName] = name;
        });

        // Fallback: If relational items table returned 0 items, extract from productsData JSON on matching sales
        if (!data || data.length === 0) {
            try {
                const salesFallback = await sequelize.query(`
                    SELECT p."_id", p."productsData", p."netInvValue", COALESCE(p."invoiceDate", p.date) as date
                    FROM xl_primary_sales p
                    ${whereSql}
                `, { replacements, type: sequelize.QueryTypes.SELECT });

                const itemMap = {};
                salesFallback.forEach(sale => {
                    if (sale.productsData) {
                        try {
                            let parsed = typeof sale.productsData === 'string' ? JSON.parse(sale.productsData) : sale.productsData;
                            if (!Array.isArray(parsed)) parsed = Object.values(parsed || {});
                            parsed.forEach(item => {
                                const prodId = item.productId || item.product || item.id || item._id;
                                if (!prodId) return;
                                const qty = Number(item.qty || item.quantity || 0);
                                const price = Number(item.basePrice || item.customPrice || item.rate || item.price || 0);
                                const total = Number(item.totalSales || item.total || (qty * price) || 0);

                                if (!itemMap[prodId]) {
                                    itemMap[prodId] = {
                                        product: prodId,
                                        productName: item.productName || item.name || prodMap[prodId] || prodId,
                                        quantity: 0,
                                        totalSales: 0,
                                        prices: []
                                    };
                                }
                                itemMap[prodId].quantity += qty;
                                itemMap[prodId].totalSales += total;
                                if (price > 0) itemMap[prodId].prices.push(price);
                            });
                        } catch(e) {}
                    }
                });

                data = Object.values(itemMap).map(it => ({
                    product: it.product,
                    productName: prodMap[it.product] || it.productName,
                    quantity: it.quantity,
                    averagePrice: it.quantity > 0 && it.totalSales > 0 
                        ? Math.round(it.totalSales / it.quantity) 
                        : (it.prices.length > 0 ? Math.round(it.prices.reduce((a, b) => a + b, 0) / it.prices.length) : 0),
                    totalSales: Math.round(it.totalSales)
                }));
            } catch(fbErr) {
                console.error('Fallback productsData error:', fbErr.message);
            }
        } else {
            data.forEach(d => {
                if (d.product && prodMap[d.product]) {
                    d.productName = prodMap[d.product];
                }
                if (d.date) {
                    d.displayDate = toDisplayDate(d.date);
                }
                d.quantity = Number(d.quantity || 0);
                d.averagePrice = Number(d.averagePrice || 0);
                d.totalSales = Number(d.totalSales || 0);
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Detail Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch details: ' + error.message });
    }
});

router.get('/primary-sales/all', async (req, res) => {
    try {
        const { employeeId, designation, month, year } = req.query;
        let whereClause = {};

        // Self-heal records where month was set from entry date instead of invoiceDate
        try {
            const { sequelize } = require('../db');
            await sequelize.query(`
                UPDATE xl_primary_sales 
                SET "month" = TRIM(TO_CHAR(TO_DATE("invoiceDate", 'YYYY-MM-DD'), 'Mon')),
                    "year" = TO_CHAR(TO_DATE("invoiceDate", 'YYYY-MM-DD'), 'YYYY')
                WHERE "invoiceDate" IS NOT NULL 
                  AND "invoiceDate" ~ '^\\d{4}-\\d{2}-\\d{2}$'
                  AND "month" != TRIM(TO_CHAR(TO_DATE("invoiceDate", 'YYYY-MM-DD'), 'Mon'))
            `).catch(() => {});
        } catch(e) {}
        
        if (month) {
            const allMonthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const allMonthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            let fullM = month, shortM = month, mm = 1;
            let sIdx = allMonthsShort.indexOf(month);
            if (sIdx !== -1) { fullM = allMonthsFull[sIdx]; mm = sIdx + 1; }
            else { let fIdx = allMonthsFull.indexOf(month); if (fIdx !== -1) { shortM = allMonthsShort[fIdx]; mm = fIdx + 1; } }
            const monthVariants = [month, fullM, shortM, String(mm).padStart(2, '0'), String(mm)];
            const padM = String(mm).padStart(2, '0');
            const { Op } = require('sequelize');

            if (year) {
                whereClause[Op.and] = whereClause[Op.and] || [];
                whereClause[Op.and].push({
                    [Op.or]: [
                        { invoiceDate: { [Op.like]: `${year}-${padM}%` } },
                        { invoiceDate: { [Op.like]: `${padM}-%-${year}` } },
                        { invoiceDate: { [Op.like]: `%-${padM}-${year}` } },
                        {
                            [Op.and]: [
                                { month: { [Op.in]: monthVariants } },
                                { year: String(year) }
                            ]
                        }
                    ]
                });
            } else {
                whereClause[Op.or] = [
                    { invoiceDate: { [Op.like]: `%-${padM}-%` } },
                    { month: { [Op.in]: monthVariants } }
                ];
            }
        } else if (year) {
            whereClause.year = year;
        }
        
        // XLA admin (designation null/empty, 'ADMIN', or 'HO') sees ALL records
        // XL mobile users see only their own records (filtered by employeeId)
        // Handle "null" / "undefined" string values from URLSearchParams serialization
        const isXlaAdmin = !designation || designation === 'null' || designation === 'undefined' || designation === 'ADMIN' || designation === 'HO' || designation === 'admin';
        if (!isXlaAdmin && employeeId && employeeId !== 'null' && employeeId !== 'undefined') {
            whereClause.employeeId = employeeId;
        }

        // XL mobile users viewing their own history see all their records (Pending, Approved, Rejected)
        // Admin register defaults to Approved unless status=all is specified
        if (req.query.status && req.query.status !== 'all') {
            whereClause.status = req.query.status;
        } else if (req.query.status === 'all' || (!isXlaAdmin && employeeId)) {
            // No status restriction for XL user history
        } else if (!req.query.status) {
            whereClause.status = 'Approved';
        }

        const { XlPrimarySalesItem } = require('../db');
        const sales = await XlPrimarySales.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [{ model: XlPrimarySalesItem, as: 'items' }]
        });
        
        // Backwards compatibility and date format normalization
        sales.forEach(sale => {
            if (sale.date) sale.setDataValue('date', normalizeDateStr(sale.date));
            if (sale.invoiceDate) sale.setDataValue('invoiceDate', normalizeDateStr(sale.invoiceDate));
            if (sale.items && sale.items.length > 0) {
                sale.setDataValue('productsData', JSON.stringify(sale.items));
            }
        });

        res.json({ success: true, data: sales });
    } catch (error) {
        console.error('Error fetching primary sales:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch primary sales' });
    }
});



// [NEW] Fetch single invoice by ID
router.get('/primary-sales/:id', async (req, res) => {
    try {
        const { XlPrimarySalesItem } = require('../db');
        let sale = await XlPrimarySales.findByPk(req.params.id, { include: [{ model: XlPrimarySalesItem, as: 'items' }] });
        if (sale && sale.items && sale.items.length > 0) {
            sale.setDataValue('productsData', JSON.stringify(sale.items));
        }
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.json({ success: true, data: sale });
    } catch (error) {
        console.error('Error fetching primary sale by ID:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch primary sale' });
    }
});

// [NEW] Update an existing invoice
router.put('/primary-sales/update/:id', async (req, res) => {
    try {
        const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;
        // Strict Validation
        if (productsData) validateProductsData(productsData);
        
        const savedDate = normalizeDateStr(date) || normalizeDateStr(new Date());
        const savedInvDate = normalizeDateStr(invoiceDate) || savedDate;
        const my = getMonthYearFromDate(savedInvDate || savedDate);
        const month = my.month || new Date().toLocaleString('en-US', { month: 'short' });
        const year = my.year || new Date().getFullYear().toString();

        const sale = await XlPrimarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // Strict Server-Side Security Lock for Approved Invoices
        if (sale.status === 'Approved') {
            const requesterId = req.body.employeeId || req.query.employeeId || 'UNKNOWN';
            let isAdmin = (requesterId === 'ADMIN');
            
            if (!isAdmin && requesterId !== 'UNKNOWN') {
                const { XlUser } = require('../db');
                const user = await XlUser.findOne({ where: { employeeId: requesterId } });
                if (user && (user.designation === 'ADMIN' || user.designation === 'HO')) {
                    isAdmin = true;
                }
            }
            
            if (!isAdmin) {
                return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit an approved invoice unless you are an Admin.' });
            }
        }

        await sale.update({
            date: savedDate,
            invoiceDate: savedInvDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            grossInvValue,
            netInvValue,
            salableRtnValue,
            expiryRtnValue,
            amount: netInvValue,
            month,
            year,
            productsData: JSON.stringify(productsData),
            ...(status ? { status } : {})
        });

        // Phase 2: Relational Updates
        if (productsData && Array.isArray(productsData)) {
            const { XlPrimarySalesItem } = require('../db');
            await XlPrimarySalesItem.destroy({ where: { saleId: sale._id } });
            
            if (productsData.length > 0) {
                const items = productsData.map(p => ({
                    saleId: sale._id,
                    product: p.product || p.productId,
                    qty: parseInt(p.qty || p.quantity || 0),
                    basePrice: parseFloat(p.basePrice || p.customPrice || 0),
                    priceType: p.priceType || 'BASE PRICE',
                    free: parseInt(p.free || 0),
                    discount: parseFloat(p.discount || 0),
                    exp: p.exp ? 1 : 0,
                    purcRtn: parseInt(p.purcRtn || 0),
                    rtnPriceType: p.rtnPriceType || 'BASE PRICE',
                    rtnPrice: parseFloat(p.rtnPrice || 0)
                }));
                await XlPrimarySalesItem.bulkCreate(items);
            }
        }

        res.json({ success: true, message: 'Invoice updated successfully', data: sale });
    } catch (error) {
        console.error('Error updating primary sale:', error);
        res.status(500).json({ success: false, message: 'Failed to update invoice' });
    }
});

// [NEW] Delete an invoice
router.delete('/primary-sales/delete/:id', async (req, res) => {
    try {
        const sale = await XlPrimarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // Security lock: only admin can delete Approved invoices
        if (sale.status === 'Approved') {
            const requesterId = req.body.employeeId || req.query.employeeId || '';
            // fromAdmin=1 means request comes from XLA admin portal (already auth-gated)
            let isAdmin = (req.query.fromAdmin === '1' || requesterId === 'ADMIN');

            // Check if called from XLA admin portal (JWT in Authorization header)
            if (!isAdmin) {
                const authHeader = req.headers.authorization || '';
                if (authHeader.startsWith('Bearer ')) {
                    try {
                        const jwt = require('jsonwebtoken');
                        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'xl_secret_key_2024');
                        if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin' || decoded.isAdmin)) {
                            isAdmin = true;
                        }
                    } catch(e) {}
                }
            }

            // Check XlUser table if employeeId given
            if (!isAdmin && requesterId) {
                const { XlUser } = require('../db');
                const user = await XlUser.findOne({ where: { employeeId: requesterId } });
                if (user && (user.designation === 'ADMIN' || user.designation === 'HO')) {
                    isAdmin = true;
                }
            }

            if (!isAdmin) {
                return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete an approved invoice unless you are an Admin.' });
            }
        }
        
        // Delete child items first to avoid FK constraint errors (no cascade defined in db.js)
        try {
            await XlPrimarySalesItem.destroy({ where: { saleId: req.params.id } });
        } catch(e) {
            console.warn('Could not delete primary sale child items:', e.message);
        }

        await sale.destroy();
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting primary sale:', error);
        res.status(500).json({ success: false, message: 'Failed to delete invoice' });
    }
});


router.get('/debug-primary-sales', async (req, res) => {
    try {
        const sales = await XlPrimarySales.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
        res.json({ sales });
    } catch(e) { res.status(500).json({ error: e.message }); }
});



// ============================================================
// ONE-TIME ORPHAN CLEANUP ROUTE
// Call: GET /api/xl/admin/cleanup-orphans?secret=emyris_cleanup_2026
// Deletes XlPrimarySalesItem + XlSecondarySalesItem rows
// whose parent saleId no longer exists in the parent table.
// Safe to call multiple times — idempotent.
// ============================================================
router.get('/admin/cleanup-orphans', async (req, res) => {
    try {
        const secret = req.query.secret;
        if (secret !== 'emyris_cleanup_2026') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { XlPrimarySalesItem, XlSecondarySalesItem, sequelize } = require('../db');
        const { Op } = require('sequelize');

        // -- PRIMARY ORPHANS --
        const allPrimaryItems = await XlPrimarySalesItem.findAll({ attributes: ['id', 'saleId'] });
        const uniquePrimaryParentIds = [...new Set(allPrimaryItems.map(r => r.saleId).filter(Boolean))];
        let primaryOrphanCount = 0;
        if (uniquePrimaryParentIds.length > 0) {
            const existingPrimaryParents = await XlPrimarySales.findAll({
                where: { _id: { [Op.in]: uniquePrimaryParentIds } },
                attributes: ['_id']
            });
            const existingPrimaryIds = new Set(existingPrimaryParents.map(r => r._id));
            const orphanPrimaryIds = uniquePrimaryParentIds.filter(id => !existingPrimaryIds.has(id));
            if (orphanPrimaryIds.length > 0) {
                primaryOrphanCount = await XlPrimarySalesItem.destroy({ where: { saleId: { [Op.in]: orphanPrimaryIds } } });
            }
        }

        // -- SECONDARY ORPHANS --
        const allSecondaryItems = await XlSecondarySalesItem.findAll({ attributes: ['id', 'saleId'] });
        const uniqueSecondaryParentIds = [...new Set(allSecondaryItems.map(r => r.saleId).filter(Boolean))];
        let secondaryOrphanCount = 0;
        if (uniqueSecondaryParentIds.length > 0) {
            const existingSecondaryParents = await XlSecondarySales.findAll({
                where: { _id: { [Op.in]: uniqueSecondaryParentIds } },
                attributes: ['_id']
            });
            const existingSecondaryIds = new Set(existingSecondaryParents.map(r => r._id));
            const orphanSecondaryIds = uniqueSecondaryParentIds.filter(id => !existingSecondaryIds.has(id));
            if (orphanSecondaryIds.length > 0) {
                secondaryOrphanCount = await XlSecondarySalesItem.destroy({ where: { saleId: { [Op.in]: orphanSecondaryIds } } });
            }
        }

        res.json({
            success: true,
            message: 'Orphan cleanup complete',
            deleted: {
                primarySalesItems: primaryOrphanCount,
                secondarySalesItems: secondaryOrphanCount,
                total: primaryOrphanCount + secondaryOrphanCount
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/expense/limits', async (req, res) => {
    try {
        const { email, date } = req.query;
        if (!email || !date) return res.status(400).json({ error: 'Missing params' });
        
        const { XlUser, XlTourProgram, XlRoute, XlTravelAllowance, XlDesignation } = require('../db');
        const { Op } = require('sequelize');

        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const sDate = toStorageDate(date) || date;
        const my = getMonthYear(sDate);
        const monthStr = (my.month || '').toLowerCase();
        const year = my.year;
        
        
        let idArray2 = [email];
        if (user) {
            if (user.employeeId) idArray2.push(user.employeeId);
            if (user.email) idArray2.push(user.email);
            if (user.uid) idArray2.push(user.uid);
        }
        const tp = await XlTourProgram.findOne({ where: { employeeId: { [Op.in]: idArray2 }, month: monthStr, year } });

                let workAreaType = req.query.workAreaType || 'Out-Station';
        let toMarket = req.query.toMarket || '';
        let activityType = req.query.activityType || 'Working';
        
        if (tp && tp.entries) {
            try {
                let parsed = JSON.parse(tp.entries);
                if (!Array.isArray(parsed)) parsed = Object.values(parsed);
                const entry = parsed.find(e => e.date === date || (e.date && e.date.startsWith(date)));
                if (entry) {
                    if (!req.query.workAreaType) workAreaType = entry.type || entry.workAreaType || entry.areaType || 'Out-Station';
                    if (!req.query.toMarket) toMarket = entry.toMarket || entry.workingArea || '';
                    if (!req.query.activityType) activityType = entry.activityType || entry.activity || '';
                }
            } catch(e) {}
        }
        
        // Let's get the allowances from XlUser or XlDesignation
        let uDaily = user.dailyAllowance || 0;
        let uEx = user.exStationAllowance || 0;
        let uOut = user.outStationAllowance || 0;
        let des = user.designation;

        // Fallback to designation table if not on user
        if (uDaily === 0 || uEx === 0 || uOut === 0) {
            const desRecord = await XlDesignation.findOne({ where: { designationName: des } });
            if (desRecord) {
                if (uDaily === 0) uDaily = desRecord.dailyAllowance || 0;
                if (uEx === 0) uEx = desRecord.exStationAllowance || 0;
                if (uOut === 0) uOut = desRecord.outStationAllowance || 0;
            }
        }

        const { XlGlobalSettings } = require('../db');
        const settingsRecord = await XlGlobalSettings.findOne();
        if (settingsRecord && settingsRecord.settings && Array.isArray(settingsRecord.settings.daEligibleActivities)) {
            if (!settingsRecord.settings.daEligibleActivities.includes(activityType)) {
                uDaily = 0;
                uEx = 0;
                uOut = 0;
            }
        }
        
        let dailyAllowance = uOut;
        if (workAreaType === 'Local' || workAreaType === 'HQ') dailyAllowance = uDaily;
        else if (workAreaType === 'Ex-Station' || workAreaType === 'Ex-Mkt') dailyAllowance = uEx;
        
        let travelAllowance = 0;
        if ((workAreaType === 'Ex-Station' || workAreaType === 'Ex-Mkt') && toMarket) {
            // toMarket comes from Tour Program as "FromCity - ToCity" (e.g. "Vadodara - Anand")
            let fromCity = '';
            let toCity = toMarket;
            if (toMarket.includes(' - ')) {
                const parts = toMarket.split(' - ');
                fromCity = parts[0].trim();
                toCity = parts[1].trim();
            }

            // Try exact match with HQ first
            let route = null;
            if (fromCity) {
                route = await XlRoute.findOne({ where: { fromCity: { [Op.like]: `%${fromCity}%` }, toCity: { [Op.like]: `%${toCity}%` }, hq: user.hq } });
                if (!route) route = await XlRoute.findOne({ where: { fromCity: { [Op.like]: `%${fromCity}%` }, toCity: { [Op.like]: `%${toCity}%` } } });
                
                // Fallback reversing just in case
                if (!route) route = await XlRoute.findOne({ where: { fromCity: { [Op.like]: `%${toCity}%` }, toCity: { [Op.like]: `%${fromCity}%` } } });
            } else {
                route = await XlRoute.findOne({ where: { toCity: { [Op.like]: `%${toCity}%` }, hq: user.hq } });
                if (!route) route = await XlRoute.findOne({ where: { toCity: { [Op.like]: `%${toCity}%` } } });
            }
            if (route && route.distance) {
                // Calculate round-trip distance for limits comparison
                const roundTripDistance = route.distance * 2;
                const fareRule = await XlTravelAllowance.findOne({
                    where: {
                        state: user.state,
                        designation: des,
                        fromDistance: { [Op.lte]: roundTripDistance },
                        toDistance: { [Op.gte]: roundTripDistance }
                    }
                });
                if (fareRule) {
                    // Multiply by 2 to account for round trip reimbursement based on one-way distance
                    travelAllowance = (route.distance * 2) * fareRule.allowancePerKm;
                }
            }
        }
        
        res.json({ success: true, dailyAllowance, travelAllowance, workAreaType, toMarket });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch expense limits' });
    }
});

// Endpoint to fetch hierarchical coworkers for Worked With dropdown
router.get('/coworkers', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const { XlUser, XlDesignation } = require('../db');
        const { Op } = require('sequelize');

        // 1. Fetch the user making the request
        const user = await XlUser.findOne({ where: { employeeId: email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        let coworkersMap = new Map();

        // Return only ACTIVE and UNLOCKED coworkers in the company
        const allUsers = await XlUser.findAll({
            where: {
                status: 'Active'
            }
        });
        allUsers.forEach(u => {
            if (u.employeeId !== email) {
                let isLocked = false;
                try {
                    let c = u.controls;
                    if (typeof c === 'string') c = JSON.parse(c);
                    if (c && (c.locked === true || c.locked === 'true')) isLocked = true;
                } catch(err) {}

                if (!isLocked && u.status !== 'Deactivated' && u.status !== 'Inactive') {
                    coworkersMap.set(u.employeeId, u);
                }
            }
        });

        let coworkersList = Array.from(coworkersMap.values()).filter(m => m.employeeId !== email);

        const cleanList = coworkersList.map(u => ({
            employeeId: u.employeeId,
            firstName: u.firstName,
            lastName: u.lastName,
            designation: u.designation
        }));

        res.json({ success: true, data: cleanList });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch coworkers' });
    }
});


// ==========================================
// EMERGENCY DEBUG & FIX ROUTE
// ==========================================
router.get('/emergency-fix', async (req, res) => {
    try {
        const { sequelize } = require('../db');
        let logs = [];
        
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_stockists");
        } catch(e) { logs.push("xl_stockists error: " + e.message); }
        
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_products");
        } catch(e) { logs.push("xl_products error: " + e.message); }
        
        // Also check if any stockists exist
        try {
            const { XlStockist, XlProduct } = require('../db');
            const scount = await XlStockist.count();
            const pcount = await XlProduct.count();
            logs.push(`Total Stockists in DB: ${scount}`);
            logs.push(`Total Products in DB: ${pcount}`);
        } catch(e) { logs.push("Count error: " + e.message); }

        res.json({ success: true, logs });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});


// --- ADMIN BROADCAST ANNOUNCEMENT ROUTES ---
router.get('/admin/announcement', async (req, res) => {
    try {
        const { XlAnnouncement, Sequelize } = require('../db');
        
        const now = new Date();
        const announcement = await XlAnnouncement.findOne({ 
            where: { 
                active: true,
                [Op.or]: [
                    { validFrom: null },
                    { validFrom: { [Op.lte]: now } }
                ],
                [Op.and]: [
                    {
                        [Op.or]: [
                            { validUntil: null },
                            { validUntil: { [Op.gte]: now } }
                        ]
                    }
                ]
            }, 
            order: [['createdAt', 'DESC']] 
        });
        res.json({ success: true, data: announcement });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/admin/announcement', async (req, res) => {
    try {
        const { XlAnnouncement } = require('../db');
        const { message, validFrom, validUntil } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Message required' });
        
        // Deactivate previous
        await XlAnnouncement.update({ active: false }, { where: { active: true } });
        
        // Create new
        const newAnnounce = await XlAnnouncement.create({ 
            message, 
            active: true,
            validFrom: validFrom ? new Date(validFrom) : null,
            validUntil: validUntil ? new Date(validUntil) : null
        });
        res.json({ success: true, data: newAnnounce });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- ADMIN NOTIFICATIONS (RECENT ACTIVITY) ---
router.get('/admin/notifications', async (req, res) => {
    try {
        const { XlPrimarySales, XlSecondarySales, XlExpense, XlGlobalSettings } = require('../db');
        const { Op } = require('sequelize');
        
        // Fetch global settings to check when admin cleared notifications
        const globalSet = await XlGlobalSettings.findOne();
        const clearedAtStr = (globalSet && globalSet.settings) ? globalSet.settings.notificationsClearedAt : null;
        const clearedAt = clearedAtStr ? new Date(clearedAtStr) : null;
        
        const whereClause = (clearedAt && !isNaN(clearedAt.getTime())) 
            ? { createdAt: { [Op.gt]: clearedAt } } 
            : {};
        
        // Fetch 5 most recent from each that are newer than clearedAt
        const [primary, secondary, expenses] = await Promise.all([
            XlPrimarySales.findAll({ where: whereClause, order: [['createdAt', 'DESC']], limit: 5 }),
            XlSecondarySales.findAll({ where: whereClause, order: [['createdAt', 'DESC']], limit: 5 }),
            XlExpense.findAll({ where: whereClause, order: [['createdAt', 'DESC']], limit: 5 })
        ]);
        
        let allActivity = [];
        primary.forEach(p => allActivity.push({ 
            id: p._id, type: 'Primary Sales', title: 'New Primary Sales', 
            message: `Submitted for ${p.date || 'N/A'}`, 
            date: p.createdAt 
        }));
        secondary.forEach(s => allActivity.push({ 
            id: s._id, type: 'Secondary Sales', title: 'New Secondary Sales', 
            message: `Submitted for ${s.date || 'N/A'} by ${s.employeeId}`, 
            date: s.createdAt 
        }));
        expenses.forEach(e => allActivity.push({ 
            id: e._id, type: 'Expense', title: 'New Expense Request', 
            message: `${e.category || 'Expense'} - ${e.status}`, 
            date: e.createdAt 
        }));
        
        allActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
        allActivity = allActivity.slice(0, 10);
        
        res.json({ success: true, data: allActivity, clearedAt: clearedAtStr });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST to clear notifications permanently in database memory
router.post('/admin/notifications/clear', async (req, res) => {
    try {
        const { XlGlobalSettings } = require('../db');
        let globalSet = await XlGlobalSettings.findOne();
        const nowIso = new Date().toISOString();
        if (!globalSet) {
            globalSet = await XlGlobalSettings.create({ 
                settings: { notificationsClearedAt: nowIso } 
            });
        } else {
            const current = globalSet.settings || {};
            globalSet.settings = { ...current, notificationsClearedAt: nowIso };
            await globalSet.save();
        }
        res.json({ success: true, message: 'Notifications cleared successfully', clearedAt: nowIso });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- PERSISTENT TYPOGRAPHY SETTINGS ---
router.get('/admin/settings/typography', async (req, res) => {
    try {
        const { XlGlobalSettings } = require('../db');
        const record = await XlGlobalSettings.findOne();
        const typography = (record && record.settings && record.settings.typography) || {
            fontFamily: 'Montserrat',
            fontSize: '14px',
            menuHeadingSize: '16px'
        };
        res.json({ success: true, data: typography });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/admin/settings/typography', async (req, res) => {
    try {
        const { XlGlobalSettings } = require('../db');
        let record = await XlGlobalSettings.findOne();
        const { fontFamily, fontSize, menuHeadingSize } = req.body;
        const newTypography = {
            fontFamily: fontFamily || 'Montserrat',
            fontSize: fontSize || '14px',
            menuHeadingSize: menuHeadingSize || '16px'
        };
        if (!record) {
            record = await XlGlobalSettings.create({ 
                settings: { typography: newTypography } 
            });
        } else {
            const current = record.settings || {};
            record.settings = { ...current, typography: newTypography };
            await record.save();
        }
        res.json({ success: true, data: newTypography });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});


// --- DASHBOARD STATS ROUTE ---
router.get('/admin/dashboard-stats', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan } = require('../db');
        const { Op } = require('sequelize');
        
        let { month, year, employeeId } = req.query;
        if (!month || !year) {
            const date = new Date();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            month = month || months[date.getMonth()];
            year = year || String(date.getFullYear());
        }
        
        // Handle "undefined" string edge case
        if (employeeId === 'undefined' || employeeId === 'null') {
            employeeId = undefined;
        }

        let whereUser = {};
        let isManager = false;
        let managerUser = null;
        let team = [];

        if (employeeId) {
            managerUser = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { _id: employeeId },
                        { uid: employeeId },
                        { employeeId: employeeId }
                    ]
                }
            });
            if (managerUser) {
                const allActiveUsers = await XlUser.findAll({ where: { status: 'Active' }, raw: true });
                team = await getAllTeamMembers(managerUser, allActiveUsers);
                isManager = team.length > 0;
                const userKeys = [managerUser._id, managerUser.uid, managerUser.employeeId, ...team.map(t => t.employeeId), ...team.map(t => t.uid), ...team.map(t => t._id)].filter(Boolean);
                whereUser.employeeId = { [Op.in]: userKeys };
            } else {
                whereUser.employeeId = employeeId;
            }
        }

        let targetSum = 0;
        const allMonthsFull = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const allMonthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        let fullM = month;
        let shortM = month;
        let mm = 0;
        
        let sIdx = allMonthsShort.indexOf(month);
        if (sIdx !== -1) {
            fullM = allMonthsFull[sIdx];
            mm = sIdx + 1;
        } else {
            let fIdx = allMonthsFull.indexOf(month);
            if (fIdx !== -1) {
                shortM = allMonthsShort[fIdx];
                mm = fIdx + 1;
            } else {
                mm = parseInt(month, 10);
                if (mm > 0 && mm <= 12) {
                    shortM = allMonthsShort[mm - 1];
                    fullM = allMonthsFull[mm - 1];
                }
            }
        }
        
        let mmStr1 = String(mm).padStart(2, '0');
        let mmStr2 = String(mm);
        
        // Broad date variants for targets & sales
        const monthVariants = [month, fullM, shortM, mmStr1, mmStr2];
        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        targets.forEach(t => {
            targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0);
        });

        let primarySum = 0;
        const primary = await XlPrimarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        primary.forEach(p => {
            primarySum += (parseFloat(p.netInvValue) || parseFloat(p.amount) || 0);
        });

        let secondarySum = 0;
        const secondary = await XlSecondarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        secondary.forEach(s => {
            secondarySum += (parseFloat(s.amount) || 0);
        });

        const monthNum = String(mm).padStart(2, '0');
        const datePrefix = `${year}-${monthNum}-`; // YYYY-MM-DD
        const altDatePrefix = `%-${monthNum}-${year}`; // DD-MM-YYYY fallback
        
        const dcrs = await XlDCR.findAll({ 
            where: { 
                [Op.or]: [
                    { date: { [Op.like]: `${datePrefix}%` } },
                    { date: { [Op.like]: altDatePrefix } }
                ],
                ...whereUser 
            } 
        });

        let doctorCalls = 0;
        let chemistCalls = 0;
        let stockistCalls = 0;
        let doctorPob = 0;
        let chemistPob = 0;
        let stockistPob = 0;
        const callDates = new Set();

        dcrs.forEach(d => {
            if (d.date) callDates.add(String(d.date).split('T')[0]);
            let pobVal = 0;
            try {
                const items = JSON.parse(d.pobItems || '[]');
                if (Array.isArray(items)) {
                    items.forEach(it => {
                        const qty = parseFloat(it.qty || it.pobQty || 0) || 0;
                        const rate = parseFloat(it.rate || it.basePrice || it.price || it.amount || 0) || 0;
                        pobVal += (qty * rate);
                    });
                }
            } catch (e) {}

            if (d.entityType === 'Doctor') {
                doctorCalls++;
                doctorPob += pobVal;
            } else if (d.entityType === 'Chemist') {
                chemistCalls++;
                chemistPob += pobVal;
            } else if (d.entityType === 'Stockist') {
                stockistCalls++;
                stockistPob += pobVal;
            }
        });

        const daysWorked = callDates.size || 1;
        const doctorCallAvg = Number((doctorCalls / daysWorked).toFixed(1));
        const chemistCallAvg = Number((chemistCalls / daysWorked).toFixed(1));
        const stockistCallAvg = Number((stockistCalls / daysWorked).toFixed(1));

        let targetDoctorCalls = 0;
        let targetChemistCalls = 0;
        let targetStockistCalls = 0;
        
        let workingDays = 0;
        const mInt = parseInt(monthNum, 10);
        const yInt = parseInt(year, 10);
        
        // Calculate working days safely
        if (!isNaN(mInt) && !isNaN(yInt) && mInt > 0) {
            try {
                const daysInMonth = new Date(yInt, mInt, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    const dt = new Date(yInt, mInt - 1, d);
                    if (dt.getDay() !== 0) workingDays++; // Not a Sunday
                }
                const holidays = await require('../db').XlHoliday.count({
                    where: sequelize.where(
                        sequelize.cast(sequelize.col('date'), 'text'),
                        { [Op.like]: `${datePrefix}%` }
                    )
                });
                workingDays -= holidays;
                if (workingDays < 0) workingDays = 0;
            } catch (e) {
                console.error("Holiday calculation error:", e);
                workingDays = 26; // Fallback to average working days
            }
        } else {
            workingDays = 26;
        }

        if (employeeId) {
            const allDesigs = await require('../db').XlDesignation.findAll();
            const desigMap = {};
            allDesigs.forEach(d => {
                desigMap[d._id] = d;
                if (d.designationName) desigMap[d.designationName] = d;
            });

            if (isManager && team.length > 0) {
                // For a manager, target calls are aggregated across their field team members
                team.forEach(u => {
                    const desig = desigMap[u.designation];
                    let dT = 0, cT = 0, sT = 0;
                    if (desig) {
                        if (desig.targetDoctorCalls) dT = desig.targetDoctorCalls;
                        else {
                            if (desig.level === 1 || desig.level === 2) dT = 8;
                            else if (desig.level === 3 || desig.level === 4) dT = 6;
                            else if (desig.level >= 5) dT = 5;
                        }
                        if (desig.targetChemistCalls) cT = desig.targetChemistCalls;
                        if (desig.targetStockistCalls) sT = desig.targetStockistCalls;
                    }
                    targetDoctorCalls += workingDays * dT;
                    targetChemistCalls += workingDays * cT;
                    targetStockistCalls += workingDays * sT;
                });
            } else if (managerUser && managerUser.designation) {
                // Front-line individual contributor
                const desig = desigMap[managerUser.designation];
                let dTargetPerDay = 0, cTargetPerDay = 0, sTargetPerDay = 0;
                if (desig) {
                    if (desig.targetDoctorCalls) dTargetPerDay = desig.targetDoctorCalls;
                    else {
                        if (desig.level === 1 || desig.level === 2) dTargetPerDay = 8;
                        else if (desig.level === 3 || desig.level === 4) dTargetPerDay = 6;
                        else if (desig.level >= 5) dTargetPerDay = 5;
                    }
                    if (desig.targetChemistCalls) cTargetPerDay = desig.targetChemistCalls;
                    if (desig.targetStockistCalls) sTargetPerDay = desig.targetStockistCalls;
                }
                targetDoctorCalls = workingDays * dTargetPerDay;
                targetChemistCalls = workingDays * cTargetPerDay;
                targetStockistCalls = workingDays * sTargetPerDay;
            }
        } else {
            // ADMIN VIEW: Aggregate targets across all employees
            const allUsers = await XlUser.findAll({ 
                where: { status: 'Active' },
                attributes: ['designation']
            });
            const allDesigs = await require('../db').XlDesignation.findAll();
            const desigMap = {};
            allDesigs.forEach(d => {
                desigMap[d._id] = d;
                if (d.designationName) desigMap[d.designationName] = d;
            });

            allUsers.forEach(u => {
                if (u.designation && desigMap[u.designation]) {
                    const desig = desigMap[u.designation];
                    let dT = 0, cT = 0, sT = 0;
                    
                    if (desig.targetDoctorCalls) dT = desig.targetDoctorCalls;
                    else {
                        if (desig.level === 1 || desig.level === 2) dT = 8;
                        else if (desig.level === 3 || desig.level === 4) dT = 6;
                        else if (desig.level >= 5) dT = 5;
                    }
                    if (desig.targetChemistCalls) cT = desig.targetChemistCalls;
                    if (desig.targetStockistCalls) sT = desig.targetStockistCalls;

                    targetDoctorCalls += workingDays * dT;
                    targetChemistCalls += workingDays * cT;
                    targetStockistCalls += workingDays * sT;
                }
            });
        }

        const primaryPercent = targetSum > 0 ? Number(((primarySum / targetSum) * 100).toFixed(2)) : 0;
        const secondaryPercent = targetSum > 0 ? Number(((secondarySum / targetSum) * 100).toFixed(2)) : 0;

        res.json({
            success: true,
            data: {
                target: targetSum,
                primary: primarySum,
                secondary: secondarySum,
                primaryPercent,
                secondaryPercent,
                calls: {
                    doctor: { actual: doctorCalls, target: targetDoctorCalls },
                    chemist: { actual: chemistCalls, target: targetChemistCalls },
                    stockist: { actual: stockistCalls, target: targetStockistCalls }
                },
                pob: {
                    doctor: doctorPob,
                    chemist: chemistPob,
                    stockist: stockistPob,
                    total: doctorPob + chemistPob + stockistPob
                },
                callAverages: {
                    doctor: doctorCallAvg,
                    chemist: chemistCallAvg,
                    stockist: stockistCallAvg,
                    daysWorked
                }
            }
        });

    } catch(e) {
        console.error("Dashboard Stats Error:", e);
        res.status(500).json({ 
            success: false, 
            message: e.message,
            data: {
                target: 0, primary: 0, secondary: 0, primaryPercent: 0, secondaryPercent: 0,
                calls: { doctor: { actual: 0, target: 0 }, chemist: { actual: 0, target: 0 }, stockist: { actual: 0, target: 0 } },
                pob: { doctor: 0, chemist: 0, stockist: 0, total: 0 },
                callAverages: { doctor: 0, chemist: 0, stockist: 0, daysWorked: 0 }
            }
        });
    }
});

router.get('/user/dashboard-stats', async (req, res) => {
    // Forward directly to dashboard-stats
    req.url = '/admin/dashboard-stats';
    return router.handle(req, res);
});

router.get('/admin/debug-data', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan } = require('../db');
        const { Op } = require('sequelize');
        
        let month = 'Sep';
        let year = '2026';
        let employeeId = undefined;
        let whereUser = {};

        let targetSum = 0;
        const allMonthsFull = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const allMonthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        let fullM = month;
        let shortM = month;
        let mm = 0;
        let sIdx = allMonthsShort.indexOf(month);
        if (sIdx !== -1) {
            fullM = allMonthsFull[sIdx];
            mm = sIdx + 1;
        }
        
        let mmStr1 = String(mm).padStart(2, '0');
        let mmStr2 = String(mm);
        
        const monthVariants = [month, fullM, shortM, mmStr1, mmStr2];
        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        targets.forEach(t => {
            targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0);
        });

        const monthNum = String(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1).padStart(2, '0');
        const datePrefix = `${year}-${monthNum}-`;
        
        const dcrs = await XlDCR.findAll({ 
            where: { 
                date: { [Op.like]: `${datePrefix}%` }, 
                ...whereUser 
            } 
        });

        let doctorCalls = 0;
        let chemistCalls = 0;
        let stockistCalls = 0;
        let doctorPob = 0;
        let chemistPob = 0;
        let stockistPob = 0;
        const callDates = new Set();

        dcrs.forEach(d => {
            if (d.date) callDates.add(String(d.date).split('T')[0]);
            let pobVal = 0;
            try {
                const items = JSON.parse(d.pobItems || '[]');
                if (Array.isArray(items)) {
                    items.forEach(it => {
                        const qty = parseFloat(it.qty || it.pobQty || 0) || 0;
                        const rate = parseFloat(it.rate || it.basePrice || it.price || it.amount || 0) || 0;
                        pobVal += (qty * rate);
                    });
                }
            } catch (e) {}

            if (d.entityType === 'Doctor') {
                doctorCalls++;
                doctorPob += pobVal;
            } else if (d.entityType === 'Chemist') {
                chemistCalls++;
                chemistPob += pobVal;
            } else if (d.entityType === 'Stockist') {
                stockistCalls++;
                stockistPob += pobVal;
            }
        });

        const daysWorked = callDates.size || 1;
        const doctorCallAvg = Number((doctorCalls / daysWorked).toFixed(1));
        const chemistCallAvg = Number((chemistCalls / daysWorked).toFixed(1));
        const stockistCallAvg = Number((stockistCalls / daysWorked).toFixed(1));

        res.json({
            success: true,
            dcrsLength: dcrs.length,
            targetsLength: targets.length,
            monthVariants,
            datePrefix,
            data: {
                target: targetSum,
                calls: {
                    doctor: { actual: doctorCalls },
                    chemist: { actual: chemistCalls },
                    stockist: { actual: stockistCalls }
                }
            }
        });

    } catch(e) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});


router.get('/admin/debug-date-migration', async (req, res) => {
    try {
        const { sequelize } = require('../db');
        const { Op } = require('sequelize');
        let totalUpdated = 0;
        const models = Object.values(sequelize.models);
        for (let model of models) {
            if (model.rawAttributes.date && model.rawAttributes.date.type.key === 'STRING') {
                const records = await model.findAll({
                    where: { date: { [Op.like]: '%-%-%', [Op.notLike]: '202%' } }
                });
                for (let record of records) {
                    const sDate = toStorageDate(record.date);
                    if (sDate && sDate !== record.date) {
                        record.date = sDate;
                        await record.save();
                        totalUpdated++;
                    }
                }
            }
        }
        res.json({ success: true, message: `Migrated ${totalUpdated} records to YYYY-MM-DD` });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================
// MISSED REPORTS API
// ==========================================
router.get('/missed-reports', async (req, res) => {
    try {
        const { entityType, month, year, startMonth, startYear, endMonth, endYear, userAllotted, reportType } = req.query;
        // reportType: 'Met/Missed', 'Monthly', 'Userwise', 'Download'
        
        let startDateStr, endDateStr;
        let monthsInRange = []; // e.g. ['Oct 2026', 'Nov 2026']

        if (reportType === 'Monthly') {
            if (!startMonth || !startYear || !endMonth || !endYear) {
                return res.status(400).json({ success: false, message: 'Missing date range parameters' });
            }
            let sM = parseInt(startMonth, 10);
            let sY = parseInt(startYear, 10);
            let eM = parseInt(endMonth, 10);
            let eY = parseInt(endYear, 10);
            
            startDateStr = `${sY}-${String(sM).padStart(2, '0')}-01`;
            const lastDay = new Date(eY, eM, 0).getDate();
            endDateStr = `${eY}-${String(eM).padStart(2, '0')}-${lastDay}`;

            // Calculate months in range
            let curD = new Date(sY, sM - 1, 1);
            const endD = new Date(eY, eM - 1, 1);
            while (curD <= endD) {
                monthsInRange.push(curD.toLocaleString('en-US', { month: 'short' }) + ' ' + curD.getFullYear());
                curD.setMonth(curD.getMonth() + 1);
            }
        } else {
            if (!month || !year) {
                return res.status(400).json({ success: false, message: 'Missing month/year parameters' });
            }
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            endDateStr = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
            monthsInRange.push(new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' }) + ' ' + y);
        }

        let EntityModel = XlDoctor;
        if (entityType === 'Chemist') EntityModel = XlChemist;
        if (entityType === 'Stockist') EntityModel = XlStockist;

        const allUsers = await XlUser.findAll({ raw: true });
        const userMap = {};
        const empIdMap = {};
        const uidMap = {};
        const hqMap = {};
        allUsers.forEach(u => {
            const fullName = `${u.firstName} ${u.lastName}`.trim();
            userMap[u._id] = fullName;
            if (u.employeeId) empIdMap[u.employeeId] = fullName;
            if (u.uid) uidMap[u.uid] = fullName;
            if (u.hq) hqMap[u.hq.trim().toLowerCase()] = fullName;
        });

        let selectedUserName = null;
        if (userAllotted && userAllotted !== 'all') {
            selectedUserName = userMap[userAllotted];
        }

        let entityWhere = {};
        let actualEmployeeId = userAllotted;
        let empCode = null;

        if (userAllotted && userAllotted !== 'all') {
            const userObj = allUsers.find(u => u._id === userAllotted || u.employeeId === userAllotted || u.uid === userAllotted);
            if (userObj) {
                actualEmployeeId = userObj.employeeId;
                empCode = userObj.uid;
                
                const orConditions = [
                    { userAllotted: userAllotted },
                    { userAllotted: userObj._id }
                ];
                
                if (actualEmployeeId) orConditions.push({ employeeId: actualEmployeeId });
                if (empCode) orConditions.push({ employeeId: empCode });
                
                let hqList = [];
                if (userObj.hq) hqList.push(userObj.hq.trim().toLowerCase());
                
                if (userObj.designation && userObj.designation !== 'ADMIN') {
                    const subHQs = await getSubordinateHQs(userObj.designation, userObj.hq);
                    hqList = [...new Set([...hqList, ...subHQs])];
                }
                
                if (hqList.length > 0) {
                    const { sequelize } = require('../db');
                    orConditions.push(
                        sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), { [Op.in]: hqList })
                    );
                }

                entityWhere = {
                    ...entityWhere,
                    [Op.or]: orConditions
                };
            }
        }

        const entities = await EntityModel.findAll({ where: entityWhere, raw: true });

        let dcrWhere = {
            date: {
                [Op.between]: [startDateStr, endDateStr]
            },
            entityType: entityType,
            status: 'Approved'
        };
        
        if (userAllotted && userAllotted !== 'all' && reportType !== 'Userwise') {
            const arr = [];
            if (actualEmployeeId) arr.push(actualEmployeeId);
            if (empCode) arr.push(empCode);
            if (arr.length > 0) {
                dcrWhere.employeeId = { [Op.in]: arr };
            } else {
                dcrWhere.employeeId = userAllotted;
            }
        }

        const dcrs = await XlDCR.findAll({ where: dcrWhere, raw: true });

        const entityDcrCount = {};
        const entityAllVisits = {};
        const userwiseStats = {};
        // For monthly report: breakdown of visits by month
        const entityMonthlyBreakdown = {}; 
        
        dcrs.forEach(dcr => {
            const eid = dcr.entityId;
            entityDcrCount[eid] = (entityDcrCount[eid] || 0) + 1;
            
            const dDate = new Date(dcr.date);
            const day = dDate.getDate();
            let timeStr = '';
            if (dcr.createdAt) {
                 const cDate = new Date(dcr.createdAt);
                 const hh = String(cDate.getHours()).padStart(2, '0');
                 const mm = String(cDate.getMinutes()).padStart(2, '0');
                 timeStr = `_${hh}.${mm}`;
            }
            const formattedVisit = `${day}${timeStr}`;
            
            if (!entityAllVisits[eid]) entityAllVisits[eid] = [];
            entityAllVisits[eid].push(formattedVisit);

            if (reportType === 'Monthly') {
                if (!entityMonthlyBreakdown[eid]) entityMonthlyBreakdown[eid] = {};
                const monthKey = dDate.toLocaleString('en-US', { month: 'short' }) + ' ' + dDate.getFullYear();
                if (!entityMonthlyBreakdown[eid][monthKey]) entityMonthlyBreakdown[eid][monthKey] = [];
                entityMonthlyBreakdown[eid][monthKey].push(formattedVisit);
            }
        });

// Dynamically grouped by resolved employee names later

        const getExpectedVisits = (categoryStr) => {
            if (!categoryStr) return 1;
            const match = categoryStr.match(/(\d+)\s+Visits?\/month/i);
            return match ? parseInt(match[1], 10) : 1;
        };

        const results = [];
        let summary = {
            met: 0,
            partiallyMissed: 0,
            missed: 0
        };

        const rangeMultiplier = monthsInRange.length;

        for (const ent of entities) {
            const uid = ent.uid || ent._id;
            const actual = entityDcrCount[ent._id] || 0;
            let expectedPerMonth = entityType === 'Doctor' ? getExpectedVisits(ent.category) : null;
            let expectedTotal = expectedPerMonth !== null ? expectedPerMonth * rangeMultiplier : null;
            
            let status = 'Missed';
            if (entityType === 'Doctor') {
                if (actual >= expectedTotal) status = 'Met';
                else if (actual > 0) status = 'Partially Missed';
                else status = 'Fully Missed';
            } else {
                if (actual > 0) status = 'Met';
                else status = 'Fully Missed';
            }


            if (status === 'Met') summary.met++;
            else if (status === 'Partially Missed') summary.partiallyMissed++;
            else summary.missed++;

            let meetingDateStr = '-';
            if (entityAllVisits[ent._id] && entityAllVisits[ent._id].length > 0) {
                meetingDateStr = [...new Set(entityAllVisits[ent._id])].join(',');
            }

            let eName = userMap[ent.userAllotted] || empIdMap[ent.employeeId] || uidMap[ent.employeeId];
            if (!eName && ent.headquarter) {
                eName = hqMap[ent.headquarter.trim().toLowerCase()];
            }
            if (!eName && selectedUserName) {
                eName = selectedUserName;
            }
            
            const finalEName = eName || 'Unassigned';
            
            if (reportType === 'Userwise') {
                if (!userwiseStats[finalEName]) {
                    userwiseStats[finalEName] = { total: 0, met: 0, partiallyMissed: 0, missed: 0 };
                }
                userwiseStats[finalEName].total++;
                if (status === 'Met') userwiseStats[finalEName].met++;
                else if (status === 'Partially Missed') userwiseStats[finalEName].partiallyMissed++;
                else userwiseStats[finalEName].missed++;
            }

            let row = {
                _id: ent._id,
                uid: uid,
                name: ent.name || ent.businessName,
                degree: ent.degree,
                specialization: ent.specialization,
                category: ent.category,
                expected: expectedTotal,
                actual: actual,
                status: status,
                meetingDate: meetingDateStr,
                employeeName: finalEName
            };

            if (reportType === 'Monthly') {
                row.monthlyBreakdown = {};
                monthsInRange.forEach(m => {
                    const mVisits = entityMonthlyBreakdown[ent._id]?.[m] || [];
                    row.monthlyBreakdown[m] = mVisits.length > 0 ? [...new Set(mVisits)].join(',') : '';
                });
            }

            results.push(row);
        }

        if (reportType === 'Userwise') {
            const userwiseList = Object.keys(userwiseStats).map(uid => ({
                employeeId: uid,
                employeeName: uid,
                total: userwiseStats[uid].total,
                met: userwiseStats[uid].met,
                partiallyMissed: userwiseStats[uid].partiallyMissed,
                missed: userwiseStats[uid].missed
            }));
            return res.json({ success: true, summary, data: userwiseList });
        }

        res.json({ success: true, summary, data: results, monthsInRange });

    } catch (e) {
        console.error("Missed Reports Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// [DEBUG] endpoint for primary sales
router.get('/debug/primary-sales', async (req, res) => {
    try {
        const { XlPrimarySales, XlPrimarySalesItem } = require('../db');
        const sales = await XlPrimarySales.findAll({ raw: true });
        const items = await XlPrimarySalesItem.findAll({ raw: true });
        res.json({ sales, items });
    } catch (e) {
        res.json({ error: e.message });
    }
});

// --- SECONDARY SALES REPORTS ---
router.get('/reports/secondary-sales', async (req, res) => {
    try {
        const { sequelize } = require('../db');
        const { startMonth, startYear, endMonth, endYear, type, employeeId } = req.query;

        let whereClauses = [];
        let replacements = {};

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (startMonth && startYear) {
            if (endMonth && endYear) {
                let sM = monthNames.indexOf(startMonth);
                let sY = parseInt(startYear);
                let eM = monthNames.indexOf(endMonth);
                let eY = parseInt(endYear);
                
                let rangeClauses = [];
                let currM = sM;
                let currY = sY;
                let counter = 0;
                while((currY < eY || (currY === eY && currM <= eM)) && counter < 100) {
                    const mName = monthNames[currM];
                    rangeClauses.push(`(s.month = '${mName}' AND s.year = '${currY}')`);
                    currM++;
                    if (currM > 11) {
                        currM = 0;
                        currY++;
                    }
                    counter++;
                }
                if (rangeClauses.length > 0) {
                    whereClauses.push(`(${rangeClauses.join(' OR ')})`);
                }
            } else {
                whereClauses.push('s.month = :startMonth');
                whereClauses.push('s.year = :startYear');
                replacements.startMonth = startMonth;
                replacements.startYear = startYear;
            }
        }

        if (employeeId && employeeId !== 'all') {
            const ctx = await resolveUserContext(employeeId);
            if (ctx.hq) {
                whereClauses.push('(s."employeeId" = :employeeId OR LOWER(TRIM(s.headquarter)) = LOWER(TRIM(:userHq)))');
                replacements.employeeId = employeeId;
                replacements.userHq = ctx.hq;
            } else {
                whereClauses.push('s."employeeId" = :employeeId');
                replacements.employeeId = employeeId;
            }
        }

        let selectParts = [];
        let groupParts = [];
        let joinSql = '';
        let sql = '';

        if (type === 'Inventory') {
            selectParts.push('s.month as "month"', 's.year as "year"', 's.stockist', 's.headquarter', 'SUM(i.qty) as "quantity"');
            groupParts.push('s.year', 's.month', 's.stockist', 's.headquarter');
            joinSql = 'JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"';
        } else if (type === 'Stockist') {
            selectParts.push('s.month as "month"', 's.year as "year"', 's.stockist', 's.headquarter', 'SUM(s.amount) as "totalSales"');
            groupParts.push('s.year', 's.month', 's.stockist', 's.headquarter');
        } else if (type === 'Headquarter') {
            selectParts.push('s.month as "month"', 's.year as "year"', 's.headquarter', 'SUM(s.amount) as "totalSales"');
            groupParts.push('s.year', 's.month', 's.headquarter');
        } else if (type === 'User') {
            selectParts.push('s._id as "_id"', 's.month as "month"', 's.year as "year"', 's.date as "date"', 's."invoiceDate" as "invoiceDate"', 's."invoiceNumber" as "invoiceNumber"', 's."employeeId" as "employeeId"', 's.stockist as "stockist"', 's.headquarter as "headquarter"', 's.amount as "totalSales"');
        } else {
            selectParts.push('s.month as "month"', 's.year as "year"', 's.stockist', 's.headquarter', 'SUM(s.amount) as "totalSales"');
            groupParts.push('s.year', 's.month', 's.stockist', 's.headquarter');
        }

        let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
        let orderBySql = groupParts.length > 0 ? '' : 'ORDER BY s."createdAt" DESC';

        sql = `
            SELECT ${selectParts.join(', ')}
            FROM xl_secondary_sales s
            ${joinSql}
            ${whereSql}
            ${groupParts.length > 0 ? 'GROUP BY ' + groupParts.join(', ') : ''}
            ${orderBySql}
        `;

        const data = await sequelize.query(sql, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        // Mapping logic
        const { XlStockist, XlUser, XlAdmin } = require('../db');
        const [stockists, users, admins] = await Promise.all([
            XlStockist.findAll({ raw: true }).catch(() => []),
            XlUser.findAll({ raw: true }).catch(() => []),
            XlAdmin ? XlAdmin.findAll({ raw: true }).catch(() => []) : []
        ]);

        const stockMap = {};
        stockists.forEach(st => {
            const sName = st.businessName || st.name;
            if (st.uid) stockMap[st.uid] = sName;
            if (st._id) stockMap[st._id] = sName;
            if (st.name) stockMap[st.name] = sName;
        });

        const userMap = {};
        admins.forEach(a => {
            const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.name || a.username;
            if (a.employeeId) userMap[a.employeeId] = name;
            if (a._id) userMap[a._id] = name;
            if (a.uid) userMap[a.uid] = name;
        });
        users.forEach(u => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name;
            if (u.employeeId) userMap[u.employeeId] = name;
            if (u._id) userMap[u._id] = name;
            if (u.uid) userMap[u.uid] = name;
        });

        data.forEach(d => {
            if (d.stockist) d.stockistName = stockMap[d.stockist] || d.stockist;
            if (d.employeeId) d.userName = userMap[d.employeeId] || d.employeeId;
            if (d.date) d.displayDate = toDisplayDate(d.date);
            if (d.invoiceDate) d.displayInvoiceDate = toDisplayDate(d.invoiceDate);
            d.totalSales = Number(d.totalSales || 0);
            if(d.quantity) d.quantity = Number(d.quantity || 0);
        });

        const monthOrder = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
        data.sort((a, b) => {
            const yDiff = (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
            if (yDiff !== 0) return yDiff;
            const mDiff = (monthOrder[a.month] || 0) - (monthOrder[b.month] || 0);
            if (mDiff !== 0) return mDiff;
            return (a.stockistName || a.stockist || '').localeCompare(b.stockistName || b.stockist || '');
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Secondary Sales Report Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/reports/secondary-sales/detail', async (req, res) => {
    try {
        const { sequelize } = require('../db');
        const { type, stockist, headquarter, month, year, startMonth, startYear, endMonth, endYear } = req.query;

        let whereClauses = [];
        let replacements = {};

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (month && year) {
            whereClauses.push('s.month = :month');
            whereClauses.push('s.year = :year');
            replacements.month = month;
            replacements.year = year;
        } else if (startMonth && startYear) {
            if (endMonth && endYear) {
                let sM = monthNames.indexOf(startMonth);
                let sY = parseInt(startYear);
                let eM = monthNames.indexOf(endMonth);
                let eY = parseInt(endYear);
                
                let rangeClauses = [];
                let currM = sM;
                let currY = sY;
                let counter = 0;
                while((currY < eY || (currY === eY && currM <= eM)) && counter < 100) {
                    const mName = monthNames[currM];
                    rangeClauses.push(`(s.month = '${mName}' AND s.year = '${currY}')`);
                    currM++;
                    if (currM > 11) {
                        currM = 0;
                        currY++;
                    }
                    counter++;
                }
                if (rangeClauses.length > 0) {
                    whereClauses.push(`(${rangeClauses.join(' OR ')})`);
                }
            } else {
                whereClauses.push('s.month = :startMonth');
                whereClauses.push('s.year = :startYear');
                replacements.startMonth = startMonth;
                replacements.startYear = startYear;
            }
        }

        if (stockist) {
            whereClauses.push('(s.stockist = :stockist OR s.stockist IN (SELECT uid FROM xl_stockists WHERE name = :stockist OR "businessName" = :stockist OR uid = :stockist OR "_id" = :stockist) OR s.stockist IN (SELECT "_id" FROM xl_stockists WHERE name = :stockist OR "businessName" = :stockist OR uid = :stockist OR "_id" = :stockist) OR s.stockist IN (SELECT "businessName" FROM xl_stockists WHERE name = :stockist OR "businessName" = :stockist OR uid = :stockist OR "_id" = :stockist))');
            replacements.stockist = stockist;
        }
        if (headquarter) {
            whereClauses.push('s.headquarter = :headquarter');
            replacements.headquarter = headquarter;
        }

        let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        let sql = '';
        if (type === 'Stockist') {
            sql = `
                SELECT s.stockist, s.headquarter, s.month, s.year, SUM(s.amount) as "totalSales"
                FROM xl_secondary_sales s
                ${whereSql}
                GROUP BY s.stockist, s.headquarter, s.month, s.year
            `;
        } else {
            // Product Wise for Stockist
            sql = `
                SELECT 
                    i.product, 
                    SUM(COALESCE(NULLIF(i."salesQty", 0), i.qty, 0)) as quantity, 
                    MAX(COALESCE(NULLIF(i."customPrice", 0), NULLIF(i."basePrice", 0), pr.ptr, 0)) as price,
                    SUM(COALESCE(NULLIF(i."salesQty", 0), i.qty, 0) * COALESCE(NULLIF(i."customPrice", 0), NULLIF(i."basePrice", 0), pr.ptr, 0)) as "totalSales"
                FROM xl_secondary_sales s
                JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                LEFT JOIN xl_products pr ON (i.product = pr.uid OR i.product = pr."_id" OR i."productId" = pr.uid OR i."productId" = pr."_id")
                ${whereSql}
                GROUP BY i.product
            `;
        }

        let data = await sequelize.query(sql, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        // Fallback to s.productsData JSON if items query returned 0 rows
        if ((!data || data.length === 0) && type !== 'Stockist') {
            try {
                const rawSales = await sequelize.query(`
                    SELECT s."productsData"
                    FROM xl_secondary_sales s
                    ${whereSql}
                `, { replacements, type: sequelize.QueryTypes.SELECT });

                const prodMapTemp = {};
                rawSales.forEach(s => {
                    if (!s.productsData) return;
                    try {
                        const parsed = typeof s.productsData === 'string' ? JSON.parse(s.productsData) : s.productsData;
                        if (Array.isArray(parsed)) {
                            parsed.forEach(it => {
                                const pId = it.productId || it.product;
                                const qty = Number(it.salesQty || it.qty || 0);
                                const price = Number(it.customPrice || it.basePrice || it.price || 0);
                                if (pId && qty > 0) {
                                    if (!prodMapTemp[pId]) {
                                        prodMapTemp[pId] = { product: pId, quantity: 0, price: price, totalSales: 0 };
                                    }
                                    prodMapTemp[pId].quantity += qty;
                                    prodMapTemp[pId].price = Math.max(prodMapTemp[pId].price, price);
                                    prodMapTemp[pId].totalSales += (qty * price);
                                }
                            });
                        }
                    } catch(e) {}
                });
                data = Object.values(prodMapTemp);
            } catch (err) {
                console.error('Secondary productsData fallback error:', err);
            }
        }

        const { XlProduct, XlStockist } = require('../db');
        
        const stockists = await XlStockist.findAll({ raw: true });
        const stockMap = {};
        stockists.forEach(st => {
            if (st.uid) stockMap[st.uid] = st.businessName || st.name;
            if (st._id) stockMap[st._id] = st.businessName || st.name;
        });

        const products = await XlProduct.findAll({ raw: true });
        const prodMap = {};
        products.forEach(pr => {
            if (pr.uid) prodMap[pr.uid] = pr.productName || pr.name;
            if (pr._id) prodMap[pr._id] = pr.productName || pr.name;
        });

        data.forEach(d => {
            if (d.product && prodMap[d.product]) d.productName = prodMap[d.product];
            if (d.stockist && stockMap[d.stockist]) d.stockistName = stockMap[d.stockist];
            d.totalSales = Math.round(Number(d.totalSales || 0));
            d.price = Math.round(Number(d.price || 0));
            d.quantity = Number(d.quantity || 0);
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Secondary Sales Detail Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================= SALES INSIGHTS ANALYTICS =================

function getTrailingSixMonths(endMonth, endYear) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let eM = monthNames.indexOf(endMonth);
    if (eM === -1) eM = new Date().getMonth();
    let eY = parseInt(endYear) || new Date().getFullYear();

    const result = [];
    for (let i = 5; i >= 0; i--) {
        let mIdx = eM - i;
        let y = eY;
        while (mIdx < 0) {
            mIdx += 12;
            y -= 1;
        }
        const mName = monthNames[mIdx];
        const mm = String(mIdx + 1).padStart(2, '0');
        result.push({
            month: mName,
            year: y,
            label: mName,
            yearMonthLike: `${y}-${mm}%`
        });
    }
    return result;
}

router.get('/reports/sales-insights/charts', async (req, res) => {
    try {
        const { sequelize } = require('../db');
        const { endMonth, endYear, dataType = 'Price', valueFormat = 'Thousands', filterType, filterValue, subFilterType, subFilterValue } = req.query;

        const months = getTrailingSixMonths(endMonth, endYear);

        // Value divisor
        let divisor = 1000;
        if (valueFormat === 'Hundreds') divisor = 100;
        else if (valueFormat === 'Lakhs') divisor = 100000;

        const chartData = [];

        for (const m of months) {
            let priVal = 0;
            let secVal = 0;

            // Common Month Condition
            const priMonthCond = `((p.month = '${m.month}' AND p.year = '${m.year}') OR (p.date LIKE '${m.yearMonthLike}'))`;
            const secMonthCond = `((s.month = '${m.month}' AND s.year = '${m.year}') OR (s.date LIKE '${m.yearMonthLike}'))`;

            // Entity filters
            let priEntityCond = '';
            let secEntityCond = '';
            let priItemCond = '';
            let secItemCond = '';
            let replacements = {};

            const targetFilterType = subFilterType || filterType;
            const targetFilterVal = subFilterValue || filterValue;

            if (filterType === 'User' && filterValue) {
                const ctx = await resolveUserContext(filterValue);
                if (ctx.hq) {
                    priEntityCond += ` AND (p."employeeId" = :userFilter OR LOWER(TRIM(p.headquarter)) = LOWER(TRIM(:userHq)))`;
                    secEntityCond += ` AND (s."employeeId" = :userFilter OR LOWER(TRIM(s.headquarter)) = LOWER(TRIM(:userHq)))`;
                    replacements.userFilter = filterValue;
                    replacements.userHq = ctx.hq;
                } else {
                    priEntityCond += ` AND p."employeeId" = :userFilter`;
                    secEntityCond += ` AND s."employeeId" = :userFilter`;
                    replacements.userFilter = filterValue;
                }
            }
            if (filterType === 'Stockist' && filterValue) {
                priEntityCond += ` AND (p.stockist = :stockistFilter OR p.stockist ILIKE :stockistFilterLike)`;
                secEntityCond += ` AND (s.stockist = :stockistFilter OR s.stockist ILIKE :stockistFilterLike)`;
                replacements.stockistFilter = filterValue;
                replacements.stockistFilterLike = `%${filterValue}%`;
            }
            if ((filterType === 'Headquarter' || filterType === 'Headquarter-Product-Wise' || filterType === 'Headquarter-Stockist-Wise') && filterValue) {
                priEntityCond += ` AND (p.headquarter = :hqFilter OR p.headquarter ILIKE :hqFilterLike)`;
                secEntityCond += ` AND (s.headquarter = :hqFilter OR s.headquarter ILIKE :hqFilterLike)`;
                replacements.hqFilter = filterValue;
                replacements.hqFilterLike = `%${filterValue}%`;
            }
            if (subFilterType === 'Stockist' && subFilterValue) {
                priEntityCond += ` AND (p.stockist = :subStockistFilter OR p.stockist ILIKE :subStockistFilterLike)`;
                secEntityCond += ` AND (s.stockist = :subStockistFilter OR s.stockist ILIKE :subStockistFilterLike)`;
                replacements.subStockistFilter = subFilterValue;
                replacements.subStockistFilterLike = `%${subFilterValue}%`;
            }
            if (targetFilterType === 'Product' && targetFilterVal) {
                priItemCond += ` AND (i.product = :prodFilter OR i."productId" = :prodFilter OR i.product ILIKE :prodFilterLike)`;
                secItemCond += ` AND (i.product = :prodFilter OR i."productId" = :prodFilter OR i.product ILIKE :prodFilterLike)`;
                replacements.prodFilter = targetFilterVal;
                replacements.prodFilterLike = `%${targetFilterVal}%`;
            }

            // PRIMARY QUERY
            try {
                if (targetFilterType === 'Product') {
                    if (dataType === 'Quantity') {
                        const q = `
                            SELECT COALESCE(SUM(i.qty), 0) as val
                            FROM xl_primary_sales p
                            JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                            WHERE ${priMonthCond} ${priEntityCond} ${priItemCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        priVal = Number(row?.val || 0);
                    } else {
                        const q = `
                            SELECT COALESCE(SUM(i.qty * COALESCE(i."basePrice", 0)), 0) as val
                            FROM xl_primary_sales p
                            JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                            WHERE ${priMonthCond} ${priEntityCond} ${priItemCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        priVal = Number(row?.val || 0);
                    }
                } else {
                    if (dataType === 'Quantity') {
                        const q = `
                            SELECT COALESCE(SUM(i.qty), 0) as val
                            FROM xl_primary_sales p
                            JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                            WHERE ${priMonthCond} ${priEntityCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        priVal = Number(row?.val || 0);
                    } else {
                        const q = `
                            SELECT COALESCE(SUM(COALESCE(p."netInvValue", p.amount, 0)), 0) as val
                            FROM xl_primary_sales p
                            WHERE ${priMonthCond} ${priEntityCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        priVal = Number(row?.val || 0);
                    }
                }
            } catch (err) {
                priVal = 0;
            }

            // SECONDARY QUERY
            try {
                if (targetFilterType === 'Product') {
                    if (dataType === 'Quantity') {
                        const q = `
                            SELECT COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as val
                            FROM xl_secondary_sales s
                            JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                            WHERE ${secMonthCond} ${secEntityCond} ${secItemCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        secVal = Number(row?.val || 0);
                    } else {
                        const q = `
                            SELECT COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0) * COALESCE(i."basePrice", i."customPrice", 0)), 0) as val
                            FROM xl_secondary_sales s
                            JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                            WHERE ${secMonthCond} ${secEntityCond} ${secItemCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        secVal = Number(row?.val || 0);
                    }
                } else {
                    if (dataType === 'Quantity') {
                        const q = `
                            SELECT COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as val
                            FROM xl_secondary_sales s
                            JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                            WHERE ${secMonthCond} ${secEntityCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        secVal = Number(row?.val || 0);
                    } else {
                        const q = `
                            SELECT COALESCE(SUM(COALESCE(s.amount, 0)), 0) as val
                            FROM xl_secondary_sales s
                            WHERE ${secMonthCond} ${secEntityCond}
                        `;
                        const [row] = await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT });
                        secVal = Number(row?.val || 0);
                    }
                }
            } catch (err) {
                secVal = 0;
            }

            chartData.push({
                month: m.month,
                year: m.year,
                label: m.label,
                rawPrimary: priVal,
                rawSecondary: secVal,
                primary: Number((priVal / divisor).toFixed(2)),
                secondary: Number((secVal / divisor).toFixed(2))
            });
        }

        res.json({ success: true, data: chartData });
    } catch (err) {
        console.error('Sales Insights Chart Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/reports/sales-insights/table', async (req, res) => {
    try {
        const { sequelize, XlUser, XlStockist, XlHQ, XlProduct, XlDesignation } = require('../db');
        const { endMonth, endYear, reportType = 'User-Wise', drillLevel = 'root', filterValue, subFilterValue } = req.query;

        const months = getTrailingSixMonths(endMonth, endYear);
        const priMonthOrClauses = months.map(m => `((p.month = '${m.month}' AND p.year = '${m.year}') OR (p.date LIKE '${m.yearMonthLike}'))`).join(' OR ');
        const secMonthOrClauses = months.map(m => `((s.month = '${m.month}' AND s.year = '${m.year}') OR (s.date LIKE '${m.yearMonthLike}'))`).join(' OR ');

        // Product cache map
        const allProducts = await XlProduct.findAll({ raw: true });
        const prodNameMap = {};
        allProducts.forEach(p => {
            const name = p.productName || p.name;
            if (p.uid) prodNameMap[p.uid] = name;
            if (p._id) prodNameMap[p._id] = name;
            if (p.productName) prodNameMap[p.productName] = name;
        });

        // Stockist cache map
        const allStockists = await XlStockist.findAll({ raw: true });
        const stockMap = {};
        allStockists.forEach(s => {
            const name = s.businessName || s.name;
            if (s.uid) stockMap[s.uid] = { name, hq: s.headquarter };
            if (s._id) stockMap[s._id] = { name, hq: s.headquarter };
            if (s.name) stockMap[s.name] = { name, hq: s.headquarter };
            if (s.businessName) stockMap[s.businessName] = { name, hq: s.headquarter };
        });

        // 1. PRODUCT LEVEL DRILLDOWN
        if (drillLevel === 'user_products' || drillLevel === 'stockist_products' || drillLevel === 'hq_products' || drillLevel === 'hq_stockist_products') {
            let priWhere = `(${priMonthOrClauses})`;
            let secWhere = `(${secMonthOrClauses})`;
            let replacements = {};

            if (drillLevel === 'user_products' && filterValue) {
                const ctx = await resolveUserContext(filterValue);
                if (ctx.hq) {
                    priWhere += ` AND (p."employeeId" = :filterVal OR LOWER(TRIM(p.headquarter)) = LOWER(TRIM(:userHq)))`;
                    secWhere += ` AND (s."employeeId" = :filterVal OR LOWER(TRIM(s.headquarter)) = LOWER(TRIM(:userHq)))`;
                    replacements.filterVal = filterValue;
                    replacements.userHq = ctx.hq;
                } else {
                    priWhere += ` AND p."employeeId" = :filterVal`;
                    secWhere += ` AND s."employeeId" = :filterVal`;
                    replacements.filterVal = filterValue;
                }
            } else if (drillLevel === 'stockist_products' && filterValue) {
                priWhere += ` AND (p.stockist = :filterVal OR p.stockist ILIKE :filterValLike)`;
                secWhere += ` AND (s.stockist = :filterVal OR s.stockist ILIKE :filterValLike)`;
                replacements.filterVal = filterValue;
                replacements.filterValLike = `%${filterValue}%`;
            } else if (drillLevel === 'hq_products' && filterValue) {
                priWhere += ` AND (p.headquarter = :filterVal OR p.headquarter ILIKE :filterValLike)`;
                secWhere += ` AND (s.headquarter = :filterVal OR s.headquarter ILIKE :filterValLike)`;
                replacements.filterVal = filterValue;
                replacements.filterValLike = `%${filterValue}%`;
            } else if (drillLevel === 'hq_stockist_products') {
                const stockistVal = subFilterValue || filterValue;
                priWhere += ` AND (p.stockist = :stockVal OR p.stockist ILIKE :stockValLike)`;
                secWhere += ` AND (s.stockist = :stockVal OR s.stockist ILIKE :stockValLike)`;
                replacements.stockVal = stockistVal;
                replacements.stockValLike = `%${stockistVal}%`;
            }

            // Primary items aggregated by product
            const priItemsSql = `
                SELECT 
                    i.product as product, 
                    COALESCE(SUM(i.qty * COALESCE(i."basePrice", 0)), 0) as "primarySalesValue", 
                    COALESCE(SUM(i.qty), 0) as "primarySalesQty"
                FROM xl_primary_sales p
                JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                WHERE ${priWhere}
                GROUP BY i.product
            `;
            let priItemRows = [];
            try {
                priItemRows = await sequelize.query(priItemsSql, { replacements, type: sequelize.QueryTypes.SELECT });
            } catch(e) {}

            // Secondary items aggregated by product
            const secItemsSql = `
                SELECT 
                    i.product as product, 
                    COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0) * COALESCE(i."basePrice", i."customPrice", 0)), 0) as "secondarySalesValue", 
                    COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as "secondarySalesQty"
                FROM xl_secondary_sales s
                JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                WHERE ${secWhere}
                GROUP BY i.product
            `;
            let secItemRows = [];
            try {
                secItemRows = await sequelize.query(secItemsSql, { replacements, type: sequelize.QueryTypes.SELECT });
            } catch(e) {}

            const mergedProducts = {};

            // Seed with all catalog products so zero sales entries appear if needed, or from query
            priItemRows.forEach(r => {
                const rawProd = r.product || 'Unknown Product';
                const name = prodNameMap[rawProd] || rawProd;
                if (!mergedProducts[name]) {
                    mergedProducts[name] = { productName: name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                }
                mergedProducts[name].primarySalesValue += Number(r.primarySalesValue || 0);
                mergedProducts[name].primarySalesQty += Number(r.primarySalesQty || 0);
            });

            secItemRows.forEach(r => {
                const rawProd = r.product || 'Unknown Product';
                const name = prodNameMap[rawProd] || rawProd;
                if (!mergedProducts[name]) {
                    mergedProducts[name] = { productName: name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                }
                mergedProducts[name].secondarySalesValue += Number(r.secondarySalesValue || 0);
                mergedProducts[name].secondarySalesQty += Number(r.secondarySalesQty || 0);
            });

            // If empty, return products list from catalog with 0
            if (Object.keys(mergedProducts).length === 0) {
                allProducts.slice(0, 30).forEach(p => {
                    const name = p.productName || p.name;
                    mergedProducts[name] = { productName: name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                });
            }

            const tableRows = Object.values(mergedProducts).map((item, idx) => ({
                srNo: idx + 1,
                productName: item.productName,
                primarySalesValue: Number(item.primarySalesValue.toFixed(2)),
                primarySalesQty: Math.round(item.primarySalesQty),
                secondarySalesValue: Number(item.secondarySalesValue.toFixed(2)),
                secondarySalesQty: Math.round(item.secondarySalesQty)
            }));

            return res.json({ success: true, data: tableRows, totalEntries: tableRows.length });
        }

        // 2. HEADQUARTER-STOCKIST-WISE -> DRILLDOWN TO STOCKISTS
        if (drillLevel === 'hq_stockists' && filterValue) {
            let priWhere = `(${priMonthOrClauses}) AND (p.headquarter = :hq OR p.headquarter ILIKE :hqLike)`;
            let secWhere = `(${secMonthOrClauses}) AND (s.headquarter = :hq OR s.headquarter ILIKE :hqLike)`;
            let replacements = { hq: filterValue, hqLike: `%${filterValue}%` };

            const priSql = `
                SELECT 
                    p.stockist as stockist,
                    COALESCE(SUM(COALESCE(p."netInvValue", p.amount, 0)), 0) as "primarySalesValue"
                FROM xl_primary_sales p
                WHERE ${priWhere}
                GROUP BY p.stockist
            `;
            const priQtySql = `
                SELECT 
                    p.stockist as stockist,
                    COALESCE(SUM(i.qty), 0) as "primarySalesQty"
                FROM xl_primary_sales p
                JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                WHERE ${priWhere}
                GROUP BY p.stockist
            `;

            const secSql = `
                SELECT 
                    s.stockist as stockist,
                    COALESCE(SUM(COALESCE(s.amount, 0)), 0) as "secondarySalesValue"
                FROM xl_secondary_sales s
                WHERE ${secWhere}
                GROUP BY s.stockist
            `;
            const secQtySql = `
                SELECT 
                    s.stockist as stockist,
                    COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as "secondarySalesQty"
                FROM xl_secondary_sales s
                JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                WHERE ${secWhere}
                GROUP BY s.stockist
            `;

            let priRows = [], priQtyRows = [], secRows = [], secQtyRows = [];
            try {
                [priRows, priQtyRows, secRows, secQtyRows] = await Promise.all([
                    sequelize.query(priSql, { replacements, type: sequelize.QueryTypes.SELECT }).catch(() => []),
                    sequelize.query(priQtySql, { replacements, type: sequelize.QueryTypes.SELECT }).catch(() => []),
                    sequelize.query(secSql, { replacements, type: sequelize.QueryTypes.SELECT }).catch(() => []),
                    sequelize.query(secQtySql, { replacements, type: sequelize.QueryTypes.SELECT }).catch(() => []),
                ]);
            } catch(e) {}

            const merged = {};
            // Also find stockists in that HQ from XlStockist
            const hqStockists = allStockists.filter(st => (st.headquarter || '').toLowerCase() === filterValue.toLowerCase());
            hqStockists.forEach(st => {
                const name = st.businessName || st.name;
                merged[st.uid || st._id || name] = {
                    stockistId: st.uid || st._id,
                    stockistName: name,
                    primarySalesValue: 0,
                    primarySalesQty: 0,
                    secondarySalesValue: 0,
                    secondarySalesQty: 0
                };
            });

            priRows.forEach(r => {
                const sId = r.stockist || 'Unknown';
                const sObj = stockMap[sId] || { name: sId };
                const key = sId;
                if (!merged[key]) merged[key] = { stockistId: sId, stockistName: sObj.name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                merged[key].primarySalesValue += Number(r.primarySalesValue || 0);
            });
            priQtyRows.forEach(r => {
                const key = r.stockist || 'Unknown';
                if (merged[key]) merged[key].primarySalesQty += Number(r.primarySalesQty || 0);
            });
            secRows.forEach(r => {
                const sId = r.stockist || 'Unknown';
                const sObj = stockMap[sId] || { name: sId };
                const key = sId;
                if (!merged[key]) merged[key] = { stockistId: sId, stockistName: sObj.name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                merged[key].secondarySalesValue += Number(r.secondarySalesValue || 0);
            });
            secQtyRows.forEach(r => {
                const key = r.stockist || 'Unknown';
                if (merged[key]) merged[key].secondarySalesQty += Number(r.secondarySalesQty || 0);
            });

            const tableRows = Object.values(merged).map((m, idx) => ({
                srNo: idx + 1,
                stockistId: m.stockistId,
                stockistName: m.stockistName,
                primarySalesValue: Number(m.primarySalesValue.toFixed(2)),
                primarySalesQty: Math.round(m.primarySalesQty),
                secondarySalesValue: Number(m.secondarySalesValue.toFixed(2)),
                secondarySalesQty: Math.round(m.secondarySalesQty)
            }));

            return res.json({ success: true, data: tableRows, totalEntries: tableRows.length });
        }

        // 3. ROOT LEVEL: USER-WISE
        if (reportType === 'User-Wise') {
            const allUsers = await XlUser.findAll({ raw: true });
            
            // Primary sales by user
            const priUserSql = `
                SELECT 
                    p."employeeId" as "employeeId",
                    COALESCE(SUM(COALESCE(p."netInvValue", p.amount, 0)), 0) as "primarySalesValue"
                FROM xl_primary_sales p
                WHERE ${priMonthOrClauses}
                GROUP BY p."employeeId"
            `;
            const priUserQtySql = `
                SELECT 
                    p."employeeId" as "employeeId",
                    COALESCE(SUM(i.qty), 0) as "primarySalesQty"
                FROM xl_primary_sales p
                JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                WHERE ${priMonthOrClauses}
                GROUP BY p."employeeId"
            `;

            // Secondary sales by user
            const secUserSql = `
                SELECT 
                    s."employeeId" as "employeeId",
                    COALESCE(SUM(COALESCE(s.amount, 0)), 0) as "secondarySalesValue"
                FROM xl_secondary_sales s
                WHERE ${secMonthOrClauses}
                GROUP BY s."employeeId"
            `;
            const secUserQtySql = `
                SELECT 
                    s."employeeId" as "employeeId",
                    COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as "secondarySalesQty"
                FROM xl_secondary_sales s
                JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                WHERE ${secMonthOrClauses}
                GROUP BY s."employeeId"
            `;

            let [priRows, priQtyRows, secRows, secQtyRows] = await Promise.all([
                sequelize.query(priUserSql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(priUserQtySql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(secUserSql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(secUserQtySql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
            ]);

            const userMap = {};
            allUsers.forEach(u => {
                const empId = u.employeeId || u.uid || u._id;
                userMap[empId] = {
                    employeeId: empId,
                    userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Employee ' + empId,
                    designation: u.designation || 'MR',
                    primarySalesValue: 0,
                    primarySalesQty: 0,
                    secondarySalesValue: 0,
                    secondarySalesQty: 0
                };
            });

            priRows.forEach(r => {
                const key = r.employeeId;
                if (!userMap[key]) {
                    userMap[key] = { employeeId: key, userName: 'Employee ' + key, designation: 'MR', primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                }
                userMap[key].primarySalesValue += Number(r.primarySalesValue || 0);
            });
            priQtyRows.forEach(r => {
                if (userMap[r.employeeId]) userMap[r.employeeId].primarySalesQty += Number(r.primarySalesQty || 0);
            });
            secRows.forEach(r => {
                const key = r.employeeId;
                if (!userMap[key]) {
                    userMap[key] = { employeeId: key, userName: 'Employee ' + key, designation: 'MR', primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                }
                userMap[key].secondarySalesValue += Number(r.secondarySalesValue || 0);
            });
            secQtyRows.forEach(r => {
                if (userMap[r.employeeId]) userMap[r.employeeId].secondarySalesQty += Number(r.secondarySalesQty || 0);
            });

            const tableRows = Object.values(userMap).map((u, idx) => ({
                srNo: idx + 1,
                employeeId: u.employeeId,
                userName: u.userName,
                designation: u.designation,
                primarySalesValue: Number(u.primarySalesValue.toFixed(2)),
                primarySalesQty: Math.round(u.primarySalesQty),
                secondarySalesValue: Number(u.secondarySalesValue.toFixed(2)),
                secondarySalesQty: Math.round(u.secondarySalesQty)
            }));

            return res.json({ success: true, data: tableRows, totalEntries: tableRows.length });
        }

        // 4. ROOT LEVEL: STOCKIST-WISE
        if (reportType === 'Stockist-Wise') {
            const priStockSql = `
                SELECT 
                    p.stockist as stockist,
                    p.headquarter as headquarter,
                    COALESCE(SUM(COALESCE(p."netInvValue", p.amount, 0)), 0) as "primarySalesValue"
                FROM xl_primary_sales p
                WHERE ${priMonthOrClauses}
                GROUP BY p.stockist, p.headquarter
            `;
            const priStockQtySql = `
                SELECT 
                    p.stockist as stockist,
                    COALESCE(SUM(i.qty), 0) as "primarySalesQty"
                FROM xl_primary_sales p
                JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                WHERE ${priMonthOrClauses}
                GROUP BY p.stockist
            `;

            const secStockSql = `
                SELECT 
                    s.stockist as stockist,
                    s.headquarter as headquarter,
                    COALESCE(SUM(COALESCE(s.amount, 0)), 0) as "secondarySalesValue"
                FROM xl_secondary_sales s
                WHERE ${secMonthOrClauses}
                GROUP BY s.stockist, s.headquarter
            `;
            const secStockQtySql = `
                SELECT 
                    s.stockist as stockist,
                    COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as "secondarySalesQty"
                FROM xl_secondary_sales s
                JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                WHERE ${secMonthOrClauses}
                GROUP BY s.stockist
            `;

            let [priRows, priQtyRows, secRows, secQtyRows] = await Promise.all([
                sequelize.query(priStockSql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(priStockQtySql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(secStockSql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(secStockQtySql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
            ]);

            const merged = {};
            allStockists.forEach(st => {
                const sId = st.uid || st._id || st.name;
                merged[sId] = {
                    stockistId: sId,
                    stockistName: st.businessName || st.name,
                    headquarter: st.headquarter || 'HO',
                    primarySalesValue: 0,
                    primarySalesQty: 0,
                    secondarySalesValue: 0,
                    secondarySalesQty: 0
                };
            });

            priRows.forEach(r => {
                const sId = r.stockist || 'Unknown';
                const sObj = stockMap[sId] || { name: sId, hq: r.headquarter || 'HO' };
                if (!merged[sId]) merged[sId] = { stockistId: sId, stockistName: sObj.name, headquarter: sObj.hq || r.headquarter || 'HO', primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                merged[sId].primarySalesValue += Number(r.primarySalesValue || 0);
                if (r.headquarter) merged[sId].headquarter = r.headquarter;
            });
            priQtyRows.forEach(r => {
                if (merged[r.stockist]) merged[r.stockist].primarySalesQty += Number(r.primarySalesQty || 0);
            });
            secRows.forEach(r => {
                const sId = r.stockist || 'Unknown';
                const sObj = stockMap[sId] || { name: sId, hq: r.headquarter || 'HO' };
                if (!merged[sId]) merged[sId] = { stockistId: sId, stockistName: sObj.name, headquarter: sObj.hq || r.headquarter || 'HO', primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                merged[sId].secondarySalesValue += Number(r.secondarySalesValue || 0);
                if (r.headquarter) merged[sId].headquarter = r.headquarter;
            });
            secQtyRows.forEach(r => {
                if (merged[r.stockist]) merged[r.stockist].secondarySalesQty += Number(r.secondarySalesQty || 0);
            });

            const tableRows = Object.values(merged).map((s, idx) => ({
                srNo: idx + 1,
                stockistId: s.stockistId,
                stockistName: s.stockistName,
                headquarter: s.headquarter,
                primarySalesValue: Number(s.primarySalesValue.toFixed(2)),
                primarySalesQty: Math.round(s.primarySalesQty),
                secondarySalesValue: Number(s.secondarySalesValue.toFixed(2)),
                secondarySalesQty: Math.round(s.secondarySalesQty)
            }));

            return res.json({ success: true, data: tableRows, totalEntries: tableRows.length });
        }

        // 5. ROOT LEVEL: HEADQUARTER-PRODUCT-WISE or HEADQUARTER-STOCKIST-WISE
        if (reportType === 'Headquarter-Product-Wise' || reportType === 'Headquarter-Stockist-Wise') {
            const allHQs = await XlHQ.findAll({ raw: true });

            const priHqSql = `
                SELECT 
                    p.headquarter as headquarter,
                    COALESCE(SUM(COALESCE(p."netInvValue", p.amount, 0)), 0) as "primarySalesValue"
                FROM xl_primary_sales p
                WHERE ${priMonthOrClauses}
                GROUP BY p.headquarter
            `;
            const priHqQtySql = `
                SELECT 
                    p.headquarter as headquarter,
                    COALESCE(SUM(i.qty), 0) as "primarySalesQty"
                FROM xl_primary_sales p
                JOIN xl_primary_sales_items i ON p."_id" = i."saleId"
                WHERE ${priMonthOrClauses}
                GROUP BY p.headquarter
            `;

            const secHqSql = `
                SELECT 
                    s.headquarter as headquarter,
                    COALESCE(SUM(COALESCE(s.amount, 0)), 0) as "secondarySalesValue"
                FROM xl_secondary_sales s
                WHERE ${secMonthOrClauses}
                GROUP BY s.headquarter
            `;
            const secHqQtySql = `
                SELECT 
                    s.headquarter as headquarter,
                    COALESCE(SUM(COALESCE(i."salesQty", i.qty, 0)), 0) as "secondarySalesQty"
                FROM xl_secondary_sales s
                JOIN xl_secondary_sales_items i ON s."_id" = i."saleId"
                WHERE ${secMonthOrClauses}
                GROUP BY s.headquarter
            `;

            let [priRows, priQtyRows, secRows, secQtyRows] = await Promise.all([
                sequelize.query(priHqSql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(priHqQtySql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(secHqSql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
                sequelize.query(secHqQtySql, { type: sequelize.QueryTypes.SELECT }).catch(() => []),
            ]);

            const merged = {};
            allHQs.forEach(hq => {
                const name = hq.hqName || hq.name;
                merged[name] = {
                    headquarter: name,
                    primarySalesValue: 0,
                    primarySalesQty: 0,
                    secondarySalesValue: 0,
                    secondarySalesQty: 0
                };
            });

            priRows.forEach(r => {
                const name = r.headquarter || 'HO';
                if (!merged[name]) merged[name] = { headquarter: name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                merged[name].primarySalesValue += Number(r.primarySalesValue || 0);
            });
            priQtyRows.forEach(r => {
                const name = r.headquarter || 'HO';
                if (merged[name]) merged[name].primarySalesQty += Number(r.primarySalesQty || 0);
            });
            secRows.forEach(r => {
                const name = r.headquarter || 'HO';
                if (!merged[name]) merged[name] = { headquarter: name, primarySalesValue: 0, primarySalesQty: 0, secondarySalesValue: 0, secondarySalesQty: 0 };
                merged[name].secondarySalesValue += Number(r.secondarySalesValue || 0);
            });
            secQtyRows.forEach(r => {
                const name = r.headquarter || 'HO';
                if (merged[name]) merged[name].secondarySalesQty += Number(r.secondarySalesQty || 0);
            });

            const tableRows = Object.values(merged).map((h, idx) => ({
                srNo: idx + 1,
                headquarter: h.headquarter,
                primarySalesValue: Number(h.primarySalesValue.toFixed(2)),
                primarySalesQty: Math.round(h.primarySalesQty),
                secondarySalesValue: Number(h.secondarySalesValue.toFixed(2)),
                secondarySalesQty: Math.round(h.secondarySalesQty)
            }));

            return res.json({ success: true, data: tableRows, totalEntries: tableRows.length });
        }

        res.json({ success: true, data: [] });
    } catch (err) {
        console.error('Sales Insights Table Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});











// ================= SECONDARY SALES =================


router.get('/secondary-sales/all', async (req, res) => {
    try {
        const { employeeId, designation, month, year } = req.query;
        let whereClause = {};

        // Self-heal records where month was set from entry date instead of invoiceDate
        try {
            const { sequelize } = require('../db');
            await sequelize.query(`
                UPDATE xl_secondary_sales 
                SET "month" = TRIM(TO_CHAR(TO_DATE("invoiceDate", 'YYYY-MM-DD'), 'Mon')),
                    "year" = TO_CHAR(TO_DATE("invoiceDate", 'YYYY-MM-DD'), 'YYYY')
                WHERE "invoiceDate" IS NOT NULL 
                  AND "invoiceDate" ~ '^\\d{4}-\\d{2}-\\d{2}$'
                  AND "month" != TRIM(TO_CHAR(TO_DATE("invoiceDate", 'YYYY-MM-DD'), 'Mon'))
            `).catch(() => {});
        } catch(e) {}
        
        if (month) {
            const allMonthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const allMonthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            let fullM = month, shortM = month, mm = 1;
            let sIdx = allMonthsShort.indexOf(month);
            if (sIdx !== -1) { fullM = allMonthsFull[sIdx]; mm = sIdx + 1; }
            else { let fIdx = allMonthsFull.indexOf(month); if (fIdx !== -1) { shortM = allMonthsShort[fIdx]; mm = fIdx + 1; } }
            const monthVariants = [month, fullM, shortM, String(mm).padStart(2, '0'), String(mm)];
            const padM = String(mm).padStart(2, '0');
            const { Op } = require('sequelize');

            if (year) {
                whereClause[Op.and] = whereClause[Op.and] || [];
                whereClause[Op.and].push({
                    [Op.or]: [
                        { invoiceDate: { [Op.like]: `${year}-${padM}%` } },
                        { invoiceDate: { [Op.like]: `${padM}-%-${year}` } },
                        { invoiceDate: { [Op.like]: `%-${padM}-${year}` } },
                        {
                            [Op.and]: [
                                { month: { [Op.in]: monthVariants } },
                                { year: String(year) }
                            ]
                        }
                    ]
                });
            } else {
                whereClause[Op.or] = [
                    { invoiceDate: { [Op.like]: `%-${padM}-%` } },
                    { month: { [Op.in]: monthVariants } }
                ];
            }
        } else if (year) {
            whereClause.year = year;
        }
        
        // XLA admin (designation null/empty, 'ADMIN', or 'HO') sees ALL records
        const isXlaAdminSec = !designation || designation === 'ADMIN' || designation === 'HO' || designation === 'admin' || designation === 'null' || designation === 'undefined';
        if (!isXlaAdminSec && employeeId && employeeId !== 'null' && employeeId !== 'undefined') {
            whereClause.employeeId = employeeId;
        }

        // XL mobile users viewing their own history see all their records (Pending, Approved, Rejected)
        // Admin register defaults to Approved unless status=all is specified
        if (req.query.status && req.query.status !== 'all') {
            whereClause.status = req.query.status;
        } else if (req.query.status === 'all' || (!isXlaAdminSec && employeeId)) {
            // No status restriction for XL user history
        } else if (!req.query.status) {
            whereClause.status = 'Approved';
        }

        const { XlSecondarySalesItem } = require('../db');
        const sales = await XlSecondarySales.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [{ model: XlSecondarySalesItem, as: 'items' }]
        });
        
        // Backwards compatibility and date format normalization
        sales.forEach(sale => {
            if (sale.date) sale.setDataValue('date', normalizeDateStr(sale.date));
            if (sale.invoiceDate) sale.setDataValue('invoiceDate', normalizeDateStr(sale.invoiceDate));
            if (sale.items && sale.items.length > 0) {
                sale.setDataValue('productsData', JSON.stringify(sale.items));
            }
        });
        res.json({ success: true, data: sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/secondary-sales/:id', async (req, res) => {
    try {
        const { XlSecondarySalesItem } = require('../db');
        const sale = await XlSecondarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Not found' });
        // Delete child items first to avoid FK constraint issues
        try { await XlSecondarySalesItem.destroy({ where: { saleId: req.params.id } }); } catch(e) { console.warn('child delete warn:', e.message); }
        await sale.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/secondary-sales', async (req, res) => {
    try {
        const sales = await XlSecondarySales.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/secondary-sales/:id', async (req, res) => {
    try {
        const { XlSecondarySalesItem } = require('../db');
        const sale = await XlSecondarySales.findByPk(req.params.id, {
            include: [{ model: XlSecondarySalesItem, as: 'items' }]
        });
        if (!sale) return res.status(404).json({ success: false, message: 'Not found' });
        const saleData = sale.toJSON();
        // Always prefer productsData JSON (most up-to-date after edits); fall back to items if missing
        if (saleData.productsData) {
            try { JSON.parse(saleData.productsData); } catch(e) { saleData.productsData = null; }
        }
        if (!saleData.productsData && saleData.items && saleData.items.length > 0) {
            saleData.productsData = JSON.stringify(saleData.items);
        }
        res.json({ success: true, data: saleData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/secondary-sales/save', async (req, res) => {
    try {
        const { employeeId, date, month: reqMonth, year: reqYear, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData, status, fromAdmin } = req.body;
        
        const savedDate = normalizeDateStr(date) || normalizeDateStr(new Date());
        const savedInvDate = normalizeDateStr(invoiceDate) || savedDate;
        const my = getMonthYearFromDate(savedInvDate || savedDate);
        const month = reqMonth || my.month || new Date().toLocaleString('en-US', { month: 'short' });
        const year = reqYear || my.year || new Date().getFullYear().toString();

        const products = typeof productsData === 'string' ? JSON.parse(productsData) : (productsData || []);
        
        const { XlStockist, XlUser, XlAdmin } = require('../db');
        const { Op } = require('sequelize');
        let finalHq = headquarter;
        let stData = null;
        if (stockist) {
            stData = await XlStockist.findOne({ where: { [Op.or]: [{_id: stockist}, {uid: stockist}] } });
            if (stData && !finalHq) finalHq = stData.headquarter;
        }

        // Check if initiator is Admin or if employeeId belongs to Admin
        let isAdminSender = !!fromAdmin;
        if (employeeId) {
            if (employeeId === 'ADMIN' || employeeId.toUpperCase().startsWith('ADM')) isAdminSender = true;
            else {
                const adminCheck = await XlAdmin.findOne({ where: { [Op.or]: [{ employeeId }, { uid: employeeId }] } });
                if (adminCheck) isAdminSender = true;
            }
        }

        let finalEmpId = employeeId;
        if (isAdminSender || !finalEmpId || finalEmpId === 'ADMIN') {
            if (stData && (stData.userAllotted || stData.employeeId)) {
                finalEmpId = stData.userAllotted || stData.employeeId;
            }
            if ((!finalEmpId || finalEmpId === 'ADMIN' || finalEmpId === employeeId) && finalHq) {
                const rep = await XlUser.findOne({ where: { hq: finalHq, status: 'Active' } });
                if (rep && rep.employeeId) finalEmpId = rep.employeeId;
                else if (!finalEmpId || finalEmpId === 'ADMIN' || isAdminSender) finalEmpId = 'VACANT_' + finalHq;
            }
        }

        const finalStatus = (isAdminSender || status === 'Approved') ? 'Approved' : (status || 'Pending');

        const sale = await XlSecondarySales.create({
            employeeId: finalEmpId,
            date: savedDate,
            month,
            year,
            invoiceDate: savedInvDate,
            invoiceNumber,
            division,
            headquarter: finalHq,
            stockist,
            amount,
            productsData: JSON.stringify(products),
            status: finalStatus
        });

        if (products.length > 0) {
            const { XlSecondarySalesItem } = require('../db');
            const itemRows = products.map(p => ({
                saleId: sale._id,
                productId: p.productId || p.product || '',
                product: p.product || p.productId || '',
                qty: p.salesQty || p.qty || 0,
                salesQty: p.salesQty || p.qty || 0,
                basePrice: p.basePrice || p.customPrice || 0,
                customPrice: p.basePrice || p.customPrice || 0,
                priceType: p.priceType || p.selectedPriceType || 'PTR',
                selectedPriceType: p.priceType || p.selectedPriceType || 'PTR',
                openingQty: p.openingQty || 0,
                receivedQty: p.receivedQty || 0,
                free: p.free || p.freeStocks || 0,
                freeStocks: p.free || p.freeStocks || 0,
                closingQty: p.closingQty || 0
            }));
            await XlSecondarySalesItem.bulkCreate(itemRows);
        }
        res.json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/secondary-sales/update/:id', async (req, res) => {
    try {
        const { XlSecondarySalesItem } = require('../db');
        const { date, month: reqMonth, year: reqYear, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData, status } = req.body;
        
        const savedDate = normalizeDateStr(date) || normalizeDateStr(new Date());
        const savedInvDate = normalizeDateStr(invoiceDate) || savedDate;
        const my = getMonthYearFromDate(savedInvDate || savedDate);
        const month = reqMonth || my.month || new Date().toLocaleString('en-US', { month: 'short' });
        const year = reqYear || my.year || new Date().getFullYear().toString();

        const products = typeof productsData === 'string' ? JSON.parse(productsData) : (productsData || []);

        const { XlStockist } = require('../db');
        const { Op } = require('sequelize');
        let finalHq = headquarter;
        if (!finalHq && stockist) {
            const stData = await XlStockist.findOne({ where: { [Op.or]: [{_id: stockist}, {uid: stockist}] } });
            if (stData) finalHq = stData.headquarter;
        }

        const sale = await XlSecondarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        const updateFields = { date: savedDate, month, year, invoiceDate: savedInvDate, invoiceNumber, division, headquarter: finalHq, stockist, amount, productsData: JSON.stringify(products) };
        if (sale.status === 'Approved') {
            updateFields.status = 'Approved';
        } else if (status) {
            updateFields.status = status;
        }

        await sale.update(updateFields);

        // Sync child items: delete old, insert new
        await XlSecondarySalesItem.destroy({ where: { saleId: req.params.id } });
        if (products.length > 0) {
            const itemRows = products.map(p => ({
                saleId: req.params.id,
                productId: p.productId || p.product || '',
                product: p.product || p.productId || '',
                qty: p.salesQty || p.qty || 0,
                salesQty: p.salesQty || p.qty || 0,
                basePrice: p.basePrice || p.customPrice || 0,
                customPrice: p.basePrice || p.customPrice || 0,
                priceType: p.priceType || p.selectedPriceType || 'PTR',
                selectedPriceType: p.priceType || p.selectedPriceType || 'PTR',
                openingQty: p.openingQty || 0,
                receivedQty: p.receivedQty || 0,
                free: p.free || p.freeStocks || 0,
                freeStocks: p.free || p.freeStocks || 0,
                closingQty: p.closingQty || 0
            }));
            await XlSecondarySalesItem.bulkCreate(itemRows);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/secondary-sales/delete/:id', async (req, res) => {
    try {
        const { XlSecondarySalesItem } = require('../db');
        // Delete child items first to avoid FK constraint issues
        try { await XlSecondarySalesItem.destroy({ where: { saleId: req.params.id } }); } catch(e) { console.warn('child delete warn:', e.message); }
        await XlSecondarySales.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/secondary-sales-data/opening-balance', async (req, res) => {
    try {
        const { stockist, prevMonth, prevYear, productId } = req.query;
        const { XlStockist, XlProduct } = require('../db');
        const { Op } = require('sequelize');

        const targetStockist = await XlStockist.findOne({
            where: { [Op.or]: [{ uid: stockist }, { _id: stockist }, { businessName: stockist }, { name: stockist }] }
        });
        const searchIds = [stockist];
        if (targetStockist) {
            if (targetStockist.uid) searchIds.push(targetStockist.uid);
            if (targetStockist._id) searchIds.push(targetStockist._id);
            if (targetStockist.businessName) searchIds.push(targetStockist.businessName);
            if (targetStockist.name) searchIds.push(targetStockist.name);
        }

        // Resolve productId to all aliases
        let productAliases = [productId];
        if (productId) {
            const prod = await XlProduct.findOne({
                where: { [Op.or]: [{ uid: productId }, { _id: productId }, { productName: productId }, { name: productId }] }
            });
            if (prod) {
                if (prod.uid) productAliases.push(prod.uid);
                if (prod._id) productAliases.push(String(prod._id));
                if (prod.productName) productAliases.push(prod.productName);
                if (prod.name) productAliases.push(prod.name);
            }
        }
        productAliases = [...new Set(productAliases.filter(Boolean))];

        const sales = await XlSecondarySales.findAll({
            where: { stockist: { [Op.in]: searchIds }, month: prevMonth, year: prevYear }
        });

        let openingQty = 0;
        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const pid = String(r.productId || r.product || '');
                        if (productAliases.includes(pid)) {
                            openingQty += (Number(r.closingQty) || 0);
                        }
                    });
                } catch(e) {}
            }
        });

        res.json({ success: true, openingQty });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.get('/secondary-sales-data/auto-populate', async (req, res) => {
    try {
        const { stockist, month, year } = req.query;
        if (!stockist || !month || !year) return res.json({ success: true, data: [] });

        const { XlStockist, XlProduct } = require('../db');
        const { Op } = require('sequelize');

        // Look up the stockist to get all its possible identifiers
        const targetStockist = await XlStockist.findOne({
            where: { [Op.or]: [{ uid: stockist }, { _id: stockist }, { businessName: stockist }, { name: stockist }] }
        });
        const searchIds = [stockist];
        if (targetStockist) {
            if (targetStockist.uid) searchIds.push(targetStockist.uid);
            if (targetStockist._id) searchIds.push(targetStockist._id);
            if (targetStockist.businessName) searchIds.push(targetStockist.businessName);
            if (targetStockist.name) searchIds.push(targetStockist.name);
        }

        // Load all products to resolve name → uid
        const allProducts = await XlProduct.findAll();
        const resolveToUid = (pid) => {
            if (!pid) return null;
            const p = allProducts.find(p =>
                p.uid === pid || String(p._id) === String(pid) ||
                p.productName === pid || p.name === pid
            );
            return p ? (p.uid || String(p._id)) : pid;
        };

        // Only count Approved primary invoices
        const sales = await XlPrimarySales.findAll({
            where: { stockist: { [Op.in]: searchIds }, month, year, status: 'Approved' }
        });

        const productMap = {}; // uid → receivedQty
        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const rawPid = r.productId || r.product;
                        const uid = resolveToUid(rawPid);
                        if (!uid) return;
                        if (!productMap[uid]) productMap[uid] = 0;
                        productMap[uid] += (Number(r.quantity) || Number(r.qty) || 0) + (Number(r.freeStocks) || Number(r.free) || 0);
                    });
                } catch(e) {}
            }
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const prevMonthIndex = months.indexOf(month) - 1;
        const prevMonth = prevMonthIndex >= 0 ? months[prevMonthIndex] : 'Dec';
        const prevYear = prevMonthIndex >= 0 ? year : String(Number(year) - 1);

        const prevSecSales = await XlSecondarySales.findAll({
            where: { stockist: { [Op.in]: searchIds }, month: prevMonth, year: prevYear }
        });

        const closingMap = {}; // uid → closingQty
        prevSecSales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const rawPid = r.productId || r.product;
                        const uid = resolveToUid(rawPid);
                        if (uid) closingMap[uid] = Number(r.closingQty) || 0;
                    });
                } catch(e) {}
            }
        });

        const allProductIds = [...new Set([...Object.keys(productMap), ...Object.keys(closingMap)])];
        const result = allProductIds.map(productId => {
            const p = allProducts.find(x => x.uid === productId || String(x._id) === String(productId) || x.productName === productId);
            return {
                productId: p ? (p.uid || String(p._id)) : productId,
                productName: p ? p.productName : productId,
                receivedQty: productMap[productId] || 0,
                openingQty: closingMap[productId] || 0
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/secondary-sales-data/primary-received', async (req, res) => {
    try {
        const { stockist, month, year, productId } = req.query;
        const { XlStockist, XlProduct } = require('../db');
        const { Op } = require('sequelize');

        // Resolve stockist to all possible IDs
        const targetStockist = await XlStockist.findOne({
            where: {
                [Op.or]: [
                    { uid: stockist },
                    { _id: stockist },
                    { businessName: stockist },
                    { name: stockist }
                ]
            }
        });
        const searchIds = [stockist];
        if (targetStockist) {
            if (targetStockist.uid) searchIds.push(targetStockist.uid);
            if (targetStockist._id) searchIds.push(targetStockist._id);
            if (targetStockist.businessName) searchIds.push(targetStockist.businessName);
            if (targetStockist.name) searchIds.push(targetStockist.name);
        }

        // Resolve productId to all possible aliases (uid, _id, productName, name)
        let productAliases = [productId];
        if (productId) {
            const prod = await XlProduct.findOne({
                where: {
                    [Op.or]: [
                        { uid: productId },
                        { _id: productId },
                        { productName: productId },
                        { name: productId }
                    ]
                }
            });
            if (prod) {
                if (prod.uid) productAliases.push(prod.uid);
                if (prod._id) productAliases.push(String(prod._id));
                if (prod.productName) productAliases.push(prod.productName);
                if (prod.name) productAliases.push(prod.name);
            }
        }
        productAliases = [...new Set(productAliases.filter(Boolean))];

        // Only count Approved primary invoices for this stockist in this month/year
        const sales = await XlPrimarySales.findAll({
            where: {
                stockist: { [Op.in]: searchIds },
                month,
                year,
                status: 'Approved'
            }
        });

        let receivedQty = 0;

        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        const pid = String(r.productId || r.product || '');
                        if (productAliases.includes(pid)) {
                            receivedQty += (Number(r.quantity) || Number(r.qty) || 0) + (Number(r.freeStocks) || Number(r.free) || 0);
                        }
                    });
                } catch(e) {}
            }
        });

        res.json({ success: true, receivedQty });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});




// EXCEL EXPORT ENDPOINT
router.get('/user-performance/export', async (req, res) => {
    try {
        const { userId, month, year } = req.query;
        if (!userId || !month || !year) return res.status(400).send('Missing params');

        const ExcelJS = require('exceljs');
        const { Op } = require('sequelize');
        
        const user = await XlUser.findByPk(userId);
        if(!user) return res.status(404).send('User not found');

        // Fix Month Mapping to match database ('Sep' -> 'september')
        const monthMap = { 'Jan': 'january', 'Feb': 'february', 'Mar': 'march', 'Apr': 'april', 'May': 'may', 'Jun': 'june', 'Jul': 'july', 'Aug': 'august', 'Sep': 'september', 'Oct': 'october', 'Nov': 'november', 'Dec': 'december' };
        const fullMonth = monthMap[month] || month.toLowerCase();

        const perf = await XlPerformanceAnalysis.findOne({ where: { employeeId: user.employeeId || null, month: fullMonth, year } });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Performance_Analysis');

        // Styles
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF282F4D' } }; // Dark blue theme
        const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
        const titleFont = { bold: true, size: 14 };
        const borderStyle = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };

        // Header info
        sheet.addRow(['Report Name:', 'Performance Analysis Reports']).font = titleFont;
        sheet.addRow(['Username:', `${user.firstName || ''} ${user.lastName || ''}`.trim()]).font = { bold: true };
        sheet.addRow(['Report Month:', `${month} ${year}`]).font = { bold: true };
        sheet.addRow(['Generated On:', new Date().toLocaleString()]).font = { bold: true };
        sheet.addRow([]);

        const parseData = (dataStr) => {
            if(!dataStr) return [];
            try {
                let d = JSON.parse(dataStr);
                if(typeof d === 'string') d = JSON.parse(d);
                return Array.isArray(d) ? d : [];
            } catch(e) { return []; }
        };

        const getVal = (v) => Number(v) || 0;

        const applyHeaderStyle = (row) => {
            row.eachCell((cell) => {
                cell.fill = headerFill;
                cell.font = headerFont;
                cell.border = borderStyle;
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
        };

        const applyDataStyle = (row) => {
            row.eachCell((cell, colNumber) => {
                cell.border = borderStyle;
                if (colNumber > 1) cell.alignment = { horizontal: 'center' };
            });
        };

        const addSalesKpi = (title, dataStr, typeColName, targetColName) => {
            const titleRow = sheet.addRow([title.toUpperCase()]);
            titleRow.font = { bold: true, size: 13, color: { argb: 'FF000000' } };
            titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
            titleRow.getCell(1).border = borderStyle;

            let headerRow;
            if (title === 'Brand Analysis') {
                headerRow = sheet.addRow([
                    'Product Name', 'Monthly Sales', 'Monthly Target', 
                    'Week 1 Plan', 'Week 1 Achieved', 'Week 2 Plan', 'Week 2 Achieved', 
                    'Week 3 Plan', 'Week 3 Achieved', 'Week 4 Plan', 'Week 4 Achieved', 
                    'Week 5 Plan', 'Week 5 Achieved', 'Week 6 Plan', 'Week 6 Achieved', 
                    'Total Plan', 'Total Achieved'
                ]);
            } else if (title === 'Outstanding Analysis') {
                headerRow = sheet.addRow([
                    'Stockist Name', 'Total Outstandings', 
                    'Week 1 Plan', 'Week 1 Achieved', 'Week 2 Plan', 'Week 2 Achieved', 
                    'Week 3 Plan', 'Week 3 Achieved', 'Week 4 Plan', 'Week 4 Achieved', 
                    'Week 5 Plan', 'Week 5 Achieved', 'Week 6 Plan', 'Week 6 Achieved', 
                    'Total Plan', 'Total Achieved'
                ]);
            } else {
                headerRow = sheet.addRow([
                    'Entity Name', 'Entity Type', targetColName, 
                    'Week 1 Plan', 'Week 1 Achieved', 'Week 2 Plan', 'Week 2 Achieved', 
                    'Week 3 Plan', 'Week 3 Achieved', 'Week 4 Plan', 'Week 4 Achieved', 
                    'Week 5 Plan', 'Week 5 Achieved', 'Week 6 Plan', 'Week 6 Achieved', 
                    'Total Plan', 'Total Achieved'
                ]);
            }
            
            applyHeaderStyle(headerRow);

            const data = parseData(dataStr);
            if (data.length === 0) {
                const emptyRow = sheet.addRow(['No data available']);
                emptyRow.getCell(1).border = borderStyle;
            } else {
                data.forEach(item => {
                    let tp = 0; let ta = 0;
                    ['week1', 'week2', 'week3', 'week4', 'week5', 'week6'].forEach(w => {
                        if (item[w]) {
                            tp += getVal(item[w].planned);
                            ta += getVal(item[w].achieved);
                        }
                    });

                    let dataRow;
                    if (title === 'Brand Analysis') {
                        dataRow = sheet.addRow([
                            item.entityName, 0,
                            getVal(item.monthlyTarget), 
                            getVal(item.week1?.planned), getVal(item.week1?.achieved),
                            getVal(item.week2?.planned), getVal(item.week2?.achieved),
                            getVal(item.week3?.planned), getVal(item.week3?.achieved),
                            getVal(item.week4?.planned), getVal(item.week4?.achieved),
                            getVal(item.week5?.planned), getVal(item.week5?.achieved),
                            getVal(item.week6?.planned), getVal(item.week6?.achieved),
                            tp, ta
                        ]);
                    } else if (title === 'Outstanding Analysis') {
                        dataRow = sheet.addRow([
                            item.entityName, getVal(item.monthlyTarget), 
                            getVal(item.week1?.planned), getVal(item.week1?.achieved),
                            getVal(item.week2?.planned), getVal(item.week2?.achieved),
                            getVal(item.week3?.planned), getVal(item.week3?.achieved),
                            getVal(item.week4?.planned), getVal(item.week4?.achieved),
                            getVal(item.week5?.planned), getVal(item.week5?.achieved),
                            getVal(item.week6?.planned), getVal(item.week6?.achieved),
                            tp, ta
                        ]);
                    } else {
                        dataRow = sheet.addRow([
                            item.entityName, item.entityType || 'Doctor',
                            getVal(item.monthlyTarget), 
                            getVal(item.week1?.planned), getVal(item.week1?.achieved),
                            getVal(item.week2?.planned), getVal(item.week2?.achieved),
                            getVal(item.week3?.planned), getVal(item.week3?.achieved),
                            getVal(item.week4?.planned), getVal(item.week4?.achieved),
                            getVal(item.week5?.planned), getVal(item.week5?.achieved),
                            getVal(item.week6?.planned), getVal(item.week6?.achieved),
                            tp, ta
                        ]);
                    }
                    applyDataStyle(dataRow);
                });
            }
            sheet.addRow([]);
        };

        const effortMatrix = await buildEffortMatrix(user, month, year, XlDCR, XlDoctor, XlChemist, XlStockist);
        
        const effortTitleRow = sheet.addRow(['EFFORT ANALYSIS']);
        effortTitleRow.font = { bold: true, size: 13, color: { argb: 'FF000000' } };
        effortTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
        effortTitleRow.getCell(1).border = borderStyle;

        const effortHeaderRow = sheet.addRow(['Metrics', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Total']);
        applyHeaderStyle(effortHeaderRow);
        
        effortMatrix.forEach(row => {
            const formattedData = row.data.map((val) => {
                if (row.label.includes('Percentage')) return val.toFixed(2) + '%';
                if (row.label.includes('Average')) return val.toFixed(2);
                return val;
            });
            const dataRow = sheet.addRow([row.label, ...formattedData]);
            applyDataStyle(dataRow);
        });
        
        sheet.addRow([]);

        if (perf) {
            addSalesKpi('Brand Analysis', perf.brandData, 'Product Name', 'Monthly Target');
            addSalesKpi('Account Analysis', perf.accountData, 'Hospital Name', 'Monthly Target');
            addSalesKpi('Key Customer Analysis', perf.keyCustomerData, 'Entity Name', 'Monthly Target');
            addSalesKpi('Customer ROI Analysis', perf.roiData, 'Entity Name', 'Activity Amount');
            addSalesKpi('Outstanding Analysis', perf.outstandingData, 'Stockist Name', 'Total Outstandings');
        }

        // Adjust column widths
        sheet.columns.forEach((column, i) => {
            if (i === 0) {
                column.width = 35; // Wider for Entity Name / Metrics
            } else {
                column.width = 15;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Disposition', `attachment; filename="Performance_Analysis_${user.firstName}_${month}_${year}.xlsx"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
        
    } catch(e) {
        console.error("Export Error:", e);
        res.status(500).send(e.stack || e.message || 'Unknown error');
    }
});






















router.get('/fix-hqs', async (req, res) => {
    try {
        const { XlSecondarySales, XlStockist } = require('../db');
        const { Op } = require('sequelize');
        const sales = await XlSecondarySales.findAll({ where: { [Op.or]: [{ headquarter: null }, { headquarter: '' }] } });
        let updated = 0;
        for (let s of sales) {
            if (s.stockist) {
                const st = await XlStockist.findOne({ where: { [Op.or]: [{_id: s.stockist}, {uid: s.stockist}] } });
                if (st && st.headquarter) {
                    s.headquarter = st.headquarter;
                    await s.save();
                    updated++;
                }
            }
        }
        res.json({ success: true, count: updated });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});


router.get('/controls', async (req, res) => {
    try {
        const controls = await XlDoctorControl.findAll();
        const cities = await XlCity.findAll();
        res.json({ success: true, controls, cities });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});


router.post('/controls', async (req, res) => {
    try {
        const c = await XlDoctorControl.create(req.body);
        res.json({ success: true, control: c });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Dedicated Office Staff Geo-Presence & Time Log Analysis Endpoint
// Completely separate from Field Staff /reports/geo-location-analysis
router.get('/reports/office-geo-analysis', async (req, res) => {
    try {
        const { mode, employeeId, userId, email, date } = req.query;
        const { XlUser, XlAttendance } = require('../db');
        const { Op } = require('sequelize');

        // Mode 1: List all users who either currently have PUNCHING enabled OR have historical office session logs in DB
        if (mode === 'users') {
            const [allUsers, officeAtts] = await Promise.all([
                XlUser.findAll(),
                XlAttendance.findAll({
                    where: {
                        dayRemarks: { [Op.like]: '%isOfficePunchMeta%' }
                    },
                    attributes: ['employeeId']
                })
            ]);
            const empIdsWithOfficeHistory = new Set(officeAtts.map(a => String(a.employeeId || '').trim()).filter(Boolean));

            const eligibleUsers = allUsers
                .map(u => {
                    const plain = u.toJSON ? u.toJSON() : u;
                    let ctrls = plain.controls || {};
                    if (typeof ctrls === 'string') {
                        try { ctrls = JSON.parse(ctrls); } catch (e) { ctrls = {}; }
                    }
                    const currentlyEnabled = Boolean(ctrls.PUNCHING === true);
                    const hadHistorical =
                        Boolean(ctrls.everHadOfficePunching) ||
                        empIdsWithOfficeHistory.has(String(plain.employeeId || '').trim()) ||
                        empIdsWithOfficeHistory.has(String(plain.email || '').trim()) ||
                        empIdsWithOfficeHistory.has(String(plain.uid || '').trim()) ||
                        empIdsWithOfficeHistory.has(String(plain._id || '').trim());

                    return {
                        _id: plain._id,
                        employeeId: plain.employeeId || plain.email || plain._id,
                        firstName: plain.firstName || '',
                        lastName: plain.lastName || '',
                        name: `${plain.firstName || ''} ${plain.lastName || ''}`.trim() || plain.name || plain.email,
                        designation: plain.designation || 'Office / Admin Staff',
                        hq: plain.hq || 'Office',
                        isPunchingCurrentlyEnabled: currentlyEnabled,
                        hasHistoricalOfficeLogs: hadHistorical,
                        officeName: ctrls.officeName || 'Corporate Office (480 sq.ft)',
                        officeRadius: Number(ctrls.officeRadius) || 15,
                        requireWifiLock: Boolean(ctrls.requireWifiLock && ctrls.officeWifiIp)
                    };
                })
                .filter(u => u.isPunchingCurrentlyEnabled || u.hasHistoricalOfficeLogs);

            return res.json({
                success: true,
                users: eligibleUsers
            });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD)' });
        }

        const target = employeeId || userId || email;
        if (!target) {
            return res.status(400).json({ success: false, message: 'Employee identifier is required' });
        }

        const user = await XlUser.findOne({
            where: {
                [Op.or]: [
                    { employeeId: target },
                    { email: target },
                    { _id: target },
                    { uid: target }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let ctrls = user.controls || {};
        if (typeof ctrls === 'string') {
            try { ctrls = JSON.parse(ctrls); } catch (e) { ctrls = {}; }
        }

        const userIds = [user.employeeId, user.email, user._id, user.uid].filter(Boolean);
        const attendance = await XlAttendance.findOne({
            where: {
                employeeId: { [Op.in]: userIds },
                date
            }
        });

        const parseTimeToMinutes = (tStr) => {
            if (!tStr) return null;
            const clean = String(tStr).trim().toUpperCase();
            const m = clean.match(/(\d+):(\d+)(?:\s*(AM|PM))?/);
            if (!m) return null;
            let hrs = parseInt(m[1], 10);
            const mins = parseInt(m[2], 10);
            const meridiem = m[3];
            if (meridiem === 'PM' && hrs < 12) hrs += 12;
            if (meridiem === 'AM' && hrs === 12) hrs = 0;
            return hrs * 60 + mins;
        };

        const formatMins = (mins) => {
            const safe = Math.max(0, Math.round(Number(mins) || 0));
            const h = Math.floor(safe / 60);
            const m = safe % 60;
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        const meta = parseOfficePunchMeta(attendance);
        const savedSnapshot = meta.officeSnapshot || {};

        // Resolve office coordinates from either active user.controls OR preserved historical DB snapshot
        const resolvedOfficeName =
            ctrls.officeName ||
            savedSnapshot.officeName ||
            (meta.sessions[0] && meta.sessions[0].officeName) ||
            'Corporate Office (480 sq.ft)';
        const resolvedOfficeLat =
            ctrls.officeLat != null && ctrls.officeLat !== ''
                ? Number(ctrls.officeLat)
                : savedSnapshot.officeLat != null
                ? Number(savedSnapshot.officeLat)
                : attendance && attendance.punchInLat != null
                ? Number(attendance.punchInLat)
                : null;
        const resolvedOfficeLng =
            ctrls.officeLng != null && ctrls.officeLng !== ''
                ? Number(ctrls.officeLng)
                : savedSnapshot.officeLng != null
                ? Number(savedSnapshot.officeLng)
                : attendance && attendance.punchInLng != null
                ? Number(attendance.punchInLng)
                : null;
        const resolvedOfficeRadius =
            Number(ctrls.officeRadius) || Number(savedSnapshot.officeRadius) || 15;

        let totalInsideMins = 0;
        let totalBreakOutsideMins = 0;
        let autoPunchOutCount = 0;

        const enrichedSessions = meta.sessions.map((s, idx) => {
            const prev = idx > 0 ? meta.sessions[idx - 1] : null;
            let breakMins = 0;
            if (prev && prev.punchOutTime && s.punchInTime) {
                if (prev.punchOutMs && s.punchInMs && Number(s.punchInMs) > Number(prev.punchOutMs)) {
                    breakMins = Math.max(0, Math.round((Number(s.punchInMs) - Number(prev.punchOutMs)) / 60000));
                } else {
                    const pOutM = parseTimeToMinutes(prev.punchOutTime);
                    const pInM = parseTimeToMinutes(s.punchInTime);
                    if (pOutM != null && pInM != null && pInM >= pOutM) {
                        breakMins = pInM - pOutM;
                    }
                }
            }
            totalBreakOutsideMins += breakMins;

            const isOpen = !s.punchOutTime;
            let durMins = Number(s.durationMinutes) || 0;
            if (isOpen && s.punchInMs) {
                durMins = Math.max(1, Math.round((Date.now() - Number(s.punchInMs)) / 60000));
            }
            totalInsideMins += durMins;

            if (s.outType && String(s.outType).toLowerCase().includes('auto')) {
                autoPunchOutCount += 1;
            }

            let distFromOfficeMeters = 0;
            if (
                s.punchInLat != null &&
                s.punchInLng != null &&
                resolvedOfficeLat != null &&
                resolvedOfficeLng != null
            ) {
                distFromOfficeMeters = Math.round(
                    getOfficeDistanceMeters(
                        Number(s.punchInLat),
                        Number(s.punchInLng),
                        resolvedOfficeLat,
                        resolvedOfficeLng
                    )
                );
            }

            return {
                sessionNo: s.sessionNo || idx + 1,
                officeName: s.officeName || resolvedOfficeName,
                punchInTime: s.punchInTime || '--',
                punchOutTime: s.punchOutTime || 'Active Inside Office',
                isActive: isOpen,
                durationMinutes: durMins,
                durationFormatted: formatMins(durMins),
                breakBeforeMinutes: breakMins,
                breakBeforeFormatted: idx === 0 ? 'First Login' : formatMins(breakMins),
                punchInLat: s.punchInLat != null ? Number(s.punchInLat) : null,
                punchInLng: s.punchInLng != null ? Number(s.punchInLng) : null,
                punchOutLat: s.punchOutLat != null ? Number(s.punchOutLat) : null,
                punchOutLng: s.punchOutLng != null ? Number(s.punchOutLng) : null,
                distanceFromOfficeMeters: distFromOfficeMeters,
                outType: s.outType || (isOpen ? 'Active Inside Office' : 'Manual')
            };
        });

        res.json({
            success: true,
            user: {
                _id: user._id,
                employeeId: user.employeeId || user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email,
                designation: user.designation || 'Office / Admin Staff',
                hq: user.hq || 'Office',
                isPunchingCurrentlyEnabled: Boolean(ctrls.PUNCHING === true)
            },
            date,
            officePremises: {
                officeName: resolvedOfficeName,
                officeLat: resolvedOfficeLat,
                officeLng: resolvedOfficeLng,
                officeRadius: resolvedOfficeRadius
            },
            summary: {
                firstPunchIn: attendance?.punchInTime || (enrichedSessions[0]?.punchInTime ?? '--'),
                lastPunchOut:
                    enrichedSessions.length > 0 && enrichedSessions[enrichedSessions.length - 1].isActive
                        ? 'Active Inside Office'
                        : attendance?.punchOutTime || '--',
                totalSessions: enrichedSessions.length,
                totalInsideMinutes: totalInsideMins,
                totalInsideFormatted: formatMins(totalInsideMins),
                totalBreakOutsideMinutes: totalBreakOutsideMins,
                totalBreakOutsideFormatted: formatMins(totalBreakOutsideMins),
                autoPunchOutCount
            },
            sessions: enrichedSessions
        });
    } catch (err) {
        console.error('Error in /reports/office-geo-analysis:', err);
        res.status(500).json({ success: false, message: 'Internal server error calculating office geo-presence report' });
    }
});

// Geo-Location Analysis Report Endpoint
router.get('/reports/geo-location-analysis', async (req, res) => {
    try {
        const { employeeId, userId, email, date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD)' });
        }

        const { XlUser, XlAttendance, XlDCR, XlDoctor, XlChemist, XlStockist } = require('../db');
        const { Op } = require('sequelize');

        // Resolve target user
        let user = null;
        if (userId) {
            user = await XlUser.findByPk(userId);
        }
        if (!user && (employeeId || email)) {
            const target = employeeId || email;
            user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { employeeId: target },
                        { email: target },
                        { _id: target },
                        { uid: target }
                    ]
                }
            });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userIds = [user.employeeId, user.email, user._id, user.uid].filter(Boolean);

        // Fetch Attendance for date
        const attendance = await XlAttendance.findOne({
            where: {
                employeeId: { [Op.in]: userIds },
                date: date
            }
        });

        // Fetch DCRs for date
        const dcrs = await XlDCR.findAll({
            where: {
                employeeId: { [Op.in]: userIds },
                date: date
            },
            order: [['createdAt', 'ASC']]
        });

        const parseTimeToMinutes = (tStr) => {
            if (!tStr) return null;
            const clean = String(tStr).trim().toUpperCase();
            const m = clean.match(/(\d+):(\d+)(?:\s*(AM|PM))?/);
            if (!m) return null;
            let hrs = parseInt(m[1], 10);
            const mins = parseInt(m[2], 10);
            const meridiem = m[3];
            if (meridiem === 'PM' && hrs < 12) hrs += 12;
            if (meridiem === 'AM' && hrs === 12) hrs = 0;
            return hrs * 60 + mins;
        };

        const formatMinutesToHours = (mins) => {
            if (mins == null || isNaN(mins) || mins <= 0) return '0m';
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            if (h > 0) return `${h}h ${m}m`;
            return `${m}m`;
        };

        const calcDistanceKm = (lat1, lon1, lat2, lon2) => {
            if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
            if (Number(lat1) === 0 && Number(lon1) === 0) return 0;
            if (Number(lat2) === 0 && Number(lon2) === 0) return 0;
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const sortedDcrs = [...dcrs].sort((a, b) => {
            const tA = parseTimeToMinutes(a.checkInTime) ?? (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const tB = parseTimeToMinutes(b.checkInTime) ?? (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return tA - tB;
        });

        const entityIds = sortedDcrs.map(d => d.entityId).filter(Boolean);
        const [docs, chems, stocks] = await Promise.all([
            XlDoctor.findAll({ where: { _id: { [Op.in]: entityIds } } }),
            XlChemist.findAll({ where: { _id: { [Op.in]: entityIds } } }),
            XlStockist.findAll({ where: { _id: { [Op.in]: entityIds } } })
        ]);
        const entityCoordMap = {};
        [...docs, ...chems, ...stocks].forEach(ent => {
            if (ent._id) {
                entityCoordMap[ent._id] = {
                    lat: ent.latitude,
                    lng: ent.longitude,
                    address: ent.address || ent.city || ''
                };
            }
        });

        const points = [];
        let cumDistance = 0;
        let totalMeetingMins = 0;
        let totalTransitMins = 0;
        let extendedStoppageCount = 0;

        let prevPoint = null;
        if (attendance && attendance.punchInTime) {
            const hasCoords = attendance.punchInLat != null && attendance.punchInLng != null &&
                              !(Number(attendance.punchInLat) === 0 && Number(attendance.punchInLng) === 0);
            const pStart = {
                seq: 0,
                type: 'punch-in',
                title: 'Punch-In (Day Start)',
                entityType: 'Attendance',
                entityName: 'Day Start Location',
                checkInTime: attendance.punchInTime,
                checkOutTime: attendance.punchInTime,
                lat: hasCoords ? Number(attendance.punchInLat) : null,
                lng: hasCoords ? Number(attendance.punchInLng) : null,
                geoAddress: 'Punch-In Location',
                meetingDurationMins: 0,
                transitFromPrevMins: 0,
                distanceFromPrevKm: 0,
                cumulativeDistanceKm: 0,
                isExtendedStoppage: false,
                remarks: attendance.dayRemarks || 'Punched in for work'
            };
            points.push(pStart);
            if (hasCoords) prevPoint = pStart;
        }

        sortedDcrs.forEach((dcr, index) => {
            let lat = dcr.latitude != null ? Number(dcr.latitude) : null;
            let lng = dcr.longitude != null ? Number(dcr.longitude) : null;
            let address = dcr.geoAddress || '';

            if ((lat == null || lat === 0) && entityCoordMap[dcr.entityId]) {
                const fb = entityCoordMap[dcr.entityId];
                if (fb.lat != null && fb.lat !== 0) {
                    lat = Number(fb.lat);
                    lng = Number(fb.lng);
                    if (!address) address = fb.address;
                }
            }

            const inMins = parseTimeToMinutes(dcr.checkInTime);
            const outMins = parseTimeToMinutes(dcr.checkOutTime);

            let meetingDuration = 15;
            if (inMins != null && outMins != null && outMins >= inMins) {
                meetingDuration = Math.max(5, outMins - inMins);
            }
            totalMeetingMins += meetingDuration;

            let transitMins = 0;
            let legDist = 0;
            if (prevPoint) {
                const prevOutMins = parseTimeToMinutes(prevPoint.checkOutTime) || parseTimeToMinutes(prevPoint.checkInTime);
                if (inMins != null && prevOutMins != null && inMins >= prevOutMins) {
                    transitMins = inMins - prevOutMins;
                }
                if (lat != null && lng != null && prevPoint.lat != null && prevPoint.lng != null) {
                    legDist = calcDistanceKm(prevPoint.lat, prevPoint.lng, lat, lng);
                }
            }
            totalTransitMins += transitMins;
            cumDistance += legDist;

            const isExtended = transitMins >= 30 && legDist <= 2.5;
            if (isExtended) extendedStoppageCount++;

            let stoppageReason = dcr.discussion || '';
            if (isExtended && !stoppageReason) {
                stoppageReason = 'Extended waiting in clinic / transit delay';
            }

            const pCall = {
                seq: index + 1,
                type: 'call',
                title: `Stop #${index + 1}: ${dcr.entityName || dcr.entityType}`,
                entityType: dcr.entityType || 'Doctor',
                entityName: dcr.entityName || 'Doctor Visit',
                checkInTime: dcr.checkInTime || '--',
                checkOutTime: dcr.checkOutTime || '--',
                lat: lat,
                lng: lng,
                geoAddress: address || 'Location Coordinates Logged',
                meetingDurationMins: meetingDuration,
                transitFromPrevMins: transitMins,
                distanceFromPrevKm: Number(legDist.toFixed(2)),
                cumulativeDistanceKm: Number(cumDistance.toFixed(2)),
                isExtendedStoppage: isExtended,
                discussion: dcr.discussion || '',
                remarks: stoppageReason,
                productsDetailed: dcr.productsDetailed,
                samplesGiven: dcr.samplesGiven,
                rating: dcr.rating || 0
            };

            points.push(pCall);
            if (lat != null && lng != null) prevPoint = pCall;
        });

        if (attendance && attendance.punchOutTime) {
            const hasCoords = attendance.punchOutLat != null && attendance.punchOutLng != null &&
                              !(Number(attendance.punchOutLat) === 0 && Number(attendance.punchOutLng) === 0);
            const outLat = hasCoords ? Number(attendance.punchOutLat) : null;
            const outLng = hasCoords ? Number(attendance.punchOutLng) : null;

            let legDist = 0;
            let transitMins = 0;
            if (prevPoint) {
                const prevOutMins = parseTimeToMinutes(prevPoint.checkOutTime) || parseTimeToMinutes(prevPoint.checkInTime);
                const outMins = parseTimeToMinutes(attendance.punchOutTime);
                if (outMins != null && prevOutMins != null && outMins >= prevOutMins) {
                    transitMins = outMins - prevOutMins;
                }
                if (outLat != null && outLng != null && prevPoint.lat != null && prevPoint.lng != null) {
                    legDist = calcDistanceKm(prevPoint.lat, prevPoint.lng, outLat, outLng);
                }
            }
            cumDistance += legDist;
            totalTransitMins += transitMins;

            const pEnd = {
                seq: points.length,
                type: 'punch-out',
                title: 'Punch-Out (Day End)',
                entityType: 'Attendance',
                entityName: 'Day End Location',
                checkInTime: attendance.punchOutTime,
                checkOutTime: attendance.punchOutTime,
                lat: outLat,
                lng: outLng,
                geoAddress: 'Punch-Out Location',
                meetingDurationMins: 0,
                transitFromPrevMins: transitMins,
                distanceFromPrevKm: Number(legDist.toFixed(2)),
                cumulativeDistanceKm: Number(cumDistance.toFixed(2)),
                isExtendedStoppage: false,
                remarks: attendance.dayRemarks || 'Punched out; day ended'
            };
            points.push(pEnd);
        }

        let workingSpanMins = 0;
        if (attendance && attendance.punchInTime && attendance.punchOutTime) {
            const pIn = parseTimeToMinutes(attendance.punchInTime);
            const pOut = parseTimeToMinutes(attendance.punchOutTime);
            if (pIn != null && pOut != null && pOut >= pIn) {
                workingSpanMins = pOut - pIn;
            }
        }

        const validGpsPoints = points.filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));

        res.json({
            success: true,
            user: {
                _id: user._id,
                employeeId: user.employeeId,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email,
                designation: user.designation || 'Field Representative',
                hq: user.hq || '--'
            },
            date,
            summary: {
                totalDistanceKm: Number(cumDistance.toFixed(2)),
                punchInTime: attendance?.punchInTime || '--',
                punchOutTime: attendance?.punchOutTime || '--',
                totalWorkingHours: formatMinutesToHours(workingSpanMins),
                totalCalls: sortedDcrs.length,
                doctorCalls: sortedDcrs.filter(d => (d.entityType || '').toLowerCase() === 'doctor').length,
                chemistCalls: sortedDcrs.filter(d => (d.entityType || '').toLowerCase() === 'chemist').length,
                stockistCalls: sortedDcrs.filter(d => (d.entityType || '').toLowerCase() === 'stockist').length,
                totalMeetingTime: formatMinutesToHours(totalMeetingMins),
                totalTransitTime: formatMinutesToHours(totalTransitMins),
                extendedStoppagesCount: extendedStoppageCount,
                hasGpsData: validGpsPoints.length > 0
            },
            timeline: points,
            routePoints: validGpsPoints
        });
    } catch (err) {
        console.error('Error in /reports/geo-location-analysis:', err);
        res.status(500).json({ success: false, message: 'Internal server error calculating geo-location analysis' });
    }
});

// 0.5 Export rich daily Geo-Location Analysis Excel workbook with embedded visual map and clickable links
router.get('/reports/geo-location-analysis/export-excel', async (req, res) => {
    try {
        const { employeeId, date } = req.query;
        if (!employeeId || !date) {
            return res.status(400).json({ success: false, message: 'employeeId and date are required' });
        }

        const fs = require('fs');
        const path = require('path');
        const ExcelJS = require('exceljs');
        const sharp = require('sharp');
        const { XlAttendance, XlDCR, XlUser } = require('../db');
        const { Op } = require('sequelize');

        // Fetch user, attendance, DCRs
        const [user, attendance, dcrs] = await Promise.all([
            XlUser.findOne({
                where: {
                    [Op.or]: [{ employeeId }, { _id: employeeId }, { email: employeeId }]
                }
            }),
            XlAttendance.findOne({
                where: {
                    date,
                    employeeId
                }
            }),
            XlDCR.findAll({
                where: {
                    date,
                    employeeId
                },
                order: [['checkInTime', 'ASC'], ['createdAt', 'ASC']]
            })
        ]);

        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email : employeeId;
        const designation = user?.designation || 'Field Representative';
        const hq = user?.hq || attendance?.hq || '--';

        // Ensure WebP map exists or generate it
        const monthDir = date.substring(0, 7);
        const mapFilename = `${employeeId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${date}.webp`;
        const webpPath = path.join(__dirname, '../uploads/geo-archives', monthDir, mapFilename);
        
        let mapPngBuffer = null;
        try {
            if (!fs.existsSync(webpPath)) {
                const { generateWebpMapSnapshot } = require('../utils/geoStaticMap');
                await generateWebpMapSnapshot(employeeId, date);
            }
            if (fs.existsSync(webpPath)) {
                mapPngBuffer = await sharp(webpPath).png().toBuffer();
            }
        } catch (mapErr) {
            console.warn('Could not generate/convert map image for Excel:', mapErr.message);
        }

        // Build Excel Workbook with ExcelJS
        const wb = new ExcelJS.Workbook();
        wb.creator = 'Emyris Field CRM';
        wb.created = new Date();
        const ws = wb.addWorksheet('Geo-Location Analysis');

        // Row 1-3: Headers
        const titleRow = ws.addRow(['GEO-LOCATION ANALYSIS & STOPPAGE TRACKING REPORT']);
        titleRow.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };

        const metaRow1 = ws.addRow([`User: ${userName} (${employeeId})`, `Designation: ${designation}`, `HQ: ${hq}`]);
        metaRow1.font = { bold: true, size: 11, color: { argb: 'FF334155' } };

        const metaRow2 = ws.addRow([`Date: ${date}`, `Generated: ${new Date().toLocaleDateString()}`]);
        metaRow2.font = { size: 10, color: { argb: 'FF64748B' } };
        ws.addRow([]);

        // Summary Overview Section
        const sumHeader = ws.addRow(['SUMMARY OVERVIEW']);
        sumHeader.font = { bold: true, size: 12, color: { argb: 'FF0284C7' } };

        const sumCols = ws.addRow(['Total Distance (km)', 'Punch-In Time', 'Punch-Out Time', 'Total Work Hours', 'Total Calls', 'In-Call Time', 'Transit/Stoppage Time']);
        sumCols.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        sumCols.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.alignment = { horizontal: 'center' };
        });

        const pInTime = attendance?.punchInTime || '--';
        const pOutTime = attendance?.punchOutTime || '--';
        const sumVals = ws.addRow([
            attendance?.totalDistanceKm || '--',
            pInTime,
            pOutTime,
            '--',
            dcrs.length,
            '--',
            '--'
        ]);
        sumVals.alignment = { horizontal: 'center' };
        ws.addRow([]);

        // Embedded Visual Map Route Image
        if (mapPngBuffer) {
            const visualLabel = ws.addRow(['VISUAL ROUTE MAP SNAPSHOT:']);
            visualLabel.font = { bold: true, size: 11, color: { argb: 'FF0284C7' } };

            const imageId = wb.addImage({
                buffer: mapPngBuffer,
                extension: 'png'
            });

            const imgStartRow = ws.rowCount + 1;
            for (let i = 0; i < 18; i++) {
                ws.addRow([]);
            }

            ws.addImage(imageId, {
                tl: { col: 0, row: imgStartRow - 1 },
                ext: { width: 680, height: 380 }
            });
            ws.addRow([]);
        }

        // Online Interactive Route Links
        const linksLabel = ws.addRow(['ONLINE ROUTE LINKS (CLICK TO OPEN):']);
        linksLabel.font = { bold: true, size: 11, color: { argb: 'FF0284C7' } };

        const onlineWebpUrl = `https://emyrishr.in/uploads/geo-archives/${monthDir}/${mapFilename}`;
        const startLat = attendance?.punchInLat || attendance?.punchOutLat;
        const startLng = attendance?.punchInLng || attendance?.punchOutLng;
        const endLat = attendance?.punchOutLat || attendance?.punchInLat;
        const endLng = attendance?.punchOutLng || attendance?.punchInLng;
        const gmapsRouteUrl = (startLat && startLng)
            ? `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(userName + ' ' + hq)}`;

        const linksRow = ws.addRow([
            { text: '🌐 Open High-Res WebP Map in Browser', hyperlink: onlineWebpUrl },
            { text: '🗺️ Open Driving Directions in Google Maps', hyperlink: gmapsRouteUrl }
        ]);
        linksRow.font = { bold: true, color: { argb: 'FF0284C7' }, underline: true };
        ws.addRow([]);

        // Chronological Milestone Table
        const tableLabel = ws.addRow(['CHRONOLOGICAL JOURNEY & STOPPAGE LOG']);
        tableLabel.font = { bold: true, size: 12, color: { argb: 'FF0284C7' } };

        const th = ws.addRow([
            'Stop #', 'Activity / Milestone', 'Entity Type', 'Check-In Time', 'Check-Out Time',
            'Latitude', 'Longitude', 'Google Maps Link', 'Geo Address / Location', 'Remarks / Stoppage Reason'
        ]);
        th.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        th.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.alignment = { horizontal: 'center' };
        });

        // 1. Punch-In Start Row
        if (attendance && (attendance.punchInLat || attendance.punchInTime)) {
            const inLat = attendance.punchInLat || '';
            const inLng = attendance.punchInLng || '';
            const gLink = inLat ? { text: '📍 View on Google Maps', hyperlink: `https://www.google.com/maps/search/?api=1&query=${inLat},${inLng}` } : '--';
            const r = ws.addRow([
                'Start', 'Punch-In (Day Start)', 'Attendance', attendance.punchInTime || '--', attendance.punchInTime || '--',
                inLat, inLng, gLink, 'Punch-In Location', attendance.dayRemarks || 'Punched in for work'
            ]);
            r.getCell(8).font = { color: { argb: 'FF0284C7' }, underline: true };
        }

        // 2. Doctor / Chemist DCR Visits
        dcrs.forEach((d, idx) => {
            const dLat = d.latitude || '';
            const dLng = d.longitude || '';
            const gLink = (dLat && dLng) ? { text: '📍 View on Google Maps', hyperlink: `https://www.google.com/maps/search/?api=1&query=${dLat},${dLng}` } : '--';
            const r = ws.addRow([
                idx + 1, d.entityName || 'Doctor Visit', d.entityType || 'Doctor', d.checkInTime || '--', d.checkOutTime || '--',
                dLat, dLng, gLink, d.geoAddress || '', d.discussion || d.remarks || ''
            ]);
            r.getCell(8).font = { color: { argb: 'FF0284C7' }, underline: true };
        });

        // 3. Punch-Out End Row
        if (attendance && (attendance.punchOutLat || attendance.punchOutTime)) {
            const outLat = attendance.punchOutLat || '';
            const outLng = attendance.punchOutLng || '';
            const gLink = outLat ? { text: '📍 View on Google Maps', hyperlink: `https://www.google.com/maps/search/?api=1&query=${outLat},${outLng}` } : '--';
            const r = ws.addRow([
                'End', 'Punch-Out (Day End)', 'Attendance', attendance.punchOutTime || '--', attendance.punchOutTime || '--',
                outLat, outLng, gLink, 'Punch-Out Location', attendance.dayRemarks || 'Punched out; day ended'
            ]);
            r.getCell(8).font = { color: { argb: 'FF0284C7' }, underline: true };
        }

        // Auto-fit column widths
        ws.columns.forEach((col) => {
            let maxLen = 14;
            col.eachCell({ includeEmpty: false }, (cell) => {
                const val = cell.text || (typeof cell.value === 'string' ? cell.value : '');
                if (val && val.length > maxLen) maxLen = Math.min(val.length + 3, 40);
            });
            col.width = maxLen;
        });

        // Send Excel file
        const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Geo_Location_Analysis_${safeUserName}_${date}.xlsx"`);

        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error in /reports/geo-location-analysis/export-excel:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// GEO-LOCATION ARCHIVING & 60-DAY RETENTION
// ==========================================

// 1. Upload WebP map snapshot for a user's date
router.post('/admin/geo-archive/upload-map', async (req, res) => {
    try {
        const { employeeId, date, webpBase64 } = req.body;
        if (!employeeId || !date || !webpBase64) {
            return res.status(400).json({ success: false, message: 'Missing employeeId, date, or image data' });
        }

        const fs = require('fs');
        const path = require('path');
        const monthDir = date.substring(0, 7); // YYYY-MM
        const targetDir = path.join(__dirname, '../uploads/geo-archives', monthDir);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Clean base64 header if present
        const base64Data = webpBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${employeeId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${date}.webp`;
        const filePath = path.join(targetDir, filename);

        fs.writeFileSync(filePath, buffer);

        // Update database attendance record with WebP route map path
        try {
            const { sequelize } = require('../db');
            await sequelize.query(`
                UPDATE xl_attendances 
                SET "mapSnapshotUrl" = :url 
                WHERE ("employeeId" = :employeeId OR "uid" = :employeeId) AND "date" = :date
            `, {
                replacements: {
                    url: `/uploads/geo-archives/${monthDir}/${filename}`,
                    employeeId,
                    date
                }
            });
        } catch(dbErr) {
            console.warn('Could not update mapSnapshotUrl in db:', dbErr.message);
        }

        res.json({ 
            success: true, 
            message: 'Map snapshot saved to database and server storage successfully', 
            path: `/uploads/geo-archives/${monthDir}/${filename}` 
        });
    } catch(err) {
        console.error('Error in /admin/geo-archive/upload-map:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 1.5 Get all active user dates with GPS data for a given month (for automated batch generation)
router.get('/admin/geo-archive/month-dates', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year are required' });

        const mStr = String(month).padStart(2, '0');
        const prefix = `${year}-${mStr}`;
        const { XlAttendance, XlDCR, XlUser } = require('../db');
        const { Op } = require('sequelize');

        // Find all attendances or DCRs with coordinates for this month
        const [attendances, dcrs, users] = await Promise.all([
            XlAttendance.findAll({
                attributes: ['employeeId', 'date', 'punchInLat', 'punchOutLat'],
                where: {
                    date: { [Op.like]: `${prefix}%` },
                    [Op.or]: [
                        { punchInLat: { [Op.ne]: null } },
                        { punchOutLat: { [Op.ne]: null } }
                    ]
                }
            }),
            XlDCR.findAll({
                attributes: ['employeeId', 'date'],
                where: {
                    date: { [Op.like]: `${prefix}%` },
                    latitude: { [Op.ne]: null }
                }
            }),
            XlUser.findAll()
        ]);

        const userMap = {};
        users.forEach(u => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.employeeId || 'User';
            if (u.employeeId) userMap[u.employeeId] = name;
            if (u.email) userMap[u.email] = name;
            if (u._id) userMap[u._id] = name;
            if (u.uid) userMap[u.uid] = name;
        });

        const pairMap = new Map();
        attendances.forEach(a => {
            const key = `${a.employeeId}_${a.date}`;
            pairMap.set(key, { employeeId: a.employeeId, date: a.date, name: userMap[a.employeeId] || a.employeeId });
        });
        dcrs.forEach(d => {
            const key = `${d.employeeId}_${d.date}`;
            if (!pairMap.has(key)) {
                pairMap.set(key, { employeeId: d.employeeId, date: d.date, name: userMap[d.employeeId] || d.employeeId });
            }
        });

        const list = Array.from(pairMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        res.json({ success: true, count: list.length, items: list });
    } catch(err) {
        console.error('Error in /admin/geo-archive/month-dates:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Export monthly ZIP archive (Excel activity log + WebP route maps)
router.get('/admin/geo-archive/export-zip', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year are required' });
        }

        const mStr = String(month).padStart(2, '0');
        const yStr = String(year);
        const prefix = `${yStr}-${mStr}`;

        const { XlAttendance, XlDCR, XlUser } = require('../db');
        const { Op } = require('sequelize');
        const archiver = require('archiver');
        const XLSX = require('xlsx');
        const fs = require('fs');
        const path = require('path');

        // Fetch all attendances and DCRs for this month
        const [attendances, dcrs, users] = await Promise.all([
            XlAttendance.findAll({
                where: { date: { [Op.like]: `${prefix}%` } },
                order: [['date', 'ASC']]
            }),
            XlDCR.findAll({
                where: { date: { [Op.like]: `${prefix}%` } },
                order: [['date', 'ASC'], ['createdAt', 'ASC']]
            }),
            XlUser.findAll()
        ]);

        const userMap = {};
        users.forEach(u => {
            const keys = [u.employeeId, u.email, u._id, u.uid].filter(Boolean);
            keys.forEach(k => {
                userMap[k] = {
                    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.employeeId || 'User',
                    employeeId: u.employeeId || '',
                    hq: u.hq || '',
                    designation: u.designation || ''
                };
            });
        });

        // 1. Build Excel workbook
        // Sheet 1: Daily Attendances
        const attRows = [
            [
                'Date', 'Employee ID', 'Employee Name', 'Designation', 'HQ', 
                'Punch-In Time', 'Punch-Out Time', 
                'Punch-In Lat', 'Punch-In Lng', 'Punch-Out Lat', 'Punch-Out Lng', 
                'WebP Map File (In ZIP)', 'View WebP Map Online (Clickable)', 'Google Maps Route Link (Clickable)', 
                'Day Remarks'
            ]
        ];
        attendances.forEach(a => {
            const u = userMap[a.employeeId] || { name: a.employeeId, designation: '', hq: '' };
            const mapFilename = `${a.employeeId}_${a.date}.webp`;
            const webpUrl = `https://emyrishr.in/uploads/geo-archives/${prefix}/${mapFilename}`;
            
            let webpCell = '--';
            let gmapsCell = '--';
            let zipMapName = '--';

            if (a.punchInLat || a.punchOutLat) {
                zipMapName = `Maps/${mapFilename}`;
                webpCell = { t: 's', v: 'Open WebP Map', l: { Target: webpUrl } };
                
                const startLat = a.punchInLat || a.punchOutLat;
                const startLng = a.punchInLng || a.punchOutLng;
                const endLat = a.punchOutLat || a.punchInLat;
                const endLng = a.punchOutLng || a.punchInLng;
                
                if (startLat && startLng) {
                    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}`;
                    gmapsCell = { t: 's', v: 'View Route in Google Maps', l: { Target: gmapsUrl } };
                }
            }

            attRows.push([
                a.date,
                a.employeeId,
                u.name,
                u.designation,
                u.hq,
                a.punchInTime || '--',
                a.punchOutTime || '--',
                a.punchInLat || '',
                a.punchInLng || '',
                a.punchOutLat || '',
                a.punchOutLng || '',
                zipMapName,
                webpCell,
                gmapsCell,
                a.dayRemarks || ''
            ]);
        });

        // Sheet 2: Chronological DCR Calls & Stops
        const dcrRows = [
            [
                'Date', 'Employee ID', 'Employee Name', 'HQ', 
                'Entity Name', 'Entity Type', 'Check-In Time', 'Check-Out Time', 
                'Latitude', 'Longitude', 'View Stop on Google Maps (Clickable)', 
                'Geo Address', 'Remarks / Stoppage Reason', 'Rating'
            ]
        ];
        dcrs.forEach(d => {
            const u = userMap[d.employeeId] || { name: d.employeeId, hq: '' };
            let stopGmapsCell = '--';
            if (d.latitude && d.longitude) {
                const stopUrl = `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`;
                stopGmapsCell = { t: 's', v: 'Open in Google Maps', l: { Target: stopUrl } };
            }

            dcrRows.push([
                d.date,
                d.employeeId,
                u.name,
                u.hq,
                d.entityName || '',
                d.entityType || 'Doctor',
                d.checkInTime || '--',
                d.checkOutTime || '--',
                d.latitude || '',
                d.longitude || '',
                stopGmapsCell,
                d.geoAddress || '',
                d.discussion || d.remarks || '',
                d.rating || ''
            ]);
        });

        const wb = XLSX.utils.book_new();
        const wsAtt = XLSX.utils.aoa_to_sheet(attRows);
        const wsDcr = XLSX.utils.aoa_to_sheet(dcrRows);
        XLSX.utils.book_append_sheet(wb, wsAtt, 'Daily Attendances');
        XLSX.utils.book_append_sheet(wb, wsDcr, 'Field Visits & Stops');
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // 2. Setup Zip Archive Stream
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="Emyris_GeoArchive_${yStr}_${mStr}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Append Excel spreadsheet
        archive.append(excelBuffer, { name: `GeoLocation_Activity_${yStr}_${mStr}.xlsx` });

        // Append any stored WebP route maps for this month
        const mapsDir = path.join(__dirname, '../uploads/geo-archives', prefix);
        if (fs.existsSync(mapsDir)) {
            const files = fs.readdirSync(mapsDir);
            files.forEach(f => {
                if (f.endsWith('.webp')) {
                    archive.file(path.join(mapsDir, f), { name: `Maps/${f}` });
                }
            });
        }

        await archive.finalize();
    } catch(err) {
        console.error('Error in /admin/geo-archive/export-zip:', err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

// 3. Prune coordinate data older than 2 months (60 days)
router.post('/admin/geo-archive/prune', async (req, res) => {
    try {
        const { XlAttendance, XlDCR } = require('../db');
        const { Op } = require('sequelize');
        const fs = require('fs');
        const path = require('path');

        // Retention policy: Keep current month (M) and previous month (M-1)
        // Purge anything strictly before M-1 (i.e. older than 60 days)
        const now = new Date();
        const cutoffDateObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const cutoffDate = cutoffDateObj.toISOString().split('T')[0];

        // 1. Clear raw coordinate columns in Database
        const [attUpdated] = await XlAttendance.update(
            { punchInLat: null, punchInLng: null, punchOutLat: null, punchOutLng: null },
            { where: { date: { [Op.lt]: cutoffDate } } }
        );

        const [dcrsUpdated] = await XlDCR.update(
            { latitude: null, longitude: null },
            { where: { date: { [Op.lt]: cutoffDate } } }
        );

        // 2. Clear old file folders from uploads/geo-archives older than 90 days
        const baseDir = path.join(__dirname, '../uploads/geo-archives');
        let deletedFolders = [];
        if (fs.existsSync(baseDir)) {
            const dirs = fs.readdirSync(baseDir);
            dirs.forEach(d => {
                if (/^\d{4}-\d{2}$/.test(d)) {
                    if (d < cutoffDate.substring(0, 7)) {
                        const fullPath = path.join(baseDir, d);
                        try {
                            fs.rmSync(fullPath, { recursive: true, force: true });
                            deletedFolders.push(d);
                        } catch(e) {}
                    }
                }
            });
        }

        res.json({
            success: true,
            cutoffDate,
            attendancesPruned: attUpdated,
            dcrsPruned: dcrsUpdated,
            prunedMapFolders: deletedFolders,
            message: `Successfully pruned GPS coordinates prior to ${cutoffDate}. Preserved all summary metrics and working days.`
        });
    } catch(err) {
        console.error('Error in /admin/geo-archive/prune:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Map Tile Proxy (allows Leaflet tiles to load with full CORS headers and bypass restrictive blocking)
router.get('/tile-proxy', (req, res) => {
    try {
        const { type, lyrs = 'm', x, y, z } = req.query;
        if (!x || !y || !z) return res.status(400).end();

        const https = require('https');
        let remoteUrl = '';
        let headers = {};

        if (type === 'osm') {
            remoteUrl = `https://tile.openstreetmap.org/${encodeURIComponent(z)}/${encodeURIComponent(x)}/${encodeURIComponent(y)}.png`;
            headers = {
                'User-Agent': 'EmyrisFieldCRM/1.0 (contact@emyrishr.in)',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            };
        } else {
            remoteUrl = `https://mt1.google.com/vt/lyrs=${encodeURIComponent(lyrs)}&x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}&z=${encodeURIComponent(z)}`;
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.google.com/'
            };
        }

        const remoteReq = https.get(remoteUrl, { headers }, (remoteRes) => {
            if (remoteRes.statusCode !== 200) {
                res.status(remoteRes.statusCode).end();
                return;
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            res.setHeader('Content-Type', remoteRes.headers['content-type'] || 'image/png');
            remoteRes.pipe(res);
        });

        remoteReq.on('error', () => {
            res.status(502).end();
        });
    } catch (e) {
        res.status(500).end();
    }
});

// ==========================================
// EXCEL PORTAL (/xl) & XLA LINKED UTILITIES REPORTS
// ==========================================

// Helper: Normalize any holiday date value to YYYY-MM-DD
function normalizeHolidayDateStr(dVal) {
    if (!dVal) return '';
    const str = String(dVal).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
            return ist.toISOString().split('T')[0];
        }
        return str.split('T')[0];
    }
    const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
        return ist.toISOString().split('T')[0];
    }
    return str;
}

// Helper: Resolve User and all valid identifiers (employeeId, uid, _id, email, hq, state)
async function resolveUserContext(empIdentifier) {
    const { XlUser, XlDesignation, XlHQ } = require('../db');
    const { Op } = require('sequelize');
    if (!empIdentifier || empIdentifier === 'all' || empIdentifier === 'ALL') {
        return { user: null, ids: [], hq: null, state: '', targetDoctorCalls: 0, targetChemistCalls: 0, targetStockistCalls: 0 };
    }
    const user = await XlUser.findOne({
        where: {
            [Op.or]: [
                { employeeId: empIdentifier },
                { uid: empIdentifier },
                { _id: empIdentifier },
                { email: empIdentifier }
            ]
        },
        raw: true
    });
    if (!user) {
        return { user: null, ids: [empIdentifier], hq: null, state: '', targetDoctorCalls: 0, targetChemistCalls: 0, targetStockistCalls: 0 };
    }
    const ids = [...new Set([user.employeeId, user.uid, user._id, user.email].filter(Boolean))];
    let targetDoctorCalls = 10;
    let targetChemistCalls = 5;
    let targetStockistCalls = 2;
    if (user.designation) {
        const desig = await XlDesignation.findOne({ where: { designationName: user.designation }, raw: true });
        if (desig) {
            if (desig.targetDoctorCalls) targetDoctorCalls = desig.targetDoctorCalls;
            if (desig.targetChemistCalls) targetChemistCalls = desig.targetChemistCalls;
            if (desig.targetStockistCalls) targetStockistCalls = desig.targetStockistCalls;
        }
    }
    let resolvedState = user.state || '';
    if (!resolvedState && user.hq) {
        try {
            const hqRec = await XlHQ.findOne({ where: { hqName: user.hq.toUpperCase().trim() }, raw: true });
            if (hqRec && hqRec.state) resolvedState = hqRec.state;
        } catch (e) {}
    }
    return {
        user,
        ids,
        hq: user.hq || '',
        state: resolvedState,
        name: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || user.employeeId,
        targetDoctorCalls,
        targetChemistCalls,
        targetStockistCalls
    };
}

// 1. QUICK REPORTS SUMMARY (Menu #1)
router.get('/reports/quick-summary', async (req, res) => {
    try {
        const { employeeId } = req.query;
        const { XlDCR, XlAttendance, XlTourProgram, XlCallPlan, XlExpense, XlLeave, XlPrimarySales, XlSecondarySales, XlTarget, XlHoliday } = require('../db');
        const { Op } = require('sequelize');

        const ctx = await resolveUserContext(employeeId);
        const ids = ctx.ids.length > 0 ? ctx.ids : [employeeId];

        const nowIst = new Date(Date.now() + 5.5 * 3600 * 1000);
        const todayStr = nowIst.toISOString().split('T')[0];
        const curYear = String(nowIst.getUTCFullYear());
        const curMonthIdx = nowIst.getUTCMonth();
        const curMonthNum = String(curMonthIdx + 1).padStart(2, '0');
        const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLongNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const curMonthShort = monthShortNames[curMonthIdx];
        const curMonthLong = monthLongNames[curMonthIdx];
        const curMonthTitle = curMonthLong.charAt(0).toUpperCase() + curMonthLong.slice(1);
        const tpMonthVariants = [
            curMonthLong,
            curMonthTitle,
            curMonthLong.toUpperCase(),
            curMonthShort,
            curMonthShort.toLowerCase(),
            curMonthShort.toUpperCase(),
            String(curMonthIdx + 1),
            curMonthNum
        ];
        const startOfMonth = `${curYear}-${curMonthNum}-01`;
        const lastDay = new Date(Number(curYear), curMonthIdx + 1, 0).getDate();
        const endOfMonth = `${curYear}-${curMonthNum}-${String(lastDay).padStart(2, '0')}`;

        const empWhere = ids.length > 0 ? { employeeId: { [Op.in]: ids } } : {};

        const [
            todayAtt,
            monthAtts,
            monthDcrs,
            curTps,
            monthCallPlans,
            monthExpenses,
            monthLeaves,
            priSales,
            secSales,
            targets,
            allHolidays
        ] = await Promise.all([
            XlAttendance.findOne({ where: { ...empWhere, date: todayStr }, raw: true }),
            XlAttendance.findAll({ where: { ...empWhere, date: { [Op.between]: [startOfMonth, endOfMonth] } }, raw: true }),
            XlDCR.findAll({ where: { ...empWhere, date: { [Op.between]: [startOfMonth, endOfMonth] } }, raw: true }),
            XlTourProgram.findAll({ where: { ...empWhere, month: { [Op.in]: tpMonthVariants }, year: curYear }, raw: true }),
            XlCallPlan.findAll({ where: { ...empWhere, date: { [Op.between]: [startOfMonth, endOfMonth] } }, raw: true }),
            XlExpense.findAll({ where: { ...empWhere, date: { [Op.between]: [startOfMonth, endOfMonth] } }, raw: true }),
            XlLeave.findAll({ where: { ...empWhere, startDate: { [Op.between]: [startOfMonth, endOfMonth] } }, raw: true }),
            XlPrimarySales.findAll({ where: empWhere, raw: true }),
            XlSecondarySales.findAll({ where: empWhere, raw: true }),
            XlTarget.findAll({ where: { ...empWhere, year: curYear }, raw: true }),
            XlHoliday.findAll({ raw: true })
        ]);

        const tpStatusRank = { Approved: 1, Submitted: 2, Pending: 3, Draft: 4, Rejected: 5 };
        const sortedTps = (curTps || []).sort((a, b) => {
            const rA = tpStatusRank[a.status] || 9;
            const rB = tpStatusRank[b.status] || 9;
            if (rA !== rB) return rA - rB;
            return (b.entries ? b.entries.length : 0) - (a.entries ? a.entries.length : 0);
        });
        const curTp = sortedTps[0] || null;

        // Match today's Holiday from XlHoliday (State-matched first, then any holiday on today's date) or Tour Program
        const userState = (ctx.state || '').toLowerCase().trim();
        const holidaysOnToday = (allHolidays || []).filter(h => normalizeHolidayDateStr(h.date) === todayStr);
        let todayHoliday = holidaysOnToday.find(h => {
            const hs = (h.state || '').toLowerCase().trim();
            return !hs || hs === 'all' || hs === 'n/a' || h.type === 'National' || (userState && hs === userState);
        }) || null;

        if (!todayHoliday && curTp) {
            try {
                const tpEntries = JSON.parse(curTp.entries || '[]');
                const todayTpEntry = Array.isArray(tpEntries) ? tpEntries.find(e => normalizeHolidayDateStr(e.date) === todayStr) : null;
                if (todayTpEntry && ((todayTpEntry.type || '').toLowerCase() === 'holiday' || (todayTpEntry.activity || '').toLowerCase() === 'holiday')) {
                    todayHoliday = {
                        date: todayStr,
                        title: todayTpEntry.holidayTitle || todayTpEntry.remarks || 'Holiday',
                        type: 'Holiday'
                    };
                }
            } catch (e) {}
        }

        // Check if user is on Leave today
        const todayLeave = (monthLeaves || []).find(l => {
            if (l.status === 'Rejected') return false;
            const s = normalizeHolidayDateStr(l.startDate);
            const e = normalizeHolidayDateStr(l.endDate || l.startDate);
            return s && e && todayStr >= s && todayStr <= e;
        });

        const isSunday = new Date(todayStr + 'T00:00:00').getDay() === 0;

        let attendanceStatus = 'Not Punched In';
        if (todayAtt) {
            attendanceStatus = todayAtt.punchOutTime ? 'Completed' : 'Punched In';
        } else if (todayHoliday) {
            attendanceStatus = `Holiday: ${todayHoliday.title || 'Holiday'}`;
        } else if (todayLeave) {
            attendanceStatus = `On Leave (${todayLeave.leaveType || 'Leave'})`;
        } else if (isSunday) {
            attendanceStatus = 'Sunday (Weekly Off)';
        }

        const parsePobVal = (dcr) => {
            let val = 0;
            try {
                const items = JSON.parse(dcr.pobItems || '[]');
                if (Array.isArray(items)) {
                    items.forEach(it => {
                        val += (Number(it.qty || 0) * Number(it.rate || 0));
                    });
                }
            } catch (e) {}
            return val;
        };

        const todayDcrs = monthDcrs.filter(d => d.date === todayStr);
        let todayPob = 0;
        todayDcrs.forEach(d => { todayPob += parsePobVal(d); });

        let monthPob = 0;
        monthDcrs.forEach(d => { monthPob += parsePobVal(d); });

        // Primary & Secondary sales for current month
        const monthPriSales = priSales.filter(p => (p.month === curMonthShort && p.year === curYear) || (p.date && p.date.startsWith(`${curYear}-${curMonthNum}`)) || (p.invoiceDate && p.invoiceDate.startsWith(`${curYear}-${curMonthNum}`)));
        const monthSecSales = secSales.filter(s => (s.month === curMonthShort && s.year === curYear) || (s.date && s.date.startsWith(`${curYear}-${curMonthNum}`)));

        const totalPri = monthPriSales.reduce((acc, s) => acc + Number(s.netInvValue || s.amount || 0), 0);
        const totalSec = monthSecSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);

        const totalTarget = targets.reduce((acc, t) => acc + Number(t.lumpSumAmount || t.totalProductAmount || 0), 0);
        const totalExpense = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

        const approvedCallPlans = monthCallPlans.filter(cp => cp.status === 'Approved').length;
        const pendingCallPlans = monthCallPlans.filter(cp => cp.status === 'Pending' || cp.status === 'Submitted').length;

        res.json({
            success: true,
            user: ctx.user ? {
                name: ctx.name,
                employeeId: ctx.user.employeeId,
                designation: ctx.user.designation,
                hq: ctx.user.hq
            } : null,
            today: {
                date: todayStr,
                attendanceStatus,
                isHoliday: Boolean(todayHoliday),
                holidayTitle: todayHoliday?.title || null,
                holidayType: todayHoliday?.type || null,
                isLeave: Boolean(todayLeave),
                leaveType: todayLeave?.leaveType || null,
                isSunday,
                punchInTime: todayAtt?.punchInTime || '-',
                punchOutTime: todayAtt?.punchOutTime || '-',
                doctorCalls: todayDcrs.filter(d => d.entityType === 'Doctor').length,
                chemistCalls: todayDcrs.filter(d => d.entityType === 'Chemist').length,
                stockistCalls: todayDcrs.filter(d => d.entityType === 'Stockist').length,
                reminderCalls: todayDcrs.filter(d => d.entityType === 'Reminder').length,
                totalCalls: todayDcrs.length,
                pobValue: todayPob
            },
            month: {
                monthLabel: `${curMonthShort} ${curYear}`,
                workingDays: monthAtts.length,
                doctorCalls: monthDcrs.filter(d => d.entityType === 'Doctor').length,
                chemistCalls: monthDcrs.filter(d => d.entityType === 'Chemist').length,
                stockistCalls: monthDcrs.filter(d => d.entityType === 'Stockist').length,
                reminderCalls: monthDcrs.filter(d => d.entityType === 'Reminder').length,
                totalCalls: monthDcrs.length,
                expectedDoctorCalls: monthAtts.length * (ctx.targetDoctorCalls || 10),
                primarySales: totalPri,
                secondarySales: totalSec,
                targetSales: totalTarget,
                pobValue: monthPob,
                totalExpense
            },
            approvals: {
                tourProgramStatus: curTp?.status || 'Not Submitted',
                approvedCallPlans,
                pendingCallPlans,
                pendingExpenses: monthExpenses.filter(e => e.status === 'Pending').length,
                approvedExpenses: monthExpenses.filter(e => e.status === 'Approved').length,
                pendingLeaves: monthLeaves.filter(l => l.status === 'Pending').length,
                pendingDcrs: monthDcrs.filter(d => d.status === 'Pending' || d.status === 'Submitted').length
            }
        });
    } catch (e) {
        console.error('Quick summary error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// 2. POB REPORTS (Menu #15)
router.get('/reports/pob', async (req, res) => {
    try {
        const { employeeId, hq, startDate, endDate, month, year, entityType } = req.query;
        const { XlDCR, XlUser } = require('../db');
        const { Op } = require('sequelize');

        let where = {};
        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        } else if (month && year) {
            const m = String(parseInt(month, 10)).padStart(2, '0');
            const y = parseInt(year, 10);
            const lastDay = new Date(y, parseInt(month, 10), 0).getDate();
            where.date = { [Op.between]: [`${y}-${m}-01`, `${y}-${m}-${String(lastDay).padStart(2, '0')}`] };
        }

        if (entityType && entityType !== 'All') {
            where.entityType = entityType;
        }

        if (employeeId && employeeId !== 'all' && employeeId !== 'ALL') {
            const ctx = await resolveUserContext(employeeId);
            where.employeeId = { [Op.in]: ctx.ids.length > 0 ? ctx.ids : [employeeId] };
        }

        const dcrs = await XlDCR.findAll({
            where,
            order: [['date', 'DESC'], ['createdAt', 'DESC']],
            raw: true
        });

        const allUsers = await XlUser.findAll({ raw: true });
        const userMap = {};
        allUsers.forEach(u => {
            const name = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.employeeId;
            if (u.employeeId) userMap[u.employeeId] = { name, hq: u.hq || '-', designation: u.designation || 'MR' };
            if (u.uid) userMap[u.uid] = { name, hq: u.hq || '-', designation: u.designation || 'MR' };
            if (u._id) userMap[u._id] = { name, hq: u.hq || '-', designation: u.designation || 'MR' };
        });

        const orders = [];
        const productAgg = {};
        let totalOrders = 0;
        let totalQty = 0;
        let totalSampleQty = 0;
        let totalValue = 0;
        const uniqueEntities = new Set();

        dcrs.forEach(d => {
            let pobList = [];
            try { pobList = JSON.parse(d.pobItems || '[]'); } catch (e) {}
            if (!Array.isArray(pobList) || pobList.length === 0) return;

            const uInfo = userMap[d.employeeId] || { name: d.employeeName || d.employeeId, hq: '-', designation: 'MR' };
            if (hq && hq !== 'all' && hq !== 'ALL' && uInfo.hq.toLowerCase() !== hq.trim().toLowerCase()) {
                return;
            }

            let dcrOrderQty = 0;
            let dcrSampleQty = 0;
            let dcrOrderVal = 0;
            const cleanItems = [];

            pobList.forEach(item => {
                const qty = Number(item.qty || 0);
                const sQty = Number(item.sampleQty || 0);
                const rate = Number(item.rate || 0);
                const val = qty * rate;
                const prodName = item.product || 'Unknown Product';

                dcrOrderQty += qty;
                dcrSampleQty += sQty;
                dcrOrderVal += val;

                cleanItems.push({
                    product: prodName,
                    productName: prodName,
                    pobType: item.pobType || 'PTS',
                    rate,
                    qty,
                    sampleQty: sQty,
                    value: val
                });

                if (!productAgg[prodName]) {
                    productAgg[prodName] = { product: prodName, productName: prodName, totalQty: 0, totalSampleQty: 0, totalValue: 0, orderCount: 0 };
                }
                productAgg[prodName].totalQty += qty;
                productAgg[prodName].totalSampleQty += sQty;
                productAgg[prodName].totalValue += val;
                productAgg[prodName].orderCount += 1;
            });

            if (cleanItems.length > 0) {
                totalOrders += 1;
                totalQty += dcrOrderQty;
                totalSampleQty += dcrSampleQty;
                totalValue += dcrOrderVal;
                if (d.entityId || d.entityName) uniqueEntities.add(d.entityId || d.entityName);

                orders.push({
                    _id: d._id,
                    date: d.date,
                    displayDate: toDisplayDate(d.date),
                    employeeId: d.employeeId,
                    employeeName: uInfo.name,
                    headquarter: uInfo.hq,
                    entityType: d.entityType || 'Doctor',
                    entityName: d.entityName || '-',
                    workingAreas: d.workingAreas || '-',
                    items: cleanItems,
                    totalQty: dcrOrderQty,
                    totalOrderQty: dcrOrderQty,
                    totalSampleQty: dcrSampleQty,
                    totalValue: dcrOrderVal,
                    totalOrderValue: dcrOrderVal,
                    remarks: d.discussion || ''
                });
            }
        });

        const sortedProductSummary = Object.values(productAgg).sort((a, b) => b.totalValue - a.totalValue);
        res.json({
            success: true,
            summary: {
                totalOrders,
                totalQty,
                totalSampleQty,
                totalValue,
                uniqueEntities: uniqueEntities.size
            },
            orders,
            productSummary: sortedProductSummary,
            productWise: sortedProductSummary
        });
    } catch (e) {
        console.error('POB report error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// 3. MONTHLY SUMMARY REPORT (Menu #16)
router.get('/reports/monthly-summary', async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        if (!employeeId || !month || !year) {
            return res.status(400).json({ success: false, message: 'employeeId, month, and year are required' });
        }

        const { XlTourProgram, XlCallPlan, XlAttendance, XlDCR, XlLeave, XlExpense, XlHoliday } = require('../db');
        const { Op } = require('sequelize');

        const ctx = await resolveUserContext(employeeId);
        const ids = ctx.ids.length > 0 ? ctx.ids : [employeeId];

        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = monthNamesShort.findIndex(m => m.toLowerCase() === String(month).trim().slice(0, 3).toLowerCase());
        const monthNum = mIdx !== -1 ? (mIdx + 1) : (parseInt(month, 10) || (new Date().getMonth() + 1));
        const yearNum = parseInt(year, 10) || new Date().getFullYear();
        const mStr = String(monthNum).padStart(2, '0');
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        const startDate = `${yearNum}-${mStr}-01`;
        const endDate = `${yearNum}-${mStr}-${String(lastDay).padStart(2, '0')}`;

        const dRef = new Date(yearNum, monthNum - 1, 1);
        const monthShort = dRef.toLocaleString('en-US', { month: 'short' });
        const monthLong = dRef.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const monthTitle = monthLong.charAt(0).toUpperCase() + monthLong.slice(1);
        const tpMonthVariants = [
            monthLong,
            monthTitle,
            monthLong.toUpperCase(),
            monthShort,
            monthShort.toLowerCase(),
            monthShort.toUpperCase(),
            String(monthNum),
            mStr
        ];

        const empWhere = { employeeId: { [Op.in]: ids } };

        const [tpsRaw, callPlans, attendances, dcrs, leaves, expenses, holidays] = await Promise.all([
            XlTourProgram.findAll({ where: { ...empWhere, month: { [Op.in]: tpMonthVariants }, year: String(yearNum) }, raw: true }),
            XlCallPlan.findAll({ where: { ...empWhere, date: { [Op.between]: [startDate, endDate] } }, raw: true }),
            XlAttendance.findAll({ where: { ...empWhere, date: { [Op.between]: [startDate, endDate] } }, raw: true }),
            XlDCR.findAll({ where: { ...empWhere, date: { [Op.between]: [startDate, endDate] } }, raw: true }),
            XlLeave.findAll({ where: { ...empWhere, status: { [Op.ne]: 'Rejected' } }, raw: true }),
            XlExpense.findAll({ where: { ...empWhere, date: { [Op.between]: [startDate, endDate] } }, raw: true }),
            XlHoliday.findAll({ raw: true })
        ]);

        const tpStatusRank = { Approved: 1, Submitted: 2, Pending: 3, Draft: 4, Rejected: 5 };
        const tps = (tpsRaw || []).sort((a, b) => {
            const rA = tpStatusRank[a.status] || 9;
            const rB = tpStatusRank[b.status] || 9;
            if (rA !== rB) return rA - rB;
            return (b.entries ? b.entries.length : 0) - (a.entries ? a.entries.length : 0);
        });

        // Map TP entries by date
        const tpMap = {};
        tps.forEach(tp => {
            let entries = [];
            try { entries = JSON.parse(tp.entries || '[]'); } catch (e) {}
            if (Array.isArray(entries)) {
                entries.forEach(en => {
                    const nd = normalizeHolidayDateStr(en.date);
                    if (nd && !tpMap[nd]) tpMap[nd] = en;
                });
            }
        });

        // Map CallPlans by date
        const cpMap = {};
        callPlans.forEach(cp => {
            let docs = [];
            try { docs = JSON.parse(cp.doctors || '[]'); } catch (e) {}
            cpMap[cp.date] = { count: Array.isArray(docs) ? docs.length : 0, status: cp.status };
        });

        // Map Attendance by date
        const attMap = {};
        attendances.forEach(a => { attMap[a.date] = a; });

        // Map Holidays by date (State-matched or National)
        const userState = (ctx.state || '').toLowerCase().trim();
        const holMap = {};
        holidays.forEach(h => {
            const hd = normalizeHolidayDateStr(h.date);
            if (!hd) return;
            const hs = (h.state || '').toLowerCase().trim();
            const isNational = h.type === 'National' || !hs || hs === 'all' || hs === 'n/a';
            const isStateMatch = userState && hs === userState;
            if (isNational || isStateMatch) {
                if (!holMap[hd] || isStateMatch) {
                    holMap[hd] = h.title || 'Holiday';
                }
            }
        });

        // Map Leaves by date
        const leaveMap = {};
        leaves.forEach(l => {
            if (l.startDate && l.endDate) {
                let cur = new Date(l.startDate + 'T00:00:00');
                const end = new Date(l.endDate + 'T00:00:00');
                while (cur <= end) {
                    const ds = cur.toISOString().split('T')[0];
                    leaveMap[ds] = l.leaveType || 'Leave';
                    cur.setDate(cur.getDate() + 1);
                }
            }
        });

        // Map Expenses by date
        const expMap = {};
        expenses.forEach(e => {
            expMap[e.date] = (expMap[e.date] || 0) + Number(e.amount || 0);
        });

        // Map DCRs by date
        const dcrMap = {};
        dcrs.forEach(d => {
            if (!dcrMap[d.date]) dcrMap[d.date] = [];
            dcrMap[d.date].push(d);
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const days = [];
        let workingDays = 0;
        let leaveDays = 0;
        let holidayDays = 0;
        let totalDoctorCalls = 0;
        let totalChemistCalls = 0;
        let totalStockistCalls = 0;
        let totalReminderCalls = 0;
        let totalPobValue = 0;
        let totalExpense = 0;

        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${yearNum}-${mStr}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dayOfWeek = dayNames[dateObj.getDay()];
            const isSunday = dateObj.getDay() === 0;

            const att = attMap[dateStr];
            const dayDcrs = dcrMap[dateStr] || [];
            const tpEntry = tpMap[dateStr];
            const cpEntry = cpMap[dateStr];
            const expAmt = expMap[dateStr] || 0;
            const holTitle = holMap[dateStr];
            const leaveTitle = leaveMap[dateStr];

            const docCount = dayDcrs.filter(x => x.entityType === 'Doctor').length;
            const chemCount = dayDcrs.filter(x => x.entityType === 'Chemist').length;
            const stkCount = dayDcrs.filter(x => x.entityType === 'Stockist').length;
            const remCount = dayDcrs.filter(x => x.entityType === 'Reminder').length;

            let dayPob = 0;
            dayDcrs.forEach(x => {
                try {
                    const items = JSON.parse(x.pobItems || '[]');
                    if (Array.isArray(items)) {
                        items.forEach(it => { dayPob += Number(it.qty || 0) * Number(it.rate || 0); });
                    }
                } catch (e) {}
            });

            let dayStatus = 'Absent / No DCR';
            if (att || dayDcrs.length > 0) {
                dayStatus = 'Field Work';
                workingDays++;
            } else if (leaveTitle) {
                dayStatus = `Leave (${leaveTitle})`;
                leaveDays++;
            } else if (holTitle) {
                dayStatus = `Holiday: ${holTitle}`;
                holidayDays++;
            } else if (isSunday) {
                dayStatus = 'Sunday';
            }

            totalDoctorCalls += docCount;
            totalChemistCalls += chemCount;
            totalStockistCalls += stkCount;
            totalReminderCalls += remCount;
            totalPobValue += dayPob;
            totalExpense += expAmt;

            const plannedCitiesStr = tpEntry?.toMarket || (Array.isArray(tpEntry?.area) ? tpEntry.area.join(', ') : (tpEntry?.area || '-'));
            const plannedActStr = tpEntry?.type || tpEntry?.visitType || (holTitle ? `Holiday (${holTitle})` : (isSunday ? 'Sunday' : '-'));

            days.push({
                date: dateStr,
                displayDate: `${String(d).padStart(2, '0')}-${mStr}-${yearNum}`,
                dayOfWeek,
                status: dayStatus,
                holidayTitle: holTitle || null,
                punchInTime: att?.punchInTime || '-',
                punchOutTime: att?.punchOutTime || '-',
                punchIn: att?.punchInTime || '-',
                punchOut: att?.punchOutTime || '-',
                tpVisitType: plannedActStr,
                plannedActivity: plannedActStr,
                tpArea: plannedCitiesStr,
                plannedCities: plannedCitiesStr,
                plannedDoctors: cpEntry?.count || 0,
                plannedDoctorsCount: cpEntry?.count || 0,
                doctorCalls: docCount,
                chemistCalls: chemCount,
                stockistCalls: stkCount,
                reminderCalls: remCount,
                totalCalls: dayDcrs.length,
                pobValue: dayPob,
                expenseAmount: expAmt,
                visitedDoctors: dayDcrs.map(x => x.entityName).filter(Boolean).join(', '),
                dcrs: dayDcrs.map(x => ({
                    _id: x._id,
                    entityType: x.entityType,
                    entityName: x.entityName,
                    checkInTime: x.checkInTime || '-',
                    workingAreas: x.workingAreas || '-',
                    discussion: x.discussion || '',
                    status: x.status
                }))
            });
        }

        const totalAllCalls = totalDoctorCalls + totalChemistCalls + totalStockistCalls + totalReminderCalls;
        const avgDailyCalls = workingDays > 0 ? Number((totalAllCalls / workingDays).toFixed(1)) : 0;

        res.json({
            success: true,
            user: {
                name: ctx.name,
                employeeId: ctx.user?.employeeId || employeeId,
                designation: ctx.user?.designation || 'MR',
                hq: ctx.user?.hq || '-'
            },
            summary: {
                monthLabel: `${monthShort} ${yearNum}`,
                tpStatus: tps[0]?.status || 'Not Submitted',
                cpStatus: callPlans.some(c => c.status === 'Approved') ? 'Approved' : (callPlans.length > 0 ? 'Pending' : 'Not Submitted'),
                workingDays,
                leaveDays,
                holidayDays,
                holidaysCount: holidayDays,
                totalDoctorCalls,
                totalChemistCalls,
                totalStockistCalls,
                totalReminderCalls,
                totalAllCalls,
                avgDailyCalls,
                avgDoctorCalls: avgDailyCalls,
                totalPobValue,
                totalExpense
            },
            days,
            dailyRows: days
        });
    } catch (e) {
        console.error('Monthly summary error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// 4. SAMPLE MANAGEMENT REPORTS & XLA ALLOTMENT (Menu #17)
router.get('/reports/samples', async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        const { XlSample, XlDCR, XlProduct } = require('../db');
        const { Op } = require('sequelize');

        const ctx = await resolveUserContext(employeeId);
        const ids = ctx.ids.length > 0 ? ctx.ids : (employeeId && employeeId !== 'all' ? [employeeId] : []);
        const empWhere = ids.length > 0 ? { employeeId: { [Op.in]: ids } } : {};

        let dcrWhere = { ...empWhere };
        if (month && year) {
            const m = String(parseInt(month, 10)).padStart(2, '0');
            const y = parseInt(year, 10);
            const lastDay = new Date(y, parseInt(month, 10), 0).getDate();
            dcrWhere.date = { [Op.between]: [`${y}-${m}-01`, `${y}-${m}-${String(lastDay).padStart(2, '0')}`] };
        }

        const [sampleAllotments, dcrs, products] = await Promise.all([
            XlSample.findAll({ where: empWhere, order: [['createdAt', 'DESC']], raw: true }),
            XlDCR.findAll({ where: dcrWhere, order: [['date', 'DESC']], raw: true }),
            XlProduct.findAll({ order: [['productName', 'ASC']], raw: true })
        ]);

        const sampleMap = {};
        const ensureSample = (name) => {
            const key = String(name || '').trim();
            if (!key) return null;
            if (!sampleMap[key]) {
                sampleMap[key] = {
                    sampleName: key,
                    allottedQty: 0,
                    distributedQty: 0,
                    restoredQty: 0,
                    deAllottedQty: 0,
                    availableQty: 0,
                    allotmentHistory: [],
                    distributions: []
                };
            }
            return sampleMap[key];
        };

        // Process XLA Allotments from XlSample
        sampleAllotments.forEach(rec => {
            let parsed = {};
            try { parsed = JSON.parse(rec.details || '{}'); } catch (e) {}
            const items = Array.isArray(parsed) ? parsed : (parsed.items ? parsed.items : [parsed]);
            items.forEach(it => {
                const name = it.sampleName || it.product || it.name;
                const entry = ensureSample(name);
                if (entry) {
                    const allotted = Number(it.allottedQty ?? it.qty ?? 0);
                    const restored = Number(it.restoredQty || 0);
                    const deAllotted = Number(it.deAllottedQty || 0);
                    entry.allottedQty += allotted;
                    entry.restoredQty += restored;
                    entry.deAllottedQty += deAllotted;
                    entry.allotmentHistory.push({
                        _id: rec._id,
                        date: rec.createdAt ? new Date(rec.createdAt).toISOString().split('T')[0] : '-',
                        month: rec.month || '-',
                        year: rec.year || '-',
                        allottedQty: allotted,
                        restoredQty: restored,
                        deAllottedQty: deAllotted,
                        remarks: rec.adminRemarks || it.remarks || ''
                    });
                }
            });
        });

        // Process DCR Distributions from samplesGiven and pobItems.sampleQty
        dcrs.forEach(d => {
            let sGiven = [];
            try { sGiven = JSON.parse(d.samplesGiven || '[]'); } catch (e) {}
            if (Array.isArray(sGiven)) {
                sGiven.forEach(sg => {
                    const name = sg.product || sg.sample || sg.name;
                    const qty = Number(sg.qty || sg.quantity || 0);
                    if (name && qty > 0) {
                        const entry = ensureSample(name);
                        if (entry) {
                            entry.distributedQty += qty;
                            entry.distributions.push({
                                dcrId: d._id,
                                date: d.date,
                                displayDate: toDisplayDate(d.date),
                                entityName: d.entityName || '-',
                                entityType: d.entityType || 'Doctor',
                                employeeId: d.employeeId,
                                employeeName: d.employeeName || d.employeeId,
                                qty
                            });
                        }
                    }
                });
            }

            let pobList = [];
            try { pobList = JSON.parse(d.pobItems || '[]'); } catch (e) {}
            if (Array.isArray(pobList)) {
                pobList.forEach(pob => {
                    const name = pob.product;
                    const qty = Number(pob.sampleQty || 0);
                    if (name && qty > 0) {
                        const entry = ensureSample(name);
                        if (entry) {
                            entry.distributedQty += qty;
                            entry.distributions.push({
                                dcrId: d._id,
                                date: d.date,
                                displayDate: toDisplayDate(d.date),
                                entityName: d.entityName || '-',
                                entityType: d.entityType || 'Doctor',
                                employeeId: d.employeeId,
                                employeeName: d.employeeName || d.employeeId,
                                qty
                            });
                        }
                    }
                });
            }
        });

        const resultList = Object.values(sampleMap).map(item => {
            const avail = Math.max(0, item.allottedQty + item.restoredQty - item.deAllottedQty - item.distributedQty);
            return {
                ...item,
                productName: item.sampleName,
                allotted: item.allottedQty,
                distributed: item.distributedQty,
                restored: item.restoredQty,
                deAllotted: item.deAllottedQty,
                available: avail,
                availableQty: avail
            };
        });

        const totalAllotted = resultList.reduce((s, x) => s + x.allottedQty, 0);
        const totalDistributed = resultList.reduce((s, x) => s + x.distributedQty, 0);
        const totalAvailable = resultList.reduce((s, x) => s + x.availableQty, 0);

        res.json({
            success: true,
            summary: { totalAllotted, totalDistributed, totalAvailable },
            data: resultList,
            products: resultList,
            catalogProducts: products.map(p => ({ _id: p._id, uid: p.uid, name: p.productName }))
        });
    } catch (e) {
        console.error('Samples report error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/samples/allot', async (req, res) => {
    try {
        const { employeeId, sampleName, productName, itemName, allottedQty, restoredQty, deAllottedQty, month, year, remarks } = req.body;
        const resolvedSampleName = sampleName || productName || itemName;
        if (!employeeId || !resolvedSampleName) {
            return res.status(400).json({ success: false, message: 'employeeId and sampleName are required' });
        }
        const { XlSample } = require('../db');
        const now = new Date();
        const details = JSON.stringify({
            sampleName: resolvedSampleName,
            allottedQty: Number(allottedQty || 0),
            restoredQty: Number(restoredQty || 0),
            deAllottedQty: Number(deAllottedQty || 0),
            remarks: remarks || ''
        });
        const record = await XlSample.create({
            employeeId,
            month: month || now.toLocaleString('en-US', { month: 'short' }),
            year: year || String(now.getFullYear()),
            details,
            status: 'Approved',
            adminRemarks: remarks || ''
        });
        res.json({ success: true, data: record });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/samples/:id', async (req, res) => {
    try {
        const { XlSample } = require('../db');
        await XlSample.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 5. GIFT MANAGEMENT REPORTS & XLA ALLOTMENT (Menu #18)
router.get('/reports/gifts-management', async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        const { XlGift, XlDCR } = require('../db');
        const { Op } = require('sequelize');

        const ctx = await resolveUserContext(employeeId);
        const ids = ctx.ids.length > 0 ? ctx.ids : (employeeId && employeeId !== 'all' ? [employeeId] : []);
        const empWhere = ids.length > 0 ? { employeeId: { [Op.in]: ids } } : {};

        let dcrWhere = { ...empWhere };
        if (month && year) {
            const m = String(parseInt(month, 10)).padStart(2, '0');
            const y = parseInt(year, 10);
            const lastDay = new Date(y, parseInt(month, 10), 0).getDate();
            dcrWhere.date = { [Op.between]: [`${y}-${m}-01`, `${y}-${m}-${String(lastDay).padStart(2, '0')}`] };
        }

        const [giftAllotments, allGiftsCatalog, dcrs] = await Promise.all([
            XlGift.findAll({ where: empWhere, order: [['createdAt', 'DESC']], raw: true }),
            XlGift.findAll({ order: [['createdAt', 'DESC']], raw: true }),
            XlDCR.findAll({ where: dcrWhere, order: [['date', 'DESC']], raw: true })
        ]);

        const giftMap = {};
        const ensureGift = (name) => {
            const key = String(name || '').trim();
            if (!key) return null;
            if (!giftMap[key]) {
                giftMap[key] = {
                    giftName: key,
                    allottedQty: 0,
                    distributedQty: 0,
                    restoredQty: 0,
                    deAllottedQty: 0,
                    availableQty: 0,
                    allotmentHistory: [],
                    distributions: []
                };
            }
            return giftMap[key];
        };

        giftAllotments.forEach(rec => {
            let parsed = {};
            try { parsed = JSON.parse(rec.details || '{}'); } catch (e) {
                parsed = { giftName: rec.details, allottedQty: 1 };
            }
            const items = Array.isArray(parsed) ? parsed : (parsed.items ? parsed.items : [parsed]);
            items.forEach(it => {
                const name = it.giftName || it.item || it.name || rec.details;
                const entry = ensureGift(name);
                if (entry) {
                    const allotted = Number(it.allottedQty ?? it.qty ?? 0);
                    const restored = Number(it.restoredQty || 0);
                    const deAllotted = Number(it.deAllottedQty || 0);
                    entry.allottedQty += allotted;
                    entry.restoredQty += restored;
                    entry.deAllottedQty += deAllotted;
                    entry.allotmentHistory.push({
                        _id: rec._id,
                        date: rec.createdAt ? new Date(rec.createdAt).toISOString().split('T')[0] : '-',
                        month: rec.month || '-',
                        year: rec.year || '-',
                        allottedQty: allotted,
                        restoredQty: restored,
                        deAllottedQty: deAllotted,
                        remarks: rec.adminRemarks || it.remarks || ''
                    });
                }
            });
        });

        dcrs.forEach(d => {
            let gGiven = [];
            try { gGiven = JSON.parse(d.gifts || '[]'); } catch (e) {}
            if (Array.isArray(gGiven)) {
                gGiven.forEach(gg => {
                    const name = gg.item || gg.gift || gg.name;
                    const qty = Number(gg.qty || gg.quantity || 0);
                    if (name && qty > 0) {
                        const entry = ensureGift(name);
                        if (entry) {
                            entry.distributedQty += qty;
                            entry.distributions.push({
                                dcrId: d._id,
                                date: d.date,
                                displayDate: toDisplayDate(d.date),
                                entityName: d.entityName || '-',
                                entityType: d.entityType || 'Doctor',
                                employeeId: d.employeeId,
                                employeeName: d.employeeName || d.employeeId,
                                qty
                            });
                        }
                    }
                });
            }
        });

        const catalogNames = new Set();
        allGiftsCatalog.forEach(g => {
            try {
                const p = JSON.parse(g.details || '{}');
                if (p.giftName || p.name || p.item) catalogNames.add(p.giftName || p.name || p.item);
            } catch (e) {
                if (g.details) catalogNames.add(g.details);
            }
        });

        const resultList = Object.values(giftMap).map(item => {
            const avail = Math.max(0, item.allottedQty + item.restoredQty - item.deAllottedQty - item.distributedQty);
            return {
                ...item,
                allotted: item.allottedQty,
                distributed: item.distributedQty,
                restored: item.restoredQty,
                deAllotted: item.deAllottedQty,
                available: avail,
                availableQty: avail
            };
        });

        const totalAllotted = resultList.reduce((s, x) => s + x.allottedQty, 0);
        const totalDistributed = resultList.reduce((s, x) => s + x.distributedQty, 0);
        const totalAvailable = resultList.reduce((s, x) => s + x.availableQty, 0);

        res.json({
            success: true,
            summary: { totalAllotted, totalDistributed, totalAvailable },
            data: resultList,
            gifts: resultList,
            catalog: Array.from(catalogNames)
        });
    } catch (e) {
        console.error('Gifts management report error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/gifts/catalog', async (req, res) => {
    try {
        const { XlGift } = require('../db');
        const allGifts = await XlGift.findAll({ order: [['createdAt', 'DESC']], raw: true });
        const giftSet = new Set([
            'Doctor Diary',
            'Pen Stand',
            'Doctor Apron',
            'Executive Pen',
            'Wall Clock',
            'Table Calendar',
            'Prescription Pad Holder',
            'Medical Bag',
            'Key Chain',
            'Paper Weight',
            'Leather Folder',
            'Digital Thermometer'
        ]);
        allGifts.forEach(g => {
            try {
                const p = JSON.parse(g.details || '{}');
                const name = p.giftName || p.name || p.item;
                if (name && typeof name === 'string' && name.trim()) {
                    giftSet.add(name.trim());
                }
            } catch (e) {
                if (g.details && typeof g.details === 'string' && g.details.trim()) {
                    giftSet.add(g.details.trim());
                }
            }
        });
        res.json({ success: true, catalog: Array.from(giftSet).sort((a, b) => a.localeCompare(b)) });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/gifts/catalog', async (req, res) => {
    try {
        const { giftName } = req.body;
        if (!giftName || !giftName.trim()) {
            return res.status(400).json({ success: false, message: 'giftName is required' });
        }
        const { XlGift } = require('../db');
        const now = new Date();
        const details = JSON.stringify({
            giftName: giftName.trim(),
            allottedQty: 0,
            restoredQty: 0,
            deAllottedQty: 0,
            remarks: 'Added to catalog'
        });
        await XlGift.create({
            employeeId: 'SYSTEM',
            month: now.toLocaleString('en-US', { month: 'short' }),
            year: String(now.getFullYear()),
            details,
            status: 'Catalog',
            adminRemarks: 'Catalog Gift Master Item'
        });
        res.json({ success: true, message: 'Gift added to catalog' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/gifts/allot', async (req, res) => {
    try {
        const { employeeId, giftName, allottedQty, restoredQty, deAllottedQty, month, year, remarks } = req.body;
        if (!employeeId || !giftName) {
            return res.status(400).json({ success: false, message: 'employeeId and giftName are required' });
        }
        const { XlGift } = require('../db');
        const now = new Date();
        const details = JSON.stringify({
            giftName,
            allottedQty: Number(allottedQty || 0),
            restoredQty: Number(restoredQty || 0),
            deAllottedQty: Number(deAllottedQty || 0),
            remarks: remarks || ''
        });
        const record = await XlGift.create({
            employeeId,
            month: month || now.toLocaleString('en-US', { month: 'short' }),
            year: year || String(now.getFullYear()),
            details,
            status: 'Approved',
            adminRemarks: remarks || ''
        });
        res.json({ success: true, data: record });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/gifts/:id', async (req, res) => {
    try {
        const { XlGift } = require('../db');
        await XlGift.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ==========================================
// COST CENTER MANAGEMENT (Profit Analysis)
// ==========================================

// Helper: Auto-sync approved expenses & payroll into Employee Cost Center
async function autoSyncEmployeeCostCenter({ month, year, hq }) {
    const { 
        XlCostCenter, 
        XlExpense, 
        XlUser, 
        Applicant, 
        Payslip, 
        XlAttendance, 
        XlDCR, 
        XlHoliday, 
        XlGlobalSettings 
    } = require('../db');
    const { Op } = require('sequelize');

    const shortMonth = month ? month.split(',')[0].trim().substring(0, 3) : '';
    const yr = year || (month && month.includes(',') ? month.split(',')[1].trim() : String(new Date().getFullYear()));

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    
    let mIdx = shortMonth ? months.findIndex(m => m.toLowerCase() === shortMonth.toLowerCase()) : new Date().getMonth();
    if (mIdx === -1) mIdx = new Date().getMonth();
    
    const monthNum = mIdx + 1;
    const monthStrNum = String(monthNum).padStart(2, '0');
    const normFullMonth = fullMonths[mIdx];
    const lastDay = new Date(parseInt(yr), monthNum, 0).getDate();
    const datePrefix = `${yr}-${monthStrNum}`;

    // 1. Fetch all data needed for payroll & expenses
    const [users, applicants, savedPayslips, allExpenses, atts, dcrs, holidays, pref] = await Promise.all([
        XlUser.findAll({ where: { status: 'Active' }, raw: true }),
        Applicant.find({}).lean ? Applicant.find({}).lean() : Applicant.find({}),
        Payslip.find ? Payslip.find({
            month: { $regex: new RegExp(`^${normFullMonth.substring(0, 3)}`, 'i') },
            year: String(yr)
        }).lean() : [],
        XlExpense.findAll({
            where: { status: 'Approved' },
            raw: true
        }),
        XlAttendance.findAll({
            where: { date: { [Op.like]: `${datePrefix}%` } },
            raw: true
        }),
        XlDCR.findAll({
            attributes: ['employeeId', 'date'],
            where: { date: { [Op.like]: `${datePrefix}%` } },
            raw: true
        }),
        XlHoliday.findAll({
            where: { date: { [Op.like]: `${datePrefix}%` } },
            raw: true
        }),
        XlGlobalSettings.findOne()
    ]);

    // Merge attendance and DCRs exactly matching the Attendance page
    const attMap = new Set(atts.map(a => `${String(a.employeeId).toLowerCase().trim()}_${String(a.date).substring(0, 10)}`));
    const mergedData = [...atts];
    dcrs.forEach(d => {
        const dDate = String(d.date).substring(0, 10);
        const key = `${String(d.employeeId).toLowerCase().trim()}_${dDate}`;
        if (!attMap.has(key)) {
            mergedData.push({ employeeId: d.employeeId, date: dDate, status: 'Present' });
            attMap.add(key);
        }
    });

    // Working days pref
    let workingDaysPref = { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true };
    if (pref && pref.settings) {
        let parsedSettings = pref.settings;
        if (typeof parsedSettings === 'string') {
            try { parsedSettings = JSON.parse(parsedSettings); } catch(e) {}
        }
        if (parsedSettings.set_working_days && parsedSettings.workingDays) {
            workingDaysPref = parsedSettings.workingDays;
        }
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let syncedCount = 0;
    for (const u of users) {
        const empId = u.employeeId || u.uid || u._id;
        const empHq = u.hq || u.headquarter || '';
        if (hq && hq !== 'ALL' && empHq !== hq) continue;

        const uCode = (u.employeeId || u.uid || '').toLowerCase().trim();
        const uEmail = (u.email || '').toLowerCase().trim();
        const uName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();

        // Match applicant
        const applicant = applicants.find(a => {
            const aCode = (a.empCode || '').toLowerCase().trim();
            const aEmail = (a.email || '').toLowerCase().trim();
            const aName = (a.fullName || '').toLowerCase().replace(/\s+/g, ' ').trim();
            return (uCode && aCode && uCode === aCode) ||
                   (uEmail && aEmail && uEmail === aEmail) ||
                   (uName && aName && (uName.includes(aName) || aName.includes(uName)));
        });

        const userIdentifiers = new Set([
            u.employeeId,
            u.uid,
            u._id ? String(u._id) : '',
            u.email
        ].filter(Boolean).map(x => String(x).toLowerCase().trim()));

        // 2. Compute Payrun for employee based on ACTUAL attendance
        let salaryData = {
            basic: 0,
            hra: 0,
            conveyance: 0,
            medical: 0,
            lta: 0,
            edu: 0,
            special: 0,
            gross: 0,
            ptDed: 0,
            pfDed: 0,
            employerPf: 0,
            netSalary: 0,
            payableDays: 0,
            totalMonthDays: lastDay,
            present: 0,
            absent: lastDay,
            leave: 0,
            holiday: 0,
            baseGross: 0,
            baseBreakup: null
        };

        const sb = applicant?.salaryBreakup || {};
        const baseBasic = parseFloat(sb.v_salBasic || sb.basic || 0);
        const baseHra = parseFloat(sb.v_salHra || sb.hra || 0);
        const baseConv = parseFloat(sb.v_salConv || sb.conveyance || 0);
        const baseMed = parseFloat(sb.v_salMed || sb.medical || 0);
        const baseLta = parseFloat(sb.v_salLta || sb.lta || 0);
        const baseEdu = parseFloat(sb.v_salEdu || sb.edu || 0);
        const baseSpecial = parseFloat(sb.v_salSpecial || sb.special || 0);
        const baseGross = baseBasic + baseHra + baseConv + baseMed + baseLta + baseEdu + baseSpecial;

        salaryData.baseGross = baseGross;
        salaryData.baseBreakup = {
            basic: baseBasic,
            hra: baseHra,
            conveyance: baseConv,
            medical: baseMed,
            lta: baseLta,
            edu: baseEdu,
            special: baseSpecial,
            gross: baseGross
        };

        // Calculate actual attendance from merged attendance + DCR punch data
        let present = 0, holiday = 0, leave = 0, absent = 0, totalMonthDays = lastDay;

        for (let day = 1; day <= lastDay; day++) {
            const currentDate = new Date(parseInt(yr), monthNum - 1, day);
            const dStr = `${yr}-${monthStrNum}-${String(day).padStart(2, '0')}`;
            const dayStr = dayNames[currentDate.getDay()];
            
            const isWeeklyOff = !workingDaysPref[dayStr];
            const isStateHoliday = holidays.some(h => 
                h.date === dStr && 
                (!h.state || h.state === 'All' || h.state === 'N/A' || h.state === '' || h.state === u.state)
            );
            const isHoliday = isWeeklyOff || isStateHoliday;
            
            const hasAtt = mergedData.find(a => 
                a.employeeId && 
                userIdentifiers.has(String(a.employeeId).toLowerCase().trim()) && 
                a.date === dStr
            );

            if (hasAtt) {
                const statusStr = (hasAtt.status || '').toLowerCase();
                if (statusStr.includes('leave')) leave++;
                else if (statusStr.includes('absent')) absent++;
                else present++;
            } else {
                if (isHoliday) holiday++;
                else absent++;
            }
        }

        // STRICT ACTUAL ATTENDANCE RULE:
        // If an employee was NEVER present and had NO approved leave in the entire month:
        // Earned salary is 0! No holiday pay if zero work days!
        if (present === 0 && leave === 0) {
            present = 0;
            leave = 0;
            holiday = 0;
            absent = totalMonthDays;
        }

        let payableDays = present + leave + holiday;
        if (payableDays < 0) payableDays = 0;
        if (payableDays > totalMonthDays) payableDays = totalMonthDays;

        if (present === 0 && leave === 0) {
            payableDays = 0;
        }

        const factor = totalMonthDays > 0 ? (payableDays / totalMonthDays) : 0;
        const basic = Math.round(baseBasic * factor);
        const hra = Math.round(baseHra * factor);
        const conv = Math.round(baseConv * factor);
        const med = Math.round(baseMed * factor);
        const lta = Math.round(baseLta * factor);
        const edu = Math.round(baseEdu * factor);
        const special = Math.round(baseSpecial * factor);
        const gross = basic + hra + conv + med + lta + edu + special;

        let ptDed = 0;
        if (gross > 0 && sb.applyPt !== false && sb.applyPt !== 'false' && sb.applyPt !== 0 && sb.applyPt !== '0') {
            if (gross > 20000) ptDed = 200;
            else if (gross > 15000) ptDed = 150;
        }

        let pfDed = 0;
        if (gross > 0 && sb.applyPf !== false && sb.applyPf !== 'false' && sb.applyPf !== 0 && sb.applyPf !== '0') {
            const pfVal = Math.round(basic * 0.12);
            pfDed = pfVal > 1800 ? 1800 : pfVal;
        }

        const employerPf = pfDed;
        const netSalary = gross - ptDed - pfDed;

        salaryData = {
            basic,
            hra,
            conveyance: conv,
            medical: med,
            lta,
            edu,
            special,
            gross,
            ptDed,
            pfDed,
            employerPf,
            netSalary,
            payableDays,
            totalMonthDays,
            present,
            absent,
            leave,
            holiday,
            baseGross,
            baseBreakup: salaryData.baseBreakup
        };

        // 3. User Expenses from Approved XlExpense
        const userExpenses = allExpenses.filter(exp => {
            if (!exp.employeeId || !userIdentifiers.has(String(exp.employeeId).toLowerCase().trim())) return false;
            if (!exp.date) return false;
            const dStr = String(exp.date);
            if (!dStr.includes(`-${monthStrNum}-`) && !dStr.includes(`/${monthStrNum}/`)) return false;
            if (yr && !dStr.includes(yr)) return false;
            return true;
        });

        const travelTotal = userExpenses.filter(e => (e.category || '').toLowerCase().includes('travel') || (e.category || '').toLowerCase().includes('ta')).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const daTotal = userExpenses.filter(e => (e.category || '').toLowerCase().includes('da') || (e.category || '').toLowerCase().includes('allowance')).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const hotelTotal = userExpenses.filter(e => (e.category || '').toLowerCase().includes('hotel')).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const otherTotal = userExpenses.filter(e => !(e.category || '').toLowerCase().includes('travel') && !(e.category || '').toLowerCase().includes('da') && !(e.category || '').toLowerCase().includes('hotel')).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const totalExp = travelTotal + daTotal + hotelTotal + otherTotal;

        // Total Cost to Company = Earned Gross Salary + Employer PF Contribution + Approved Field Expenses
        const grandTotal = (salaryData.gross || 0) + (salaryData.employerPf || 0) + totalExp;

        const empName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || empId;

        const breakdown = {
            salary: {
                basic: salaryData.basic,
                hra: salaryData.hra,
                conveyance: salaryData.conveyance,
                medical: salaryData.medical,
                lta: salaryData.lta,
                edu: salaryData.edu,
                special: salaryData.special,
                gross: salaryData.gross
            },
            companyContributions: {
                employerPf: salaryData.employerPf,
                total: salaryData.employerPf
            },
            deductions: {
                employeePf: salaryData.pfDed,
                pt: salaryData.ptDed,
                totalDeductions: salaryData.pfDed + salaryData.ptDed,
                netSalary: salaryData.netSalary
            },
            fieldExpenses: {
                dailyAllowance: daTotal,
                travel: travelTotal,
                hotel: hotelTotal,
                otherExpenses: otherTotal,
                total: totalExp
            },
            attendance: {
                present: salaryData.present,
                absent: salaryData.absent,
                leave: salaryData.leave,
                holiday: salaryData.holiday,
                payableDays: salaryData.payableDays,
                totalMonthDays: salaryData.totalMonthDays
            },
            totalCost: grandTotal,
            travel: travelTotal,
            dailyAllowance: daTotal,
            hotel: hotelTotal,
            otherExpenses: otherTotal,
            autoSynced: true
        };

        const targetMonthStr = `${shortMonth}, ${yr}`;

        let existing = await XlCostCenter.findOne({
            where: { 
                type: 'EMPLOYEE', 
                year: yr, 
                entityId: empId,
                [Op.or]: [
                    { month: month || shortMonth },
                    { month: shortMonth },
                    { month: targetMonthStr }
                ]
            }
        });

        if (existing) {
            existing.amount = grandTotal;
            existing.hq = empHq;
            existing.month = targetMonthStr;
            existing.breakdown = JSON.stringify(breakdown);
            existing.remarks = 'Auto-synced from Payrun & Attendance & Approved Expenses';
            await existing.save();
        } else {
            await XlCostCenter.create({
                type: 'EMPLOYEE',
                month: targetMonthStr,
                year: yr,
                hq: empHq,
                entityId: empId,
                entityName: empName,
                amount: grandTotal,
                breakdown: JSON.stringify(breakdown),
                remarks: 'Auto-synced from Payrun & Attendance & Approved Expenses',
                status: 'Active'
            });
        }
        syncedCount++;
    }
    return syncedCount;
}

router.get('/cost-center', async (req, res) => {
    try {
        const { XlCostCenter } = require('../db');
        const { type, month, year, hq } = req.query;
        const { Op } = require('sequelize');
        const where = {};
        if (type && type !== 'ALL') where.type = type.toUpperCase();
        if (month) {
            const shortM = month.split(',')[0].trim().substring(0, 3);
            where[Op.or] = [
                { month: month },
                { month: shortM },
                { month: { [Op.like]: `${shortM}%` } }
            ];
        }
        if (year) where.year = year;
        if (hq && hq !== 'ALL') where.hq = hq;

        // Auto-sync employee attendance and approved expenses on GET to ensure 100% live attendance sync
        if (!type || type.toUpperCase() === 'EMPLOYEE') {
            if (month) {
                try {
                    await autoSyncEmployeeCostCenter({ month, year, hq });
                } catch(syncErr) {
                    console.error('Auto-syncing cost center on GET error:', syncErr);
                }
            }
        }

        const rows = await XlCostCenter.findAll({
            where,
            order: [['createdAt', 'DESC']],
            raw: true
        });

        const totalCost = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        res.json({
            success: true,
            data: rows,
            summary: {
                count: rows.length,
                totalCost,
                type: type || 'ALL',
                month: month || '',
                year: year || ''
            }
        });
    } catch (e) {
        console.error('Error in GET /cost-center:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/cost-center', async (req, res) => {
    try {
        const { XlCostCenter } = require('../db');
        const { type, month, year, hq, entityId, entityName, amount, breakdown, remarks } = req.body;
        if (!type || !entityName) {
            return res.status(400).json({ success: false, message: 'type and entityName are required' });
        }

        let existing = null;
        if (entityId) {
            existing = await XlCostCenter.findOne({
                where: { type: type.toUpperCase(), month: month || '', year: year || '', entityId }
            });
        }
        if (!existing) {
            existing = await XlCostCenter.findOne({
                where: { type: type.toUpperCase(), month: month || '', year: year || '', entityName }
            });
        }

        let record;
        if (existing) {
            existing.amount = Number(amount || 0);
            if (hq) existing.hq = hq;
            if (breakdown) existing.breakdown = typeof breakdown === 'string' ? breakdown : JSON.stringify(breakdown);
            if (remarks !== undefined) existing.remarks = remarks;
            await existing.save();
            record = existing;
        } else {
            record = await XlCostCenter.create({
                type: type.toUpperCase(),
                month: month || '',
                year: year || '',
                hq: hq || '',
                entityId: entityId || '',
                entityName,
                amount: Number(amount || 0),
                breakdown: typeof breakdown === 'string' ? breakdown : JSON.stringify(breakdown || {}),
                remarks: remarks || '',
                status: 'Active'
            });
        }

        res.json({ success: true, data: record });
    } catch (e) {
        console.error('Error in POST /cost-center:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/cost-center/:id', async (req, res) => {
    try {
        const { XlCostCenter } = require('../db');
        await XlCostCenter.destroy({ where: { _id: req.params.id } });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Auto-sync approved expenses & payroll into Employee Cost Center
router.post('/cost-center/auto-sync', async (req, res) => {
    try {
        const { month, year, hq } = req.body;
        const syncedCount = await autoSyncEmployeeCostCenter({ month, year, hq });
        res.json({ 
            success: true, 
            message: `Synced ${syncedCount} employee cost records with exact salary and PF breakdown`, 
            syncedCount 
        });
    } catch (e) {
        console.error('Error in /cost-center/auto-sync:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/cost-center/total-expenses', async (req, res) => {
    try {
        const { XlCostCenter } = require('../db');
        const { Op } = require('sequelize');
        const { month, year, hq } = req.query;
        const where = {};
        if (month) {
            const shortM = month.split(',')[0].trim().substring(0, 3);
            where[Op.or] = [
                { month: month },
                { month: shortM },
                { month: { [Op.like]: `${shortM}%` } }
            ];
        }
        if (year) where.year = year;
        if (hq && hq !== 'ALL') where.hq = hq;

        const allRows = await XlCostCenter.findAll({ where, raw: true });

        const categories = ['EMPLOYEE', 'DOCTOR', 'STOCKIST', 'CHEMIST', 'MISCELLANEOUS'];
        const summaryByType = categories.map(cat => {
            const items = allRows.filter(r => r.type === cat);
            const total = items.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            return {
                category: cat,
                count: items.length,
                totalAmount: total,
                items
            };
        });

        const grandTotal = summaryByType.reduce((s, c) => s + c.totalAmount, 0);
        summaryByType.forEach(c => {
            c.percentage = grandTotal > 0 ? Number(((c.totalAmount / grandTotal) * 100).toFixed(1)) : 0;
        });

        res.json({
            success: true,
            grandTotal,
            totalEntries: allRows.length,
            breakdown: summaryByType,
            rows: allRows
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ==========================================
// PROFIT CENTER MANAGEMENT (Profit Analysis)
// ==========================================

// Get All Linked Headquarters (across Master, Users, Sales & Costs)
router.get(['/locations/hqs', '/hqs'], async (req, res) => {
    try {
        const { XlHQ, XlUser, XlSecondarySales, XlCostCenter } = require('../db');
        const [hqsFromMaster, users, salesHqs, costHqs] = await Promise.all([
            XlHQ.findAll({ raw: true }).catch(() => []),
            XlUser.findAll({ attributes: ['hq'], raw: true }).catch(() => []),
            XlSecondarySales.findAll({ attributes: ['headquarter'], raw: true }).catch(() => []),
            XlCostCenter.findAll({ attributes: ['hq'], raw: true }).catch(() => [])
        ]);

        const allNames = new Set();
        hqsFromMaster.forEach(h => {
            const name = h.hqName || h.name || h.headquarter || '';
            if (name.trim()) allNames.add(name.trim());
        });
        users.forEach(u => {
            if (u.hq && u.hq.trim()) allNames.add(u.hq.trim());
        });
        salesHqs.forEach(s => {
            if (s.headquarter && s.headquarter.trim()) allNames.add(s.headquarter.trim());
        });
        costHqs.forEach(c => {
            if (c.hq && c.hq.trim()) allNames.add(c.hq.trim());
        });

        const list = Array.from(allNames).sort();
        res.json({ success: true, hqs: list, data: list });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/profit-center', async (req, res) => {
    try {
        const { XlProduct, XlSecondarySales, XlSecondarySalesItem, XlCostCenter } = require('../db');
        const { month, year, hq } = req.query;
        const { Op } = require('sequelize');

        const shortMonth = month ? month.split(',')[0].trim().substring(0, 3) : '';
        const yr = year || (month && month.includes(',') ? month.split(',')[1].trim() : String(new Date().getFullYear()));

        // 1. Fetch all products from Product Master
        const allProducts = await XlProduct.findAll({
            order: [['productName', 'ASC']],
            raw: true
        });

        // 2. Fetch Secondary Sales for the specified month, year, and HQ
        const secSalesWhere = {};
        if (month) {
            secSalesWhere[Op.or] = [
                { month: month },
                { month: shortMonth },
                { month: { [Op.like]: `${shortMonth}%` } }
            ];
        }
        if (yr) secSalesWhere.year = yr;
        if (hq && hq !== 'ALL') secSalesWhere.headquarter = hq;

        const secSales = await XlSecondarySales.findAll({
            where: secSalesWhere,
            raw: true
        });

        const saleIds = secSales.map(s => s._id);
        const secItems = saleIds.length > 0 ? await XlSecondarySalesItem.findAll({
            where: { saleId: { [Op.in]: saleIds } },
            raw: true
        }) : [];

        // 3. For each product, compute MRP, PTR, PTS, CUS, Purc. Cost, Transport Cost, Total Unit Cost, Sold Qty, Selling Value, Cost, Actual Profit
        const rows = allProducts.map((p, idx) => {
            const pId = p._id || p.uid || '';
            const pName = (p.productName || p.name || '').trim();

            const mrp = Number(p.mrp || 0);
            const ptr = Number(p.ptr || 0);
            const pts = Number(p.pts || 0);
            const purchaseCost = Number(p.purchaseCost || 0);
            const transportCost = Number(p.transportCost || 0);
            const marginPercent = Number(p.marginPercent || 0);
            const baseCost = purchaseCost + transportCost;
            const totalUnitCost = Number((baseCost * (1 + marginPercent / 100)).toFixed(2));

            // Match Secondary Sales Items
            const matchingItems = secItems.filter(it => {
                const itProdId = String(it.productId || '').trim();
                const itProdName = String(it.product || '').trim().toLowerCase();
                return (pId && itProdId && (itProdId === pId || itProdId === p.uid)) ||
                       (pName && itProdName && (itProdName === pName.toLowerCase() || itProdName === (p.uid || '').toLowerCase()));
            });

            let quantity = 0;
            let soldPrice = ptr; // Default to PTR if not sold
            let priceType = 'PTR';
            let cus = 0;
            let productSellingValue = 0;

            if (matchingItems.length > 0) {
                quantity = matchingItems.reduce((s, it) => s + (Number(it.salesQty || it.qty || 0)), 0);

                // Compute total value across items/HQs to derive exact average selling price
                const uniquePrices = new Set();
                matchingItems.forEach(it => {
                    const q = Number(it.salesQty || it.qty || 0);
                    let rate = ptr;
                    if (it.selectedPriceType === 'CUS' || it.priceType === 'CUS' || (it.customPrice && it.customPrice !== it.basePrice)) {
                        rate = Number(it.customPrice || ptr);
                        cus = rate;
                    } else if (it.selectedPriceType === 'PTS' || it.priceType === 'PTS') {
                        rate = pts || Number(it.basePrice || pts);
                    } else {
                        rate = ptr || Number(it.basePrice || ptr);
                    }
                    uniquePrices.add(rate);
                    productSellingValue += (q * rate);
                });

                if (quantity > 0) {
                    soldPrice = Number((productSellingValue / quantity).toFixed(2));
                    if (uniquePrices.size > 1) {
                        priceType = 'AVG';
                    } else {
                        const firstType = matchingItems[0].selectedPriceType || matchingItems[0].priceType || 'PTR';
                        priceType = firstType;
                    }
                } else {
                    soldPrice = ptr;
                    productSellingValue = 0;
                }
            } else {
                productSellingValue = 0;
            }

            const sellingPrice = productSellingValue;
            const costOfProduct = quantity * totalUnitCost;
            const actualProfit = sellingPrice - costOfProduct;

            return {
                _id: pId || `prod_${idx}`,
                productId: pId,
                productName: pName,
                composition: p.composition || '',
                category: p.category || '',
                mrp,
                ptr,
                pts,
                cus,
                purchaseCost,
                transportCost,
                marginPercent,
                totalUnitCost,
                priceType,
                soldPrice,
                quantity,
                sellingPrice,
                costOfProduct,
                actualProfit,
                totalValue: sellingPrice,
                unitPrice: soldPrice,
                hq: hq && hq !== 'ALL' ? hq : 'ALL'
            };
        });

        // 4. HQ Aggregation: Total Selling Value, Total Product Cost, Total Gross Profit
        const totalSellingValue = rows.reduce((s, r) => s + (Number(r.sellingPrice) || 0), 0);
        const totalCostOfProduct = rows.reduce((s, r) => s + (Number(r.costOfProduct) || 0), 0);
        const totalHQGrossProfit = rows.reduce((s, r) => s + (Number(r.actualProfit) || 0), 0);
        const totalQty = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

        // 5. Fetch Cost Center Operating Expenses for that HQ and Period
        const costWhere = {};
        if (month) {
            costWhere[Op.or] = [
                { month: month },
                { month: shortMonth },
                { month: { [Op.like]: `${shortMonth}%` } }
            ];
        }
        if (yr) costWhere.year = yr;
        if (hq && hq !== 'ALL') costWhere.hq = hq;

        const costRows = await XlCostCenter.findAll({ where: costWhere, raw: true });
        const totalCostCenterExpenses = costRows.reduce((s, c) => s + (Number(c.amount) || 0), 0);

        // 6. Actual Net Profit of the HQ = Gross Profit from Products - Cost Center Expenses
        const actualHQNetProfit = totalHQGrossProfit - totalCostCenterExpenses;

        res.json({
            success: true,
            data: rows,
            summary: {
                count: rows.length,
                totalQty,
                totalSellingValue,
                totalCostOfProduct,
                totalHQGrossProfit,
                totalCostCenterExpenses,
                actualHQNetProfit,
                month: month || '',
                year: yr || '',
                hq: hq || 'ALL'
            }
        });
    } catch (e) {
        console.error('Error in GET /profit-center:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// Update Purchase Cost, Transport Cost and Margin % for a Product in Master
router.put('/profit-center/product-costs', async (req, res) => {
    try {
        const { XlProduct } = require('../db');
        const { productId, purchaseCost, transportCost, marginPercent } = req.body;
        if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

        const prod = await XlProduct.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { _id: productId },
                    { uid: productId }
                ]
            }
        });

        if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });

        if (purchaseCost !== undefined) prod.purchaseCost = Number(purchaseCost || 0);
        if (transportCost !== undefined) prod.transportCost = Number(transportCost || 0);
        if (marginPercent !== undefined) prod.marginPercent = Number(marginPercent || 0);
        await prod.save();

        const baseCost = Number(prod.purchaseCost || 0) + Number(prod.transportCost || 0);
        const marginPct = Number(prod.marginPercent || 0);
        const totalUnitCost = Number((baseCost * (1 + marginPct / 100)).toFixed(2));

        res.json({
            success: true,
            message: 'Product purchase, transport and margin updated successfully',
            data: {
                productId: prod._id,
                productName: prod.productName,
                purchaseCost: prod.purchaseCost,
                transportCost: prod.transportCost,
                marginPercent: prod.marginPercent,
                totalUnitCost
            }
        });
    } catch (e) {
        console.error('Error in PUT /profit-center/product-costs:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// Bulk Update Margin % across all products in Master
router.put('/profit-center/bulk-margin', async (req, res) => {
    try {
        const { XlProduct, sequelize } = require('../db');
        const { marginPercent } = req.body;
        if (marginPercent === undefined || marginPercent === null || isNaN(Number(marginPercent))) {
            return res.status(400).json({ success: false, message: 'Valid marginPercent is required' });
        }
        const margin = Number(marginPercent);

        // Update via Sequelize model
        await XlProduct.update({ marginPercent: margin }, { where: {} });

        // Direct raw query execution to ensure Postgres column is updated
        try {
            await sequelize.query('UPDATE xl_products SET "marginPercent" = :margin', {
                replacements: { margin }
            });
        } catch (rawErr) {
            console.log('Raw query fallback err:', rawErr.message);
        }

        res.json({
            success: true,
            message: `Profit margin updated to ${margin}% across all products in Master`,
            marginPercent: margin
        });
    } catch (e) {
        console.error('Error in PUT /profit-center/bulk-margin:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/profit-center', async (req, res) => {
    try {
        const { XlProfitCenter } = require('../db');
        const { month, year, hq, productId, productName, priceType, unitPrice, quantity, totalValue, remarks } = req.body;
        if (!productName) {
            return res.status(400).json({ success: false, message: 'productName is required' });
        }

        const qty = Number(quantity || 0);
        const price = Number(unitPrice || 0);
        const computedTotal = totalValue !== undefined ? Number(totalValue) : (qty * price);

        let existing = await XlProfitCenter.findOne({
            where: {
                month: month || '',
                year: year || '',
                hq: hq || '',
                productName
            }
        });

        let record;
        if (existing) {
            existing.priceType = priceType || 'PTS';
            existing.unitPrice = price;
            existing.quantity = qty;
            existing.totalValue = computedTotal;
            if (remarks !== undefined) existing.remarks = remarks;
            await existing.save();
            record = existing;
        } else {
            record = await XlProfitCenter.create({
                month: month || '',
                year: year || '',
                hq: hq || '',
                productId: productId || '',
                productName,
                priceType: priceType || 'PTS',
                unitPrice: price,
                quantity: qty,
                totalValue: computedTotal,
                remarks: remarks || ''
            });
        }

        res.json({ success: true, data: record });
    } catch (e) {
        console.error('Error in POST /profit-center:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/profit-center/:id', async (req, res) => {
    try {
        const { XlProfitCenter } = require('../db');
        await XlProfitCenter.destroy({ where: { _id: req.params.id } });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/profit-center/roi', async (req, res) => {
    try {
        const { XlProduct, XlSecondarySales, XlSecondarySalesItem, XlCostCenter, XlHQ } = require('../db');
        const { month, year, hq } = req.query;
        const { Op } = require('sequelize');

        const shortMonth = month ? month.split(',')[0].trim().substring(0, 3) : '';
        const yr = year || (month && month.includes(',') ? month.split(',')[1].trim() : String(new Date().getFullYear()));

        // All Products
        const allProducts = await XlProduct.findAll({ raw: true });

        // Secondary Sales for Month & Year
        const secSalesWhere = {};
        if (month) {
            secSalesWhere[Op.or] = [
                { month: month },
                { month: shortMonth },
                { month: { [Op.like]: `${shortMonth}%` } }
            ];
        }
        if (yr) secSalesWhere.year = yr;

        const [secSales, allCostRows, allHQs] = await Promise.all([
            XlSecondarySales.findAll({ where: secSalesWhere, raw: true }),
            XlCostCenter.findAll({
                where: {
                    ...(month ? {
                        [Op.or]: [
                            { month: month },
                            { month: shortMonth },
                            { month: { [Op.like]: `${shortMonth}%` } }
                        ]
                    } : {}),
                    ...(yr ? { year: yr } : {})
                },
                raw: true
            }),
            XlHQ.findAll({ raw: true }).catch(() => [])
        ]);

        const saleIds = secSales.map(s => s._id);
        const secItems = saleIds.length > 0 ? await XlSecondarySalesItem.findAll({
            where: { saleId: { [Op.in]: saleIds } },
            raw: true
        }) : [];

        // All unique HQs
        const hqList = Array.from(new Set([
            ...allHQs.map(h => typeof h === 'string' ? h : (h.name || h.headquarter || '')).filter(Boolean),
            ...secSales.map(s => s.headquarter).filter(Boolean),
            ...allCostRows.map(c => c.hq).filter(Boolean)
        ]));

        const hqBreakdown = hqList.map(h => {
            const hqSales = secSales.filter(s => s.headquarter === h);
            const hqSaleIds = new Set(hqSales.map(s => s._id));
            const hqItems = secItems.filter(it => hqSaleIds.has(it.saleId));

            // Product Profit calculation for this HQ
            let hqSellingValue = 0;
            let hqTotalProductCost = 0;
            let hqGrossProfit = 0;
            let hqSoldQty = 0;

            allProducts.forEach(p => {
                const pId = p._id || p.uid || '';
                const pName = (p.productName || p.name || '').trim();
                const totalUnitCost = Number(((Number(p.purchaseCost || 0) + Number(p.transportCost || 0)) * (1 + Number(p.marginPercent || 0) / 100)).toFixed(2));

                const matching = hqItems.filter(it => {
                    const itProdId = String(it.productId || '').trim();
                    const itProdName = String(it.product || '').trim().toLowerCase();
                    return (pId && itProdId && (itProdId === pId || itProdId === p.uid)) ||
                           (pName && itProdName && (itProdName === pName.toLowerCase() || itProdName === (p.uid || '').toLowerCase()));
                });

                if (matching.length > 0) {
                    const qty = matching.reduce((s, it) => s + Number(it.salesQty || it.qty || 0), 0);
                    const cusItem = matching.find(it => it.selectedPriceType === 'CUS' || it.priceType === 'CUS' || (it.customPrice && it.customPrice !== it.basePrice));
                    let soldRate = Number(p.ptr || 0);
                    if (cusItem && cusItem.customPrice) soldRate = Number(cusItem.customPrice);
                    else if (matching[0].selectedPriceType === 'PTS' || matching[0].priceType === 'PTS') soldRate = Number(p.pts || matching[0].basePrice || 0);
                    else soldRate = Number(p.ptr || matching[0].basePrice || 0);

                    const rev = qty * soldRate;
                    const cogs = qty * totalUnitCost;
                    const prof = rev - cogs;

                    hqSoldQty += qty;
                    hqSellingValue += rev;
                    hqTotalProductCost += cogs;
                    hqGrossProfit += prof;
                }
            });

            // Operating expenses for this HQ
            const hqCosts = allCostRows.filter(c => c.hq === h);
            const expense = hqCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);

            // Actual Net Profit of this HQ = Gross Profit - Operating Expenses
            const actualNetProfit = hqGrossProfit - expense;
            const roiPct = expense > 0 ? Number(((hqGrossProfit / expense) * 100).toFixed(1)) : (hqGrossProfit > 0 ? 100 : 0);

            let status = 'DEFICIT';
            if (actualNetProfit >= 0 && roiPct >= 100) status = 'PROFITABLE';
            else if (roiPct >= 70) status = 'MODERATE';

            return {
                hq: h,
                sellingValue: hqSellingValue,
                productCost: hqTotalProductCost,
                revenue: hqGrossProfit, // Gross Product Profit
                expense, // Total Cost Center Expense
                netMargin: actualNetProfit, // Actual Net Profit
                actualNetProfit,
                roiPct,
                status,
                soldQty: hqSoldQty
            };
        });

        const filteredBreakdown = (hq && hq !== 'ALL') ? hqBreakdown.filter(b => b.hq === hq) : hqBreakdown;

        const totalSellingValue = filteredBreakdown.reduce((s, b) => s + b.sellingValue, 0);
        const totalProductCost = filteredBreakdown.reduce((s, b) => s + b.productCost, 0);
        const totalRevenue = filteredBreakdown.reduce((s, b) => s + b.revenue, 0);
        const totalExpense = filteredBreakdown.reduce((s, b) => s + b.expense, 0);
        const totalNetMargin = totalRevenue - totalExpense;
        const overallRoi = totalExpense > 0 ? Number(((totalRevenue / totalExpense) * 100).toFixed(1)) : (totalRevenue > 0 ? 100 : 0);

        res.json({
            success: true,
            summary: {
                totalSellingValue,
                totalProductCost,
                totalRevenue,
                totalExpense,
                totalNetMargin,
                overallRoi
            },
            breakdown: filteredBreakdown
        });
    } catch (e) {
        console.error('Error in /profit-center/roi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ----------------------------------------------------
// 5c. PROFIT CENTER - MONTH-WISE & PRODUCT-WISE ANALYTICS
// ----------------------------------------------------
router.get('/profit-center/analytics', async (req, res) => {
    try {
        const { XlProduct, XlSecondarySales, XlSecondarySalesItem, XlCostCenter, XlHQ } = require('../db');
        const { year, hq } = req.query;
        const { Op } = require('sequelize');

        const yr = year ? String(year).trim() : String(new Date().getFullYear());
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // 1. Fetch all products
        const allProducts = await XlProduct.findAll({
            order: [['productName', 'ASC']],
            raw: true
        });

        // 2. Fetch all Secondary Sales for this year (and HQ if specified)
        const secSalesWhere = { year: yr };
        if (hq && hq !== 'ALL') secSalesWhere.headquarter = hq;

        const [secSales, allCostRows, allHQs] = await Promise.all([
            XlSecondarySales.findAll({ where: secSalesWhere, raw: true }),
            XlCostCenter.findAll({
                where: {
                    year: yr,
                    ...(hq && hq !== 'ALL' ? { hq } : {})
                },
                raw: true
            }),
            XlHQ.findAll({ raw: true }).catch(() => [])
        ]);

        const saleIds = secSales.map(s => s._id);
        const secItems = saleIds.length > 0 ? await XlSecondarySalesItem.findAll({
            where: { saleId: { [Op.in]: saleIds } },
            raw: true
        }) : [];

        // Map sales items to saleId for quick lookup
        const itemsBySaleId = new Map();
        secItems.forEach(it => {
            if (!itemsBySaleId.has(it.saleId)) itemsBySaleId.set(it.saleId, []);
            itemsBySaleId.get(it.saleId).push(it);
        });

        // 3. 12-Month Company / Territory Monthly Trend
        const monthlyTrend = MONTHS.map((m, idx) => {
            const mLower = m.toLowerCase();

            // Filter sales for this month
            const monthSales = secSales.filter(s => {
                const sm = String(s.month || '').trim().toLowerCase();
                return sm.startsWith(mLower) || sm === String(idx + 1) || sm === `0${idx + 1}`;
            });

            const monthItems = [];
            monthSales.forEach(s => {
                const items = itemsBySaleId.get(s._id) || [];
                monthItems.push(...items);
            });

            // Calculate revenue and product costs for this month
            let monthSellingValue = 0;
            let monthProductCost = 0;
            let monthSoldQty = 0;

            allProducts.forEach(p => {
                const pId = p._id || p.uid || '';
                const pName = (p.productName || p.name || '').trim();
                const totalUnitCost = Number(((Number(p.purchaseCost || 0) + Number(p.transportCost || 0)) * (1 + Number(p.marginPercent || 0) / 100)).toFixed(2));

                const matching = monthItems.filter(it => {
                    const itProdId = String(it.productId || '').trim();
                    const itProdName = String(it.product || '').trim().toLowerCase();
                    return (pId && itProdId && (itProdId === pId || itProdId === p.uid)) ||
                           (pName && itProdName && (itProdName === pName.toLowerCase() || itProdName === (p.uid || '').toLowerCase()));
                });

                if (matching.length > 0) {
                    const qty = matching.reduce((s, it) => s + Number(it.salesQty || it.qty || 0), 0);
                    const cusItem = matching.find(it => it.selectedPriceType === 'CUS' || it.priceType === 'CUS' || (it.customPrice && it.customPrice !== it.basePrice));
                    let soldRate = Number(p.ptr || 0);
                    if (cusItem && cusItem.customPrice) soldRate = Number(cusItem.customPrice);
                    else if (matching[0].selectedPriceType === 'PTS' || matching[0].priceType === 'PTS') soldRate = Number(p.pts || matching[0].basePrice || 0);
                    else soldRate = Number(p.ptr || matching[0].basePrice || 0);

                    const rev = qty * soldRate;
                    const cogs = qty * totalUnitCost;

                    monthSoldQty += qty;
                    monthSellingValue += rev;
                    monthProductCost += cogs;
                }
            });

            const monthGrossProfit = monthSellingValue - monthProductCost;

            // Cost Center Expenses for this month
            const monthCosts = allCostRows.filter(c => {
                const cm = String(c.month || '').trim().toLowerCase();
                return cm.startsWith(mLower) || cm === String(idx + 1) || cm === `0${idx + 1}`;
            });
            const monthExpenses = monthCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);

            // Actual Net Profit
            const monthNetProfit = monthGrossProfit - monthExpenses;
            const isProfitable = monthNetProfit >= 0;

            return {
                month: m,
                monthIndex: idx + 1,
                soldQty: monthSoldQty,
                sellingValue: monthSellingValue,
                productCost: monthProductCost,
                grossProfit: monthGrossProfit,
                costCenterExpenses: monthExpenses,
                actualNetProfit: monthNetProfit,
                isProfitable,
                status: isProfitable ? 'PROFITABLE' : 'DEFICIT',
                roiPct: monthExpenses > 0 ? Number(((monthGrossProfit / monthExpenses) * 100).toFixed(1)) : (monthGrossProfit > 0 ? 100 : 0)
            };
        });

        // 4. Territory Comparison Summary
        const uniqueHqs = Array.from(new Set([
            ...allHQs.map(h => typeof h === 'string' ? h : (h.name || h.headquarter || '')).filter(Boolean),
            ...secSales.map(s => s.headquarter).filter(Boolean),
            ...allCostRows.map(c => c.hq).filter(Boolean)
        ]));

        const territoryComparison = uniqueHqs.map(h => {
            const hqSales = secSales.filter(s => s.headquarter === h);
            const hqItems = [];
            hqSales.forEach(s => {
                const items = itemsBySaleId.get(s._id) || [];
                hqItems.push(...items);
            });

            let hqSelling = 0;
            let hqCost = 0;
            allProducts.forEach(p => {
                const pId = p._id || p.uid || '';
                const pName = (p.productName || p.name || '').trim();
                const totalUnitCost = Number(((Number(p.purchaseCost || 0) + Number(p.transportCost || 0)) * (1 + Number(p.marginPercent || 0) / 100)).toFixed(2));

                const matching = hqItems.filter(it => {
                    const itProdId = String(it.productId || '').trim();
                    const itProdName = String(it.product || '').trim().toLowerCase();
                    return (pId && itProdId && (itProdId === pId || itProdId === p.uid)) ||
                           (pName && itProdName && (itProdName === pName.toLowerCase() || itProdName === (p.uid || '').toLowerCase()));
                });

                if (matching.length > 0) {
                    const qty = matching.reduce((s, it) => s + Number(it.salesQty || it.qty || 0), 0);
                    const cusItem = matching.find(it => it.selectedPriceType === 'CUS' || it.priceType === 'CUS' || (it.customPrice && it.customPrice !== it.basePrice));
                    let soldRate = Number(p.ptr || 0);
                    if (cusItem && cusItem.customPrice) soldRate = Number(cusItem.customPrice);
                    else if (matching[0].selectedPriceType === 'PTS' || matching[0].priceType === 'PTS') soldRate = Number(p.pts || matching[0].basePrice || 0);
                    else soldRate = Number(p.ptr || matching[0].basePrice || 0);

                    hqSelling += qty * soldRate;
                    hqCost += qty * totalUnitCost;
                }
            });

            const hqGross = hqSelling - hqCost;
            const hqExpenseRows = allCostRows.filter(c => c.hq === h);
            const hqExp = hqExpenseRows.reduce((s, c) => s + (Number(c.amount) || 0), 0);
            const hqNet = hqGross - hqExp;

            // 12-month net profit trend for this HQ
            const monthlyNet = MONTHS.map((m, idx) => {
                const mLower = m.toLowerCase();
                const mSales = hqSales.filter(s => {
                    const sm = String(s.month || '').trim().toLowerCase();
                    return sm.startsWith(mLower) || sm === String(idx + 1);
                });
                const mItems = [];
                mSales.forEach(s => {
                    const items = itemsBySaleId.get(s._id) || [];
                    mItems.push(...items);
                });

                let mRev = 0;
                let mCogs = 0;
                allProducts.forEach(p => {
                    const pId = p._id || p.uid || '';
                    const pName = (p.productName || p.name || '').trim();
                    const totalUnitCost = Number(((Number(p.purchaseCost || 0) + Number(p.transportCost || 0)) * (1 + Number(p.marginPercent || 0) / 100)).toFixed(2));
                    const matching = mItems.filter(it => {
                        const itProdId = String(it.productId || '').trim();
                        const itProdName = String(it.product || '').trim().toLowerCase();
                        return (pId && itProdId && (itProdId === pId || itProdId === p.uid)) ||
                               (pName && itProdName && (itProdName === pName.toLowerCase() || itProdName === (p.uid || '').toLowerCase()));
                    });
                    if (matching.length > 0) {
                        const qty = matching.reduce((s, it) => s + Number(it.salesQty || it.qty || 0), 0);
                        const cusItem = matching.find(it => it.selectedPriceType === 'CUS' || it.priceType === 'CUS' || (it.customPrice && it.customPrice !== it.basePrice));
                        let rate = Number(p.ptr || 0);
                        if (cusItem && cusItem.customPrice) rate = Number(cusItem.customPrice);
                        else if (matching[0].selectedPriceType === 'PTS' || matching[0].priceType === 'PTS') rate = Number(p.pts || 0);
                        mRev += qty * rate;
                        mCogs += qty * totalUnitCost;
                    }
                });
                const mCostRows = hqExpenseRows.filter(c => {
                    const cm = String(c.month || '').trim().toLowerCase();
                    return cm.startsWith(mLower) || cm === String(idx + 1);
                });
                const mCost = mCostRows.reduce((s, c) => s + (Number(c.amount) || 0), 0);
                return (mRev - mCogs) - mCost;
            });

            return {
                hq: h,
                sellingValue: hqSelling,
                productCost: hqCost,
                grossProfit: hqGross,
                costCenterExpenses: hqExp,
                actualNetProfit: hqNet,
                isProfitable: hqNet >= 0,
                status: hqNet >= 0 ? 'PROFITABLE' : 'DEFICIT',
                monthlyNet
            };
        });

        // 5. Product-wise 12-Month Trend Graphs
        const productTrends = allProducts.map(p => {
            const pId = p._id || p.uid || '';
            const pName = (p.productName || p.name || '').trim();
            const totalUnitCost = Number(((Number(p.purchaseCost || 0) + Number(p.transportCost || 0)) * (1 + Number(p.marginPercent || 0) / 100)).toFixed(2));

            let totalAnnualQty = 0;
            let totalAnnualRevenue = 0;
            let totalAnnualCost = 0;

            const monthly = MONTHS.map((m, idx) => {
                const mLower = m.toLowerCase();
                const mSales = secSales.filter(s => {
                    const sm = String(s.month || '').trim().toLowerCase();
                    return sm.startsWith(mLower) || sm === String(idx + 1);
                });
                const mItems = [];
                mSales.forEach(s => {
                    const items = itemsBySaleId.get(s._id) || [];
                    mItems.push(...items);
                });

                const matching = mItems.filter(it => {
                    const itProdId = String(it.productId || '').trim();
                    const itProdName = String(it.product || '').trim().toLowerCase();
                    return (pId && itProdId && (itProdId === pId || itProdId === p.uid)) ||
                           (pName && itProdName && (itProdName === pName.toLowerCase() || itProdName === (p.uid || '').toLowerCase()));
                });

                let qty = 0;
                let rev = 0;
                let cost = 0;
                if (matching.length > 0) {
                    qty = matching.reduce((s, it) => s + Number(it.salesQty || it.qty || 0), 0);
                    const cusItem = matching.find(it => it.selectedPriceType === 'CUS' || it.priceType === 'CUS' || (it.customPrice && it.customPrice !== it.basePrice));
                    let rate = Number(p.ptr || 0);
                    if (cusItem && cusItem.customPrice) rate = Number(cusItem.customPrice);
                    else if (matching[0].selectedPriceType === 'PTS' || matching[0].priceType === 'PTS') rate = Number(p.pts || 0);

                    rev = qty * rate;
                    cost = qty * totalUnitCost;
                }

                const profit = rev - cost;
                totalAnnualQty += qty;
                totalAnnualRevenue += rev;
                totalAnnualCost += cost;

                return {
                    month: m,
                    qty,
                    revenue: rev,
                    cost,
                    profit,
                    isProfitable: profit >= 0
                };
            });

            const totalAnnualProfit = totalAnnualRevenue - totalAnnualCost;

            return {
                productId: pId,
                productName: pName,
                composition: p.composition || '',
                mrp: Number(p.mrp || 0),
                ptr: Number(p.ptr || 0),
                pts: Number(p.pts || 0),
                purchaseCost: Number(p.purchaseCost || 0),
                transportCost: Number(p.transportCost || 0),
                totalUnitCost,
                totalQty: totalAnnualQty,
                totalRevenue: totalAnnualRevenue,
                totalCost: totalAnnualCost,
                totalProfit: totalAnnualProfit,
                isProfitable: totalAnnualProfit >= 0,
                monthly
            };
        });

        // Sort products by totalProfit DESC
        productTrends.sort((a, b) => b.totalProfit - a.totalProfit);

        // Overall Annual Totals
        const annualSellingValue = monthlyTrend.reduce((s, m) => s + m.sellingValue, 0);
        const annualProductCost = monthlyTrend.reduce((s, m) => s + m.productCost, 0);
        const annualGrossProfit = monthlyTrend.reduce((s, m) => s + m.grossProfit, 0);
        const annualCostCenter = monthlyTrend.reduce((s, m) => s + m.costCenterExpenses, 0);
        const annualNetProfit = annualGrossProfit - annualCostCenter;
        const profitableMonths = monthlyTrend.filter(m => m.isProfitable).length;
        const deficitMonths = 12 - profitableMonths;

        res.json({
            success: true,
            year: yr,
            hq: hq || 'ALL',
            summary: {
                annualSellingValue,
                annualProductCost,
                annualGrossProfit,
                annualCostCenter,
                annualNetProfit,
                isProfitable: annualNetProfit >= 0,
                profitableMonths,
                deficitMonths
            },
            monthlyTrend,
            territoryComparison,
            productTrends
        });
    } catch (e) {
        console.error('Error in /profit-center/analytics:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// 6. REMINDER CALL REPORTS & SCHEDULING (Menu #9 & XLA Reminders)
router.get('/admin/users', async (req, res) => {
    try {
        const { XlUser } = require('../db');
        const users = await XlUser.findAll({ order: [['firstName', 'ASC']] });
        res.json({ success: true, users });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const { XlUser } = require('../db');
        const users = await XlUser.findAll({ order: [['firstName', 'ASC']] });
        res.json({ success: true, users });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/reports/reminders', async (req, res) => {
    try {
        const { employeeId, startDate, endDate, month, year } = req.query;
        const { XlDCR, XlUser } = require('../db');
        const { Op } = require('sequelize');

        let where = { entityType: 'Reminder' };
        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        } else if (month && year) {
            const m = String(parseInt(month, 10)).padStart(2, '0');
            const y = parseInt(year, 10);
            const lastDay = new Date(y, parseInt(month, 10), 0).getDate();
            where.date = { [Op.between]: [`${y}-${m}-01`, `${y}-${m}-${String(lastDay).padStart(2, '0')}`] };
        }

        if (employeeId && employeeId !== 'all' && employeeId !== 'ALL') {
            const ctx = await resolveUserContext(employeeId);
            where.employeeId = { [Op.in]: ctx.ids.length > 0 ? ctx.ids : [employeeId] };
        }

        const [records, allUsers] = await Promise.all([
            XlDCR.findAll({ where, order: [['date', 'DESC'], ['createdAt', 'DESC']], raw: true }),
            XlUser.findAll({ raw: true })
        ]);

        const userMap = {};
        allUsers.forEach(u => {
            const name = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.employeeId;
            const info = { name, firstName: u.firstName || name, email: u.email || '', hq: u.hq || '-', designation: u.designation || 'MR' };
            if (u.employeeId) userMap[u.employeeId] = info;
            if (u.uid) userMap[u.uid] = info;
            if (u._id) userMap[u._id] = info;
            if (u.email) userMap[u.email] = info;
        });

        const formatted = records.map(r => {
            let products = [];
            try { products = JSON.parse(r.productsDetailed || '[]'); } catch (e) {}
            let gifts = [];
            try { gifts = JSON.parse(r.gifts || '[]'); } catch (e) {}
            let meta = {};
            try {
                if (r.adminRemarks && r.adminRemarks.trim().startsWith('{')) {
                    meta = JSON.parse(r.adminRemarks);
                }
            } catch (e) {}

            const uInfo = userMap[r.employeeId] || { name: r.employeeName || r.employeeId, firstName: r.employeeName || r.employeeId, email: '', hq: '-', designation: 'MR' };
            const participants = Array.isArray(meta.participants) && meta.participants.length > 0
                ? meta.participants
                : [{ employeeId: r.employeeId, name: uInfo.name, firstName: uInfo.firstName, email: uInfo.email }];

            return {
                _id: r._id,
                groupId: meta.groupId || r.entityId || r._id,
                date: r.date,
                displayDate: toDisplayDate(r.date),
                employeeId: r.employeeId,
                employeeName: uInfo.name,
                headquarter: uInfo.hq,
                hq: uInfo.hq,
                designation: uInfo.designation,
                title: r.entityName || '-',
                doctorName: r.entityName || '-',
                entityName: r.entityName || '-',
                entityId: r.entityId || '',
                meetingMode: meta.meetingMode || 'Google Meet',
                meetLink: meta.meetLink || '',
                calendarLink: meta.calendarLink || '',
                participants,
                emailSent: Boolean(meta.emailSent),
                emailCount: meta.emailCount || (meta.emailSent ? (meta.recipientEmails?.length || participants.length) : 0),
                emailError: meta.emailError || '',
                recipientEmails: meta.recipientEmails || (meta.participants ? meta.participants.map(p => p.email).filter(Boolean) : []),
                emailDeliveryMode: meta.emailDeliveryMode || 'group',
                productsDetailed: Array.isArray(products) ? products : [],
                products: Array.isArray(products) ? products : [],
                giftsGiven: Array.isArray(gifts) ? gifts : [],
                remarks: r.discussion || '',
                discussion: r.discussion || '',
                description: r.discussion || '',
                workingAreas: r.workingAreas || '-',
                checkInTime: r.checkInTime || '-',
                time: r.checkInTime || '-',
                status: r.status || 'Submitted'
            };
        });

        // Deduplicate by groupId for XLA Joint Reminder view
        const groupMap = new Map();
        formatted.forEach(item => {
            const gKey = item.groupId || item._id;
            if (!groupMap.has(gKey)) {
                groupMap.set(gKey, { ...item });
            } else {
                const existing = groupMap.get(gKey);
                const existingIds = new Set((existing.participants || []).map(p => p.employeeId));
                (item.participants || []).forEach(p => {
                    if (!existingIds.has(p.employeeId)) {
                        existing.participants.push(p);
                        existingIds.add(p.employeeId);
                    }
                });
            }
        });
        const grouped = Array.from(groupMap.values());

        let defaultMeetLink = 'https://meet.google.com/gzo-dhjh-okf';
        try {
            const { XlGlobalSettings } = require('../db');
            const gSet = await XlGlobalSettings.findOne();
            if (gSet && gSet.settings && gSet.settings.defaultGoogleMeetLink) {
                defaultMeetLink = gSet.settings.defaultGoogleMeetLink;
            }
        } catch (err) {}

        // Ensure any reminder using Google Meet has a valid room link (upgrade old test links)
        formatted.forEach(item => {
            if (item.meetingMode === 'Google Meet' && (!item.meetLink || item.meetLink.includes('pyk-ndaa-ivm') || item.meetLink.endsWith('/new'))) {
                item.meetLink = defaultMeetLink;
            }
        });
        grouped.forEach(item => {
            if (item.meetingMode === 'Google Meet' && (!item.meetLink || item.meetLink.includes('pyk-ndaa-ivm') || item.meetLink.endsWith('/new'))) {
                item.meetLink = defaultMeetLink;
            }
        });

        res.json({
            success: true,
            count: formatted.length,
            data: formatted,
            grouped,
            defaultMeetLink
        });
    } catch (e) {
        console.error('Reminders report error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/reminders', async (req, res) => {
    try {
        const {
            employeeId,
            employeeIds,
            date,
            title,
            doctorName,
            entityName,
            entityId,
            productsDetailed,
            description,
            remarks,
            discussion,
            time,
            meetingMode = 'Google Meet',
            meetLink = '',
            emailDeliveryMode = 'group',
            selectedEmails = []
        } = req.body;

        const resolvedTitle = title || doctorName || entityName;
        const resolvedRemarks = description || remarks || discussion || '';
        const targetEmpIds = Array.isArray(employeeIds) && employeeIds.length > 0
            ? employeeIds
            : (employeeId ? [employeeId] : []);

        if (targetEmpIds.length === 0 || !date || !resolvedTitle) {
            return res.status(400).json({ success: false, message: 'At least one user, date, and title are required' });
        }

        const { XlDCR, XlNotification, XlUser } = require('../db');
        const allUsers = await XlUser.findAll({ raw: true });
        const userLookup = {};
        allUsers.forEach(u => {
            const full = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.employeeId;
            const rec = {
                employeeId: u.employeeId || u.uid || u._id,
                name: full,
                firstName: u.firstName || full.split(' ')[0] || full,
                email: u.email || '',
                hq: u.hq || '-',
                designation: u.designation || 'MR'
            };
            if (u.employeeId) userLookup[u.employeeId] = rec;
            if (u.uid) userLookup[u.uid] = rec;
            if (u._id) userLookup[u._id] = rec;
            if (u.email) userLookup[u.email] = rec;
        });

        const participants = targetEmpIds.map(id => {
            return userLookup[id] || { employeeId: id, name: id, firstName: id, email: '', hq: '-', designation: 'MR' };
        });

        const emailSet = new Set();
        participants.forEach(p => { if (p.email && p.email.includes('@')) emailSet.add(p.email.trim()); });
        if (Array.isArray(selectedEmails)) {
            selectedEmails.forEach(em => { if (em && String(em).includes('@')) emailSet.add(String(em).trim()); });
        }
        const recipientEmails = Array.from(emailSet);

        // Build Google Calendar + Google Meet Link
        const cleanDate = String(date).replace(/-/g, '');
        const cleanTime = String(time || '09:45').replace(':', '') + '00';
        const endHour = String((parseInt(String(time || '09:45').split(':')[0], 10) + 1) % 24).padStart(2, '0');
        const endMin = String(time || '09:45').split(':')[1] || '45';
        const cleanEndTime = `${endHour}${endMin}00`;
        const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(resolvedTitle)}&dates=${cleanDate}T${cleanTime}/${cleanDate}T${cleanEndTime}&details=${encodeURIComponent(resolvedRemarks)}${recipientEmails.length > 0 ? `&add=${encodeURIComponent(recipientEmails.join(','))}` : ''}`;

        let finalMeetLink = meetLink ? meetLink.trim() : '';
        try {
            const { XlGlobalSettings } = require('../db');
            let gSet = await XlGlobalSettings.findOne();
            if (finalMeetLink && /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(finalMeetLink)) {
                if (!gSet) {
                    await XlGlobalSettings.create({ settings: { defaultGoogleMeetLink: finalMeetLink } });
                } else {
                    gSet.settings = { ...(gSet.settings || {}), defaultGoogleMeetLink: finalMeetLink };
                    await gSet.save();
                }
            } else if (meetingMode === 'Google Meet' && !finalMeetLink && gSet?.settings?.defaultGoogleMeetLink) {
                finalMeetLink = gSet.settings.defaultGoogleMeetLink;
            }
        } catch (err) {}
        if (meetingMode === 'Google Meet' && !finalMeetLink) {
            finalMeetLink = 'https://meet.google.com/gzo-dhjh-okf';
        }

        const groupId = 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const displayDate = toDisplayDate(date);

        // Send Email(s) via Zoho SMTP if recipients exist
        let emailSent = false;
        let emailCount = 0;
        if (recipientEmails.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
                    port: parseInt(process.env.EMAIL_PORT || '465', 10),
                    secure: process.env.EMAIL_SECURE === 'true' || String(process.env.EMAIL_PORT || '465') === '465',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
                    }
                });

                const buildHtml = (greetingName) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; padding: 20px 24px;">
                            <div style="font-size: 11px; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                                Emyris Biolifesciences • ${meetingMode === 'Google Meet' ? '🎥 Google Meet Invite' : '📞 Conference Call (Concall)'}
                            </div>
                            <h2 style="margin: 6px 0 0; font-size: 20px;">${resolvedTitle}</h2>
                        </div>
                        <div style="padding: 24px; background: #ffffff; color: #334155;">
                            <p style="margin-top: 0;">Hello <strong>${greetingName}</strong>,</p>
                            <p>You have been scheduled for a <strong>${meetingMode}</strong> reminder/meeting:</p>
                            <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 16px; border-radius: 6px; margin: 16px 0;">
                                <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${displayDate}</p>
                                <p style="margin: 4px 0;"><strong>⏰ Time:</strong> ${time || '09:45'}</p>
                                <p style="margin: 4px 0;"><strong>📌 Mode:</strong> ${meetingMode}</p>
                                <p style="margin: 4px 0;"><strong>👥 Participants:</strong> ${participants.map(p => p.name).join(', ')}</p>
                            </div>
                            ${resolvedRemarks ? `
                                <div style="margin: 16px 0;">
                                    <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Message / Agenda:</div>
                                    <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px 14px; border-radius: 8px; color: #1e293b; white-space: pre-line;">${resolvedRemarks}</div>
                                </div>
                            ` : ''}
                            ${meetingMode === 'Google Meet' ? `
                                <div style="margin-top: 22px; text-align: center;">
                                    <a href="${finalMeetLink}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; margin-right: 8px;">
                                        🎥 Join Google Meet
                                    </a>
                                    <a href="${calendarLink}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px;">
                                        📅 Open in Google Calendar
                                    </a>
                                </div>
                                <p style="font-size: 12px; color: #64748b; margin-top: 14px; text-align: center;">
                                    Google Meet Link: <a href="${finalMeetLink}" style="color: #0284c7;">${finalMeetLink}</a>
                                </p>
                            ` : ''}
                        </div>
                    </div>
                `;

                const fromAddr = process.env.EMAIL_FROM || `"Emyris Biolifesciences" <${process.env.EMAIL_USER}>`;
                if (emailDeliveryMode === 'individual') {
                    for (const p of participants) {
                        if (!p.email || !p.email.includes('@')) continue;
                        await transporter.sendMail({
                            from: fromAddr,
                            to: p.email.trim(),
                            subject: `[${meetingMode}] ${resolvedTitle} — ${displayDate} at ${time || '09:45'}`,
                            html: buildHtml(p.name)
                        });
                        emailCount++;
                    }
                } else {
                    await transporter.sendMail({
                        from: fromAddr,
                        to: recipientEmails.join(', '),
                        subject: `[${meetingMode}] ${resolvedTitle} — ${displayDate} at ${time || '09:45'}`,
                        html: buildHtml('Team')
                    });
                    emailCount = recipientEmails.length;
                }
                emailSent = emailCount > 0;
            } catch (mailErr) {
                console.error('Reminder email error:', mailErr.message);
                emailError = mailErr.message;
            }
        } else {
            if (recipientEmails.length === 0) {
                emailError = 'No valid email addresses found for the selected participants.';
            } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                emailError = 'SMTP email credentials (EMAIL_USER / EMAIL_PASS) not configured in server environment.';
            }
        }

        const metaStr = JSON.stringify({
            groupId,
            meetingMode,
            meetLink: finalMeetLink,
            calendarLink,
            participants,
            emailSent,
            emailCount,
            emailError,
            recipientEmails,
            emailDeliveryMode
        });

        const createdRecords = [];
        for (const p of participants) {
            const rec = await XlDCR.create({
                employeeId: p.employeeId,
                employeeName: p.name,
                date,
                entityType: 'Reminder',
                entityId: groupId,
                entityName: resolvedTitle,
                productsDetailed: JSON.stringify(Array.isArray(productsDetailed) ? productsDetailed : (productsDetailed ? [productsDetailed] : [])),
                discussion: resolvedRemarks,
                adminRemarks: metaStr,
                checkInTime: time || '09:45',
                workingAreas: p.hq || '-',
                status: 'Approved'
            });
            createdRecords.push(rec);

            try {
                const notifTargets = [...new Set([p.employeeId, p.email].filter(Boolean))];
                for (const nt of notifTargets) {
                    await XlNotification.create({
                        employeeId: nt,
                        title: `${meetingMode}: ${resolvedTitle}`,
                        message: `${displayDate} at ${time || '09:45'} — ${resolvedRemarks || 'Scheduled meeting'}${meetingMode === 'Google Meet' && finalMeetLink ? ` | Meet: ${finalMeetLink}` : ''}`
                    });
                }
            } catch (nErr) {}
        }

        res.json({
            success: true,
            groupId,
            emailSent,
            emailCount,
            emailError: emailError || null,
            recipientEmails,
            meetLink: finalMeetLink,
            calendarLink,
            data: createdRecords[0],
            recordsCount: createdRecords.length
        });
    } catch (e) {
        console.error('Create reminder error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/reminders/:id', async (req, res) => {
    try {
        const { XlDCR } = require('../db');
        const { Op } = require('sequelize');
        const targetId = req.params.id;
        await XlDCR.destroy({
            where: {
                entityType: 'Reminder',
                [Op.or]: [
                    { _id: targetId },
                    { entityId: targetId }
                ]
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 7. TARGETS VS ACHIEVEMENT REPORT (Menu #19 - Linked with XLA Targets)
router.get('/reports/targets', async (req, res) => {
    try {
        const { employeeId, year, month } = req.query;
        const { XlTarget, XlPrimarySales, XlPrimarySalesItem, XlSecondarySales, XlSecondarySalesItem, XlDCR, XlProduct } = require('../db');
        const { Op } = require('sequelize');

        const ctx = await resolveUserContext(employeeId);
        const ids = ctx.ids.length > 0 ? ctx.ids : (employeeId && employeeId !== 'all' ? [employeeId] : []);
        const empWhere = ids.length > 0 ? { employeeId: { [Op.in]: ids } } : {};

        const targetYear = String(year || new Date().getFullYear());

        const [targets, priSales, secSales, dcrs, allProducts] = await Promise.all([
            XlTarget.findAll({ where: { ...empWhere, year: targetYear }, order: [['createdAt', 'DESC']], raw: true }),
            XlPrimarySales.findAll({ where: empWhere, raw: true }),
            XlSecondarySales.findAll({ where: empWhere, raw: true }),
            XlDCR.findAll({ where: empWhere, raw: true }),
            XlProduct.findAll({ raw: true })
        ]);

        const prodPriceMap = {};
        const prodNameMap = {};
        allProducts.forEach(p => {
            const name = p.productName || p.name;
            if (p._id) { prodNameMap[p._id] = name; prodPriceMap[p._id] = Number(p.pts || p.ptr || p.mrp || 0); }
            if (p.uid) { prodNameMap[p.uid] = name; prodPriceMap[p.uid] = Number(p.pts || p.ptr || p.mrp || 0); }
            if (name) { prodNameMap[name] = name; prodPriceMap[name] = Number(p.pts || p.ptr || p.mrp || 0); }
        });

        // Filter targets by month if requested
        const monthShort = month && month !== 'All'
            ? (isNaN(Number(month)) ? String(month).slice(0, 3) : new Date(Number(targetYear), Number(month) - 1, 1).toLocaleString('en-US', { month: 'short' }))
            : null;
        const monthNumStr = month && month !== 'All' && !isNaN(Number(month))
            ? String(Number(month)).padStart(2, '0')
            : null;

        const filteredTargets = monthShort
            ? targets.filter(t => !t.month || t.month.toLowerCase().startsWith(monthShort.toLowerCase()) || t.targetPeriod === 'Yearly')
            : targets;

        // Filter Primary & Secondary sales for period
        const periodPri = priSales.filter(p => {
            const matchYear = p.year === targetYear || (p.date && p.date.startsWith(targetYear)) || (p.invoiceDate && p.invoiceDate.startsWith(targetYear));
            if (!matchYear) return false;
            if (!monthShort) return true;
            return (p.month && p.month.toLowerCase().startsWith(monthShort.toLowerCase())) ||
                   (monthNumStr && ((p.date && p.date.startsWith(`${targetYear}-${monthNumStr}`)) || (p.invoiceDate && p.invoiceDate.startsWith(`${targetYear}-${monthNumStr}`))));
        });

        const periodSec = secSales.filter(s => {
            const matchYear = s.year === targetYear || (s.date && s.date.startsWith(targetYear));
            if (!matchYear) return false;
            if (!monthShort) return true;
            return (s.month && s.month.toLowerCase().startsWith(monthShort.toLowerCase())) ||
                   (monthNumStr && s.date && s.date.startsWith(`${targetYear}-${monthNumStr}`));
        });

        const periodDcrs = dcrs.filter(d => {
            if (!d.date || !d.date.startsWith(targetYear)) return false;
            if (!monthNumStr) return true;
            return d.date.startsWith(`${targetYear}-${monthNumStr}`);
        });

        const priSaleIds = periodPri.map(p => p._id);
        const secSaleIds = periodSec.map(s => s._id);

        const [priItems, secItems] = await Promise.all([
            priSaleIds.length > 0 ? XlPrimarySalesItem.findAll({ where: { saleId: { [Op.in]: priSaleIds } }, raw: true }) : [],
            secSaleIds.length > 0 ? XlSecondarySalesItem.findAll({ where: { saleId: { [Op.in]: secSaleIds } }, raw: true }) : []
        ]);

        const primaryAchieved = periodPri.reduce((acc, p) => acc + Number(p.netInvValue || p.amount || 0), 0);
        const secondaryAchieved = periodSec.reduce((acc, s) => acc + Number(s.amount || 0), 0);

        let pobAchieved = 0;
        const prodAchievedMap = {};
        const addProdAchieved = (prodKey, qty, amt, source) => {
            const cleanName = prodNameMap[prodKey] || prodKey;
            if (!cleanName) return;
            if (!prodAchievedMap[cleanName]) {
                prodAchievedMap[cleanName] = { productName: cleanName, primaryQty: 0, primaryAmt: 0, secondaryQty: 0, secondaryAmt: 0, pobQty: 0, pobAmt: 0 };
            }
            if (source === 'primary') {
                prodAchievedMap[cleanName].primaryQty += qty;
                prodAchievedMap[cleanName].primaryAmt += amt;
            } else if (source === 'secondary') {
                prodAchievedMap[cleanName].secondaryQty += qty;
                prodAchievedMap[cleanName].secondaryAmt += amt;
            } else if (source === 'pob') {
                prodAchievedMap[cleanName].pobQty += qty;
                prodAchievedMap[cleanName].pobAmt += amt;
            }
        };

        priItems.forEach(it => {
            const q = Number(it.qty || 0);
            const r = Number(it.basePrice || prodPriceMap[it.product] || 0);
            addProdAchieved(it.product || it.productId, q, q * r, 'primary');
        });

        secItems.forEach(it => {
            const q = Number(it.salesQty || it.qty || 0);
            const r = Number(it.basePrice || it.customPrice || prodPriceMap[it.product] || 0);
            addProdAchieved(it.product || it.productId, q, q * r, 'secondary');
        });

        periodDcrs.forEach(d => {
            try {
                const items = JSON.parse(d.pobItems || '[]');
                if (Array.isArray(items)) {
                    items.forEach(it => {
                        const q = Number(it.qty || 0);
                        const r = Number(it.rate || 0);
                        pobAchieved += q * r;
                        addProdAchieved(it.product, q, q * r, 'pob');
                    });
                }
            } catch (e) {}
        });

        // Aggregate Product-wise targets
        let totalLumpSumTarget = 0;
        let totalProductTargetAmount = 0;
        const prodTargetMap = {};

        filteredTargets.forEach(t => {
            totalLumpSumTarget += Number(t.lumpSumAmount || 0);
            totalProductTargetAmount += Number(t.totalProductAmount || 0);

            let pTargets = t.productTargets || [];
            if (typeof pTargets === 'string') {
                try { pTargets = JSON.parse(pTargets); } catch (e) { pTargets = []; }
            }
            if (Array.isArray(pTargets)) {
                pTargets.forEach(pt => {
                    const pName = prodNameMap[pt.productId || pt.productName || pt.product] || pt.productName || pt.product || 'Product';
                    const tQty = Number(pt.targetQty || pt.qty || pt.units || 0);
                    const tAmt = Number(pt.targetAmount || pt.amount || (tQty * (prodPriceMap[pName] || 0)) || 0);
                    if (!prodTargetMap[pName]) {
                        prodTargetMap[pName] = { productName: pName, targetQty: 0, targetAmount: 0 };
                    }
                    prodTargetMap[pName].targetQty += tQty;
                    prodTargetMap[pName].targetAmount += tAmt;
                });
            }
        });

        const allProdKeys = new Set([...Object.keys(prodTargetMap), ...Object.keys(prodAchievedMap)]);
        const productBreakdown = Array.from(allProdKeys).map(pName => {
            const t = prodTargetMap[pName] || { targetQty: 0, targetAmount: 0 };
            const a = prodAchievedMap[pName] || { primaryQty: 0, primaryAmt: 0, secondaryQty: 0, secondaryAmt: 0, pobQty: 0, pobAmt: 0 };
            const achievedQty = a.primaryQty || a.secondaryQty || a.pobQty;
            const achievedAmt = a.primaryAmt || a.secondaryAmt || a.pobAmt;
            const pct = t.targetAmount > 0 ? Number(((achievedAmt / t.targetAmount) * 100).toFixed(1)) : (t.targetQty > 0 ? Number(((achievedQty / t.targetQty) * 100).toFixed(1)) : 0);
            return {
                productName: pName,
                targetQty: t.targetQty,
                targetAmount: t.targetAmount,
                primaryQty: a.primaryQty,
                primaryAmount: a.primaryAmt,
                achievedPrimaryQty: a.primaryQty,
                achievedPrimaryVal: a.primaryAmt,
                secondaryQty: a.secondaryQty,
                secondaryAmount: a.secondaryAmt,
                achievedSecondaryQty: a.secondaryQty,
                achievedSecondaryVal: a.secondaryAmt,
                pobQty: a.pobQty,
                pobAmount: a.pobAmt,
                achievedQty,
                achievedAmount: achievedAmt,
                achievementPct: pct
            };
        });

        const effectiveTotalTarget = totalLumpSumTarget + totalProductTargetAmount;
        const effectiveAchieved = primaryAchieved || secondaryAchieved || pobAchieved;
        const overallPct = effectiveTotalTarget > 0 ? Number(((effectiveAchieved / effectiveTotalTarget) * 100).toFixed(1)) : 0;
        const primaryAchievementPct = effectiveTotalTarget > 0 ? Number(((primaryAchieved / effectiveTotalTarget) * 100).toFixed(1)) : 0;
        const secondaryAchievementPct = effectiveTotalTarget > 0 ? Number(((secondaryAchieved / effectiveTotalTarget) * 100).toFixed(1)) : 0;

        res.json({
            success: true,
            user: {
                name: ctx.name,
                employeeId: ctx.user?.employeeId || employeeId,
                designation: ctx.user?.designation || 'MR',
                hq: ctx.user?.hq || '-'
            },
            summary: {
                year: targetYear,
                month: monthShort || 'All Months',
                lumpSumTarget: totalLumpSumTarget,
                productTargetAmount: totalProductTargetAmount,
                productTargetTotal: totalProductTargetAmount,
                totalTarget: effectiveTotalTarget,
                primaryAchieved,
                primarySalesAchieved: primaryAchieved,
                primaryAchievementPct,
                secondaryAchieved,
                secondarySalesAchieved: secondaryAchieved,
                secondaryAchievementPct,
                pobAchieved,
                overallAchievementPct: overallPct
            },
            productTargets: productBreakdown,
            allocations: filteredTargets
        });
    } catch (e) {
        console.error('Targets report error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;


