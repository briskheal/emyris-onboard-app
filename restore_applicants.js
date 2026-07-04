const fs = require('fs');
const { Applicant, syncDatabase } = require('./db');

async function restoreApplicants() {
    try {
        await syncDatabase();
        console.log("Database synced.");
        
        // 1. Wipe existing applicants
        const res = await Applicant.deleteMany({});
        console.log("Deleted old applicants:", res.deletedCount);
        
        // 2. Read new backup
        const data = JSON.parse(fs.readFileSync('Emyris_Portal_Backup_2026-07-04.json', 'utf8'));
        const applicants = data.applicants || [];
        console.log(`Found ${applicants.length} applicants in backup.`);
        
        // 3. Insert each applicant
        let imported = 0;
        for (const app of applicants) {
            // Remove MongoDB internal fields
            delete app.__v;
            
            // Insert
            await Applicant.create(app);
            imported++;
        }
        
        console.log(`Successfully restored ${imported} applicants!`);
    } catch (e) {
        console.error("Error during restore:", e);
    }
    process.exit(0);
}

restoreApplicants();
