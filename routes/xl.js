const express = require('express');
const router = express.Router();

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

const { XlUser, XlDesignation, XlDoctor, XlChemist, XlStockist, XlCity, XlRoute, XlTourProgram, XlDCR, XlAttendance, XlLeave, XlLeaveType, XlAssignedLeave, XlLeaveTemplate, XlExpense, XlBacklogRequest, XlCallPlan, XlPerformanceAnalysis, XlNotification, XlSample, XlGift, XlPrimarySales, XlSecondarySales, XlGeoFencing, XlGlobalSettings, XlHoliday, XlProduct, XlHQ, XlDivision, generateId } = require('../db');
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

        // Fetch user designation level
        if (user.designation) {
            const desigRec = await XlDesignation.findOne({ where: { designationName: user.designation } });
            if (desigRec) userData.level = desigRec.level;
        }

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
        
        const { Op } = require('sequelize');
        const { XlUser } = require('../db');
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
        
        const { Op } = require('sequelize');
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArray = [email];
        if (user) {
            if (user.employeeId) idArray.push(user.employeeId);
            if (user.email) idArray.push(user.email);
            if (user.uid) idArray.push(user.uid);
        }
        
          const tps = await XlTourProgram.findAll({ where: { employeeId: { [Op.in]: idArray }, month, year } });
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
        let att = await XlAttendance.findOne({ where: { employeeId, date } });
        if (!att) {
            const backlog = await XlBacklogRequest.findOne({ where: { employeeId, date, status: 'Approved' } });
            if (backlog) {
                att = await XlAttendance.create({ _id: generateId(), employeeId, date, punchInTime: '00:00', punchOutTime: '23:59', daySubmitted: false });
            } else {
                return res.status(400).json({ error: 'No punch-in record found for today.' });
            }
        }
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
        const { XlLeave } = require('../db');
        let where = {};
        if (req.query.employeeId) where.employeeId = req.query.employeeId;
        const leaves = await XlLeave.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: leaves });
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

// Approvals API

// Get counts of pending approvals for all modules
router.get('/approvals/counts', async (req, res) => {
    try {
        const { designation } = req.query;
        let reporteeEmails = null;
        if (designation !== 'ADMIN') {
            const reportees = await XlUser.findAll({ where: { reportingManager: designation } });
            reporteeEmails = reportees.map(u => u.employeeId);
            if (reporteeEmails.length === 0) return res.json({ success: true, counts: {} });
        }

        const condition = designation === 'ADMIN' ? { status: ['Submitted', 'Pending', 'pending', 'submitted'] } : { status: ['Submitted', 'Pending', 'pending', 'submitted'], employeeId: { [Op.in]: reporteeEmails } };
        
        const counts = {};
        
        // Modules that support approvals
        // Group Call Reports by employeeId and date
        const callGroups = await XlDCR.findAll({
            where: condition,
            attributes: ['employeeId', 'date'],
            group: ['employeeId', 'date'],
            raw: true
        });
        counts['Call Report'] = callGroups.length;
        
        counts['Tour Program'] = await XlTourProgram.count({ where: condition });
        counts['Call Plans'] = await XlCallPlan.count({ where: condition });
        counts['Doctors'] = await XlDoctor.count({ where: condition });
        counts['Chemists'] = await XlChemist.count({ where: condition });
        counts['Stockists'] = await XlStockist.count({ where: condition });
        
        // Group Expenses by employeeId and date to match the UI behavior
        const expenseGroups = await XlExpense.findAll({
            where: condition,
            attributes: ['employeeId', 'date'],
            group: ['employeeId', 'date'],
            raw: true
        });
        counts['Expense'] = expenseGroups.length;

        counts['Leave Request'] = await XlLeave.count({ where: condition });
        counts['Primary Sales'] = await XlPrimarySales.count({ where: condition });
        counts['Secondary Sales'] = await XlSecondarySales.count({ where: condition });

        counts['Performance KPI'] = await XlPerformanceAnalysis.count({
            where: designation === 'ADMIN' 
                ? { planningSubmittedAt: { [Op.ne]: null } } 
                : { planningSubmittedAt: { [Op.ne]: null }, employeeId: { [Op.in]: reporteeEmails } }
        });
        
        res.json({ success: true, counts });
    } catch (e) {
        console.error('Approvals count error:', e);
        res.status(500).json({ error: 'Failed to fetch counts' });
    }
});

