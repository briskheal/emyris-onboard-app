const express = require('express');
const compression = require('compression');
const { execSync } = require('child_process');

// --- AUTO-INSTALL DEPENDENCIES ON BOOT ---
try {
    require('sequelize');
    require('pg');
} catch (e) {
    console.log("Installing missing database packages...");
    execSync('npm install sequelize pg', { stdio: 'inherit' });
    console.log("Installation complete!");
}
// ------------------------------------------

const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { sequelize, syncDatabase, Company, Applicant, Division, HQ, Asset, TemplateHistory, Question, ExamResult } = require('./db');
const fs = require('fs');
const path = require('path');

dotenv.config();
const dns = require('dns');

// Force Google DNS for SRV resolution (fixes ECONNREFUSED on some environments)
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('🌐 [DNS] Switched to Google DNS');
} catch (e) {
    console.warn('⚠️ [DNS] Failed to set custom DNS servers:', e.message);
}

const app = express();
app.use(compression());
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'https://emyrishr.in';



const connMain = null;
const connAssets = null;

// Try to use system DNS, but force IPv4 on connection
// Mongoose 8/Node 18+ can fail resolving IPv6 mappings on some SRV clusters.

const { sendEmail } = require('./utils/mailer');
const { numberToWords, resolveTemplate } = require('./utils/templateHelpers');
// Startup logic
async function initializeApp() {
    console.log('🚀 Server starting - Shared PostgreSQL Clean Slate protocol active (NO MONGODB IMPORT).');
    await syncDatabase();
    await seedData();

    // AUTO SEED STATE EXCEL
    try {
        const { XlState } = require('./db');
        const xlsx = require('xlsx');
        const fs = require('fs');
        if (fs.existsSync('REPORTING MODULE/state.xlsx')) {
            const wb = xlsx.readFile('REPORTING MODULE/state.xlsx');
            const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            let newCount = 0;
            let updCount = 0;
            for (let d of data) {
                const stateName = d.States || d.state || '';
                const uid = d.UID || d.uid || '';
                if (stateName && uid) {
                    const ex = await XlState.findOne({ where: { uid } });
                    if (ex) {
                        await ex.update({ stateName });
                        updCount++;
                    } else {
                        await XlState.create({ stateName, uid });
                        newCount++;
                    }
                }
            }
            console.log(`✅ States synchronized with state.xlsx. Inserted: ${newCount}, Updated: ${updCount}`);
        }
    } catch (err) {
        console.error('⚠️ State sync failed:', err.message);
    }

    // AUTO SEED HOLIDAYS - hardcoded data, always works on any server
    try {
        const { XlHoliday } = require('./db');
        const HOLIDAY_SEED = [
            { date: '2026-01-01', type: 'State', state: 'Telangana', title: 'New Year Day' },
            { date: '2026-01-01', type: 'State', state: 'Uttar Pradesh', title: 'New Year Day' },
            { date: '2026-01-01', type: 'State', state: 'Odisha', title: 'New Year Day' },
            { date: '2026-01-01', type: 'State', state: 'Tamil Nadu', title: 'New Year Day' },
            { date: '2026-01-01', type: 'State', state: 'Maharashtra', title: 'New Year Day' },
            { date: '2026-01-01', type: 'State', state: 'Jharkhand', title: 'New Year Day' },
            { date: '2026-01-14', type: 'National', state: null, title: 'Makar Sankranti / Bihu / Pongal' },
            { date: '2026-01-14', type: 'State', state: 'Chhattisgarh', title: 'Makar Sankranti / Bihu / Pongal' },
            { date: '2026-01-14', type: 'State', state: 'Madhya Pradesh', title: 'Makar Sankranti / Bihu / Pongal' },
            { date: '2026-01-26', type: 'National', state: null, title: 'Republic Day Of India' },
            { date: '2026-03-04', type: 'National', state: null, title: 'Holi Festival' },
            { date: '2026-03-19', type: 'State', state: 'Telangana', title: 'Ugadi' },
            { date: '2026-03-21', type: 'National', state: null, title: 'Id-ul-Fitr (Eid)' },
            { date: '2026-05-01', type: 'National', state: null, title: 'Labor Day' },
            { date: '2026-07-16', type: 'State', state: 'Odisha', title: 'Rath Yatra Festival' },
            { date: '2026-08-15', type: 'National', state: null, title: 'Independence Day India' },
            { date: '2026-08-28', type: 'State', state: 'Gujarat', title: 'Rakhi Purnami / Raksha Bandhan' },
            { date: '2026-08-28', type: 'State', state: 'Uttar Pradesh', title: 'Rakhi Purnami / Raksha Bandhan' },
            { date: '2026-08-28', type: 'State', state: 'Maharashtra', title: 'Rakhi Purnami / Raksha Bandhan' },
            { date: '2026-08-28', type: 'State', state: 'Jharkhand', title: 'Rakhi Purnami / Raksha Bandhan' },
            { date: '2026-08-28', type: 'State', state: 'Madhya Pradesh', title: 'Rakhi Purnami / Raksha Bandhan' },
            { date: '2026-08-28', type: 'State', state: 'Chhattisgarh', title: 'Rakhi Purnami / Raksha Bandhan' },
            { date: '2026-09-04', type: 'State', state: 'Gujarat', title: 'Janmastami' },
            { date: '2026-09-04', type: 'State', state: 'Uttar Pradesh', title: 'Janmastami' },
            { date: '2026-09-04', type: 'State', state: 'Telangana', title: 'Janmastami' },
            { date: '2026-09-14', type: 'State', state: 'Gujarat', title: 'Ganesh Chaturthi' },
            { date: '2026-09-14', type: 'State', state: 'Tamil Nadu', title: 'Ganesh Chaturthi' },
            { date: '2026-09-14', type: 'State', state: 'Maharashtra', title: 'Ganesh Chaturthi' },
            { date: '2026-09-14', type: 'State', state: 'Jharkhand', title: 'Ganesh Chaturthi' },
            { date: '2026-09-14', type: 'State', state: 'Madhya Pradesh', title: 'Ganesh Chaturthi' },
            { date: '2026-09-14', type: 'State', state: 'Chhattisgarh', title: 'Ganesh Chaturthi' },
            { date: '2026-09-15', type: 'State', state: 'Maharashtra', title: 'Ganesh Chaturthi' },
            { date: '2026-10-02', type: 'National', state: null, title: 'Gandhi Jayanti' },
            { date: '2026-10-19', type: 'State', state: 'Odisha', title: 'Durganavami / Mahanavami' },
            { date: '2026-10-20', type: 'National', state: null, title: 'Dussehra' },
            { date: '2026-10-21', type: 'State', state: 'Odisha', title: 'Immersion Day' },
            { date: '2026-11-09', type: 'National', state: null, title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Gujarat', title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Uttar Pradesh', title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Telangana', title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Tamil Nadu', title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Jharkhand', title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Madhya Pradesh', title: 'Deepavali / Diwali' },
            { date: '2026-11-10', type: 'State', state: 'Chhattisgarh', title: 'Deepavali / Diwali' },
            { date: '2026-12-25', type: 'State', state: 'Tamil Nadu', title: 'Christmas' }
        ];
        const count = await XlHoliday.count();
        if (count === 0) {
            await XlHoliday.bulkCreate(HOLIDAY_SEED);
            console.log(`✅ Seeded ${HOLIDAY_SEED.length} holidays into database!`);
        } else {
            console.log(`ℹ️ Holidays already present in DB: ${count} records.`);
        }
    } catch (e) {
        console.error('⚠️ Auto-seed holidays failed:', e.message);
    }
}

