const express = require('express');
const router = express.Router();
const { XlUser, XlDoctor, XlChemist, XlStockist, XlCity, XlRoute, XlTourProgram, XlDCR, XlAttendance, XlLeave, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification, XlSample, XlGift, XlPrimarySales, XlSecondarySales, XlGeoFencing, generateId } = require('../db');
const { Op } = require('sequelize');

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

const DEFAULT_RADIUS_METRES = 200; // Admin can override in xladmin later

// --- AUTHENTICATION ---
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
        const doctor = await XlDoctor.findOne({ where: { _id: req.params.id } });
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        
        await XlDoctor.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true, message: 'Doctor location tagged successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update doctor location' });
    }
});

router.put('/chemist/:id/geo', async (req, res) => {
    try {
        const chemist = await XlChemist.findOne({ where: { _id: req.params.id } });
        if (!chemist) return res.status(404).json({ error: 'Chemist not found' });
        
        await XlChemist.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true, message: 'Chemist location tagged successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update chemist location' });
    }
});

router.put('/stockist/:id/geo', async (req, res) => {
    try {
        const stockist = await XlStockist.findOne({ where: { _id: req.params.id } });
        if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
        
        await XlStockist.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true, message: 'Stockist location tagged successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update stockist location' });
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
router.get('/doctors', async (req, res) => {
    try {
        const where = {}; if (req.query.hq) { const { sequelize } = require('../db'); where.headquarter = sequelize.where(sequelize.fn('lower', sequelize.col('headquarter')), req.query.hq.toLowerCase()); } const doctors = await XlDoctor.findAll({ where, attributes: ['_id', 'name', 'degree', 'specialization', 'hospital', 'headquarter', 'workingArea', 'category'], order: [['name', 'ASC']] });
        res.json({ success: true, data: doctors });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// Fetch all chemists
router.get('/chemists', async (req, res) => {
    try {
        const chemists = await XlChemist.findAll({ attributes: ['_id', 'businessName', 'proprietorName', 'hq', 'workingArea'], order: [['businessName', 'ASC']] });
        res.json({ success: true, data: chemists });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch chemists' });
    }
});

// ─── PHASE 2: TOUR PROGRAM ──────────────────────────────────────────────────

// Save/Update draft TP for the month
router.post('/tour-program', async (req, res) => {
    try {
        const { employeeEmail, employeeName, hq, month, year, entries } = req.body;
        if (!employeeEmail || !month || !year) return res.status(400).json({ error: 'Missing required fields' });

        // Upsert: one TP per employee per month/year
        let tp = await XlTourProgram.findOne({ where: { employeeEmail, month, year } });
        if (tp) {
            await XlTourProgram.update({ entries: JSON.stringify(entries), employeeName, hq }, { where: { _id: tp._id } });
            tp = await XlTourProgram.findOne({ where: { _id: tp._id } });
        } else {
            tp = await XlTourProgram.create({
                _id: generateId(),
                employeeEmail, employeeName, hq, month, year,
                entries: JSON.stringify(entries || []),
                status: 'Draft'
            });
        }
        res.json({ success: true, message: 'Tour Program saved!', data: tp });
    } catch (e) {
        console.error('TP save error:', e);
        res.status(500).json({ error: 'Failed to save Tour Program' });
    }
});

// Submit TP for approval
router.put('/tour-program/:id/submit', async (req, res) => {
    try {
        await XlTourProgram.update({ status: 'Submitted', submittedAt: new Date() }, { where: { _id: req.params.id } });
        res.json({ success: true, message: 'Tour Program submitted for approval!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit Tour Program' });
    }
});

// Get my TP for a specific month/year
router.get('/tour-program/my', async (req, res) => {
    try {
        const { email, month, year } = req.query;
        if (!email || !month || !year) return res.status(400).json({ error: 'Missing params' });
        const tp = await XlTourProgram.findOne({ where: { employeeEmail: email, month, year } });
        res.json({ success: true, data: tp || null });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch Tour Program' });
    }
});

// ─── PHASE 2: DCR (DAILY CALL REPORT) ───────────────────────────────────────

// Submit a DCR
router.post('/dcr', async (req, res) => {
    try {
        const { employeeEmail, date, entityType, entityId, entityName } = req.body;
        if (!employeeEmail || !date || !entityType || !entityId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if rep has an APPROVED TP for this date
        const dateObj = new Date(date);
        const month = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const year = String(dateObj.getFullYear());
        const tp = await XlTourProgram.findOne({ where: { employeeEmail, month, year, status: 'Approved' } });
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
            const att = await XlAttendance.findOne({ where: { employeeEmail, date } });
            if (!att || !att.punchInTime) {
                return res.status(403).json({ error: 'You must punch in your Attendance for today before submitting a call report.' });
            }
        } else {
            // Past day -> MUST have an approved Backlog Request
            const backlog = await XlBacklogRequest.findOne({ where: { employeeEmail, date, status: 'Approved' } });
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
        const dcrs = await XlDCR.findAll({ where: { employeeEmail: email, date }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: dcrs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch DCRs' });
    }
});

// ─── PHASE 3: ATTENDANCE ─────────────────────────────────────────────────────

// Punch In
router.post('/attendance/punch-in', async (req, res) => {
    try {
        const { employeeEmail, date, punchInTime, punchInLat, punchInLng } = req.body;
        const existing = await XlAttendance.findOne({ where: { employeeEmail, date } });
        if (existing) return res.status(400).json({ error: 'Already punched in for today.' });
        
        const att = await XlAttendance.create({
            _id: generateId(),
            employeeEmail, date, punchInTime, punchInLat, punchInLng
        });
        res.json({ success: true, message: 'Punched In!', data: att });
    } catch (e) {
        res.status(500).json({ error: 'Failed to punch in' });
    }
});

// Punch Out
router.post('/attendance/punch-out', async (req, res) => {
    try {
        const { employeeEmail, date, punchOutTime, punchOutLat, punchOutLng } = req.body;
        const att = await XlAttendance.findOne({ where: { employeeEmail, date } });
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

// Get Attendance for date
router.get('/attendance/my', async (req, res) => {
    try {
        const { email, date } = req.query;
        const att = await XlAttendance.findOne({ where: { employeeEmail: email, date } });
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
        const leaves = await XlLeave.findAll({ where: { employeeEmail: req.query.email }, order: [['createdAt', 'DESC']] });
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
        const exps = await XlExpense.findAll({ where: { employeeEmail: req.query.email }, order: [['date', 'DESC']] });
        res.json({ success: true, data: exps });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// ─── PHASE 3: BACKLOG REQUEST ──────────────────────────────────────────────

router.post('/backlog', async (req, res) => {
    try {
        const { employeeEmail, date } = req.body;
        const existing = await XlBacklogRequest.findOne({ where: { employeeEmail, date } });
        if (existing) return res.status(400).json({ error: 'Backlog request already exists for this date.' });

        const reqs = await XlBacklogRequest.create({ _id: generateId(), ...req.body });
        res.json({ success: true, message: 'Backlog request submitted to Admin.', data: reqs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to request backlog' });
    }
});

router.get('/backlog/my', async (req, res) => {
    try {
        const reqs = await XlBacklogRequest.findAll({ where: { employeeEmail: req.query.email }, order: [['date', 'DESC']] });
        res.json({ success: true, data: reqs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch backlog requests' });
    }
});

// ─── PHASE 3: CALL PLAN ────────────────────────────────────────────────────

router.post('/call-plan', async (req, res) => {
    try {
        const { employeeEmail, date, doctors } = req.body;
        let plan = await XlCallPlan.findOne({ where: { employeeEmail, date } });
        if (plan) {
            await XlCallPlan.update({ doctors: JSON.stringify(doctors) }, { where: { _id: plan._id } });
        } else {
            plan = await XlCallPlan.create({ _id: generateId(), employeeEmail, date, doctors: JSON.stringify(doctors) });
        }
        res.json({ success: true, message: 'Call plan saved!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save call plan' });
    }
});

router.get('/call-plan/my', async (req, res) => {
    try {
        const { email, date } = req.query;
        const plan = await XlCallPlan.findOne({ where: { employeeEmail: email, date } });
        res.json({ success: true, data: plan });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch call plan' });
    }
});

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

        const perf = await XlPerformanceAnalysis.findOne({ where: { employeeEmail: email, month: monthStr, year: yearStr } });
        
        // If they have submitted their plan, no lockout
        if (perf && perf.planningSubmittedAt) {
            return res.json({ locked: false });
        }

        // Mid-month joiner check: if they have NO DCRs from ANY previous month, they are new, don't lock them
        // For simplicity, we just check if they have any DCR submitted prior to the 1st of this month
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const pastDcrs = await XlDCR.count({
            where: {
                employeeEmail: email,
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
        let perf = await XlPerformanceAnalysis.findOne({ where: { employeeEmail: email, month, year } });
        
        if (!perf) {
            perf = await XlPerformanceAnalysis.create({
                _id: generateId(),
                employeeEmail: email,
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
            brandData: JSON.stringify(brandData),
            roiData: JSON.stringify(roiData),
            accountData: JSON.stringify(accountData),
            keyCustomerData: JSON.stringify(keyCustomerData),
            outstandingData: JSON.stringify(outstandingData),
            planningSubmittedAt: new Date()
        }, { where: { _id: id } });

        res.json({ success: true, message: 'Monthly Planning submitted successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit planning' });
    }
});

// Update achieved targets for a specific week (or updating targets)
router.put('/performance/achieve', async (req, res) => {
    try {
        const { id, brandData, roiData, accountData, keyCustomerData, outstandingData } = req.body;
        
        await XlPerformanceAnalysis.update({
            brandData: JSON.stringify(brandData),
            roiData: JSON.stringify(roiData),
            accountData: JSON.stringify(accountData),
            keyCustomerData: JSON.stringify(keyCustomerData),
            outstandingData: JSON.stringify(outstandingData)
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
                employeeEmail: email,
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

// Approvals API
router.get('/approvals/pending', async (req, res) => {
    try {
        const { type, designation } = req.query;
        let reporteeEmails = null;
        if (designation !== 'ADMIN') {
            const reportees = await XlUser.findAll({ where: { reportingManager: designation } });
            reporteeEmails = reportees.map(u => u.email);
            if (reporteeEmails.length === 0) return res.json({ success: true, data: [] });
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
        else if (type === 'Routes') Model = XlRoute;
        else if (type === 'Samples') Model = XlSample;
        else if (type === 'Gifts') Model = XlGift;
        else if (type === 'Primary Sales') Model = XlPrimarySales;
        else if (type === 'Secondary Sales') Model = XlSecondarySales;
        else if (type === 'Geo Fencing') Model = XlGeoFencing;
        else return res.status(400).json({ error: 'Invalid module type' });
        const pending = await Model.findAll({ where: { ...(reporteeEmails ? { employeeEmail: reporteeEmails } : {}), status: ['Pending', 'Submitted'] }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: pending });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
});

router.post('/approvals/action', async (req, res) => {
    try {
        const { recordId, type, action, remarks } = req.body;
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
        else if (type === 'Routes') Model = XlRoute;
        else if (type === 'Samples') Model = XlSample;
        else if (type === 'Gifts') Model = XlGift;
        else if (type === 'Primary Sales') Model = XlPrimarySales;
        else if (type === 'Secondary Sales') Model = XlSecondarySales;
        else if (type === 'Geo Fencing') Model = XlGeoFencing;
        else return res.status(400).json({ error: 'Invalid module type' });
        const record = await Model.findByPk(recordId);
        if (!record) return res.status(404).json({ error: 'Record not found' });
        record.status = action;
        record.adminRemarks = remarks || '';
        await record.save();

        try {
            await XlNotification.create({
                employeeEmail: record.employeeEmail,
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
        const notifications = await XlNotification.findAll({ where: { employeeEmail: email }, order: [['createdAt', 'DESC']], limit: 50 });
        res.json({ success: true, data: notifications });
    } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/notifications/read', async (req, res) => {
    try {
        const { email } = req.body;
        await XlNotification.update({ isRead: true }, { where: { employeeEmail: email, isRead: false } });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Failed' }); }
});
module.exports = router;