router.get('/approvals/pending', async (req, res) => {
    try {
        const { type, designation, status } = req.query;
        let reporteeEmails = null;
        if (designation !== 'ADMIN') {
            const reportees = await XlUser.findAll({ where: { reportingManager: designation } });
            reporteeEmails = reportees.map(u => u.employeeId);
            if (reporteeEmails.length === 0) return res.json({ success: true, data: [] });
        }

        if (type === 'Performance KPI') {
            const perfs = await XlPerformanceAnalysis.findAll({
                where: {
                    ...(reporteeEmails ? { employeeId: reporteeEmails } : {}),
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
        else if (type === 'Routes') Model = XlRoute;
        else if (type === 'Samples') Model = XlSample;
        else if (type === 'Gifts') Model = XlGift;
        else if (type === 'Primary Sales') Model = XlPrimarySales;
        else if (type === 'Secondary Sales') Model = XlSecondarySales;
        else if (type === 'Geo Fencing') Model = XlGeoFencing;
        else return res.status(400).json({ error: 'Invalid module type' });
        const pending = await Model.findAll({ 
            where: { 
                ...(reporteeEmails ? { employeeId: reporteeEmails } : {}), 
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
        
        for (const p of pending) {
            const pData = p.toJSON();
            if (type === 'Call Report') {
                if (status !== 'History') {
                    const isDaySubmitted = attendances.some(a => a.employeeId === pData.employeeId && a.date === pData.date);
                    if (!isDaySubmitted) continue;
                }
                pData.isBacklog = allBacklogs.some(b => b.employeeId === pData.employeeId && b.date === pData.date);
            }
            if (pData.employeeId) {
                const u = await XlUser.findOne({ where: { [Op.or]: [{ employeeId: pData.employeeId }, { uid: pData.employeeId }, { email: pData.employeeId }] } });
                if (u) {
                    pData.employeeName = pData.employeeName || ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.name;
                    pData.employeeEmail = pData.employeeEmail || u.email;
                    pData.designation = u.designation || '-';
                    pData.reportingManager = u.reportingManager || '-';
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
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch pending approvals' });
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
        else if (type === 'Routes') Model = XlRoute;
        else if (type === 'Samples') Model = XlSample;
        else if (type === 'Gifts') Model = XlGift;
        else if (type === 'Primary Sales') Model = XlPrimarySales;
        else if (type === 'Secondary Sales') Model = XlSecondarySales;
        else if (type === 'Geo Fencing') Model = XlGeoFencing;
        else if (type !== 'CallReportGroup' && type !== 'ExpenseGroup') return res.status(400).json({ error: 'Invalid module type' });
        
        if (type === 'CallReportGroup') {
            const { employeeId, date } = req.body;
            const records = await XlDCR.findAll({ where: { employeeId, date, status: ['Pending', 'Submitted'] } });
            
            for (const rec of records) {
                rec.status = action;
                if(action === 'Approved' && approvedBy) rec.approvedBy = approvedBy;
                rec.adminRemarks = remarks || rec.adminRemarks || '';
                await rec.save();
            }
            return res.json({ success: true, message: 'Successfully ' + action + ' call reports' });
        }
        
        if (type === 'ExpenseGroup') {
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
            
            entries = entries.map(e => {
                if (req.body.dates.includes(e.date)) {
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
        
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const _ld = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month.padStart(2, '0')}-${String(_ld).padStart(2, '0')}`;
        
        const plans = await XlCallPlan.findAll({
            where: {
                employeeId: email,
                date: { [Op.between]: [startDate, endDate] }
            },
            order: [['date', 'ASC']]
        });
        
        res.json({ success: true, data: plans });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch call plans' });
    }
});

router.post('/call-plan/bulk', async (req, res) => {
    try {
        const { employeeId, dates, doctors, chemists, stockists } = req.body;
        if (!employeeId || !dates || !Array.isArray(dates)) return res.status(400).json({ error: 'Invalid payload' });
        // --- STRICT TP DATE CHECK ---
        for (const date of dates) {
            const dObj = new Date(date);
            const tpMonth = dObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
            const tpYear = String(dObj.getFullYear());
            
            const approvedTp = await XlTourProgram.findOne({ where: { employeeId, month: tpMonth, year: tpYear, status: 'Approved' } });
            if (!approvedTp) {
                return res.json({ success: false, message: `You must have an Approved Tour Program for ${tpMonth} ${tpYear} before submitting Call Plans.` });
            }
            
            const tpEntries = JSON.parse(approvedTp.entries || '[]');
            const validTpDates = new Set(tpEntries.map(e => e.date));
            if (!validTpDates.has(date)) {
                return res.json({ success: false, message: `Cannot submit Call Plan for ${date} because it is not planned as a working day in your Approved Tour Program.` });
            }
        }
        // ----------------------------

        // --- HOLIDAY CHECK ---
        const user = await XlUser.findOne({ where: { employeeId } });
        if (user && user.state) {
            const holidays = await XlHoliday.findAll({
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
            const holidayDates = new Set(holidays.map(h => h.date));
            const invalidDates = dates.filter(d => holidayDates.has(d));
            if (invalidDates.length > 0) {
                return res.json({ success: false, message: 'Cannot submit Call Plan on a Holiday: ' + invalidDates.join(', ') });
            }
        }
        // -----------------------
        
        for (const date of dates) {
            let plan = await XlCallPlan.findOne({ where: { employeeId, date } });
            try {
                if (plan) {
                    plan.doctors = JSON.stringify(doctors || []);
                    plan.chemists = JSON.stringify(chemists || []);
                    plan.stockists = JSON.stringify(stockists || []);
                    plan.status = 'Submitted';
                    await plan.save();
                } else {
                    await XlCallPlan.create({
                        employeeId,
                        date,
                        doctors: JSON.stringify(doctors || []),
                        chemists: JSON.stringify(chemists || []),
                        stockists: JSON.stringify(stockists || []),
                        status: 'Submitted'
                    });
                }
            } catch (dbError) {
                return res.json({ success: false, message: 'Database Error: ' + dbError.message });
            }
        }
        
        // Notify manager of call plan update
        const mgrUser = await XlUser.findOne({ where: { employeeId } });
        if (mgrUser && mgrUser.reportingManager) {
            const managers = await XlUser.findAll({ where: { designation: mgrUser.reportingManager } });
            for (const m of managers) {
                await XlNotification.create({
                    _id: generateId(),
                    employeeId: m.employeeId,
                    title: 'Call Plan Updated',
                    message: `${user.firstName} ${user.lastName} has submitted their Call Plan.`
                });
        
        // Notify the submitter
        await XlNotification.create({
            _id: generateId(),
            employeeId,
            title: 'Call Plan Submitted',
            message: `You have successfully submitted your Call Plan. It has been sent to your manager.`
        });
            }
        }
        
        await XlNotification.create({
            _id: generateId(),
            employeeId: 'ADMIN',
            title: 'Call Plan Updated',
            message: `Call Plan submitted by ${user ? user.firstName : employeeId}.`
        });

        res.json({ success: true });
    } catch (e) {
        console.error('Call Plan Save Error:', e);
        require('fs').appendFileSync('cp_error.log', (e.original ? e.original.message : '') + '\n' + (e.stack || e.message) + '\n');
        res.status(500).json({ error: 'Failed to save call plan' });
    }
});

// GET Global Settings

router.get('/hq', async (req, res) => {
    try {
        const hqs = await XlHQ.findAll({ order: [['hqName', 'ASC']] });
        res.json({ success: true, data: hqs });
    } catch(e) {
        res.status(500).json({ success: false });
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
            
            const dcrs = await XlDCR.findAll({ where: { employeeId: user.employeeId || null, month, year } });

            let totalDoctorsMet = 0;
            let totalUniqueDoctors = new Set();
            dcrs.forEach(dcr => {
                if (dcr.doctorsData) {
                    try {
                        const docs = JSON.parse(dcr.doctorsData);
                        docs.forEach(doc => {
                            if (doc.uid) {
                                totalDoctorsMet++;
                                totalUniqueDoctors.add(doc.uid);
                            }
                        });
                    } catch(e) {}
                }
            });
            const uniqueDocsCount = totalUniqueDoctors.size;
            data = {
                totalDoctors: 1000, 
                totalDoctorsMet,
                totalUniqueDoctors: uniqueDocsCount,
                totalMissedDoctors: Math.max(0, 1000 - uniqueDocsCount),
                totalNonCore: Math.floor(uniqueDocsCount * 0.3),
                totalCore: Math.floor(uniqueDocsCount * 0.5),
                totalSuperCore: Math.floor(uniqueDocsCount * 0.2)
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
        const holidays = await XlHoliday.findAll({ order: [['date', 'ASC']] });
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
        const { XlAssignedLeave } = require('../db');
        const { year } = req.query;
        let where = {};
        if (year) where.year = year;
        const data = await XlAssignedLeave.findAll({ where });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/assigned-leaves/my', async (req, res) => {
    try {
        const { XlAssignedLeave } = require('../db');
        const { employeeId, year } = req.query;
        const data = await XlAssignedLeave.findAll({ where: { employeeId, year } });
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
router.post('/primary-sales/save', async (req, res) => {
    try {
        const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;
        
        const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });
        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();

        const newSale = await XlPrimarySales.create({
            employeeId: employeeId || 'ADMIN',
            date,
            invoiceDate,
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
            ...(status ? { status } : {}),
            status: 'Pending'
        });

        res.json({ success: true, message: 'Primary Sales invoice saved successfully!', data: newSale });
    } catch (error) {
        console.error('Error saving primary sales:', error);
        res.status(500).json({ success: false, message: 'Failed to save primary sales' });
    }
});


// Get all Primary Sales
router.get('/primary-sales/all', async (req, res) => {
    try {
        const { employeeId, designation, month, year } = req.query;
        let whereClause = {};
        
        if (month) whereClause.month = month;
        if (year) whereClause.year = year;
        
        // If not admin, they can only see their own HQ / division sales (or based on employeeId)
        // Since there is no explicit auth checking logic mapped out perfectly here, we can filter by employeeId if provided and not ADMIN
        if (designation !== 'ADMIN' && designation !== 'HO' && employeeId) {
            whereClause.employeeId = employeeId;
        }

        const sales = await XlPrimarySales.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
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
        const sale = await XlPrimarySales.findByPk(req.params.id);
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
        
        const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });
        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();

        const sale = await XlPrimarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        await sale.update({
            date,
            invoiceDate,
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
            productsData: JSON.stringify(productsData)
        });

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



router.get('/expense/limits', async (req, res) => {
    try {
        const { email, date } = req.query;
        if (!email || !date) return res.status(400).json({ error: 'Missing params' });
        
        const { XlUser, XlTourProgram, XlRoute, XlTravelAllowance, XlDesignation } = require('../db');
        const { Op } = require('sequelize');

        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const [year, monthNum, day] = date.split('-');
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthStr = monthNames[parseInt(monthNum, 10) - 1].toLowerCase();
        
        
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

        // Return ALL other users in the company (to support both upward and downward joint working)
        // The frontend already has a searchable dropdown, so they can easily find anyone they worked with.
        const allUsers = await XlUser.findAll();
        allUsers.forEach(u => {
            if (u.employeeId !== email) {
                coworkersMap.set(u.employeeId, u);
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

module.exports = router;






// ================= SECONDARY SALES =================


router.get('/secondary-sales/all', async (req, res) => {
    try {
        const { employeeId, designation, month, year } = req.query;
        let whereClause = {};
        
        if (month) whereClause.month = month;
        if (year) whereClause.year = year;
        
        if (designation !== 'ADMIN' && designation !== 'HO' && employeeId) {
            whereClause.employeeId = employeeId;
        }

        const sales = await XlSecondarySales.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/secondary-sales/:id', async (req, res) => {
    try {
        const sale = await XlSecondarySales.findByPk(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Not found' });
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
        const sale = await XlSecondarySales.findByPk(req.params.id);
        res.json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/secondary-sales/save', async (req, res) => {
    try {
        const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData } = req.body;
        
        const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });
        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();

        const sale = await XlSecondarySales.create({
            employeeId,
            date,
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            amount,
            productsData: typeof productsData === 'string' ? productsData : JSON.stringify(productsData)
        });
        res.json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/secondary-sales/update/:id', async (req, res) => {
    try {
        const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData } = req.body;
        const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });
        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();

        await XlSecondarySales.update({
            date,
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            amount,
            productsData: typeof productsData === 'string' ? productsData : JSON.stringify(productsData)
        }, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/secondary-sales/delete/:id', async (req, res) => {
    try {
        await XlSecondarySales.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/secondary-sales-data/opening-balance', async (req, res) => {
    try {
        const { stockist, prevMonth, prevYear, productId } = req.query;
        // Search previous month's secondary sales for this stockist
        const sales = await XlSecondarySales.findAll({
            where: { stockist, month: prevMonth, year: prevYear }
        });
        
        let openingQty = 0;
        
        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        if (r.productId === productId) {
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

        const sales = await XlPrimarySales.findAll({ where: { stockist, month, year } });

        const productMap = {}; // productId -> receivedQty

        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        if (!r.productId) return;
                        if (!productMap[r.productId]) productMap[r.productId] = 0;
                        productMap[r.productId] += (Number(r.quantity) || 0) + (Number(r.freeStocks) || 0);
                    });
                } catch(e) {}
            }
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const prevMonthIndex = months.indexOf(month) - 1;
        const prevMonth = prevMonthIndex >= 0 ? months[prevMonthIndex] : 'Dec';
        const prevYear = prevMonthIndex >= 0 ? year : String(Number(year) - 1);

        const prevSecSales = await XlSecondarySales.findAll({
            where: { stockist, month: prevMonth, year: prevYear }
        });

        const closingMap = {}; // productId -> closingQty
        prevSecSales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        if (r.productId && r.closingQty !== undefined) {
                            closingMap[r.productId] = Number(r.closingQty) || 0;
                        }
                    });
                } catch(e) {}
            }
        });

        const result = Object.keys(productMap).map(productId => {
            return {
                productId,
                receivedQty: productMap[productId],
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
        // Search this month's primary sales for this stockist
        const sales = await XlPrimarySales.findAll({
            where: { stockist, month, year }
        });
        
        let receivedQty = 0;
        
        sales.forEach(sale => {
            if (sale.productsData) {
                try {
                    const rows = JSON.parse(sale.productsData);
                    rows.forEach(r => {
                        if (r.productId === productId) {
                            // Sum up normal quantity (and free stocks if applicable, we will just sum quantity)
                            receivedQty += (Number(r.quantity) || 0) + (Number(r.freeStocks) || 0);
                            
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