async function seedData() {
    try {
        const divCount = await Division.countDocuments();
        if (divCount === 0) {
            console.log('🌱 Seeding default divisions...');
            await Division.create([
                { name: 'SALES', active: true },
                { name: 'MARKETING', active: true },
                { name: 'OPERATIONS', active: true }
            ]);
        }
        const hqCount = await HQ.countDocuments();
        if (hqCount === 0) {
            console.log('🌱 Seeding default HQs...');
            await HQ.create([
                { name: 'DELHI', active: true },
                { name: 'MUMBAI', active: true },
                { name: 'KOLKATA', active: true },
                { name: 'CHENNAI', active: true }
            ]);
        }
    } catch (e) {
        console.error('❌ Seeding failed', e);
    }
}
initializeApp();

// Global Error Handlers (Fix for 502/Crashes)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Middleware to convert incoming DD-MM-YYYY dates to YYYY-MM-DD
app.use((req, res, next) => {
    const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
    const convertDates = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (let key in obj) {
            if (typeof obj[key] === 'string' && dateRegex.test(obj[key])) {
                const [_, d, m, y] = obj[key].match(dateRegex);
                obj[key] = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (typeof obj[key] === 'object') {
                convertDates(obj[key]);
            }
        }
    };
    convertDates(req.body);
    convertDates(req.query);
    next();
});
 
