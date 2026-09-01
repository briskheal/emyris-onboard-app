require('dotenv').config();
const axios = require('axios');

async function checkOrphans() {
    console.log("🔍 [DIAGNOSTIC REPORT] Checking for orphaned records (ExamResults & Assets) on live server...\n");
    
    const auth = {
        username: process.env.ADMIN_USER || 'EMYRIS@BIOLIFE',
        password: process.env.ADMIN_PASS || 'Omrutam@1306'
    };

    try {
        // 1. Fetch all existing applicants
        const appsRes = await axios.get('https://emyrishr.in/api/admin/applicants', { auth });
        const applicants = (appsRes.data && Array.isArray(appsRes.data.applicants)) ? appsRes.data.applicants : [];
        const activeEmails = new Set(applicants.map(a => a.email ? a.email.toLowerCase().trim() : ''));
        console.log(`✅ Total Active Applicants in Database: ${applicants.length}`);

        // 2. Fetch all Exam Reports / Results
        const reportsRes = await axios.get('https://emyrishr.in/api/admin/exam-reports', { auth });
        const reports = (reportsRes.data && Array.isArray(reportsRes.data.reports)) ? reportsRes.data.reports : [];
        console.log(`✅ Total Exam Reports in Database: ${reports.length}`);

        let orphanReports = [];
        reports.forEach(r => {
            if (r.email && !activeEmails.has(r.email.toLowerCase().trim())) {
                orphanReports.push(r);
            }
        });

        console.log(`\n=================== ORPHAN EXAM RESULTS REPORT ===================`);
        if (orphanReports.length === 0) {
            console.log("No orphaned exam results found right now.");
        } else {
            console.log(`⚠️ Found ${orphanReports.length} ORPHANED exam result(s) belonging to deleted applicants:`);
            orphanReports.forEach(o => {
                console.log(`   [Orphan ID: ${o._id}] Email: ${o.email} | Product: ${o.testedProduct} | Score: ${o.autoScore} | CreatedAt: ${o.createdAt}`);
            });
        }

    } catch (err) {
        console.error("❌ Error checking live server:", err.response ? `${err.response.status} - ${err.response.statusText}` : err.message);
    }
}

checkOrphans();
