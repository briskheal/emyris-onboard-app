require('dotenv').config();
const { Applicant, syncDatabase } = require('./db');

async function runPatch() {
    console.log('🚀 Connecting to Database...');
    await syncDatabase();
    
    console.log('🔍 Scanning for legacy 20% Psychometric Records...');
    
    try {
        const applicants = await Applicant.find({ psychometricTestCompleted: true });
        let patchedCount = 0;

        for (const app of applicants) {
            let report = app.mindsetReport;
            if (typeof report === 'string') {
                try { report = JSON.parse(report); } catch(e) {}
            }

            if (report && report.overallPercentile === 20) {
                console.log(`⚠️ Found corrupted record: ${app.fullName || app.email}`);
                
                // Construct the clean NOT APPEARED report
                const traitPercentiles = {
                    'Clinical Integrity & Ethics': 0,
                    'Resilience & Grit Under Pressure': 0,
                    'Empathy & Relationship Building': 0,
                    'Autonomy & Self-Motivation': 0,
                    'Scientific Adaptability': 0,
                    'Collaborative Communication': 0
                };
                
                const mindsetReport = {
                    archetype: '❌ NOT APPEARED (No answers submitted)',
                    riskLevel: 'amber',
                    traitPercentiles,
                    overallPercentile: 0,
                    coachingTips: ['Candidate launched the exam but did not submit any answers. Retake required.']
                };

                // Update the applicant document
                await Applicant.updateOne({ _id: app._id }, {
                    $set: {
                        psychometricScores: traitPercentiles,
                        mindsetReport: mindsetReport
                    }
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
