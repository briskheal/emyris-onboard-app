require('dotenv').config();
const { Applicant, syncDatabase } = require('./db');

async function runPatch() {
    console.log('🚀 Connecting to Database...');
    await syncDatabase();
    
    console.log('🔍 Scanning for legacy 20% Psychometric Records...');
    
    try {
        const applicants = await Applicant.find();
        let patchedCount = 0;

        for (const app of applicants) {
            let report = app.mindsetReport;
            if (typeof report === 'string') {
                try { report = JSON.parse(report); } catch(e) {}
            }

            if (report && (report.overallPercentile === 20 || report.overallPercentile === 0 || report.archetype.includes('NOT APPEARED'))) {
                console.log(`⚠️ Found corrupted record: ${app.fullName || app.email}`);
                
                // Update the applicant document to reset to Pending
                await Applicant.updateOne({ _id: app._id }, {
                    $set: { psychometricTestCompleted: false },
                    $unset: { psychometricScores: 1, mindsetReport: 1 }
                });

                console.log(`✅ Successfully patched: ${app.email}`);
                patchedCount++;
            }
        }

        console.log(`\n🎉 Patch Complete! Successfully fixed ${patchedCount} legacy records.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running patch:', error);
        process.exit(1);
    }
}

runPatch();