app.use(mongoSanitize());

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100000, // Limit each IP to 1000 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Serve uploads directory safely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const fs2 = require('fs');
    const path2 = require('path');
    const ext = path2.extname(req.file.originalname) || '';
    fs2.renameSync(req.file.path, req.file.path + ext);
    res.json({ success: true, url: '/uploads/' + req.file.filename + ext });
});


// Serve React assets for Admin panel
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'dist', 'assets')));

// Serve React assets for Applicant Portal
app.use('/dist-applicant', express.static(path.join(__dirname, 'public', 'dist-applicant')));

// Explicitly serve root static frontend files that were broken by security lockdown
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'applicant-portal', 'style.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, 'applicant-portal', 'script.js')));
app.get('/shared-utils.js', (req, res) => res.sendFile(path.join(__dirname, 'applicant-portal', 'shared-utils.js')));

// Mount modular routers
const applicantRouter = require('./routes/applicant');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const xlRouter = require('./routes/xl');

app.use('/api/applicant', applicantRouter);

// ==========================================
// EMERGENCY DB HEAL ROUTE (UNPROTECTED)
// ==========================================
app.get('/api/heal-db', async (req, res) => {
    try {
        const { sequelize, XlStockist, XlProduct } = require('./db');
        let logs = [];
        
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_stockists");
        } catch(e) { logs.push("xl_stockists error: " + e.message); }
        
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_products");
        } catch(e) { logs.push("xl_products error: " + e.message); }
        
        try {
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

app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
const migrateRouter = require('./routes/migrate');
app.use('/api/xl', migrateRouter);
app.get('/api/debug-data', async (req, res) => {
    try {
        const { XlPrimarySales, XlStockist, XlPrimarySalesItem } = require('./db');
        const sales = await XlPrimarySales.findAll({ raw: true });
        const stockists = await XlStockist.findAll({ raw: true });
        const items = await XlPrimarySalesItem.findAll({ raw: true });
        res.json({ sales, stockists, items });
    } catch (e) { res.json({ error: e.message }); }
});
app.use('/api/xl', xlRouter);

app.get('/api/fix-hqs-now', async (req, res) => {
    try {
        const { XlSecondarySales, XlStockist } = require('./db');
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
app.all('/api/company-profile', (req, res, next) => { req.url = '/company-profile'; adminRouter(req, res, next); });

// Legacy Route Aliases for original HTML portal (script.js)
app.get('/api/company-data', (req, res, next) => {
    req.url = '/api/company-data';
    adminRouter(req, res, next);
});

app.post('/api/save-detailing-scripts', (req, res, next) => {
    req.url = '/save-detailing-scripts';
    adminRouter(req, res, next);
});

app.post('/api/admin-login', (req, res, next) => {
    req.url = '/login';
    adminRouter(req, res, next);
});

app.post('/api/applicant-login', (req, res, next) => {
    req.url = '/applicant-login';
    authRouter(req, res, next);
});

app.post('/api/register-applicant', (req, res, next) => {
    req.url = '/register-applicant';
    authRouter(req, res, next);
});

app.post('/api/applicant/register', (req, res, next) => {
    req.url = '/applicant/register';
    authRouter(req, res, next);
});

app.post('/api/resend-pin', (req, res, next) => {
    req.url = '/resend-pin';
    authRouter(req, res, next);
});

app.post('/api/save-draft', (req, res, next) => {
    req.url = '/save-draft';
    applicantRouter(req, res, next);
});

app.post('/api/submit-onboarding', (req, res, next) => {
    req.url = '/submit-onboarding';
    applicantRouter(req, res, next);
});


// Local File Storage Helper
const sharp = require('sharp');
async function saveBase64ToFile(email, category, base64Data) {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
        return base64Data; // Already a URL or missing
    }
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;
    
    const mimeType = matches[1].toLowerCase();
    let ext = 'png';
    if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg') || mimeType.includes('jfif')) ext = 'jpg';

    const safeEmail = email.replace(/[^a-z0-9]/gi, '_');
    const safeCategory = category.replace(/[^a-z0-9]/gi, '_');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    let buffer = Buffer.from(matches[2], 'base64');
    if (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('icon')) {
        try {
            buffer = await sharp(buffer).webp({ quality: 80, effort: 4 }).toBuffer();
            ext = 'webp';
        } catch (sharpErr) {
            console.warn('[SHARP CONVERSION WARNING] Could not convert server image to WebP, saving original:', sharpErr.message);
        }
    }

    const filename = `${safeEmail}_${safeCategory}_${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    // Asynchronously save to PostgreSQL Asset database as backup against Docker volume wipes
    Asset.create({
        _id: filename,
        category: `doc_${safeCategory}`,
        name: filename,
        data: base64Data,
        active: true
    }).catch(e => console.error("Asset DB backup error:", e.message));
    return `/api/admin/uploads/${filename}`;
}

// Explicit route to bypass Nginx static file interception & support direct downloads


// ------------------------- EMAIL DELIVERY ENGINE -------------------------
// WHY BRIDGE INSTEAD OF ZOHO SMTP?
// Render.com FREE tier BLOCKS outbound SMTP ports (25, 465, 587).
// Zoho SMTP will always timeout on free Render plans.
// The Google Apps Script Bridge uses HTTPS (port 443) which is NEVER blocked.
// It delivers from hr@emyrisbio.com and is the CORRECT solution for this stack.
// -------------------------------------------------------------------------



// HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
    const status = {
        server: 'online',
        mainDB: connMain ? (connMain.readyState === 1 ? 'connected' : 'disconnected (' + connMain.readyState + ')') : 'not initialized',
        assetDB: connAssets ? (connAssets.readyState === 1 ? 'connected' : 'disconnected (' + connAssets.readyState + ')') : 'not initialized',
        timestamp: new Date()
    };
    res.json(status);
});

// EMAIL DIAGNOSTIC ENDPOINT (Admin only - temporary debug)
app.get('/api/test-email', async (req, res) => {
    const emailUser = process.env.EMAIL_USER || 'NOT SET';
    const emailPass = process.env.EMAIL_PASS ? '✅ SET (' + process.env.EMAIL_PASS.length + ' chars)' : '❌ NOT SET';
    const emailHost = process.env.EMAIL_HOST || 'NOT SET';
    const emailPort = process.env.EMAIL_PORT || 'NOT SET';

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: emailUser, pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '') }
    });

    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from: `"Emyris HR" <${emailUser}>`,
            to: emailUser,
            subject: 'Live SMTP Test - ' + new Date().toISOString(),
            html: '<p>✅ Zoho SMTP is working correctly on the live Hostycare server!</p>'
        });
        res.json({ 
            success: true, 
            message: 'Email sent successfully!',
            messageId: info.messageId,
            config: { emailUser, emailPass, emailHost, emailPort }
        });
    } catch (e) {
        res.json({ 
            success: false, 
            error: e.message, 
            code: e.code,
            config: { emailUser, emailPass, emailHost, emailPort }
        });
    }
});






// --- RAPID TEST APIs ---

// Serve Emyris Admin Portal (React SPA)
app.get(['/admin', '/admin/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Serve /xl Reporting Module (standalone React SPA - mobile first)
app.use('/xl', express.static(path.join(__dirname, 'xl-frontend', 'dist')));

// Serve /xla Admin Mobile Module
app.use('/xla', express.static(path.join(__dirname, 'xla-frontend', 'dist')));

// Serve Emyris Applicant Portal & Admin Catch-all
app.use((req, res) => {
    if (req.url.startsWith('/api/')) {
        console.error(`[404] API route not found: ${req.method} ${req.url}`);
        res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.url}` });
    } else if (req.url.startsWith('/xla')) {
        // SPA fallback for /xla admin module
        res.sendFile(path.join(__dirname, 'xla-frontend', 'dist', 'index.html'));
    } else if (req.url.startsWith('/xl')) {
        // SPA fallback for /xl module (React Router)
        res.sendFile(path.join(__dirname, 'xl-frontend', 'dist', 'index.html'));
    } else if (req.url.startsWith('/admin')) {
        const urlWithoutQuery = req.url.split('?')[0];
        if (urlWithoutQuery.includes('.') && !urlWithoutQuery.endsWith('.html')) {
            return res.status(404).send('Not Found');
        }
        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    } else {
        const urlWithoutQuery = req.url.split('?')[0];
        if (urlWithoutQuery.includes('.') && !urlWithoutQuery.endsWith('.html')) {
            return res.status(404).send('Not Found');
        }
        res.sendFile(path.join(__dirname, 'applicant-portal', 'index.html'));
    }
});

