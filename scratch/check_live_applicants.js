require('dotenv').config();
const axios = require('axios');

async function checkLivePortal() {
    console.log("🔍 Querying LIVE Hostycare Server (https://emyrishr.in/api/admin/applicants)...");
    
    const auth = {
        username: process.env.ADMIN_USER || 'EMYRIS@BIOLIFE',
        password: process.env.ADMIN_PASS || 'Omrutam@1306'
    };

    try {
        // 1. Check Company Profile on Live Server
        const compRes = await axios.get('https://emyrishr.in/api/admin/company', { auth });
        console.log('\n=================== LIVE COMPANY EXAM CONFIG (Hostycare PostgreSQL) ===================');
        if (compRes.data && compRes.data.company) {
            const c = compRes.data.company;
            console.log(JSON.stringify({
                name: c.name,
                activeExamProduct: c.activeExamProduct,
                activeExamDate: c.activeExamDate,
                examMcqTime: c.examMcqTime,
                examDescriptiveTime: c.examDescriptiveTime,
                rapidTestTime: c.rapidTestTime
            }, null, 2));
        } else {
            console.log("Could not fetch company data or empty:", compRes.data);
        }

        // 2. Check Applicants on Live Server
        const appsRes = await axios.get('https://emyrishr.in/api/admin/applicants', { auth });
        if (appsRes.data && appsRes.data.success && Array.isArray(appsRes.data.applicants)) {
            const applicants = appsRes.data.applicants;
            console.log(`\n=================== TOTAL GENUINE APPLICANTS IN LIVE PORTAL: ${applicants.length} ===================`);
            applicants.forEach((app, idx) => {
                let pending = [];
                try {
                    pending = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
                } catch(e) { pending = []; }

                console.log(`\n[#${idx + 1}] Name: ${app.fullName || app.name} | Email: ${app.email} | Status: ${app.status} | Division: ${app.division || 'N/A'}`);
                console.log(`     CanLogin: ${app.canLogin} | Rapid Test Score: ${app.rapidTestScore !== undefined ? app.rapidTestScore : 'Not Taken'}`);
                console.log(`     Pending Exams Count: ${pending.length}`);
                if (pending.length > 0) {
                    console.log(`     Pending Exams Details:`, JSON.stringify(pending));
                }
            });
        } else {
            console.log("Unexpected response format for applicants:", appsRes.data);
        }

    } catch (err) {
        console.error("❌ Error contacting LIVE portal:", err.response ? `${err.response.status} - ${err.response.statusText}` : err.message);
    }
}

checkLivePortal();
