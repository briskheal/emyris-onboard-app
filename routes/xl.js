const express = require('express');
const router = express.Router();
const { XlUser, XlDoctor, XlChemist, XlStockist, XlCity, XlRoute, XlTourProgram, XlDCR, XlAttendance, XlLeave, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification, XlSample, XlGift, XlPrimarySales, XlSecondarySales, XlGeoFencing, XlGlobalSettings, XlHoliday, XlProduct, generateId } = require('../db');
const { Op } = require('sequelize');

// Middleware to block locked users from any mobile API route instantly
router.use(async (req, res, next) => {
    const empId = req.body.employeeId || req.query.employeeId || req.body.email || req.query.email;
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
                if (controls && controls.locked) {
                    return res.json({ 
                        success: false, 
                        isLocked: true, // Special flag for mobile app if it wants to log out
                        message: controls.lockedReason || 'Your account is locked by Admin.' 
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

// N-Level Recursive Hierarchy Lookup for HQs
async function getSubordinateHQs(designation, hq, hqSet = new Set()) {
    if (!designation || designation === 'ADMIN') return Array.from(hqSet);
    
    let whereClause;
    if (hq) {
        const position = designation + ' (' + hq.trim().toUpperCase() + ')';
        const { Op } = require('sequelize');
        whereClause = {
            [Op.or]: [
                { reportingManager: position },
                { reportingManager: designation }
            ]
        };
    } else {
        whereClause = { reportingManager: designation };
    }

    const reportees = await XlUser.findAll({ where: whereClause });
    if (!reportees || reportees.length === 0) return Array.from(hqSet);
    
    for (const r of reportees) {
        if (r.hq) hqSet.add(r.hq.trim().toLowerCase());
        await getSubordinateHQs(r.designation, r.hq, hqSet);
    }
    return Array.from(hqSet);
}



// Get routes for user and their team
router.get('/routes', async (req, res) => {
    try {
        const { designation, hq } = req.query;
        let hqList = [];
        if (hq) {
            const trimmed = hq.trim().toLowerCase();
            hqList.push(trimmed);
            hqList.push(trimmed.replace(/\s+/g, '-'));
            hqList.push(trimmed.replace(/-/g, ' '));
        }
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq);
            hqList = [...new Set([...hqList, ...subHQs])];
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

// --- DOCTOR CONTROL ROUTES ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ success: false, message: 'Email and password required' });
        
        const user = await XlUser.findOne({ where: { email, password } });
        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        if (user.status === 'Deactivated') {
            return res.json({ success: false, message: 'Your account is deactivated. Contact admin.' });
        }
        
        // Remove password before sending to frontend
        const userData = user.toJSON();
        delete userData.password;

        res.json({ success: true, message: 'Login successful', user: userData });
    } catch (e) {
        console.error('XL Login Error:', e);
        res.status(500).json({ success: false, message: 'System error during login' });
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
        } else {
            return res.status(400).json({ error: 'Chemist already has a location tagged.' });
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
        const chemist = await XlChemist.create(req.body);
        res.json({ success: true, message: 'Chemist created successfully!', data: chemist });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create chemist' });
    }
});

router.post('/stockist', async (req, res) => {
    try {
        const stockist = await XlStockist.create(req.body);
        res.json({ success: true, message: 'Stockist created successfully!', data: stockist });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create stockist' });
    }
});

router.post('/city', async (req, res) => {
    try {
        const city = await XlCity.create(req.body);
        res.json({ success: true, message: 'City created successfully!', data: city });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create city' });
    }
});

router.post('/route', async (req, res) => {
    try {
        const route = await XlRoute.create(req.body);
        res.json({ success: true, message: 'Route created successfully!', data: route });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create route' });
    }
});

// Fetch all doctors for a user (for DCR entity selection)

// Reports Route for Doctors List
router.get('/reports/doctors', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } });
            if (user && user.hq) {
                where.headquarter = user.hq;
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
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) {
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
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) {
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
router.get('/reports/products', async (req, res) => {
    try {
        const records = await XlProduct.findAll({ order: [['productName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products for reports' });
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
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) {
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

router.get('/doctors', async (req, res) => {
    try {
        const { designation, hq } = req.query;
        let hqList = [];
        if (hq) hqList.push(hq.trim().toLowerCase());
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq);
            hqList = [...new Set([...hqList, ...subHQs])];
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

        const doctors = await XlDoctor.findAll({ where, attributes: ['_id', 'name', 'degree', 'specialization', 'hospital', 'headquarter', 'workingArea', 'category', 'userAllotted'], order: [['name', 'ASC']] });
        res.json({ success: true, data: doctors });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// Fetch all chemists
router.get('/chemists', async (req, res) => {
    try {
        const { designation, hq } = req.query;
        let hqList = [];
        if (hq) hqList.push(hq.trim().toLowerCase());
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq);
            hqList = [...new Set([...hqList, ...subHQs])];
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
        const { designation, hq } = req.query;
        let hqList = [];
        if (hq) hqList.push(hq.trim().toLowerCase());
        
        if (designation && designation !== 'ADMIN') {
            const subHQs = await getSubordinateHQs(designation, req.query.hq || hq);
            hqList = [...new Set([...hqList, ...subHQs])];
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
        res.status(500).json({ error: 'Failed to fetch stockists' });
    }
});

// ─── PHASE 2: TOUR PROGRAM ──────────────────────────────────────────────────

// Save/Update draft TP for the month
router.post('/tour-program', async (req, res) => {
    try {
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
        let tp = await XlTourProgram.findOne({ where: { employeeId, month, year } });
        if (tp) {
            if ((tp.status === 'Submitted' || tp.status === 'Approved') && resubmitRemark) {
                const u = await XlUser.findOne({ where: { employeeId } });
                if (u && u.reportingManager) {
                    try {
                        await XlNotification.create({
                            employeeId: u.reportingManager,
                            title: 'Tour Program Resubmitted',
                            message: `${employeeName} modified their ${month} ${year} Tour Program. Remark: ${resubmitRemark}`
                        });
                    } catch(e) {}
                }
            }
            await XlTourProgram.update({ entries: JSON.stringify(entries), employeeName, hq }, { where: { _id: tp._id } });
            tp = await XlTourProgram.findOne({ where: { _id: tp._id } });
        } else {
            tp = await XlTourProgram.create({
                _id: generateId(),
                employeeId, employeeName, hq, month, year,
                entries: JSON.stringify(entries || []),
                status: 'Draft'
            });
        }
        res.json({ success: true, message: 'Tour Program saved!', data: tp });
    } catch (e) {
        console.error('TP save error:', e);
          require('fs').appendFileSync('tp_error.log', e.stack + '\n');
        res.status(500).json({ error: 'Failed to save Tour Program' });
    }
});

// Submit TP for approval
router.put('/tour-program/:id/submit', async (req, res) => {
    try {
        
        const tp = await XlTourProgram.findOne({ where: { _id: req.params.id } });
        if (!tp) return res.status(404).json({ error: 'Not found' });

        await XlTourProgram.update({ status: 'Submitted', submittedAt: new Date() }, { where: { _id: req.params.id } });

        // Notify reporting manager
        const user = await XlUser.findOne({ where: { employeeId: tp.employeeId } });
        if (user && user.reportingManager) {
            // Find managers who hold this designation
            const managers = await XlUser.findAll({ where: { designation: user.reportingManager } });
            for (const m of managers) {
                await XlNotification.create({
                    _id: generateId(),
                    employeeId: m.employeeId,
                    title: 'Tour Program Submitted',
                    message: `${tp.employeeName} has submitted their Tour Program for ${tp.month} ${tp.year} for approval.`
                });
            }
        }
        
        // Also notify global admin
        await XlNotification.create({
            _id: generateId(),
            employeeId: 'ADMIN',
            title: 'Tour Program Submitted',
            message: `${tp.employeeName} has submitted their Tour Program for ${tp.month} ${tp.year} for approval.`
        });
        
        // Notify the submitter
        await XlNotification.create({
            _id: generateId(),
            employeeId: tp.employeeId,
            title: 'Tour Program Submitted',
            message: `You have successfully submitted your Tour Program for ${tp.month} ${tp.year} for approval.`
        });

        res.json({ success: true, message: 'Tour Program submitted for approval!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to submit Tour Program' });
    }
});

// Get my TP for a specific month/year
router.get('/tour-program/my', async (req, res) => {
    try {
        let { email, month, year } = req.query;
        if (!email || !month || !year) return res.status(400).json({ error: 'Missing params' });
        month = month.toLowerCase();
        const tp = await XlTourProgram.findOne({ where: { employeeId: email, month, year } });
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
        const month = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const year = String(dateObj.getFullYear());
        const tp = await XlTourProgram.findOne({ where: { employeeId, month, year, status: 'Approved' } });
        if (!tp) {
            return res.status(403).json({ error: 'No approved Tour Program found for this date. Please submit and get your TP approved first.' });
        }

        // Check entries contain this date
        const entries = JSON.parse(tp.entries || '[]');
        const entry = entries.find((e) => e.date === date);
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
        if (entityType === 'Doctor' || entityType === 'Chemist' || entityType === 'Stockist') {
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

        const dcr = await XlDCR.create({
            _id: generateId(),
            ...req.body,
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

// ─── PHASE 3: ATTENDANCE ─────────────────────────────────────────────────────

// Punch In
router.post('/attendance/punch-in', async (req, res) => {
    try {
        const { employeeId, date, punchInTime, punchInLat, punchInLng } = req.body;
        const existing = await XlAttendance.findOne({ where: { employeeId, date } });
        if (existing) return res.status(400).json({ error: 'Already punched in for today.' });
        
        const att = await XlAttendance.create({
            _id: generateId(),
            employeeId, date, punchInTime, punchInLat, punchInLng
        });
        res.json({ success: true, message: 'Punched In!', data: att });
    } catch (e) {
        res.status(500).json({ error: 'Failed to punch in' });
    }
});

// Punch Out
router.post('/attendance/punch-out', async (req, res) => {
    try {
        const { employeeId, date, punchOutTime, punchOutLat, punchOutLng } = req.body;
        const att = await XlAttendance.findOne({ where: { employeeId, date } });
        if (!att) return res.status(400).json({ error: 'No punch-in record found for today.' });
        if (att.punchOutTime) return res.status(400).json({ error: 'Already punched out.' });

        await XlAttendance.update(
            { punchOutTime, punchOutLat, punchOutLng }, 
            { where: { _id: att._id } }
        );
        res.json({ success: true, message: 'Punched Out!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to punch out' });
    }
});


// Submit Day Final Report
router.post('/attendance/submit-day', async (req, res) => {
    try {
        const { employeeId, date, dayRemarks } = req.body;
        const att = await XlAttendance.findOne({ where: { employeeId, date } });
        if (!att) return res.status(400).json({ error: 'No punch-in record found for today.' });
        if (att.daySubmitted) return res.status(400).json({ error: 'Day already submitted.' });

        await XlAttendance.update(
            { dayRemarks, daySubmitted: true }, 
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
        const att = await XlAttendance.findOne({ where: { employeeId: email, date } });
        res.json({ success: true, data: att });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// ─── PHASE 3: LEAVE REQUEST ────────────────────────────────────────────────

router.post('/leave', async (req, res) => {
    try {
        const leave = await XlLeave.create({ _id: generateId(), ...req.body });
        res.json({ success: true, message: 'Leave request submitted!', data: leave });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit leave request' });
    }
});

router.get('/leave/my', async (req, res) => {
    try {
        const leaves = await XlLeave.findAll({ where: { employeeId: req.query.email }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: leaves });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

// ─── PHASE 3: EXPENSE ──────────────────────────────────────────────────────

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
        const exps = await XlExpense.findAll({ where: { employeeId: req.query.email }, order: [['date', 'DESC']] });
        res.json({ success: true, data: exps });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// ─── PHASE 3: BACKLOG REQUEST ──────────────────────────────────────────────

router.post('/backlog', async (req, res) => {
    try {
        const { employeeId, dates, reason } = req.body;
        
        // Backward compatibility for old UI
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
        const reqs = await XlBacklogRequest.findAll({ where: { employeeId: req.query.email }, order: [['date', 'DESC']] });
        res.json({ success: true, data: reqs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch backlog requests' });
    }
});

router.get('/backlog/overview', async (req, res) => {
    try {
        const { email, year, month } = req.query; // month is 1-12
        if (!email || !year || !month) return res.status(400).json({ error: 'Missing parameters' });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        const today = new Date();
        const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        
        const limitDate = endDate < yesterday ? endDate : yesterday; // Up to yesterday or end of month

        // Fetch Holidays
        const holidaysData = await XlHoliday.findAll();
        const holidayDates = new Set(holidaysData.map(h => h.date));

        // Fetch Attendances for the month
        const attendances = await XlAttendance.findAll({ 
            where: { employeeId: email, date: { [require('sequelize').Op.startsWith]: `${year}-${month.padStart(2, '0')}` } }
        });
        const submittedDates = new Set(attendances.filter(a => a.daySubmitted).map(a => a.date));

        // Fetch existing requests for the month
        const requests = await XlBacklogRequest.findAll({ 
            where: { employeeId: email, date: { [require('sequelize').Op.startsWith]: `${year}-${month.padStart(2, '0')}` } }
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

module.exports = router;
