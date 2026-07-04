const { Company, Asset, syncDatabase } = require('./db');

async function testDelete() {
    await syncDatabase();
    
    // Create a dummy asset
    const asset = await Asset.create({
        category: 'logo',
        name: 'test.jpg',
        data: 'data:image/jpeg;base64,123'
    });
    const assetId = asset._id;
    console.log("Created dummy asset:", assetId);
    
    try {
        console.log("1. Running findByIdAndUpdate...");
        await Asset.findByIdAndUpdate(assetId, { active: false });
        console.log("2. Asset updated");
        
        console.log("3. Fetching company...");
        const company = await Company.findOne();
        if (company) {
            console.log("4. Company found:", company.name);
            const keys = ['activeLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'];
            
            // artificially set it
            company.activeLogoId = assetId;
            await company.save();
            console.log("4b. Company activeLogoId set to dummy asset");
            
            let changed = false;
            keys.forEach(k => {
                if (company[k] === assetId) {
                    company[k] = null;
                    changed = true;
                }
            });
            console.log("5. Changed status:", changed);
            if (changed) {
                console.log("6. Saving company...");
                await company.save();
                console.log("7. Company saved!");
            }
        }
        
        // Cleanup
        await Asset.findByIdAndDelete(assetId);
        console.log("ALL DONE!");
    } catch (err) {
        console.error("ERROR CAUGHT:", err);
    }
    process.exit(0);
}

testDelete();
