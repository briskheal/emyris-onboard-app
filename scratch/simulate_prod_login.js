
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function setupTest() {
    console.log('🧪 Setting up production-grade test applicant...');
    const conn = await mongoose.createConnection(MONGODB_URI, { family: 4 }).asPromise();
    
    // Define minimal schema for testing
    const Applicant = conn.model('Applicant', new mongoose.Schema({
        email: String,
        pin: String,
        password: String,
        fullName: String,
        status: String,
        canLogin: Boolean
    }, { strict: false }));

    const testEmail = 'test_prod@emyris.com';
    const testPin = '999999';

    // Remove existing
    await Applicant.deleteMany({ email: testEmail });

    // Create fresh
    const newApp = new Applicant({
        email: testEmail,
        pin: testPin,
        fullName: 'Production Test User',
        status: 'submitted',
        canLogin: true,
        submittedAt: new Date()
    });

    await newApp.save();
    console.log('✅ Test applicant created: test_prod@emyris.com / 999999');
    
    // Simulate Login Logic
    console.log('\n🔍 Simulating Server-Side Login Logic...');
    const email = 'test_prod@emyris.com';
    const password = '999999';

    const applicants = await Applicant.find({ email: { $regex: `^${email}$`, $options: 'i' } });
    console.log(`Found ${applicants.length} matching email records.`);

    const applicant = applicants.find(a => {
        const dbPin = String(a.password || a.pin || "").trim();
        return a.email.toLowerCase() === email.toLowerCase() && dbPin === password;
    });

    if (applicant) {
        console.log('🎉 SIMULATION SUCCESS: Login matched!');
    } else {
        console.log('❌ SIMULATION FAILED: No match found.');
    }

    process.exit(0);
}

setupTest();