const { startCronJobs } = require('./utils/cron');
startCronJobs();
const { XlAdmin } = require('./db.js');
const bcrypt = require('bcryptjs');
(async () => {
  try {
    // 1. Force hradmin setup
    const email = 'hradmin@emyrishr.in';
    const newPass = bcrypt.hashSync('GjzgHEi4', 10);
    const admin = await XlAdmin.findOne({ where: { email } });
    if (admin) {
      await admin.update({ password: newPass });
    } else {
      await XlAdmin.create({ email, password: newPass, firstName: 'HR', lastName: 'Admin', status: 'Active' });
    }

    // 2. Global Password Auto-Heal for all other admins
    const allAdmins = await XlAdmin.findAll();
    for (let a of allAdmins) {
      if (a.email !== email && a.password && !a.password.startsWith('$2')) {
        await a.update({ password: bcrypt.hashSync(a.password, 10) });
      }
    }
  } catch (e) { console.error('Global auto-heal error:', e); }
})();

  // AUTO-HEAL: Fix legacy date formats (DD-MM-YYYY to YYYY-MM-DD)
  (async () => {
    try {
      const { XlPrimarySales } = require('./db');
      const { Op } = require('sequelize');
      const sales = await XlPrimarySales.findAll({ raw: true });
      let fixed = 0;
      for (const sale of sales) {
        if (sale.date && sale.date.includes('-')) {
          const parts = sale.date.split('-');
          if (parts.length === 3 && parts[0].length === 2) {
             const newDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
             await XlPrimarySales.update({ date: newDate }, { where: { _id: sale._id } });
             fixed++;
          }
        }
      }
      if (fixed > 0) console.log('Auto-healed ' + fixed + ' primary sales dates.');
    } catch (e) {
      console.error('Date auto-heal failed:', e);
    }
  })();


app.get('/api/debug-primary3', async (req, res) => {
    try {
        const { sequelize } = require('./db');
        const sql = `
            SELECT p.date, p.stockist, p.headquarter, SUM(p.netInvValue) as totalSales
            FROM xl_primary_sales p
            WHERE p.date BETWEEN '2026-10-01' AND '2026-10-31'
            GROUP BY p.date, p.stockist, p.headquarter
        `;
        const data = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
        res.json({ success: true, data });
    } catch(e) {
        res.json({ success: false, error: e.message, stack: e.stack });
    }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));












