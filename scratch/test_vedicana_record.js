require('dotenv').config();
const axios = require('axios');

async function testVedicanaRecord() {
    console.log("🔍 [TEST & DIAGNOSIS] Querying LIVE Hostycare Server for vedicana4u@gmail.com...\n");
    
    const auth = {
        username: process.env.ADMIN_USER || 'EMYRIS@BIOLIFE',
        password: process.env.ADMIN_PASS || 'Omrutam@1306'
    };

    const targetEmail = 'vedicana4u@gmail.com';

    try {
        // 1. Fetch Company Config
        const compRes = await axios.get('https://emyrishr.in/api/admin/company', { auth });
        const company = compRes.data ? compRes.data.company : null;
        console.log("=================== 1. LIVE COMPANY EXAM CONFIG ===================");
        if (company) {
            console.log(`Active Exam Product : ${company.activeExamProduct}`);
            console.log(`Active Exam Date    : ${company.activeExamDate}`);
            console.log(`MCQ Time            : ${company.examMcqTime || 15} minutes`);
            console.log(`Descriptive Time    : ${company.examDescriptiveTime || 15} minutes`);
            console.log(`MCQ Count           : ${company.examMcqCount || 5}`);
            console.log(`Rapid Test Time     : ${company.rapidTestTime || 25} minutes`);
        } else {
            console.log("Could not fetch company config.");
        }

        // 2. Fetch specific applicant record from live server
        console.log("\n=================== 2. LIVE APPLICANT RECORD (`vedicana4u@gmail.com`) ===================");
        const appRes = await axios.get(`https://emyrishr.in/api/admin/applicant/${encodeURIComponent(targetEmail)}`, { auth });
        if (!appRes.data || !appRes.data.success || !appRes.data.applicant) {
            console.log("Could not find record via /applicant/:email, querying full list...");
            const allRes = await axios.get('https://emyrishr.in/api/admin/applicants', { auth });
            if (allRes.data && Array.isArray(allRes.data.applicants)) {
                const found = allRes.data.applicants.find(a => a.email && a.email.toLowerCase() === targetEmail.toLowerCase());
                if (found) {
                    printApplicantDetails(found, company);
                } else {
                    console.log("Applicant `vedicana4u@gmail.com` not found in live applicants list.");
                }
            }
        } else {
            printApplicantDetails(appRes.data.applicant, company);
        }

        // 3. Fetch Exam Reports / Results for vedicana4u@gmail.com
        console.log("\n=================== 3. LIVE EXAM REPORTS & ATTEMPTS ===================");
        const reportsRes = await axios.get('https://emyrishr.in/api/admin/exam-reports', { auth });
        if (reportsRes.data && Array.isArray(reportsRes.data.reports)) {
            const myReports = reportsRes.data.reports.filter(r => r.email && r.email.toLowerCase() === targetEmail.toLowerCase());
            if (myReports.length === 0) {
                console.log("✅ No completed exam reports found on live server for `vedicana4u@gmail.com`.");
            } else {
                console.log(`Found ${myReports.length} exam report(s) on live server:`);
                myReports.forEach((rep, i) => {
                    console.log(`   [Attempt #${i+1}] Product: ${rep.testedProduct} | AutoScore (MCQ): ${rep.autoScore} | Status: ${rep.status} | SubmittedAt: ${rep.createdAt}`);
                });
            }
        } else {
            console.log("Could not fetch exam reports list or empty.");
        }

    } catch (err) {
        console.error("❌ Error running test on vedicana4u@gmail.com:", err.response ? `${err.response.status} - ${err.response.statusText}` : err.message);
    }
}

function printApplicantDetails(app, company) {
    let pending = [];
    try {
        pending = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
    } catch(e) { pending = []; }

    console.log(`Full Name           : ${app.fullName || app.name}`);
    console.log(`Email               : ${app.email}`);
    console.log(`Phone               : ${app.phone}`);
    console.log(`Status              : ${app.status} (Offer Letter / Onboarding Stage)`);
    console.log(`Division            : ${app.division || 'N/A'}`);
    console.log(`HQ                  : ${app.hq || 'N/A'}`);
    console.log(`Can Login           : ${app.canLogin}`);
    console.log(`Rapid Test Score    : ${app.rapidTestScore !== undefined ? app.rapidTestScore : 'Not Taken'}`);
    console.log(`Offer Letter Issued : ${app.offerLetterData ? 'Yes' : 'No'}`);
    console.log(`Offer Letter Accept : ${app.offerAccepted ? 'Yes' : 'No'}`);
    console.log(`Current Pending Ex. : ${pending.length} assessment(s) in queue`);
    if (pending.length > 0) {
        console.log(`Pending Queue Data  :`, JSON.stringify(pending, null, 2));
    } else {
        console.log(`Pending Queue Data  : [] (Empty Queue on live server right now)`);
    }

    // 4. Simulate our new universal sync on this exact record
    console.log("\n=================== 4. SIMULATION OF OUR NEW SYNC & CRON ON THIS RECORD ===================");
    if (company && company.activeExamProduct) {
        const productName = company.activeExamProduct;
        const examDate = company.activeExamDate;
        const alreadyQueued = pending.find(e => (e.targetProduct && e.targetProduct.toLowerCase() === productName.toLowerCase()));
        
        if (!alreadyQueued && app.status !== 'rejected') {
            const simulatedExam = {
                id: "SIMULATED_" + Date.now(),
                examDate: examDate,
                targetProduct: productName,
                mcqTime: company.examMcqTime || 12,
                descTime: company.examDescriptiveTime || 15,
                mcqCount: company.examMcqCount || 12,
                rapidTime: company.rapidTestTime || 15,
                assignedAt: new Date().toISOString()
            };
            const newPendingList = [...pending, simulatedExam];
            console.log(`[Pillar 1 Auto-Sync] Status is '${app.status}'. Retroactively adding '${productName}' to pendingExams.`);
            console.log(`[Resulting Queue]    Count: ${newPendingList.length} | Target: ${simulatedExam.targetProduct} (${simulatedExam.mcqCount} MCQs + Descriptive)`);
            
            console.log(`\n[Pillar 2 Cron Job]  Every 8 hours, 'vedicana4u@gmail.com' will receive this automated reminder:`);
            console.log(`   Subject: Reminder: Mandatory Assessment Pending (${productName})`);
            console.log(`   Body Summary: "Dear ${app.fullName}, whether your offer letter is pending, issued, or already accepted, completing your scheduled ${productName} Assessment is a mandatory requirement to confirm and finalize your onboarding workflow..."`);
            console.log(`   Action Button: [🚀 Launch Assessment Now] -> https://emyrishr.in/`);

            console.log(`\n[Pillar 3 Frontend]  When 'vedicana4u@gmail.com' logs into the portal:`);
            console.log(`   1. Welcome Card Alert: "⚠️ Mandatory Assessment Waiting: You have 1 mandatory test exam waiting (${productName}). [🔴 Take ${productName} Assessment Now]"`);
            console.log(`   2. Dashboard Top Card: "[MANDATORY TEST BLOCK] ${productName} Assessment Scheduled -> [🚀 Launch ${productName} Assessment (12 MCQs + Descriptive)]"`);
        } else if (alreadyQueued) {
            console.log(`[Pillar 1 Auto-Sync] '${productName}' is ALREADY queued in pendingExams.`);
        } else {
            console.log(`[Pillar 1 Auto-Sync] Record is rejected, skipped.`);
        }
    }
}

testVedicanaRecord();
