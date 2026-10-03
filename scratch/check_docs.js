const { Applicant, sequelize } = require('../db');

setTimeout(async () => {
    // 1. Create a dummy applicant
    const email = 'test_adapter@test.com';
    await Applicant.deleteOne({ email });
    const app = new Applicant({ 
        email, 
        name: 'Test Adapter', 
        documents: [],
        fullName: 'Test User',
        phone: '1234567890',
        password: 'password123'
    });
    await app.save();

    // 2. $push a document
    console.log("Before push:", (await Applicant.findOne({ email })).documents);
    const newDoc = { docType: 'Degree', category: 'Degree', filename: `/api/admin/uploads/123.pdf` };
    await Applicant.updateOne({ email }, { $push: { documents: newDoc } });
    
    // 3. Check push result
    const afterPush = await Applicant.findOne({ email });
    console.log("After push:", afterPush.documents);

    // 4. Try filtering and $set
    const updatedDocs = afterPush.documents.filter(d => d.filename !== `/api/admin/uploads/123.pdf`);
    console.log("Filtered docs length:", updatedDocs.length);
    await Applicant.updateOne({ email }, { $set: { documents: updatedDocs } });

    // 5. Check delete result
    const afterDelete = await Applicant.findOne({ email });
    console.log("After delete:", afterDelete.documents);
    
    await Applicant.deleteOne({ email });
    process.exit();
}, 2000);
